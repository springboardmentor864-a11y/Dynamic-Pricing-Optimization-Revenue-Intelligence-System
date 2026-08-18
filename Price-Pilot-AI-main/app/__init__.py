import os
from flask import Flask, render_template, jsonify
from flask_cors import CORS
from app.config import Config
from app.models import db, User
from app.auth import bcrypt, hash_password

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='static', template_folder='templates')
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    CORS(app)

    # Initialize Flasgger Swagger UI if installed
    try:
        from flasgger import Swagger
        Swagger(app, template={
            "info": {
                "title": "PricePilot AI API",
                "description": "Production-grade ML Dynamic Pricing and Revenue Intelligence API",
                "version": "1.2.0"
            }
        })
    except ImportError:
        pass

    # Register API Blueprints
    from app.api.auth_routes import auth_bp
    from app.api.pricing_routes import pricing_bp
    from app.api.dashboard_routes import dashboard_bp
    from app.api.product_routes import product_bp
    from app.api.order_routes import order_bp
    from app.api.analytics_routes import analytics_bp
    from app.api.admin_routes import admin_bp
    from app.api.competitor_routes import competitor_bp
    from app.api.market_routes import market_bp
    from app.api.revenue_routes import revenue_bp
    from app.api.bi_routes import bi_bp
    from app.api.report_routes import report_bp
    from app.api.alert_routes import alert_bp
    from app.api.monitoring_routes import monitoring_bp
    from app.api.health_routes import health_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(pricing_bp, url_prefix='/api/pricing')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(product_bp, url_prefix='/api/products')
    app.register_blueprint(order_bp, url_prefix='/api/orders')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(competitor_bp, url_prefix='/api/competitors')
    app.register_blueprint(market_bp, url_prefix='/api/market')
    app.register_blueprint(revenue_bp, url_prefix='/api/revenue')
    app.register_blueprint(bi_bp, url_prefix='/api/bi')
    app.register_blueprint(report_bp, url_prefix='/api/reports')
    app.register_blueprint(alert_bp, url_prefix='/api/alerts')
    app.register_blueprint(monitoring_bp, url_prefix='/api/monitoring')
    app.register_blueprint(health_bp)

    # Main SPA Route
    @app.route('/')
    def index():
        return render_template('index.html')

    # Security Headers Middleware
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    # Auto-initialize database tables and seed default users
    with app.app_context():
        os.makedirs(app.config['SQLITE_PATH'].parent, exist_ok=True)
        db.create_all()

        # Seed default users for testing if DB is empty
        if User.query.count() == 0:
            seed_users = [
                User(name='System Admin', email='admin@pricepilot.ai', password_hash=hash_password('admin123'), role='Admin'),
                User(name='Pricing Lead', email='pricing@pricepilot.ai', password_hash=hash_password('pricing123'), role='Pricing Manager'),
                User(name='Business Analyst', email='analyst@pricepilot.ai', password_hash=hash_password('analyst123'), role='Business Analyst')
            ]
            db.session.add_all(seed_users)
            db.session.commit()

        # Seed catalog products, competitor price feeds, and forecasts
        try:
            from app.services.seeder import seed_catalog_and_competitors
            seed_catalog_and_competitors()
        except Exception as e:
            app.logger.warning(f"Database seeder warning: {str(e)}")

    return app
