"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_KEY')

if not url or not key:
    print("WARNING: Supabase credentials missing in .env")

supabase: Client = create_client(url, key)
