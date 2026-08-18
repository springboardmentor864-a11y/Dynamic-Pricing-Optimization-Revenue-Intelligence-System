from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.api import pricing


# Import models
import app.models


# Import routers
from app.api.auth import router as auth_router
from app.api.test import router as test_router
from app.api.predict import router as predict_router
from app.api.prediction_history import router as prediction_history_router
from app.api.forecast import router as forecast_router
from app.api.product import router as product_router
from app.api.sales import router as sales_router
from app.api.competitor import router as competitor_router
from app.api.price_history import router as price_history_router
from app.api.analytics import router as analytics_router



# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="PricePilot AI API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register APIs

app.include_router(auth_router)
app.include_router(test_router)
app.include_router(predict_router)
app.include_router(prediction_history_router)
app.include_router(forecast_router)
app.include_router(product_router)
app.include_router(sales_router)
app.include_router(competitor_router)
app.include_router(price_history_router)
app.include_router(analytics_router)
app.include_router(pricing.router)



@app.get("/")
def home():
    return {
        "message": "PricePilot AI Backend Running"
    }