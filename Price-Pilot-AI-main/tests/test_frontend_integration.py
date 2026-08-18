import os
import subprocess
import pytest
from flask import url_for

def test_frontend_assets_exist(client):
    """Verify that all core frontend SPA assets are served successfully by Flask."""
    res_index = client.get('/')
    assert res_index.status_code == 200
    assert b'PricePilot AI' in res_index.data
    assert b'tab-dashboard' in res_index.data
    assert b'tab-forecasting' in res_index.data
    assert b'tab-pricing' in res_index.data

    res_js_app = client.get('/static/js/app.js')
    assert res_js_app.status_code == 200
    assert b'buildQueryString' in res_js_app.data or b'loadDashboard' in res_js_app.data

    res_js_api = client.get('/static/js/api.js')
    assert res_js_api.status_code == 200
    assert b'buildQueryString' in res_js_api.data

    res_js_charts = client.get('/static/js/charts.js')
    assert res_js_charts.status_code == 200
    assert b'initDemandForecastChart' in res_js_charts.data
    assert b'initPriceElasticityChart' in res_js_charts.data

    res_css = client.get('/static/css/style.css')
    assert res_css.status_code == 200
    assert b'skeleton-shimmer' in res_css.data

def test_node_frontend_unit_suite():
    """Execute Node.js frontend unit test script tests/test_frontend.test.js if node is installed."""
    test_js_path = os.path.join(os.path.dirname(__file__), 'test_frontend.test.js')
    assert os.path.exists(test_js_path)
    
    try:
        res = subprocess.run(['node', test_js_path], capture_output=True, text=True, timeout=10)
        assert res.returncode == 0
        assert 'ALL 3 FRONTEND UNIT TEST SUITES PASSED' in res.stdout
    except FileNotFoundError:
        pytest.skip("Node.js executable not found in environment, skipping JS runtime runner test.")
