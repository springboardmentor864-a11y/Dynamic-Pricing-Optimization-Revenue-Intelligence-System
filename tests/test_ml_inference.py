def test_predict_price_api(client, admin_token):
    payload = {
        'product_id': 'health_beauty_001',
        'price': 150.0,
        'freight_value': 25.0,
        'product_weight_g': 1200.0,
        'product_length_cm': 30.0,
        'product_height_cm': 20.0,
        'product_width_cm': 20.0,
        'category_name': 'bed_bath_table'
    }
    res = client.post('/api/pricing/predict-price', json=payload, headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    data = res.get_json()
    assert 'predicted_price' in data
    assert data['predicted_price'] > 0
    assert 'confidence_score' in data
    assert 0.5 <= data['confidence_score'] <= 1.0
    assert data['model_used'] in ['XGBRegressor', 'ExtraTreesRegressor', 'RandomForestRegressor', 'LGBMRegressor']

def test_demand_forecast_horizons_and_schemas(client, admin_token):
    for horizon in [7, 14, 30, 90, 180, 365]:
        payload = {'product_id': 'health_beauty_001', 'days': horizon}
        res = client.post('/api/pricing/forecast-demand', json=payload, headers={'Authorization': f'Bearer {admin_token}'})
        assert res.status_code == 200
        data = res.get_json()
        assert data['product_id'] == 'health_beauty_001'
        assert data['forecast_period_days'] == horizon
        assert data['total_forecasted_units'] > 0
        assert data['avg_daily_demand'] > 0
        assert data['trend_classification'] in ['UPWARD', 'DOWNWARD', 'STABLE']
        assert 'confidence_score' in data
        assert 0.70 <= data['confidence_score'] <= 1.0
        assert 'interpretation' in data
        assert len(data['interpretation']) > 10
        assert len(data['daily_forecast']) == horizon
        
        # Verify 95% Confidence Interval bounds for every day
        for day_record in data['daily_forecast']:
            assert 'day' in day_record
            assert 'date' in day_record
            assert 'forecasted_demand' in day_record
            assert 'lower_bound' in day_record
            assert 'upper_bound' in day_record
            assert 0 <= day_record['lower_bound'] <= day_record['forecasted_demand'] <= day_record['upper_bound']

def test_demand_forecast_invalid_product(client, admin_token):
    payload = {'product_id': 'NON_EXISTENT_SKU_99999', 'days': 30}
    res = client.post('/api/pricing/forecast-demand', json=payload, headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 404
    data = res.get_json()
    assert 'error' in data
    assert 'Demand forecast unavailable' in data['error']

def test_demand_forecast_invalid_horizons(client, admin_token):
    # Horizon too large (> 365)
    res1 = client.post('/api/pricing/forecast-demand', json={'product_id': 'health_beauty_001', 'days': 500})
    assert res1.status_code == 400
    assert 'error' in res1.get_json()

    # Horizon zero or negative
    res2 = client.post('/api/pricing/forecast-demand', json={'product_id': 'health_beauty_001', 'days': 0})
    assert res2.status_code == 400

    res3 = client.post('/api/pricing/forecast-demand', json={'product_id': 'health_beauty_001', 'days': -15})
    assert res3.status_code == 400

    # Non-integer horizon
    res4 = client.post('/api/pricing/forecast-demand', json={'product_id': 'health_beauty_001', 'days': 'abc'})
    assert res4.status_code == 400

def test_optimize_price_elasticity(client, admin_token):
    payload = {'current_price': 120.0, 'cost': 60.0, 'category_name': 'bed_bath_table'}
    res = client.post('/api/pricing/optimize-price', json=payload, headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    data = res.get_json()
    assert 'optimal_price' in data
    assert data['optimal_price'] > 0
    assert 'category_elasticity' in data
    assert 'reasoning' in data
    assert len(data['elasticity_curve']) == 15

def test_pricing_validation_errors(client, admin_token):
    # Test invalid negative price
    res1 = client.post('/api/pricing/predict-price', json={'price': -10}, headers={'Authorization': f'Bearer {admin_token}'})
    assert res1.status_code == 400

    # Test invalid negative cost
    res3 = client.post('/api/pricing/optimize-price', json={'current_price': 100, 'cost': -5}, headers={'Authorization': f'Bearer {admin_token}'})
    assert res3.status_code == 400
