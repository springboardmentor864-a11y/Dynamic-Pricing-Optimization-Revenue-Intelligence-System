def test_dashboard_summary(client):
    res = client.get('/api/dashboard/summary')
    assert res.status_code == 200
    data = res.get_json()
    assert 'total_revenue' in data
    assert 'avg_order_value' in data
    assert 'total_orders' in data

def test_get_products(client):
    res = client.get('/api/products')
    assert res.status_code == 200
    data = res.get_json()
    assert 'products' in data
    assert len(data['products']) > 0

def test_model_performance(client):
    res = client.get('/api/analytics/model-performance')
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert data[0]['Model'] == 'Extra Trees Regressor'

def test_health_check(client):
    res = client.get('/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'healthy'
    assert 'X-Frame-Options' in res.headers

def test_readiness_check(client):
    res = client.get('/readiness')
    assert res.status_code == 200
    data = res.get_json()
    assert data['ready'] is True
    assert data['checks']['database'] is True
