from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import Float
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey

from app.database import Base


class Sales(Base):

    __tablename__ = "sales"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    quantity_sold = Column(
        Integer,
        nullable=False
    )

    revenue = Column(
        Float,
        nullable=False
    )

    sale_date = Column(
        DateTime,
        default=datetime.utcnow
    )