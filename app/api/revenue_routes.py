from flask import Blueprint, request, jsonify
from app.models import Product
from app.services.revenue_optimization_engine import RevenueOptimizationEngine
from app.services.pricing_strategy_engine import PricingStrategyEngine
from app.services.simulation_engine import SimulationEngine
from app.services.profitability_service import ProfitabilityService

revenue_bp = Blueprint('revenue', __name__)

@revenue_bp.route('/overview', methods=['GET'])
def get_revenue_overview():
    """
    Get catalog Revenue Optimization Overview & financial KPIs.
    ---
    tags:
      - Revenue Optimization
    parameters:
      - in: query
        name: category_id
        type: integer
    responses:
      200:
        description: Revenue and profit metrics summary
    """
    try:
        category_id = request.args.get('category_id', type=int)
        overview = RevenueOptimizationEngine.get_catalog_revenue_overview(category_id=category_id)
        return jsonify(overview), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch revenue overview: {str(e)}'}), 500

@revenue_bp.route('/profitability', methods=['GET'])
def get_profitability():
    """
    Get profitability analytics, contribution margins, and best/worst performing products.
    ---
    tags:
      - Revenue Optimization
    """
    try:
        category_id = request.args.get('category_id', type=int)
        analytics = ProfitabilityService.get_profitability_analytics(category_id=category_id)
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch profitability analytics: {str(e)}'}), 500

@revenue_bp.route('/recommendations', methods=['GET'])
def get_strategy_recommendations():
    """
    Get AI pricing strategy recommendations with confidence scores & risk levels.
    ---
    tags:
      - Revenue Optimization
    """
    try:
        strategy = request.args.get('strategy')
        risk = request.args.get('risk')
        limit = request.args.get('limit', default=50, type=int)
        offset = request.args.get('offset', default=0, type=int)

        results = PricingStrategyEngine.get_catalog_strategies(
            strategy_filter=strategy,
            risk_filter=risk,
            limit=limit,
            offset=offset
        )
        return jsonify(results), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch pricing strategy recommendations: {str(e)}'}), 500

@revenue_bp.route('/simulation', methods=['GET'])
def get_default_simulation():
    """
    Get macro catalog simulation baseline and default scenario breakdown.
    ---
    tags:
      - What-If Simulation Engine
    """
    try:
        price_pct = request.args.get('price_change_pct', default=0.0, type=float)
        cost_pct = request.args.get('cost_change_pct', default=0.0, type=float)
        demand_mult = request.args.get('demand_multiplier', default=1.0, type=float)

        sim_res = SimulationEngine.simulate_catalog_scenario(
            price_change_pct=price_pct,
            cost_change_pct=cost_pct,
            demand_multiplier=demand_mult
        )
        return jsonify(sim_res), 200
    except Exception as e:
        return jsonify({'error': f'Failed to run catalog simulation: {str(e)}'}), 500

@revenue_bp.route('/simulate', methods=['POST'])
def run_scenario_simulation():
    """
    Run custom What-If Scenario simulation for a specific product or SKU.
    ---
    tags:
      - What-If Simulation Engine
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            product_id:
              type: string
            price_change_pct:
              type: number
            competitor_price_change_pct:
              type: number
            cost_change_pct:
              type: number
            demand_multiplier:
              type: number
    responses:
      200:
        description: Simulation impact results & sensitivity grid
    """
    try:
        data = request.get_json() or {}
        product_id = data.get('product_id')

        if not product_id:
            # Fallback to first product in database if omitted
            first_prod = Product.query.first()
            if not first_prod:
                return jsonify({'error': 'No products in database for simulation'}), 404
            product_id = first_prod.product_id

        price_pct = float(data.get('price_change_pct', 0.0))
        comp_price_pct = float(data.get('competitor_price_change_pct', 0.0))
        cost_pct = float(data.get('cost_change_pct', 0.0))
        demand_mult = float(data.get('demand_multiplier', 1.0))

        sim_result = SimulationEngine.simulate_product_scenario(
            product_identifier=product_id,
            price_change_pct=price_pct,
            competitor_price_change_pct=comp_price_pct,
            cost_change_pct=cost_pct,
            demand_multiplier=demand_mult
        )
        return jsonify(sim_result), 200

    except Exception as e:
        return jsonify({'error': f'Simulation execution failed: {str(e)}'}), 500

@revenue_bp.route('/product/<string:product_identifier>', methods=['GET'])
def get_product_revenue_profile(product_identifier):
    """
    Get deep-dive revenue optimization & break-even profile for a product.
    ---
    tags:
      - Revenue Optimization
    """
    try:
        product = Product.query.filter_by(product_id=product_identifier).first()
        if not product and product_identifier.isdigit():
            product = Product.query.get(int(product_identifier))

        if not product:
            return jsonify({'error': f'Product not found: {product_identifier}'}), 404

        rev_metrics = RevenueOptimizationEngine.calculate_product_revenue_metrics(product)
        strategy = PricingStrategyEngine.generate_strategy_for_product(product)
        baseline_sim = SimulationEngine.simulate_product_scenario(product.product_id)

        return jsonify({
            'product': product.to_dict(),
            'revenue_metrics': rev_metrics,
            'strategy': strategy,
            'sensitivity_analysis': baseline_sim['sensitivity_analysis']
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch product revenue profile: {str(e)}'}), 500
