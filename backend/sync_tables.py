"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
import os
from app import app, db
from models import *

with app.app_context():
    try:
        db.create_all()
        print("Database tables synced successfully")
    except Exception as e:
        print(f"Error syncing tables: {e}")
