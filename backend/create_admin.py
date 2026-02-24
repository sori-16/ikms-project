"""
IKMS Admin Account Creator
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION

This script creates a temporary Institutional Admin account 
linked to Jimma University for testing purposes.
"""

from app import create_app, db
from models import User, UserRole, Institution
from auth import hash_password

app = create_app()

def create_admin():
    with app.app_context():
        # 1. Get Jimma University
        ju = Institution.query.filter_by(name="Jimma University (JU-CBMP)").first()
        if not ju:
            print("Error: Jimma University not found. Please run seed_thesis.py first.")
            return

        # 2. Check if admin already exists
        email = "admin@ju.edu.et"
        existing = User.query.filter_by(email=email).first()
        if existing:
            print(f"Admin already exists: {email}")
            return

        # 3. Create Admin User
        admin = User(
            name="JU Institutional Admin",
            email=email,
            password_hash=hash_password("admin123"),
            role=UserRole.INST_ADMIN,
            institution_id=ju.id
        )
        
        db.session.add(admin)
        db.session.commit()
        
        print(f"Successfully created Institutional Admin account!")
        print(f"Email: {email}")
        print(f"Password: admin123")
        print(f"Institution: {ju.name}")

if __name__ == "__main__":
    create_admin()
