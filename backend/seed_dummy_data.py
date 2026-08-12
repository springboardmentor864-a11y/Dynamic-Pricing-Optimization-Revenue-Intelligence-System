"""
PricePilot AI — Development Data Seeding Script (backend/seed_dummy_data.py)

Populates the PostgreSQL/SQLite database with a complete, highly realistic, non-destructive dummy dataset
for testing, dashboard visualizations, ML analytics, demand forecasts, competitor analysis, reports,
notifications, and user activity logging.

Execution:
python seed_dummy_data.py
"""

import sys
import os
import json
import random
from datetime import datetime, timedelta

# Ensure backend directory is in python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    from database import engine, SessionLocal, Base
    from models import (
        User, Product, Prediction, PriceRecommendation, DemandForecast,
        PredictionHistory, Notification, Report, ActivityLog, Setting,
        CompetitorPrice, CompetitorAnalysis
    )
    from security import get_password_hash
except ImportError:
    from backend.database import engine, SessionLocal, Base
    from backend.models import (
        User, Product, Prediction, PriceRecommendation, DemandForecast,
        PredictionHistory, Notification, Report, ActivityLog, Setting,
        CompetitorPrice, CompetitorAnalysis
    )
    from backend.security import get_password_hash


# ==========================================================
# SEEDING DATA SPECIFICATIONS
# ==========================================================

