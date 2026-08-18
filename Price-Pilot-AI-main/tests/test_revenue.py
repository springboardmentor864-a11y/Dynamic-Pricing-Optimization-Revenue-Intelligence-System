import pytest
from app.models import db, Product, Category, CompetitorPrice, PriceRecommendation, DemandForecast
from app.services.revenue_optimization_engine import RevenueOptimizationEngine
from app.services.pricing_strategy_engine import PricingStrategyEngine
from app.services.simulation_engine import SimulationEngine
from app.services.profitability_service import ProfitabilityService

def test_revenue_optimization_engine(app):
    """Test cost price, breakeven price, optimal price, and projected profit/ROI math."""
    with app.app_context():
        prod = Product(product_id="REV-TEST-SKU", current_price=100.0, cost_price=60.0, target_margin=0.35)
        db.session.add(prod)
        db.session.commit()

        metrics = RevenueOptimizationEngine.calculate_product_revenue_metrics(prod)

        assert metrics['cost_price'] == 60.0
        assert metrics['current_price'] == 100.0
        # Breakeven = cost / (1 - 0.35) = 60 / 0.65 = 92.31
        assert metrics['breakeven_price'] == round(60.0 / 0.65, 2)
        assert metrics['optimal_selling_price'] > 60.0
        assert metrics['projected_revenue'] > 0.0
        assert metrics['projected_profit'] > 0.0
        assert 'expected_roi' in metrics

def test_pricing_strategy_engine(app):
    """Test AI pricing strategy generation, risk levels, confidence scores, and DB persistence."""
    with app.app_context():
        # Case 1: Normal product -> Revenue Maximization / Premium
        prod1 = Product(product_id="STRAT-PROD-1", current_price=200.0, cost_price=100.0)
        db.session.add(prod1)

        # Case 2: Loss making product -> Loss Prevention
        prod2 = Product(product_id="STRAT-PROD-2", current_price=50.0, cost_price=50.0)
        db.session.add(prod2)
        db.session.commit()

        strat1 = PricingStrategyEngine.generate_strategy_for_product(prod1)
        assert strat1['strategy_type'] in PricingStrategyEngine.STRATEGIES
        assert strat1['confidence_score'] >= 0.70
        assert strat1['risk_level'] in ['LOW', 'MEDIUM', 'HIGH']

        strat2 = PricingStrategyEngine.generate_strategy_for_product(prod2)
        assert strat2['strategy_type'] == 'Loss Prevention'
        assert strat2['recommended_price'] > 50.0
        assert strat2['risk_level'] == 'HIGH'

        # Verify DB persistence in PriceRecommendation
        rec_obj = PriceRecommendation.query.filter_by(product_id=prod2.id).first()
        assert rec_obj is not None
        assert rec_obj.strategy_type == 'Loss Prevention'

def test_whatif_scenario_simulation(app):
    """Test What-If simulation engine with multi-variable price/cost/demand adjustments."""
    with app.app_context():
        prod = Product(product_id="SIM-TEST-SKU", current_price=100.0, cost_price=60.0)
        db.session.add(prod)
        db.session.commit()

        sim = SimulationEngine.simulate_product_scenario(
            product_identifier="SIM-TEST-SKU",
            price_change_pct=10.0,           # +10% price
            competitor_price_change_pct=5.0, # +5% competitor move
            cost_change_pct=8.0,             # +8% cost inflation
            demand_multiplier=1.2            # 1.2x demand bump
        )

        assert sim['baseline']['price'] == 100.0
        assert sim['simulation']['price'] == 110.0
        assert sim['simulation']['cost'] == 64.80
        assert sim['impact']['revenue_delta_abs'] is not None
        assert len(sim['sensitivity_analysis']) == 11

def test_profitability_service(app):
    """Test catalog profitability analytics, gross profit, net profit, and best/worst SKUs."""
    with app.app_context():
        p1 = Product(product_id="PROF-HIGH", current_price=500.0, cost_price=200.0)
        p2 = Product(product_id="PROF-LOW", current_price=40.0, cost_price=38.0)
        db.session.add_all([p1, p2])
        db.session.commit()

        prof_data = ProfitabilityService.get_profitability_analytics()
        summary = prof_data['summary']

        assert summary['total_gross_revenue'] > 0.0
        assert summary['total_gross_profit'] > 0.0
        assert len(prof_data['best_performing_products']) > 0
        assert len(prof_data['worst_performing_products']) > 0

def test_revenue_optimization_apis(client, app):
    """Test REST API endpoints under /api/revenue."""
    with app.app_context():
        prod = Product(product_id="REV-API-SKU", current_price=120.0, cost_price=70.0)
        db.session.add(prod)
        db.session.commit()

    # 1. GET /api/revenue/overview
    res_overview = client.get('/api/revenue/overview')
    assert res_overview.status_code == 200
    assert 'summary' in res_overview.get_json()

    # 2. GET /api/revenue/profitability
    res_prof = client.get('/api/revenue/profitability')
    assert res_prof.status_code == 200
    assert 'summary' in res_prof.get_json()

    # 3. GET /api/revenue/recommendations
    res_recs = client.get('/api/revenue/recommendations')
    assert res_recs.status_code == 200
    assert 'recommendations' in res_recs.get_json()

    # 4. GET /api/revenue/simulation
    res_sim_base = client.get('/api/revenue/simulation')
    assert res_sim_base.status_code == 200
    assert 'summary' in res_sim_base.get_json()

    # 5. POST /api/revenue/simulate
    res_sim_post = client.post('/api/revenue/simulate', json={
        'product_id': 'REV-API-SKU',
        'price_change_pct': 5.0,
        'cost_change_pct': 2.0,
        'demand_multiplier': 1.1
    })
    assert res_sim_post.status_code == 200
    assert res_sim_post.get_json()['simulation']['price'] == 126.0

    # 6. GET /api/revenue/product/<id>
    res_prod = client.get('/api/revenue/product/REV-API-SKU')
    assert res_prod.status_code == 200
    assert res_prod.get_json()['product']['product_id'] == 'REV-API-SKU'
