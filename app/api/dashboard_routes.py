from flask import Blueprint, jsonify, request
from app.services.data_service import data_service
from app.auth import jwt_required

dashboard_bp = Blueprint('dashboard_bp', __name__)

def _extract_filters():
    return {
        'range': request.args.get('range', 'all'),
        'category': request.args.get('category', 'all'),
        'state': request.args.get('state', 'all'),
        'payment': request.args.get('payment', 'all')
    }

@dashboard_bp.route('/summary', methods=['GET'])
def get_summary():
    return jsonify(data_service.get_dashboard_summary(_extract_filters())), 200

@dashboard_bp.route('/top-products', methods=['GET'])
def get_top_products():
    return jsonify(data_service.get_top_products()), 200

@dashboard_bp.route('/top-sellers', methods=['GET'])
def get_top_sellers():
    return jsonify(data_service.get_top_sellers()), 200

@dashboard_bp.route('/monthly-revenue', methods=['GET'])
def get_monthly_revenue():
    return jsonify(data_service.get_monthly_revenue(_extract_filters())), 200

@dashboard_bp.route('/weekly-revenue', methods=['GET'])
def get_weekly_revenue():
    return jsonify(data_service.get_weekly_revenue(_extract_filters())), 200

@dashboard_bp.route('/profit-margin', methods=['GET'])
def get_profit_margin():
    return jsonify(data_service.get_profit_margin_trend(_extract_filters())), 200

@dashboard_bp.route('/customer-insights', methods=['GET'])
def get_customer_insights():
    return jsonify(data_service.get_customer_insights(_extract_filters())), 200
