import os
import time
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from backend.utils.firebase import verify_firebase_token_soft
from backend.utils.logger import logger
from backend.services.ai_service import AIService

router = APIRouter(prefix="/api/ai", tags=["AI Copilot & Pricing Intelligence"])

# --- Request Models ---

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message author: 'user' or 'model'", example="user")
    content: str = Field(..., description="Text content of the message", example="Hello PricePilot")

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Query from the user to the copilot.", example="Which model is best between XGBoost and Random Forest?")
    history: List[ChatMessage] = Field(default=[], description="Previous conversation turns.")

class ExplainPriceRequest(BaseModel):
    current_price: float = Field(..., gt=0, description="The current price of the product.", example=50.00)
    recommended_price: Optional[float] = Field(None, gt=0, description="The recommended optimized price.", example=58.50)
    predicted_price: Optional[float] = Field(None, gt=0, description="Alias for recommended price.", example=58.50)
    confidence: float = Field(..., ge=0, le=100, description="Prediction confidence score percentage.", example=82.5)
    model_name: Optional[str] = Field(None, description="The ML model algorithm name.", example="XGBoost Regressor")
    model_used: Optional[str] = Field(None, description="Alias for model name.", example="XGBoost Regressor")
    predicted_demand: Optional[str] = Field(None, description="Dynamic demand expectation level.", example="High")
    demand: Optional[str] = Field(None, description="Alias for predicted demand.", example="High")
    category: Optional[str] = Field(None, description="English/Portuguese product category.", example="utilidades_domesticas")
    reason: Optional[str] = Field(None, description="Rationale detail context.")

class DashboardSummaryRequest(BaseModel):
    stats: Dict[str, Any] = Field(
        ...,
        description="Key-value metrics statistics dictionary collected from PricePilot KPIs.",
        example={
            "best_model": "Random Forest",
            "r2_score": 0.8122,
            "top_categories": [{"category": "utilidades_domesticas", "sales": 120}],
            "top_products": [{"product_name": "Product Alpha", "sales": 80}]
        }
    )

class BusinessInsightsRequest(BaseModel):
    analytics: Optional[Dict[str, Any]] = Field(None, description="Descriptive statistics and historical trends.")
    metrics: Optional[Dict[str, Any]] = Field(None, description="Algorithm benchmarks metrics.")
    products: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="List of catalog products details for inventory tracking.",
        example=[
            {"product_name": "Product Beta", "category": "beleza_saude", "stock": 5, "demand_level": "High"},
            {"product_name": "Product Gamma", "category": "informatica_acessorios", "stock": 90, "demand_level": "Low"}
        ]
    )

class ForecastSummaryRequest(BaseModel):
    forecast_data: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Time-series forecast data points array.",
        example=[
            {"date": "2026-08-01", "demand": 45, "lower_ci": 40, "upper_ci": 50},
            {"date": "2026-08-02", "demand": 48, "lower_ci": 42, "upper_ci": 54}
        ]
    )
    forecast_output: Optional[List[Dict[str, Any]]] = Field(None, description="Alternative forecast output points.")
    model_used: Optional[str] = Field(None, description="Algorithm model used for time-series forecasting.", example="ARIMA")
    growth_pct: Optional[float] = Field(None, description="Aggregated demand growth percentage.", example=5.4)

class ModelComparisonRequest(BaseModel):
    comparison: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Regression models training benchmarks metrics comparison table.",
        example=[
            {"model_name": "XGBoost", "R2 Score": 0.8228, "MAE": 15.48, "Prediction Time": 0.00016},
            {"model_name": "Random Forest", "R2 Score": 0.8122, "MAE": 16.12, "Prediction Time": 0.0012}
        ]
    )
    metrics: Optional[List[Dict[str, Any]]] = Field(None, description="Regression metrics comparison list.")

# --- Response Models ---

class ChatResponseData(BaseModel):
    reply: str = Field(..., description="Conversational reply message from AI.")
    response: str = Field(..., description="Raw text response.")

class ChatResponse(BaseModel):
    success: bool = Field(True, description="Success status flag.")
    data: ChatResponseData = Field(..., description="Reply payload data.")

class ExplainPriceResponseData(BaseModel):
    explanation: str = Field(..., description="Detailed dynamic retail pricing logic justification.")

class ExplainPriceResponse(BaseModel):
    success: bool = Field(True, description="Success status flag.")
    data: ExplainPriceResponseData = Field(..., description="Explanation payload data.")

