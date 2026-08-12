"""
Comprehensive Unit & Integration Test Suite for Competitor Price Analysis (PricePilot AI)
"""

import sys
import os
import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from database import Base, get_db
from models import User, CompetitorPrice
from security import get_password_hash, create_access_token
from routers.competitors import calculate_competitive_status, generate_explainable_recommendation

# Test Database setup (using SQLite in-memory with StaticPool)
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Create Admin User
    admin_user = User(
        name="Test Admin",
        email="admin_test@pricepilot.ai",
        username="admin_test",
        password_hash=get_password_hash("password123"),
        role="Admin",
        is_active=True,
        is_approved=True,
        status="approved"
    )

    # Create Normal User
    normal_user = User(
        name="Test User",
        email="user_test@pricepilot.ai",
        username="user_test",
        password_hash=get_password_hash("password123"),
        role="User",
        is_active=True,
        is_approved=True,
        status="approved"
    )

    db.add(admin_user)
    db.add(normal_user)

    # Seed Sample Competitor Pricing Records
    sample_records = [
        CompetitorPrice(
            product_id="P1001",
            product_name="Wireless Headphones",
            category="Headphones",
            brand="Sony",
            our_price=2499.0,
            competitor_name="Competitor A",
            competitor_product_name="Wireless Headphones",
            competitor_price=2399.0,
            price_difference=100.0,
            price_difference_percentage=4.17,
            competitor_rating=4.7,
            competitor_stock=45,
            marketplace="Amazon",
            currency="INR",
            source="Manual",
            captured_at="2026-08-12"
        ),
        CompetitorPrice(
            product_id="P1001",
            product_name="Wireless Headphones",
            category="Headphones",
            brand="Sony",
            our_price=2499.0,
            competitor_name="Competitor B",
            competitor_product_name="Wireless Headphones",
            competitor_price=2599.0,
            price_difference=-100.0,
            price_difference_percentage=-3.85,
            competitor_rating=4.5,
            competitor_stock=30,
            marketplace="Flipkart",
            currency="INR",
            source="Manual",
            captured_at="2026-08-12"
        ),
        CompetitorPrice(
            product_id="P1001",
            product_name="Wireless Headphones",
            category="Headphones",
            brand="Sony",
            our_price=2499.0,
            competitor_name="Competitor C",
            competitor_product_name="Wireless Headphones",
            competitor_price=2449.0,
            price_difference=50.0,
            price_difference_percentage=2.04,
            competitor_rating=4.3,
            competitor_stock=20,
            marketplace="Myntra",
            currency="INR",
            source="Manual",
            captured_at="2026-08-12"
        ),
        CompetitorPrice(
            product_id="P1002",
            product_name="Smart Fitness Watch Pro",
            category="Smart Watches",
            brand="Apple",
            our_price=8999.0,
            competitor_name="Amazon",
            competitor_product_name="Smart Watch Pro",
            competitor_price=6999.0,
            price_difference=2000.0,
            price_difference_percentage=28.58,
            competitor_rating=4.8,
            competitor_stock=10,
            marketplace="Amazon",
            currency="INR",
            source="Manual",
            captured_at="2026-08-12"
        ),
    ]

    for rec in sample_records:
        db.add(rec)

    db.commit()

    yield db

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def user_token_header():
    token = create_access_token({"sub": "user_test", "role": "User"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_token_header():
    token = create_access_token({"sub": "admin_test", "role": "Admin"})
    return {"Authorization": f"Bearer {token}"}


# ==========================================================
# 1. Calculation Unit Tests
# ==========================================================

def test_competitive_status_thresholds():
    assert calculate_competitive_status(-15.0) == "UNDERPRICED"
    assert calculate_competitive_status(0.0) == "COMPETITIVE"
    assert calculate_competitive_status(5.0) == "COMPETITIVE"
    assert calculate_competitive_status(15.0) == "OVERPRICED"


def test_explainable_recommendation():
    our_price = 2499.0
    avg_price = 2482.33
    min_price = 2399.0
    max_price = 2599.0

    res = generate_explainable_recommendation(our_price, avg_price, min_price, max_price)
    assert res["competitive_status"] == "COMPETITIVE"
    assert res["recommended_price"] > 0
    assert "Current price" in res["reason"]


# ==========================================================
# 2. REST API Integration Tests
# ==========================================================

def test_unauthorized_access():
    response = client.get("/api/competitors/analysis")
    assert response.status_code == 401


def test_get_competitor_analysis_list(user_token_header):
    response = client.get("/api/competitors/analysis", headers=user_token_header)
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert data["total"] >= 2


def test_get_product_competitor_comparison(user_token_header):
    response = client.get("/api/competitors/product/P1001", headers=user_token_header)
    assert response.status_code == 200
    data = response.json()
    assert data["product_id"] == "P1001"
    assert data["our_price"] == 2499.0
    assert len(data["competitors"]) == 3
    assert data["competitive_status"] == "COMPETITIVE"


def test_get_price_recommendation(user_token_header):
    response = client.get("/api/competitors/recommendation/P1001", headers=user_token_header)
    assert response.status_code == 200
    data = response.json()
    assert data["product_id"] == "P1001"
    assert "reason" in data
    assert data["recommended_price"] > 0


def test_get_competitor_summary(user_token_header):
    response = client.get("/api/competitors/summary", headers=user_token_header)
    assert response.status_code == 200
    data = response.json()
    assert data["total_products_analyzed"] >= 2
    assert "status_distribution" in data
    assert "insights" in data


def test_create_competitor_price_admin(admin_token_header):
    payload = {
        "product_id": "P2001",
        "competitor_name": "Croma",
        "competitor_product_name": "MacBook Pro",
        "competitor_price": 165000.0,
        "currency": "INR",
        "source": "Manual",
        "captured_at": "2026-08-12",
        "our_price": 169900.0
    }
    response = client.post("/api/competitors/prices", json=payload, headers=admin_token_header)
    assert response.status_code == 201
    data = response.json()
    assert data["competitor_name"] == "Croma"
    assert data["price_difference"] == 4900.0


def test_create_competitor_price_user_forbidden(user_token_header):
    payload = {
        "product_id": "P2001",
        "competitor_name": "Croma",
        "competitor_price": 165000.0
    }
    response = client.post("/api/competitors/prices", json=payload, headers=user_token_header)
    assert response.status_code == 403


def test_update_competitor_price_admin(admin_token_header):
    # First create a record
    payload = {
        "product_id": "P3001",
        "competitor_name": "Walmart",
        "competitor_price": 500.0,
        "our_price": 550.0
    }
    create_resp = client.post("/api/competitors/prices", json=payload, headers=admin_token_header)
    record_id = create_resp.json()["id"]

    # Update price
    update_payload = {"competitor_price": 520.0}
    update_resp = client.put(f"/api/competitors/prices/{record_id}", json=update_payload, headers=admin_token_header)
    assert update_resp.status_code == 200
    assert update_resp.json()["competitor_price"] == 520.0
    assert update_resp.json()["price_difference"] == 30.0


def test_delete_competitor_price_admin(admin_token_header):
    payload = {
        "product_id": "P9999",
        "competitor_name": "TestStore",
        "competitor_price": 100.0,
        "our_price": 100.0
    }
    create_resp = client.post("/api/competitors/prices", json=payload, headers=admin_token_header)
    record_id = create_resp.json()["id"]

    delete_resp = client.delete(f"/api/competitors/prices/{record_id}", headers=admin_token_header)
    assert delete_resp.status_code == 200
    assert delete_resp.json()["status"] == "SUCCESS"


def test_csv_import_admin(admin_token_header):
    csv_content = (
        "product_id,competitor_name,competitor_product_name,competitor_price,currency,source,captured_at\n"
        "P8001,Amazon,Power Bank,12499,INR,Manual,2026-08-12\n"
        "P8001,Flipkart,Power Bank,11999,INR,Manual,2026-08-12\n"
        "P8002,InvalidComp,, -50,INR,Manual,2026-08-12\n"
    )
    files = {"file": ("import_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/competitors/import-csv", files=files, headers=admin_token_header)
    assert response.status_code == 200
    data = response.json()
    assert data["successful_rows"] == 2
    assert data["failed_rows"] == 1
    assert len(data["validation_errors"]) > 0
