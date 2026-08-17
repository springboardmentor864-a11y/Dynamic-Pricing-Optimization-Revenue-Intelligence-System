import sys
import os
import uuid

# Insert parent folder to beginning of path to prioritize root packages
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app
from backend.utils.db import SessionLocal, init_database
from backend.models.sql_models import Product, User, PredictionHistory, AuditLog, Recommendation, DemandForecast, Notification, ForecastHistory

client = TestClient(app)

def setup_module(module):
    """Ensure database is seeded before running tests."""
    print("\n[TEST SETUP] Initializing database...")
    init_database()

def get_json_data(response):
    """Helper to safely retrieve payload data, unpacking middleware wrappers if present."""
    res_json = response.json()
    # If wrapped by CentralStoreResponseWrapperMiddleware
    if isinstance(res_json, dict) and res_json.get("success") is True and "data" in res_json:
        return res_json["data"]
    return res_json

def test_password_hashing_and_auth():
    print("\n--- Testing Hashed Authentication ---")
    
    # 1. Test logging in with admin seed account (hashed admin)
    login_payload = {
        "email": "admin@pricepilot.ai",
        "password": "admin"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    res_data = get_json_data(response)
    assert res_data["success"] is True
    assert res_data["message"] == "Login successful"
    assert "token" in res_data
    assert res_data["user"]["role"] == "Admin"
    print("[OK] Seeded admin account authentication verified successfully.")

    # 2. Test creating a new user (which hashes password)
    unique_email = f"test_{str(uuid.uuid4())[:8]}@pricepilot.ai"
    new_user_payload = {
        "full_name": "Test Engineer",
        "email": unique_email,
        "password": "securepassword123",
        "role": "Manager",
        "department": "Engineering"
    }
    admin_token = res_data["token"]
    headers = {"Authorization": f"Bearer {admin_token}"}
    create_res = client.post("/api/users", json=new_user_payload, headers=headers)
    assert create_res.status_code == 200
    create_data = get_json_data(create_res)
    assert create_data["status"] == "success"
    print("[OK] New user created successfully (password hashed dynamically).")

    # 3. Verify logging in with new user account
    login_new = {
        "email": unique_email,
        "password": "securepassword123"
    }
    login_res = client.post("/api/auth/login", json=login_new)
    assert login_res.status_code == 200
    login_data = get_json_data(login_res)
    assert login_data["success"] is True
    print("[OK] Authentication with newly created hashed user verified.")

    # 4. Verify login failure on incorrect password
    login_bad = {
        "email": unique_email,
        "password": "wrongpassword"
    }
    bad_res = client.post("/api/auth/login", json=login_bad)
    bad_data = get_json_data(bad_res)
    assert bad_data["success"] is False
    print("[OK] Authentication rejection on wrong password verified.")


def test_products_search_and_detail():
    print("\n--- Testing Products Search and Detail APIs ---")
    
    # Search products
    res_search = client.get("/api/products/search?category=utilidades_domesticas")
    assert res_search.status_code == 200
    products = get_json_data(res_search)
    # If database has products, test details of the first one
    if products:
        first_pid = products[0]["product_id"]
        res_detail = client.get(f"/api/products/detail?product_id={first_pid}")
        assert res_detail.status_code == 200
        detail_data = get_json_data(res_detail)
        assert detail_data["product_id"] == first_pid
        print(f"[OK] Product search and detail API verified for product: {first_pid}")
    else:
        print("[WARN] No products found in database to test detail API, seeding or CSV loading check needed.")


def test_price_prediction_pipeline():
    print("\n--- Testing Price Prediction Transaction Pipeline ---")
    
    # Locate a product in the database for the test
    db = SessionLocal()
    product = db.query(Product).first()
    db.close()
    
    product_id = product.product_id if product else "test-product-uuid-12345"
    
    predict_payload = {
        "category": "utilidades_domesticas",
        "freight": 15.50,
        "weight": 800.0,
        "length": 25.0,
        "height": 12.0,
        "width": 18.0,
        "photos": 3,
        "name_length": 45,
        "description_length": 450,
        "mode": "best",
        "selected_model": "XGBoost Regressor",
        "product_id": product_id,
        "product_name": "Test Housewares Product",
        "user_email": "admin@pricepilot.ai"
    }
    
    # Trigger prediction
    response = client.post("/api/predict", json=predict_payload)
    assert response.status_code == 200
    res_data = get_json_data(response)
    assert "recommended_price" in res_data
    assert "confidence" in res_data
    assert "champion_model" in res_data
    
    recommended_price = res_data["recommended_price"]
    champion_model = res_data["champion_model"]
    print(f"[OK] Prediction endpoint completed: Rs {recommended_price} using {champion_model}")

    # Now verify all database records were inserted transactionally
    db = SessionLocal()
    prod_in_db = db.query(Product).filter(Product.product_id == product_id).first()
    assert prod_in_db is not None
    
    # Check PredictionHistory
    ph = db.query(PredictionHistory).filter(PredictionHistory.product_id == prod_in_db.id).order_by(PredictionHistory.id.desc()).first()
    assert ph is not None
    assert ph.predicted_price == recommended_price
    assert ph.request_id is not None
    assert ph.prediction_version == "1.0.0"
    
    # Check AuditLog
    al = db.query(AuditLog).filter(AuditLog.product_id == prod_in_db.id).order_by(AuditLog.id.desc()).first()
    assert al is not None
    assert al.predicted_price == recommended_price
    assert al.request_id == ph.request_id
    
    # Check Recommendation
    rec = db.query(Recommendation).filter(Recommendation.product_id == prod_in_db.id).order_by(Recommendation.id.desc()).first()
    assert rec is not None
    assert rec.recommended_price == recommended_price
    
    # Check DemandForecast
    df = db.query(DemandForecast).filter(DemandForecast.product_id == prod_in_db.id).order_by(DemandForecast.id.desc()).first()
    assert df is not None
    
    # Check Notification
    notif = db.query(Notification).filter(Notification.product_id == prod_in_db.id).order_by(Notification.id.desc()).first()
    assert notif is not None
    assert "New prediction completed" in notif.message
    
    db.close()
    print("[OK] Verified prediction records created transactionally: Product, History, AuditLog, Recommendation, Forecast, and Notification match.")


def test_forecast_time_series_pipeline():
    print("\n--- Testing Time-Series Demand Forecasting Pipeline ---")
    
    # Query first product
    db = SessionLocal()
    product = db.query(Product).first()
    db.close()
    
    product_id = product.product_id if product else "test-product-uuid-12345"
    
    # Call forecast time series API
    response = client.post(f"/forecast-time-series?product_id={product_id}")
    assert response.status_code == 200
    res_data = get_json_data(response)
    assert "forecast_data" in res_data
    assert "total_forecast_sales" in res_data
    assert len(res_data["forecast_data"]) == 90 # 90 days forecast
    print("[OK] Time-series 90-day forecast generation verified.")

    # Verify database records
    db = SessionLocal()
    prod_in_db = db.query(Product).filter(Product.product_id == product_id).first()
    
    # Verify demand_forecasts records exist and reference product
    df_count = db.query(DemandForecast).filter(DemandForecast.product_id == prod_in_db.id).count()
    assert df_count >= 90
    
    # Verify forecast_history records exist and reference product
    fh_count = db.query(ForecastHistory).filter(ForecastHistory.product_id == prod_in_db.id).count()
    assert fh_count >= 90
    
    # Verify AuditLog created
    al = db.query(AuditLog).filter(
        AuditLog.product_id == prod_in_db.id,
        AuditLog.model_used.in_(["ARIMA", "Linear Ridge Regression (ARIMA Fallback)"])
    ).order_by(AuditLog.id.desc()).first()
    assert al is not None
    assert "Executed 90-day demand forecast" in al.llm_output
    
    # Verify Notification created
    notif = db.query(Notification).filter(
        Notification.product_id == prod_in_db.id,
        Notification.type == "forecast"
    ).order_by(Notification.id.desc()).first()
    assert notif is not None
    
    db.close()
    print("[OK] Verified demand forecast entries linked transactionally: Product, Forecasts, Forecast History, AuditLog, and Notifications.")


def test_transactional_rollback_safety():
    print("\n--- Testing Database Rollback Safety ---")
    
    # Let's count predictions before
    db = SessionLocal()
    count_before_ph = db.query(PredictionHistory).count()
    count_before_al = db.query(AuditLog).count()
    db.close()
    
    # Force failure in predict endpoint by passing a long category string that exceeds VARCHAR(128) schema limit
    long_category = "x" * 200
    predict_payload = {
        "category": long_category,
        "freight": 15.50,
        "weight": 800.0,
        "length": 25.0,
        "height": 12.0,
        "width": 18.0,
        "photos": 3,
        "name_length": 45,
        "description_length": 450,
        "mode": "best",
        "selected_model": "XGBoost Regressor",
        "product_id": "test-uuid-fail",
        "product_name": "Test Housewares Product",
        "user_email": "admin@pricepilot.ai"
    }
    
    response = client.post("/api/predict", json=predict_payload)
    # The middleware wraps the 500 JSON response, so we assert the wrapped or direct status code is 500
    assert response.status_code == 500
    
    # Double check database counts
    db = SessionLocal()
    count_after_ph = db.query(PredictionHistory).count()
    count_after_al = db.query(AuditLog).count()
    db.close()
    
    # Assert no partial records were written!
    assert count_before_ph == count_after_ph
    assert count_before_al == count_after_al
    print("[OK] Transactional rollback verified: zero partial records written to database on insert failure.")


def test_rate_limiting():
    print("\n--- Testing API Rate Limiting ---")
    
    # Trigger 150 fast requests to verify rate limits (limit is set to 120 per minute in test context)
    rate_limited = False
    for _ in range(150):
        res = client.get("/api/notifications/unread-count")
        if res.status_code == 429:
            rate_limited = True
            break
            
    assert rate_limited is True
    print("[OK] API rate limiting verified: client gets 429 Too Many Requests response on abuse.")


if __name__ == "__main__":
    setup_module(None)
    try:
        test_password_hashing_and_auth()
        test_products_search_and_detail()
        test_price_prediction_pipeline()
        test_forecast_time_series_pipeline()
        test_transactional_rollback_safety()
        test_rate_limiting()
        print("\n[SUCCESS] ALL TESTS PASSED SUCCESSFULLY! The system is enterprise-ready.")
    except AssertionError as ae:
        print("\n[FAIL] A test assertion failed. Review the traceback above.")
        raise ae
    except Exception as e:
        print(f"\n[FAIL] Test suite encountered an error: {str(e)}")
        raise e
