from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PriceHistoryCreate(BaseModel):

    product_id: int = Field(..., gt=0)

    old_price: float = Field(..., gt=0)

    new_price: float = Field(..., gt=0)


class PriceHistoryUpdate(BaseModel):

    old_price: Optional[float] = Field(default=None, gt=0)

    new_price: Optional[float] = Field(default=None, gt=0)


class PriceHistoryResponse(BaseModel):

    id: int

    product_id: int

    old_price: float

    new_price: float

    changed_at: datetime

    class Config:
        from_attributes = True