DEVELOPMENT_USERS = [
    {
        "name": "System Administrator",
        "email": "admin@pricepilot.ai",
        "username": "admin",
        "role": "Admin",
        "phone_number": "+91 98765 43210",
        "is_active": True,
        "is_approved": True,
        "status": "approved",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    },
    {
        "name": "Standard User",
        "email": "user@pricepilot.ai",
        "username": "user",
        "role": "User",
        "phone_number": "+91 98765 12345",
        "is_active": True,
        "is_approved": True,
        "status": "approved",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    {
        "name": "Pricing Analyst",
        "email": "analyst@pricepilot.ai",
        "username": "analyst",
        "role": "User",
        "phone_number": "+91 98123 45678",
        "is_active": True,
        "is_approved": True,
        "status": "approved",
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    }
]

PRODUCT_CATALOG = [
    # Electronics & Smartphones (15)
    ("iPhone 15 Pro Max 256GB", "Smartphones", "Apple", 134900.0, 115000.0, 45),
    ("iPhone 15 128GB", "Smartphones", "Apple", 79900.0, 68000.0, 80),
    ("Samsung Galaxy S24 Ultra", "Smartphones", "Samsung", 129999.0, 110000.0, 35),
    ("Samsung Galaxy S24 5G", "Smartphones", "Samsung", 69999.0, 58000.0, 60),
    ("Google Pixel 9 Pro 128GB", "Smartphones", "Google", 109999.0, 92000.0, 25),
    ("OnePlus 12 5G 256GB", "Smartphones", "OnePlus", 64999.0, 54000.0, 50),
    ("Xiaomi 14 Ultra 512GB", "Smartphones", "Xiaomi", 99999.0, 84000.0, 20),
    ("Realme GT 6 5G", "Smartphones", "Realme", 40999.0, 34000.0, 65),
    ("Vivo X100 Pro 5G", "Smartphones", "Vivo", 89999.0, 75000.0, 30),
    ("Nothing Phone (2a)", "Smartphones", "Nothing", 23999.0, 19500.0, 90),

    # Laptops (10)
    ("MacBook Pro 16-inch M3 Max", "Laptops", "Apple", 349900.0, 295000.0, 15),
    ("MacBook Air 15-inch M3", "Laptops", "Apple", 134900.0, 112000.0, 40),
    ("Dell XPS 15 9530 Touch", "Laptops", "Dell", 224990.0, 190000.0, 18),
    ("Dell Inspiron 15 3530", "Laptops", "Dell", 49990.0, 41000.0, 70),
    ("HP Spectre x360 OLED", "Laptops", "HP", 159990.0, 135000.0, 22),
    ("HP Pavilion Plus 14", "Laptops", "HP", 74990.0, 62000.0, 55),
    ("Lenovo ThinkPad X1 Carbon Gen 11", "Laptops", "Lenovo", 189990.0, 160000.0, 20),
    ("Lenovo IdeaPad Slim 5 AMD", "Laptops", "Lenovo", 62990.0, 51000.0, 65),
    ("ASUS ROG Zephyrus G16 OLED", "Laptops", "ASUS", 219990.0, 185000.0, 14),
    ("Acer Predator Helios 16", "Laptops", "Acer", 144990.0, 120000.0, 28),

    # Headphones & Audio (8)
    ("Sony WH-1000XM5 Wireless ANC", "Headphones", "Sony", 29990.0, 23000.0, 120),
    ("Sony WF-1000XM5 TWS Earbuds", "Headphones", "Sony", 22990.0, 17500.0, 95),
    ("Apple AirPods Pro 2nd Gen USB-C", "Headphones", "Apple", 24900.0, 19000.0, 150),
    ("Bose QuietComfort Ultra", "Headphones", "Bose", 35900.0, 28000.0, 40),
    ("Sennheiser Momentum 4 Wireless", "Headphones", "Sennheiser", 34990.0, 27000.0, 35),
    ("JBL Tour One M2 ANC", "Headphones", "JBL", 19999.0, 14500.0, 80),
    ("Marshall Monitor II ANC", "Headphones", "Marshall", 24999.0, 18500.0, 45),
    ("boAt Nirvana Ion TWS", "Headphones", "boAt", 2299.0, 1400.0, 300),

    # Smart Watches (7)
    ("Apple Watch Ultra 2 GPS + Cellular", "Smart Watches", "Apple", 89900.0, 74000.0, 25),
    ("Apple Watch Series 9 Aluminum", "Smart Watches", "Apple", 41900.0, 33500.0, 60),
    ("Samsung Galaxy Watch6 Classic", "Smart Watches", "Samsung", 36999.0, 29000.0, 50),
    ("Garmin Fenix 7 Pro Solar", "Smart Watches", "Garmin", 81990.0, 67000.0, 15),
    ("Fitbit Sense 2 Health Tracker", "Smart Watches", "Fitbit", 21999.0, 16500.0, 40),
    ("Amazfit Balance Smartwatch", "Smart Watches", "Amazfit", 19999.0, 14500.0, 75),
    ("OnePlus Watch 2 WearOS", "Smart Watches", "OnePlus", 24999.0, 19000.0, 55),

    # Gaming Consoles & Accessories (5)
    ("Sony PlayStation 5 Slim Digital", "Gaming", "Sony", 44990.0, 37000.0, 40),
    ("Sony PlayStation 5 Disc Edition", "Gaming", "Sony", 54990.0, 45000.0, 50),
    ("Microsoft Xbox Series X 1TB", "Gaming", "Microsoft", 55990.0, 46000.0, 30),
    ("Nintendo Switch OLED Model", "Gaming", "Nintendo", 31990.0, 25000.0, 45),
    ("ASUS ROG Ally Z1 Extreme Handheld", "Gaming", "ASUS", 69990.0, 58000.0, 22),

    # Televisions (5)
    ("LG 55-inch C3 OLED 4K Smart TV", "TVs", "LG", 139990.0, 115000.0, 18),
    ("Samsung 55-inch Neo QLED 4K TV", "TVs", "Samsung", 124990.0, 102000.0, 22),
    ("Sony Bravia 55-inch XR OLED TV", "TVs", "Sony", 159990.0, 132000.0, 14),
    ("TCL 55-inch Mini-LED 4K TV", "TVs", "TCL", 64990.0, 51000.0, 35),
    ("Xiaomi X Pro 55-inch 4K Google TV", "TVs", "Xiaomi", 42999.0, 33000.0, 60)
]

COMPETITOR_NAMES = ["Amazon", "Flipkart", "Reliance Digital", "Croma", "Vijay Sales", "Tata CLiQ"]


# ==========================================================
# MAIN SEEDING EXECUTOR
# ==========================================================

def seed_database():
    print("=" * 60)
    print(" PricePilot AI — Production-Grade Dummy Data Seeding")
    print("=" * 60)

    # Initialize tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    counts = {
        "users": 0,
        "products": 0,
        "predictions": 0,
        "recommendations": 0,
        "demand_forecasts": 0,
        "prediction_history": 0,
        "reports": 0,
        "notifications": 0,
        "activity_logs": 0,
        "settings": 0,
        "competitor_prices": 0,
        "competitor_analysis": 0
    }

    try:
        # ------------------------------------------------------
        # 1. USERS SEEDING
        # ------------------------------------------------------
        print("\n[1/10] Seeding Users...")
        default_pwd_hash = get_password_hash("password123")
        created_users = []

        for udata in DEVELOPMENT_USERS:
            existing = db.query(User).filter(
                (User.email == udata["email"]) | (User.username == udata["username"])
            ).first()

            if not existing:
                user_obj = User(
                    name=udata["name"],
                    email=udata["email"],
                    username=udata["username"],
                    password_hash=default_pwd_hash,
                    role=udata["role"],
                    phone_number=udata["phone_number"],
                    avatar_url=udata["avatar_url"],
                    is_active=udata["is_active"],
                    is_approved=udata["is_approved"],
                    status=udata["status"],
                    last_login=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
                    created_at=datetime.utcnow() - timedelta(days=90)
                )
                db.add(user_obj)
                db.flush()
                created_users.append(user_obj)
                counts["users"] += 1
            else:
                created_users.append(existing)

        db.commit()

        admin_user = next((u for u in created_users if u.role == "Admin"), created_users[0])
        standard_user = next((u for u in created_users if u.role == "User"), created_users[-1])

        # ------------------------------------------------------
        # 2. PRODUCTS SEEDING
        # ------------------------------------------------------
        print("[2/10] Seeding Product Catalog (50 Items)...")
        seeded_products = []

        for p_name, category, brand, curr_price, cost_price, stock in PRODUCT_CATALOG:
            existing = db.query(Product).filter(Product.name == p_name).first()
            if not existing:
                prod = Product(
                    name=p_name,
                    category=category,
                    current_price=curr_price,
                    cost_price=cost_price,
                    stock=stock,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(10, 120))
                )
                db.add(prod)
                db.flush()
                seeded_products.append(prod)
                counts["products"] += 1
            else:
                seeded_products.append(existing)

        db.commit()

        # ------------------------------------------------------
        # 3. PREDICTIONS & PREDICTION HISTORY SEEDING
        # ------------------------------------------------------
        print("[3/10] Seeding ML Predictions & Historical Logs...")

        for prod in seeded_products:
            # Generate 2-4 predictions per product
            for step in range(random.randint(2, 4)):
                pred_date = datetime.utcnow() - timedelta(days=random.randint(1, 45), hours=random.randint(1, 23))

                # Extra Trees prediction simulation
                variation_factor = random.uniform(0.92, 1.05)
                predicted_p = round(prod.current_price * variation_factor, 2)
                conf = round(random.uniform(0.92, 0.98), 4)
                proc_time = round(random.uniform(0.025, 0.055), 4)

                pred = Prediction(
                    product_id=prod.id,
                    user_id=standard_user.id if step % 2 == 0 else admin_user.id,
                    predicted_price=predicted_p,
                    confidence_score=conf,
                    prediction_time=proc_time,
                    model_name="Extra Trees Regressor",
                    created_at=pred_date
                )
                db.add(pred)
                db.flush()
                counts["predictions"] += 1

                # Input feature JSON dump
                input_payload = json.dumps({
                    "product_name": prod.name,
                    "category": prod.category,
                    "cost_price": prod.cost_price,
                    "current_price": prod.current_price,
                    "stock": prod.stock,
                    "competitor_avg": round(prod.current_price * random.uniform(0.95, 1.05), 2),
                    "seasonality_index": round(random.uniform(0.8, 1.3), 2)
                })

                hist = PredictionHistory(
                    prediction_id=pred.id,
                    user_id=pred.user_id,
                    input_data=input_payload,
                    predicted_price=predicted_p,
                    confidence=conf,
                    created_at=pred_date
                )
                db.add(hist)
                counts["prediction_history"] += 1

        db.commit()

        # ------------------------------------------------------
        # 4. PRICE RECOMMENDATIONS SEEDING
        # ------------------------------------------------------
        print("[4/10] Seeding Price Recommendations...")

        for prod in seeded_products[:35]:
            comp_price = round(prod.current_price * random.uniform(0.92, 1.08), 2)
            pct_diff = ((prod.current_price - comp_price) / comp_price) * 100

            if pct_diff > 8.0:
                rec_p = round(comp_price * 1.02, 2)
                reason = f"Current price (₹{prod.current_price:,.2f}) is {pct_diff:.1f}% above market average. Lowering to ₹{rec_p:,.2f} will increase conversion velocity."
            elif pct_diff < -8.0:
                rec_p = round(comp_price * 0.97, 2)
                reason = f"Current price (₹{prod.current_price:,.2f}) is {abs(pct_diff):.1f}% below market. Increasing to ₹{rec_p:,.2f} expands profit margin while maintaining top value positioning."
            else:
                rec_p = round((prod.current_price + comp_price) / 2, 2)
                reason = f"Current price is competitively positioned (within {pct_diff:+.1f}% of market average). Adjusting to ₹{rec_p:,.2f} optimizes revenue."

            rec = PriceRecommendation(
                product_id=prod.id,
                current_price=prod.current_price,
                recommended_price=rec_p,
                forecasted_demand=random.randint(60, 350),
                competitor_price=comp_price,
                reason=reason,
                generated_at=datetime.utcnow() - timedelta(days=random.randint(0, 15))
            )
            db.add(rec)
            counts["recommendations"] += 1

        db.commit()

        # ------------------------------------------------------
        # 5. DEMAND FORECASTS SEEDING
        # ------------------------------------------------------
        print("[5/10] Seeding 30-Day Demand Forecast Series...")

        today = datetime.utcnow().date()
        for prod in seeded_products[:25]:
            base_demand = random.randint(35, 120)
            for day_offset in range(-5, 25): # 30 total days
                f_date = (today + timedelta(days=day_offset)).strftime("%Y-%m-%d")
                trend = random.uniform(0.9, 1.25)
                pred_d = round(base_demand * trend, 1)

                df_record = DemandForecast(
                    product_id=prod.id,
                    forecast_date=f_date,
                    predicted_demand=pred_d,
                    lower_bound=round(pred_d * 0.85, 1),
                    upper_bound=round(pred_d * 1.18, 1),
                    confidence=round(random.uniform(0.91, 0.97), 2),
                    model_version="v2.1-ExtraTrees",
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 10))
                )
                db.add(df_record)
                counts["demand_forecasts"] += 1

        db.commit()

        # ------------------------------------------------------
        # 6. COMPETITOR PRICES & ANALYSIS SEEDING
        # ------------------------------------------------------
        print("[6/10] Seeding Competitor Price Records & Market Snapshots...")

        for idx, prod in enumerate(seeded_products):
            pid_str = f"P100{idx+1:02d}"
            comp_prices = []

            # 3 to 5 competitor entries per product
            for comp_name in random.sample(COMPETITOR_NAMES, random.randint(3, 5)):
                c_price = round(prod.current_price * random.uniform(0.88, 1.12), 2)
                diff = round(prod.current_price - c_price, 2)
                pct_diff = round((diff / c_price) * 100, 2)
                comp_prices.append(c_price)

                cp = CompetitorPrice(
                    product_id=pid_str,
                    product_name=prod.name,
                    category=prod.category,
                    brand=prod.name.split()[0],
                    our_price=prod.current_price,
                    competitor_name=comp_name,
                    competitor_product_name=f"{prod.name}",
                    competitor_price=c_price,
                    price_difference=diff,
                    price_difference_percentage=pct_diff,
                    competitor_rating=round(random.uniform(4.0, 4.9), 1),
                    competitor_stock=random.randint(10, 100),
                    marketplace=f"{comp_name} Store",
                    currency="INR",
                    source="Competitor API",
                    captured_at=(datetime.utcnow() - timedelta(days=random.randint(0, 14))).strftime("%Y-%m-%d"),
                    recorded_at=(datetime.utcnow() - timedelta(days=random.randint(0, 14))).strftime("%Y-%m-%d"),
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 14))
                )
                db.add(cp)
                counts["competitor_prices"] += 1

            if comp_prices:
                avg_p = round(sum(comp_prices) / len(comp_prices), 2)
                min_p = round(min(comp_prices), 2)
                max_p = round(max(comp_prices), 2)
                diff = round(prod.current_price - avg_p, 2)
                pct_diff = round(((prod.current_price - avg_p) / avg_p) * 100, 2)

                st = "UNDERPRICED" if pct_diff < -10.0 else ("OVERPRICED" if pct_diff > 10.0 else "COMPETITIVE")
                rec_p = round(avg_p * 0.99, 2)

                ca = CompetitorAnalysis(
                    product_id=pid_str,
                    our_price=prod.current_price,
                    lowest_competitor_price=min_p,
                    highest_competitor_price=max_p,
                    average_competitor_price=avg_p,
                    price_difference=diff,
                    price_difference_percentage=pct_diff,
                    recommended_price=rec_p,
                    competitive_status=st,
                    analyzed_at=datetime.utcnow()
                )
                db.add(ca)
                counts["competitor_analysis"] += 1

        db.commit()

        # ------------------------------------------------------
        # 7. REPORTS SEEDING
        # ------------------------------------------------------
        print("[7/10] Seeding Executive Reports...")
        sample_reports = [
            ("Weekly Executive Pricing Overview - W32", "Weekly Overview", "admin@pricepilot.ai"),
            ("Monthly Demand & Revenue Forecast - August 2026", "Demand Forecast", "admin@pricepilot.ai"),
            ("Competitor Market Benchmark & Gap Analysis", "Competitor Intelligence", "analyst@pricepilot.ai"),
            ("ML Price Prediction Model Accuracy Audit", "Model Benchmark", "admin@pricepilot.ai"),
            ("Category Performance & Margin Optimization", "Category Intelligence", "user@pricepilot.ai")
        ]

        for r_name, r_type, gen_by in sample_reports:
            rep = Report(
                report_name=r_name,
                report_type=r_type,
                generated_by=gen_by,
                generated_at=datetime.utcnow() - timedelta(days=random.randint(1, 20))
            )
            db.add(rep)
            counts["reports"] += 1

        db.commit()

        # ------------------------------------------------------
        # 8. NOTIFICATIONS SEEDING
        # ------------------------------------------------------
        print("[8/10] Seeding System Notifications...")
        sample_notifications = [
            ("Price Alert: iPhone 15 Pro", "Competitor Amazon dropped price by 4.5%. Optimization recommended.", "warning", False),
            ("New Prediction Batch Ready", "Extra Trees model generated 50 price recommendations with 96.5% confidence.", "info", True),
            ("Weekly Analytics Report", "Your weekly executive pricing report has been generated successfully.", "success", False),
            ("Inventory Warning", "Low stock detected for PlayStation 5 Slim Digital (14 units remaining).", "warning", False),
            ("Competitor Price Sync", "Successfully synced 1,908 competitor prices from 6 online marketplaces.", "success", True),
            ("Demand Surge Detected", "Sony WH-1000XM5 demand forecast increased by +22% for next week.", "info", False),
            ("System Maintenance Complete", "Database index optimization completed successfully in 0.42s.", "info", True)
        ]

        for title, msg, n_type, is_r in sample_notifications:
            notif = Notification(
                title=title,
                message=msg,
                type=n_type,
                is_read=is_r,
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72))
            )
            db.add(notif)
            counts["notifications"] += 1

        db.commit()

        # ------------------------------------------------------
        # 9. ACTIVITY LOGS SEEDING
        # ------------------------------------------------------
        print("[9/10] Seeding Activity Logs...")
        sample_activities = [
            (admin_user.id, "Admin logged into PricePilot AI Dashboard"),
            (admin_user.id, "Executed ML Price Recommendation Batch for Electronics"),
            (standard_user.id, "User generated AI price prediction for Samsung Galaxy S24"),
            (admin_user.id, "Imported competitor pricing CSV dataset (1,908 records)"),
            (standard_user.id, "Exported Prediction History report to Excel"),
            (admin_user.id, "Updated system settings and CORS security policies"),
            (standard_user.id, "Viewed Competitor Price Analysis dashboard"),
            (admin_user.id, "Approved new user account: analyst@pricepilot.ai")
        ]

        for uid, act in sample_activities:
            alog = ActivityLog(
                user_id=uid,
                action=act,
                timestamp=datetime.utcnow() - timedelta(hours=random.randint(1, 120))
            )
            db.add(alog)
            counts["activity_logs"] += 1

        db.commit()

        # ------------------------------------------------------
        # 10. SYSTEM SETTINGS SEEDING
        # ------------------------------------------------------
        print("[10/10] Verifying System Settings...")
        existing_setting = db.query(Setting).first()
        if not existing_setting:
            stg = Setting(
                theme="dark",
                language="en",
                notifications_enabled=True,
                updated_at=datetime.utcnow()
            )
            db.add(stg)
            db.commit()
            counts["settings"] += 1

        # Print Final Detailed Summary
        print("\n" + "=" * 60)
        print(" SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f" • Users Added / Existing        : {counts['users']}")
        print(f" • Products Created               : {counts['products']}")
        print(f" • ML Predictions                 : {counts['predictions']}")
        print(f" • Prediction History Logs        : {counts['prediction_history']}")
        print(f" • Price Recommendations          : {counts['recommendations']}")
        print(f" • Demand Forecast Data Points    : {counts['demand_forecasts']}")
        print(f" • Competitor Price Records       : {counts['competitor_prices']}")
        print(f" • Competitor Analysis Summaries  : {counts['competitor_analysis']}")
        print(f" • Executive Reports              : {counts['reports']}")
        print(f" • System Notifications           : {counts['notifications']}")
        print(f" • User Activity Logs             : {counts['activity_logs']}")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Seeding failed with exception: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
