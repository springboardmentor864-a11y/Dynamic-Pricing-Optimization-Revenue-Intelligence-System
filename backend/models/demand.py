from pydantic import BaseModel, Field
from typing import List, Optional

class DemandForecastInput(BaseModel):
    category: str = Field(..., example="cama_mesa_banho")
    month: int = Field(..., ge=1, le=12, example=7, description="Month (1-12)")
    previous_orders: int = Field(..., ge=0, example=200, description="Previous month's order volume")
    price: float = Field(..., gt=0, example=80.0, description="Product price")

class DemandForecastResponse(BaseModel):
    predicted_demand: int
    trend: str
    previous_orders: int

class DailyDemandPoint(BaseModel):
    date: str
    demand: int

class ForecastDemandPoint(BaseModel):
    date: str
    demand: int
    lower_ci: float
    upper_ci: float

class TimeSeriesForecastResponse(BaseModel):
    status: str
    historical_data: List[DailyDemandPoint]
    forecast_data: List[ForecastDemandPoint]
    total_forecast_sales: int
    max_demand: int
    min_demand: int
    average_demand: float
    peak_demand_date: str
    lowest_demand_date: str
    growth_pct: float
    accuracy_pct: Optional[float] = None
    model_used: str
