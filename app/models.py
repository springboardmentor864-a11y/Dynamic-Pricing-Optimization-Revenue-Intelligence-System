from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='Business Analyst')  # Admin, Pricing Manager, Business Analyst
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category_name_english = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'category_name': self.category_name,
            'category_name_english': self.category_name_english or self.category_name
        }

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    product_name_length = db.Column(db.Integer, nullable=True)
    product_description_length = db.Column(db.Integer, nullable=True)
    product_photos_qty = db.Column(db.Integer, nullable=True)
    product_weight_g = db.Column(db.Float, nullable=True)
    product_length_cm = db.Column(db.Float, nullable=True)
    product_height_cm = db.Column(db.Float, nullable=True)
    product_width_cm = db.Column(db.Float, nullable=True)
    current_price = db.Column(db.Float, nullable=False, default=0.0)
    cost_price = db.Column(db.Float, nullable=True)
    margin = db.Column(db.Float, nullable=True)
    target_margin = db.Column(db.Float, nullable=True, default=0.35)
    minimum_price = db.Column(db.Float, nullable=True)
    maximum_price = db.Column(db.Float, nullable=True)
    brand = db.Column(db.String(100), nullable=True)
    sku = db.Column(db.String(64), nullable=True)
    supplier = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    category = db.relationship('Category', backref='products')

    def get_cost(self):
        return self.cost_price if self.cost_price is not None else round(self.current_price * 0.60, 2)

    def get_minimum_price(self):
        return self.minimum_price if self.minimum_price is not None else round(self.current_price * 0.70, 2)

    def get_maximum_price(self):
        return self.maximum_price if self.maximum_price is not None else round(self.current_price * 1.50, 2)

    def get_target_margin(self):
        return self.target_margin if self.target_margin is not None else 0.35

    def to_dict(self):
        cost = self.get_cost()
        return {
            'id': self.id,
            'product_id': self.product_id,
            'category_id': self.category_id,
            'category_name': self.category.category_name if self.category else 'Unknown',
            'product_weight_g': self.product_weight_g,
            'product_length_cm': self.product_length_cm,
            'product_height_cm': self.product_height_cm,
            'product_width_cm': self.product_width_cm,
            'current_price': self.current_price,
            'cost_price': cost,
            'minimum_price': self.get_minimum_price(),
            'maximum_price': self.get_maximum_price(),
            'target_margin': self.get_target_margin(),
            'brand': self.brand,
            'sku': self.sku or self.product_id,
            'supplier': self.supplier,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Seller(db.Model):
    __tablename__ = 'sellers'
    
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    seller_zip_code_prefix = db.Column(db.String(10), nullable=True)
    seller_city = db.Column(db.String(100), nullable=True)
    seller_state = db.Column(db.String(10), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'seller_id': self.seller_id,
            'seller_city': self.seller_city,
            'seller_state': self.seller_state
        }

class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    customer_unique_id = db.Column(db.String(64), nullable=True, index=True)
    customer_zip_code_prefix = db.Column(db.String(10), nullable=True)
    customer_city = db.Column(db.String(100), nullable=True)
    customer_state = db.Column(db.String(10), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'customer_unique_id': self.customer_unique_id,
            'customer_city': self.customer_city,
            'customer_state': self.customer_state
        }

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    order_status = db.Column(db.String(50), nullable=False, default='delivered')
    order_purchase_timestamp = db.Column(db.DateTime, nullable=True)
    order_approved_at = db.Column(db.DateTime, nullable=True)
    order_delivered_carrier_date = db.Column(db.DateTime, nullable=True)
    order_delivered_customer_date = db.Column(db.DateTime, nullable=True)
    order_estimated_delivery_date = db.Column(db.DateTime, nullable=True)
    total_amount = db.Column(db.Float, nullable=False, default=0.0)

    customer = db.relationship('Customer', backref='orders')

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'customer_id': self.customer_id,
            'order_status': self.order_status,
            'order_purchase_timestamp': self.order_purchase_timestamp.isoformat() if self.order_purchase_timestamp else None,
            'total_amount': self.total_amount
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    order_item_id = db.Column(db.Integer, nullable=False, default=1)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey('sellers.id'), nullable=True)
    shipping_limit_date = db.Column(db.DateTime, nullable=True)
    price = db.Column(db.Float, nullable=False)
    freight_value = db.Column(db.Float, nullable=False, default=0.0)

    order = db.relationship('Order', backref='items')
    product = db.relationship('Product', backref='order_items')
    seller = db.relationship('Seller', backref='order_items')

