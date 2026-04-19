"""
IKMS Database Clear Tool
Safely resets the local and cloud databases to a blank state.
"""
import os
import requests
from sqlalchemy import create_engine, MetaData, delete
from dotenv import load_dotenv

load_dotenv()

TABLES = [
    "download_logs", "search_alerts", "moderation_logs", "author_claims",
    "engagements", "topic_scores", "document_authors", "documents",
    "authors", "institutions", "saved_searches", "users"
]

def clear_local():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url or "sqlite" not in db_url:
        print("ℹ️  Local SQLite database not configured or using different engine.")
        return

    print(f"🧹 Clearing local database...")
    try:
        engine = create_engine(db_url)
        metadata = MetaData()
        metadata.reflect(bind=engine)
        with engine.begin() as conn:
            for table in reversed(TABLES):
                if table in metadata.tables:
                    conn.execute(delete(metadata.tables[table]))
        print("✅ Local database cleared.")
    except Exception as e:
        print(f"❌ Error clearing local DB: {e}")

def clear_cloud():
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_KEY')
    if not url or not key: return

    print(f"🧹 Clearing cloud database (Supabase REST API)...")
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    
    # In REST API, we delete by filtering for all IDs > 0
    for table in TABLES:
        try:
            res = requests.delete(f"{url}/rest/v1/{table}?id=gt.0", headers=headers)
            if res.status_code in [200, 204]:
                print(f"✅ Cleared {table}")
            else:
                print(f"⚠️  Could not clear {table}: {res.status_code}")
        except Exception as e:
            print(f"❌ Error clearing {table}: {e}")

if __name__ == "__main__":
    confirm = input("⚠️  WARNING: This will delete ALL data in your databases. Type 'YES' to confirm: ")
    if confirm == "YES":
        clear_local()
        clear_cloud()
        print("\n✨ Databases are now empty.")
    else:
        print("❌ Clear cancelled.")
