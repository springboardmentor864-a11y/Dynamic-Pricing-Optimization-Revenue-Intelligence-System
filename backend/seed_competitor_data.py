"""
Seed Competitor Data Script (PricePilot AI)
Reads dataset/competitor_prices.csv, validates columns and numbers, calculates derived fields,
and imports records into PostgreSQL/SQLite database.
"""

import os
import sys
import pandas as pd
from datetime import datetime

# Path setup for direct script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from database import engine, SessionLocal, Base
    from models import CompetitorPrice, CompetitorAnalysis, Product
except ImportError:
    from backend.database import engine, SessionLocal, Base
    from backend.models import CompetitorPrice, CompetitorAnalysis, Product

CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dataset", "competitor_prices.csv")

REQUIRED_COLUMNS = [
    "product_id", "product_name", "category", "brand", "our_price",
    "competitor_name", "competitor_price", "price_difference",
    "price_difference_percentage", "competitor_rating", "competitor_stock",
    "marketplace", "date"
]


def seed_competitor_dataset(csv_file_path: str = CSV_PATH, verbose: bool = True) -> dict:
    if verbose:
        print("\nCompetitor Dataset Import")
        print("-------------------------")

    if not os.path.exists(csv_file_path):
        err_msg = f"Error: Dataset CSV file not found at '{csv_file_path}'."
        if verbose:
            print(err_msg)
            print("Status: FAILED")
        return {"records_found": 0, "records_inserted": 0, "duplicates_skipped": 0, "status": "FAILED", "message": err_msg}

    try:
        df = pd.read_csv(csv_file_path, comment="#")
    except Exception as e:
        err_msg = f"Error reading CSV file: {e}"
        if verbose:
            print(err_msg)
            print("Status: FAILED")
        return {"records_found": 0, "records_inserted": 0, "duplicates_skipped": 0, "status": "FAILED", "message": err_msg}

    records_found = len(df)
    
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    records_inserted = 0
    duplicates_skipped = 0

    try:
        existing_keys = set(
            db.query(
                CompetitorPrice.product_id,
                CompetitorPrice.competitor_name,
                CompetitorPrice.captured_at
            ).all()
        )

        new_objects = []

        for _, row in df.iterrows():
            product_id = str(row.get("product_id", "")).strip()
            product_name = str(row.get("product_name", f"Product #{product_id}")).strip()
            category = str(row.get("category", "Electronics")).strip()
            brand = str(row.get("brand", "Generic")).strip()
            competitor_name = str(row.get("competitor_name", "")).strip()
            competitor_product_name = str(row.get("competitor_product_name", product_name)).strip()
            marketplace = str(row.get("marketplace", f"{competitor_name} Store")).strip()
            currency = str(row.get("currency", "INR")).strip()
            source = str(row.get("source", "Manual")).strip()
            captured_at = str(row.get("captured_at", row.get("date", datetime.utcnow().strftime("%Y-%m-%d")))).strip()

            if not product_id or not competitor_name or not captured_at:
                continue

            try:
                our_price = float(row["our_price"])
                competitor_price = float(row["competitor_price"])
            except (ValueError, TypeError, KeyError):
                continue

            if our_price < 0 or competitor_price < 0:
                continue

            price_diff = round(our_price - competitor_price, 2)
            price_diff_pct = round(((our_price - competitor_price) / competitor_price) * 100, 2) if competitor_price > 0 else 0.0

            try:
                rating = float(row.get("competitor_rating", 4.5))
                rating = max(0.0, min(5.0, rating))
            except (ValueError, TypeError):
                rating = 4.5

            try:
                stock = int(row.get("competitor_stock", 50))
                stock = max(0, stock)
            except (ValueError, TypeError):
                stock = 50

            record_key = (product_id, competitor_name, captured_at)
            if record_key in existing_keys:
                duplicates_skipped += 1
                continue

            existing_keys.add(record_key)

            comp_obj = CompetitorPrice(
                product_id=product_id,
                product_name=product_name,
                category=category,
                brand=brand,
                our_price=our_price,
                competitor_name=competitor_name,
                competitor_product_name=competitor_product_name,
                competitor_price=competitor_price,
                price_difference=price_diff,
                price_difference_percentage=price_diff_pct,
                competitor_rating=rating,
                competitor_stock=stock,
                marketplace=marketplace,
                currency=currency,
                source=source,
                captured_at=captured_at,
                recorded_at=captured_at,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            new_objects.append(comp_obj)

            if len(new_objects) >= 500:
                db.bulk_save_objects(new_objects)
                db.commit()
                records_inserted += len(new_objects)
                new_objects = []

        if new_objects:
            db.bulk_save_objects(new_objects)
            db.commit()
            records_inserted += len(new_objects)

        summary = {
            "records_found": records_found,
            "records_inserted": records_inserted,
            "duplicates_skipped": duplicates_skipped,
            "status": "SUCCESS",
            "message": "Competitor pricing dataset imported successfully."
        }

        if verbose:
            print(f"Records found: {records_found}")
            print(f"Records inserted: {records_inserted}")
            print(f"Duplicates skipped: {duplicates_skipped}")
            print("Status: SUCCESS")

        return summary

    except Exception as e:
        db.rollback()
        err_msg = f"Database Error during import: {e}"
        if verbose:
            print(err_msg)
            print("Status: FAILED")
        return {
            "records_found": records_found,
            "records_inserted": records_inserted,
            "duplicates_skipped": duplicates_skipped,
            "status": "FAILED",
            "message": err_msg
        }
    finally:
        db.close()


if __name__ == "__main__":
    seed_competitor_dataset()
