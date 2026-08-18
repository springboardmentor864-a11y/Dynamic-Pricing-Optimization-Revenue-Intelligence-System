def test_predict_price_api(client, admin_token):
    payload = {
        'product_id': 'TEST_PROD_100',
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

def test_demand_forecast_horizons(client, admin_token):
    for horizon in [7, 14, 30, 90]:
        payload = {'product_id': 'TEST_PROD_100', 'days': horizon}
        res = client.post('/api/pricing/forecast-demand', json=payload, headers={'Authorization': f'Bearer {admin_token}'})
        assert res.status_code == 200
        data = res.get_json()
        assert data['forecast_period_days'] == horizon
        assert data['total_forecasted_units'] > 0
        assert data['trend_classification'] in ['UPWARD', 'DOWNWARD', 'STABLE']
        assert 'confidence_score' in data
        assert len(data['daily_forecast']) == horizon
        # Verify confidence intervals
        first_day = data['daily_forecast'][0]
        assert 'lower_bound' in first_day and 'upper_bound' in first_day
        assert first_day['lower_bound'] <= first_day['forecasted_demand'] <= first_day['upper_bound']

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

    # Test invalid forecast days
    res2 = client.post('/api/pricing/forecast-demand', json={'days': 500}, headers={'Authorization': f'Bearer {admin_token}'})
    assert res2.status_code == 400

    # Test invalid negative cost
    res3 = client.post('/api/pricing/optimize-price', json={'current_price': 100, 'cost': -5}, headers={'Authorization': f'Bearer {admin_token}'})
    assert res3.status_code == 400
