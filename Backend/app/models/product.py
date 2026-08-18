from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Float
from sqlalchemy import DateTime

from app.database import Base


class Product(Base):

    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_name = Column(
        String(255),
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    cost_price = Column(
        Float,
        nullable=False
    )

    selling_price = Column(
        Float,
        nullable=False
    )

    stock = Column(
        Integer,
        default=0
    )

    product_weight = Column(
        Float,
        nullable=True
    )

    product_length = Column(
        Float,
        nullable=True
    )

    product_height = Column(
        Float,
        nullable=True
    )

    product_width = Column(
        Float,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )