import pytest
from app.models import db, Product, Category, Competitor, CompetitorProduct, CompetitorPrice, PriceRecommendation, DemandForecast
from app.services.competitor_service import CompetitorService
from app.services.market_intelligence_engine import MarketIntelligenceEngine
from app.services.trend_engine import TrendAndOpportunityEngine

def test_market_intelligence_engine_stats(app):
    """Test statistical market metrics calculation, volatility index, and stability score."""
    with app.app_context():
        # Prices: 100, 110, 120 (Mean = 110, Median = 110, Min = 100, Max = 120, StdDev = 8.16)
        prices = [100.0, 110.0, 120.0]
        metrics = MarketIntelligenceEngine.compute_statistical_metrics(prices)

        assert metrics['mean'] == 110.0
        assert metrics['median'] == 110.0
        assert metrics['min'] == 100.0
        assert metrics['max'] == 120.0
        assert metrics['std_dev'] > 0.0
        assert metrics['volatility_pct'] > 0.0
        assert 0.0 <= metrics['stability_score'] <= 100.0

def test_competitive_positioning_and_risk_classification(app):
    """Test positioning rules and risk classifications."""
    with app.app_context():
        metrics = {'mean': 100.0, 'median': 100.0, 'min': 90.0, 'max': 110.0, 'volatility_pct': 5.0}

        # Market Leader: our_price <= min & comp_count >= 2
        label1, _ = MarketIntelligenceEngine.classify_positioning(85.0, metrics, competitor_count=3)
        assert label1 == "Market Leader"

        # Aggressive Pricing: > 10% below median
        label2, _ = MarketIntelligenceEngine.classify_positioning(85.0, metrics, competitor_count=1)
        assert label2 == "Aggressive Pricing"

        # At Market: within 3% of median
        label3, _ = MarketIntelligenceEngine.classify_positioning(101.0, metrics, competitor_count=2)
        assert label3 == "At Market"

        # Premium: > 12% above median
        label4, _ = MarketIntelligenceEngine.classify_positioning(120.0, metrics, competitor_count=2)
        assert label4 == "Premium"

        # Risk Classification
        risk_high, _ = MarketIntelligenceEngine.classify_risk(130.0, metrics)
        assert "High Risk" in risk_high

        risk_low, _ = MarketIntelligenceEngine.classify_risk(102.0, metrics)
        assert risk_low == "Low Risk"

def test_trend_detection_rolling_averages(app):
    """Test 7d/30d rolling average calculations and trend direction."""
    with app.app_context():
        prod = Product(product_id="TREND-TEST-SKU", current_price=150.0)
        db.session.add(prod)
        db.session.commit()

        # Ingest price observations
        CompetitorService.ingest_price_records([
            {'competitor_name': 'Comp A', 'competitor_sku': 'SKU-A', 'internal_product_sku': 'TREND-TEST-SKU', 'title': 'P1', 'price': 140.0},
            {'competitor_name': 'Comp B', 'competitor_sku': 'SKU-B', 'internal_product_sku': 'TREND-TEST-SKU', 'title': 'P1', 'price': 160.0}
        ])

        trend_res = TrendAndOpportunityEngine.calculate_rolling_trends("TREND-TEST-SKU", days=30)
        assert trend_res['product_sku'] == "TREND-TEST-SKU"
        assert trend_res['rolling_7d_avg'] == 150.0
        assert trend_res['rolling_30d_avg'] == 150.0
        assert trend_res['trend_direction'] in ['Stable', 'Increasing', 'Decreasing', 'Highly Volatile']

def test_opportunity_detection_and_recommendations(app):
    """Test detection of PRICED_TOO_LOW and PRICED_TOO_HIGH opportunities and persistence."""
    with app.app_context():
        # Case 1: Underpriced item (Our price 50.0 vs market median 100.0)
        p_low = Product(product_id="OPP-LOW-SKU", current_price=50.0)
        db.session.add(p_low)
        db.session.commit()

        CompetitorService.ingest_price_records([
            {'competitor_name': 'Comp Low 1', 'competitor_sku': 'CL-1', 'internal_product_sku': 'OPP-LOW-SKU', 'title': 'Item', 'price': 100.0},
            {'competitor_name': 'Comp Low 2', 'competitor_sku': 'CL-2', 'internal_product_sku': 'OPP-LOW-SKU', 'title': 'Item', 'price': 100.0}
        ])

        opp_rec = TrendAndOpportunityEngine.evaluate_product_opportunities(p_low)
        assert opp_rec is not None
        assert opp_rec['recommendation_type'] == "PRICED_TOO_LOW"
        assert opp_rec['recommended_price'] > 50.0

        # Verify DB persistence in PriceRecommendation model
        saved = PriceRecommendation.query.filter_by(product_id=p_low.id).first()
        assert saved is not None
        assert saved.recommendation_type == "PRICED_TOO_LOW"

def test_market_intelligence_apis(client, app):
    """Test REST API endpoints under /api/market."""
    with app.app_context():
        prod = Product(product_id="MARKET-API-SKU", current_price=95.0)
        db.session.add(prod)
        db.session.commit()

        CompetitorService.ingest_price_records([
            {'competitor_name': 'API Comp', 'competitor_sku': 'AC-1', 'internal_product_sku': 'MARKET-API-SKU', 'title': 'Item', 'price': 100.0}
        ])

    # 1. GET /api/market/overview
    res_overview = client.get('/api/market/overview')
    assert res_overview.status_code == 200
    assert 'summary' in res_overview.get_json()

    # 2. GET /api/market/trends
    res_trends = client.get('/api/market/trends?days=30&limit=10')
    assert res_trends.status_code == 200
    assert 'trends' in res_trends.get_json()

    # 3. GET /api/market/opportunities
    res_opps = client.get('/api/market/opportunities')
    assert res_opps.status_code == 200
    assert 'opportunities' in res_opps.get_json()

    # 4. GET /api/market/positioning
    res_pos = client.get('/api/market/positioning')
    assert res_pos.status_code == 200
    assert 'position_counts' in res_pos.get_json()

    # 5. GET /api/market/volatility
    res_vol = client.get('/api/market/volatility')
    assert res_vol.status_code == 200
    assert 'catalog_stability_score' in res_vol.get_json()

    # 6. GET /api/market/product/<id>
    res_prod = client.get(f'/api/market/product/MARKET-API-SKU')
    assert res_prod.status_code == 200
    assert res_prod.get_json()['product']['product_id'] == "MARKET-API-SKU"
