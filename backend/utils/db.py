import os
import json
import logging
import psycopg2
import urllib.parse
from dotenv import load_dotenv
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pricepilot_db")

# Database paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONFIG_PATH = os.path.join(BASE_DIR, "backend", "db_config.json")

def load_db_config():
    # Attempt to load from env first, then fallback to db_config.json
    config = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": os.getenv("DB_PORT", "5432"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "pricepilot_ai"),
    }
    
    # If any env is missing, attempt to load from db_config.json if it exists
    if not os.getenv("DB_HOST") and os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r") as f:
                file_config = json.load(f)
                config.update(file_config)
        except Exception as e:
            logger.error(f"Failed to read db_config.json: {str(e)}")
            
    # Normalize port
    try:
        config["port"] = int(config["port"])
    except ValueError:
        config["port"] = 5432
            
    # Always PostgreSQL
    config["engine"] = "postgresql"
    return config

# Setup SQLAlchemy engine and SessionLocal directly at module level
_sa_config = load_db_config()
_encoded_password = urllib.parse.quote_plus(_sa_config.get("password", ""))
DATABASE_URL = f"postgresql://{_sa_config.get('user', 'postgres')}:{_encoded_password}@{_sa_config.get('host', 'localhost')}:{_sa_config.get('port', 5432)}/{_sa_config.get('database', 'pricepilot_ai')}"

IS_SQLITE = False
try:
    _test_conn = psycopg2.connect(
        host=_sa_config.get("host", "localhost"),
        port=int(_sa_config.get("port", 5432)),
        user=_sa_config.get("user", "postgres"),
        password=_sa_config.get("password", ""),
        database="postgres",
        connect_timeout=2
    )
    _test_conn.close()
except Exception:
    logger.warning("PostgreSQL offline or credentials unconfigured. Activating SQLite database fallback mode for Demo Mode.")
    DATABASE_URL = "sqlite:///pricepilot_demo.db"
    IS_SQLITE = True

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_sqlalchemy():
    pass  # Kept for backward compatibility

def save_db_config(config):
    """Saves database credentials config."""
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    save_config = {
        "host": config.get("host", "localhost"),
        "port": config.get("port", 5432),
        "user": config.get("user", "postgres"),
        "password": config.get("password", ""),
        "database": config.get("database", "pricepilot_ai")
    }
    with open(CONFIG_PATH, "w") as f:
        json.dump(save_config, f, indent=4)

def get_db_connection():
    """Obtains a connection from database, falling back to SQLite if PostgreSQL is unreachable."""
    global IS_SQLITE
    if IS_SQLITE:
        import sqlite3
        conn = sqlite3.connect("pricepilot_demo.db")
        conn.row_factory = sqlite3.Row
        return conn, "sqlite"
    else:
        connection = engine.raw_connection()
        return connection, "postgresql"

def execute_query(query, params=(), is_write=False):
    """Utility to run SQL queries on PostgreSQL/SQLite and handle connection cycles."""
    conn, engine_type = get_db_connection()
    if engine_type == "sqlite":
        query = query.replace("%s", "?")
        
    cursor = conn.cursor()
    result = None
    try:
        cursor.execute(query, params)
        if is_write:
            conn.commit()
            result = None
        else:
            rows = cursor.fetchall()
            if engine_type == "sqlite":
                result = [dict(row) for row in rows]
            else:
                if cursor.description:
                    columns = [col[0] for col in cursor.description]
                    result = [dict(zip(columns, row)) for row in rows]
                else:
                    result = rows
    except Exception as e:
        logger.error(f"SQL execution error ({engine_type}): {str(e)}\nQuery: {query}")
        if is_write:
            conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
    return result

