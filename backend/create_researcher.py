"""
IKMS Researcher Account Creator
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION

This script creates a temporary Researcher account 
linked to Jimma University for testing purposes.
"""

from app import create_app, db
from models import User, UserRole, Institution, Author
from auth import hash_password

app = create_app()

def create_researcher():
    with app.app_context():
        # 1. Get Jimma University
        ju = Institution.query.filter_by(name="Jimma University (JU-CBMP)").first()
        if not ju:
            print("Error: Jimma University not found. Please run seed_thesis.py first.")
            return

        # 2. Check if researcher already exists
        email = "soreti@ju.edu.et"
        existing = User.query.filter_by(email=email).first()
        if existing:
            print(f"Researcher already exists: {email}")
            return

        # 3. Create Researcher User
        researcher = User(
            name="Soreti (Team Leader)",
            email=email,
            password_hash=hash_password("soreti123"),
            role=UserRole.RESEARCHER,
            institution_id=ju.id
        )
        db.session.add(researcher)
        db.session.flush() # Get ID
        
        # 4. Create and Link Author Profile
        author = Author(
            name="Soreti",
            email=email,
            affiliation_id=ju.id,
            user_id=researcher.id
        )
        db.session.add(author)
        db.session.commit()
        
        print(f"Successfully created Researcher account!")
        print(f"Email: {email}")
        print(f"Password: soreti123")
        print(f"Role: {UserRole.RESEARCHER.value}")
        print(f"Institution: {ju.name}")

if __name__ == "__main__":
    create_researcher()
