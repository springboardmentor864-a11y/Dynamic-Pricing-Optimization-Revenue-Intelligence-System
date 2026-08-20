from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.sales import (
    SalesCreate,
    SalesUpdate,
    SalesResponse
)

from app.services.sales_service import (
    create_sale,
    get_all_sales,
    get_sale_by_id,
    update_sale,
    delete_sale
)


router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)


@router.post(
    "/",
    response_model=SalesResponse
)
def add_sale(
    sale: SalesCreate,
    db: Session = Depends(get_db)
):

    return create_sale(
        db,
        sale
    )


@router.get(
    "/",
    response_model=list[SalesResponse]
)
def read_sales(
    db: Session = Depends(get_db)
):

    return get_all_sales(db)


@router.get(
    "/{sale_id}",
    response_model=SalesResponse
)
def read_sale(
    sale_id: int,
    db: Session = Depends(get_db)
):

    sale = get_sale_by_id(
        db,
        sale_id
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    return sale


@router.put(
    "/{sale_id}",
    response_model=SalesResponse
)
def edit_sale(
    sale_id: int,
    sale: SalesUpdate,
    db: Session = Depends(get_db)
):

    updated = update_sale(
        db,
        sale_id,
        sale
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    return updated


@router.delete(
    "/{sale_id}"
)
def remove_sale(
    sale_id: int,
    db: Session = Depends(get_db)
):

    deleted = delete_sale(
        db,
        sale_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    return {
        "success": True,
        "message": "Sale deleted successfully"
    }