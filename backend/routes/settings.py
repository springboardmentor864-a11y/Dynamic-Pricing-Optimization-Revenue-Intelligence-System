from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.utils.db import (
    load_db_config,
    save_db_config,
    get_db_connection,
    execute_query,
)
import logging

router = APIRouter(
    prefix="/api/settings",
    tags=["Settings & Configurations"],
)


class DBConfigRequest(BaseModel):
    engine: Optional[str] = "postgresql"
    host: Optional[str] = "localhost"
    port: Optional[int] = 5432
    user: Optional[str] = "postgres"
    password: Optional[str] = ""
    database: Optional[str] = "pricepilot_ai"


@router.get("/db")
def get_db_settings():
    """Retrieves current DB credentials configuration."""
    try:
        config = load_db_config()

        # Hide password before sending configuration to frontend.
        safe_config = config.copy()

        if "password" in safe_config and safe_config["password"]:
            safe_config["password"] = "●●●●●●●●"

        # Get active database engine.
        conn, active_engine = get_db_connection()
        conn.close()

        safe_config["active_engine"] = active_engine

        # Dynamically verify PostgreSQL connection health
        healthy = False
        status = "Disconnected"
        try:
            import psycopg2
            try:
                port_val = int(config.get("port", 5432))
            except (ValueError, TypeError):
                port_val = 5432

            test_conn = psycopg2.connect(
                host=config.get("host", "localhost"),
                port=port_val,
                user=config.get("user", "postgres"),
                password=config.get("password", ""),
                database=config.get("database", "pricepilot_ai"),
                connect_timeout=2
            )
            test_conn.close()
            healthy = True
            status = "Connected"
        except Exception:
            healthy = False
            status = "Disconnected"

        safe_config["healthy"] = healthy
        safe_config["status"] = status

        return safe_config

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read database configuration: {str(e)}",
        )


@router.post("/db")
def update_db_settings(payload: DBConfigRequest):
    """Saves new database connection parameters."""
    try:
        config = load_db_config()

        # Restore original password if frontend sends masked password.
        pwd = payload.password

        if pwd == "●●●●●●●●":
            pwd = config.get("password", "")

        new_config = {
            "engine": payload.engine,
            "host": payload.host,
            "port": payload.port,
            "user": payload.user,
            "password": pwd,
            "database": payload.database,
        }

        # Test MySQL connection before saving.
        if payload.engine == "mysql":
            try:
                import mysql.connector

                conn = mysql.connector.connect(
                    host=payload.host,
                    port=payload.port,
                    user=payload.user,
                    password=pwd,
                    connect_timeout=3,
                )

                conn.close()

            except ImportError:
                raise HTTPException(
                    status_code=400,
                    detail="MySQL database connector libraries are missing on the host server.",
                )

            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Connection test to MySQL failed: {str(e)}",
                )

        save_db_config(new_config)

        # Re-initialize database.
        from backend.utils.db import init_database

        init_database()

        return {
            "status": "success",
            "message": "Database configuration saved and database successfully initialized.",
        }

    except HTTPException as he:
        raise he

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save settings: {str(e)}",
        )


@router.post("/db/test")
def test_db_settings(payload: Optional[DBConfigRequest] = None):
    """Dynamically tests database connection."""
    config = load_db_config()

    if payload is not None:
        engine = payload.engine
        host = payload.host
        port = payload.port
        user = payload.user
        password = payload.password
        database = payload.database
        if password == "●●●●●●●●":
            password = config.get("password", "")
    else:
        engine = config.get("engine", "postgresql")
        host = config.get("host", "localhost")
        port = config.get("port", 5432)
        user = config.get("user", "postgres")
        password = config.get("password", "")
        database = config.get("database", "pricepilot_ai")

    if engine == "sqlite":
        return {
            "status": "success",
            "message": "SQLite configuration is valid. System will write to local file.",
        }

    try:
        import psycopg2

        try:
            port_val = int(port)
        except (ValueError, TypeError):
            port_val = 5432

        conn = psycopg2.connect(
            host=host,
            port=port_val,
            user=user,
            password=password,
            database=database,
            connect_timeout=3
        )
        conn.close()
        return {
            "status": "success",
            "message": "Successfully connected to PostgreSQL database."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"PostgreSQL connection failed: {str(e)}"
        }


@router.get("/db/diagnostics")
@router.post("/db/diagnostics")
@router.get("/diagnostics")
@router.post("/diagnostics")
def run_db_diagnostics():
    """Runs a complete lightweight database diagnostic check verifying connection health and query execution."""
    import time
    start_time = time.time()
    try:
        conn, active_engine = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1;")
        res = cursor.fetchone()
        cursor.close()
        conn.close()
        
        latency_ms = round((time.time() - start_time) * 1000, 2)
        
        return {
            "status": "success",
            "db_status": "Healthy",
            "connection": "OK",
            "query": "OK",
            "latency_ms": latency_ms,
            "active_engine": active_engine,
            "message": f"Database Diagnostics Verified: Connection OK, Query OK ({latency_ms} ms latency, Engine: {active_engine})"
        }
    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "error",
            "db_status": "Failed",
            "connection": "Failed",
            "query": "Failed",
            "latency_ms": latency_ms,
            "reason": str(e),
            "message": f"Database Diagnostics Failed: {str(e)}"
        }



@router.get("/logs")
def get_activity_logs(limit: int = 100):
    """Reads transactional event activity logs."""
    try:
        logs = execute_query(
            "SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT %s",
            (limit,),
        )

        return logs

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load logs: {str(e)}",
        )