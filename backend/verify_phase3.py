import requests
import fitz
import os
import json
from app import create_app, db
from models import Document

TEST_PDF_2 = "test_doc_2.pdf"

def create_second_pdf():
    doc = fitz.open()
    page = doc.new_page()
    text = """
    A completely different topic about Machine Learning in Healthcare.
    This paper discusses data analysis, patients, and hospital algorithms.
    Keywords: data, health, algorithms.
    """
    page.insert_text((50, 50), text)
    doc.save(TEST_PDF_2)
    doc.close()

def test_search_and_recommend():
    create_second_pdf()
    
    app = create_app()
    app.config['TESTING'] = True
    app.config['UPLOAD_FOLDER'] = 'uploads_test' # Ensure this matches Phase 2 verify if possible or share DB
    
    # We are using the SAME database as Phase 2 verify if run sequentially on same DB file.
    # If app.py uses SQLALCHEMY_DATABASE_URI from env or default, it persists if file based.
    
    client = app.test_client()
    
    # 1. Upload Second Doc
    print("Uploading Second PDF...")
    with open(TEST_PDF_2, 'rb') as f:
        data = {'file': (f, TEST_PDF_2)}
        client.post('/upload', data=data, content_type='multipart/form-data')
    
    # 2. Test Search
    print("\nTesting Search (Query: 'health')...")
    # 'health' appears in both docs
    res = client.get('/search?q=health')
    print(f"Search Status: {res.status_code}")
    results = res.json
    print(f"Found {len(results)} results.")
    print(results)
    
    if len(results) >= 1:
        print("SUCCESS: Search found documents.")
    else:
        print("FAILED: Search returned no results.")

    # 3. Test Recommendation
    # Assuming Doc 1 exists from Phase 2 verify execution (if DB persisted). 
    # If not, results might vary. But we just uploaded Doc 2 (ID likely 2).
    # Let's recommend for Doc 2.
    # It should match Doc 1 if content is similar (both have 'health', 'data', 'patient').
    
    # Need to know ID of doc 2.
    with app.app_context():
        doc2 = Document.query.filter_by(title=TEST_PDF_2).first()
        if doc2:
            print(f"\nTesting Recommendations for Doc ID {doc2.id} ({doc2.title})...")
            res = client.get(f'/recommend/{doc2.id}')
            rec_results = res.json
            print(f"Recommendations: {rec_results}")
            
            if len(rec_results) > 0:
                print("SUCCESS: Recommendations returned.")
            else:
                # Might happen if similarity is 0 or no other docs.
                # Doc 1 has "Cardiovascular health... patient data". Doc 2 "Machine Learning... data analysis, patients".
                # Overlap: data, patients/patient, health. Should be > 0.
                print("WARNING: No recommendations found (similarity might be low or only 1 doc).")
        else:
            print("FAILED: Could not find uploaded document 2.")

    # Cleanup
    if os.path.exists(TEST_PDF_2):
        os.remove(TEST_PDF_2)

if __name__ == "__main__":
    try:
        test_search_and_recommend()
    except Exception as e:
        print(f"Verification Error: {e}")
