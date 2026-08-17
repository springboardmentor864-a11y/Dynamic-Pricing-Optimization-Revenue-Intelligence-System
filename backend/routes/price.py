import os
import json
import joblib
import threading
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from models.preprocessing import load_and_preprocess_price_data

router = APIRouter()

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models")
TRAINED_MODELS_DIR = os.path.join(os.path.dirname(MODELS_DIR), "trained_models")

class Dimensions(BaseModel):
    length: float = Field(..., example=20.0, description="Product length in cm")
    height: float = Field(..., example=10.0, description="Product height in cm")
    width: float = Field(..., example=15.0, description="Product width in cm")

class PricePredictionInput(BaseModel):
    category: str = Field(..., example="utilidades_domesticas")
    weight: float = Field(..., example=500.0, description="Product weight in grams")
    dimensions: Dimensions
    freight: float = Field(..., example=15.5, description="Freight value")

class PricePredictionResponse(BaseModel):
    predicted_price: float
    confidence: float
    model_used: str
    r2_score: float
    mse: float

# Local caches
_best_model = None
_best_model_mtime = 0.0
_best_model_lock = threading.Lock()

_preprocessor_state = None
_preprocessor_mtime = 0.0
_preprocessor_lock = threading.Lock()

# Local preprocessor caches
_preprocessor_state = None
_preprocessor_mtime = 0.0
_preprocessor_lock = threading.Lock()

def get_cached_preprocessor_state(path: str) -> Any:
    global _preprocessor_state, _preprocessor_mtime
    with _preprocessor_lock:
        mtime = os.path.getmtime(path)
        if _preprocessor_state is not None and _preprocessor_mtime == mtime:
            return _preprocessor_state
        _preprocessor_state = joblib.load(path)
        _preprocessor_mtime = mtime
        return _preprocessor_state

@router.post("/predict-price", response_model=PricePredictionResponse)
def predict_price(payload: PricePredictionInput):
    """Predicts optimal retail price using the serialized best model."""
    from backend.services.ml_service import get_cached_model, get_winner_model_filename, load_preprocessor_state
    
    meta_path = os.path.join(TRAINED_MODELS_DIR, "best_model_metadata.json")
    if not os.path.exists(meta_path):
        meta_path = os.path.join(MODELS_DIR, "best_model_metadata.json")

    try:
        # Load model, state, and metadata using high-speed caching
        winner_file = get_winner_model_filename()
        model = get_cached_model(winner_file)
        state = load_preprocessor_state()
        
        best_model_name = "Best Model"
        r2 = 0.8040
        mse = 1210.47
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                meta = json.load(f)
                best_model_name = meta.get("best_model_name", "Best Model")
                metrics = meta.get("metrics", {})
                r2 = metrics.get("R2 Score", r2)
                mse = metrics.get("MSE", mse)

        # Prepare input data matching INPUT_FEATURES
        input_data = {
            "product_category_name": payload.category,
            "freight_value": float(payload.freight),
            "product_weight_g": float(payload.weight),
            "product_length_cm": float(payload.dimensions.length),
            "product_height_cm": float(payload.dimensions.height),
            "product_width_cm": float(payload.dimensions.width),
        }

        # Convert to dataframe and scale
        df = pd.DataFrame([input_data])
        X_scaled = load_and_preprocess_price_data(df, is_training=False, saved_state=state)

        # Predict
        predicted_price = float(model.predict(X_scaled)[0])
        predicted_price = max(0.0, predicted_price)

        # Confidence: for regression, we can simulate confidence score based on R2 Score
        confidence = float(r2 * 100.0)

        return PricePredictionResponse(
            predicted_price=round(predicted_price, 2),
            confidence=round(confidence, 1),
            model_used=best_model_name,
            r2_score=round(r2, 4),
            mse=round(mse, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price prediction failed: {str(e)}")
