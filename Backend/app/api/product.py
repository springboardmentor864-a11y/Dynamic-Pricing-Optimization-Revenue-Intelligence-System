from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse
)

from app.services.product_service import (
    create_product,
    get_all_products,
    get_product_by_id,
    update_product,
    delete_product
)


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.post(
    "/",
    response_model=ProductResponse
)
def add_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):

    return create_product(db, product)


@router.get(
    "/",
    response_model=list[ProductResponse]
)
def read_products(
    db: Session = Depends(get_db)
):

    return get_all_products(db)


@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
def read_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = get_product_by_id(
        db,
        product_id
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
def edit_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db)
):

    updated = update_product(
        db,
        product_id,
        product
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return updated


@router.delete(
    "/{product_id}"
)
@router.delete("/{product_id}")
def remove_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    try:

        deleted = delete_product(db, product_id)

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        return {
            "success": True,
            "message": "Product deleted successfully"
        }

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Cannot delete product because sales records exist."
        )