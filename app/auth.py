import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app
from flask_bcrypt import Bcrypt
from app.models import db, User

bcrypt = Bcrypt()

def hash_password(password: str) -> str:
    return bcrypt.generate_password_hash(password).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.check_password_hash(password_hash, password)

def generate_tokens(user_id: int, role: str):
    secret = current_app.config['JWT_SECRET_KEY']
    now = datetime.now(timezone.utc)
    
    access_payload = {
        'sub': str(user_id),
        'role': role,
        'type': 'access',
        'exp': now + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
        'iat': now
    }
    
    refresh_payload = {
        'sub': str(user_id),
        'role': role,
        'type': 'refresh',
        'exp': now + current_app.config['JWT_REFRESH_TOKEN_EXPIRES'],
        'iat': now
    }
    
    access_token = jwt.encode(access_payload, secret, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, secret, algorithm='HS256')
    
    return access_token, refresh_token

def decode_token(token: str):
    secret = current_app.config['JWT_SECRET_KEY']
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token has expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}

def get_auth_token():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return request.args.get('token')

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_auth_token()
        if not token:
            return jsonify({'error': 'Authorization token is missing'}), 401
        
        payload = decode_token(token)
        if 'error' in payload:
            return jsonify({'error': payload['error']}), 401
        
        if payload.get('type') != 'access':
            return jsonify({'error': 'Invalid token type'}), 401
        
        sub_id = int(payload['sub'])
        user = db.session.get(User, sub_id)
        if not user:
            user = User(id=sub_id, name=f"User #{sub_id}", email=f"user_{sub_id}@pricepilot.ai", role=payload.get('role', 'Business Analyst'), is_active=True)
            
        if not user.is_active:
            return jsonify({'error': 'User deactivated'}), 401
        
        request.current_user = user
        return f(*args, **kwargs)
    return decorated

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = get_auth_token()
            if not token:
                return jsonify({'error': 'Authorization token is missing'}), 401
            
            payload = decode_token(token)
            if 'error' in payload:
                return jsonify({'error': payload['error']}), 401
            
            user_role = payload.get('role')
            if user_role not in allowed_roles:
                return jsonify({
                    'error': 'Access denied: insufficient permissions',
                    'required_roles': allowed_roles,
                    'user_role': user_role
                }), 403
            
            sub_id = int(payload['sub'])
            user = db.session.get(User, sub_id)
            if not user:
                user = User(id=sub_id, name=f"User #{sub_id}", email=f"user_{sub_id}@pricepilot.ai", role=user_role, is_active=True)
                
            request.current_user = user
            return f(*args, **kwargs)
        return decorated
    return decorator
