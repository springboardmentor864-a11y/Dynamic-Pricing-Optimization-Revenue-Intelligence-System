from flask import Blueprint, request, jsonify
from app.models import Product
from app.services.market_intelligence_engine import MarketIntelligenceEngine
from app.services.trend_engine import TrendAndOpportunityEngine

market_bp = Blueprint('market', __name__)

@market_bp.route('/overview', methods=['GET'])
def get_market_overview():
    """
    Get catalog-wide Market Intelligence & Business Intelligence Overview.
    ---
    tags:
      - Market Intelligence
    parameters:
      - in: query
        name: category_id
        type: integer
      - in: query
        name: position
        type: string
      - in: query
        name: risk
        type: string
    responses:
      200:
        description: Catalog market overview metrics & summary
    """
    try:
        category_id = request.args.get('category_id', type=int)
        position = request.args.get('position')
        risk = request.args.get('risk')

        overview = MarketIntelligenceEngine.get_market_overview(
            category_id=category_id,
            position_filter=position,
            risk_filter=risk
        )
        return jsonify(overview), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch market overview: {str(e)}'}), 500

@market_bp.route('/trends', methods=['GET'])
def get_market_trends():
    """
    Get price movement trends and rolling average statistics across catalog.
    ---
    tags:
      - Market Intelligence
    """
    try:
        limit = request.args.get('limit', default=50, type=int)
        search = request.args.get('search')
        days = request.args.get('days', default=30, type=int)

        query = Product.query
        if search:
            query = query.filter(Product.product_id.ilike(f"%{search.strip()}%"))

        products = query.limit(limit).all()
        trend_results = []

        direction_counts = {'Increasing': 0, 'Decreasing': 0, 'Stable': 0, 'Highly Volatile': 0}

        for p in products:
            trend_data = TrendAndOpportunityEngine.calculate_rolling_trends(p.product_id, days=days)
            direction = trend_data['trend_direction']
            direction_counts[direction] = direction_counts.get(direction, 0) + 1
            trend_results.append({
                'product_db_id': p.id,
                'product_id': p.product_id,
                'current_price': p.current_price,
                'trend_direction': direction,
                'weekly_change_pct': trend_data['weekly_change_pct'],
                'monthly_change_pct': trend_data['monthly_change_pct'],
                'rolling_7d_avg': trend_data['rolling_7d_avg'],
                'rolling_14d_avg': trend_data['rolling_14d_avg'],
                'rolling_30d_avg': trend_data['rolling_30d_avg'],
                'moving_std_dev': trend_data['moving_std_dev'],
                'explanation': trend_data['explanation']
            })

        return jsonify({
            'summary': {
                'total_analyzed': len(products),
                'direction_counts': direction_counts
            },
            'trends': trend_results
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch market trends: {str(e)}'}), 500

@market_bp.route('/opportunities', methods=['GET'])
def get_market_opportunities():
    """
    Fetch auto-detected pricing opportunities and recommendations.
    ---
    tags:
      - Market Intelligence
    """
    try:
        type_filter = request.args.get('type')
        limit = request.args.get('limit', default=50, type=int)
        offset = request.args.get('offset', default=0, type=int)

        results = TrendAndOpportunityEngine.run_catalog_opportunity_scan(
            type_filter=type_filter,
            limit=limit,
            offset=offset
        )
        return jsonify(results), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch market opportunities: {str(e)}'}), 500

@market_bp.route('/positioning', methods=['GET'])
def get_market_positioning():
    """
    Fetch competitive positioning matrix breakdown across catalog.
    ---
    tags:
      - Market Intelligence
    """
    try:
        overview = MarketIntelligenceEngine.get_market_overview()
        summary = overview['summary']

        total = summary['total_products'] or 1
        pos_pcts = {
            k: round((v / total) * 100.0, 1)
            for k, v in summary['position_counts'].items()
        }

        return jsonify({
            'position_counts': summary['position_counts'],
            'position_percentages': pos_pcts,
            'total_products': total
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch market positioning: {str(e)}'}), 500

@market_bp.route('/volatility', methods=['GET'])
def get_market_volatility():
    """
    Fetch price volatility scores, standard deviation rankings, and stability metrics.
    ---
    tags:
      - Market Intelligence
    """
    try:
        overview = MarketIntelligenceEngine.get_market_overview()
        products = overview['products']

        # Sort by highest volatility
        volatile_items = sorted(
            [p for p in products if p['average_market_price'] is not None],
            key=lambda x: x['price_volatility_pct'],
            reverse=True
        )

        return jsonify({
            'avg_catalog_volatility_pct': overview['summary']['avg_catalog_volatility_pct'],
            'catalog_stability_score': overview['summary']['catalog_stability_score'],
            'risk_counts': overview['summary']['risk_counts'],
            'volatile_products': volatile_items[:20]
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch market volatility: {str(e)}'}), 500

@market_bp.route('/product/<string:product_identifier>', methods=['GET'])
def get_product_market_intelligence(product_identifier):
    """
    Get deep-dive market intelligence profile for a specific product ID or database ID.
    ---
    tags:
      - Market Intelligence
    """
    try:
        product = Product.query.filter_by(product_id=product_identifier).first()
        if not product and product_identifier.isdigit():
            product = Product.query.get(int(product_identifier))

        if not product:
            return jsonify({'error': f'Product not found: {product_identifier}'}), 404

        market_analysis = MarketIntelligenceEngine.analyze_product_market(product)
        trend_analysis = TrendAndOpportunityEngine.calculate_rolling_trends(product.product_id, days=30)
        opportunity = TrendAndOpportunityEngine.evaluate_product_opportunities(product)

        return jsonify({
            'product': product.to_dict(),
            'market_analysis': market_analysis,
            'trend_analysis': trend_analysis,
            'opportunity': opportunity
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch product market intelligence: {str(e)}'}), 500
