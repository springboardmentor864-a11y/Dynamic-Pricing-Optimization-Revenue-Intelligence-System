import io
import uuid
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
from backend.models.pricing import PredictInput, PricePredictionResponse, ProductDetailsResponse
from backend.services.ml_service import run_pricing_prediction
from backend.services.data_service import search_products, get_product_details
from backend.utils.report_generator import generate_pdf_report, generate_csv_report
from backend.utils.category_mapping import resolve_to_portuguese
from backend.utils.logger import logger

router = APIRouter(prefix="/api")

@router.get("/products/search", response_model=List[ProductDetailsResponse])
def api_search_products(
    category: str = Query("", description="English or Portuguese category name"),
    query: str = Query("", description="Search characters prefix")
):
    """Searches and suggests products dynamically from Olist matching the category constraints."""
    try:
        results = search_products(category_name=category, query=query)
        return results
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Search failed due to an internal server error.")

@router.get("/products/detail", response_model=ProductDetailsResponse)
def api_get_product_detail(product_id: str = Query(..., description="Unique product hash identifier")):
    """Fetches Olist historical details and auto-fill feature values for a selected product ID."""
    try:
        details = get_product_details(product_id=product_id)
        return details
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=f"Product with ID '{product_id}' not found.")
    except Exception as e:
        logger.error(f"Failed to load product details: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to load product details due to an internal server error.")

