from functools import wraps
from flask import request, jsonify
from supabase_client import supabase
import os

def login_required(f):
    """Decorator to require Supabase authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "No token provided"}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            # Verify token with Supabase
            auth_response = supabase.auth.get_user(token)
            if not auth_response.user:
                return jsonify({"error": "Invalid or expired token"}), 401
            
            # Store user info in request
            request.user_id = auth_response.user.id
            request.user_email = auth_response.user.email
            
            # Get role from metadata (set during signup)
            request.user_role = auth_response.user.user_metadata.get('role', 'researcher')
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401
    
    return decorated_function

def role_required(*allowed_roles):
    """Decorator to require specific roles via Supabase Auth"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({"error": "No token provided"}), 401
            
            if token.startswith('Bearer '):
                token = token[7:]
            
            try:
                auth_response = supabase.auth.get_user(token)
                if not auth_response.user:
                    return jsonify({"error": "Invalid or expired token"}), 401
                
                # Check JWT metadata first
                role = auth_response.user.user_metadata.get('role', 'researcher')
                
                # Fallback to database if metadata doesn't grant access but they might be promoted in the DB
                if role not in allowed_roles:
                    db_user_res = supabase.table("users").select("role").eq("id", auth_response.user.id).execute()
                    if db_user_res.data and db_user_res.data[0].get('role') in allowed_roles:
                        role = db_user_res.data[0].get('role')
                    else:
                        return jsonify({"error": "Insufficient permissions"}), 403
                
                request.user_id = auth_response.user.id
                request.user_role = role
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({"error": f"Authorization failed: {str(e)}"}), 401
        
        return decorated_function
    return decorator

# Kept for compatibility if needed for other scripts, but deprecated for Auth
def hash_password(password): return "DEPRECATED"
def check_password(password, hashed): return False
def generate_token(user_id, role): return "DEPRECATED"
