import os
import shutil
import json
from fastapi import APIRouter, HTTPException, UploadFile, File
from backend.models.analytics import RevenueOptimizationInput, RevenueOptimizationResponse
from backend.services.data_service import get_categories, compute_dataset_explorer_stats, _products_cache, DATASET_PATH, ANALYTICS_PATH
from backend.utils.metrics_tracker import load_metrics_file, TRAINED_MODELS_DIR
from backend.utils.category_mapping import resolve_to_portuguese
from models.revenue_optimizer import optimize_revenue

router = APIRouter()

@router.get("/api/dashboard")
def get_dashboard_stats():
    """Returns general overview indicators for the Home Dashboard from cached dashboard_metrics.json."""
    try:
        dashboard_path = os.path.join(TRAINED_MODELS_DIR, "dashboard_metrics.json")
        if os.path.exists(dashboard_path):
            with open(dashboard_path, "r") as f:
                return json.load(f)
                
        # Safe fallback if not pre-generated yet
        from backend.utils.metrics_tracker import DEFAULT_DASHBOARD_STATS
        stats = DEFAULT_DASHBOARD_STATS.copy()
        stats["total_categories"] = 14
        stats["average_freight"] = 20.0
        stats["average_delivery_time"] = 15.0
        stats["top_categories"] = []
        stats["top_products"] = []
        stats["monthly_revenue"] = []
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dashboard metrics from cache: {str(e)}")

@router.get("/api/explorer")
def get_dataset_explorer_stats():
    """Returns EDA profiling and statistics directly from cached analytics.json (never parses CSV)."""
    try:
        analytics_path = os.path.join(TRAINED_MODELS_DIR, "analytics.json")
        if os.path.exists(analytics_path):
            with open(analytics_path, "r") as f:
                disk_cache = json.load(f)
                # Handle nested wrapper stats structure if present
                if "stats" in disk_cache:
                    return disk_cache["stats"]
                return disk_cache
                
        # Empty fallback structure if not generated yet
        return {
            "total_records": 0,
            "total_columns": 0,
            "duplicate_records": 0,
            "total_missing_values": 0,
            "preview": [],
            "missing_values": [],
            "column_types": [],
            "summary_statistics": [],
            "correlation_heatmap": {"columns": [], "data": []},
            "price_distribution": {},
            "feature_distribution": {},
            "top_categories": {},
            "monthly_sales": {},
            "revenue_trend": {}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dataset profiling stats from cache: {str(e)}")

@router.get("/categories")
def get_categories_list():
    """Returns sorted list of category objects containing both Portuguese and English names."""
    try:
        cats = get_categories()
        return {"categories": cats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load categories: {str(e)}")

@router.post("/optimize-revenue", response_model=RevenueOptimizationResponse)
def get_optimized_revenue(payload: RevenueOptimizationInput):
    """Optimizes price around base target to maximize predicted category revenue."""
    try:
        results = optimize_revenue(
            category=resolve_to_portuguese(payload.category),
            month=payload.month,
            previous_orders=payload.previous_orders,
            predicted_base_price=payload.price
        )
        return RevenueOptimizationResponse(
            current_price=results["current_price"],
            current_demand=results["current_demand"],
            current_revenue=results["current_revenue"],
            optimized_price=results["optimized_price"],
            optimized_demand=results["optimized_demand"],
            optimized_revenue=results["optimized_revenue"],
            improvement_percentage=results["improvement_percentage"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Revenue optimization failed: {str(e)}")

@router.post("/api/upload")
@router.post("/api/dataset/upload")
def upload_dataset(file: UploadFile = File(...)):
    """Uploads a new dataset and replaces the existing final_pricing_dataset.csv without starting training."""
    try:
        # Save file to dataset/final_pricing_dataset.csv
        os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)
        with open(DATASET_PATH, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Invalidate in-memory caches
        import backend.services.data_service as ds
        ds._explorer_cache.clear()
        ds._products_cache.clear()
        ds._category_products.clear()
        ds._dataset_loaded = False
        
        # Invalidate preprocessing cache
        import backend.services.ml_service as ml
        ml._preprocessed_data_cache = None
        
        # Delete disk stats cache to force regeneration
        if os.path.exists(ANALYTICS_PATH):
            try:
                os.remove(ANALYTICS_PATH)
            except Exception:
                pass
                
        # Re-populate data service caches
        ds.ensure_dataset_loaded()
        
        return {"status": "success", "message": "Dataset uploaded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset upload failed: {str(e)}")
