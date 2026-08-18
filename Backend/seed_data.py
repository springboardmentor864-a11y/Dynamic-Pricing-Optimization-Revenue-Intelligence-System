import os
import random
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models.product import Product
from app.models.sales import Sales
from app.models.competitor import CompetitorPrice
from app.models.price_history import PriceHistory
from app.models.prediction_history import PredictionHistory
from app.models.user import User
from app.core.security import hash_password

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if products already exist
        product_count = db.query(Product).count()
        print(f"Current products in database: {product_count}")

        # Seed sample user if not exists
        if db.query(User).count() == 0:
            user = User(
                full_name="Harsha Kulkarni",
                email="harsha.kulkarni@pricepilot.ai",
                hashed_password=hash_password("admin123"),
                role="Pricing Manager"
            )
            db.add(user)
            db.commit()
            print("Seeded default pricing manager user.")

        if product_count == 0:
            sample_products = [
                {"name": "Ultra Precision Smart Watch Pro", "category": "Electronics", "cost": 2400.0, "price": 3899.0, "stock": 45, "weight": 250, "length": 15, "height": 3, "width": 8},
                {"name": "Ergonomic Mechanical Keyboard RGB", "category": "Computer Accessories", "cost": 1400.0, "price": 2299.0, "stock": 80, "weight": 850, "length": 44, "height": 4, "width": 14},
                {"name": "Active Noise-Cancelling Headphones", "category": "Audio", "cost": 3200.0, "price": 5499.0, "stock": 30, "weight": 310, "length": 20, "height": 8, "width": 18},
                {"name": "Wireless Fast Charging Pad 15W", "category": "Electronics", "cost": 450.0, "price": 999.0, "stock": 120, "weight": 110, "length": 10, "height": 1, "width": 10},
                {"name": "4K Ultra-HD USB-C Webcam with Mic", "category": "Computer Accessories", "cost": 2100.0, "price": 3499.0, "stock": 55, "weight": 220, "length": 12, "height": 5, "width": 6},
                {"name": "Pro Gaming Mouse 16000 DPI", "category": "Computer Accessories", "cost": 1100.0, "price": 1899.0, "stock": 95, "weight": 140, "length": 13, "height": 4, "width": 7},
                {"name": "Portable Bluetooth Speaker Waterproof", "category": "Audio", "cost": 1600.0, "price": 2799.0, "stock": 65, "weight": 520, "length": 18, "height": 7, "width": 7},
                {"name": "Smart LED Desk Lamp with Dimmer", "category": "Home & Office", "cost": 850.0, "price": 1499.0, "stock": 70, "weight": 650, "length": 35, "height": 40, "width": 15},
                {"name": "Stainless Steel Thermal Water Bottle 1L", "category": "Home & Office", "cost": 380.0, "price": 799.0, "stock": 150, "weight": 420, "length": 28, "height": 8, "width": 8},
                {"name": "High-Speed USB 3.2 Flash Drive 256GB", "category": "Storage", "cost": 900.0, "price": 1599.0, "stock": 110, "weight": 35, "length": 6, "height": 1, "width": 2},
                {"name": "Ergonomic Memory Foam Lumbar Cushion", "category": "Home & Office", "cost": 650.0, "price": 1299.0, "stock": 85, "weight": 700, "length": 38, "height": 10, "width": 32},
                {"name": "Compact Travel GaN Charger 65W", "category": "Electronics", "cost": 1150.0, "price": 1999.0, "stock": 90, "weight": 130, "length": 7, "height": 3, "width": 4},
            ]

            created_products = []
            for p in sample_products:
                prod = Product(
                    product_name=p["name"],
                    category=p["category"],
                    cost_price=p["cost"],
                    selling_price=p["price"],
                    stock=p["stock"],
                    product_weight=p["weight"],
                    product_length=p["length"],
                    product_height=p["height"],
                    product_width=p["width"],
                    created_at=datetime.utcnow() - timedelta(days=random.randint(10, 180))
                )
                db.add(prod)
                created_products.append(prod)

            db.commit()
            print(f"Seeded {len(created_products)} products.")

            # Seed sales records
            for prod in created_products:
                db.refresh(prod)
                for day_offset in range(1, 45, 3):
                    qty = random.randint(2, 18)
                    sale = Sales(
                        product_id=prod.id,
                        quantity_sold=qty,
                        revenue=qty * prod.selling_price,
                        sale_date=datetime.utcnow() - timedelta(days=day_offset)
                    )
                    db.add(sale)

                # Seed competitor price
                comp = CompetitorPrice(
                    product_id=prod.id,
                    competitor_name=random.choice(["Flipkart", "Amazon", "Reliance Digital", "Croma"]),
                    competitor_price=round(prod.selling_price * random.uniform(0.92, 1.12), 2),
                    recorded_at=datetime.utcnow()
                )
                db.add(comp)

                # Seed price history
                ph = PriceHistory(
                    product_id=prod.id,
                    old_price=round(prod.selling_price * random.uniform(0.90, 1.05), 2),
                    new_price=prod.selling_price,
                    change_reason="AI dynamic price adjustment",
                    changed_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
                )
                db.add(ph)

            db.commit()
            print("Seeded associated sales, competitor prices, and price history records.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
