"""
Competitor Price Analysis Router (PricePilot AI)
REST APIs for competitor price CRUD, analysis aggregations, explainable pricing recommendations,
CSV imports, and market intelligence summaries.
"""

import os
import shutil
import tempfile
import pandas as pd
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc

try:
    from database import get_db
    from models import CompetitorPrice, CompetitorAnalysis, Product, User, ActivityLog
    from schemas import (
        CompetitorPriceCreate,
        CompetitorPriceUpdate,
        CompetitorPriceResponse,
        CompetitorAnalysisItem,
        ProductDetailComparison,
        CompetitorRecommendationResponse,
        CompetitorTrendPoint,
        CompetitorSummaryResponse,
        CSVImportResponse,
        CompetitorItem
    )
    from routers.auth import get_current_user, require_admin
    from seed_competitor_data import seed_competitor_dataset, CSV_PATH
except ImportError:
    from backend.database import get_db
    from backend.models import CompetitorPrice, CompetitorAnalysis, Product, User, ActivityLog
    from backend.schemas import (
        CompetitorPriceCreate,
        CompetitorPriceUpdate,
        CompetitorPriceResponse,
        CompetitorAnalysisItem,
        ProductDetailComparison,
        CompetitorRecommendationResponse,
        CompetitorTrendPoint,
        CompetitorSummaryResponse,
        CSVImportResponse,
        CompetitorItem
    )
    from backend.routers.auth import get_current_user, require_admin
    from backend.seed_competitor_data import seed_competitor_dataset, CSV_PATH

router = APIRouter(prefix="/api/competitors", tags=["Competitor Price Analysis"])

# Configurable Status Thresholds
UNDERPRICED_THRESHOLD_PCT = -10.0  # > 10% below competitor average
OVERPRICED_THRESHOLD_PCT = 10.0   # > 10% above competitor average


# ==========================================================
# Calculation Logic Helpers
# ==========================================================

def calculate_competitive_status(price_difference_percentage: float) -> str:
    """
    Classify pricing status based on percentage difference vs competitor average:
    - UNDERPRICED: price_difference_percentage < -10.0%
    - OVERPRICED: price_difference_percentage > +10.0%
    - COMPETITIVE: between -10.0% and +10.0%
    """
    if price_difference_percentage < UNDERPRICED_THRESHOLD_PCT:
        return "UNDERPRICED"
    elif price_difference_percentage > OVERPRICED_THRESHOLD_PCT:
        return "OVERPRICED"
    else:
        return "COMPETITIVE"


def generate_explainable_recommendation(
    our_price: float,
    avg_comp_price: float,
    min_comp_price: float,
    max_comp_price: float
) -> Dict[str, Any]:
    """
    Combines competitor market prices with pricing rules to generate an explainable recommendation.
    """
    pct_diff = ((our_price - avg_comp_price) / avg_comp_price) * 100 if avg_comp_price > 0 else 0.0
    status_label = calculate_competitive_status(pct_diff)

    # Base ML model prediction estimate (e.g. 0.98 * our_price or target market midpoint)
    ml_estimated_price = round(our_price * 0.98, 2)

    if status_label == "OVERPRICED":
        # Price is significantly higher than competitor average -> suggest reducing to competitive ceiling (avg + 2%)
        rec_price = min(our_price, round(avg_comp_price * 1.02, 2))
        reason = (
            f"Current price (₹{our_price:,.2f}) is {pct_diff:.1f}% above the competitor average (₹{avg_comp_price:,.2f}). "
            f"Reducing the price to ₹{rec_price:,.2f} aligns with the competitive market range while protecting sales volume."
        )
    elif status_label == "UNDERPRICED":
        # Price is lower than competitors -> opportunity to capture higher margin up to (avg - 3%)
        rec_price = max(our_price, round(avg_comp_price * 0.97, 2))
        reason = (
            f"Current price (₹{our_price:,.2f}) is {abs(pct_diff):.1f}% below competitor average (₹{avg_comp_price:,.2f}). "
            f"Increasing price to ₹{rec_price:,.2f} captures extra profit margin while maintaining a strong price advantage."
        )
    else: # COMPETITIVE
        rec_price = round((our_price + avg_comp_price) / 2, 2)
        reason = (
            f"Current price (₹{our_price:,.2f}) is competitively positioned ({pct_diff:+.1f}% vs market average of ₹{avg_comp_price:,.2f}). "
            f"Maintaining price around ₹{rec_price:,.2f} balances demand elasticity and profit margins."
        )

    return {
        "ml_recommended_price": ml_estimated_price,
        "recommended_price": rec_price,
        "competitive_status": status_label,
        "reason": reason
    }


