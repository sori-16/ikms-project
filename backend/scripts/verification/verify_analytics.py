from app import create_app, db
from models import Institution, Document, DocumentStatus, User, UserRole, DownloadLog
from datetime import datetime

app = create_app()

with app.app_context():
    # 1. Setup Test Data
    # Get Institution
    inst = Institution.query.filter_by(name="Addis Ababa University").first()
    if not inst:
        print("AAU not found! Please run populate_institutions.py first.")
        exit()
        
    # Get/Create Researcher
    researcher = User.query.filter_by(email="researcher@test.com").first()
    if not researcher:
        researcher = User(name="Test Researcher", email="researcher@test.com", password_hash="dummy", role=UserRole.RESEARCHER)
        db.session.add(researcher)
        db.session.commit()
    
    # Get a document (or create one if none)
    doc = Document.query.filter_by(title="Machine Learning for Crop Disease Detection in Ethiopia").first()
    if not doc:
        print("Test Doc not found. Create one first.")
        # Create one for testing
        doc = Document(
            title="Test Analytics Paper",
            file_path="dummy.pdf",
            status=DocumentStatus.APPROVED,
            uploader_id=researcher.id,
            institution_id=inst.id,
            abstract="Test abstract"
        )
        db.session.add(doc)
        db.session.commit()

    # 2. Simulate Downloads directly via DB (or could mock request)
    print("\n--- Simulating Downloads ---")
    # Add 5 downloads for this doc
    for _ in range(5):
        log = DownloadLog(document_id=doc.id, user_id=researcher.id)
        db.session.add(log)
    db.session.commit()
    print("Added 5 downloads.")
    
    # 3. Test Analytics API Logic
    from sqlalchemy import func
    
    # Total Downloads
    total = db.session.query(func.count(DownloadLog.id)).scalar()
    print(f"Total Downloads in DB: {total}")
    
    # Top Doc
    top_doc = db.session.query(
        DownloadLog.document_id, 
        func.count(DownloadLog.id)
    ).group_by(DownloadLog.document_id).order_by(func.count(DownloadLog.id).desc()).first()
    
    print(f"Top Doc ID: {top_doc[0]}, Count: {top_doc[1]}")
    
    # Institution Downloads
    inst_stats = db.session.query(
            Institution.name,
            func.count(DownloadLog.id).label('count')
        ).join(Document, Document.institution_id == Institution.id)\
         .join(DownloadLog, DownloadLog.document_id == Document.id)\
         .group_by(Institution.name).all()
         
    print("\n--- Institution Stats ---")
    for name, count in inst_stats:
        print(f"{name}: {count}")

    # 4. Test Bookmarks
    print("\n--- Testing Bookmarks ---")
    import requests
    # Login to get token
    # Since this is a script, we will mock the logic or just verify DB insert works
    from models import SavedDocument
    
    existing_save = SavedDocument.query.filter_by(user_id=researcher.id, document_id=doc.id).first()
    if not existing_save:
        save = SavedDocument(user_id=researcher.id, document_id=doc.id)
        db.session.add(save)
        db.session.commit()
        print("Document saved to bookmarks.")
    else:
        print("Document already bookmarked.")
        
    saved_count = SavedDocument.query.filter_by(user_id=researcher.id).count()
    print(f"User has {saved_count} bookmarks.")
