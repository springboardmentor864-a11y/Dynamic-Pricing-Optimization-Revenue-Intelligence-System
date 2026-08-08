from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)

from datetime import datetime
try:
    from database import Base
except ImportError:
    from backend.database import Base



# ==============================
# USER TABLE
# ==============================

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    email = Column(
        String(120),
        unique=True,
        nullable=False,
        index=True
    )

    username = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(30),
        default="User",
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True
    )

    phone_number = Column(
        String(20),
        nullable=True
    )

    avatar_url = Column(
        Text,
        nullable=True
    )

    is_approved = Column(
        Boolean,
        default=False,
        nullable=False
    )

    status = Column(
        String(30),
        default="pending",
        nullable=False
    )

    last_login = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )



# ==============================
# PRODUCT TABLE
# ==============================

class Product(Base):
    __tablename__ = "products"
    __table_args__ = {"extend_existing": True}

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(150),
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    current_price = Column(
        Float,
        nullable=False
    )

    cost_price = Column(
        Float,
        nullable=False
    )

    stock = Column(
        Integer,
        default=0
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ==============================
# PREDICTION TABLE
# ==============================

class Prediction(Base):
    __tablename__ = "predictions"
    __table_args__ = {"extend_existing": True}

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    predicted_price = Column(
        Float,
        nullable=False
    )

    confidence_score = Column(
        Float,
        default=0.95
    )

    prediction_time = Column(
        Float,
        default=0.045
    )

    model_name = Column(
        String(100),
        default="Extra Trees Regressor"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ==============================
# PRICE RECOMMENDATION TABLE
# ==============================

class PriceRecommendation(Base):
    __tablename__ = "price_recommendations"
    __table_args__ = {"extend_existing": True}

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=True
    )

    current_price = Column(
        Float,
        nullable=False
    )

    recommended_price = Column(
        Float,
        nullable=False
    )

    forecasted_demand = Column(
        Integer,
        default=100
    )

    competitor_price = Column(
        Float,
        nullable=True
    )

    reason = Column(
        Text,
        nullable=True
    )

    generated_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ==============================
# DEMAND FORECAST TABLE
# ==============================

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"
    __table_args__ = {"extend_existing": True}

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=True
    )

    forecast_date = Column(
        String(50),
        nullable=False
    )

    predicted_demand = Column(
        Float,
        nullable=False
    )

    lower_bound = Column(
        Float,
        nullable=False
    )

    upper_bound = Column(
        Float,
        nullable=False
    )

    confidence = Column(
        Float,
        default=0.95
    )

    model_version = Column(
        String(50),
        default="v1.0.0"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ==============================
# PREDICTION HISTORY TABLE
# ==============================

class PredictionHistory(Base):
    __tablename__ = "prediction_history"
    __table_args__ = {"extend_existing": True}

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    prediction_id = Column(
        Integer,
        ForeignKey("predictions.id"),
        nullable=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    input_data = Column(
        Text,
        nullable=False
    )

    predicted_price = Column(
        Float,
        nullable=False
    )

    confidence = Column(
        Float,
        default=0.95
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ==============================
# NOTIFICATION TABLE
# ==============================

class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = {"extend_existing": True}

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(150),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    type = Column(
        String(50),
        default="info"
    )

    is_read = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ==============================
# REPORT TABLE
# ==============================

class Report(Base):
    __tablename__ = "reports"
    __table_args__ = {"extend_existing": True}

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    report_name = Column(
        String(150),
        nullable=False
    )

    report_type = Column(
        String(50),
        nullable=False
    )

    generated_by = Column(
        String(100),
        nullable=False
    )

    generated_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ==============================
# ACTIVITY LOG TABLE
# ==============================

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    __table_args__ = {"extend_existing": True}

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    action = Column(
        String(255),
        nullable=False
    )

    timestamp = Column(
        DateTime,
        default=datetime.utcnow
    )


# ==============================
# SETTINGS TABLE
# ==============================

class Setting(Base):
    __tablename__ = "settings"
    __table_args__ = {"extend_existing": True}

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    theme = Column(
        String(30),
        default="dark"
    )

    language = Column(
        String(20),
        default="en"
    )

    notifications_enabled = Column(
        Boolean,
        default=True
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


# ==============================
# PASSWORD RESET OTP TABLE
# ==============================

class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"
    __table_args__ = {"extend_existing": True}

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    email_or_phone = Column(
        String(120),
        nullable=False,
        index=True
    )

    otp_code = Column(
        String(6),
        nullable=False
    )

    expires_at = Column(
        DateTime,
        nullable=False
    )

    is_used = Column(
        Boolean,
        default=False
    )

    attempts = Column(
        Integer,
        default=0
    )

    ip_address = Column(
        String(50),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


