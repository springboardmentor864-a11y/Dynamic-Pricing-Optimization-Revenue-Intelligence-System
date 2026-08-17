from fastapi import APIRouter, HTTPException
from backend.utils.metrics_tracker import load_metrics_file
from backend.services.ml_service import get_tree_feature_importances

router = APIRouter(prefix="/api")

@router.get("/metrics")
def api_get_metrics():
    """Returns comparative validation benchmarks loaded from metrics.json (without retraining)."""
    try:
        metrics_data = load_metrics_file()
        if not metrics_data.get("models"):
            raise HTTPException(status_code=400, detail="Models are not trained yet. Run model training first.")
        return metrics_data["models"]
    except HTTPException as he:
        raise he
    except Exception as e:
        import logging
        logging.getLogger("pricepilot").error(f"Failed to load metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to load performance metrics due to an internal server error.")

@router.get("/importance")
def api_get_feature_importance():
    """Returns comparative feature split contributions for tree-based ensemble algorithms."""
    try:
        importances = get_tree_feature_importances()
        return importances
    except Exception as e:
        import logging
        logging.getLogger("pricepilot").error(f"Failed to extract feature importances: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to extract feature importances due to an internal server error.")
