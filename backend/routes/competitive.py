import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import random

from backend.utils.db import SessionLocal
from backend.models.sql_models import Product, User, CompetitorPrice, CompetitiveAnalysisHistory
from backend.services.ai_service import explain_competitive_pricing
from backend.utils.logger import logger

router = APIRouter(prefix="/api/competitive", tags=["Competitive Pricing Analysis"])

# Configurable thresholds
GAP_BELOW_MARKET = -3.0      # Less than -3% (Highly Competitive)
GAP_COMPETITIVE_MAX = 3.0    # Up to +3% (Competitive)
GAP_SLIGHTLY_ABOVE = 15.0    # Up to +15% (Premium)

class AnalyzePayload(BaseModel):
    product_id: str
    predicted_price: float
    user_email: Optional[str] = "guest@pricepilot.ai"
    generate_ai: Optional[bool] = False

@router.get("/product/{product_id}")
def get_product_competitors(product_id: str):
    """Fetches competitor prices for a product, generating demo/mock data if none exists."""
    db_session = SessionLocal()
    try:
        # Resolve integer ID of the product
        product = db_session.query(Product).filter(Product.product_id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")

        competitors = db_session.query(CompetitorPrice).filter(CompetitorPrice.product_id == product.id).all()

        # If empty, create DEMO data
        if not competitors:
            # Deterministic/stable offsets to prevent randomly shifting prices on refetch
            base_price = product.current_price or product.actual_price or 100.0
            
            demo_competitors = [
                {"name": "Competitor A", "factor": 0.98},
                {"name": "Competitor B", "factor": 1.01},
                {"name": "Competitor C", "factor": 0.995}
            ]

            for dc in demo_competitors:
                comp_price = round(base_price * dc["factor"], 2)
                record = CompetitorPrice(
                    product_id=product.id,
                    competitor_name=dc["name"],
                    competitor_price=comp_price,
                    recorded_at=datetime.datetime.utcnow(),
                    source="demo"
                )
                db_session.add(record)
            
            db_session.commit()
            competitors = db_session.query(CompetitorPrice).filter(CompetitorPrice.product_id == product.id).all()

        comp_list = []
        tot_price = 0.0
        for c in competitors:
            comp_list.append({
                "competitor_name": c.competitor_name,
                "competitor_price": c.competitor_price,
                "recorded_at": c.recorded_at.isoformat(),
                "source": c.source
            })
            tot_price += c.competitor_price

        avg_price = round(tot_price / len(competitors), 2) if competitors else 0.0

        return {
            "product_id": product_id,
            "our_current_price": product.current_price or product.actual_price or 100.0,
            "competitors": comp_list,
            "competitor_average": avg_price
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching competitor prices: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch competitor prices: {str(e)}")
    finally:
        db_session.close()


@router.get("/analysis/{product_id}")
def get_latest_analysis(product_id: str):
    """Retrieves the latest competitive analysis record for the product."""
    db_session = SessionLocal()
    try:
        product = db_session.query(Product).filter(Product.product_id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")

        latest = db_session.query(CompetitiveAnalysisHistory)\
            .filter(CompetitiveAnalysisHistory.product_id == product.id)\
            .order_by(CompetitiveAnalysisHistory.created_at.desc())\
            .first()

        if not latest:
            return {"status": "no_record", "message": "No previous competitive analysis found."}

        return {
            "status": "success",
            "our_price": latest.our_price,
            "competitor_average": latest.competitor_average,
            "price_gap": latest.price_gap,
            "competitive_position": latest.competitive_position,
            "recommended_price": latest.recommended_price,
            "ai_insight": latest.ai_insight,
            "created_at": latest.created_at.isoformat()
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching latest analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch analysis: {str(e)}")
    finally:
        db_session.close()


@router.post("/analyze")
def analyze_competitive_price(payload: AnalyzePayload):
    """Calculates competitive gap, executes business rules, queries Gemini, and logs to history."""
    db_session = SessionLocal()
    try:
        from backend.services.competitive_service import CompetitiveAnalysisService
        
        user_email = payload.user_email or "guest@pricepilot.ai"
        
        # Run service calculation
        analysis = CompetitiveAnalysisService.analyze_product_pricing(
            db_session=db_session,
            product_id=payload.product_id,
            category=payload.product_id, # resolved in service
            recommended_price=payload.predicted_price,
            user_email=user_email
        )
        
        # Get product and details for AI explanation if requested
        product = db_session.query(Product).filter(Product.product_id == payload.product_id).first()
        comp_avg = analysis["market_average"]
        gap = analysis["price_gap_percentage"]
        position = analysis["competitive_position"]
        demand = product.demand_level or "Medium"
        
        ai_insight = None
        if payload.generate_ai:
            try:
                comp_prices_list = [c["competitor_price"] for c in analysis["competitors"]]
                ai_insight = explain_competitive_pricing(
                    product_name=product.name or product.product_name,
                    category=product.category,
                    ml_price=payload.predicted_price,
                    current_price=product.current_price or product.actual_price or 100.0,
                    competitor_prices=comp_prices_list,
                    competitor_avg=comp_avg,
                    price_gap=gap,
                    position=position,
                    demand=demand
                )
            except Exception as ai_err:
                logger.error(f"Gemini AI prompt failed: {str(ai_err)}")
                ai_insight = "Competitive data analyzed. Gemini AI service is temporarily offline."
        else:
            # Fetch latest insight from history if available to avoid losing it
            latest_h = db_session.query(CompetitiveAnalysisHistory)\
                .filter(CompetitiveAnalysisHistory.product_id == product.id)\
                .order_by(CompetitiveAnalysisHistory.created_at.desc())\
                .first()
            if latest_h:
                ai_insight = latest_h.ai_insight
                
        # Update history record in DB with the generated ai_insight
        if ai_insight:
            latest_h = db_session.query(CompetitiveAnalysisHistory)\
                .filter(CompetitiveAnalysisHistory.product_id == product.id)\
                .order_by(CompetitiveAnalysisHistory.created_at.desc())\
                .first()
            if latest_h:
                latest_h.ai_insight = ai_insight
                db_session.commit()
                
        analysis["ai_insight"] = ai_insight
        
        return {
            "status": "success",
            **analysis
        }

    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error performing competitive analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        db_session.close()


@router.get("/history/{product_id}")
def get_analysis_history(product_id: str):
    """Retrieves full analysis history for the product."""
    db_session = SessionLocal()
    try:
        product = db_session.query(Product).filter(Product.product_id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")

        history = db_session.query(CompetitiveAnalysisHistory)\
            .filter(CompetitiveAnalysisHistory.product_id == product.id)\
            .order_by(CompetitiveAnalysisHistory.created_at.desc())\
            .all()

        history_list = []
        for h in history:
            history_list.append({
                "our_price": h.our_price,
                "competitor_average": h.competitor_average,
                "price_gap": h.price_gap,
                "competitive_position": h.competitive_position,
                "recommended_price": h.recommended_price,
                "ai_insight": h.ai_insight,
                "created_at": h.created_at.isoformat()
            })

        return history_list
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching analysis history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")
    finally:
        db_session.close()
