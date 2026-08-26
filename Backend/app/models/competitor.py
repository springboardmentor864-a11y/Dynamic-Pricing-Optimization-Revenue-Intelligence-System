from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import Float
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey

from app.database import Base


class CompetitorPrice(Base):

    __tablename__ = "competitor_prices"

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

    competitor_name = Column(
        String(150),
        nullable=False
    )

    competitor_price = Column(
        Float,
        nullable=False
    )

    recorded_at = Column(
        DateTime,
        default=datetime.utcnow
    )