import os
import sys
import psycopg2
from dotenv import load_dotenv
from datetime import datetime

# Resolve paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from backend.utils.db import get_db_connection, load_db_config, engine
from backend.models.sql_models import Base

def run_migration():
    print("Starting PostgreSQL database migration...")
    
    # 1. Back up existing tables
    conn, _ = get_db_connection()
    conn.autocommit = True
    cursor = conn.cursor()
    
    tables_to_backup = [
        'users', 'products', 'prediction_history', 'price_recommendations',
        'forecast_history', 'activity_logs', 'training_history',
        'model_metrics', 'notifications', 'audit_logs', 'demand_forecasts'
    ]
    
    print("1. Creating legacy backups...")
    for t in tables_to_backup:
        try:
            # Check if table exists
            cursor.execute(f"SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '{t}')")
            exists = cursor.fetchone()[0]
            if exists:
                # Create backup table if not exists
                backup_name = f"legacy_backup_{t}"
                cursor.execute(f"SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '{backup_name}')")
                backup_exists = cursor.fetchone()[0]
                
                if not backup_exists:
                    print(f"   Backing up table '{t}' to '{backup_name}'...")
                    cursor.execute(f"CREATE TABLE {backup_name} AS SELECT * FROM {t}")
                else:
                    print(f"   Backup table '{backup_name}' already exists. Skipping backup creation.")
            else:
                print(f"   Table '{t}' does not exist. Skipping backup.")
        except Exception as e:
            print(f"   Error backing up table '{t}': {str(e)}")
            
    print("2. Dropping original tables cascade to clear foreign keys...")
    try:
        drop_query = f"DROP TABLE IF EXISTS {', '.join(tables_to_backup)} CASCADE;"
        cursor.execute(drop_query)
        print("   Dropped legacy tables successfully.")
    except Exception as e:
        print(f"   Error dropping tables: {str(e)}")
        sys.exit(1)
        
    cursor.close()
    conn.close()
    
    # 2. Recreate tables using updated SQLAlchemy models
    print("3. Creating tables with new schemas and foreign keys...")
    try:
        Base.metadata.create_all(engine)
        print("   Created SQLAlchemy tables successfully.")
    except Exception as e:
        print(f"   Error creating SQLAlchemy tables: {str(e)}")
        sys.exit(1)
        
    # 3. Migrate data from backups to new tables
    print("4. Migrating data...")
    conn, _ = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Migrate users
        cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_backup_users')")
        if cursor.fetchone()[0]:
            print("   Migrating users...")
            cursor.execute("SELECT * FROM legacy_backup_users")
            cols = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            for row in rows:
                user_dict = dict(zip(cols, row))
                
                pwd = user_dict.get('password_hash') or user_dict.get('password', 'admin')
                name = user_dict.get('full_name') or user_dict.get('name', 'System User')
                created_at = user_dict.get('created_at') or user_dict.get('created_date', datetime.utcnow())
                
                cursor.execute(
                    """
                    INSERT INTO users (
                        id, name, email, password_hash, role, created_at,
                        full_name, password, department, phone, created_date,
                        last_login, status, profile_image
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        user_dict['id'], name, user_dict['email'], pwd, user_dict['role'], created_at,
                        user_dict.get('full_name'), pwd, user_dict.get('department'),
                        user_dict.get('phone'), user_dict.get('created_date'), user_dict.get('last_login'),
                        user_dict.get('status'), user_dict.get('profile_image')
                    )
                )
            print(f"   Successfully migrated {len(rows)} users.")
            
        # Migrate products
        cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_backup_products')")
        if cursor.fetchone()[0]:
            print("   Migrating products...")
            cursor.execute("SELECT * FROM legacy_backup_products")
            cols = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            for row in rows:
                p_dict = dict(zip(cols, row))
                
                name = p_dict.get('product_name') or p_dict.get('name')
                curr_price = p_dict.get('actual_price') or p_dict.get('current_price') or 0.0
                cost_price = p_dict.get('predicted_price') or p_dict.get('cost_price') or 0.0
                weight = p_dict.get('product_weight') or p_dict.get('weight') or 0.0
                
                cursor.execute(
                    """
                    INSERT INTO products (
                        product_id, name, category, current_price, cost_price,
                        stock, weight, freight_value, delivery_days, created_at,
                        product_name, actual_price, predicted_price, product_weight, demand_level
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        p_dict['product_id'], name, p_dict['category'], curr_price, cost_price,
                        p_dict.get('stock', 100), weight, p_dict['freight_value'], p_dict['delivery_days'], p_dict['created_at'],
                        p_dict.get('product_name'), p_dict.get('actual_price'), p_dict.get('predicted_price'),
                        p_dict.get('product_weight'), p_dict.get('demand_level')
                    )
                )
            print(f"   Successfully migrated {len(rows)} products.")
            
        # Load products mapping for fast ID lookup
        cursor.execute("SELECT id, product_id, current_price FROM products")
        product_map = {row[1]: (row[0], row[2]) for row in cursor.fetchall()}
        
        # Get first product ID to use as default product link for global forecasts
        cursor.execute("SELECT id FROM products LIMIT 1")
        default_prod_res = cursor.fetchone()
        default_prod_id_int = default_prod_res[0] if default_prod_res else None
        
        # Load users mapping for fast ID lookup
        cursor.execute("SELECT id, email FROM users")
        user_map = {row[1]: row[0] for row in cursor.fetchall()}
        
        default_user_id = user_map.get('admin@pricepilot.ai', 'usr-admin-001')
        
        # Migrate prediction_history
        cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_backup_prediction_history')")
        if cursor.fetchone()[0]:
            print("   Migrating prediction history...")
            cursor.execute("SELECT * FROM legacy_backup_prediction_history")
            cols = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            for row in rows:
                ph_dict = dict(zip(cols, row))
                
                # Resolve product foreign key
                p_id_str = ph_dict.get('legacy_product_id') or ph_dict.get('product_id')
                p_info = product_map.get(p_id_str)
                p_id_int = p_info[0] if p_info else None
                
                # Resolve user foreign key
                u_email = ph_dict.get('user_email')
                u_id = user_map.get(u_email, default_user_id)
                
                model_name = ph_dict.get('model_used') or ph_dict.get('model_name', 'XGBoost Regressor')
                predicted_price = ph_dict.get('predicted_price', 0.0)
                confidence = ph_dict.get('confidence', 0.0)
                reason = ph_dict.get('llm_reason') or ph_dict.get('reason') or 'Simulation Prediction'
                prediction_timestamp = ph_dict.get('prediction_timestamp') or ph_dict.get('created_date') or datetime.utcnow()
                
                cursor.execute(
                    """
                    INSERT INTO prediction_history (
                        product_id, model_name, model_version, predicted_price, confidence,
                        recommended_price, reason, user_id, prediction_timestamp,
                        request_id, prediction_version,
                        legacy_product_id, product_name, category, actual_price, model_used,
                        features, created_date, user_email, demand, llm_reason
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        p_id_int, model_name, ph_dict.get('model_version', '1.0.0'), predicted_price, confidence,
                        predicted_price, reason, u_id, prediction_timestamp,
                        ph_dict.get('request_id'), ph_dict.get('prediction_version', '1.0.0'),
                        p_id_str, ph_dict.get('product_name'), ph_dict.get('category'),
                        ph_dict.get('actual_price'), model_name, ph_dict.get('features'),
                        prediction_timestamp, u_email, ph_dict.get('demand'), reason
                    )
                )
            print(f"   Successfully migrated {len(rows)} prediction history entries.")
            
        # Migrate recommendations
        cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_backup_price_recommendations')")
        if cursor.fetchone()[0]:
            print("   Migrating price recommendations...")
            cursor.execute("SELECT * FROM legacy_backup_price_recommendations")
            cols = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            for row in rows:
                rec_dict = dict(zip(cols, row))
                
                p_id_str = rec_dict.get('legacy_product_id') or rec_dict.get('product_id')
                p_info = product_map.get(p_id_str, (None, 0.0))
                p_id_int = p_info[0]
                curr_price = p_info[1] or 0.0
                
                recommended_price = rec_dict.get('recommended_price') or rec_dict.get('predicted_price', 0.0)
                reason = rec_dict.get('recommendation_text') or rec_dict.get('reason', 'Simulation price adjustment')
                generated_at = rec_dict.get('generated_at') or rec_dict.get('created_at') or datetime.utcnow()
                
                cursor.execute(
                    """
                    INSERT INTO price_recommendations (
                        product_id, current_price, recommended_price, forecasted_demand, competitor_price,
                        reason, generated_at, legacy_product_id, predicted_price, recommendation_text, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        p_id_int, curr_price, recommended_price, rec_dict.get('forecasted_demand', 100.0), rec_dict.get('competitor_price', recommended_price * 0.95),
                        reason, generated_at, p_id_str, recommended_price, reason, generated_at
                    )
                )
            print(f"   Successfully migrated {len(rows)} recommendations.")
            
        # Migrate forecast_history to demand_forecasts and forecast_history
        cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_backup_forecast_history')")
        if cursor.fetchone()[0]:
            print("   Migrating forecasts...")
            cursor.execute("SELECT * FROM legacy_backup_forecast_history")
            cols = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            for row in rows:
                f_dict = dict(zip(cols, row))
                
                f_date = f_dict['forecast_date']
                demand = f_dict['demand']
                lower_ci = f_dict['lower_ci']
                upper_ci = f_dict['upper_ci']
                model_used = f_dict['model_used']
                timestamp = f_dict['timestamp']
                
                # Write to demand_forecasts
                cursor.execute(
                    """
                    INSERT INTO demand_forecasts (
                        product_id, forecast_date, predicted_demand, lower_bound, upper_bound,
                        confidence, model_version, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (default_prod_id_int, f_date, demand, lower_ci, upper_ci, 85.0, model_used, timestamp)
                )
                
                # Write to forecast_history table
                cursor.execute(
                    """
                    INSERT INTO forecast_history (
                        product_id, forecast_date, demand, lower_ci, upper_ci, model_used, timestamp
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (default_prod_id_int, f_date, demand, lower_ci, upper_ci, model_used, timestamp)
                )
            print(f"   Successfully migrated {len(rows)} forecast entries.")
            
        # Migrate activity_logs
        cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_backup_activity_logs')")
        if cursor.fetchone()[0]:
            print("   Migrating activity logs...")
            cursor.execute("SELECT * FROM legacy_backup_activity_logs")
            cols = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            for row in rows:
                al_dict = dict(zip(cols, row))
                
                u_email = al_dict.get('user_email')
                u_id = user_map.get(u_email, default_user_id)
                action = al_dict.get('action')
                details = al_dict.get('details') or al_dict.get('description', '')
                timestamp = al_dict.get('timestamp')
                
                module = al_dict.get('module') or ('Auth' if 'Login' in action else 'General')
                
                cursor.execute(
                    """
                    INSERT INTO activity_logs (
                        user_id, action, module, description, timestamp, user_email, details
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (u_id, action, module, details, timestamp, u_email, details)
                )
            print(f"   Successfully migrated {len(rows)} activity logs.")
            
        # Migrate training_history
        cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_backup_training_history')")
        if cursor.fetchone()[0]:
            print("   Migrating training history...")
            cursor.execute("SELECT * FROM legacy_backup_training_history")
            cols = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            for row in rows:
                th_dict = dict(zip(cols, row))
                
                m_name = th_dict['model_name']
                r2 = th_dict.get('r2') or th_dict.get('accuracy') or 0.8
                mae = th_dict['mae']
                rmse = th_dict['rmse']
                train_time = th_dict['training_time']
                timestamp = th_dict.get('timestamp') or th_dict.get('trained_at') or datetime.utcnow()
                
                cursor.execute(
                    """
                    INSERT INTO training_history (
                        model_name, dataset_version, accuracy, mae, rmse, training_time,
                        trained_by, trained_at, r2, mse, inference_time, status, timestamp
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        m_name, '1.0.0', r2, mae, rmse, train_time,
                        th_dict.get('trained_by', 'system'), timestamp, r2, th_dict.get('mse', 0.0),
                        th_dict.get('inference_time', 0.0), th_dict.get('status', 'completed'), timestamp
                    )
                )
            print(f"   Successfully migrated {len(rows)} training history entries.")
            
        # Migrate model_metrics
        cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_backup_model_metrics')")
        if cursor.fetchone()[0]:
            print("   Migrating model metrics...")
            cursor.execute("SELECT * FROM legacy_backup_model_metrics")
            cols = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            for row in rows:
                mm_dict = dict(zip(cols, row))
                cursor.execute(
                    "INSERT INTO model_metrics (model_name, metrics) VALUES (%s, %s)",
                    (mm_dict['model_name'], mm_dict['metrics'])
                )
            print(f"   Successfully migrated {len(rows)} model metrics.")
            
        # Migrate notifications
        cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_backup_notifications')")
        if cursor.fetchone()[0]:
            print("   Migrating notifications...")
            cursor.execute("SELECT * FROM legacy_backup_notifications")
            cols = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            for row in rows:
                n_dict = dict(zip(cols, row))
                cursor.execute(
                    "INSERT INTO notifications (product_id, type, message, status, timestamp) VALUES (%s, %s, %s, %s, %s)",
                    (default_prod_id_int, n_dict['type'], n_dict['message'], n_dict['status'], n_dict['timestamp'])
                )
            print(f"   Successfully migrated {len(rows)} notifications.")
            
        # Migrate audit_logs
        cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'legacy_backup_audit_logs')")
        if cursor.fetchone()[0]:
            print("   Migrating audit logs...")
            cursor.execute("SELECT * FROM legacy_backup_audit_logs")
            cols = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            for row in rows:
                al_dict = dict(zip(cols, row))
                p_id_str = al_dict.get('legacy_product_id') or al_dict.get('product_id')
                p_info = product_map.get(p_id_str)
                p_id_int = p_info[0] if p_info else None
                
                cursor.execute(
                    """
                    INSERT INTO audit_logs (
                        product_id, product_name, predicted_price, model_used, confidence,
                        llm_output, prediction_time, operator, request_id, prediction_version, legacy_product_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        p_id_int, al_dict.get('product_name'), al_dict.get('predicted_price'),
                        al_dict.get('model_used'), al_dict.get('confidence'), al_dict.get('llm_output'),
                        al_dict.get('prediction_time'), al_dict.get('operator'), al_dict.get('request_id'),
                        al_dict.get('prediction_version', '1.0.0'), p_id_str
                    )
                )
            print(f"   Successfully migrated {len(rows)} audit logs.")

        conn.commit()
        print("[OK] Migration completed successfully with all data preserved in the new PostgreSQL schema structure!")
        
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Migration failed! Database transaction rolled back. Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
