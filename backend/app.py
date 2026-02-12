import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from models import db, Document, Institution, Author
from utils import extract_text_from_pdf, clean_text
from ml_engine import extract_keywords, assign_topics
from elasticsearch import Elasticsearch

# Configure Elasticsearch
es = Elasticsearch(
    os.environ.get('ES_HOST', 'http://localhost:9200'),
    basic_auth=(os.environ.get('ES_USER', 'elastic'), os.environ.get('ES_PASSWORD', 'changeme'))
)
INDEX_NAME = 'research_papers'

def create_app():
    app = Flask(__name__)
    CORS(app) # Enable CORS for all routes
    
    # Database Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///ikms.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    db.init_app(app)
    
    @app.route('/')
    def index():
        return "IKMS Backend is running!"

    @app.route('/upload', methods=['POST'])
    def upload_file():
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        if file and file.filename.lower().endswith('.pdf'):
            # 1. Save File
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            try:
                # 2. Extract Text
                raw_text = extract_text_from_pdf(filepath)
                
                # 3. Preprocessing
                cleaned_text = clean_text(raw_text)
                
                # 4. ML Processing
                keywords = extract_keywords(cleaned_text)
                topics = assign_topics(cleaned_text)
                
                # 5. Save to Postgres
                # Check for existing institution (mocking ID 1 or creating new if passed)
                # For Phase 2, we'll just link to a dummy institution or None
                
                new_doc = Document(
                    title=filename, # Using filename as title for now
                    abstract=raw_text[:500] if raw_text else "",
                    file_path=filepath,
                    institution_id=None # To be refined in later phases
                )
                db.session.add(new_doc)
                db.session.commit()
                
                # 6. Index to Elasticsearch
                doc_body = {
                    "title": filename,
                    "abstract": raw_text[:500] if raw_text else "",
                    "full_text": cleaned_text,
                    "keywords": keywords,
                    "topics": topics,
                    "upload_date": new_doc.upload_date.isoformat()
                }
                
                if es.ping():
                    es.index(index=INDEX_NAME, document=doc_body)
                else:
                    print("Warning: Elasticsearch not reachable. Indexing skipped.")
                
                return jsonify({
                    "message": "File processed successfully",
                    "document_id": new_doc.id,
                    "keywords": keywords,
                    "topics": topics
                }), 201
                
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        
        return jsonify({"error": "Invalid file type. Only PDF allowed."}), 400

    @app.route('/search', methods=['GET'])
    def search_documents():
        query = request.args.get('q', '')
        if not query:
            return jsonify([])

        results = []
        
        # 1. Try Elasticsearch
        if es.ping():
            try:
                es_body = {
                    "query": {
                        "multi_match": {
                            "query": query,
                            "fields": ["title", "abstract", "full_text", "keywords", "topics"]
                        }
                    }
                }
                res = es.search(index=INDEX_NAME, body=es_body)
                hits = res['hits']['hits']
                # Map back to DB objects or return direct ES fields
                # For simplicity, returning ES fields mixed with DB IDs if possible
                # But here we just return the hits
                results = [{
                    "source": "elasticsearch",
                    "score": hit['_score'],
                    "title": hit['_source']['title'],
                    "abstract": hit['_source']['abstract'],
                    "keywords": hit['_source'].get('keywords', [])
                } for hit in hits]
                return jsonify(results)
            except Exception as e:
                print(f"ES Search failed: {e}. Falling back to DB.")
        
    # 2. Fallback to Database (Simple LIKE match)
        print("Using Database Fallback Search")
        from sqlalchemy import or_
        # Search title matches OR abstract matches
        db_results = Document.query.filter(
            or_(
                Document.title.ilike(f'%{query}%'),
                Document.abstract.ilike(f'%{query}%')
            )
        ).all()
        
        results = [{
            "source": "database",
            "id": doc.id,
            "title": doc.title,
            "abstract": doc.abstract,
            "upload_date": doc.upload_date
        } for doc in db_results]
        
        return jsonify(results)

    @app.route('/recommend/<int:doc_id>', methods=['GET'])
    def recommend_documents(doc_id):
        from ml_engine import find_recommendations # Local import to avoid circular dependency if any
        
        target_doc = Document.query.get(doc_id)
        if not target_doc:
            return jsonify({"error": "Document not found"}), 404
            
        # Get extracted text for this doc (re-extracting or assuming we saved it?)
        # For this prototype Phase 2, we didn't strictly save "cleaned_text" in DB, only in ES.
        # But we verified saving file_path. We can re-extract or assume we rely on file content.
        # Ideally we validly storing full_text in DB for this Recommendation feature if ES is optional.
        # Let's re-extract since we have the file path and utils. 
        # OPTIMIZATION: In Phase 4, add a text column to Document table.
        
        try:
            target_text = extract_text_from_pdf(target_doc.file_path)
            target_cleaned = clean_text(target_text)
            
            # Fetch all other docs
            all_docs = Document.query.filter(Document.id != doc_id).all()
            all_docs_data = []
            
            for d in all_docs:
                # Expensive operation for prototype: Read every PDF
                # In real world: Store vectors or text in DB.
                # Since we don't have text col yet, we read file.
                # Warning: Slow for many files.
                d_text = extract_text_from_pdf(d.file_path)
                d_cleaned = clean_text(d_text)
                all_docs_data.append({'id': d.id, 'text': d_cleaned})
            
            # Find similar
            recommended_ids = find_recommendations(target_cleaned, all_docs_data)
            
            # Fetch details
            recommendations = []
            for rid in recommended_ids:
                d = Document.query.get(rid)
                if d:
                    recommendations.append({
                        "id": d.id,
                        "title": d.title,
                        "abstract": d.abstract
                    })
            
            return jsonify(recommendations)
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return app
