from flask import Blueprint, request, jsonify
from app.services.alert_service import AlertService

alert_bp = Blueprint('alerts', __name__)

@alert_bp.route('', methods=['GET'])
def get_alerts():
    """
    Get active business notifications and critical alerts.
    ---
    tags:
      - Business Alerts
    responses:
      200:
        description: List of active business alerts
    """
    try:
        res = AlertService.get_active_business_alerts()
        return jsonify(res), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch business alerts: {str(e)}'}), 500

@alert_bp.route('/acknowledge', methods=['POST'])
def acknowledge_alert():
    """
    Acknowledge a business alert.
    ---
    tags:
      - Business Alerts
    """
    try:
        data = request.get_json() or {}
        alert_id = data.get('alert_id')
        if not alert_id:
            return jsonify({'error': 'alert_id is required'}), 400

        return jsonify({'message': f'Alert {alert_id} acknowledged successfully', 'status': 'ACKNOWLEDGED'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to acknowledge alert: {str(e)}'}), 500