class DashboardSummaryResponseData(BaseModel):
    summary: str = Field(..., description="Dashboard KPI summary synthesis.")

class DashboardSummaryResponse(BaseModel):
    success: bool = Field(True, description="Success status flag.")
    data: DashboardSummaryResponseData = Field(..., description="Summary payload data.")

class BusinessInsightsResponseData(BaseModel):
    insights: str = Field(..., description="Restocking recommendations and markdown strategies.")

class BusinessInsightsResponse(BaseModel):
    success: bool = Field(True, description="Success status flag.")
    data: BusinessInsightsResponseData = Field(..., description="Insights payload data.")

class ForecastSummaryResponseData(BaseModel):
    explanation: str = Field(..., description="Time-series demand forecast trends justification.")

class ForecastSummaryResponse(BaseModel):
    success: bool = Field(True, description="Success status flag.")
    data: ForecastSummaryResponseData = Field(..., description="Forecast explanation payload data.")

class ModelComparisonResponseData(BaseModel):
    analysis: str = Field(..., description="Machine learning algorithms metrics comparison results.")

class ModelComparisonResponse(BaseModel):
    success: bool = Field(True, description="Success status flag.")
    data: ModelComparisonResponseData = Field(..., description="Analysis payload data.")

class ErrorResponse(BaseModel):
    success: bool = Field(False, description="Failure status flag.")
    error: str = Field(..., description="User-friendly error message description.")


# --- API Endpoint Implementation ---

