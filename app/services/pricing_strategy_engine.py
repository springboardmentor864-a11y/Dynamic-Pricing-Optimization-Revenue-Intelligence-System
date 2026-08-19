from app.models import db, Product, PriceRecommendation, DemandForecast
from app.services.market_intelligence_engine import MarketIntelligenceEngine
from app.services.revenue_optimization_engine import RevenueOptimizationEngine

class PricingStrategyEngine:

    STRATEGIES = [
        'Aggressive Pricing',
        'Competitive Matching',
        'Premium Pricing',
        'Margin Protection',
        'Market Penetration',
        'Revenue Maximization',
        'Demand Recovery',
        'Loss Prevention'
    ]

    @classmethod
    def generate_strategy_for_product(cls, product):
        """
        Generates AI pricing strategy, calculates recommended price, expected profit, ROI, confidence score, and risk level.
        Persists strategy to PriceRecommendation database table.
        """
        rev_metrics = RevenueOptimizationEngine.calculate_product_revenue_metrics(product)
        market_analysis = MarketIntelligenceEngine.analyze_product_market(product)

        our_price = rev_metrics['current_price']
        cost_price = rev_metrics['cost_price']
        optimal_price = rev_metrics['optimal_selling_price']
        breakeven_price = rev_metrics['breakeven_price']
        median_market = rev_metrics['market_median_price']
        comp_count = market_analysis['competitor_count']
        pos_label = market_analysis['positioning_label']

        forecast_rec = DemandForecast.query.filter_by(product_id=product.product_id).first()
        demand = forecast_rec.forecasted_demand if forecast_rec else 30.0

        strategy_type = 'Revenue Maximization'
        recommended_price = optimal_price
        risk_level = 'LOW'
        confidence_score = 0.88
        reason = ""

        # Rules for Strategy Selection:
        # Rule 1: Loss Prevention (Price below break-even or cost)
        if our_price <= breakeven_price or (our_price - cost_price) < 5.0:
            strategy_type = 'Loss Prevention'
            recommended_price = max(breakeven_price, round(cost_price * 1.25, 2))
            risk_level = 'HIGH'
            confidence_score = 0.95
            reason = f"Current price (R$ {our_price:.2f}) operates at or near break-even (R$ {breakeven_price:.2f}). Adjusting to R$ {recommended_price:.2f} prevents financial loss and guarantees positive gross margin."

        # Rule 2: Margin Protection (Costs rising or price below target margin)
        elif (our_price - cost_price) / our_price < 0.25:
            strategy_type = 'Margin Protection'
            recommended_price = round(cost_price / 0.70, 2)  # Ensure 30% margin
            risk_level = 'MEDIUM'
            confidence_score = 0.90
            reason = f"Current margin ({((our_price - cost_price)/our_price)*100:.1f}%) is below target threshold. Adjusting price to R$ {recommended_price:.2f} protects baseline margin integrity."

        # Rule 3: Aggressive Pricing (Low competitor prices & high volume opportunity)
        elif pos_label == 'Below Market' and comp_count >= 3:
            strategy_type = 'Aggressive Pricing'
            recommended_price = round(median_market * 0.95, 2) if median_market else optimal_price
            risk_level = 'MEDIUM'
            confidence_score = 0.87
            reason = f"Underpricing across {comp_count} active competitors creates an aggressive market share acquisition opportunity at R$ {recommended_price:.2f}."

        # Rule 4: Premium Pricing (High demand & premium market positioning)
        elif pos_label == 'Above Market' or (median_market and our_price > median_market * 1.05 and demand > 35):
            strategy_type = 'Premium Pricing'
            recommended_price = round(our_price * 1.04, 2)
            risk_level = 'LOW'
            confidence_score = 0.92
            reason = f"Strong demand ({demand:.0f} units/day) supports premium price elasticity. Increasing price by +4% to R$ {recommended_price:.2f} expands net profitability."

        # Rule 5: Market Penetration (Low competition / new product entry)
        elif comp_count <= 1 and demand > 20:
            strategy_type = 'Market Penetration'
            recommended_price = round(median_market * 0.92, 2) if median_market else round(cost_price * 1.35, 2)
            risk_level = 'LOW'
            confidence_score = 0.85
            reason = f"Low competitive pressure allows market penetration pricing at R$ {recommended_price:.2f} to build dominant customer acquisition."

        # Rule 6: Competitive Matching (Market stable & close to median)
        elif pos_label == 'At Market' and median_market is not None:
            strategy_type = 'Competitive Matching'
            recommended_price = round(median_market, 2)
            risk_level = 'LOW'
            confidence_score = 0.94
            reason = f"Market is highly stable. Matching median competitor price (R$ {median_market:.2f}) minimizes churn while maintaining steady sales velocity."

        # Rule 7: Demand Recovery (Demand stagnant or low)
        elif demand < 15.0:
            strategy_type = 'Demand Recovery'
            recommended_price = max(breakeven_price, round(our_price * 0.92, 2))
            risk_level = 'MEDIUM'
            confidence_score = 0.84
            reason = f"Low demand forecast ({demand:.0f} units/day). Discounting price by 8% to R$ {recommended_price:.2f} stimulates buyer interest and inventory turnover."

        # Rule 8: Default Revenue Maximization
        else:
            strategy_type = 'Revenue Maximization'
            recommended_price = optimal_price
            risk_level = 'LOW'
            confidence_score = 0.89
            reason = f"AI revenue optimization model computed maximum top-line revenue & profit point at R$ {recommended_price:.2f}."

        # Compute projected outputs for strategy
        proj_demand = RevenueOptimizationEngine.estimate_demand_at_price(our_price, demand, recommended_price)
        exp_revenue = round(recommended_price * proj_demand, 2)
        exp_profit = round((recommended_price - cost_price) * proj_demand, 2)
        exp_margin = round(recommended_price - cost_price, 2)
        price_change_pct = round(((recommended_price - our_price) / our_price) * 100.0, 2)
        curr_profit = (our_price - cost_price) * demand
        exp_roi = round(((exp_profit - curr_profit) / abs(curr_profit)) * 100.0, 2) if curr_profit != 0 else 0.0

        # Upsert PriceRecommendation database record
        rec_obj = PriceRecommendation.query.filter_by(product_id=product.id).first()
        if not rec_obj:
            rec_obj = PriceRecommendation(
                product_id=product.id,
                recommendation_type=strategy_type,
                current_price=our_price,
                recommended_price=recommended_price,
                price_change_pct=price_change_pct,
                confidence_score=confidence_score,
                market_position=pos_label,
                expected_margin=exp_margin,
                expected_revenue=exp_revenue,
                expected_profit=exp_profit,
                expected_roi=exp_roi,
                risk_level=risk_level,
                strategy_type=strategy_type,
                explanation=reason
            )
            db.session.add(rec_obj)
        else:
            rec_obj.recommendation_type = strategy_type
            rec_obj.current_price = our_price
            rec_obj.recommended_price = recommended_price
            rec_obj.price_change_pct = price_change_pct
            rec_obj.confidence_score = confidence_score
            rec_obj.market_position = pos_label
            rec_obj.expected_margin = exp_margin
            rec_obj.expected_revenue = exp_revenue
            rec_obj.expected_profit = exp_profit
            rec_obj.expected_roi = exp_roi
            rec_obj.risk_level = risk_level
            rec_obj.strategy_type = strategy_type
            rec_obj.explanation = reason

        db.session.commit()
        return rec_obj.to_dict()

    @classmethod
    def get_catalog_strategies(cls, strategy_filter=None, risk_filter=None, limit=50, offset=0):
        """
        Generates AI pricing strategy recommendations across the entire product catalog.
        """
        products = Product.query.all()
        results = []

        strategy_counts = {s: 0 for s in cls.STRATEGIES}
        risk_counts = {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0}
        total_expected_profit = 0.0

        for p in products:
            strat_dict = cls.generate_strategy_for_product(p)
            st = strat_dict['strategy_type']
            rk = strat_dict['risk_level']

            strategy_counts[st] = strategy_counts.get(st, 0) + 1
            risk_counts[rk] = risk_counts.get(rk, 0) + 1
            if strat_dict['expected_profit']:
                total_expected_profit += strat_dict['expected_profit']

            if strategy_filter and strategy_filter.lower() not in st.lower():
                continue
            if risk_filter and risk_filter.lower() != rk.lower():
                continue

            results.append(strat_dict)

        total_count = len(results)
        paginated = results[offset: offset + limit] if limit else results

        return {
            'summary': {
                'total_products_analyzed': len(products),
                'strategy_counts': strategy_counts,
                'risk_counts': risk_counts,
                'total_expected_profit': round(total_expected_profit, 2)
            },
            'total_count': total_count,
            'recommendations': paginated
        }
