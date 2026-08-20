from fastapi import APIRouter, HTTPException

from app.schemas.forecast import ForecastRequest
from app.ML.forecasting.forecast import forecast_prices


router = APIRouter(
    prefix="/forecast",
    tags=["Forecast"]
)


@router.post("/")
def forecast(data: ForecastRequest):

    try:
        result = forecast_prices(
            periods=data.periods
        )

        forecast_data = []

        for _, row in result.iterrows():

            forecast_data.append({
                "date": row["ds"].strftime("%Y-%m-%d"),

                "predicted_demand": round(
                    float(row["yhat"]),
                    2
                ),

                "lower_bound": round(
                    float(row["yhat_lower"]),
                    2
                ),

                "upper_bound": round(
                    float(row["yhat_upper"]),
                    2
                )
            })

        return {
            "success": True,
            "model": "Prophet",
            "forecast": forecast_data
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )