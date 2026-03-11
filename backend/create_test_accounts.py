"""
IKMS Test Account Creator
Created to seed specific test accounts for UI/UX verification.
"""

from app import create_app, db
from models import User, UserRole, Institution
from auth import hash_password

app = create_app()

def seed_test_accounts():
    with app.app_context():
        # 1. Accounts to create
        accounts = [
            {
                "name": "System Administrator",
                "email": "admin@ikms.edu.et",
                "password": "password",
                "role": UserRole.SYS_ADMIN
            },
            {
                "name": "General Moderator",
                "email": "moderator@ikms.edu.et",
                "password": "password",
                "role": UserRole.MODERATOR
            }
        ]

        for acc in accounts:
            existing = User.query.filter_by(email=acc['email']).first()
            if existing:
                print(f"User already exists: {acc['email']} - Updating password.")
                existing.password_hash = hash_password(acc['password'])
                existing.role = acc['role']
            else:
                new_user = User(
                    name=acc['name'],
                    email=acc['email'],
                    password_hash=hash_password(acc['password']),
                    role=acc['role']
                )
                db.session.add(new_user)
                print(f"Created user: {acc['email']}")
        
        db.session.commit()
        print("Seeding of test accounts complete.")

if __name__ == "__main__":
    seed_test_accounts()
