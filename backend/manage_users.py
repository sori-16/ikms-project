"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
"""
IKMS User Management CLI
Allows creating and managing administrative and researcher accounts.
"""
import argparse
from app import create_app, db
from models import User, UserRole, Institution, Author
from auth import hash_password

app = create_app()

def get_ju():
    """Helper to get Jimma University."""
    return Institution.query.filter_by(name="Jimma University (JU-CBMP)").first()

def create_user(name, email, password, role_str, inst_name=None):
    with app.app_context():
        role_map = {
            'sys_admin': UserRole.SYS_ADMIN,
            'moderator': UserRole.MODERATOR,
            'inst_admin': UserRole.INST_ADMIN,
            'researcher': UserRole.RESEARCHER
        }
        role = role_map.get(role_str.lower())
        if not role:
            print(f"❌ Error: Invalid role '{role_str}'")
            return

        existing = User.query.filter_by(email=email).first()
        if existing:
            print(f"ℹ️  User {email} already exists. Updating password/role.")
            existing.password_hash = hash_password(password)
            existing.role = role
        else:
            inst = None
            if inst_name:
                inst = Institution.query.filter_by(name=inst_name).first()
            
            new_user = User(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role=role,
                institution_id=inst.id if inst else None
            )
            db.session.add(new_user)
            db.session.flush()

            if role == UserRole.RESEARCHER:
                author = Author(
                    name=name,
                    email=email,
                    affiliation_id=inst.id if inst else None,
                    user_id=new_user.id
                )
                db.session.add(author)
                print(f"✅ Created Researcher & Linked Author Profile: {email}")
            else:
                print(f"✅ Created {role_str.upper()}: {email}")

        db.session.commit()

def main():
    parser = argparse.ArgumentParser(description="IKMS User Management")
    parser.add_argument("--name", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--role", choices=['sys_admin', 'moderator', 'inst_admin', 'researcher'], required=True)
    parser.add_argument("--institution", help="Institution name (required for researchers and inst_admins)")

    args = parser.parse_args()
    create_user(args.name, args.email, args.password, args.role, args.institution)

if __name__ == "__main__":
    main()
