import json
from flask import Blueprint, request, jsonify
from app.services.ml_service import ml_service
from app.models import db, Prediction, AuditLog
from app.auth import jwt_required, role_required

pricing_bp = Blueprint('pricing_bp', __name__)

@pricing_bp.route('/predict-price', methods=['POST'])
@jwt_required
def predict_price():
    try:
        data = request.get_json() or {}
        
        # Payload validation
        if 'price' in data:
            try:
                price_val = float(data['price'])
                if price_val < 0:
                    return jsonify({'error': 'Price must be a positive number.'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Price must be a valid numeric value.'}), 400

        # Run ML Inference
        result = ml_service.predict_price(data)
        
        # Save Prediction log to DB
        user = getattr(request, 'current_user', None)
        pred_entry = Prediction(
            product_id=str(data.get('product_id', 'UNKNOWN')),
            input_features=json.dumps(data),
            predicted_price=result['predicted_price'],
            confidence_score=result['confidence_score'],
            model_name=result['model_used']
        )
        db.session.add(pred_entry)
        
        if user:
            audit = AuditLog(user_id=user.id, action='PREDICT_PRICE', endpoint='/api/pricing/predict-price', ip_address=request.remote_addr)
            db.session.add(audit)
            
        db.session.commit()
        return jsonify(result), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Prediction execution failed: {str(e)}'}), 500

@pricing_bp.route('/forecast-demand', methods=['POST'])
def forecast_demand():
    try:
        data = request.get_json() or {}
        product_id = str(data.get('product_id', 'PROD_DEFAULT_101')).strip()
        
        try:
            days = int(data.get('days', 30))
            if days < 1 or days > 365:
                return jsonify({'error': 'Forecast horizon must be between 1 and 365 days.'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Forecast horizon days must be a valid integer.'}), 400

        result = ml_service.forecast_demand(product_id, days)
        return jsonify(result), 200
    except ValueError as ve:
        return jsonify({'error': f'Demand forecast unavailable: {str(ve)}'}), 404
    except RuntimeError as re:
        return jsonify({'error': f'Demand forecast unavailable: {str(re)}'}), 503
    except Exception as e:
        return jsonify({'error': f'Demand forecast unavailable: {str(e)}'}), 500

@pricing_bp.route('/optimize-price', methods=['POST'])
@jwt_required
@role_required(['Admin', 'Pricing Manager'])
def optimize_price():
    try:
        data = request.get_json() or {}
        try:
            current_price = float(data.get('current_price', 100.0))
            cost = float(data.get('cost', 50.0))
            if current_price <= 0 or cost < 0:
                return jsonify({'error': 'Current price and cost must be positive numbers.'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Current price and cost must be valid numeric values.'}), 400

        category_name = str(data.get('category_name', data.get('category', 'bed_bath_table')))
        result = ml_service.optimize_price(current_price, cost, category_name)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': f'Price optimization failed: {str(e)}'}), 500
