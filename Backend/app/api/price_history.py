from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.price_history import (
    PriceHistoryCreate,
    PriceHistoryUpdate,
    PriceHistoryResponse
)

from app.services.price_history_service import (
    create_price_history,
    get_all_price_history,
    get_price_history_by_id,
    update_price_history,
    delete_price_history
)


router = APIRouter(
    prefix="/price-history",
    tags=["Price History"]
)


@router.post(
    "/",
    response_model=PriceHistoryResponse
)
def add_price_history(
    history: PriceHistoryCreate,
    db: Session = Depends(get_db)
):

    return create_price_history(
        db,
        history
    )


@router.get(
    "/",
    response_model=list[PriceHistoryResponse]
)
def read_price_history(
    db: Session = Depends(get_db)
):

    return get_all_price_history(db)


@router.get(
    "/{history_id}",
    response_model=PriceHistoryResponse
)
def read_price_history_by_id(
    history_id: int,
    db: Session = Depends(get_db)
):

    history = get_price_history_by_id(
        db,
        history_id
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Price history not found"
        )

    return history


@router.put(
    "/{history_id}",
    response_model=PriceHistoryResponse
)
def edit_price_history(
    history_id: int,
    history: PriceHistoryUpdate,
    db: Session = Depends(get_db)
):

    updated = update_price_history(
        db,
        history_id,
        history
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Price history not found"
        )

    return updated


@router.delete(
    "/{history_id}"
)
def remove_price_history(
    history_id: int,
    db: Session = Depends(get_db)
):

    deleted = delete_price_history(
        db,
        history_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Price history not found"
        )

    return {
        "success": True,
        "message": "Price history deleted successfully"
    }