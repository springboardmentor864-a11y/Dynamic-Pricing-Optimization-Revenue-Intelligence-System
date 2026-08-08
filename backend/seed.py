import os
import sys

# Ensure backend package can be imported when running directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from database import engine, Base, SessionLocal
    from models import User, Product, Setting, Notification, ActivityLog
    from security import get_password_hash
except ImportError:
    from backend.database import engine, Base, SessionLocal
    from backend.models import User, Product, Setting, Notification, ActivityLog
    from backend.security import get_password_hash

from sqlalchemy import text

def init_db_and_seed():
    print("Initializing Database tables...")
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc');"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'approved';"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITHOUT TIME ZONE;"))
            conn.execute(text("ALTER TABLE password_reset_otps ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;"))
            conn.execute(text("ALTER TABLE password_reset_otps ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);"))
            conn.commit()
    except Exception as e:
        print("Auto-migration notice:", e)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check default users: Admin (admin/admin123) and User (viewer/viewer123)
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("Seeding Admin account (admin)...")
            admin_user = User(
                name="System Administrator",
                email="admin@pricepilot.ai",
                username="admin",
                password_hash=get_password_hash("admin123"),
                role="Admin",
                is_active=True,
                is_approved=True,
                status="approved"
            )
            db.add(admin_user)
        else:
            admin_user.role = "Admin"
            admin_user.is_approved = True
            admin_user.status = "approved"

        viewer_user = db.query(User).filter(User.username == "viewer").first()
        if not viewer_user:
            print("Seeding User account (viewer)...")
            viewer_user = User(
                name="Enterprise User",
                email="user@pricepilot.ai",
                username="viewer",
                password_hash=get_password_hash("viewer123"),
                role="User",
                is_active=True,
                is_approved=True,
                status="approved"
            )
            db.add(viewer_user)
        else:
            viewer_user.role = "User"
            viewer_user.is_approved = True
            viewer_user.status = "approved"

        db.commit()

        print("PostgreSQL User Seeding Completed Successfully: admin (Admin) & viewer (User)")

        # Check if default settings exist
        if db.query(Setting).count() == 0:
            setting = Setting(theme="dark", language="en", notifications_enabled=True)
            db.add(setting)
            db.commit()

        # Check if sample notifications exist
        if db.query(Notification).count() == 0:
            notifications = [
                Notification(title="System Operational", message="FastAPI backend and PostgreSQL database initialized successfully.", type="success"),
                Notification(title="ML Model Loaded", message="Extra Trees Regressor dynamic pricing model loaded.", type="info"),
                Notification(title="Enterprise Security Active", message="JWT & Bcrypt authentication active across all routes.", type="info")
            ]
            for n in notifications:
                db.add(n)
            db.commit()

        # Check if sample products exist
        if db.query(Product).count() == 0:
            sample_products = [
                Product(name="Enterprise Server Array X1", category="Electronics", current_price=1250.0, cost_price=850.0, stock=45),
                Product(name="AI Workstation Pro", category="Computers", current_price=2499.0, cost_price=1750.0, stock=20),
                Product(name="Cloud Gateway Router", category="Networking", current_price=399.0, cost_price=220.0, stock=80),
                Product(name="Quantum Storage Disk 4TB", category="Storage", current_price=189.0, cost_price=110.0, stock=150)
            ]
            for p in sample_products:
                db.add(p)
            db.commit()

        print("Database verification completed.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db_and_seed()
