from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)

    freight_value = Column(Float, nullable=False)
    payment_value = Column(Float, nullable=False)
    payment_installments = Column(Integer, nullable=False)

    product_weight_g = Column(Float, nullable=False)
    product_length_cm = Column(Float, nullable=False)
    product_height_cm = Column(Float, nullable=False)
    product_width_cm = Column(Float, nullable=False)

    model_name = Column(String, nullable=False)

    predicted_price = Column(Float, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )