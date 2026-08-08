from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    user: Dict[str, Any]

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    name: str
    email: str
    username: str
    password: str
    phone_number: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    password: Optional[str] = None
    current_password: Optional[str] = None

class UserUpdateAdmin(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_approved: Optional[bool] = None
    status: Optional[str] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    username: str
    role: str
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_approved: bool = True
    status: str = "approved"
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    email: str
    username: str
    password: str
    role: str = "User"
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_approved: bool = True
    status: str = "approved"

class OTPRequest(BaseModel):
    identifier: str

class OTPVerify(BaseModel):
    identifier: str
    otp_code: str

class PasswordReset(BaseModel):
    identifier: str
    otp_code: str
    new_password: str



class ProductFeatures(BaseModel):
    order_item_id: int
    freight_value: float
    order_status: int
    product_category_name: int
    product_name_lenght: float
    product_description_lenght: float
    product_photos_qty: float
    product_weight_g: float
    product_length_cm: float
    product_height_cm: float
    product_width_cm: float
    purchase_year: int
    purchase_month: int
    purchase_day: int
    purchase_weekday: int
    product_volume: float

class PredictionResponse(BaseModel):
    predicted_price: float
    confidence_score: float
    prediction_time: float
    model_name: str
    demand_level: str
    profit_margin: float
    recommendation: str

class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    category: str
    current_price: float
    cost_price: float
    stock: int = 0

class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    current_price: float
    cost_price: float
    stock: int
    created_at: datetime

    class Config:
        from_attributes = True

class PriceRecommendationCreate(BaseModel):
    product_id: Optional[int] = None
    current_price: float
    recommended_price: float
    forecasted_demand: int = 100
    competitor_price: Optional[float] = None
    reason: Optional[str] = None

class PriceRecommendationResponse(BaseModel):
    id: int
    product_id: Optional[int]
    current_price: float
    recommended_price: float
    forecasted_demand: int
    competitor_price: Optional[float]
    reason: Optional[str]
    generated_at: datetime

    class Config:
        from_attributes = True

class DemandForecastCreate(BaseModel):
    product_id: Optional[int] = None
    forecast_date: str
    predicted_demand: float
    lower_bound: float
    upper_bound: float
    confidence: float = 0.95
    model_version: str = "v1.0.0"

class DemandForecastResponse(BaseModel):
    id: int
    product_id: Optional[int]
    forecast_date: str
    predicted_demand: float
    lower_bound: float
    upper_bound: float
    confidence: float
    model_version: str
    created_at: datetime

    class Config:
        from_attributes = True


class BulkStatusRequest(BaseModel):
    user_ids: List[int]
    status: str  # e.g., "approved", "suspended", "active", "rejected"


class BulkDeleteRequest(BaseModel):
    user_ids: List[int]


