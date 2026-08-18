from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.prediction_history import PredictionHistory


router = APIRouter(
    prefix="/predictions",
    tags=["Prediction History"]
)


@router.get("/")
def get_predictions(
    db: Session = Depends(get_db)
):

    predictions = (
        db.query(PredictionHistory)
        .order_by(PredictionHistory.created_at.desc())
        .all()
    )

    return predictions