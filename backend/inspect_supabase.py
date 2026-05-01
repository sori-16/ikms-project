"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

load_dotenv()

url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_KEY')
supabase: Client = create_client(url, key)

def check_schema():
    print("--- Inspecting 'users' table in Supabase ---")
    try:
        # Try to get one user
        res = supabase.table("users").select("*").limit(1).execute()
        print("Sample data from 'users' table:")
        print(json.dumps(res.data, indent=2))
        
        # Check if there's any user with a specific email
        # (Using a known email from previous logs if possible)
    except Exception as e:
        print(f"Error fetching users: {e}")

if __name__ == "__main__":
    check_schema()
