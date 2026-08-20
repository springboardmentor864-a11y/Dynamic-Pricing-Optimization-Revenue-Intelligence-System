from sqlalchemy.orm import Session

from app.models.competitor import CompetitorPrice

from app.schemas.competitor import (
    CompetitorCreate,
    CompetitorUpdate
)


def create_competitor_price(
    db: Session,
    competitor: CompetitorCreate
):

    db_competitor = CompetitorPrice(
        product_id=competitor.product_id,
        competitor_name=competitor.competitor_name,
        competitor_price=competitor.competitor_price
    )

    db.add(db_competitor)
    db.commit()
    db.refresh(db_competitor)

    return db_competitor


def get_all_competitor_prices(db: Session):

    return db.query(CompetitorPrice).all()


def get_competitor_price_by_id(
    db: Session,
    competitor_id: int
):

    return db.query(
        CompetitorPrice
    ).filter(
        CompetitorPrice.id == competitor_id
    ).first()


def update_competitor_price(
    db: Session,
    competitor_id: int,
    competitor: CompetitorUpdate
):

    db_competitor = get_competitor_price_by_id(
        db,
        competitor_id
    )

    if not db_competitor:
        return None

    update_data = competitor.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(
            db_competitor,
            key,
            value
        )

    db.commit()
    db.refresh(db_competitor)

    return db_competitor


def delete_competitor_price(
    db: Session,
    competitor_id: int
):

    db_competitor = get_competitor_price_by_id(
        db,
        competitor_id
    )

    if not db_competitor:
        return None

    db.delete(db_competitor)
    db.commit()

    return db_competitor