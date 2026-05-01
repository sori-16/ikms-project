"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
import sqlite3
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Headers for Supabase REST API
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def migrate_table(table_name, sqlite_conn):
    print(f"📦 Migrating table: {table_name}...")
    cursor = sqlite_conn.cursor()
    
    # Get all records from local SQLite
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    
    if not rows:
        print(f"⚠️ Table {table_name} is empty. Skipping.")
        return

    # Get column names
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [col[1] for col in cursor.fetchall()]
    
    # Convert rows to list of dicts
    payload = []
    for row in rows:
        record = {}
        for i, val in enumerate(row):
            # Convert datetime strings if necessary (Supabase handles ISO)
            record[columns[i]] = val
        payload.append(record)

    # Post to Supabase REST API
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    response = requests.post(url, headers=HEADERS, json=payload)
    
    if response.status_code in [201, 204]:
        print(f"✅ Successfully migrated {len(payload)} records to {table_name}.")
    else:
        print(f"❌ Failed to migrate {table_name}: {response.text}")

def run_migration():
    if not os.path.exists("app.db"):
        print("❌ Error: app.db not found. Please run seed_local.py first.")
        return

    conn = sqlite3.connect("app.db")
    
    # Migration Order (Dependencies first)
    tables = [
        "institutions",
        "users",
        "authors",
        "documents",
        "document_authors",
        "topic_scores",
        "saved_searches",
        "institution_memberships"
    ]
    
    for table in tables:
        migrate_table(table, conn)
        
    conn.close()
    print("\n🚀 CLOUD MIGRATION COMPLETE!")

if __name__ == "__main__":
    run_migration()
