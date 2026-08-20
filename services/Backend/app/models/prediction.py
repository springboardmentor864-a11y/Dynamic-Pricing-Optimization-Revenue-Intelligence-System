from datetime import datetime

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey

from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(Integer, ForeignKey("products.id"))

    predicted_price = Column(Float, nullable=False)
    predicted_demand = Column(Float, nullable=False)

    confidence_score = Column(Float)

    model_name = Column(String(100))

    predicted_at = Column(DateTime, default=datetime.utcnow)