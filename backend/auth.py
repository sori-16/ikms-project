"""
IKMS Authentication & Authorization
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION

Provides:
- Password hashing (bcrypt)
- JWT token generation/verification
- @login_required decorator
- @role_required decorator
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
import os

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')

def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id, role):
    """Generate a JWT token for a user"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def decode_token(token):
    """Decode and verify a JWT token"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "No token provided"}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        request.user_id = payload['user_id']
        request.user_role = payload['role']
        return f(*args, **kwargs)
    
    return decorated_function

def role_required(*allowed_roles):
    """Decorator to require specific roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({"error": "No token provided"}), 401
            
            if token.startswith('Bearer '):
                token = token[7:]
            
            payload = decode_token(token)
            if not payload:
                return jsonify({"error": "Invalid or expired token"}), 401
            
            if payload['role'] not in allowed_roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            
            request.user_id = payload['user_id']
            request.user_role = payload['role']
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
