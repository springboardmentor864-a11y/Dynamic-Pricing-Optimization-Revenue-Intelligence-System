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


# ==========================================================
# Competitor Price Analysis Schemas
# ==========================================================

class CompetitorPriceCreate(BaseModel):
    product_id: str
    competitor_name: str
    competitor_product_name: Optional[str] = None
    competitor_price: float
    currency: Optional[str] = "INR"
    source: Optional[str] = "Manual"
    captured_at: Optional[str] = None
    category: Optional[str] = "Electronics"
    brand: Optional[str] = "Generic"
    our_price: Optional[float] = None
    competitor_rating: Optional[float] = 4.5
    competitor_stock: Optional[int] = 50
    marketplace: Optional[str] = ""


class CompetitorPriceUpdate(BaseModel):
    competitor_name: Optional[str] = None
    competitor_product_name: Optional[str] = None
    competitor_price: Optional[float] = None
    currency: Optional[str] = None
    source: Optional[str] = None
    captured_at: Optional[str] = None
    our_price: Optional[float] = None
    competitor_rating: Optional[float] = None
    competitor_stock: Optional[int] = None
    marketplace: Optional[str] = None


class CompetitorPriceResponse(BaseModel):
    id: int
    product_id: str
    product_name: Optional[str] = ""
    category: Optional[str] = "General"
    brand: Optional[str] = "Generic"
    our_price: float
    competitor_name: str
    competitor_product_name: Optional[str] = ""
    competitor_price: float
    price_difference: float
    price_difference_percentage: float
    competitor_rating: Optional[float] = 4.5
    competitor_stock: Optional[int] = 50
    marketplace: Optional[str] = ""
    currency: str = "INR"
    source: str = "Manual"
    captured_at: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CompetitorItem(BaseModel):
    name: str
    price: float
    difference: float
    difference_percentage: float
    rating: Optional[float] = 4.5
    stock: Optional[int] = 50
    marketplace: Optional[str] = ""
    source: Optional[str] = "Manual"
    currency: Optional[str] = "INR"
    captured_at: Optional[str] = ""


class CompetitorAnalysisItem(BaseModel):
    id: Optional[int] = None
    product_id: str
    product_name: str
    category: str
    brand: str
    our_price: float
    lowest_competitor_price: float
    highest_competitor_price: float
    average_competitor_price: float
    price_difference: float
    price_difference_percentage: float
    recommended_price: float
    competitive_status: str  # UNDERPRICED, COMPETITIVE, OVERPRICED
    competitor_count: int
    analyzed_at: Optional[datetime] = None


class ProductDetailComparison(BaseModel):
    product_id: str
    product_name: str
    category: str
    brand: str
    our_price: float
    average_competitor_price: float
    lowest_competitor_price: float
    highest_competitor_price: float
    price_difference: float
    price_difference_percentage: float
    price_position: str
    position_indicator: str  # Below Market, At Market, Above Market
    competitive_status: str  # UNDERPRICED, COMPETITIVE, OVERPRICED
    recommended_price: float
    recommendation_reason: str
    competitors: List[CompetitorItem]


class CompetitorRecommendationResponse(BaseModel):
    product_id: str
    our_price: float
    ml_recommended_price: float
    average_competitor_price: float
    lowest_competitor_price: float
    highest_competitor_price: float
    recommended_price: float
    competitive_status: str
    reason: str


class CompetitorTrendPoint(BaseModel):
    date: str
    our_price: float
    prices: Dict[str, float]


class CompetitorSummaryResponse(BaseModel):
    total_products_analyzed: int
    competitive_products: int
    overpriced_products: int
    underpriced_products: int
    average_price_gap: float
    average_percentage_gap: float
    potential_pricing_opportunities: int
    most_competitive_marketplace: str
    status_distribution: Dict[str, float]  # {"UNDERPRICED": 25.0, "COMPETITIVE": 50.0, "OVERPRICED": 25.0}
    insights: List[str]
    categories: List[str]
    competitors: List[str]
    marketplaces: List[str]


class CSVImportResponse(BaseModel):
    successful_rows: int
    failed_rows: int
    validation_errors: List[str]
    status: str



