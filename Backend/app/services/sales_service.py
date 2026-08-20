from sqlalchemy.orm import Session

from app.models.sales import Sales

from app.schemas.sales import (
    SalesCreate,
    SalesUpdate
)


def create_sale(
    db: Session,
    sale: SalesCreate
):

    db_sale = Sales(
        product_id=sale.product_id,
        quantity_sold=sale.quantity_sold,
        revenue=sale.revenue,
        sale_date=sale.sale_date
    )

    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)

    return db_sale


def get_all_sales(
    db: Session
):

    return db.query(Sales).all()


def get_sale_by_id(
    db: Session,
    sale_id: int
):

    return (
        db.query(Sales)
        .filter(
            Sales.id == sale_id
        )
        .first()
    )


def update_sale(
    db: Session,
    sale_id: int,
    sale: SalesUpdate
):

    db_sale = get_sale_by_id(
        db,
        sale_id
    )

    if not db_sale:
        return None

    update_data = sale.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():

        setattr(
            db_sale,
            key,
            value
        )

    db.commit()
    db.refresh(db_sale)

    return db_sale


def delete_sale(
    db: Session,
    sale_id: int
):

    db_sale = get_sale_by_id(
        db,
        sale_id
    )

    if not db_sale:
        return None

    db.delete(db_sale)
    db.commit()

    return db_sale
