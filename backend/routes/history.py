from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime
import logging
from backend.utils.db import execute_query

router = APIRouter(prefix="/api/predictions", tags=["Predictions History"])

@router.get("/history")
def list_prediction_history(
    category: Optional[str] = Query(None, description="Category filter"),
    model_used: Optional[str] = Query(None, description="Model filter"),
    user_email: Optional[str] = Query(None, description="User email filter"),
    search: Optional[str] = Query(None, description="Search term in product name or ID")
):
    """Retrieves dynamic pricing prediction history logs with joined product/user metadata from the database."""
    try:
        query = """
            SELECT 
                ph.id,
                COALESCE(p.product_id, ph.legacy_product_id) as product_id,
                COALESCE(p.name, ph.product_name) as product_name,
                COALESCE(p.category, ph.category) as category,
                COALESCE(p.current_price, ph.actual_price) as actual_price,
                ph.predicted_price,
                ph.model_name as model_used,
                ph.model_version,
                ph.confidence,
                ph.reason as llm_reason,
                ph.prediction_timestamp as created_date,
                COALESCE(u.email, ph.user_email) as user_email,
                ph.features,
                ph.demand
            FROM prediction_history ph
            LEFT JOIN products p ON ph.product_id = p.id
            LEFT JOIN users u ON ph.user_id = u.id
            WHERE 1=1
        """
        params = []
        
        if category:
            query += " AND (p.category = %s OR ph.category = %s)"
            params.append(category)
            params.append(category)
        if model_used:
            query += " AND (ph.model_name = %s OR ph.model_used = %s)"
            params.append(model_used)
            params.append(model_used)
        if user_email:
            query += " AND (u.email = %s OR ph.user_email = %s)"
            params.append(user_email)
            params.append(user_email)
        if search:
            query += " AND (p.product_id LIKE %s OR ph.legacy_product_id LIKE %s OR p.name LIKE %s OR ph.product_name LIKE %s)"
            term = f"%{search}%"
            params.append(term)
            params.append(term)
            params.append(term)
            params.append(term)
            
        query += " ORDER BY ph.prediction_timestamp DESC"
        
        history = execute_query(query, tuple(params))
        
        # Post-process for perfect backward compatibility and format conversions
        for row in history:
            created_date_val = row.get("created_date")
            if hasattr(created_date_val, "strftime"):
                date_str = created_date_val.strftime("%Y-%m-%d %H:%M:%S")
            else:
                date_str = str(created_date_val) if created_date_val else ""
                
            row["timestamp"] = date_str
            row["created_date"] = date_str
            row["user"] = row.get("user_email")
            row["llm_output"] = row.get("llm_reason") or ""
            row["reason"] = row.get("llm_reason") or ""
            row["actual_price"] = row.get("actual_price") if row.get("actual_price") is not None else 0.0
            row["model_version"] = row.get("model_version") or "1.0.0"
            row["demand"] = row.get("demand") or "100"
            
        return history
    except Exception as e:
        import logging
        logging.getLogger("pricepilot").error(f"Failed to load prediction history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to load prediction history due to an internal server error.")

@router.post("/clear")
def clear_prediction_history():
    """No-op prediction history clear endpoint to comply with permanent history retention policies."""
    try:
        logger = logging.getLogger("pricepilot")
        logger.info("Wipe logs request received, but bypassed due to database permanent history retention policies.")
        return {
            "status": "success", 
            "message": "Prediction history logs are archived and preserved according to system audit retention policies."
        }
    except Exception as e:
        import logging
        logging.getLogger("pricepilot").error(f"Failed to process clear request: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process clear request due to an internal server error.")
