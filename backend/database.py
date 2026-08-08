import time
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

try:
    from config import DATABASE_URL
except ImportError:
    from backend.config import DATABASE_URL

# PostgreSQL Connection Pooling Configuration with SQLite Fallback
try:
    if "postgresql" in DATABASE_URL:
        engine = create_engine(
            DATABASE_URL,
            pool_size=20,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=1800,
            pool_pre_ping=True
        )
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    else:
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
except Exception as psql_err:
    print(f"Warning: Could not connect to PostgreSQL ({psql_err}). Falling back to local SQLite database.")
    DATABASE_URL = "sqlite:///./pricepilot.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    """Utility function to verify PostgreSQL database connectivity."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print("Database connection error:", e)
        return False


def get_db_status_details() -> dict:
    """Detailed health and metrics checker for PostgreSQL status card."""
    start_time = time.time()
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        pool = engine.pool
        checked_in = pool.checkedin()
        checked_out = pool.checkedout()

        return {
            "connected": True,
            "status": "Connected",
            "database_name": "pricepilot",
            "host": "localhost",
            "port": 5432,
            "pool_status": f"Active: {checked_out} | Idle: {checked_in} | Max: 30",
            "response_time_ms": elapsed_ms,
            "active_connections": checked_out + 1
        }
    except Exception as e:
        return {
            "connected": False,
            "status": "Disconnected",
            "database_name": "pricepilot",
            "host": "localhost",
            "port": 5432,
            "pool_status": "Unavailable",
            "response_time_ms": 0,
            "active_connections": 0,
            "error": str(e)
        }