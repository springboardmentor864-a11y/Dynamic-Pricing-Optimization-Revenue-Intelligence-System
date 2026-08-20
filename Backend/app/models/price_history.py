from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import Float
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey

from app.database import Base


class PriceHistory(Base):

    __tablename__ = "price_history"

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

    old_price = Column(
        Float,
        nullable=False
    )

    new_price = Column(
        Float,
        nullable=False
    )

    changed_at = Column(
        DateTime,
        default=datetime.utcnow
    )