from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.product import Product
from app.models.sales import Sales
from app.models.prediction_history import PredictionHistory
from app.models.competitor import CompetitorPrice


def dashboard_summary(db: Session):

    # ==========================================================
    # BUSINESS STATISTICS
    # ==========================================================

    total_products = db.query(Product).count()

    total_sales = db.query(Sales).count()

    total_predictions = db.query(
        PredictionHistory
    ).count()

    total_competitors = db.query(
        CompetitorPrice
    ).count()

    total_revenue = (
        db.query(func.sum(Sales.revenue))
        .scalar()
        or 0
    )

    average_price = (
        db.query(func.avg(Product.selling_price))
        .scalar()
        or 0
    )

    # ==========================================================
    # MACHINE LEARNING MODEL METRICS
    # ==========================================================

    model_metrics = {

        "linear_regression": {
            "MAE": 53.4646,
            "RMSE": 118.8161,
            "R2": 0.5834
        },

        "decision_tree": {
            "MAE": 26.2809,
            "RMSE": 77.0643,
            "R2": 0.8248
        },

        "random_forest": {
            "MAE": 20.5505,
            "RMSE": 58.4122,
            "R2": 0.8993
        },

        "xgboost": {
            "MAE": 27.7456,
            "RMSE": 65.1297,
            "R2": 0.8748
        }

    }

    # ==========================================================
    # FIND BEST MODEL
    # ==========================================================

    best_model_key = max(
        model_metrics,
        key=lambda model: model_metrics[model]["R2"]
    )

    best_model_r2 = model_metrics[
        best_model_key
    ]["R2"]

    model_names = {

        "linear_regression": "Linear Regression",

        "decision_tree": "Decision Tree",

        "random_forest": "Random Forest",

        "xgboost": "XGBoost"

    }

    best_model = model_names[
        best_model_key
    ]

    # ==========================================================
    # RETURN ANALYTICS
    # ==========================================================

    return {

        "total_products": total_products,

        "total_sales": total_sales,

        "total_predictions": total_predictions,

        "total_competitors": total_competitors,

        "total_revenue": round(
            float(total_revenue),
            2
        ),

        "average_product_price": round(
            float(average_price),
            2
        ),

        "best_model": best_model,

        "best_model_r2": float(
            best_model_r2
        ),

        "model_metrics": model_metrics

    }