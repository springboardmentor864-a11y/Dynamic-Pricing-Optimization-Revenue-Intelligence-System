import os
import pandas as pd
import numpy as np
import json
from typing import Dict, Any, List
from backend.utils.category_mapping import translate_category, resolve_to_portuguese, generate_product_name

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "final_pricing_dataset.csv")
TRAINED_MODELS_DIR = os.path.join(BASE_DIR, "trained_models")
ANALYTICS_PATH = os.path.join(TRAINED_MODELS_DIR, "analytics.json")

# Global caches
_explorer_cache: Dict[str, Any] = {}
_products_cache: Dict[str, Dict[str, Any]] = {} # product_id -> dict of features
_category_products: Dict[str, List[str]] = {} # portuguese_category -> list of product_ids
_dataset_loaded = False

class NpEncoder(json.JSONEncoder):
    """Custom JSON encoder to serialize numpy types and pandas timestamps."""
    def default(self, obj):
        if isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        if hasattr(obj, "strftime"):
            return str(obj)
        import pandas as pd
        if isinstance(obj, (pd.Timestamp, pd.Period)):
            return str(obj)
        return super(NpEncoder, self).default(obj)

def ensure_dataset_loaded():
    """Initializes product aggregation caches from final_pricing_dataset.csv for high-speed lookups."""
    global _products_cache, _category_products, _dataset_loaded
    if _dataset_loaded:
        return
        
    if not os.path.exists(DATASET_PATH):
        return
        
    try:
        df = pd.read_csv(DATASET_PATH)
        
        # Calculate popularity normalization factors
        product_counts = df["product_id"].value_counts()
        max_orders = product_counts.max() if not product_counts.empty else 1
        
        # Pre-calculate category aggregations to avoid slow groupings
        grouped = df.groupby("product_id").agg({
            "product_category_name": "first",
            "product_weight_g": "first",
            "product_length_cm": "first",
            "product_height_cm": "first",
            "product_width_cm": "first",
            "product_photos_qty": "first",
            "product_name_length": "first",
            "product_description_length": "first",
            "price": ["mean", "min", "max", "median"],
            "freight_value": "mean",
            "estimated_delivery_days": "mean",
            "order_id": "count"
        })
        
        # Flat columns
        grouped.columns = [
            "category", "weight", "length", "height", "width", "photos", 
            "name_length", "description_length", "avg_price", "min_price", 
            "max_price", "median_price", "avg_freight", "avg_delivery_days", "total_orders"
        ]
        
        for pid, row in grouped.iterrows():
            cat = str(row["category"])
            p_name = generate_product_name(pid, cat)
            
            pop_score = int(min(100, max(1, round((row["total_orders"] / max_orders) * 100.0))))
            h = int(hash(pid)) % 13
            avg_rating = round(3.8 + (h / 10.0), 1)
            
            p_details = {
                "product_id": pid,
                "product_name": p_name,
                "category": cat,
                "category_english": translate_category(cat),
                "weight": float(row["weight"]) if not pd.isna(row["weight"]) else 500.0,
                "length": float(row["length"]) if not pd.isna(row["length"]) else 20.0,
                "height": float(row["height"]) if not pd.isna(row["height"]) else 10.0,
                "width": float(row["width"]) if not pd.isna(row["width"]) else 15.0,
                "photos": int(row["photos"]) if not pd.isna(row["photos"]) else 3,
                "name_length": int(row["name_length"]) if not pd.isna(row["name_length"]) else 40,
                "description_length": int(row["description_length"]) if not pd.isna(row["description_length"]) else 250,
                "historical_average_price": float(row["avg_price"]),
                "historical_min_price": float(row["min_price"]),
                "historical_max_price": float(row["max_price"]),
                "median_price": float(row["median_price"]),
                "avg_freight": float(row["avg_freight"]),
                "avg_delivery_days": float(row["avg_delivery_days"]),
                "total_orders": int(row["total_orders"]),
                "popularity_score": pop_score,
                "average_customer_rating": avg_rating
            }
            
            _products_cache[pid] = p_details
            if cat not in _category_products:
                _category_products[cat] = []
            _category_products[cat].append(pid)
            
        _dataset_loaded = True
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Failed to cache products details: {str(e)}")

