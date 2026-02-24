from app import create_app, db
from models import Institution

app = create_app()
with app.app_context():
    insts = Institution.query.all()
    print(f"Total Institutions: {len(insts)}")
    for i in insts:
        print(f"- {i.name}")
