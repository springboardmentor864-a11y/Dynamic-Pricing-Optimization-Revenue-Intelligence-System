from pydantic import BaseModel, Field

class RevenueOptimizationInput(BaseModel):
    category: str = Field(..., example="cama_mesa_banho")
    month: int = Field(..., ge=1, le=12, example=7, description="Month (1-12)")
    previous_orders: int = Field(..., ge=0, example=200, description="Previous month's order volume")
    price: float = Field(..., gt=0, example=80.0, description="Predicted price target")

class RevenueOptimizationResponse(BaseModel):
    current_price: float
    current_demand: int
    current_revenue: float
    optimized_price: float
    optimized_demand: int
    optimized_revenue: float
    improvement_percentage: float
