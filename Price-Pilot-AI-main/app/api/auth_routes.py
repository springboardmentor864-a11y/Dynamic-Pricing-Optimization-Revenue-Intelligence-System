from flask import Blueprint, request, jsonify
from app.models import db, User, AuditLog
from app.auth import hash_password, verify_password, generate_tokens, jwt_required, role_required

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'Business Analyst')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400

    if role not in ['Admin', 'Pricing Manager', 'Business Analyst']:
        return jsonify({'error': 'Invalid role. Must be Admin, Pricing Manager, or Business Analyst'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User with this email already exists'}), 409

    pwd_hash = hash_password(password)
    new_user = User(
        name=name,
        email=email,
        password_hash=pwd_hash,
        role=role
    )

    db.session.add(new_user)
    db.session.commit()

    access_token, refresh_token = generate_tokens(new_user.id, new_user.role)

    # Record Audit Log
    log = AuditLog(user_id=new_user.id, action='REGISTER', endpoint='/api/auth/register', ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': 'User registered successfully',
        'user': new_user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not verify_password(password, user.password_hash):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    access_token, refresh_token = generate_tokens(user.id, user.role)

    # Audit log
    log = AuditLog(user_id=user.id, action='LOGIN', endpoint='/api/auth/login', ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required
def logout():
    user = getattr(request, 'current_user', None)
    if user:
        log = AuditLog(user_id=user.id, action='LOGOUT', endpoint='/api/auth/logout', ip_address=request.remote_addr)
        db.session.add(log)
        db.session.commit()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    data = request.get_json() or {}
    refresh_token = data.get('refresh_token')
    if not refresh_token:
        return jsonify({'error': 'Refresh token missing'}), 400

    from app.auth import decode_token
    payload = decode_token(refresh_token)
    if 'error' in payload or payload.get('type') != 'refresh':
        return jsonify({'error': 'Invalid or expired refresh token'}), 401

    user = User.query.get(payload['sub'])
    if not user or not user.is_active:
        return jsonify({'error': 'User not found or inactive'}), 401

    new_access_token, new_refresh_token = generate_tokens(user.id, user.role)
    return jsonify({
        'access_token': new_access_token,
        'refresh_token': new_refresh_token
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required
def get_profile():
    user = request.current_user
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required
def update_profile():
    user = request.current_user
    data = request.get_json() or {}

    if 'name' in data:
        user.name = data['name']
    if 'password' in data and data['password']:
        user.password_hash = hash_password(data['password'])

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200
