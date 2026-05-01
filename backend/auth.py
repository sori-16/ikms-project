"""
Created by: Soreti (Team Leader)
DO NOT MODIFY WITHOUT PERMISSION
"""
from functools import wraps
from flask import request, jsonify
from supabase_client import supabase
import os

def login_required(f):
    """Decorator to require Supabase authentication (Bypassed in OFFLINE_MODE)"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if os.environ.get('OFFLINE_MODE') == 'true':
            # Mock user for demo
            token = request.headers.get('Authorization', '')
            user_id = token[7:] if token.startswith('Bearer ') else token
            
            # Look up in local DB
            from models import User
            user = User.query.get(user_id)
            if user:
                request.user_id = user.id
                request.user_email = user.email
                request.user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
            else:
                request.user_id = user_id or "demo-user-id"
                request.user_email = "demo@example.com"
                request.user_role = "sys_admin"
            return f(*args, **kwargs)

        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "No token provided"}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            # Verify token with Supabase (with retry for transient Windows socket errors)
            auth_response = None
            last_err = None
            for _attempt in range(3):
                try:
                    auth_response = supabase.auth.get_user(token)
                    break
                except Exception as net_err:
                    last_err = net_err
                    import time
                    time.sleep(0.3)
            
            if auth_response is None:
                return jsonify({"error": f"Auth network error: {last_err}"}), 401
            
            if not auth_response.user:
                return jsonify({"error": "Invalid or expired token"}), 401
            
            # Store user info in request
            request.user_id = auth_response.user.id
            request.user_email = auth_response.user.email
            
            # Get role from metadata originally
            role = auth_response.user.user_metadata.get('role', 'researcher')
            
            # Fetch latest role from database to handle promotions
            try:
                db_res = supabase.table("users").select("role").eq("id", request.user_id).execute()
                if db_res.data and db_res.data[0].get('role'):
                    role = db_res.data[0].get('role')
            except Exception as e:
                pass # Fallback to metadata role if query fails
            
            request.user_role = role
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401
    
    return decorated_function

def role_required(*allowed_roles):
    """Decorator to require specific roles (Bypassed in OFFLINE_MODE)"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if os.environ.get('OFFLINE_MODE') == 'true':
                token = request.headers.get('Authorization', '')
                user_id = token[7:] if token.startswith('Bearer ') else token
                
                from models import User
                user = User.query.get(user_id)
                role = "sys_admin"
                if user:
                    role = user.role.value if hasattr(user.role, 'value') else str(user.role)
                
                if role not in allowed_roles and "sys_admin" not in allowed_roles:
                     # Allow sys_admin to bypass role checks in demo if we want, 
                     # but let's be strict to allow testing
                     if role not in allowed_roles:
                        return jsonify({"error": f"Insufficient permissions: {role}"}), 403

                request.user_id = user_id or "demo-user-id"
                request.user_role = role
                return f(*args, **kwargs)

            token = request.headers.get('Authorization')
            if not token:
                return jsonify({"error": "No token provided"}), 401
            
            if token.startswith('Bearer '):
                token = token[7:]
            
            try:
                # Verify token with Supabase (with retry for transient Windows socket errors)
                auth_response = None
                last_err = None
                for _attempt in range(3):
                    try:
                        auth_response = supabase.auth.get_user(token)
                        break
                    except Exception as net_err:
                        last_err = net_err
                        import time
                        time.sleep(0.3)
                
                if auth_response is None:
                    return jsonify({"error": f"Auth network error: {last_err}"}), 401
                
                if not auth_response.user:
                    return jsonify({"error": "Invalid or expired token"}), 401
                
                # Check JWT metadata first
                role = auth_response.user.user_metadata.get('role', 'researcher')
                
                # Always check database for latest role to ensure consistency
                try:
                    db_user_res = supabase.table("users").select("role").eq("id", auth_response.user.id).execute()
                    if db_user_res.data and db_user_res.data[0].get('role'):
                        role = db_user_res.data[0].get('role')
                except Exception as e:
                    pass
                
                if role not in allowed_roles:
                    return jsonify({"error": f"Insufficient permissions: {role} vs {allowed_roles}"}), 403
                
                request.user_id = auth_response.user.id
                request.user_role = role
                return f(*args, **kwargs)
            except Exception as e:
                import traceback
                traceback.print_exc()
                return jsonify({"error": f"Authorization failed: {str(e)}"}), 401
        
        return decorated_function
    return decorator

# Kept for compatibility if needed for other scripts, but deprecated for Auth
def hash_password(password): return "DEPRECATED"
def check_password(password, hashed): return False
def generate_token(user_id, role): return "DEPRECATED"
