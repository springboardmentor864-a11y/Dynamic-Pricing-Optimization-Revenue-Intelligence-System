from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.models.demand import DemandForecastInput, DemandForecastResponse, TimeSeriesForecastResponse
from models.demand_forecasting import forecast_category_demand
from backend.services.demand_service import generate_daily_demand_forecast
from backend.utils.logger import logger

router = APIRouter()

@router.post("/forecast-demand", response_model=DemandForecastResponse)
def forecast_demand(payload: DemandForecastInput):
    """Predicts seasonal category demand based on pricing elasticity and historic orders volume."""
    try:
        result = forecast_category_demand(
            category=payload.category,
            month=payload.month,
            previous_orders=payload.previous_orders,
            price=payload.price
        )
        return DemandForecastResponse(
            predicted_demand=result["predicted_demand"],
            trend=result["trend"],
            previous_orders=result["previous_orders"]
        )
    except FileNotFoundError as fnf:
        raise HTTPException(
            status_code=400,
            detail="Demand forecasting model is not trained yet."
        )
    except Exception as e:
        logger.error(f"Demand forecasting failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Demand forecasting failed due to an internal server error.")

@router.post("/forecast-time-series", response_model=TimeSeriesForecastResponse)
def forecast_time_series(product_id: Optional[str] = Query(None, description="Optional product string ID to associate forecast with.")):
    """Calculates historical daily demand and runs time-series ARIMA/fallback models to predict 90-day forecast."""
    db_session = None
    try:
        from backend.utils.db import SessionLocal
        from backend.models.sql_models import Product, DemandForecast, ForecastHistory, AuditLog, Notification
        from datetime import datetime
        import uuid
        
        # 1. Run time-series forecast model
        result = generate_daily_demand_forecast()
        
        # 2. Get / Verify product link
        db_session = SessionLocal()
        product = None
        if product_id:
            product = db_session.query(Product).filter(Product.product_id == product_id).first()
        if not product:
            product = db_session.query(Product).first()
        if not product:
            # Fallback if DB completely empty (e.g. initial run)
            product = Product(
                product_id="system-default-product",
                name="Default System Product",
                product_name="Default System Product",
                category="utilidades_domesticas",
                current_price=50.0,
                freight_value=15.0,
                delivery_days=10.0,
                created_at=datetime.utcnow()
            )
            db_session.add(product)
            db_session.flush() # Generate ID
            
        now_dt = datetime.now()
        request_id = str(uuid.uuid4())
        
        # 3. Insert forecasts within a single transaction
        for f in result.get("forecast_data", []):
            f_date = datetime.strptime(f["date"], "%Y-%m-%d")
            
            # Add to redesigned demand_forecasts
            df_record = DemandForecast(
                product_id=product.id,
                forecast_date=f_date,
                predicted_demand=float(f["demand"]),
                lower_bound=float(f["lower_ci"]),
                upper_bound=float(f["upper_ci"]),
                confidence=float(result.get("accuracy_pct", 85.0)),
                model_version="1.0.0",
                created_at=now_dt
            )
            db_session.add(df_record)
            
            # Add to forecast_history (relational mapped)
            fh_record = ForecastHistory(
                product_id=product.id,
                forecast_date=f_date,
                demand=float(f["demand"]),
                lower_ci=float(f["lower_ci"]),
                upper_ci=float(f["upper_ci"]),
                model_used=result.get("model_used", "ARIMA"),
                timestamp=now_dt
            )
            db_session.add(fh_record)
            
        # 4. Insert Audit Log representing the time-series forecasting run
        audit_record = AuditLog(
            product_id=product.id,
            product_name=product.product_name or product.name,
            predicted_price=product.current_price or 0.0,
            model_used=result.get("model_used", "ARIMA"),
            confidence=float(result.get("accuracy_pct", 85.0)),
            llm_output=f"Executed 90-day demand forecast. Total predicted sales: {result.get('total_forecast_sales', 0)}. Peak date: {result.get('peak_demand_date', 'N/A')}.",
            prediction_time=now_dt,
            operator="system",
            request_id=request_id,
            prediction_version="1.0.0",
            legacy_product_id=product.product_id
        )
        db_session.add(audit_record)
        
        # 5. Insert Notification Alert
        notif = Notification(
            product_id=product.id,
            type="forecast",
            message=f"90-day time-series demand forecast updated using {result.get('model_used', 'ARIMA')}. Growth forecast: {result.get('growth_pct', 0.0):+.1f}%.",
            status="unread",
            timestamp=now_dt
        )
        db_session.add(notif)
        
        # Commit everything transactionally
        db_session.commit()
        logger.info(f"Transactionally saved demand forecast for product ID {product.product_id} in database.")
        
        return result
    except FileNotFoundError as fnf:
        if db_session:
            db_session.rollback()
        logger.error(f"Demand forecast dataset missing error: {str(fnf)}")
        raise HTTPException(status_code=404, detail="Required time-series data file is missing.")
    except Exception as e:
        if db_session:
            db_session.rollback()
        logger.error(f"Time Series Forecasting failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Time-series forecasting failed due to an internal server error.")
    finally:
        if db_session:
            db_session.close()
