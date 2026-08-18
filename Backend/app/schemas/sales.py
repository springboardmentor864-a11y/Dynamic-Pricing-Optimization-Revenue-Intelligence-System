from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SalesCreate(BaseModel):

    product_id: int = Field(..., gt=0)

    quantity_sold: int = Field(..., gt=0)

    revenue: float = Field(..., gt=0)

    sale_date: datetime


class SalesUpdate(BaseModel):

    quantity_sold: Optional[int] = Field(
        default=None,
        gt=0
    )

    revenue: Optional[float] = Field(
        default=None,
        gt=0
    )

    sale_date: Optional[datetime] = None


class SalesResponse(BaseModel):

    id: int

    product_id: int

    quantity_sold: int

    revenue: float

    sale_date: datetime

    class Config:
        from_attributes = True
