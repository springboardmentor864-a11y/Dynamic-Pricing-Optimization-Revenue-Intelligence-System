import os
import joblib
import pandas as pd
from backend.ml.preprocessing import preprocess_pipeline

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# In-memory caches for fast inference
_MODEL_CACHE = None
_STATE_CACHE = None

def get_model_and_state():
    """Loads and caches the best model and preprocessing state from disk."""
    global _MODEL_CACHE, _STATE_CACHE
    
    if _MODEL_CACHE is None or _STATE_CACHE is None:
        model_path = os.path.join(MODELS_DIR, "best_price_prediction_model.pkl")
        state_path = os.path.join(MODELS_DIR, "preprocessor_state.pkl")
        
        if not os.path.exists(model_path) or not os.path.exists(state_path):
            raise FileNotFoundError(
                "Model or preprocessor files not found. Run training before predicting."
            )
            
        _MODEL_CACHE = joblib.load(model_path)
        _STATE_CACHE = joblib.load(state_path)
        
    return _MODEL_CACHE, _STATE_CACHE

def clear_cache():
    """Clears the model cache. Call this after retraining."""
    global _MODEL_CACHE, _STATE_CACHE
    _MODEL_CACHE = None
    _STATE_CACHE = None

def predict_single_price(input_data: dict) -> float:
    """
    Predicts the price for a single product.
    Input dictionary should contain:
    - category
    - weight
    - length
    - height
    - width
    - photos
    - freight
    """
    model, state = get_model_and_state()
    
    # Map input JSON fields to standard dataset columns
    mapped_input = {
        "product_category_name": input_data.get("category", "unknown"),
        "freight_value": float(input_data.get("freight", 0.0)),
        "product_weight_g": float(input_data.get("weight", 0.0)),
        "product_length_cm": float(input_data.get("length", 0.0)),
        "product_height_cm": float(input_data.get("height", 0.0)),
        "product_width_cm": float(input_data.get("width", 0.0)),
        "product_photos_qty": float(input_data.get("photos", 0.0)),
        # product_name_lenght and product_description_lenght will be filled with medians by preprocess_pipeline
    }
    
    # Convert to DataFrame
    df = pd.DataFrame([mapped_input])
    
    # Preprocess
    X_scaled = preprocess_pipeline(df, is_training=False, saved_state=state)
    
    # Predict
    predicted_price = float(model.predict(X_scaled)[0])
    
    # Ensure predicted price is not negative
    return max(0.0, predicted_price)
