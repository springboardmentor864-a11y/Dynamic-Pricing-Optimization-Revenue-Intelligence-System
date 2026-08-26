from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CompetitorCreate(BaseModel):

    product_id: int = Field(..., gt=0)

    competitor_name: str = Field(
        ...,
        min_length=2,
        max_length=150
    )

    competitor_price: float = Field(
        ...,
        gt=0
    )


class CompetitorUpdate(BaseModel):

    competitor_name: Optional[str] = None

    competitor_price: Optional[float] = Field(
        default=None,
        gt=0
    )


class CompetitorResponse(BaseModel):

    id: int

    product_id: int

    competitor_name: str

    competitor_price: float

    recorded_at: datetime

    class Config:
        from_attributes = True