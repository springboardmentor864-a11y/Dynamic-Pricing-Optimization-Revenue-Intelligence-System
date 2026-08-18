from flask import Blueprint, jsonify
from app.services.data_service import data_service

analytics_bp = Blueprint('analytics_bp', __name__)

@analytics_bp.route('/feature-importance', methods=['GET'])
def get_feature_importance():
    return jsonify(data_service.get_feature_importance()), 200

@analytics_bp.route('/model-performance', methods=['GET'])
def get_model_performance():
    return jsonify(data_service.get_model_performance()), 200

@analytics_bp.route('/sales-analytics', methods=['GET'])
def get_sales_analytics():
    summary = data_service.get_dashboard_summary()
    monthly = data_service.get_monthly_revenue()
    top_prods = data_service.get_top_products(5)
    return jsonify({
        'summary': summary,
        'monthly': monthly,
        'top_products': top_prods
    }), 200

@analytics_bp.route('/demand-analytics', methods=['GET'])
def get_demand_analytics():
    top_prods = data_service.get_top_products(10)
    cat_demand = [
        {
            'category': p['category'],
            'demand_units': p['total_orders'],
            'total_revenue': p['total_revenue'],
            'avg_price': p['avg_price']
        }
        for p in top_prods
    ]
    return jsonify({
        'categories_demand': cat_demand
    }), 200