def init_database():
    """Initializes tables for PricePilot AI dynamic pricing operating system with updated schema."""
    global IS_SQLITE
    if IS_SQLITE:
        logger.info("Initializing SQLite fallback database schemas...")
    else:
        config = load_db_config()
        try:
            temp_conn = psycopg2.connect(
                host=config.get("host", "localhost"),
                port=int(config.get("port", 5432)),
                user=config.get("user", "postgres"),
                password=config.get("password", ""),
                database="postgres"
            )
            temp_conn.autocommit = True
            temp_conn_cursor = temp_conn.cursor()
            temp_conn_cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (config.get("database", "pricepilot_ai"),))
            exists = temp_conn_cursor.fetchone()
            if not exists:
                from psycopg2.extensions import quote_ident
                dbname = quote_ident(config.get("database", "pricepilot_ai"), temp_conn)
                temp_conn_cursor.execute(f"CREATE DATABASE {dbname}")
                logger.info(f"Database {config.get('database')} created successfully.")
            temp_conn_cursor.close()
            temp_conn.close()
        except Exception as e:
            logger.warning(f"Could not check or create PostgreSQL database dynamically: {str(e)}")

    conn, db_engine = get_db_connection()
    cursor = conn.cursor()

    tables = {
        "users": """
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(64) PRIMARY KEY,
                name VARCHAR(128) NOT NULL,
                email VARCHAR(128) UNIQUE NOT NULL,
                password_hash VARCHAR(128) NOT NULL,
                role VARCHAR(32) NOT NULL,
                created_at TIMESTAMP NOT NULL,
                full_name VARCHAR(128),
                password VARCHAR(128),
                department VARCHAR(64),
                phone VARCHAR(32),
                created_date TIMESTAMP,
                last_login TIMESTAMP,
                status VARCHAR(32),
                profile_image TEXT,
                login_provider VARCHAR(64) DEFAULT 'Local'
            )
        """,
        "products": """
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                product_id VARCHAR(64) UNIQUE NOT NULL,
                name VARCHAR(255),
                category VARCHAR(128) NOT NULL,
                current_price DOUBLE PRECISION,
                cost_price DOUBLE PRECISION,
                stock INTEGER DEFAULT 100,
                weight DOUBLE PRECISION,
                freight_value DOUBLE PRECISION NOT NULL,
                delivery_days DOUBLE PRECISION NOT NULL,
                created_at TIMESTAMP NOT NULL,
                product_name VARCHAR(255),
                actual_price DOUBLE PRECISION,
                predicted_price DOUBLE PRECISION,
                product_weight DOUBLE PRECISION,
                demand_level VARCHAR(32) DEFAULT 'Medium'
            )
        """,
        "prediction_history": """
            CREATE TABLE IF NOT EXISTS prediction_history (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                model_name VARCHAR(64) NOT NULL,
                model_version VARCHAR(32) DEFAULT '1.0.0',
                predicted_price DOUBLE PRECISION NOT NULL,
                confidence DOUBLE PRECISION NOT NULL,
                recommended_price DOUBLE PRECISION NOT NULL,
                reason TEXT,
                user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
                prediction_timestamp TIMESTAMP NOT NULL,
                request_id VARCHAR(64),
                prediction_version VARCHAR(32) DEFAULT '1.0.0',
                legacy_product_id VARCHAR(64),
                product_name VARCHAR(255),
                category VARCHAR(128) NOT NULL,
                actual_price DOUBLE PRECISION,
                model_used VARCHAR(64),
                features TEXT,
                created_date TIMESTAMP,
                user_email VARCHAR(128),
                demand VARCHAR(32),
                llm_reason TEXT
            )
        """,
        "price_recommendations": """
            CREATE TABLE IF NOT EXISTS price_recommendations (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                current_price DOUBLE PRECISION,
                recommended_price DOUBLE PRECISION NOT NULL,
                forecasted_demand DOUBLE PRECISION,
                competitor_price DOUBLE PRECISION,
                reason TEXT NOT NULL,
                generated_at TIMESTAMP NOT NULL,
                legacy_product_id VARCHAR(64),
                predicted_price DOUBLE PRECISION,
                recommendation_text TEXT,
                created_at TIMESTAMP
            )
        """,
        "demand_forecasts": """
            CREATE TABLE IF NOT EXISTS demand_forecasts (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                forecast_date TIMESTAMP NOT NULL,
                predicted_demand DOUBLE PRECISION NOT NULL,
                lower_bound DOUBLE PRECISION NOT NULL,
                upper_bound DOUBLE PRECISION NOT NULL,
                confidence DOUBLE PRECISION NOT NULL,
                model_version VARCHAR(32) DEFAULT '1.0.0',
                created_at TIMESTAMP NOT NULL
            )
        """,
        "training_history": """
            CREATE TABLE IF NOT EXISTS training_history (
                id SERIAL PRIMARY KEY,
                model_name VARCHAR(64) NOT NULL,
                dataset_version VARCHAR(32) DEFAULT '1.0.0',
                accuracy DOUBLE PRECISION NOT NULL,
                mae DOUBLE PRECISION NOT NULL,
                rmse DOUBLE PRECISION NOT NULL,
                training_time DOUBLE PRECISION NOT NULL,
                trained_by VARCHAR(128) DEFAULT 'system',
                trained_at TIMESTAMP NOT NULL,
                r2 DOUBLE PRECISION,
                mse DOUBLE PRECISION,
                inference_time DOUBLE PRECISION,
                status VARCHAR(32) DEFAULT 'completed',
                timestamp TIMESTAMP
            )
        """,
        "activity_logs": """
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(128) NOT NULL,
                module VARCHAR(64) DEFAULT 'General',
                description TEXT,
                timestamp TIMESTAMP NOT NULL,
                user_email VARCHAR(128),
                details TEXT
            )
        """,
        "model_metrics": """
            CREATE TABLE IF NOT EXISTS model_metrics (
                id SERIAL PRIMARY KEY,
                model_name VARCHAR(64) UNIQUE NOT NULL,
                metrics TEXT NOT NULL
            )
        """,
        "forecast_history": """
            CREATE TABLE IF NOT EXISTS forecast_history (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                forecast_date DATE NOT NULL,
                demand DOUBLE PRECISION NOT NULL,
                lower_ci DOUBLE PRECISION NOT NULL,
                upper_ci DOUBLE PRECISION NOT NULL,
                model_used VARCHAR(64) NOT NULL,
                timestamp TIMESTAMP NOT NULL
            )
        """,
        "notifications": """
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                type VARCHAR(32) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(32) NOT NULL,
                timestamp TIMESTAMP NOT NULL
            )
        """,
        "audit_logs": """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                product_name VARCHAR(255),
                predicted_price DOUBLE PRECISION NOT NULL,
                model_used VARCHAR(64) NOT NULL,
                confidence DOUBLE PRECISION NOT NULL,
                llm_output TEXT,
                prediction_time TIMESTAMP NOT NULL,
                operator VARCHAR(128) NOT NULL,
                request_id VARCHAR(64),
                prediction_version VARCHAR(32) DEFAULT '1.0.0',
                legacy_product_id VARCHAR(64)
            )
        """,
        "competitor_prices": """
            CREATE TABLE IF NOT EXISTS competitor_prices (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                competitor_name VARCHAR(128) NOT NULL,
                competitor_price DOUBLE PRECISION NOT NULL,
                recorded_at TIMESTAMP NOT NULL,
                source VARCHAR(128) DEFAULT 'demo'
            )
        """,
        "competitive_analysis_history": """
            CREATE TABLE IF NOT EXISTS competitive_analysis_history (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                our_price DOUBLE PRECISION NOT NULL,
                competitor_average DOUBLE PRECISION NOT NULL,
                price_gap DOUBLE PRECISION NOT NULL,
                competitive_position VARCHAR(64) NOT NULL,
                recommended_price DOUBLE PRECISION NOT NULL,
                ai_insight TEXT,
                user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP NOT NULL
            )
        """
    }
    
    if db_engine == "sqlite":
        for name in list(tables.keys()):
            tables[name] = tables[name].replace("SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
            tables[name] = tables[name].replace("DOUBLE PRECISION", "REAL")

    def run_execute(q, p=()):
        if db_engine == "sqlite":
            q = q.replace("%s", "?")
        cursor.execute(q, p)

    try:
        # Create core tables
        for t_name, t_sql in tables.items():
            run_execute(t_sql)
        conn.commit()
        
        # Dynamically upgrade schemas if columns are missing or indices needed (Auto-Migrations)
        migrations = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS login_provider VARCHAR(64) DEFAULT 'Local';",
            "ALTER TABLE forecast_history ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;",
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;",
            "ALTER TABLE prediction_history ADD COLUMN IF NOT EXISTS request_id VARCHAR(64);",
            "ALTER TABLE prediction_history ADD COLUMN IF NOT EXISTS prediction_version VARCHAR(32) DEFAULT '1.0.0';",
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_id VARCHAR(64);",
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS prediction_version VARCHAR(32) DEFAULT '1.0.0';",
            # Database performance indexes
            "CREATE INDEX IF NOT EXISTS idx_prediction_history_product_id ON prediction_history(product_id);",
            "CREATE INDEX IF NOT EXISTS idx_prediction_history_user_id ON prediction_history(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_price_recommendations_product_id ON price_recommendations(product_id);",
            "CREATE INDEX IF NOT EXISTS idx_demand_forecasts_product_id ON demand_forecasts(product_id);",
            "CREATE INDEX IF NOT EXISTS idx_forecast_history_product_id ON forecast_history(product_id);",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_product_id ON audit_logs(product_id);",
            "CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_notifications_product_id ON notifications(product_id);"
        ]
        for m_sql in migrations:
            try:
                cursor.execute(m_sql)
            except Exception as ex:
                logger.warning(f"Ignored schema upgrade issue: {str(ex)}")
        conn.commit()
        logger.info("Database successfully initialized and migrated with enterprise tables and indexes")
        
        # Provision default admin/guest/demo users if they do not exist individually
        from backend.utils.security import hash_password
        
        # Admin User
        run_execute("SELECT COUNT(*) FROM users WHERE email = %s", ("admin@pricepilot.ai",))
        if cursor.fetchone()[0] == 0:
            hashed_admin = hash_password("admin")
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            run_execute(
                """
                INSERT INTO users (
                    id, name, email, password_hash, role, created_at,
                    full_name, password, department, phone, created_date, status, profile_image
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    "usr-admin-001",
                    "Administrator",
                    "admin@pricepilot.ai",
                    hashed_admin,
                    "Admin",
                    now_str,
                    "Administrator",
                    hashed_admin,
                    "Executive Suite",
                    "+1-555-0199",
                    now_str,
                    "Active",
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                )
            )
            logger.info("Provisioned default admin user: admin@pricepilot.ai")

        # Guest User
        run_execute("SELECT COUNT(*) FROM users WHERE email = %s", ("guest@pricepilot.ai",))
        if cursor.fetchone()[0] == 0:
            hashed_guest = hash_password("guest")
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            run_execute(
                """
                INSERT INTO users (
                    id, name, email, password_hash, role, created_at,
                    full_name, password, department, phone, created_date, status, profile_image
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    "usr-guest-002",
                    "Guest User",
                    "guest@pricepilot.ai",
                    hashed_guest,
                    "Viewer",
                    now_str,
                    "Guest User",
                    hashed_guest,
                    "Operations Management",
                    "+1-555-0100",
                    now_str,
                    "Active",
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                )
            )
            logger.info("Provisioned default guest user: guest@pricepilot.ai")

        # Demo User
        run_execute("SELECT COUNT(*) FROM users WHERE email = %s", ("demo@pricepilot.ai",))
        if cursor.fetchone()[0] == 0:
            hashed_demo = hash_password("demo")
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            run_execute(
                """
                INSERT INTO users (
                    id, name, email, password_hash, role, created_at,
                    full_name, password, department, phone, created_date, status, profile_image
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    "usr-demo-003",
                    "Demo Analyst",
                    "demo@pricepilot.ai",
                    hashed_demo,
                    "Analyst",
                    now_str,
                    "Demo Analyst",
                    hashed_demo,
                    "Revenue Operations",
                    "+1-555-0155",
                    now_str,
                    "Active",
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
                )
            )
            logger.info("Provisioned default demo user: demo@pricepilot.ai")
            
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {str(e)}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

    # Create tables using SQLAlchemy (double check)
    from backend.models.sql_models import Base, Product
    try:
        Base.metadata.create_all(engine)
        logger.info("SQLAlchemy tables verified successfully.")
    except Exception as sa_err:
        logger.error(f"Failed to synchronize SQLAlchemy tables: {str(sa_err)}")

    # Automatically populate products table from dataset CSV if empty
    db = SessionLocal()
    try:
        product_count = db.query(Product).count()
        if product_count == 0:
            logger.info("Populating products table from CSV dataset...")
            from backend.services.data_service import ensure_dataset_loaded, _products_cache
            ensure_dataset_loaded()
            
            products_to_insert = []
            for pid, details in _products_cache.items():
                popularity = details.get("popularity_score", 0)
                if popularity > 70:
                    demand_level = "High"
                elif popularity > 30:
                    demand_level = "Medium"
                else:
                    demand_level = "Low"
                    
                p = Product(
                    product_id=pid,
                    name=details["product_name"],
                    product_name=details["product_name"],
                    category=details["category"],
                    current_price=details["historical_average_price"],
                    actual_price=details["historical_average_price"],
                    cost_price=details["historical_average_price"],
                    predicted_price=details["historical_average_price"],
                    stock=100,
                    weight=details["weight"],
                    product_weight=details["weight"],
                    freight_value=details["avg_freight"],
                    delivery_days=details["avg_delivery_days"],
                    demand_level=demand_level
                )
                products_to_insert.append(p)
                
                # Commit in batches of 1000 to keep transaction small
                if len(products_to_insert) >= 1000:
                    db.add_all(products_to_insert)
                    db.commit()
                    products_to_insert = []
                    
            if products_to_insert:
                db.add_all(products_to_insert)
                db.commit()
            logger.info(f"Successfully populated {db.query(Product).count()} products in PostgreSQL!")
    except Exception as pop_err:
        logger.error(f"Failed to populate products table from CSV: {str(pop_err)}")
        db.rollback()
    finally:
        db.close()
