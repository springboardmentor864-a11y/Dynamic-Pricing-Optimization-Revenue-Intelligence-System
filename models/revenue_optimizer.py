import os
import joblib
import numpy as np
from models.demand_forecasting import forecast_category_demand

MODELS_DIR = os.path.dirname(os.path.abspath(__file__))

def optimize_revenue(category: str, month: int, previous_orders: int, predicted_base_price: float) -> dict:
    """
    Varies pricing from -20% to +20% of the predicted base price to discover the 
    revenue-maximizing price using predicted demand elasticity.
    """
    # Current scenario
    current_demand_res = forecast_category_demand(category, month, previous_orders, predicted_base_price)
    current_demand = current_demand_res["predicted_demand"]
    current_revenue = predicted_base_price * current_demand

    # Grid search simulation (-20% to +20% in 1% steps)
    price_multipliers = np.linspace(0.8, 1.2, 41)
    
    best_multiplier = 1.0
    max_revenue = current_revenue
    best_demand = current_demand
    best_price = predicted_base_price

    for mult in price_multipliers:
        sim_price = float(predicted_base_price * mult)
        sim_demand_res = forecast_category_demand(category, month, previous_orders, sim_price)
        sim_demand = sim_demand_res["predicted_demand"]
        sim_revenue = sim_price * sim_demand

        if sim_revenue > max_revenue:
            max_revenue = sim_revenue
            best_multiplier = mult
            best_demand = sim_demand
            best_price = sim_price

    improvement_pct = 0.0
    if current_revenue > 0:
        improvement_pct = ((max_revenue - current_revenue) / current_revenue) * 100

    # Fallback to current if no improvement was found
    if best_multiplier == 1.0:
        best_price = predicted_base_price
        best_demand = current_demand
        max_revenue = current_revenue
        improvement_pct = 0.0

    return {
        "current_price": round(predicted_base_price, 2),
        "current_demand": int(current_demand),
        "current_revenue": round(current_revenue, 2),
        "optimized_price": round(best_price, 2),
        "optimized_demand": int(best_demand),
        "optimized_revenue": round(max_revenue, 2),
        "improvement_percentage": round(improvement_pct, 2)
    }

if __name__ == "__main__":
    # Test optimization
    res = optimize_revenue(
        category="cama_mesa_banho",
        month=7,
        previous_orders=200,
        predicted_base_price=80.0
    )
    print("Optimization Test Results:")
    print(res)
