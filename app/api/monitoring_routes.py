from flask import Blueprint, jsonify
from app.services.monitoring_service import MonitoringService

monitoring_bp = Blueprint('monitoring', __name__)

@monitoring_bp.route('/health', methods=['GET'])
def get_system_health():
    """
    Get live system health, database pool, ML model state, memory usage, and latency.
    ---
    tags:
      - System Monitoring
    responses:
      200:
        description: System health status dictionary
    """
    try:
        health = MonitoringService.get_system_health()
        return jsonify(health), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch system health: {str(e)}'}), 500
