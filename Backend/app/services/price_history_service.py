from sqlalchemy.orm import Session

from app.models.price_history import PriceHistory

from app.schemas.price_history import (
    PriceHistoryCreate,
    PriceHistoryUpdate
)


def create_price_history(
    db: Session,
    history: PriceHistoryCreate
):

    db_history = PriceHistory(
        product_id=history.product_id,
        old_price=history.old_price,
        new_price=history.new_price
    )

    db.add(db_history)
    db.commit()
    db.refresh(db_history)

    return db_history


def get_all_price_history(
    db: Session
):

    return (
        db.query(PriceHistory)
        .order_by(PriceHistory.changed_at.desc())
        .all()
    )


def get_price_history_by_id(
    db: Session,
    history_id: int
):

    return (
        db.query(PriceHistory)
        .filter(
            PriceHistory.id == history_id
        )
        .first()
    )


def update_price_history(
    db: Session,
    history_id: int,
    history: PriceHistoryUpdate
):

    db_history = get_price_history_by_id(
        db,
        history_id
    )

    if not db_history:
        return None

    update_data = history.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():

        setattr(
            db_history,
            key,
            value
        )

    db.commit()
    db.refresh(db_history)

    return db_history


def delete_price_history(
    db: Session,
    history_id: int
):

    db_history = get_price_history_by_id(
        db,
        history_id
    )

    if not db_history:
        return None

    db.delete(db_history)
    db.commit()

    return db_history;