class PricingHistory(db.Model):
    __tablename__ = 'pricing_history'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    old_price = db.Column(db.Float, nullable=False)
    new_price = db.Column(db.Float, nullable=False)
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    change_reason = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'old_price': self.old_price,
            'new_price': self.new_price,
            'changed_by': self.changed_by,
            'change_reason': self.change_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Prediction(db.Model):
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.String(64), nullable=True)
    input_features = db.Column(db.Text, nullable=False)  # JSON string
    predicted_price = db.Column(db.Float, nullable=False)
    confidence_score = db.Column(db.Float, nullable=True)
    model_name = db.Column(db.String(100), default='Extra Trees Regressor')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'predicted_price': self.predicted_price,
            'confidence_score': self.confidence_score,
            'model_name': self.model_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class RevenueAnalytics(db.Model):
    __tablename__ = 'revenue_analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    period_type = db.Column(db.String(20), nullable=False)  # monthly, weekly
    period_value = db.Column(db.String(20), nullable=False) # e.g. 2017-09, 2018-W32
    total_revenue = db.Column(db.Float, nullable=False)
    total_orders = db.Column(db.Integer, nullable=False)
    avg_order_value = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DemandForecast(db.Model):
    __tablename__ = 'demand_forecasts'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.String(64), nullable=False)
    forecast_date = db.Column(db.String(20), nullable=False)
    forecasted_demand = db.Column(db.Float, nullable=False)
    lower_bound = db.Column(db.Float, nullable=True)
    upper_bound = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    endpoint = db.Column(db.String(255), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='audit_logs')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id or 1,
            'user_email': self.user.email if self.user else 'System',
            'action': self.action,
            'endpoint': self.endpoint or '/',
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else ''
        }