def get_categories() -> List[Dict[str, str]]:
    """Returns unique categories as dicts containing both Portuguese and English names."""
    ensure_dataset_loaded()
    preprocessor_state_path = os.path.join(BASE_DIR, "trained_models", "preprocessor_state.pkl")
    if not os.path.exists(preprocessor_state_path):
        preprocessor_state_path = os.path.join(BASE_DIR, "models", "preprocessor_state.pkl")
        
    cats = []
    if os.path.exists(preprocessor_state_path):
        try:
            state = joblib.load(preprocessor_state_path)
            cats = [c for c in state["encoder_classes"] if c != "unknown"]
        except Exception:
            pass

    if not cats and os.path.exists(DATASET_PATH):
        try:
            df = pd.read_csv(DATASET_PATH, usecols=["product_category_name"])
            cats = df["product_category_name"].dropna().unique().tolist()
            if "unknown" in cats:
                cats.remove("unknown")
        except Exception:
            pass
            
    if not cats:
        cats = [
            "cama_mesa_banho", "beleza_saude", "esporte_lazer", "informatica_acessorios",
            "utilidades_domesticas", "relogios_presentes", "telefonia", "ferramentas_jardim",
            "automotivo", "brinquedos", "cool_stuff", "perfumaria", "bebes", "eletronicos"
        ]
        
    result = []
    for c in sorted(cats):
        result.append({
            "portuguese": c,
            "english": translate_category(c)
        })
    return result

def search_products(category_name: str, query: str = "") -> List[Dict[str, Any]]:
    """Searches matching cached products under the requested English or Portuguese category."""
    ensure_dataset_loaded()
    
    portuguese_cat = resolve_to_portuguese(category_name)
    pids = _category_products.get(portuguese_cat, [])
    
    if not pids:
        pids = list(_products_cache.keys())
        
    results = []
    query_clean = query.strip().lower()
    
    limit = 1000 if not query_clean else 50
    
    for pid in pids:
        details = _products_cache.get(pid)
        if details:
            if not query_clean or query_clean in details["product_name"].lower() or query_clean in pid.lower():
                results.append(details)
                if len(results) >= limit:
                    break
                    
    return results

def get_product_details(product_id: str) -> Dict[str, Any]:
    """Retrieves aggregated historical features for a selected product_id."""
    ensure_dataset_loaded()
    if product_id in _products_cache:
        return _products_cache[product_id]
    raise KeyError(f"Product ID {product_id} not found in the cached dataset.")

def compute_dataset_explorer_stats() -> Dict[str, Any]:
    """Computes comprehensive descriptive profiles, missingness, duplicates, and correlation details."""
    global _explorer_cache
    ensure_dataset_loaded()
    
    if not os.path.exists(DATASET_PATH):
        return {
            "error": "Dataset not found. Please merge files or trigger training pipeline.",
            "total_records": 0,
            "preview": [],
            "missing_values": [],
            "column_types": []
        }
        
    current_size = os.path.getsize(DATASET_PATH)
    current_mtime = os.path.getmtime(DATASET_PATH)
    
    # 1. Check in-memory cache
    if (_explorer_cache.get("dataset_size") == current_size and 
        _explorer_cache.get("dataset_mtime") == current_mtime):
        return _explorer_cache["stats"]
        
    # 2. Check disk cache (analytics.json)
    if os.path.exists(ANALYTICS_PATH):
        try:
            with open(ANALYTICS_PATH, "r") as f:
                disk_cache = json.load(f)
            if (disk_cache.get("dataset_size") == current_size and 
                disk_cache.get("dataset_mtime") == current_mtime):
                _explorer_cache = {
                    "dataset_size": current_size,
                    "dataset_mtime": current_mtime,
                    "stats": disk_cache["stats"]
                }
                return disk_cache["stats"]
        except Exception:
            pass
        
    try:
        df = pd.read_csv(DATASET_PATH)
        
        # 1. Row & column configurations
        total_records = len(df)
        total_cols = len(df.columns)
        
        # 2. Duplicate rows
        duplicate_records = int(df.duplicated().sum())
        
        # 3. Missing values
        total_missing = int(df.isnull().sum().sum())
        raw_nulls = df.isnull().sum()
        null_counts = raw_nulls.to_dict()
        null_percentages = (raw_nulls / len(df) * 100.0).round(2).to_dict()
        missing_values = []
        for col in df.columns:
            missing_values.append({
                "column": col,
                "null_count": int(null_counts.get(col, 0)),
                "null_percentage": float(null_percentages.get(col, 0.0))
            })
            
        # 4. Column types
        column_types = []
        for col in df.columns:
            column_types.append({
                "column": col,
                "type": str(df[col].dtype)
            })
            
        # 5. Continuous statistics
        desc_cols = [
            "price", "freight_value", "product_weight_g", "product_length_cm",
            "product_height_cm", "product_width_cm", "product_photos_qty", "product_volume",
            "product_name_length", "product_description_length", "estimated_delivery_days"
        ]
        desc_cols = [c for c in desc_cols if c in df.columns]
        desc_stats = df[desc_cols].describe().round(2).to_dict()
        
        summary_stats = []
        for col in desc_cols:
            col_stats = desc_stats.get(col, {})
            summary_stats.append({
                "feature": col,
                "count": int(col_stats.get("count", 0)),
                "mean": float(col_stats.get("mean", 0.0)),
                "std": float(col_stats.get("std", 0.0)),
                "min": float(col_stats.get("min", 0.0)),
                "p25": float(col_stats.get("25%", 0.0)),
                "p50": float(col_stats.get("50%", 0.0)),
                "p75": float(col_stats.get("75%", 0.0)),
                "max": float(col_stats.get("max", 0.0))
            })
            
        # 6. Correlation (continuous keys only)
        corr_cols = ["price", "freight_value", "product_weight_g", "product_length_cm", "product_height_cm", "product_width_cm"]
        corr_cols = [c for c in corr_cols if c in df.columns]
        corr_matrix = df[corr_cols].corr().round(4).replace({np.nan: 0.0}).values.tolist()
        correlation_heatmap = {
            "columns": corr_cols,
            "data": corr_matrix
        }
        
        # 7. Price Histograms
        bins = [0, 50, 100, 150, 200, 300, 500, 1000, df["price"].max() + 1]
        labels = ["0-50", "50-100", "100-150", "150-200", "200-300", "300-500", "500-1000", "1000+"]
        price_bins = pd.cut(df["price"], bins=bins, labels=labels).value_counts().to_dict()
        sorted_price_bins = {label: int(price_bins.get(label, 0)) for label in labels}
        
        # 8. Weight Histograms
        w_bins = [0, 250, 500, 1000, 2000, 5000, 10000, df["product_weight_g"].max() + 1]
        w_labels = ["0-250", "250-500", "500-1k", "1k-2k", "2k-5k", "5k-10k", "10k+"]
        weight_bins = pd.cut(df["product_weight_g"], bins=w_bins, labels=w_labels).value_counts().to_dict()
        feature_distribution = {label: int(weight_bins.get(label, 0)) for label in w_labels}
        
        # 9. Top category volumes (Translate to English)
        raw_top_cats = df["product_category_name"].value_counts().head(10).to_dict()
        top_cats = {translate_category(k): int(v) for k, v in raw_top_cats.items()}
        
        # 10. Monthly trends
        df["order_purchase_timestamp"] = pd.to_datetime(df["order_purchase_timestamp"])
        df["year_month"] = df["order_purchase_timestamp"].dt.to_period("M").astype(str)
        monthly_sales = df.groupby("year_month")["order_id"].nunique().sort_index().tail(12).to_dict()
        monthly_revenue = df.groupby("year_month")["revenue"].sum().sort_index().tail(12).to_dict()
        
        # 11. Row preview
        preview_raw = df.head(15).replace({np.nan: None}).to_dict(orient="records")
        preview = []
        for r in preview_raw:
            r_copy = r.copy()
            if "product_category_name" in r_copy:
                r_copy["product_category_name_portuguese"] = r_copy["product_category_name"]
                r_copy["product_category_name"] = translate_category(r_copy["product_category_name"])
            preview.append(r_copy)
        
        stats_result = {
            "total_records": total_records,
            "total_columns": total_cols,
            "duplicate_records": duplicate_records,
            "total_missing_values": total_missing,
            "preview": preview,
            "missing_values": missing_values,
            "column_types": column_types,
            "summary_statistics": summary_stats,
            "correlation_heatmap": correlation_heatmap,
            "price_distribution": sorted_price_bins,
            "feature_distribution": feature_distribution,
            "top_categories": top_cats,
            "monthly_sales": {k: int(v) for k, v in monthly_sales.items()},
            "revenue_trend": {k: float(v) for k, v in monthly_revenue.items()}
        }
        
        # Update Cache
        _explorer_cache = {
            "dataset_size": current_size,
            "dataset_mtime": current_mtime,
            "stats": stats_result
        }
        
        # Save to disk cache (analytics.json) using custom encoder
        try:
            os.makedirs(TRAINED_MODELS_DIR, exist_ok=True)
            with open(ANALYTICS_PATH, "w") as f:
                json.dump({
                    "dataset_size": current_size,
                    "dataset_mtime": current_mtime,
                    "stats": stats_result
                }, f, indent=4, cls=NpEncoder)
        except Exception as e:
            print(f"Failed to save analytics.json: {str(e)}")
            
        return stats_result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Failed to compute statistics: {str(e)}"}
