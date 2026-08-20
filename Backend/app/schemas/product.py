from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    product_name: str = Field(..., min_length=2, max_length=255)
    category: str = Field(..., min_length=2, max_length=100)

    cost_price: float = Field(..., gt=0)
    selling_price: float = Field(..., gt=0)

    stock: int = Field(default=0, ge=0)

    product_weight: Optional[float] = Field(default=None, gt=0)
    product_length: Optional[float] = Field(default=None, gt=0)
    product_height: Optional[float] = Field(default=None, gt=0)
    product_width: Optional[float] = Field(default=None, gt=0)


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None

    cost_price: Optional[float] = Field(default=None, gt=0)
    selling_price: Optional[float] = Field(default=None, gt=0)

    stock: Optional[int] = Field(default=None, ge=0)

    product_weight: Optional[float] = Field(default=None, gt=0)
    product_length: Optional[float] = Field(default=None, gt=0)
    product_height: Optional[float] = Field(default=None, gt=0)
    product_width: Optional[float] = Field(default=None, gt=0)


class ProductResponse(BaseModel):
    id: int
    product_name: str
    category: str

    cost_price: float
    selling_price: float

    stock: int

    product_weight: Optional[float]
    product_length: Optional[float]
    product_height: Optional[float]
    product_width: Optional[float]

    created_at: datetime

    class Config:
        from_attributes = True