class Competitor(db.Model):
    __tablename__ = 'competitors'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False, index=True)
    website_url = db.Column(db.String(255), nullable=True)
    country = db.Column(db.String(50), default='BR')
    logo_url = db.Column(db.String(255), nullable=True)
    trust_score = db.Column(db.Float, default=1.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'website_url': self.website_url,
            'country': self.country,
            'logo_url': self.logo_url,
            'trust_score': self.trust_score,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class CompetitorCategory(db.Model):
    __tablename__ = 'competitor_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    competitor_id = db.Column(db.Integer, db.ForeignKey('competitors.id'), nullable=True)
    category_name = db.Column(db.String(100), nullable=False)
    category_code = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    competitor = db.relationship('Competitor', backref='categories')

    def to_dict(self):
        return {
            'id': self.id,
            'competitor_id': self.competitor_id,
            'competitor_name': self.competitor.name if self.competitor else None,
            'category_name': self.category_name,
            'category_code': self.category_code,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class CompetitorProduct(db.Model):
    __tablename__ = 'competitor_products'
    
    id = db.Column(db.Integer, primary_key=True)
    competitor_id = db.Column(db.Integer, db.ForeignKey('competitors.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    internal_product_sku = db.Column(db.String(64), nullable=True, index=True)
    competitor_sku = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    brand = db.Column(db.String(100), nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('competitor_categories.id'), nullable=True)
    product_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    competitor = db.relationship('Competitor', backref='products')
    internal_product = db.relationship('Product', backref='competitor_products')
    category = db.relationship('CompetitorCategory', backref='products')

    def to_dict(self):
        latest_price_rec = CompetitorPrice.query.filter_by(competitor_product_id=self.id).order_by(CompetitorPrice.recorded_at.desc()).first()
        return {
            'id': self.id,
            'competitor_id': self.competitor_id,
            'competitor_name': self.competitor.name if self.competitor else None,
            'product_id': self.product_id,
            'internal_product_sku': self.internal_product_sku or (self.internal_product.product_id if self.internal_product else None),
            'competitor_sku': self.competitor_sku,
            'title': self.title,
            'brand': self.brand,
            'category_id': self.category_id,
            'category_name': self.category.category_name if self.category else None,
            'product_url': self.product_url,
            'latest_price': latest_price_rec.price if latest_price_rec else None,
            'currency': latest_price_rec.currency if latest_price_rec else 'BRL',
            'availability': latest_price_rec.availability if latest_price_rec else 'in_stock',
            'source': latest_price_rec.source if latest_price_rec else 'MANUAL',
            'recorded_at': latest_price_rec.recorded_at.isoformat() if latest_price_rec and latest_price_rec.recorded_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class CompetitorPrice(db.Model):
    __tablename__ = 'competitor_prices'
    
    id = db.Column(db.Integer, primary_key=True)
    competitor_product_id = db.Column(db.Integer, db.ForeignKey('competitor_products.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), nullable=False, default='BRL')
    discount_percent = db.Column(db.Float, nullable=False, default=0.0)
    original_price = db.Column(db.Float, nullable=True)
    offer_details = db.Column(db.String(255), nullable=True)
    source = db.Column(db.String(50), nullable=False, default='CSV')  # CSV, API, MANUAL, SCRAPER
    availability = db.Column(db.String(50), nullable=False, default='in_stock') # in_stock, out_of_stock, limited_stock
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    competitor_product = db.relationship('CompetitorProduct', backref=db.backref('prices', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'competitor_product_id': self.competitor_product_id,
            'competitor_name': self.competitor_product.competitor.name if (self.competitor_product and self.competitor_product.competitor) else None,
            'competitor_sku': self.competitor_product.competitor_sku if self.competitor_product else None,
            'product_title': self.competitor_product.title if self.competitor_product else None,
            'internal_product_sku': self.competitor_product.internal_product_sku if self.competitor_product else None,
            'price': self.price,
            'currency': self.currency,
            'discount_percent': self.discount_percent,
            'original_price': self.original_price or self.price,
            'offer_details': self.offer_details,
            'source': self.source,
            'availability': self.availability,
            'timestamp': self.recorded_at.isoformat() if self.recorded_at else None,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None
        }

class PriceRecommendation(db.Model):
    __tablename__ = 'price_recommendations'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    recommendation_type = db.Column(db.String(50), nullable=False)
    current_price = db.Column(db.Float, nullable=False)
    recommended_price = db.Column(db.Float, nullable=False)
    price_change_pct = db.Column(db.Float, nullable=False, default=0.0)
    confidence_score = db.Column(db.Float, nullable=False, default=0.85)
    market_position = db.Column(db.String(50), nullable=True)
    expected_margin = db.Column(db.Float, nullable=True)
    expected_revenue = db.Column(db.Float, nullable=True)
    expected_profit = db.Column(db.Float, nullable=True)
    expected_roi = db.Column(db.Float, nullable=True)
    risk_level = db.Column(db.String(50), nullable=True, default='MEDIUM')
    strategy_type = db.Column(db.String(50), nullable=True, default='REVENUE_MAXIMIZATION')
    simulation_id = db.Column(db.String(64), nullable=True)
    explanation = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship('Product', backref=db.backref('recommendations', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_sku': self.product.product_id if self.product else None,
            'category_name': self.product.category.category_name if (self.product and self.product.category) else 'Uncategorized',
            'recommendation_type': self.recommendation_type,
            'current_price': self.current_price,
            'recommended_price': self.recommended_price,
            'price_change_pct': self.price_change_pct,
            'confidence_score': self.confidence_score,
            'market_position': self.market_position,
            'expected_margin': self.expected_margin,
            'expected_revenue': self.expected_revenue,
            'expected_profit': self.expected_profit,
            'expected_roi': self.expected_roi,
            'risk_level': self.risk_level or 'MEDIUM',
            'strategy_type': self.strategy_type or 'REVENUE_MAXIMIZATION',
            'simulation_id': self.simulation_id,
            'explanation': self.explanation,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


