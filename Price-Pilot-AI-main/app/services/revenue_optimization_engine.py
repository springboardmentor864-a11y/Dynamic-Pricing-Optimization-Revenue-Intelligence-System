import numpy as np
from app.models import db, Product, DemandForecast
from app.services.market_intelligence_engine import MarketIntelligenceEngine

class RevenueOptimizationEngine:

    DEFAULT_ELASTICITY = -1.8

    @classmethod
    def estimate_demand_at_price(cls, base_price, base_demand, target_price, elasticity=None):
        """
        Estimates projected demand using constant elasticity demand function:
        Q(P) = Q_0 * (P / P_0) ^ E
        """
        if base_price <= 0 or base_demand <= 0:
            return max(1.0, float(base_demand))
        
        e = elasticity if elasticity is not None else cls.DEFAULT_ELASTICITY
        price_ratio = target_price / base_price
        # Avoid division by zero or negative base
        if price_ratio <= 0:
            return 1.0
        
        projected_q = base_demand * (price_ratio ** e)
        return max(1.0, float(projected_q))

    @classmethod
    def calculate_product_revenue_metrics(cls, product):
        """
        Computes detailed financial and revenue optimization metrics for a single Product.
        """
        current_price = round(float(product.current_price), 2)
        cost_price = round(float(product.get_cost()), 2)
        min_price = round(float(product.get_minimum_price()), 2)
        max_price = round(float(product.get_maximum_price()), 2)
        target_margin = float(product.get_target_margin())

        # Break-even Price: cost / (1 - target_margin)
        breakeven_price = round(cost_price / (1.0 - target_margin), 2) if target_margin < 1.0 else cost_price

        # Fetch demand forecast or baseline
        forecast_rec = DemandForecast.query.filter_by(product_id=product.product_id).first()
        base_demand = forecast_rec.forecasted_demand if forecast_rec else 30.0

        # Market Intelligence & Competitor bounds
        market_info = MarketIntelligenceEngine.analyze_product_market(product)
        median_market = market_info['median_market_price']

        # Determine optimal price by grid searching profit function P(p) = (p - cost) * Q(p)
        # constrained by [min_price, max_price] and competitor market median
        test_prices = np.linspace(min_price, max_price, 50)
        best_price = current_price
        max_projected_profit = -float('inf')
        best_projected_demand = base_demand

        for p_test in test_prices:
            p_test = round(float(p_test), 2)
            if p_test <= cost_price:
                continue
            
            est_q = cls.estimate_demand_at_price(current_price, base_demand, p_test)
            profit = (p_test - cost_price) * est_q

            # Penalty if price deviates heavily from market median when competitors exist
            if median_market and median_market > 0:
                if p_test > (median_market * 1.20):
                    profit *= 0.80  # Demand penalty for excessive pricing above market
                elif p_test < (median_market * 0.85):
                    profit *= 0.90  # Margin penalty for underpricing

            if profit > max_projected_profit:
                max_projected_profit = profit
                best_price = p_test
                best_projected_demand = est_q

        optimal_price = round(best_price, 2)
        projected_demand = round(best_projected_demand, 1)

        current_revenue = round(current_price * base_demand, 2)
        current_profit = round((current_price - cost_price) * base_demand, 2)

        projected_revenue = round(optimal_price * projected_demand, 2)
        projected_profit = round((optimal_price - cost_price) * projected_demand, 2)

        gross_margin_abs = round(current_price - cost_price, 2)
        gross_margin_pct = round((gross_margin_abs / current_price * 100.0), 2) if current_price > 0 else 0.0
        net_margin_pct = round((projected_profit / projected_revenue * 100.0), 2) if projected_revenue > 0 else 0.0

        if current_profit != 0:
            expected_roi = round(((projected_profit - current_profit) / abs(current_profit)) * 100.0, 2)
        else:
            expected_roi = 0.0

        if current_revenue > 0:
            expected_growth = round(((projected_revenue - current_revenue) / current_revenue) * 100.0, 2)
        else:
            expected_growth = 0.0

        return {
            'product_db_id': product.id,
            'product_id': product.product_id,
            'category_name': product.category.category_name if product.category else 'Uncategorized',
            'cost_price': cost_price,
            'current_price': current_price,
            'minimum_price': min_price,
            'maximum_price': max_price,
            'breakeven_price': breakeven_price,
            'optimal_selling_price': optimal_price,
            'current_demand': base_demand,
            'projected_demand': projected_demand,
            'current_revenue': current_revenue,
            'current_profit': current_profit,
            'projected_revenue': projected_revenue,
            'projected_profit': projected_profit,
            'gross_margin': gross_margin_abs,
            'gross_margin_pct': gross_margin_pct,
            'net_margin_pct': net_margin_pct,
            'expected_roi': expected_roi,
            'expected_growth': expected_growth,
            'market_median_price': median_market
        }

    @classmethod
    def get_catalog_revenue_overview(cls, category_id=None):
        """
        Calculates catalog-wide revenue optimization metrics & financial summary.
        """
        query = Product.query
        if category_id:
            query = query.filter(Product.category_id == category_id)

        products = query.all()
        results = []

        total_current_revenue = 0.0
        total_current_profit = 0.0
        total_projected_revenue = 0.0
        total_projected_profit = 0.0

        for p in products:
            m = cls.calculate_product_revenue_metrics(p)
            results.append(m)
            total_current_revenue += m['current_revenue']
            total_current_profit += m['current_profit']
            total_projected_revenue += m['projected_revenue']
            total_projected_profit += m['projected_profit']

        roi_overall = round(((total_projected_profit - total_current_profit) / abs(total_current_profit)) * 100.0, 2) if total_current_profit != 0 else 0.0
        growth_overall = round(((total_projected_revenue - total_current_revenue) / total_current_revenue) * 100.0, 2) if total_current_revenue > 0 else 0.0

        return {
            'summary': {
                'total_products': len(products),
                'total_current_revenue': round(total_current_revenue, 2),
                'total_current_profit': round(total_current_profit, 2),
                'total_projected_revenue': round(total_projected_revenue, 2),
                'total_projected_profit': round(total_projected_profit, 2),
                'overall_expected_roi': roi_overall,
                'overall_expected_growth': growth_overall,
                'potential_profit_lift': round(total_projected_profit - total_current_profit, 2)
            },
            'products': results
        }