@router.post("/predict", response_model=PricePredictionResponse)
def api_predict_price(payload: PredictInput):
    """Predicts optimal retail price using the selected model(s) and simulator inputs."""
    try:
        input_data = {
            "product_category_name": resolve_to_portuguese(payload.category),
            "freight_value": float(payload.freight),
            "product_weight_g": float(payload.weight),
            "product_length_cm": float(payload.length),
            "product_height_cm": float(payload.height),
            "product_width_cm": float(payload.width),
            "product_photos_qty": int(payload.photos),
            "product_name_length": int(payload.name_length),
            "product_description_length": int(payload.description_length)
        }
        
        result = run_pricing_prediction(
            input_data=input_data,
            mode=payload.mode,
            selected_model_name=payload.selected_model
        )
        
        # Calculate comparison baseline
        from backend.services.ml_service import load_preprocessor_state
        state = load_preprocessor_state()
        cat_stats = state.get("cat_stats", {})
        portuguese_cat = resolve_to_portuguese(payload.category)
        
        dataset_avg = 52.30 # Default global baseline fallback
        if portuguese_cat in cat_stats:
            dataset_avg = cat_stats[portuguese_cat]["cat_price_mean"]
        elif state.get("global_stats"):
            dataset_avg = state["global_stats"]["cat_price_mean"]
            
        # If product_id is provided, override with actual product average
        if payload.product_id:
            try:
                p_details = get_product_details(payload.product_id)
                dataset_avg = p_details["historical_average_price"]
            except Exception:
                pass
                
        # Populate simulator fields
        result["dataset_average"] = round(dataset_avg, 2)
        result["difference_value"] = round(result["recommended_price"] - dataset_avg, 2)
        result["quality_status"] = "High Confidence" if result["r2"] > 0.80 else "Standard Confidence"

        # Store prediction in database transactionally
        db_session = None
        try:
            from models.demand_forecasting import forecast_category_demand
            from backend.utils.db import SessionLocal
            from backend.models.sql_models import Product, PredictionHistory, AuditLog, Recommendation, DemandForecast, Notification
            from datetime import datetime
            import json
            
            db_session = SessionLocal()
            
            # Generate Request ID for trace/audit
            request_id = str(uuid.uuid4())
            prediction_version = "1.0.0"
            
            product_id = payload.product_id or "sim-id"
            product_in_db = db_session.query(Product).filter(Product.product_id == product_id).first()
            
            # 1. Determine actual_price & previous orders volume
            if product_in_db:
                actual_price = product_in_db.actual_price or product_in_db.current_price
                previous_orders = 100
                try:
                    # Load Olist history details if available
                    p_details = get_product_details(product_id)
                    previous_orders = p_details.get("total_orders", 100)
                except Exception:
                    pass
            else:
                actual_price = dataset_avg
                previous_orders = 100
                
            # 2. Run demand prediction
            predicted_demand = 100
            trend = "Stable"
            demand_level = "Medium"
            try:
                demand_res = forecast_category_demand(
                    category=resolve_to_portuguese(payload.category),
                    month=datetime.now().month,
                    previous_orders=previous_orders,
                    price=float(result["recommended_price"])
                )
                predicted_demand = demand_res["predicted_demand"]
                trend = demand_res["trend"]
                if trend == "Increasing":
                    demand_level = "High"
                elif trend == "Decreasing":
                    demand_level = "Low"
                else:
                    demand_level = "Medium"
            except Exception as de:
                logger.warning(f"Could not run ML demand model: {str(de)}")
                
            # 3. Generate LLM recommendation explanation
            price_diff = float(result["recommended_price"]) - actual_price
            freight_cost_str = "high" if payload.freight > 25 else "moderate" if payload.freight > 12 else "low"
            
            if price_diff > 1.0:
                if demand_level == "High":
                    llm_reason = f"Price increased because demand is high while freight cost is {freight_cost_str}. Current market conditions indicate customers are likely to accept this price."
                else:
                    llm_reason = f"Price increased because demand is stable while freight cost is {freight_cost_str}. Current market conditions indicate customers are likely to accept this price."
            elif price_diff < -1.0:
                if demand_level == "Low":
                    llm_reason = "Price reduced because market demand is declining and competitor pricing is lower."
                else:
                    llm_reason = f"Price reduced because market demand is moderate and competitor pricing is lower."
            else:
                llm_reason = "Maintain current pricing because demand and logistics costs are stable."
                
            # 4. Save/Update product table
            prod_name = payload.product_name or (f"Product {product_id[:8]}" if product_id != "sim-id" else "Simulated Item")
            if not product_in_db:
                # Insert simulated/new product
                product_in_db = Product(
                    product_id=product_id,
                    name=prod_name,
                    product_name=prod_name,
                    category=payload.category,
                    current_price=actual_price,
                    actual_price=actual_price,
                    cost_price=float(result["recommended_price"]),
                    predicted_price=float(result["recommended_price"]),
                    stock=100,
                    weight=payload.weight,
                    product_weight=payload.weight,
                    freight_value=payload.freight,
                    delivery_days=15.0,
                    demand_level=demand_level
                )
                db_session.add(product_in_db)
                db_session.flush() # flush to generate serialized internal id
            else:
                # Update existing product predicted price and demand with new values
                product_in_db.name = prod_name
                product_in_db.product_name = prod_name
                product_in_db.category = payload.category
                product_in_db.current_price = actual_price
                product_in_db.actual_price = actual_price
                product_in_db.cost_price = float(result["recommended_price"])
                product_in_db.predicted_price = float(result["recommended_price"])
                product_in_db.weight = payload.weight
                product_in_db.product_weight = payload.weight
                product_in_db.freight_value = payload.freight
                product_in_db.demand_level = demand_level
                db_session.flush()

            # Resolve user_id from user_email
            user_email = payload.user_email or "guest@pricepilot.ai"
            try:
                user_res = db_session.execute(
                    "SELECT id FROM users WHERE email = :email", 
                    {"email": user_email}
                ).fetchone()
                user_id = user_res[0] if user_res else "usr-guest-002"
            except Exception:
                user_id = "usr-guest-002"

            # 5. Insert PredictionHistory
            feat_json = json.dumps(input_data)
            now_dt = datetime.now()
            
            history_record = PredictionHistory(
                product_id=product_in_db.id,
                legacy_product_id=product_id,
                model_name=result["champion_model"],
                model_used=result["champion_model"],
                model_version=prediction_version,
                predicted_price=float(result["recommended_price"]),
                confidence=float(result["confidence"]),
                recommended_price=float(result["recommended_price"]),
                reason=llm_reason,
                llm_reason=llm_reason,
                user_id=user_id,
                user_email=user_email,
                prediction_timestamp=now_dt,
                created_date=now_dt,
                product_name=prod_name,
                category=payload.category,
                actual_price=actual_price,
                features=feat_json,
                demand=str(predicted_demand),
                request_id=request_id,
                prediction_version=prediction_version
            )
            db_session.add(history_record)
            
            # 6. Insert AuditLog
            audit_record = AuditLog(
                product_id=product_in_db.id,
                legacy_product_id=product_id,
                product_name=prod_name,
                predicted_price=float(result["recommended_price"]),
                model_used=result["champion_model"],
                confidence=float(result["confidence"]),
                llm_output=llm_reason,
                prediction_time=now_dt,
                operator=user_email,
                request_id=request_id,
                prediction_version=prediction_version
            )
            db_session.add(audit_record)
            
            # 7. Insert Recommendation
            recommendation_record = Recommendation(
                product_id=product_in_db.id,
                legacy_product_id=product_id,
                current_price=actual_price,
                recommended_price=float(result["recommended_price"]),
                predicted_price=float(result["recommended_price"]),
                forecasted_demand=float(predicted_demand),
                competitor_price=float(result["recommended_price"]) * 0.95,
                reason=llm_reason,
                recommendation_text=llm_reason,
                generated_at=now_dt,
                created_at=now_dt
            )
            db_session.add(recommendation_record)
            
            # 8. Insert DemandForecast
            forecast_record = DemandForecast(
                product_id=product_in_db.id,
                forecast_date=now_dt,
                predicted_demand=float(predicted_demand),
                lower_bound=float(predicted_demand) * 0.9,
                upper_bound=float(predicted_demand) * 1.1,
                confidence=float(result["confidence"]),
                model_version="1.0.0",
                created_at=now_dt
            )
            db_session.add(forecast_record)
            
            # 9. Insert Notification Alert
            notif = Notification(
                product_id=product_in_db.id,
                type="prediction",
                message=f"New prediction completed for {prod_name} in category '{payload.category}': ₹{result['recommended_price']:.2f} using {result['champion_model']}.",
                status="unread",
                timestamp=now_dt
            )
            db_session.add(notif)
            
            # Commit the entire transaction together
            db_session.commit()
            logger.info(f"Logged prediction transaction {request_id} for product {product_id} successfully.")
        except Exception as db_err:
            if db_session:
                db_session.rollback()
            logger.error(f"Failed to log prediction to database: {str(db_err)}")
            raise HTTPException(status_code=500, detail="Database write transaction failed. Please contact the administrator for assistance.")
        finally:
            if db_session:
                db_session.close()
                
        return result
    except HTTPException as he:
        raise he
    except FileNotFoundError as fnf:
        logger.error(f"Prediction missing model file error: {str(fnf)}", exc_info=True)
        raise HTTPException(status_code=400, detail="A required machine learning model file could not be found.")
    except Exception as e:
        logger.exception(f"PREDICTION FAILED | exception_type={type(e).__name__} | error={repr(e)}")
        raise HTTPException(status_code=500, detail="Prediction failed due to an internal execution error.")

