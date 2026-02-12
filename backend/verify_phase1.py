from app import create_app, db
from models import User

def verify_setup():
    print("Verifying setup...")
    try:
        app = create_app()
        with app.app_context():
            db.create_all()
            print("Database tables created successfully.")
            # Check if we can create a user instance (mock)
            u = User(name="Test", email="test@example.com", password_hash="hash")
            print("User model instantiated successfully.")
    except Exception as e:
        print(f"Verification failed: {e}")

if __name__ == "__main__":
    verify_setup()
