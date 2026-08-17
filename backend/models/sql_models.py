from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    role = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Legacy fields to prevent breaking any legacy code
    full_name = Column(String(128), nullable=True)
    password = Column(String(128), nullable=True)
    department = Column(String(64), nullable=True)
    phone = Column(String(32), nullable=True)
    created_date = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    status = Column(String(32), nullable=True)
    profile_image = Column(Text, nullable=True)
    login_provider = Column(String(64), default="Local")

    # Relationships
    predictions = relationship("PredictionHistory", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String(64), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    category = Column(String(128), nullable=False)
    current_price = Column(Float, nullable=True)
    cost_price = Column(Float, nullable=True)
    stock = Column(Integer, default=100)
    weight = Column(Float, nullable=True)
    freight_value = Column(Float, nullable=False)
    delivery_days = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Legacy fields
    product_name = Column(String(255), nullable=True)
    actual_price = Column(Float, nullable=True)
    predicted_price = Column(Float, nullable=True)
    product_weight = Column(Float, nullable=True)
    demand_level = Column(String(32), default="Medium")

    # Relationships
    predictions = relationship("PredictionHistory", back_populates="product", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="product", cascade="all, delete-orphan")
    forecasts = relationship("DemandForecast", back_populates="product", cascade="all, delete-orphan")
    audits = relationship("AuditLog", back_populates="product", cascade="all, delete-orphan")
    forecast_histories = relationship("ForecastHistory", back_populates="product", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="product", cascade="all, delete-orphan")


class DemandForecast(Base):
    __tablename__ = 'demand_forecasts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='SET NULL'), nullable=True)
    forecast_date = Column(DateTime, nullable=False)
    predicted_demand = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    model_version = Column(String(32), default="1.0.0")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="forecasts")


class Recommendation(Base):
    __tablename__ = 'price_recommendations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='SET NULL'), nullable=True)
    current_price = Column(Float, nullable=True)
    recommended_price = Column(Float, nullable=False)
    forecasted_demand = Column(Float, nullable=True)
    competitor_price = Column(Float, nullable=True)
    reason = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Legacy fields
    legacy_product_id = Column(String(64), nullable=True)
    predicted_price = Column(Float, nullable=True)
    recommendation_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="recommendations")


class PredictionHistory(Base):
    __tablename__ = 'prediction_history'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='SET NULL'), nullable=True)
    model_name = Column(String(64), nullable=False)
    model_version = Column(String(32), default="1.0.0")
    predicted_price = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    recommended_price = Column(Float, nullable=False)
    reason = Column(Text, nullable=True)
    user_id = Column(String(64), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    prediction_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Core Enterprise tracking fields
    request_id = Column(String(64), nullable=True)
    prediction_version = Column(String(32), default="1.0.0")
    
    # Legacy fields
    legacy_product_id = Column(String(64), nullable=True)
    product_name = Column(String(255), nullable=True)
    category = Column(String(128), nullable=False)
    actual_price = Column(Float, nullable=True)
    model_used = Column(String(64), nullable=True)
    features = Column(Text, nullable=True)
    created_date = Column(DateTime, default=datetime.datetime.utcnow)
    user_email = Column(String(128), nullable=True)
    demand = Column(String(32), nullable=True)
    llm_reason = Column(Text, nullable=True)

    product = relationship("Product", back_populates="predictions")
    user = relationship("User", back_populates="predictions")


class TrainingHistory(Base):
    __tablename__ = 'training_history'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(64), nullable=False)
    dataset_version = Column(String(32), default="1.0.0")
    accuracy = Column(Float, nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    training_time = Column(Float, nullable=False)
    trained_by = Column(String(128), default="system")
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Legacy fields
    r2 = Column(Float, nullable=True)
    mse = Column(Float, nullable=True)
    inference_time = Column(Float, nullable=True)
    status = Column(String(32), default="completed")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = 'activity_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = Column(String(128), nullable=False)
    module = Column(String(64), default='General')
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Legacy fields
    user_email = Column(String(128), nullable=True)
    details = Column(Text, nullable=True)

    user = relationship("User", back_populates="activity_logs")


class AuditLog(Base):
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='SET NULL'), nullable=True)
    product_name = Column(String(255), nullable=True)
    predicted_price = Column(Float, nullable=False)
    model_used = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=False)
    llm_output = Column(Text, nullable=True)
    prediction_time = Column(DateTime, default=datetime.datetime.utcnow)
    operator = Column(String(128), nullable=False)
    
    # Core Enterprise tracking fields
    request_id = Column(String(64), nullable=True)
    prediction_version = Column(String(32), default="1.0.0")
    
    # Legacy fields
    legacy_product_id = Column(String(64), nullable=True)

    product = relationship("Product", back_populates="audits")


class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='SET NULL'), nullable=True)
    type = Column(String(32), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(32), default="unread", nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    product = relationship("Product", back_populates="notifications")


class ForecastHistory(Base):
    __tablename__ = 'forecast_history'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='SET NULL'), nullable=True)
    forecast_date = Column(DateTime, nullable=False)
    demand = Column(Float, nullable=False)
    lower_ci = Column(Float, nullable=False)
    upper_ci = Column(Float, nullable=False)
    model_used = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    product = relationship("Product", back_populates="forecast_histories")


class CompetitorPrice(Base):
    __tablename__ = 'competitor_prices'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    competitor_name = Column(String(128), nullable=False)
    competitor_price = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    source = Column(String(128), default="demo")
    
    product = relationship("Product", backref="competitor_prices")


class CompetitiveAnalysisHistory(Base):
    __tablename__ = 'competitive_analysis_history'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    our_price = Column(Float, nullable=False)
    competitor_average = Column(Float, nullable=False)
    price_gap = Column(Float, nullable=False)
    competitive_position = Column(String(64), nullable=False)
    recommended_price = Column(Float, nullable=False)
    ai_insight = Column(Text, nullable=True)
    user_id = Column(String(64), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    product = relationship("Product", backref="competitive_analyses")
    user = relationship("User", backref="competitive_analyses")
