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

def check_docs_schema():
    print("--- Inspecting 'documents' table in Supabase ---")
    try:
        res = supabase.table("documents").select("*").limit(1).execute()
        if res.data:
            print("Columns found in 'documents' table:")
            print(list(res.data[0].keys()))
        else:
            print("No documents found in Supabase.")
    except Exception as e:
        print(f"Error fetching documents: {e}")

if __name__ == "__main__":
    check_docs_schema()
