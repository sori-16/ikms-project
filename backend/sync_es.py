import os
from dotenv import load_dotenv
load_dotenv()
from elasticsearch import Elasticsearch
from app import create_app
from models import db, Document, DocumentStatus
from datetime import datetime
from utils import extract_text_from_pdf, clean_text
from ml_engine import extract_keywords, assign_topics

def sync_all_to_es():
    print("Connecting to Elasticsearch...")
    es_host = os.environ.get('ES_HOST', 'http://localhost:9200')
    es_user = os.environ.get('ES_USER', 'elastic')
    es_pass = os.environ.get('ES_PASSWORD', 'changeme')
    
    es = Elasticsearch(
        es_host,
        basic_auth=(es_user, es_pass),
        verify_certs=False
    )
    
    if not es.ping():
        print("ERROR: Could not connect to Elasticsearch.")
        return

    print("Success: Connected to Elasticsearch.")
    
    app = create_app()
    with app.app_context():
        # Fetch all approved documents from DB
        docs = Document.query.filter_by(status=DocumentStatus.APPROVED).all()
        print(f"Found {len(docs)} approved documents to index.")
        
        from supabase_client import supabase
        from app import sync_authors_to_doc
        STORAGE_BUCKET = 'research-papers'
        INDEX_NAME = 'research_papers'
        
        # Create index if it doesn't exist
        if not es.indices.exists(index=INDEX_NAME):
            print(f"Creating index: {INDEX_NAME}")
            es.indices.create(index=INDEX_NAME)
            
        for doc in docs:
            print(f"--- Indexing ID {doc.id}: {doc.title} ---")
            try:
                filename = os.path.basename(doc.file_path)
                # Possible paths (local lookup)
                local_uploads = os.path.join("backend", "uploads") if os.path.exists("backend") else "uploads"
                found_path = os.path.join(local_uploads, filename)
                
                # If not found locally, try to repair from Supabase
                if not os.path.exists(found_path):
                    print(f"  🔍 File missing locally. Attempting to download from cloud: {doc.file_path}")
                    try:
                        os.makedirs(local_uploads, exist_ok=True)
                        with open(found_path, 'wb') as f:
                            res = supabase.storage.from_(STORAGE_BUCKET).download(doc.file_path)
                            f.write(res)
                        print(f"  ✅ Downloaded {filename} to local uploads.")
                    except Exception as dl_err:
                        print(f"  ❌ Cloud download failed: {dl_err}")
                        found_path = None
                
                doc_body = {}
                if found_path and os.path.exists(found_path):
                    print(f"  ⚙️ Processing smart metadata for: {filename}")
                    from utils import process_document_full, clean_text
                    doc_full = process_document_full(found_path)
                    cleaned_text = clean_text(doc_full['raw_text'])
                    
                    # Update local SQLite DB
                    doc.abstract = doc_full['abstract']
                    doc.title = doc_full['title']
                    if doc_full.get('year'):
                        doc.publication_date = datetime(doc_full['year'], 1, 1)
                    db.session.commit()
                    
                    # ✅ KEY FIX: Push repaired metadata to Supabase Cloud
                    # (The UI reads from Supabase, not local SQLite!)
                    cloud_update = {
                        "title": doc_full['title'],
                        "abstract": doc_full['abstract'],
                        "author_names": ', '.join(doc_full['authors']) if doc_full.get('authors') else ""
                    }
                    if doc_full.get('year'):
                        cloud_update["publication_date"] = f"{doc_full['year']}-01-01"
                    try:
                        supabase.table("documents").update(cloud_update).eq("id", doc.id).execute()
                        print(f"  CLOUD: Supabase Cloud updated for ID {doc.id}")
                    except Exception as cloud_err:
                        print(f"  WARNING: Supabase update failed for ID {doc.id}: {cloud_err}")
                    
                    # Sync authors to local DB
                    if doc_full['authors']:
                        print(f"  LOG: Syncing authors: {', '.join(doc_full['authors'])}")
                        sync_authors_to_doc(doc.id, doc_full['authors'])
                        
                        # Also push authors to Supabase Cloud
                        for author_name in doc_full['authors']:
                            try:
                                # Check if author exists in cloud
                                existing = supabase.table("authors").select("id").eq("name", author_name).execute()
                                if existing.data:
                                    cloud_author_id = existing.data[0]['id']
                                else:
                                    # Create author in cloud
                                    new_author = supabase.table("authors").insert({"name": author_name}).execute()
                                    cloud_author_id = new_author.data[0]['id'] if new_author.data else None
                                
                                # Link author to document in cloud
                                if cloud_author_id:
                                    try:
                                        supabase.table("document_authors").insert({
                                            "document_id": doc.id,
                                            "author_id": cloud_author_id
                                        }).execute()
                                    except Exception:
                                        pass # Link may already exist - ignore duplicate
                            except Exception as author_err:
                                print(f"  ⚠️ Cloud author sync failed for '{author_name}': {author_err}")
                    
                    doc_body = {
                        "title": doc_full['title'],
                        "abstract": doc_full['abstract'],
                        "full_text": cleaned_text[:50000] if cleaned_text else "",
                        "keywords": extract_keywords(cleaned_text[:500000]),
                        "topics": assign_topics(cleaned_text[:500000]),
                        "upload_date": doc.upload_date.isoformat() if doc.upload_date else datetime.utcnow().isoformat(),
                        "institution_id": doc.institution_id,
                        "is_institutional": doc.is_institutional,
                        "year": doc_full['year'],
                        "authors": doc_full['authors']
                    }
                    print(f"  SUCCESS: Repaired & Indexed: {doc_full['title']}")
                else:
                    print(f"  ⚠️ Warning: No PDF source available for ID {doc.id}. Using existing DB metadata.")
                    # Fallback to what we have in DB
                    doc_body = {
                        "title": doc.title,
                        "abstract": doc.abstract,
                        "full_text": doc.abstract, # Limited fallback
                        "keywords": [],
                        "topics": [],
                        "upload_date": doc.upload_date.isoformat() if doc.upload_date else datetime.utcnow().isoformat(),
                        "institution_id": doc.institution_id,
                        "is_institutional": doc.is_institutional,
                        "year": doc.publication_date.year if doc.publication_date else (doc.upload_date.year if doc.upload_date else 2026),
                        "authors": [a.name for a in doc.authors] if doc.authors else []
                    }
                    print(f"  Indexed existing metadata for: {doc.title}")
                
                es.index(index=INDEX_NAME, id=str(doc.id), document=doc_body)
                
            except Exception as e:
                db.session.rollback()
                print(f"  ERROR: Error indexing/repairing {doc.title}: {e}")

    print("Done! All documents synchronized to Elasticsearch.")

if __name__ == "__main__":
    import sys
    if sys.platform == "win32":
        # Force UTF-8 for Windows terminal to avoid UnicodeEncodeErrors with special characters
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sync_all_to_es()
