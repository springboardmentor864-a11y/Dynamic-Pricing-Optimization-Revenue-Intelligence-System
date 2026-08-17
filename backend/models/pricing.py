from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class PredictInput(BaseModel):
    category: str = Field(..., example="utilidades_domesticas")
    weight: float = Field(..., gt=0, example=500.0)
    length: float = Field(..., gt=0, example=20.0)
    height: float = Field(..., gt=0, example=10.0)
    width: float = Field(..., gt=0, example=15.0)
    photos: int = Field(..., ge=1, example=3)
    freight: float = Field(..., ge=0, example=15.5)
    name_length: int = Field(..., ge=1, example=40)
    description_length: int = Field(..., ge=1, example=250)
    mode: str = Field(default="best", description="best, single, compare")
    selected_model: str = Field(default="", description="Name of specifically selected model")
    product_id: Optional[str] = Field(default=None, description="Optional selected product ID")
    product_name: Optional[str] = Field(default=None, description="Optional selected product name")
    user_email: Optional[str] = Field(default="guest@pricepilot.ai", description="Email of the logged in user")

class ComparisonRow(BaseModel):
    model_name: str
    predicted_price: float
    r2_score: float
    mse: float
    rmse: float
    mae: float
    prediction_time_ms: float

class PricePredictionResponse(BaseModel):
    recommended_price: float
    champion_model: str
    predictions: Dict[str, float]
    confidence: float
    r2: float
    mse: float
    rmse: float
    mae: float
    inference_time_ms: float
    explanations: List[str]
    comparison_table: Optional[List[ComparisonRow]] = None
    
    # Newly requested simulator comparative fields
    dataset_average: Optional[float] = 0.0
    difference_value: Optional[float] = 0.0
    quality_status: Optional[str] = "High Confidence"

class ProductDetailsResponse(BaseModel):
    product_id: str
    product_name: str
    category: str
    category_english: str
    weight: float
    length: float
    height: float
    width: float
    photos: int
    name_length: int
    description_length: int
    historical_average_price: float
    historical_min_price: float
    historical_max_price: float
    median_price: float
    avg_freight: float
    avg_delivery_days: float
    total_orders: int
    popularity_score: int
    average_customer_rating: float
