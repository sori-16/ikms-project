from app import create_app, db
from models import Institution, Document
from datetime import datetime

app = create_app()

with app.app_context():
    # 1. Clear existing institutions (optional, for clean test)
    # db.session.query(Institution).delete()
    
    # 2. Add Dummy Institutions
    institutions_data = [
        {
            "name": "Addis Ababa University",
            "location": "Addis Ababa, Ethiopia",
            "description": "Addis Ababa University (AAU), which was established in 1950 as the University College of Addis Ababa (UCAA), is the oldest and the largest higher learning and research institution in Ethiopia."
        },
        {
            "name": "Jimma University",
            "location": "Jimma, Ethiopia",
            "description": "Jimma University is a public research university located in Jimma, Ethiopia. It is recognized as the leading national university, ranked first by the Federal Ministry of Education for four successive years."
        },
        {
            "name": "Bahir Dar University",
            "location": "Bahir Dar, Ethiopia",
            "description": "Bahir Dar University is a university in the city of Bahir Dar, Ethiopia. It was established by merging two former higher education institutions."
        }
    ]

    for data in institutions_data:
        existing = Institution.query.filter_by(name=data['name']).first()
        if not existing:
            inst = Institution(
                name=data['name'],
                location=data['location'],
                description=data['description']
            )
            db.session.add(inst)
            print(f"Added: {data['name']}")
        else:
            print(f"Skipped (Exists): {data['name']}")
    
    db.session.commit()
    print("Institution population complete.")
