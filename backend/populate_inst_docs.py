from app import create_app, db
from models import Institution, Document, DocumentStatus, User, UserRole
from datetime import datetime

app = create_app()

with app.app_context():
    # 1. Get Institution
    inst = Institution.query.filter_by(name="Addis Ababa University").first()
    if not inst:
        print("AAU not found!")
        exit()
        
    # 2. Get/Create Researcher
    researcher = User.query.filter_by(email="researcher@test.com").first()
    if not researcher:
        researcher = User(name="Test Researcher", email="researcher@test.com", password_hash="dummy", role=UserRole.RESEARCHER)
        db.session.add(researcher)
        db.session.commit()

    # 3. Add Approved Document
    doc = Document(
        title="Machine Learning for Crop Disease Detection in Ethiopia",
        abstract="This paper presents a novel approach using CNNs to detect diseases in Ethiopian coffee plants. The model achieved 94% accuracy.",
        file_path="dummy_coffee_ml.pdf",
        upload_date=datetime.utcnow(),
        publication_date=datetime.utcnow(),
        uploader_id=researcher.id,
        institution_id=inst.id,
        status=DocumentStatus.APPROVED
    )
    
    db.session.add(doc)
    db.session.commit()
    print(f"Added approved document to {inst.name}")
