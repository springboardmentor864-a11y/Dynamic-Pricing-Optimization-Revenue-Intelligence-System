from flask import Blueprint, request, jsonify
from app.services.executive_bi_service import ExecutiveBIService

bi_bp = Blueprint('bi', __name__)

@bi_bp.route('/overview', methods=['GET'])
def get_executive_overview():
    """
    Get Executive Business Intelligence KPIs, positioning matrix, and risk summary.
    ---
    tags:
      - Executive BI
    parameters:
      - in: query
        name: category_id
        type: integer
      - in: query
        name: risk
        type: string
      - in: query
        name: strategy
        type: string
    responses:
      200:
        description: Executive BI summary and KPIs
    """
    try:
        category_id = request.args.get('category_id', type=int)
        risk = request.args.get('risk')
        strategy = request.args.get('strategy')

        res = ExecutiveBIService.get_executive_overview(
            category_id=category_id,
            risk_filter=risk,
            strategy_filter=strategy
        )
        return jsonify(res), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch executive BI overview: {str(e)}'}), 500

@bi_bp.route('/drilldown', methods=['GET'])
def get_hierarchical_drilldown():
    """
    Get hierarchical drill-down metrics (Category -> Product level).
    ---
    tags:
      - Executive BI
    """
    try:
        dimension = request.args.get('dimension', default='category')
        parent_id = request.args.get('parent_id')

        res = ExecutiveBIService.get_hierarchical_drilldown(dimension=dimension, parent_id=parent_id)
        return jsonify(res), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch BI drilldown: {str(e)}'}), 500
