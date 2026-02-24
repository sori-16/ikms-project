"""
IKMS Thesis Data Seeder
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION

This file contains:
- Logic to seed real thesis chapters into the IKMS platform
- Institutional setup (JU-CBMP, EPHI)
- Author profile creation
- Document ingestion and AI metadata linking
"""

from app import create_app, db
from models import Institution, Author, Document, DocumentStatus, InstitutionalStatus, TopicScore
from ml_engine import extract_keywords, assign_topics
import os
from datetime import datetime

app = create_app()

def seed_data():
    with app.app_context():
        print("Starting Seeding Process...")
        
        # 1. Create Institutions
        ju = Institution.query.filter_by(name="Jimma University (JU-CBMP)").first()
        if not ju:
            ju = Institution(
                name="Jimma University (JU-CBMP)",
                description="Center for Biomedical Engineering and Medical Physics",
                location="Jimma, Ethiopia",
                website="https://www.ju.edu.et",
                established_year=1952
            )
            db.session.add(ju)
            print("Added Jimma University")

        ephi = Institution.query.filter_by(name="Ethiopian Public Health Institute (EPHI)").first()
        if not ephi:
            ephi = Institution(
                name="Ethiopian Public Health Institute (EPHI)",
                description="National health research institute of Ethiopia",
                location="Addis Ababa, Ethiopia",
                website="https://www.ephi.gov.et",
                established_year=1948
            )
            db.session.add(ephi)
            print("Added EPHI")

        # Additional Institutions
        others = [
            {
                "name": "Addis Ababa University (AAU)",
                "description": "Oldest and largest higher education institution in Ethiopia",
                "location": "Addis Ababa, Ethiopia",
                "website": "http://www.aau.edu.et",
                "year": 1950
            },
            {
                "name": "Haramaya University (HU)",
                "description": "Specialized in agriculture and health sciences",
                "location": "Haramaya, Ethiopia",
                "website": "http://www.haramaya.edu.et",
                "year": 1954
            },
            {
                "name": "Bahir Dar University (BDU)",
                "description": "Prominent research university in northern Ethiopia",
                "location": "Bahir Dar, Ethiopia",
                "website": "http://www.bdu.edu.et",
                "year": 1953
            },
            {
                "name": "University of Gondar (UoG)",
                "description": "Pioneer in medical and health sciences research",
                "location": "Gondar, Ethiopia",
                "website": "http://www.uog.edu.et",
                "year": 1954
            },
            {
                "name": "Hawassa University (HU)",
                "description": "Research hub for southern Ethiopia",
                "location": "Hawassa, Ethiopia",
                "website": "http://www.hu.edu.et",
                "year": 1999
            },
            {
                "name": "Mekelle University (MU)",
                "description": "Leading research institution in northern Ethiopia",
                "location": "Mekelle, Ethiopia",
                "website": "http://www.mu.edu.et",
                "year": 1991
            }
        ]

        for inst in others:
            if not Institution.query.filter_by(name=inst["name"]).first():
                db.session.add(Institution(
                    name=inst["name"],
                    description=inst["description"],
                    location=inst["location"],
                    website=inst["website"],
                    established_year=inst["year"]
                ))
                print(f"Added {inst['name']}")
            
        db.session.commit()

        # 2. Create Authors
        soreti = Author.query.filter_by(name="Soreti").first()
        if not soreti:
            soreti = Author(name="Soreti", normalized_name="soreti_leader", affiliation_id=ju.id)
            db.session.add(soreti)
            print("Added Author: Soreti")

        collab1 = Author.query.filter_by(name="IKMS Collaborator 1").first()
        if not collab1:
            collab1 = Author(name="IKMS Collaborator 1", affiliation_id=ju.id)
            db.session.add(collab1)

        db.session.commit()

        # 3. Seed Chapters
        chapters = [
            {"filename": "Chapter 1.txt", "title": "Chapter One: Introduction to IKMS", "inst": ju},
            {"filename": "Chapter 2.txt", "title": "Chapter Two: Requirement Analysis and Specification", "inst": ju},
            {"filename": "chapter 3.txt", "title": "Chapter Three: System Design and Architecture", "inst": ju}
        ]

        doc_dir = os.path.join(os.path.dirname(os.getcwd()), 'document')
        
        for ch in chapters:
            existing = Document.query.filter_by(title=ch['title']).first()
            if existing:
                print(f"Skipping {ch['title']} (Exists)")
                continue

            file_path = os.path.join(doc_dir, ch['filename'])
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # ML Processing
                keywords = extract_keywords(content)
                topics = assign_topics(content)

                new_doc = Document(
                    title=ch['title'],
                    abstract=content[:1000] + "...",
                    file_path=file_path,
                    institution_id=ch['inst'].id,
                    status=DocumentStatus.APPROVED, # Seeded data is pre-approved
                    institutional_status=InstitutionalStatus.VERIFIED,
                    publication_date=datetime(2024, 1, 1)
                )
                new_doc.authors.append(soreti)
                db.session.add(new_doc)
                db.session.commit()
                
                # Save Topic Scores
                for t_label in topics:
                    ts = TopicScore(document_id=new_doc.id, topic=t_label, score=0.9)
                    db.session.add(ts)
                
                print(f"Imported: {ch['title']}")

        db.session.commit()
        print("Seeding Complete!")

if __name__ == "__main__":
    seed_data()
