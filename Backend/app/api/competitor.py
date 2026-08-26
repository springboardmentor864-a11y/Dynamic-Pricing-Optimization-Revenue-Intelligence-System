from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.competitor import (
    CompetitorCreate,
    CompetitorUpdate,
    CompetitorResponse
)

from app.services.competitor_service import (
    create_competitor_price,
    get_all_competitor_prices,
    get_competitor_price_by_id,
    update_competitor_price,
    delete_competitor_price
)


router = APIRouter(
    prefix="/competitors",
    tags=["Competitors"]
)


@router.post(
    "/",
    response_model=CompetitorResponse
)
def add_competitor_price(
    competitor: CompetitorCreate,
    db: Session = Depends(get_db)
):

    return create_competitor_price(
        db,
        competitor
    )


@router.get(
    "/",
    response_model=list[CompetitorResponse]
)
def read_competitor_prices(
    db: Session = Depends(get_db)
):

    return get_all_competitor_prices(db)


@router.get(
    "/{competitor_id}",
    response_model=CompetitorResponse
)
def read_competitor_price(
    competitor_id: int,
    db: Session = Depends(get_db)
):

    competitor = get_competitor_price_by_id(
        db,
        competitor_id
    )

    if not competitor:
        raise HTTPException(
            status_code=404,
            detail="Competitor price not found"
        )

    return competitor


@router.put(
    "/{competitor_id}",
    response_model=CompetitorResponse
)
def edit_competitor_price(
    competitor_id: int,
    competitor: CompetitorUpdate,
    db: Session = Depends(get_db)
):

    updated = update_competitor_price(
        db,
        competitor_id,
        competitor
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Competitor price not found"
        )

    return updated


@router.delete(
    "/{competitor_id}"
)
def remove_competitor_price(
    competitor_id: int,
    db: Session = Depends(get_db)
):

    deleted = delete_competitor_price(
        db,
        competitor_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Competitor price not found"
        )

    return {
        "success": True,
        "message": "Competitor price deleted successfully"
    }