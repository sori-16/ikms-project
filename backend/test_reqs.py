from app import app, db
from models import AffiliationRequest

with app.app_context():
    requests = AffiliationRequest.query.filter_by(status='pending', institution_id=None).all()
    print("Found independent requests:", len(requests))
    for r in requests:
        print(f"Request: {r.id} for user {r.user.email if r.user else 'no user_obj'}")
