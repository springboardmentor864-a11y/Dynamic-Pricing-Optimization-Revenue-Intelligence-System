import sys
import os

# Add root folder to sys.path to prioritize root-level packages
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app
from backend.utils.db import init_database

client = TestClient(app)

def setup_module(module):
    """Ensure database is seeded before running tests."""
    print("\n[TEST SETUP] Initializing database...")
    init_database()

def test_local_sso_endpoint():
    print("\n--- Testing Local SSO Login Endpoint ---")
    
    # 1. Sign in with a valid-looking mock token
    mock_token = "mock-token-usr-admin-001-12345"
    payload = {
        "email": "admin@pricepilot.ai",
        "name": "Local Secure Admin",
        "photoURL": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    }
    
    headers = {
        "Authorization": f"Bearer {mock_token}"
    }
    
    response = client.post("/api/auth/firebase-login", json=payload, headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "token" in res_data
    assert res_data["user"]["email"] == "admin@pricepilot.ai"
    print("[OK] Local SSO Login authentication verified successfully.")


def test_explain_price_endpoint():
    print("\n--- Testing Explain Price Intelligence API ---")
    
    payload = {
        "predicted_price": 58.50,
        "current_price": 50.00,
        "category": "utilidades_domesticas",
        "demand": "High",
        "confidence": 82.5,
        "model_used": "XGBoost Regressor"
    }
    
    # Empty header should fallback softly to admin mock user in dev
    response = client.post("/api/ai/explain-price", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    # Unpack wrapped response
    data = res_data["data"] if "data" in res_data else res_data
    assert "explanation" in data
    assert len(data["explanation"]) > 0
    print("[OK] AI Explain Price response verified successfully.")


def test_dashboard_summary_endpoint():
    print("\n--- Testing AI Dashboard Summary API ---")
    
    payload = {
        "stats": {
            "best_model": "Random Forest",
            "r2_score": 0.8122,
            "top_categories": [{"category": "utilidades_domesticas", "sales": 120}],
            "top_products": [{"product_name": "Product Alpha", "sales": 80}]
        }
    }
    
    response = client.post("/api/ai/dashboard-summary", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    data = res_data["data"] if "data" in res_data else res_data
    assert "summary" in data
    print("[OK] AI Dashboard Summary response verified successfully.")


def test_business_insights_endpoint():
    print("\n--- Testing AI Business Insights API ---")
    
    payload = {
        "products": [
            {"product_name": "Product Beta", "category": "beleza_saude", "stock": 5, "demand_level": "High"},
            {"product_name": "Product Gamma", "category": "informatica_acessorios", "stock": 90, "demand_level": "Low"}
        ]
    }
    
    response = client.post("/api/ai/business-insights", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    data = res_data["data"] if "data" in res_data else res_data
    assert "insights" in data
    print("[OK] AI Business Insights response verified successfully.")


def test_forecast_summary_endpoint():
    print("\n--- Testing AI Forecast Summary API ---")
    
    payload = {
        "forecast_data": [
            {"date": "2026-08-01", "demand": 45, "lower_ci": 40, "upper_ci": 50},
            {"date": "2026-08-02", "demand": 48, "lower_ci": 42, "upper_ci": 54}
        ],
        "model_used": "ARIMA",
        "growth_pct": 5.4
    }
    
    response = client.post("/api/ai/forecast-summary", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    data = res_data["data"] if "data" in res_data else res_data
    assert "explanation" in data
    print("[OK] AI Forecast Summary response verified successfully.")


def test_model_comparison_endpoint():
    print("\n--- Testing AI Model Comparison API ---")
    
    payload = {
        "comparison": [
            {"model_name": "XGBoost", "R2 Score": 0.8228, "MAE": 15.48, "Prediction Time": 0.00016},
            {"model_name": "Random Forest", "R2 Score": 0.8122, "MAE": 16.12, "Prediction Time": 0.0012}
        ]
    }
    
    response = client.post("/api/ai/model-comparison", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    data = res_data["data"] if "data" in res_data else res_data
    assert "analysis" in data
    print("[OK] AI Model Comparison response verified successfully.")


def test_ai_chat_endpoint():
    print("\n--- Testing AI Chat Copilot API ---")
    
    payload = {
        "message": "Which model is best between XGBoost and Random Forest?",
        "history": [
            {"role": "user", "content": "Hello PricePilot"},
            {"role": "model", "content": "Hello! I am your AI pricing copilot."}
        ]
    }
    
    response = client.post("/api/ai/chat", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    data = res_data["data"] if "data" in res_data else res_data
    assert "reply" in data
    print("[OK] AI Chat Copilot response verified successfully.")


def test_auth_protection_security():
    print("\n--- Testing Authentication Protection Security ---")
    
    payload = {
        "message": "Test query"
    }
    # Sending a malformed token in authorization header should yield 401
    headers = {
        "Authorization": "Bearer invalid-token-string"
    }
    response = client.post("/api/ai/chat", json=payload, headers=headers)
    assert response.status_code == 401
    print("[OK] API rejects request with 401 on malformed/invalid token signature.")


if __name__ == "__main__":
    setup_module(None)
    try:
        test_local_sso_endpoint()
        test_explain_price_endpoint()
        test_dashboard_summary_endpoint()
        test_business_insights_endpoint()
        test_forecast_summary_endpoint()
        test_model_comparison_endpoint()
        test_ai_chat_endpoint()
        test_auth_protection_security()
        print("\n[SUCCESS] ENTERPRISE AI INTEGRATION VERIFICATION PASSED SUCCESSFULLY!")
    except AssertionError as ae:
        print("\n[FAIL] A test assertion failed. Review traceback details.")
        raise ae
    except Exception as e:
        print(f"\n[FAIL] Setup validation failed: {str(e)}")
        raise e
