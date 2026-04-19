import requests
import fitz
import os
import time
from app import create_app, db
from models import Document
from multiprocessing import Process

TEST_PDF = "test_doc.pdf"
API_URL = "http://127.0.0.1:5000/upload"

def create_dummy_pdf():
    doc = fitz.open()
    page = doc.new_page()
    text = """
    Cardiovascular health is critical for longevity. 
    This study explores the effects of exercise on heart disease and cardiac arrest.
    We analyze patient data from multiple hospitals.
    Keywords: cardiology, health, exercise, data.
    """
    page.insert_text((50, 50), text)
    doc.save(TEST_PDF)
    doc.close()

def run_server():
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(port=5000)

def test_pipeline():
    # Start server in a separate process (in real life we might assume it's running or use a test client)
    # Using python requests against localhost:5000 requires the server to be running.
    # A better way for this script: Use Flask's test client.
    
    print("Creating dummy PDF...")
    create_dummy_pdf()
    
    print("Initializing Flask Test Client...")
    app = create_app()
    app.config['TESTING'] = True
    app.config['UPLOAD_FOLDER'] = 'uploads_test'
    os.makedirs('uploads_test', exist_ok=True)
    
    with app.app_context():
        db.create_all()
        
    client = app.test_client()
    
    print("Uploading PDF...")
    with open(TEST_PDF, 'rb') as f:
        data = {'file': (f, TEST_PDF)}
        response = client.post('/upload', data=data, content_type='multipart/form-data')
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json}")
    
    if response.status_code == 201:
        print("SUCCESS: File uploaded and processed.")
        # Check DB
        with app.app_context():
            doc = Document.query.filter_by(title=TEST_PDF).first()
            if doc:
                print(f"VERIFIED: Document found in DB with ID {doc.id}")
            else:
                print("FAILED: Document not found in DB.")
    else:
         print(f"FAILED: Upload failed with {response.data}")

    # Cleanup
    if os.path.exists(TEST_PDF):
        os.remove(TEST_PDF)
    # Cleanup uploads (optional)

if __name__ == "__main__":
    try:
        test_pipeline()
    except Exception as e:
        print(f"Verification Error: {e}")
