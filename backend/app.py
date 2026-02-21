"""
IKMS Backend - Main Application
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION

This file contains:
- Authentication endpoints (register, login)
- Document upload and processing
- Search and recommendation APIs
- Moderation workflow
- Institution management
"""

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from models import db, Document, Institution, Author, User, UserRole, DocumentStatus, SavedSearch, InstitutionalStatus
from utils import extract_text_from_pdf, clean_text
from ml_engine import extract_keywords, assign_topics
from auth import hash_password, check_password, generate_token, login_required, role_required
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
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    @app.route('/')
    def index():
        return "IKMS Backend is running!"

    # ========== AUTH ENDPOINTS ==========
    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({"error": "User already exists"}), 409
        
        # Determine role (default to RESEARCHER if not specified)
        role_str = data.get('role', 'researcher').lower()
        role_map = {
            'researcher': UserRole.RESEARCHER,
            'inst_admin': UserRole.INST_ADMIN,
            'moderator': UserRole.MODERATOR,
            'sys_admin': UserRole.SYS_ADMIN
        }
        role = role_map.get(role_str, UserRole.RESEARCHER)
        
        # Create new user
        new_user = User(
            name=data['name'],
            email=data['email'],
            password_hash=hash_password(data['password']),
            role=role
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Generate token
        token = generate_token(new_user.id, new_user.role.value)
        
        return jsonify({
            "message": "User registered successfully",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role.value
            },
            "token": token
        }), 201

    @app.route('/login', methods=['POST'])
    def login():
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Missing email or password"}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        if not user or not check_password(data['password'], user.password_hash):
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Generate token
        token = generate_token(user.id, user.role.value)
        
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value
            },
            "token": token
        }), 200

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
                # Get institution_id from form data (if provided)
                institution_id = request.form.get('institution_id')
                uploader_id = request.form.get('uploader_id')  # Can be extracted from JWT in future
                
                new_doc = Document(
                    title=filename, # Using filename as title for now
                    abstract=raw_text[:500] if raw_text else "",
                    file_path=filepath,
                    institution_id=int(institution_id) if institution_id else None,
                    uploader_id=int(uploader_id) if uploader_id else None,
                    status=DocumentStatus.PENDING  # All uploads start as pending
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

    @app.route('/documents/<int:doc_id>', methods=['GET'])
    def get_single_document(doc_id):
        """Get details for a single document"""
        doc = Document.query.get_or_404(doc_id)
        return jsonify({
            "id": doc.id,
            "title": doc.title,
            "abstract": doc.abstract,
            "institution": doc.institution.name if doc.institution else "Unknown",
            "institution_id": doc.institution_id,
            "upload_date": doc.upload_date.isoformat(),
            "publication_date": doc.publication_date.isoformat() if doc.publication_date else None,
            "status": doc.status.value,
            "institutional_status": doc.institutional_status.value,
            "authors": [{"id": auth.id, "name": auth.name} for auth in doc.authors]
        }), 200

    @app.route('/authors', methods=['GET'])
    def get_authors():
        """Retrieve all authors"""
        authors = Author.query.all()
        return jsonify([{
            "id": a.id,
            "name": a.name,
            "affiliation": a.institution.name if a.institution else "Independent"
        } for a in authors]), 200

    @app.route('/authors/<int:author_id>', methods=['GET'])
    def get_author_profile(author_id):
        """Get author details and their list of documents"""
        author = Author.query.get_or_404(author_id)
        
        # Get all approved documents for this author
        # Using the backref 'documents' from models.py
        approved_docs = [d for d in author.documents if d.status == DocumentStatus.APPROVED]
        
        return jsonify({
            "id": author.id,
            "name": author.name,
            "user_id": author.user_id,
            "affiliation": author.institution.name if author.institution else "Independent",
            "affiliation_id": author.affiliation_id,
            "documents": [{
                "id": d.id,
                "title": d.title,
                "abstract": d.abstract,
                "publication_date": d.publication_date.isoformat() if d.publication_date else None
            } for d in approved_docs]
        }), 200

    @app.route('/search', methods=['GET'])
    def search_documents():
        query = request.args.get('q', '')
        institution_id = request.args.get('institution_id')
        year = request.args.get('year')
        
        # Build filter conditions
        filters = []
        if institution_id:
            filters.append({"term": {"institution_id": int(institution_id)}})
        if year:
            # Assuming upload_date or publication_date. Let's use upload_date for now for simplicity in ES
            # Ideally we should index publication_year separately. 
            # For now, let's filter by range or simple string match if indexed as keyword.
            # Let's assume we want to filter by publication_date year if available, else upload_date.
            pass # Complex date filtering in ES requires proper mapping. 
                 # Let's stick to DB filtering for exact year for this demo or simple match if mapped.
        
        if not query and not institution_id and not year:
             return jsonify([])
        
        # 1. Try Elasticsearch first
        if es.ping() and query:
            try:
                must_conditions = [{"multi_match": {"query": query, "fields": ["title", "abstract", "full_text"]}}]
                if institution_id:
                    must_conditions.append({"term": {"institution_id": int(institution_id)}})
                
                # Note: precise year filtering in ES requires date mapping which we haven't explicitly set up 
                # in the simplistic index call. We will skip ES year filter for this iteration 
                # or rely on DB fallback if refined filtering is needed.
                
                result = es.search(
                    index=INDEX_NAME,
                    body={
                        "query": {
                            "bool": {
                                "must": must_conditions
                            }
                        }
                    }
                )
                
                hits = result['hits']['hits']
                results = [{
                    "source": "elasticsearch",
                    "id": hit['_id'],
                    **hit['_source']
                } for hit in hits]
                
                return jsonify(results)
            except Exception as e:
                print(f"ES Search failed: {e}. Falling back to DB.")
        
        # 2. Fallback to Database (Simple LIKE match + Filters)
        print("Using Database Fallback Search")
        from sqlalchemy import or_, extract
        
        # Start with Approved documents
        db_query = Document.query.filter(Document.status == DocumentStatus.APPROVED)
        
        # Apply Text Search
        if query:
            db_query = db_query.filter(
                or_(
                    Document.title.ilike(f'%{query}%'),
                    Document.abstract.ilike(f'%{query}%')
                )
            )
        
        # Apply Institution Filter
        if institution_id:
            db_query = db_query.filter(Document.institution_id == int(institution_id))
            
        # Apply Year Filter (on publication_date)
        if year:
            db_query = db_query.filter(extract('year', Document.publication_date) == int(year))
        
        db_results = db_query.all()
        
        results = [{
            "source": "database",
            "id": doc.id,
            "title": doc.title,
            "abstract": doc.abstract,
            "upload_date": doc.upload_date,
            "institution_id": doc.institution_id,
            "publication_date": doc.publication_date.isoformat() if doc.publication_date else None,
            "authors": [{"id": auth.id, "name": auth.name} for auth in doc.authors]
        } for doc in db_results]
        
        return jsonify(results)

    @app.route('/recommend/<int:doc_id>', methods=['GET'])
    def recommend_documents(doc_id):
        try:
            # 1. Get the target document
            target_doc = Document.query.get(doc_id)
            if not target_doc:
                return jsonify({"error": "Document not found"}), 404
            
            # 2. Get all documents
            all_docs = Document.query.all()
            
            if len(all_docs) < 2:
                return jsonify([])  # Not enough documents to recommend
            
            # 3. Extract text for all documents
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            
            doc_texts = []
            doc_ids = []
            
            for doc in all_docs:
                try:
                    text = extract_text_from_pdf(doc.file_path)
                    cleaned = clean_text(text)
                    doc_texts.append(cleaned)
                    doc_ids.append(doc.id)
                except:
                    # Skip documents that can't be read
                    continue
            
            # 4. Vectorize and calculate similarity
            vectorizer = TfidfVectorizer(max_features=100)
            tfidf_matrix = vectorizer.fit_transform(doc_texts)
            
            # Find index of target document
            target_idx = doc_ids.index(doc_id)
            
            # Calculate cosine similarity
            similarities = cosine_similarity(tfidf_matrix[target_idx:target_idx+1], tfidf_matrix).flatten()
            
            # Get top 5 similar documents (excluding the target itself)
            similar_indices = similarities.argsort()[-6:-1][::-1]
            
            recommendations = []
            for idx in similar_indices:
                if doc_ids[idx] != doc_id:  # Exclude the target document
                    doc = Document.query.get(doc_ids[idx])
                    recommendations.append({
                        "id": doc.id,
                        "title": doc.title,
                        "abstract": doc.abstract,
                        "similarity_score": float(similarities[idx])
                    })
            
            return jsonify(recommendations)
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ========== MODERATION WORKFLOW ENDPOINTS ==========
    @app.route('/documents/pending', methods=['GET'])
    @role_required('moderator', 'sys_admin')
    def get_pending_documents():
        """Get all documents pending moderation"""
        pending_docs = Document.query.filter_by(status=DocumentStatus.PENDING).all()
        
        results = [{
            "id": doc.id,
            "title": doc.title,
            "abstract": doc.abstract,
            "upload_date": doc.upload_date.isoformat() if doc.upload_date else None,
            "uploader_id": doc.uploader_id
        } for doc in pending_docs]
        
        return jsonify(results), 200

    @app.route('/documents/<int:doc_id>/status', methods=['PUT'])
    @role_required('moderator', 'sys_admin')
    def update_document_status(doc_id):
        """Approve or reject a document"""
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({"error": "Status is required"}), 400
        
        # Validate status
        status_str = data['status'].lower()
        if status_str not in ['approved', 'rejected']:
            return jsonify({"error": "Status must be 'approved' or 'rejected'"}), 400
        
        # Find document
        document = Document.query.get(doc_id)
        if not document:
            return jsonify({"error": "Document not found"}), 404
        
        # Update status
        document.status = DocumentStatus.APPROVED if status_str == 'approved' else DocumentStatus.REJECTED
        db.session.commit()
        
        return jsonify({
            "message": f"Document {status_str}",
            "document_id": doc_id,
            "status": document.status.value
        }), 200

    # ========== INSTITUTION MANAGEMENT ENDPOINTS ==========
    @app.route('/institutions', methods=['GET'])
    def get_institutions():
        """Get all institutions (public endpoint)"""
        institutions = Institution.query.all()
        
        results = [{
            "id": inst.id,
            "name": inst.name,
            "description": inst.description,
            "location": inst.location
        } for inst in institutions]
        
        return jsonify(results), 200

    @app.route('/institutions', methods=['POST'])
    @role_required('inst_admin', 'sys_admin')
    def create_institution():
        """Create a new institution (Admin only)"""
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({"error": "Institution name is required"}), 400
        
        # Check if institution already exists
        existing = Institution.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({"error": "Institution already exists"}), 409
        
        new_institution = Institution(
            name=data['name'],
            description=data.get('description', ''),
            location=data.get('location', '')
        )
        
        db.session.add(new_institution)
        db.session.commit()
        
        return jsonify({
            "message": "Institution created successfully",
            "institution": {
                "id": new_institution.id,
                "name": new_institution.name,
                "description": new_institution.description,
                "location": new_institution.location
            }
        }), 201

    @app.route('/institutions/<int:inst_id>', methods=['GET'])
    def get_institution(inst_id):
        """Get a specific institution with its documents"""
        institution = Institution.query.get(inst_id)
        if not institution:
            return jsonify({"error": "Institution not found"}), 404
        
        # Get all approved documents from this institution
        documents = Document.query.filter_by(
            institution_id=inst_id,
            status=DocumentStatus.APPROVED
        ).all()
        
        return jsonify({
            "id": institution.id,
            "name": institution.name,
            "description": institution.description,
            "location": institution.location,
            "documents": [{
                "id": doc.id,
                "title": doc.title,
                "abstract": doc.abstract,
                "publication_date": doc.publication_date.isoformat() if doc.publication_date else None
            } for doc in documents]
        }), 200

    @app.route('/institutions/<int:inst_id>', methods=['PUT'])
    @role_required('inst_admin', 'sys_admin')
    def update_institution(inst_id):
        """Update institution details (Admin only)"""
        institution = Institution.query.get(inst_id)
        if not institution:
            return jsonify({"error": "Institution not found"}), 404
        
        data = request.get_json()
        
        if data.get('name'):
            institution.name = data['name']
        if data.get('description'):
            institution.description = data['description']
        if data.get('location'):
            institution.location = data['location']
        
        db.session.commit()
        
        return jsonify({
            "message": "Institution updated successfully",
            "institution": {
                "id": institution.id,
                "name": institution.name,
                "description": institution.description,
                "location": institution.location
            }
        }), 200

    # ========== ANALYTICS & PERSONALIZATION ENDPOINTS ==========

    @app.route('/documents/<int:doc_id>/download', methods=['POST'])
    def track_download(doc_id):
        """Record a download and return file path (or serve file directly)"""
        doc = Document.query.get_or_404(doc_id)
        
        # Track download
        # If user is logged in, track their ID. Else, track as anonymous (None).
        user_id = None
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
                import jwt
                payload = jwt.decode(token, os.environ.get('SECRET_KEY', 'dev_key'), algorithms=["HS256"])
                user_id = payload['user_id']
            except:
                pass # Invalid token, treat as anonymous
            
        from models import DownloadLog
        log = DownloadLog(document_id=doc.id, user_id=user_id)
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            "message": "Download recorded",
            "file_url": f"/uploads/{doc.file_path}" # In prod, this would be a signed URL or direct file serve
        }), 200

    @app.route('/bookmarks', methods=['POST'])
    @login_required
    def bookmark_document(current_user):
        """Save a document to user's library"""
        data = request.get_json()
        doc_id = data.get('document_id')
        
        if not doc_id:
            return jsonify({"error": "Document ID required"}), 400
            
        from models import SavedDocument, Document
        
        # Verify doc exists
        doc = Document.query.get(doc_id)
        if not doc:
            return jsonify({"error": "Document not found"}), 404
            
        # Check if already saved
        existing = SavedDocument.query.filter_by(user_id=current_user.id, document_id=doc_id).first()
        if existing:
            return jsonify({"message": "Document already saved"}), 200
            
        save = SavedDocument(user_id=current_user.id, document_id=doc_id)
        db.session.add(save)
        db.session.commit()
        
        return jsonify({"message": "Document saved to library"}), 201

    @app.route('/bookmarks', methods=['GET'])
    @login_required
    def get_bookmarks(current_user):
        """Get user's saved documents"""
        from models import SavedDocument
        
        saved = SavedDocument.query.filter_by(user_id=current_user.id).order_by(SavedDocument.saved_at.desc()).all()
        
        results = []
        for s in saved:
            doc = Document.query.get(s.document_id)
            if doc:
                results.append({
                    "id": doc.id,
                    "title": doc.title,
                    "abstract": doc.abstract,
                    "saved_at": s.saved_at.isoformat()
                })
                
        return jsonify(results), 200

    @app.route('/analytics/summary', methods=['GET'])
    def get_analytics_summary():
        """Get public analytics stats"""
        from models import DownloadLog, Document
        from sqlalchemy import func
        
        # 1. Total Downloads
        total_downloads = db.session.query(func.count(DownloadLog.id)).scalar()
        
        # 2. Top 5 Most Downloaded Documents
        top_docs_query = db.session.query(
            DownloadLog.document_id, 
            func.count(DownloadLog.id).label('count')
        ).group_by(DownloadLog.document_id).order_by(func.count(DownloadLog.id).desc()).limit(5).all()
        
        top_docs = []
        for doc_id, count in top_docs_query:
            doc = Document.query.get(doc_id)
            if doc:
                top_docs.append({
                    "title": doc.title,
                    "count": count,
                    "institution": doc.institution.name if doc.institution else "Unknown"
                })
                
        # 3. Downloads by Institution
        # Complex join: DownloadLog -> Document -> Institution
        inst_stats_query = db.session.query(
            Institution.name,
            func.count(DownloadLog.id).label('count')
        ).join(Document, Document.institution_id == Institution.id)\
         .join(DownloadLog, DownloadLog.document_id == Document.id)\
         .group_by(Institution.name).all()
         
        inst_stats = [{"name": name, "count": count} for name, count in inst_stats_query]
        
        return jsonify({
            "total_downloads": total_downloads,
            "top_documents": top_docs,
            "institution_downloads": inst_stats
        }), 200

    # ========== SAVED SEARCHES & ALERTS ENDPOINTS ==========

    @app.route('/saved-searches', methods=['POST'])
    @login_required
    def save_search(current_user):
        """Save a search query for a user"""
        data = request.get_json()
        query = data.get('query')
        
        if not query:
            return jsonify({"error": "Search query is required"}), 400
            
        new_save = SavedSearch(
            user_id=current_user.id,
            query=query
        )
        
        db.session.add(new_save)
        db.session.commit()
        
        return jsonify({
            "message": "Search query saved",
            "saved_search": {
                "id": new_save.id,
                "query": new_save.query,
                "created_at": new_save.created_at.isoformat()
            }
        }), 201

    @app.route('/saved-searches', methods=['GET'])
    @login_required
    def get_saved_searches(current_user):
        """Retrieve a user's saved searches with alert counts"""
        saved = SavedSearch.query.filter_by(user_id=current_user.id).all()
        
        results = []
        from sqlalchemy import or_
        
        for s in saved:
            # Simple Alert Logic: How many approved documents were added after last_checked_at 
            # that match this query string?
            alert_count = Document.query.filter(
                Document.status == DocumentStatus.APPROVED,
                Document.upload_date > s.last_checked_at,
                or_(
                    Document.title.ilike(f'%{s.query}%'),
                    Document.abstract.ilike(f'%{s.query}%')
                )
            ).count()
            
            results.append({
                "id": s.id,
                "query": s.query,
                "created_at": s.created_at.isoformat(),
                "alert_count": alert_count
            })
            
        return jsonify(results), 200

    @app.route('/saved-searches/<int:search_id>/clear-alerts', methods=['POST'])
    @login_required
    def clear_alerts(current_user, search_id):
        """Clear alerts for a saved search by updating last_checked_at"""
        s = SavedSearch.query.filter_by(id=search_id, user_id=current_user.id).first_or_404()
        s.last_checked_at = datetime.utcnow()
        db.session.commit()
        return jsonify({"message": "Alerts cleared"}), 200

    @app.route('/saved-searches/<int:search_id>', methods=['DELETE'])
    @login_required
    def delete_saved_search(current_user, search_id):
        """Delete a saved search"""
        s = SavedSearch.query.filter_by(id=search_id, user_id=current_user.id).first_or_404()
        db.session.delete(s)
        db.session.commit()
        return jsonify({"message": "Saved search deleted"}), 200

    # ========== INSTITUTIONAL GOVERNANCE & CLAIMS ==========

    @app.route('/institutions/my/pending', methods=['GET'])
    @role_required('inst_admin', 'sys_admin')
    def get_my_inst_pending(current_user):
        """Get documents pending institutional verification for admin's institution"""
        if not current_user.institution_id:
            return jsonify({"error": "Admin not linked to any institution"}), 403
            
        pending = Document.query.filter_by(
            institution_id=current_user.institution_id,
            institutional_status=InstitutionalStatus.PENDING
        ).all()
        
        return jsonify([{
            "id": d.id,
            "title": d.title,
            "uploader_name": d.uploader.name if d.uploader else "Unknown",
            "upload_date": d.upload_date.isoformat()
        } for d in pending]), 200

    @app.route('/documents/<int:doc_id>/institutional-verify', methods=['POST'])
    @role_required('inst_admin', 'sys_admin')
    def institutional_verify(current_user, doc_id):
        """Verify or reject a document's institutional affiliation"""
        doc = Document.query.get_or_404(doc_id)
        
        # Check if admin belongs to this institution
        if current_user.role == UserRole.INST_ADMIN and doc.institution_id != current_user.institution_id:
            return jsonify({"error": "Permission denied: Document belongs to another institution"}), 403
            
        data = request.get_json()
        status_str = data.get('status', 'verified').lower()
        
        if status_str == 'verified':
            doc.institutional_status = InstitutionalStatus.VERIFIED
        elif status_str == 'rejected':
            doc.institutional_status = InstitutionalStatus.REJECTED
        else:
            return jsonify({"error": "Invalid status"}), 400
            
        db.session.commit()
        return jsonify({"message": f"Document marked as {status_str} by institution"}), 200

    @app.route('/authors/<int:author_id>/claim', methods=['POST'])
    @login_required
    def claim_author(current_user, author_id):
        """Researcher claims an author profile"""
        author = Author.query.get_or_404(author_id)
        
        if author.user_id:
            return jsonify({"error": "This author profile is already claimed"}), 409
            
        # Optional: Check if user already has a profile
        if author.query.filter_by(user_id=current_user.id).first():
            return jsonify({"error": "You have already claimed an author profile"}), 400

        author.user_id = current_user.id
        db.session.commit()
        
        return jsonify({
            "message": "Author profile claimed successfully",
            "author": {
                "id": author.id,
                "name": author.name
            }
        }), 200

    @app.route('/authors/me', methods=['GET'])
    @login_required
    def get_my_author_profile(current_user):
        """Get the author profile linked to the current logged-in user"""
        author = Author.query.filter_by(user_id=current_user.id).first()
        if not author:
            return jsonify({"message": "No author profile linked"}), 404
            
        return jsonify({
            "id": author.id,
            "name": author.name,
            "affiliation": author.institution.name if author.institution else None
        }), 200

    return app

if __name__ == '__main__':
    app = create_app()
    print("Starting IKMS Backend Server...")
    print("Server running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
