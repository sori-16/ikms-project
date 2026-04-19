from app import create_app, db
from models import Institution, Document, DocumentStatus, User, UserRole
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

    # Create a 2023 paper for AAU
    doc_2023 = Document(
        title="AAU Paper 2023",
        abstract="Research from 2023.",
        file_path="dummy_2023.pdf",
        upload_date=datetime(2023, 5, 1),
        publication_date=datetime(2023, 6, 1), # Explicit 2023
        uploader_id=researcher.id,
        institution_id=inst.id,
        status=DocumentStatus.APPROVED
    )
    
    # Create a 2024 paper for AAU
    doc_2024 = Document(
        title="AAU Paper 2024",
        abstract="Research from 2024.",
        file_path="dummy_2024.pdf",
        upload_date=datetime(2024, 5, 1),
        publication_date=datetime(2024, 6, 1), # Explicit 2024
        uploader_id=researcher.id,
        institution_id=inst.id,
        status=DocumentStatus.APPROVED
    )
    
    db.session.add(doc_2023)
    db.session.add(doc_2024)
    db.session.commit()
    print("Test data created.")
    
    # 2. Test Filters
    import requests
    base_url = "http://localhost:5000/search"
    
    # Test 1: Filter by Institution (AAU)
    print("\n--- Test 1: Filter by Institution ---")
    resp = requests.get(base_url, params={"institution_id": inst.id})
    data = resp.json()
    print(f"Count: {len(data)}")
    for d in data:
        print(f"- {d['title']} (Inst ID: {d.get('institution_id')})")
        
    # Test 2: Filter by Year (2023)
    print("\n--- Test 2: Filter by Year (2023) ---")
    resp = requests.get(base_url, params={"year": 2023, "institution_id": inst.id})
    data = resp.json()
    print(f"Count: {len(data)}")
    for d in data:
        print(f"- {d['title']} (Date: {d.get('publication_date')})")
        
    # Test 3: Filter by Year (2024)
    print("\n--- Test 3: Filter by Year (2024) ---")
    resp = requests.get(base_url, params={"year": 2024, "institution_id": inst.id})
    data = resp.json()
    print(f"Count: {len(data)}")
    for d in data:
        print(f"- {d['title']} (Date: {d.get('publication_date')})")