@router.get("/download")
def api_download_report(
    category: str,
    weight: float,
    length: float,
    height: float,
    width: float,
    freight: float,
    photos: int,
    name_length: int,
    description_length: int,
    product_id: Optional[str] = None,
    product_name: Optional[str] = None,
    mode: str = "best",
    selected_model: str = "",
    format: str = Query("pdf", pattern="^(pdf|csv)$")
):
    """Generates and streams a downloadable PDF or CSV simulation summary report."""
    try:
        input_data = {
            "category": category,
            "weight": weight,
            "length": length,
            "height": height,
            "width": width,
            "freight": freight,
            "photos": photos,
            "name_length": name_length,
            "description_length": description_length,
            "product_id": product_id,
            "product_name": product_name or (f"Product {product_id[:8]}" if product_id else "Simulated Item"),
            "mode": mode,
            "selected_model": selected_model
        }
        
        # Get forecast values using chosen model/mode
        pred_dict = {
            "product_category_name": resolve_to_portuguese(category),
            "freight_value": freight,
            "product_weight_g": weight,
            "product_length_cm": length,
            "product_height_cm": height,
            "product_width_cm": width,
            "product_photos_qty": photos,
            "product_name_length": name_length,
            "product_description_length": description_length
        }
        prediction_result = run_pricing_prediction(
            pred_dict, 
            mode=mode, 
            selected_model_name=selected_model
        )
        
        # Add detailed stats into prediction_result for reporting
        from backend.services.ml_service import load_preprocessor_state
        state = load_preprocessor_state()
        cat_stats = state.get("cat_stats", {})
        portuguese_cat = resolve_to_portuguese(category)
        
        dataset_avg = 52.30
        if portuguese_cat in cat_stats:
            dataset_avg = cat_stats[portuguese_cat]["cat_price_mean"]
            
        if product_id:
            try:
                p_details = get_product_details(product_id)
                dataset_avg = p_details["historical_average_price"]
                prediction_result["historical_min_price"] = p_details["historical_min_price"]
                prediction_result["historical_max_price"] = p_details["historical_max_price"]
                prediction_result["total_orders"] = p_details["total_orders"]
                prediction_result["avg_delivery_days"] = p_details["avg_delivery_days"]
            except Exception:
                pass
                
        prediction_result["dataset_average"] = dataset_avg
        prediction_result["difference_value"] = prediction_result["recommended_price"] - dataset_avg
        
        if format == "pdf":
            pdf_buffer = generate_pdf_report(input_data, prediction_result)
            filename_cat = category.replace(" ", "_").lower()
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=pricepilot_report_{filename_cat}.pdf"}
            )
        else:
            csv_content = generate_csv_report(input_data, prediction_result)
            filename_cat = category.replace(" ", "_").lower()
            return StreamingResponse(
                io.StringIO(csv_content),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=pricepilot_report_{filename_cat}.csv"}
            )
    except Exception as e:
        logger.error(f"Failed to generate download report: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate download report due to an internal server error.")
