# ==========================================================
# PricePilot AI - Enterprise Backend Application
# Machine Learning Based Dynamic Pricing and Demand Forecasting System
# Organization: Infosys Springboard 7.0
# Completion: August 2026
# Team: Narendar Reddy, Manvitha, Pravallika, Ashwindh
# ==========================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import os
from fastapi.staticfiles import StaticFiles

try:
    from database import engine, Base, get_db_status_details
    from seed import init_db_and_seed
    from routers import auth, predict, dashboard, users, docs, competitors
    from middleware import SecurityHeadersMiddleware
except ImportError:
    from backend.database import engine, Base, get_db_status_details
    from backend.seed import init_db_and_seed
    from backend.routers import auth, predict, dashboard, users, docs, competitors
    from backend.middleware import SecurityHeadersMiddleware


# ==========================================================
# Database Initialization
# PostgreSQL Tables + Seed Data
# ==========================================================

Base.metadata.create_all(bind=engine)

init_db_and_seed()


# ==========================================================
# FastAPI Application Configuration
# ==========================================================

app = FastAPI(
    title="PricePilot AI Enterprise Platform",
    description="""
    Enterprise Machine Learning Based Dynamic Pricing &
    Demand Forecasting System.

    Features:
    - AI Dynamic Pricing
    - Demand Forecasting
    - Price Recommendation Engine
    - Analytics Dashboard
    - Prediction History
    - Enterprise REST APIs

    Organization:
    Infosys Springboard 7.0

    Powered By:
    FastAPI • Machine Learning • Extra Trees • PostgreSQL • React
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# ==========================================================
# Middleware & Security Configuration
# ==========================================================

app.add_middleware(SecurityHeadersMiddleware)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
origins = [origin.strip() for origin in allowed_origins_env.split(",")] if allowed_origins_env else [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount Static Documents Directory
static_docs_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(os.path.join(static_docs_path, "documents"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_docs_path), name="static")

# ==========================================================
# API Routers
# ==========================================================

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(users.admin_router)
app.include_router(predict.router)
app.include_router(dashboard.router)
app.include_router(docs.router)
app.include_router(competitors.router)





# ==========================================================
# Root API
# ==========================================================

@app.get("/")
def root():
    return {
        "platform": "PricePilot AI Enterprise Platform",
        "organization": "Infosys Springboard 7.0",
        "version": "2.0.0",
        "status": "Operational",
        "database": "PostgreSQL SQLAlchemy ORM",
        "model": "Extra Trees Regressor",
        "team": [
            "Narendar Reddy",
            "Manvitha",
            "Pravallika",
            "Ashwindh"
        ]
    }


# ==========================================================
# Health Check & Database Status APIs
# ==========================================================

@app.get("/api/health")
def health_check():
    db_metrics = get_db_status_details()
    return {
        "status": "healthy" if db_metrics["connected"] else "degraded",
        "backend": "FastAPI",
        "database": "PostgreSQL",
        "model_engine": "Extra Trees Regressor",
        "uptime": "100%",
        "postgres_connected": db_metrics["connected"]
    }


@app.get("/api/db-status")
def get_db_status():
    return get_db_status_details()


# ==========================================================
# Application Runner
# ==========================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )