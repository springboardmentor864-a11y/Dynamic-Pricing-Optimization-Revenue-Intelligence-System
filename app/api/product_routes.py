import uuid
from flask import Blueprint, request, jsonify
from app.models import db, Product, Category, PricingHistory, AuditLog
from app.auth import jwt_required, role_required

product_bp = Blueprint('product_bp', __name__)

@product_bp.route('', methods=['GET'])
def get_products():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    search = request.args.get('search', '', type=str)

    query = Product.query
    if search:
        query = query.filter(Product.product_id.ilike(f'%{search}%'))

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    products_list = [p.to_dict() for p in paginated.items]

    # If DB is empty, provide seed products
    if not products_list and page == 1:
        seed_categories = ['bed_bath_table', 'health_beauty', 'sports_leisure', 'computers_accessories']
        seed_products = []
        for i in range(1, per_page + 1):
            pid = f"prod_{i:04d}_{seed_categories[i % len(seed_categories)]}"
            seed_products.append({
                'id': i,
                'product_id': pid,
                'category_id': (i % len(seed_categories)) + 1,
                'category_name': seed_categories[i % len(seed_categories)].replace('_', ' ').title(),
                'product_weight_g': 350.0 + i * 40.0,
                'product_length_cm': 20.0 + (i % 5),
                'product_height_cm': 15.0 + (i % 3),
                'product_width_cm': 15.0 + (i % 4),
                'current_price': round(49.99 + i * 14.50, 2),
                'created_at': '2026-07-20T12:00:00'
            })
        return jsonify({
            'products': seed_products,
            'total': 50,
            'page': page,
            'per_page': per_page,
            'pages': 4
        }), 200

    return jsonify({
        'products': products_list,
        'total': paginated.total,
        'page': page,
        'per_page': per_page,
        'pages': paginated.pages
    }), 200

@product_bp.route('', methods=['POST'])
@jwt_required
@role_required(['Admin', 'Pricing Manager'])
def create_product():
    data = request.get_json() or {}
    product_id = data.get('product_id', f"prod_{str(uuid.uuid4())[:8]}")
    current_price = float(data.get('current_price', 99.99))

    product = Product(
        product_id=product_id,
        category_id=data.get('category_id'),
        product_weight_g=data.get('product_weight_g', 500.0),
        product_length_cm=data.get('product_length_cm', 20.0),
        product_height_cm=data.get('product_height_cm', 15.0),
        product_width_cm=data.get('product_width_cm', 15.0),
        current_price=current_price
    )
    db.session.add(product)
    db.session.commit()

    user = request.current_user
    log = AuditLog(user_id=user.id, action='CREATE_PRODUCT', endpoint='/api/products', ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    return jsonify({'message': 'Product created successfully', 'product': product.to_dict()}), 201

@product_bp.route('/<int:id>', methods=['PUT'])
@jwt_required
@role_required(['Admin', 'Pricing Manager'])
def update_product(id):
    product = Product.query.get_or_404(id)
    data = request.get_json() or {}
    
    old_price = product.current_price
    new_price = float(data.get('current_price', old_price))

    if 'product_weight_g' in data:
        product.product_weight_g = data['product_weight_g']
    if 'current_price' in data:
        product.current_price = new_price

    if old_price != new_price:
        user = request.current_user
        history = PricingHistory(
            product_id=product.id,
            old_price=old_price,
            new_price=new_price,
            changed_by=user.id if user else None,
            change_reason=data.get('change_reason', 'Manual Price Update')
        )
        db.session.add(history)

    db.session.commit()
    return jsonify({'message': 'Product updated successfully', 'product': product.to_dict()}), 200

@product_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required
@role_required(['Admin'])
def delete_product(id):
    product = Product.query.get_or_404(id)
    db.session.delete(product)
    db.session.commit()

    user = request.current_user
    log = AuditLog(user_id=user.id, action='DELETE_PRODUCT', endpoint=f'/api/products/{id}', ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    return jsonify({'message': 'Product deleted successfully'}), 200
