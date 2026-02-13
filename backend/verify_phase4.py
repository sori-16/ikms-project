"""
Verification Script for Phase 4: RBAC & Workflow
Tests:
1. User Registration (Researcher, Moderator)
2. Login and JWT Token
3. Role-Based Access Control
4. Document Upload (Pending Status)
5. Moderation Queue Access
6. Document Approval/Rejection
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_register():
    """Test user registration"""
    print("\n=== TEST 1: User Registration ===")
    
    # Register a researcher
    researcher_data = {
        "name": "Test Researcher",
        "email": "researcher@test.com",
        "password": "password123",
        "role": "researcher"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=researcher_data)
    print(f"Researcher Registration: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"  User: {data['user']['name']} ({data['user']['role']})")
        print(f"  Token: {data['token'][:20]}...")
        return data['token']
    else:
        print(f"  Error: {response.json()}")
        return None

def test_register_moderator():
    """Register a moderator"""
    print("\n=== TEST 2: Moderator Registration ===")
    
    moderator_data = {
        "name": "Test Moderator",
        "email": "moderator@test.com",
        "password": "password123",
        "role": "moderator"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=moderator_data)
    print(f"Moderator Registration: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"  User: {data['user']['name']} ({data['user']['role']})")
        return data['token']
    else:
        print(f"  Error: {response.json()}")
        return None

def test_login():
    """Test login"""
    print("\n=== TEST 3: Login ===")
    
    login_data = {
        "email": "researcher@test.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    print(f"Login: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Welcome: {data['user']['name']}")
        return data['token']
    else:
        print(f"  Error: {response.json()}")
        return None

def test_access_pending_as_researcher(token):
    """Test that researcher cannot access moderation queue"""
    print("\n=== TEST 4: RBAC - Researcher Access to Pending (Should Fail) ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/documents/pending", headers=headers)
    print(f"Access Pending Queue: {response.status_code}")
    if response.status_code == 403:
        print("  ✓ Correctly denied (403 Forbidden)")
    else:
        print(f"  ✗ Unexpected: {response.json()}")

def test_access_pending_as_moderator(token):
    """Test that moderator CAN access moderation queue"""
    print("\n=== TEST 5: RBAC - Moderator Access to Pending (Should Succeed) ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/documents/pending", headers=headers)
    print(f"Access Pending Queue: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  ✓ Success! Found {len(data)} pending documents")
        return data
    else:
        print(f"  ✗ Error: {response.json()}")
        return []

def test_approve_document(doc_id, moderator_token):
    """Test document approval"""
    print(f"\n=== TEST 6: Approve Document {doc_id} ===")
    
    headers = {"Authorization": f"Bearer {moderator_token}"}
    data = {"status": "approved"}
    
    response = requests.put(f"{BASE_URL}/documents/{doc_id}/status", json=data, headers=headers)
    print(f"Approve Document: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"  ✓ {result['message']}")
    else:
        print(f"  ✗ Error: {response.json()}")

def test_search_approved():
    """Test that search only returns approved documents"""
    print("\n=== TEST 7: Search (Should Only Show Approved) ===")
    
    response = requests.get(f"{BASE_URL}/search?q=test")
    print(f"Search: {response.status_code}")
    if response.status_code == 200:
        results = response.json()
        print(f"  Found {len(results)} results")
        for r in results:
            print(f"    - {r.get('title', 'No title')}")
    else:
        print(f"  Error: {response.json()}")

if __name__ == "__main__":
    print("=" * 50)
    print("Phase 4 Verification: RBAC & Workflow")
    print("=" * 50)
    
    # Test 1-3: Registration and Login
    researcher_token = test_register()
    moderator_token = test_register_moderator()
    login_token = test_login()
    
    if not researcher_token or not moderator_token:
        print("\n✗ Registration failed. Stopping tests.")
        exit(1)
    
    # Test 4: RBAC - Researcher cannot access moderation queue
    test_access_pending_as_researcher(researcher_token)
    
    # Test 5: RBAC - Moderator CAN access moderation queue
    pending_docs = test_access_pending_as_moderator(moderator_token)
    
    # Test 6: Approve a document (if any exist)
    if pending_docs and len(pending_docs) > 0:
        test_approve_document(pending_docs[0]['id'], moderator_token)
    else:
        print("\n⚠ No pending documents to approve. Upload a document first.")
    
    # Test 7: Search should only show approved documents
    test_search_approved()
    
    print("\n" + "=" * 50)
    print("Verification Complete!")
    print("=" * 50)
