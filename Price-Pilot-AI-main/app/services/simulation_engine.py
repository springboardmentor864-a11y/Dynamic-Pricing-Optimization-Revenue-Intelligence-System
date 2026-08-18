import uuid
import numpy as np
from app.models import Product, DemandForecast
from app.services.market_intelligence_engine import MarketIntelligenceEngine
from app.services.revenue_optimization_engine import RevenueOptimizationEngine

class SimulationEngine:

    @classmethod
    def simulate_product_scenario(cls, product_identifier, price_change_pct=0.0, competitor_price_change_pct=0.0, cost_change_pct=0.0, demand_multiplier=1.0):
        """
        Runs what-if scenario simulation for a specific product or SKU.
        """
        product = Product.query.filter_by(product_id=product_identifier).first()
        if not product and str(product_identifier).isdigit():
            product = Product.query.get(int(product_identifier))

        if not product:
            raise ValueError(f"Product not found: {product_identifier}")

        base_metrics = RevenueOptimizationEngine.calculate_product_revenue_metrics(product)

        base_price = base_metrics['current_price']
        base_cost = base_metrics['cost_price']
        base_demand = base_metrics['current_demand']
        base_revenue = base_metrics['current_revenue']
        base_profit = base_metrics['current_profit']
        base_breakeven = base_metrics['breakeven_price']

        # Apply simulation adjustments
        sim_price = round(base_price * (1.0 + price_change_pct / 100.0), 2)
        sim_cost = round(base_cost * (1.0 + cost_change_pct / 100.0), 2)

        # Competitor shift impact
        market_info = MarketIntelligenceEngine.analyze_product_market(product)
        base_median = market_info['median_market_price']
        sim_competitor_median = round(base_median * (1.0 + competitor_price_change_pct / 100.0), 2) if base_median else None

        # Calculate demand impact with constant elasticity + demand multiplier
        elasticity_q = RevenueOptimizationEngine.estimate_demand_at_price(base_price, base_demand, sim_price)
        
        # Adjust demand for competitor move
        if sim_competitor_median and sim_competitor_median > 0:
            rel_price_ratio = sim_price / sim_competitor_median
            if rel_price_ratio > 1.15:
                elasticity_q *= 0.88  # Loss of volume to cheaper competitors
            elif rel_price_ratio < 0.85:
                elasticity_q *= 1.12  # Gain volume from expensive competitors

        sim_demand = round(max(1.0, elasticity_q * demand_multiplier), 1)

        sim_revenue = round(sim_price * sim_demand, 2)
        sim_profit = round((sim_price - sim_cost) * sim_demand, 2)
        sim_margin_abs = round(sim_price - sim_cost, 2)
        sim_margin_pct = round((sim_margin_abs / sim_price * 100.0), 2) if sim_price > 0 else 0.0

        target_m = product.get_target_margin()
        sim_breakeven = round(sim_cost / (1.0 - target_m), 2) if target_m < 1.0 else sim_cost

        revenue_delta_abs = round(sim_revenue - base_revenue, 2)
        revenue_delta_pct = round((revenue_delta_abs / base_revenue * 100.0), 2) if base_revenue > 0 else 0.0

        profit_delta_abs = round(sim_profit - base_profit, 2)
        profit_delta_pct = round((profit_delta_abs / abs(base_profit) * 100.0), 2) if base_profit != 0 else 0.0

        demand_delta_abs = round(sim_demand - base_demand, 1)
        demand_delta_pct = round((demand_delta_abs / base_demand * 100.0), 2) if base_demand > 0 else 0.0

        # Sensitivity Analysis Grid (simulate -25% to +25% price variations)
        sensitivity_curve = []
        variation_range = np.linspace(-25.0, 25.0, 11)

        for var_pct in variation_range:
            p_var = round(base_price * (1.0 + var_pct / 100.0), 2)
            q_var = RevenueOptimizationEngine.estimate_demand_at_price(base_price, base_demand, p_var) * demand_multiplier
            rev_var = round(p_var * q_var, 2)
            prof_var = round((p_var - sim_cost) * q_var, 2)
            sensitivity_curve.append({
                'price_change_pct': round(float(var_pct), 1),
                'simulated_price': p_var,
                'projected_demand': round(float(q_var), 1),
                'projected_revenue': rev_var,
                'projected_profit': prof_var
            })

        simulation_id = f"SIM-{uuid.uuid4().hex[:8].upper()}"

        return {
            'simulation_id': simulation_id,
            'product_id': product.product_id,
            'parameters': {
                'price_change_pct': price_change_pct,
                'competitor_price_change_pct': competitor_price_change_pct,
                'cost_change_pct': cost_change_pct,
                'demand_multiplier': demand_multiplier
            },
            'baseline': {
                'price': base_price,
                'cost': base_cost,
                'demand': base_demand,
                'revenue': base_revenue,
                'profit': base_profit,
                'breakeven_price': base_breakeven
            },
            'simulation': {
                'price': sim_price,
                'cost': sim_cost,
                'demand': sim_demand,
                'revenue': sim_revenue,
                'profit': sim_profit,
                'margin_abs': sim_margin_abs,
                'margin_pct': sim_margin_pct,
                'breakeven_price': sim_breakeven
            },
            'impact': {
                'revenue_delta_abs': revenue_delta_abs,
                'revenue_delta_pct': revenue_delta_pct,
                'profit_delta_abs': profit_delta_abs,
                'profit_delta_pct': profit_delta_pct,
                'demand_delta_abs': demand_delta_abs,
                'demand_delta_pct': demand_delta_pct,
                'breakeven_shift_abs': round(sim_breakeven - base_breakeven, 2)
            },
            'sensitivity_analysis': sensitivity_curve
        }

    @classmethod
    def simulate_catalog_scenario(cls, price_change_pct=0.0, cost_change_pct=0.0, demand_multiplier=1.0):
        """
        Runs macro catalog-wide scenario simulation across all products.
        """
        products = Product.query.limit(20).all()
        simulations = []

        total_base_revenue = 0.0
        total_base_profit = 0.0
        total_sim_revenue = 0.0
        total_sim_profit = 0.0

        for p in products:
            sim = cls.simulate_product_scenario(
                product_identifier=p.product_id,
                price_change_pct=price_change_pct,
                cost_change_pct=cost_change_pct,
                demand_multiplier=demand_multiplier
            )
            simulations.append(sim)
            total_base_revenue += sim['baseline']['revenue']
            total_base_profit += sim['baseline']['profit']
            total_sim_revenue += sim['simulation']['revenue']
            total_sim_profit += sim['simulation']['profit']

        rev_impact_pct = round(((total_sim_revenue - total_base_revenue) / total_base_revenue * 100.0), 2) if total_base_revenue > 0 else 0.0
        profit_impact_pct = round(((total_sim_profit - total_base_profit) / abs(total_base_profit) * 100.0), 2) if total_base_profit != 0 else 0.0

        return {
            'summary': {
                'total_products_simulated': len(products),
                'total_baseline_revenue': round(total_base_revenue, 2),
                'total_baseline_profit': round(total_base_profit, 2),
                'total_simulated_revenue': round(total_sim_revenue, 2),
                'total_simulated_profit': round(total_sim_profit, 2),
                'revenue_impact_pct': rev_impact_pct,
                'profit_impact_pct': profit_impact_pct,
                'net_profit_lift_abs': round(total_sim_profit - total_base_profit, 2)
            },
            'simulations': simulations
        }
