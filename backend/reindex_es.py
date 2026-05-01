"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
import os
import json
from app import create_app, db, Document, INDEX_NAME, es
from utils import extract_text_from_pdf, clean_text
from ml_engine import extract_keywords, assign_topics
from datetime import datetime

def reindex_all(app):
    print("--- Re-indexing all approved documents to Elasticsearch ---")
    import app as app_mod
    es_client = app_mod.es
    if not es_client or not es_client.ping():
        print("Error: Elasticsearch is not available.")
        return

    # Delete index to start fresh (optional, but ensures clean state)
    # es.indices.delete(index=INDEX_NAME, ignore=[400, 404])
    
    docs = Document.query.filter_by(status='approved').all()
    print(f"Found {len(docs)} approved documents.")

    for doc in docs:
        try:
            print(f"Processing ID {doc.id}: {doc.title}")
            
            # Extract text if possible for better search
            raw_text = ""
            if doc.file_path:
                try:
                    # Check if file exists locally or in uploads
                    path = doc.file_path
                    if not os.path.isabs(path):
                        path = os.path.join('static', 'uploads', os.path.basename(doc.file_path))
                    
                    if os.path.exists(path):
                        raw_text = extract_text_from_pdf(path)
                    else:
                        print(f"  Warning: File not found at {path}")
                except Exception as e:
                    print(f"  Error reading file: {e}")

            cleaned = clean_text(raw_text)
            keywords = extract_keywords(cleaned[:10000]) if cleaned else []
            topics = assign_topics(cleaned[:10000]) if cleaned else []
            
            author_list = [a.strip() for a in doc.author_names.split(',')] if doc.author_names else []

            es_client.index(index=INDEX_NAME, id=str(doc.id), document={
                "title": doc.title,
                "abstract": doc.abstract or "",
                "full_text": cleaned[:50000] if cleaned else "",
                "keywords": keywords,
                "topics": topics,
                "institution_id": doc.institution_id,
                "institution_name": doc.institution.name if doc.institution else "Unknown",
                "authors": author_list,
                "upload_date": doc.upload_date.isoformat() if doc.upload_date else datetime.utcnow().isoformat(),
                "status": "approved"
            })
            print(f"  Indexed successfully.")
        except Exception as e:
            print(f"  Failed to index doc {doc.id}: {e}")

    print("--- Re-indexing complete ---")

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        reindex_all(app)
