"""
IKMS Database Models
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION

Defines:
- User (with RBAC roles)
- Institution (with logo and metadata)
- Author (with normalized names and profiling)
- Document (with full analytics and workflow)
- InstitutionMembership & SearchAlerts
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

class InstitutionalStatus(enum.Enum):
    PENDING = 'pending'
    VERIFIED = 'verified'
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
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to Institution
    institution = db.relationship('Institution', backref=db.backref('users', lazy=True))
    saved_searches = db.relationship('SavedSearch', backref='user', lazy=True)

class Institution(db.Model):
    __tablename__ = 'institutions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    description = db.Column(db.Text)
    location = db.Column(db.String(200))
    logo_path = db.Column(db.String(255))
    website = db.Column(db.String(255))
    established_year = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    documents = db.relationship('Document', backref='institution', lazy=True)

class Author(db.Model):
    __tablename__ = 'authors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    normalized_name = db.Column(db.String(100)) # For grouping variations
    email = db.Column(db.String(255), nullable=True)
    affiliation_id = db.Column(db.Integer, db.ForeignKey('institutions.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Linked researcher account
    
    # Relationship to Institution
    institution = db.relationship('Institution', backref=db.backref('authors', lazy=True))
    user = db.relationship('User', backref=db.backref('author_profile', uselist=False))

class Document(db.Model):
    __tablename__ = 'documents'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    file_size_bytes = db.Column(db.BigInteger)
    abstract = db.Column(db.Text)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Analytics & Workflow
    status = db.Column(db.Enum(DocumentStatus), default=DocumentStatus.PENDING)
    institutional_status = db.Column(db.Enum(InstitutionalStatus), default=InstitutionalStatus.PENDING)
    publication_date = db.Column(db.DateTime)
    download_count = db.Column(db.Integer, default=0)
    view_count = db.Column(db.Integer, default=0)
    moderation_notes = db.Column(db.Text)
    approved_at = db.Column(db.DateTime)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'))
    uploader_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    authors = db.relationship('Author', secondary=document_authors, lazy='subquery',
        backref=db.backref('documents', lazy=True))

    topic_scores = db.relationship('TopicScore', backref='document', lazy=True)
    
    # Phase 8: Analytics relationships
    downloads = db.relationship('DownloadLog', backref='document', lazy=True)

class TopicScore(db.Model):
    __tablename__ = 'topic_scores'
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    topic = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Float, nullable=False)

class SavedSearch(db.Model):
    __tablename__ = 'saved_searches'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    query = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_checked_at = db.Column(db.DateTime, default=datetime.utcnow)

# Phase 8: Analytics & Personalization Models
class DownloadLog(db.Model):
    __tablename__ = 'download_logs'
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Nullable for public downloads
    downloaded_at = db.Column(db.DateTime, default=datetime.utcnow)

# Institution Membership & Alerts Table
class InstitutionMembership(db.Model):
    __tablename__ = 'institution_memberships'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'), nullable=False)
    role = db.Column(db.String(50), default='member')
    verified = db.Column(db.Boolean, default=False)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SearchAlert(db.Model):
    __tablename__ = 'search_alerts'
    id = db.Column(db.Integer, primary_key=True)
    search_id = db.Column(db.Integer, db.ForeignKey('saved_searches.id'), nullable=False)
    doc_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ModerationLog(db.Model):
    __tablename__ = 'moderation_logs'
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    moderator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50)) # 'approved', 'rejected', 'revision'
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