# ==========================================================
# REST API Endpoints
# ==========================================================

@router.get("/analysis", response_model=Dict[str, Any])
def get_competitor_analysis_list(
    product_id: Optional[str] = Query(None),
    competitor: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("product_name"),
    sort_order: str = Query("asc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get aggregated product-level competitor analysis records with filtering, sorting, and pagination.
    """
    query = db.query(CompetitorPrice)

    if product_id:
        query = query.filter(CompetitorPrice.product_id == product_id)
    if competitor and competitor != "All":
        query = query.filter(CompetitorPrice.competitor_name == competitor)
    if category and category != "All":
        query = query.filter(CompetitorPrice.category == category)
    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            (CompetitorPrice.product_name.ilike(s_term)) |
            (CompetitorPrice.product_id.ilike(s_term)) |
            (CompetitorPrice.brand.ilike(s_term))
        )

    records = query.all()
    if not records:
        return {"total": 0, "page": page, "limit": limit, "pages": 0, "data": []}

    # Group records by product_id
    products_map: Dict[str, List[CompetitorPrice]] = {}
    for r in records:
        products_map.setdefault(r.product_id, []).append(r)

    analysis_items: List[Dict[str, Any]] = []

    for pid, p_recs in products_map.items():
        first = p_recs[0]
        our_price = first.our_price

        # Latest snapshot per competitor
        latest_comp: Dict[str, CompetitorPrice] = {}
        for rec in sorted(p_recs, key=lambda x: x.captured_at or "", reverse=True):
            if rec.competitor_name not in latest_comp:
                latest_comp[rec.competitor_name] = rec

        prices_list = [r.competitor_price for r in latest_comp.values()]
        if not prices_list:
            continue

        avg_price = round(sum(prices_list) / len(prices_list), 2)
        min_price = round(min(prices_list), 2)
        max_price = round(max(prices_list), 2)

        diff = round(our_price - avg_price, 2)
        pct_diff = round(((our_price - avg_price) / avg_price) * 100, 2) if avg_price > 0 else 0.0

        comp_status = calculate_competitive_status(pct_diff)
        rec_info = generate_explainable_recommendation(our_price, avg_price, min_price, max_price)

        if status_filter and status_filter.upper() != "ALL" and comp_status != status_filter.upper():
            continue

        analysis_items.append({
            "product_id": pid,
            "product_name": first.product_name,
            "category": first.category,
            "brand": first.brand,
            "our_price": our_price,
            "lowest_competitor_price": min_price,
            "highest_competitor_price": max_price,
            "average_competitor_price": avg_price,
            "price_difference": diff,
            "price_difference_percentage": pct_diff,
            "recommended_price": rec_info["recommended_price"],
            "competitive_status": comp_status,
            "competitor_count": len(prices_list),
            "analyzed_at": datetime.utcnow()
        })

    # Sorting
    reverse = (sort_order.lower() == "desc")
    if sort_by in ["our_price", "average_competitor_price", "price_difference", "price_difference_percentage", "recommended_price"]:
        analysis_items.sort(key=lambda x: x[sort_by], reverse=reverse)
    elif sort_by == "product_name":
        analysis_items.sort(key=lambda x: x["product_name"].lower(), reverse=reverse)

    total = len(analysis_items)
    offset = (page - 1) * limit
    paginated = analysis_items[offset : offset + limit]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "data": paginated
    }


@router.get("/product/{product_id}", response_model=ProductDetailComparison)
def get_product_competitor_comparison(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed competitor pricing analysis for a single product.
    """
    records = db.query(CompetitorPrice).filter(CompetitorPrice.product_id == product_id).all()
    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{product_id}' not found in competitor price database."
        )

    first = records[0]
    our_price = first.our_price

    # Deduplicate competitors taking latest captured price
    comp_latest: Dict[str, CompetitorPrice] = {}
    for r in sorted(records, key=lambda x: x.captured_at or "", reverse=True):
        if r.competitor_name not in comp_latest:
            comp_latest[r.competitor_name] = r

    competitor_items: List[CompetitorItem] = []
    prices_list = []

    for cname, r in comp_latest.items():
        prices_list.append(r.competitor_price)
        diff = round(our_price - r.competitor_price, 2)
        pct_diff = round(((our_price - r.competitor_price) / r.competitor_price) * 100, 2) if r.competitor_price > 0 else 0.0

        competitor_items.append(CompetitorItem(
            name=cname,
            price=r.competitor_price,
            difference=diff,
            difference_percentage=pct_diff,
            rating=r.competitor_rating,
            stock=r.competitor_stock,
            marketplace=r.marketplace,
            source=r.source,
            currency=r.currency,
            captured_at=r.captured_at
        ))

    avg_price = round(sum(prices_list) / len(prices_list), 2)
    min_price = round(min(prices_list), 2)
    max_price = round(max(prices_list), 2)

    diff = round(our_price - avg_price, 2)
    pct_diff = round(((our_price - avg_price) / avg_price) * 100, 2) if avg_price > 0 else 0.0

    comp_status = calculate_competitive_status(pct_diff)
    rec_info = generate_explainable_recommendation(our_price, avg_price, min_price, max_price)

    pos_indicator = "Below Market" if pct_diff < -2.0 else ("At Market" if pct_diff <= 3.0 else "Above Market")

    return ProductDetailComparison(
        product_id=product_id,
        product_name=first.product_name,
        category=first.category,
        brand=first.brand,
        our_price=our_price,
        average_competitor_price=avg_price,
        lowest_competitor_price=min_price,
        highest_competitor_price=max_price,
        price_difference=diff,
        price_difference_percentage=pct_diff,
        price_position=pos_indicator,
        position_indicator=pos_indicator,
        competitive_status=comp_status,
        recommended_price=rec_info["recommended_price"],
        recommendation_reason=rec_info["reason"],
        competitors=competitor_items
    )


@router.get("/recommendation/{product_id}", response_model=CompetitorRecommendationResponse)
def get_price_recommendation(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get explainable price recommendation combining competitor market intelligence and ML pricing model bounds.
    """
    records = db.query(CompetitorPrice).filter(CompetitorPrice.product_id == product_id).all()
    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{product_id}' not found for recommendation."
        )

    our_price = records[0].our_price
    prices_list = [r.competitor_price for r in records]

    avg_price = round(sum(prices_list) / len(prices_list), 2)
    min_price = round(min(prices_list), 2)
    max_price = round(max(prices_list), 2)

    rec_info = generate_explainable_recommendation(our_price, avg_price, min_price, max_price)

    return CompetitorRecommendationResponse(
        product_id=product_id,
        our_price=our_price,
        ml_recommended_price=rec_info["ml_recommended_price"],
        average_competitor_price=avg_price,
        lowest_competitor_price=min_price,
        highest_competitor_price=max_price,
        recommended_price=rec_info["recommended_price"],
        competitive_status=rec_info["competitive_status"],
        reason=rec_info["reason"]
    )


@router.get("/summary", response_model=CompetitorSummaryResponse)
def get_competitor_summary_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get executive summary statistics and KPI metrics for competitor price analysis dashboard.
    """
    records = db.query(CompetitorPrice).all()
    if not records:
        return CompetitorSummaryResponse(
            total_products_analyzed=0,
            competitive_products=0,
            overpriced_products=0,
            underpriced_products=0,
            average_price_gap=0.0,
            average_percentage_gap=0.0,
            potential_pricing_opportunities=0,
            most_competitive_marketplace="N/A",
            status_distribution={"UNDERPRICED": 0.0, "COMPETITIVE": 0.0, "OVERPRICED": 0.0},
            insights=["No competitor pricing records in database."],
            categories=[],
            competitors=[],
            marketplaces=[]
        )

    categories = sorted(list({r.category for r in records}))
    competitors = sorted(list({r.competitor_name for r in records}))
    marketplaces = sorted(list({r.marketplace for r in records}))

    products_map: Dict[str, List[CompetitorPrice]] = {}
    for r in records:
        products_map.setdefault(r.product_id, []).append(r)

    total_products = len(products_map)
    status_counts = {"UNDERPRICED": 0, "COMPETITIVE": 0, "OVERPRICED": 0}
    price_gaps = []
    pct_gaps = []
    opportunities_count = 0

    mkt_prices: Dict[str, List[float]] = {}
    lowest_tally: Dict[str, int] = {}

    for pid, p_recs in products_map.items():
        our_price = p_recs[0].our_price
        
        # Latest prices per competitor
        latest_comp: Dict[str, CompetitorPrice] = {}
        for r in sorted(p_recs, key=lambda x: x.captured_at or "", reverse=True):
            if r.competitor_name not in latest_comp:
                latest_comp[r.competitor_name] = r

        c_prices = [r.competitor_price for r in latest_comp.values()]
        for r in latest_comp.values():
            mkt_prices.setdefault(r.marketplace, []).append(r.competitor_price)

        if c_prices:
            avg_p = sum(c_prices) / len(c_prices)
            min_p = min(c_prices)

            for cname, r in latest_comp.items():
                if abs(r.competitor_price - min_p) < 0.01:
                    lowest_tally[cname] = lowest_tally.get(cname, 0) + 1

            gap = our_price - avg_p
            pct_g = ((our_price - avg_p) / avg_p) * 100 if avg_p > 0 else 0.0

            price_gaps.append(gap)
            pct_gaps.append(pct_g)

            st = calculate_competitive_status(pct_g)
            status_counts[st] += 1

            if st in ["OVERPRICED", "UNDERPRICED"]:
                opportunities_count += 1

    avg_gap = round(sum(price_gaps) / len(price_gaps), 2) if price_gaps else 0.0
    avg_pct_gap = round(sum(pct_gaps) / len(pct_gaps), 2) if pct_gaps else 0.0

    status_dist = {}
    for st, count in status_counts.items():
        status_dist[st] = round((count / total_products) * 100, 1) if total_products > 0 else 0.0

    mkt_avg = {mkt: (sum(plist) / len(plist)) for mkt, plist in mkt_prices.items() if plist}
    most_comp_mkt = min(mkt_avg.items(), key=lambda x: x[1])[0] if mkt_avg else "Amazon India"

    top_lowest_comp = max(lowest_tally.items(), key=lambda x: x[1])[0] if lowest_tally else "Amazon"
    top_lowest_count = lowest_tally.get(top_lowest_comp, 0)

    insights = [
        f"{status_counts['COMPETITIVE']} products ({status_dist['COMPETITIVE']}%) are competitively positioned within market pricing bounds.",
        f"{status_counts['OVERPRICED']} products are priced >10% above competitor average and may lose conversion.",
        f"{status_counts['UNDERPRICED']} products are underpriced by >10%, highlighting margin expansion opportunities.",
        f"{top_lowest_comp} offers the lowest price across {top_lowest_count} analyzed products.",
        f"{most_comp_mkt} is currently the overall lowest-priced marketplace platform."
    ]

    return CompetitorSummaryResponse(
        total_products_analyzed=total_products,
        competitive_products=status_counts["COMPETITIVE"],
        overpriced_products=status_counts["OVERPRICED"],
        underpriced_products=status_counts["UNDERPRICED"],
        average_price_gap=avg_gap,
        average_percentage_gap=avg_pct_gap,
        potential_pricing_opportunities=opportunities_count,
        most_competitive_marketplace=most_comp_mkt,
        status_distribution=status_dist,
        insights=insights,
        categories=categories,
        competitors=competitors,
        marketplaces=marketplaces
    )


# ==========================================================
# CRUD Operations (Admin Authorized)
# ==========================================================

@router.post("/prices", response_model=CompetitorPriceResponse, status_code=status.HTTP_201_CREATED)
def create_competitor_price(
    payload: CompetitorPriceCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Add a new competitor price record (Admin authorized).
    """
    if payload.competitor_price <= 0:
        raise HTTPException(status_code=400, detail="Competitor price must be greater than 0.")
    
    our_price = payload.our_price or payload.competitor_price
    diff = round(our_price - payload.competitor_price, 2)
    pct_diff = round(((our_price - payload.competitor_price) / payload.competitor_price) * 100, 2)

    captured = payload.captured_at or datetime.utcnow().strftime("%Y-%m-%d")

    rec = CompetitorPrice(
        product_id=payload.product_id,
        product_name=payload.competitor_product_name or f"Product #{payload.product_id}",
        category=payload.category or "Electronics",
        brand=payload.brand or "Generic",
        our_price=our_price,
        competitor_name=payload.competitor_name,
        competitor_product_name=payload.competitor_product_name,
        competitor_price=payload.competitor_price,
        price_difference=diff,
        price_difference_percentage=pct_diff,
        competitor_rating=payload.competitor_rating or 4.5,
        competitor_stock=payload.competitor_stock or 50,
        marketplace=payload.marketplace or f"{payload.competitor_name} Market",
        currency=payload.currency or "INR",
        source=payload.source or "Manual",
        captured_at=captured,
        recorded_at=captured,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(rec)
    
    log_entry = ActivityLog(
        user_id=admin_user.id,
        action=f"Added competitor price: {payload.competitor_name} - ₹{payload.competitor_price} (Product: {payload.product_id})"
    )
    db.add(log_entry)
    db.commit()
    db.refresh(rec)

    return rec


@router.put("/prices/{id}", response_model=CompetitorPriceResponse)
def update_competitor_price(
    id: int,
    payload: CompetitorPriceUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Update an existing competitor price record (Admin authorized).
    """
    rec = db.query(CompetitorPrice).filter(CompetitorPrice.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Competitor price record #{id} not found.")

    if payload.competitor_price is not None:
        if payload.competitor_price <= 0:
            raise HTTPException(status_code=400, detail="Price must be greater than 0.")
        rec.competitor_price = payload.competitor_price

    if payload.our_price is not None:
        rec.our_price = payload.our_price
    if payload.competitor_name is not None:
        rec.competitor_name = payload.competitor_name
    if payload.competitor_product_name is not None:
        rec.competitor_product_name = payload.competitor_product_name
    if payload.currency is not None:
        rec.currency = payload.currency
    if payload.source is not None:
        rec.source = payload.source
    if payload.captured_at is not None:
        rec.captured_at = payload.captured_at
        rec.recorded_at = payload.captured_at
    if payload.marketplace is not None:
        rec.marketplace = payload.marketplace

    # Recalculate diffs
    rec.price_difference = round(rec.our_price - rec.competitor_price, 2)
    rec.price_difference_percentage = round(((rec.our_price - rec.competitor_price) / rec.competitor_price) * 100, 2) if rec.competitor_price > 0 else 0.0
    rec.updated_at = datetime.utcnow()

    log_entry = ActivityLog(
        user_id=admin_user.id,
        action=f"Updated competitor price #{id}: {rec.competitor_name} ₹{rec.competitor_price}"
    )
    db.add(log_entry)
    db.commit()
    db.refresh(rec)

    return rec


@router.delete("/prices/{id}", response_model=Dict[str, Any])
def delete_competitor_price(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Delete a competitor price record (Admin authorized).
    """
    rec = db.query(CompetitorPrice).filter(CompetitorPrice.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Competitor price record #{id} not found.")

    db.delete(rec)
    log_entry = ActivityLog(
        user_id=admin_user.id,
        action=f"Deleted competitor price #{id}"
    )
    db.add(log_entry)
    db.commit()

    return {"status": "SUCCESS", "message": f"Competitor price record #{id} deleted successfully."}


# ==========================================================
# CSV Batch Import API (Section 14)
# ==========================================================

@router.post("/import-csv", response_model=CSVImportResponse)
def import_competitor_prices_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Batch import competitor price records from CSV with row-level validation.
    CSV Columns: product_id, competitor_name, competitor_product_name, competitor_price, currency, source, captured_at
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only CSV files are supported.")

    try:
        contents = file.file.read()
        import io
        df = pd.read_csv(io.BytesIO(contents), comment="#")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    successful_rows = 0
    failed_rows = 0
    validation_errors = []

    required_fields = ["product_id", "competitor_name", "competitor_price"]

    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-indexed header offset

        # Validate required fields
        missing = [f for f in required_fields if pd.isna(row.get(f))]
        if missing:
            failed_rows += 1
            validation_errors.append(f"Row {row_num}: Missing required field(s): {', '.join(missing)}")
            continue

        product_id = str(row["product_id"]).strip()
        competitor_name = str(row["competitor_name"]).strip()

        try:
            competitor_price = float(row["competitor_price"])
        except (ValueError, TypeError):
            failed_rows += 1
            validation_errors.append(f"Row {row_num}: Invalid competitor_price '{row.get('competitor_price')}'")
            continue

        if competitor_price <= 0:
            failed_rows += 1
            validation_errors.append(f"Row {row_num}: Price must be greater than 0")
            continue

        comp_product_name = str(row.get("competitor_product_name", f"Product #{product_id}")).strip()
        currency = str(row.get("currency", "INR")).strip()
        source = str(row.get("source", "Manual")).strip()
        captured_at = str(row.get("captured_at", datetime.utcnow().strftime("%Y-%m-%d"))).strip()

        our_price = float(row.get("our_price", competitor_price))
        diff = round(our_price - competitor_price, 2)
        pct_diff = round(((our_price - competitor_price) / competitor_price) * 100, 2) if competitor_price > 0 else 0.0

        rec = CompetitorPrice(
            product_id=product_id,
            product_name=comp_product_name,
            category=str(row.get("category", "Electronics")),
            brand=str(row.get("brand", "Generic")),
            our_price=our_price,
            competitor_name=competitor_name,
            competitor_product_name=comp_product_name,
            competitor_price=competitor_price,
            price_difference=diff,
            price_difference_percentage=pct_diff,
            competitor_rating=4.5,
            competitor_stock=50,
            marketplace=f"{competitor_name} Market",
            currency=currency,
            source=source,
            captured_at=captured_at,
            recorded_at=captured_at,
            created_at=datetime.utcnow()
        )
        db.add(rec)
        successful_rows += 1

    log_entry = ActivityLog(
        user_id=admin_user.id,
        action=f"CSV Import: {successful_rows} competitor prices inserted, {failed_rows} failed"
    )
    db.add(log_entry)
    db.commit()

    return CSVImportResponse(
        successful_rows=successful_rows,
        failed_rows=failed_rows,
        validation_errors=validation_errors[:20], # Return top 20 error messages
        status="SUCCESS" if failed_rows == 0 else "COMPLETED_WITH_ERRORS"
    )


# Alias legacy /upload endpoint to /import-csv for backward compatibility
@router.post("/upload", response_model=CSVImportResponse)
def upload_csv_alias(file: UploadFile = File(...), db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    return import_competitor_prices_csv(file=file, db=db, admin_user=admin_user)


@router.post("/refresh", response_model=Dict[str, Any])
def refresh_data(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    res = seed_competitor_dataset(csv_file_path=CSV_PATH, verbose=False)
    return {"status": "SUCCESS", "message": "Competitor pricing dataset re-seeded successfully.", "details": res}


@router.delete("/reset", response_model=Dict[str, Any])
def reset_data(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    count = db.query(CompetitorPrice).delete()
    db.commit()
    return {"status": "SUCCESS", "message": f"Deleted {count} competitor price records."}
