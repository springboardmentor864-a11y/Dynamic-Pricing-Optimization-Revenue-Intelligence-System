from pydantic import BaseModel, Field


class PricingSimulationRequest(BaseModel):
    product_id: int
    proposed_price: float = Field(gt=0)