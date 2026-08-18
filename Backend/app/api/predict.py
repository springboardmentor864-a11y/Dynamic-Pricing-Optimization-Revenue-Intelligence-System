from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.schemas.predict import PredictionRequest
from app.ML.predict import predict_price
from app.database import get_db
from app.models.prediction_history import PredictionHistory


router = APIRouter(
    prefix="/predict",
    tags=["Prediction"]
)


@router.post("/")
def predict(
    data: PredictionRequest,
    db: Session = Depends(get_db)
):

    try:

        features = [
            data.freight_value,
            data.payment_value,
            data.payment_installments,
            data.product_weight_g,
            data.product_length_cm,
            data.product_height_cm,
            data.product_width_cm
        ]

        predicted_price = predict_price(
            features=features,
             model_name=data.model_name        )

        prediction = PredictionHistory(

            freight_value=data.freight_value,

            payment_value=data.payment_value,

            payment_installments=data.payment_installments,

            product_weight_g=data.product_weight_g,

            product_length_cm=data.product_length_cm,

            product_height_cm=data.product_height_cm,

            product_width_cm=data.product_width_cm,

            model_name=data.model_name,
            predicted_price=predicted_price

        )

        db.add(prediction)

        db.commit()

        db.refresh(prediction)

        return {

            "success": True,

            "model": prediction.model_name,

            "predicted_price": round(prediction.predicted_price, 2),

            "prediction_id": prediction.id

        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )