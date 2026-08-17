import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

MODELS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(MODELS_DIR)

# Global caches for demand forecasting resources
_cached_demand_model = None
_cached_demand_encoder = None
_cached_demand_stats = None
_cached_demand_mtimes = {}

def train_demand_model():
    """Loads and returns cached demand model and stats, raising FileNotFoundError if missing. Never trains."""
    model_path = os.path.join(MODELS_DIR, "demand_model.pkl")
    encoder_path = os.path.join(MODELS_DIR, "demand_encoder.pkl")
    stats_path = os.path.join(MODELS_DIR, "demand_stats.pkl")
    
    if not (os.path.exists(model_path) and os.path.exists(encoder_path) and os.path.exists(stats_path)):
        raise FileNotFoundError("No trained model found. Please train locally and upload trained models.")
        
    model = joblib.load(model_path)
    stats = joblib.load(stats_path)
    return model, stats

def load_cached_demand_resources() -> tuple:
    """Retrieves cached demand model resources from memory, or loads from disk if modified/not cached."""
    global _cached_demand_model, _cached_demand_encoder, _cached_demand_stats, _cached_demand_mtimes
    model_path = os.path.join(MODELS_DIR, "demand_model.pkl")
    encoder_path = os.path.join(MODELS_DIR, "demand_encoder.pkl")
    stats_path = os.path.join(MODELS_DIR, "demand_stats.pkl")
    
    if not (os.path.exists(model_path) and os.path.exists(encoder_path) and os.path.exists(stats_path)):
        raise FileNotFoundError("No trained model found. Please train locally and upload trained models.")
        
    try:
        mtime_model = os.path.getmtime(model_path)
        mtime_encoder = os.path.getmtime(encoder_path)
        mtime_stats = os.path.getmtime(stats_path)
        
        if (_cached_demand_model is not None and 
             _cached_demand_mtimes.get(model_path) == mtime_model and
             _cached_demand_mtimes.get(encoder_path) == mtime_encoder and
             _cached_demand_mtimes.get(stats_path) == mtime_stats):
            return _cached_demand_model, _cached_demand_encoder, _cached_demand_stats
            
        _cached_demand_model = joblib.load(model_path)
        _cached_demand_encoder = joblib.load(encoder_path)
        _cached_demand_stats = joblib.load(stats_path)
        _cached_demand_mtimes[model_path] = mtime_model
        _cached_demand_mtimes[encoder_path] = mtime_encoder
        _cached_demand_mtimes[stats_path] = mtime_stats
    except Exception:
        # Fallback load without caching if error occurs
        return joblib.load(model_path), joblib.load(encoder_path), joblib.load(stats_path)
        
    return _cached_demand_model, _cached_demand_encoder, _cached_demand_stats

def forecast_category_demand(category: str, month: int, previous_orders: int, price: float) -> dict:
    """Predicts seasonal category demand using memory cached demand forecasting models (Never Retrains)."""
    # Load demand forecasting resources using high speed cache
    model, encoder, stats = load_cached_demand_resources()
    
    # Check if category is known
    known_cats = set(encoder.classes_)
    if category not in known_cats:
        category_mapped = "unknown"
        if "unknown" not in known_cats:
            encoder.classes_ = np.append(encoder.classes_, "unknown")
    else:
        category_mapped = category
        
    encoded_cat = encoder.transform([category_mapped])[0]
    
    # Input format: [encoded_cat, month, previous_orders, price]
    X_inf = pd.DataFrame([{
        "product_category_encoded": encoded_cat,
        "month": int(month),
        "previous_orders": float(previous_orders),
        "price": float(price)
    }])
    
    predicted_demand = float(model.predict(X_inf)[0])
    
    # Calculate trend: compare predicted demand to previous month's orders
    if predicted_demand > previous_orders:
        trend = "Increasing"
    elif predicted_demand < previous_orders:
        trend = "Decreasing"
    else:
        trend = "Stable"
        
    return {
        "predicted_demand": int(round(predicted_demand)),
        "trend": trend,
        "previous_orders": previous_orders
    }

if __name__ == "__main__":
    try:
        train_demand_model()
        print("Cached demand model loaded successfully.")
    except Exception as e:
        print(f"Error loading cached demand model: {str(e)}")
