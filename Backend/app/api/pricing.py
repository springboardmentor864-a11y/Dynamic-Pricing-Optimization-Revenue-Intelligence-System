from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.pricing import PricingSimulationRequest

from app.services.pricing_service import (
    get_pricing_recommendation,
    simulate_pricing
)


router = APIRouter(
    prefix="/pricing",
    tags=["AI Pricing"]
)


# =========================================================
# GET PRICING RECOMMENDATION
# =========================================================

@router.get("/{product_id}")
def pricing_recommendation(
    product_id: int,
    db: Session = Depends(get_db)
):

    result = get_pricing_recommendation(
        db,
        product_id
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "success": True,
        "data": result
    }


# =========================================================
# POST WHAT-IF PRICING SIMULATION
# =========================================================

@router.post("/simulate")
def pricing_simulation(
    data: PricingSimulationRequest,
    db: Session = Depends(get_db)
):

    result = simulate_pricing(
        db=db,
        product_id=data.product_id,
        proposed_price=data.proposed_price
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "success": True,
        "data": result
    }