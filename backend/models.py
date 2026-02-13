"""
IKMS Database Models
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION

Defines:
- User (with RBAC roles)
- Institution
- Author
- Document (with workflow status)
- SavedSearch
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import enum

db = SQLAlchemy()

# Enums for RBAC and Workflow
class UserRole(enum.Enum):
    PUBLIC = 'public'
    RESEARCHER = 'researcher'
    INST_ADMIN = 'inst_admin'
    MODERATOR = 'moderator'
    SYS_ADMIN = 'sys_admin'

class DocumentStatus(enum.Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'

# Association Table for Many-to-Many relationship between Documents and Authors
document_authors = db.Table('document_authors',
    db.Column('document_id', db.Integer, db.ForeignKey('documents.id'), primary_key=True),
    db.Column('author_id', db.Integer, db.ForeignKey('authors.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.RESEARCHER)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    saved_searches = db.relationship('SavedSearch', backref='user', lazy=True)

class Institution(db.Model):
    __tablename__ = 'institutions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(200))
    
    documents = db.relationship('Document', backref='institution', lazy=True)

class Author(db.Model):
    __tablename__ = 'authors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    affiliation_id = db.Column(db.Integer, db.ForeignKey('institutions.id'))
    
    # Relationship to Institution (optional, if authors belong to institutions directly)
    institution = db.relationship('Institution', backref='authors', lazy=True)

class Document(db.Model):
    __tablename__ = 'documents'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=False)
    abstract = db.Column(db.Text)
    publication_date = db.Column(db.Date)
    file_path = db.Column(db.String(255), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'))
    uploader_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.Enum(DocumentStatus), nullable=False, default=DocumentStatus.PENDING)
    download_count = db.Column(db.Integer, default=0)
    
    authors = db.relationship('Author', secondary=document_authors, lazy='subquery',
        backref=db.backref('documents', lazy=True))

class SavedSearch(db.Model):
    __tablename__ = 'saved_searches'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    query_string = db.Column(db.String(500), nullable=False)
    filters = db.Column(db.JSON) # Store filters as JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
