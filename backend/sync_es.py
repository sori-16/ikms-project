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
        
        INDEX_NAME = 'research_papers'
        
        # Create index if it doesn't exist
        if not es.indices.exists(index=INDEX_NAME):
            print(f"Creating index: {INDEX_NAME}")
            es.indices.create(index=INDEX_NAME)
            
        for doc in docs:
            print(f"Indexing: {doc.title} (ID: {doc.id})")
            try:
                # Re-extract text if necessary or use what we have
                # For this script, we'll re-extract to be sure it's fresh
                if os.path.exists(doc.file_path):
                    raw_text = extract_text_from_pdf(doc.file_path)
                    cleaned_text = clean_text(raw_text)
                    keywords = extract_keywords(cleaned_text[:500000])
                    topics = assign_topics(cleaned_text[:500000])
                    
                    doc_body = {
                        "title": doc.title,
                        "abstract": doc.abstract or (raw_text[:500] if raw_text else ""),
                        "full_text": cleaned_text,
                        "keywords": keywords,
                        "topics": topics,
                        "upload_date": doc.upload_date.isoformat() if doc.upload_date else datetime.utcnow().isoformat(),
                        "institution_id": doc.institution_id,
                        "is_institutional": doc.is_institutional
                    }
                    
                    es.index(index=INDEX_NAME, id=str(doc.id), document=doc_body)
                    print(f"✅ Indexed {doc.title}")
                else:
                    print(f"⚠️ Skip: File not found at {doc.file_path}")
            except Exception as e:
                print(f"❌ Error indexing {doc.title}: {e}")

    print("Done! All documents synchronized to Elasticsearch.")

if __name__ == "__main__":
    sync_all_to_es()