@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={
        200: {"model": ChatResponse, "description": "Successful AI Chat response."},
        400: {"model": ErrorResponse, "description": "Invalid payload inputs or configuration missing."},
        401: {"model": ErrorResponse, "description": "Unauthorized access token."},
        500: {"model": ErrorResponse, "description": "Internal AI assistant error."}
    },
    summary="Dynamic Conversational Agent",
    description="Handles general conversational questions regarding PricePilot price calculations, dynamic policies, and sales strategies."
)
def api_chat(payload: ChatRequest, user: dict = Depends(verify_firebase_token_soft)):
    start_time = time.perf_counter()
    email = user.get("email") or "guest@pricepilot.ai"
    logger.info(f"POST /api/ai/chat requested by: {email}")
    try:
        # Format message context with conversational history
        hist_context = ""
        if payload.history:
            turns = [f"{msg.role}: {msg.content}" for msg in payload.history]
            hist_context = "History Context:\n" + "\n".join(turns) + "\n\n"
        
        full_message = f"{hist_context}Query: {payload.message}"
        res = AIService().chat(full_message)
        
        if not res.get("success"):
            err_msg = res.get("error", "Unknown error")
            logger.warning(f"AIService.chat failed: {err_msg}. Triggering local fallback.")
            if "GOOGLE_API_KEY" in err_msg or "API key" in err_msg:
                # Fallback to local prompt generator for dev simulation
                from backend.services.ai_service import _generate_local_fallback
                reply = _generate_local_fallback(payload.message)
            else:
                raise HTTPException(status_code=500, detail="AI Assistant chat service encountered an execution error.")
        else:
            reply = res.get("response", "")

        execution_time = round((time.perf_counter() - start_time) * 1000, 2)
        logger.info(f"POST /api/ai/chat resolved in {execution_time}ms")
        
        return ChatResponse(
            success=True,
            data=ChatResponseData(reply=reply, response=reply)
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected exception in AI chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected system error occurred while processing chat query.")


@router.post(
    "/explain-price",
    response_model=ExplainPriceResponse,
    responses={
        200: {"model": ExplainPriceResponse, "description": "Successful pricing explanation generated."},
        400: {"model": ErrorResponse, "description": "Invalid payload inputs."},
        401: {"model": ErrorResponse, "description": "Unauthorized access token."},
        500: {"model": ErrorResponse, "description": "Internal server error."}
    },
    summary="Pricing Strategy Justification",
    description="Explains recommended retail price increases or decreases based on category logistics, elasticity, and confidence."
)
def api_explain_price(payload: ExplainPriceRequest, user: dict = Depends(verify_firebase_token_soft)):
    start_time = time.perf_counter()
    email = user.get("email") or "guest@pricepilot.ai"
    logger.info(f"POST /api/ai/explain-price requested by: {email}")
    try:
        rec_price = payload.recommended_price or payload.predicted_price
        if not rec_price:
            raise HTTPException(status_code=400, detail="Either recommended_price or predicted_price must be specified.")
            
        m_name = payload.model_name or payload.model_used or "Dynamic pricing algorithm"
        p_demand = payload.predicted_demand or payload.demand or "Medium"
        cat = payload.category or "General Category"
        reason = payload.reason or f"Dynamic dynamic model price optimization via {m_name}"

        res = AIService().explain_prediction(
            current_price=payload.current_price,
            recommended_price=rec_price,
            confidence=payload.confidence,
            model_name=m_name,
            predicted_demand=p_demand,
            reason=reason
        )

        if not res.get("success"):
            err_msg = res.get("error", "Unknown error")
            logger.warning(f"AIService.explain_prediction failed: {err_msg}. Triggering local fallback.")
            if "GOOGLE_API_KEY" in err_msg or "API key" in err_msg:
                from backend.services.ai_service import _generate_local_fallback
                explanation = _generate_local_fallback(f"predict: {cat} current: {payload.current_price} recommended: {rec_price}")
            else:
                raise HTTPException(status_code=500, detail="AI Pricing explanation service encountered an execution error.")
        else:
            explanation = res.get("response", "")

        execution_time = round((time.perf_counter() - start_time) * 1000, 2)
        logger.info(f"POST /api/ai/explain-price resolved in {execution_time}ms")

        return ExplainPriceResponse(
            success=True,
            data=ExplainPriceResponseData(explanation=explanation)
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected exception in explain-price: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected system error occurred while generating price explanation.")


@router.post(
    "/dashboard-summary",
    response_model=DashboardSummaryResponse,
    responses={
        200: {"model": DashboardSummaryResponse, "description": "Dashboard summary generated successfully."},
        401: {"model": ErrorResponse, "description": "Unauthorized access token."},
        500: {"model": ErrorResponse, "description": "Internal server error."}
    },
    summary="Dashboard Metrics Synthesis",
    description="Synthesizes high-level dashboard metric trends, alerting users to underperforming models or sales channels."
)
def api_dashboard_summary(payload: DashboardSummaryRequest, user: dict = Depends(verify_firebase_token_soft)):
    start_time = time.perf_counter()
    email = user.get("email") or "guest@pricepilot.ai"
    logger.info(f"POST /api/ai/dashboard-summary requested by: {email}")
    try:
        res = AIService().generate_dashboard_summary(stats=payload.stats)

        if not res.get("success"):
            err_msg = res.get("error", "Unknown error")
            logger.warning(f"AIService.generate_dashboard_summary failed: {err_msg}. Triggering local fallback.")
            if "GOOGLE_API_KEY" in err_msg or "API key" in err_msg:
                from backend.services.ai_service import _generate_local_fallback
                summary = _generate_local_fallback("dashboard stats summary")
            else:
                raise HTTPException(status_code=500, detail="AI Dashboard summary service encountered an execution error.")
        else:
            summary = res.get("response", "")

        execution_time = round((time.perf_counter() - start_time) * 1000, 2)
        logger.info(f"POST /api/ai/dashboard-summary resolved in {execution_time}ms")

        return DashboardSummaryResponse(
            success=True,
            data=DashboardSummaryResponseData(summary=summary)
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected exception in dashboard-summary: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected system error occurred while synthesizing dashboard metrics.")


@router.post(
    "/business-insights",
    response_model=BusinessInsightsResponse,
    responses={
        200: {"model": BusinessInsightsResponse, "description": "Retail insights generated successfully."},
        401: {"model": ErrorResponse, "description": "Unauthorized access token."},
        500: {"model": ErrorResponse, "description": "Internal server error."}
    },
    summary="Operational Recommendations Engine",
    description="Surfaces stocking warnings and markdown strategies using inventory analysis metrics."
)
def api_business_insights(payload: BusinessInsightsRequest, user: dict = Depends(verify_firebase_token_soft)):
    start_time = time.perf_counter()
    email = user.get("email") or "guest@pricepilot.ai"
    logger.info(f"POST /api/ai/business-insights requested by: {email}")
    try:
        analytics_val = payload.analytics or {"products": payload.products or []}
        metrics_val = payload.metrics or {}
        
        res = AIService().generate_business_insights(analytics=analytics_val, metrics=metrics_val)

        if not res.get("success"):
            err_msg = res.get("error", "Unknown error")
            logger.warning(f"AIService.generate_business_insights failed: {err_msg}. Triggering local fallback.")
            if "GOOGLE_API_KEY" in err_msg or "API key" in err_msg:
                from backend.services.ai_service import _generate_local_fallback
                insights = _generate_local_fallback("insights products restocking")
            else:
                raise HTTPException(status_code=500, detail="AI Business insights service encountered an execution error.")
        else:
            insights = res.get("response", "")

        execution_time = round((time.perf_counter() - start_time) * 1000, 2)
        logger.info(f"POST /api/ai/business-insights resolved in {execution_time}ms")

        return BusinessInsightsResponse(
            success=True,
            data=BusinessInsightsResponseData(insights=insights)
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected exception in business-insights: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected system error occurred while generating business insights.")


@router.post(
    "/forecast-summary",
    response_model=ForecastSummaryResponse,
    responses={
        200: {"model": ForecastSummaryResponse, "description": "Forecast explanation generated successfully."},
        401: {"model": ErrorResponse, "description": "Unauthorized access token."},
        500: {"model": ErrorResponse, "description": "Internal server error."}
    },
    summary="Seasonal Demand Analysis",
    description="Explains daily forecasted dynamic demand trends, seasonal patterns, and inventory risk parameters."
)
def api_forecast_summary(payload: ForecastSummaryRequest, user: dict = Depends(verify_firebase_token_soft)):
    start_time = time.perf_counter()
    email = user.get("email") or "guest@pricepilot.ai"
    logger.info(f"POST /api/ai/forecast-summary requested by: {email}")
    try:
        forecast_values = payload.forecast_data or payload.forecast_output or []
        res = AIService().explain_forecast(forecast_values=forecast_values)

        if not res.get("success"):
            err_msg = res.get("error", "Unknown error")
            logger.warning(f"AIService.explain_forecast failed: {err_msg}. Triggering local fallback.")
            if "GOOGLE_API_KEY" in err_msg or "API key" in err_msg:
                from backend.services.ai_service import _generate_local_fallback
                explanation = _generate_local_fallback("forecast 90 days report")
            else:
                raise HTTPException(status_code=500, detail="AI Forecast summary service encountered an execution error.")
        else:
            explanation = res.get("response", "")

        execution_time = round((time.perf_counter() - start_time) * 1000, 2)
        logger.info(f"POST /api/ai/forecast-summary resolved in {execution_time}ms")

        return ForecastSummaryResponse(
            success=True,
            data=ForecastSummaryResponseData(explanation=explanation)
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected exception in forecast-summary: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected system error occurred while explaining forecast metrics.")


@router.post(
    "/model-comparison",
    response_model=ModelComparisonResponse,
    responses={
        200: {"model": ModelComparisonResponse, "description": "Successful algorithm analysis."},
        401: {"model": ErrorResponse, "description": "Unauthorized access token."},
        500: {"model": ErrorResponse, "description": "Internal server error."}
    },
    summary="Algorithm Benchmarks Analysis",
    description="Compares R2, MAE, and inference latency statistics across dynamic machine learning models."
)
def api_model_comparison(payload: ModelComparisonRequest, user: dict = Depends(verify_firebase_token_soft)):
    start_time = time.perf_counter()
    email = user.get("email") or "guest@pricepilot.ai"
    logger.info(f"POST /api/ai/model-comparison requested by: {email}")
    try:
        metrics_list = payload.comparison or payload.metrics or []
        res = AIService().compare_models(metrics=metrics_list)

        if not res.get("success"):
            err_msg = res.get("error", "Unknown error")
            logger.warning(f"AIService.compare_models failed: {err_msg}. Triggering local fallback.")
            if "GOOGLE_API_KEY" in err_msg or "API key" in err_msg:
                from backend.services.ai_service import _generate_local_fallback
                analysis = _generate_local_fallback("comparison regression models metrics")
            else:
                raise HTTPException(status_code=500, detail="AI Model comparison service encountered an execution error.")
        else:
            analysis = res.get("response", "")

        execution_time = round((time.perf_counter() - start_time) * 1000, 2)
        logger.info(f"POST /api/ai/model-comparison resolved in {execution_time}ms")

        return ModelComparisonResponse(
            success=True,
            data=ModelComparisonResponseData(analysis=analysis)
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected exception in model-comparison: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected system error occurred while generating model comparison metrics.")
