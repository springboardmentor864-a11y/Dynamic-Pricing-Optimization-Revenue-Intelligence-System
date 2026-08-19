import os
from flask import Blueprint, jsonify
from app.models import db, User

health_bp = Blueprint('health_bp', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Basic Liveness Health Check Probe."""
    return jsonify({
        'status': 'healthy',
        'service': 'PricePilot AI Revenue Intelligence',
        'version': '1.2.0'
    }), 200

@health_bp.route('/readiness', methods=['GET'])
def readiness_check():
    """Detailed Readiness Probe checking Database, ML models, and Storage."""
    checks = {
        'database': False,
        'demand_model': False,
        'elasticity_model': False,
        'best_model': False
    }

    # 1. Test Database connectivity
    try:
        db.session.query(User).first()
        checks['database'] = True
    except Exception as e:
        checks['database_error'] = str(e)

    # 2. Check ML model files existence
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    models_dir = os.path.join(base_dir, 'outputs', 'models')

    checks['demand_model'] = os.path.exists(os.path.join(models_dir, 'demand_model.pkl'))
    checks['elasticity_model'] = os.path.exists(os.path.join(models_dir, 'elasticity_model.pkl'))
    checks['best_model'] = os.path.exists(os.path.join(models_dir, 'best_model.pkl'))

    is_ready = all([checks['database'], checks['demand_model'], checks['elasticity_model'], checks['best_model']])
    status_code = 200 if is_ready else 503

    return jsonify({
        'ready': is_ready,
        'checks': checks
    }), status_code
