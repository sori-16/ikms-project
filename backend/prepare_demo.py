import os
import requests
from datetime import datetime
from app import create_app
from models import db, User, Institution, Document, Author, document_authors, UserRole, DocumentStatus, InstitutionalStatus
from supabase_client import supabase
from dotenv import load_dotenv

load_dotenv()

def parse_iso_date(date_str):
    if not date_str:
        return None
    try:
        # Handle formats like '2026-03-14T11:20:58.475078+00:00'
        # datetime.fromisoformat in Python 3.11+ handles the +00:00 well
        # but we replace 'Z' with '+00:00' just in case
        clean_date = date_str.replace('Z', '+00:00')
        dt = datetime.fromisoformat(clean_date)
        # SQLite often prefers naive datetimes unless configured otherwise
        return dt.replace(tzinfo=None)
    except Exception as e:
        print(f"Warning: Could not parse date '{date_str}': {e}")
        return None

def sync_data():
    app = create_app()
    with app.app_context():
        print("--- Clearing Local Database ---")
        db.drop_all()
        db.create_all()

        print("--- Syncing Institutions ---")
        inst_res = supabase.table("institutions").select("*").execute()
        for item in inst_res.data:
            inst = Institution(
                id=item['id'],
                name=item['name'],
                description=item.get('description'),
                location=item.get('location'),
                website=item.get('website'),
                logo_path=item.get('logo_path')
            )
            db.session.merge(inst)
        db.session.commit()
        print(f"Synced {len(inst_res.data)} institutions.")

        print("--- Syncing Users ---")
        user_res = supabase.table("users").select("*").execute()
        for item in user_res.data:
            role_val = item.get('role', 'researcher').lower()
            user = User(
                id=item['id'],
                email=item['email'],
                name=item.get('name'),
                role=UserRole(role_val) if role_val in [r.value for r in UserRole] else UserRole.RESEARCHER,
                institution_id=item.get('institution_id'),
                is_verified=item.get('is_verified', False),
                occupation=item.get('occupation'),
                photo_url=item.get('photo_url'),
                research_interests=item.get('research_interests'),
                date_of_birth=parse_iso_date(item.get('date_of_birth'))
            )
            db.session.merge(user)
        db.session.commit()
        print(f"Synced {len(user_res.data)} users.")

        print("--- Syncing Documents & Downloading PDFs ---")
        doc_res = supabase.table("documents").select("*").execute()
        upload_dir = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)

        for item in doc_res.data:
            status_val = item.get('status', 'pending').lower()
            inst_status_val = item.get('institutional_status', 'pending').lower()
            doc = Document(
                id=item['id'],
                title=item['title'],
                abstract=item.get('abstract'),
                uploader_id=item['uploader_id'],
                institution_id=item.get('institution_id'),
                status=DocumentStatus(status_val) if status_val in [s.value for s in DocumentStatus] else DocumentStatus.PENDING,
                institutional_status=InstitutionalStatus(inst_status_val) if inst_status_val in [s.value for s in InstitutionalStatus] else InstitutionalStatus.PENDING,
                file_path=item.get('file_path'),
                upload_date=parse_iso_date(item.get('upload_date')),
                is_external_match=item.get('is_external_match', False)
            )
            db.session.merge(doc)
            
            # Attempt to download PDF for offline viewing
            if doc.file_path:
                try:
                    # In local mode, we'll map file_path to static/uploads/filename
                    local_filename = os.path.basename(doc.file_path)
                    local_path = os.path.join(upload_dir, local_filename)
                    
                    if not os.path.exists(local_path):
                        print(f"Downloading: {doc.title}")
                        url = supabase.storage.from_('research-papers').get_public_url(doc.file_path)
                        r = requests.get(url)
                        if r.status_code == 200:
                            with open(local_path, 'wb') as f:
                                f.write(r.content)
                except Exception as e:
                    print(f"Failed to download {doc.file_path}: {e}")

        db.session.commit()
        print(f"Synced {len(doc_res.data)} documents.")
        print("\n✅ Preparation Complete! You can now run the app in OFFLINE_MODE.")

if __name__ == "__main__":
    sync_data()
