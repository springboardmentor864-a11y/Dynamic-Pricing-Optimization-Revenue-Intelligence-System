from flask import Blueprint, jsonify, request
from app.models import db, AuditLog

admin_bp = Blueprint('admin_bp', __name__)

@admin_bp.route('/audit-logs', methods=['GET'])
def get_audit_logs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # If no logs exist, seed default initial logs
    if AuditLog.query.count() == 0:
        seed_logs = [
            AuditLog(action='LOGIN', endpoint='/api/auth/login', user_id=1, status='SUCCESS'),
            AuditLog(action='PREDICT_PRICE', endpoint='/api/pricing/predict-price', user_id=1, status='SUCCESS'),
            AuditLog(action='FORECAST_DEMAND', endpoint='/api/pricing/forecast-demand', user_id=1, status='SUCCESS'),
            AuditLog(action='OPTIMIZE_PRICE', endpoint='/api/pricing/optimize-price', user_id=1, status='SUCCESS')
        ]
        db.session.add_all(seed_logs)
        db.session.commit()

    logs_pagination = AuditLog.query.order_by(AuditLog.timestamp.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'logs': [log.to_dict() for log in logs_pagination.items],
        'total': logs_pagination.total,
        'page': logs_pagination.page,
        'pages': logs_pagination.pages
    }), 200
