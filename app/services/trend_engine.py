import numpy as np
from datetime import datetime, timedelta
from app.models import db, Product, CompetitorProduct, CompetitorPrice, PriceRecommendation, DemandForecast
from app.services.market_intelligence_engine import MarketIntelligenceEngine

class TrendAndOpportunityEngine:

    @classmethod
    def calculate_rolling_trends(cls, product_sku, days=30):
        """
        Calculates time-series rolling averages, moving standard deviation, and trend direction for a product SKU.
        """
        comp_prods = CompetitorProduct.query.filter(
            (CompetitorProduct.internal_product_sku == product_sku) |
            (CompetitorProduct.competitor_sku == product_sku)
        ).all()

        if not comp_prods:
            return {
                'product_sku': product_sku,
                'trend_direction': 'Stable',
                'weekly_change_pct': 0.0,
                'monthly_change_pct': 0.0,
                'rolling_7d_avg': None,
                'rolling_14d_avg': None,
                'rolling_30d_avg': None,
                'moving_std_dev': 0.0,
                'explanation': 'Insufficient historical observations for trend analysis.'
            }

        cp_ids = [cp.id for cp in comp_prods]
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        prices_qs = CompetitorPrice.query.filter(
            CompetitorPrice.competitor_product_id.in_(cp_ids),
            CompetitorPrice.recorded_at >= cutoff_date
        ).order_by(CompetitorPrice.recorded_at.asc()).all()

        if not prices_qs:
            # Fallback to all records if window is empty
            prices_qs = CompetitorPrice.query.filter(
                CompetitorPrice.competitor_product_id.in_(cp_ids)
            ).order_by(CompetitorPrice.recorded_at.asc()).all()

        if len(prices_qs) < 2:
            single_price = prices_qs[0].price if prices_qs else None
            return {
                'product_sku': product_sku,
                'trend_direction': 'Stable',
                'weekly_change_pct': 0.0,
                'monthly_change_pct': 0.0,
                'rolling_7d_avg': single_price,
                'rolling_14d_avg': single_price,
                'rolling_30d_avg': single_price,
                'moving_std_dev': 0.0,
                'explanation': 'Stable single-price baseline observed.'
            }

        price_series = [p.price for p in prices_qs]
        timestamps = [p.recorded_at for p in prices_qs]

        # 7-day, 14-day, 30-day window slices
        now = datetime.utcnow()
        p_7d = [p.price for p in prices_qs if p.recorded_at >= (now - timedelta(days=7))]
        p_14d = [p.price for p in prices_qs if p.recorded_at >= (now - timedelta(days=14))]
        p_30d = price_series

        avg_7d = float(np.mean(p_7d)) if p_7d else float(np.mean(price_series))
        avg_14d = float(np.mean(p_14d)) if p_14d else float(np.mean(price_series))
        avg_30d = float(np.mean(p_30d)) if p_30d else float(np.mean(price_series))
        moving_std = float(np.std(price_series)) if len(price_series) > 1 else 0.0

        # Calculate deltas
        first_price = price_series[0]
        latest_price = price_series[-1]
        monthly_change_pct = ((latest_price - first_price) / first_price * 100.0) if first_price > 0 else 0.0

        if p_7d and len(p_7d) >= 2:
            w_first = p_7d[0]
            w_last = p_7d[-1]
            weekly_change_pct = ((w_last - w_first) / w_first * 100.0) if w_first > 0 else 0.0
        else:
            weekly_change_pct = monthly_change_pct

        # Determine trend direction
        volatility_ratio = (moving_std / avg_30d * 100.0) if avg_30d > 0 else 0.0

        if volatility_ratio > 20.0:
            trend_direction = "Highly Volatile"
            explanation = f"Price fluctuates significantly with std dev of R$ {moving_std:.2f} ({volatility_ratio:.1f}% ratio)."
        elif weekly_change_pct >= 3.0:
            trend_direction = "Increasing"
            explanation = f"Market prices showing upward trajectory (+{weekly_change_pct:.1f}% 7-day movement)."
        elif weekly_change_pct <= -3.0:
            trend_direction = "Decreasing"
            explanation = f"Market prices showing downward trend ({weekly_change_pct:.1f}% 7-day movement)."
        else:
            trend_direction = "Stable"
            explanation = f"Market prices stable within +/- 3% boundary (7-day avg R$ {avg_7d:.2f})."

        return {
            'product_sku': product_sku,
            'trend_direction': trend_direction,
            'weekly_change_pct': round(weekly_change_pct, 2),
            'monthly_change_pct': round(monthly_change_pct, 2),
            'rolling_7d_avg': round(avg_7d, 2),
            'rolling_14d_avg': round(avg_14d, 2),
            'rolling_30d_avg': round(avg_30d, 2),
            'moving_std_dev': round(moving_std, 2),
            'explanation': explanation
        }

    @classmethod
    def evaluate_product_opportunities(cls, product):
        """
        Evaluates a Product for pricing opportunities using market metrics & demand forecasts.
        Saves detected opportunities into PriceRecommendation model.
        """
        market_analysis = MarketIntelligenceEngine.analyze_product_market(product)
        our_price = market_analysis['our_price']
        metrics = market_analysis['metrics']
        median = metrics['median']
        min_p = metrics['min']
        max_p = metrics['max']
        comp_count = market_analysis['competitor_count']

        if median is None or comp_count == 0:
            return None

        # Fetch demand forecast if exists
        forecast_rec = DemandForecast.query.filter_by(product_id=product.product_id).first()
        demand = forecast_rec.forecasted_demand if forecast_rec else 25.0

        detected_type = None
        recommended_price = our_price
        explanation = ""
        confidence = 0.85

        # Rules for Opportunity Detection:
        # Rule 1: Priced Too Low
        if our_price < (median * 0.90):
            detected_type = "PRICED_TOO_LOW"
            recommended_price = round(median * 0.96, 2)
            pct_increase = ((recommended_price - our_price) / our_price) * 100.0
            margin_gain = round((recommended_price - our_price) * demand, 2)
            explanation = f"Current price (R$ {our_price:.2f}) is {((median - our_price)/median)*100:.1f}% below market median (R$ {median:.2f}). A {pct_increase:.1f}% increase to R$ {recommended_price:.2f} expands margin by R$ {margin_gain:.2f} while preserving competitive position."
            confidence = 0.92

        # Rule 2: Priced Too High
        elif our_price > (median * 1.15) or (max_p and our_price > max_p):
            detected_type = "PRICED_TOO_HIGH"
            recommended_price = round(median * 1.05, 2)
            pct_diff = ((recommended_price - our_price) / our_price) * 100.0
            explanation = f"Current price (R$ {our_price:.2f}) exceeds market ceiling. Adjusting by {abs(pct_diff):.1f}% to R$ {recommended_price:.2f} aligns with benchmark volume band."
            confidence = 0.88

        # Rule 3: High Demand Opportunity
        elif demand > 35.0 and our_price <= median:
            detected_type = "HIGH_DEMAND"
            recommended_price = round(median * 1.03, 2)
            pct_increase = ((recommended_price - our_price) / our_price) * 100.0
            margin_gain = round((recommended_price - our_price) * demand, 2)
            explanation = f"Forecast demand is {demand:.0f} units/day. The model indicates room for a {pct_increase:.1f}% price adjustment to R$ {recommended_price:.2f} with estimated additional margin of R$ {margin_gain:.2f}."
            confidence = 0.90

        # Rule 4: Low Competition Opportunity
        elif comp_count <= 2 and our_price < median:
            detected_type = "LOW_COMPETITION"
            recommended_price = round(median * 0.98, 2)
            margin_gain = round((recommended_price - our_price) * demand, 2)
            explanation = f"Low competitive density ({comp_count} tracked competitor(s)). Adjusting price towards market median (R$ {median:.2f}) yields estimated additional margin of R$ {margin_gain:.2f}."
            confidence = 0.85

        # Rule 5: Margin Improvement
        elif (median - our_price) > 5.0:
            detected_type = "MARGIN_IMPROVEMENT"
            recommended_price = round(median * 0.98, 2)
            margin_gain = round((recommended_price - our_price) * demand, 2)
            explanation = f"Price is R$ {median - our_price:.2f} below median. Adjusting to R$ {recommended_price:.2f} yields estimated additional margin of R$ {margin_gain:.2f}."
            confidence = 0.87

        else:
            detected_type = "STABLE"
            recommended_price = our_price
            explanation = f"Current price is positioned at parity with market median (R$ {median:.2f}). Maintain active price."
            confidence = 0.95

        price_change_pct = round(((recommended_price - our_price) / our_price) * 100.0, 2)
        expected_margin_gain = round((recommended_price - our_price) * demand, 2) if recommended_price > our_price else 0.0
        expected_rev = round(recommended_price * demand, 2)

        # Upsert PriceRecommendation record
        rec_obj = PriceRecommendation.query.filter_by(product_id=product.id).first()
        if not rec_obj:
            rec_obj = PriceRecommendation(
                product_id=product.id,
                recommendation_type=detected_type,
                current_price=our_price,
                recommended_price=recommended_price,
                price_change_pct=price_change_pct,
                confidence_score=confidence,
                market_position=market_analysis['positioning_label'],
                expected_margin=expected_margin_gain,
                expected_revenue=expected_rev,
                explanation=explanation
            )
            db.session.add(rec_obj)
        else:
            rec_obj.recommendation_type = detected_type
            rec_obj.current_price = our_price
            rec_obj.recommended_price = recommended_price
            rec_obj.price_change_pct = price_change_pct
            rec_obj.confidence_score = confidence
            rec_obj.market_position = market_analysis['positioning_label']
            rec_obj.expected_margin = expected_margin_gain
            rec_obj.expected_revenue = expected_rev
            rec_obj.explanation = explanation

        db.session.commit()
        return rec_obj.to_dict()

    @classmethod
    def run_catalog_opportunity_scan(cls, type_filter=None, limit=50, offset=0):
        """
        Scans all catalog products for pricing opportunities.
        """
        products = Product.query.all()
        opportunities = []

        for p in products:
            opp_dict = cls.evaluate_product_opportunities(p)
            if opp_dict:
                if type_filter and opp_dict['recommendation_type'].lower() != type_filter.lower():
                    continue
                opportunities.append(opp_dict)

        total_count = len(opportunities)
        paginated = opportunities[offset: offset + limit] if limit else opportunities

        # Aggregated opportunity stats
        type_counts = {}
        total_potential_revenue_gain = 0.0

        for o in opportunities:
            t = o['recommendation_type']
            type_counts[t] = type_counts.get(t, 0) + 1
            if o['expected_margin'] and o['expected_margin'] > 0:
                total_potential_revenue_gain += o['expected_margin']

        return {
            'summary': {
                'total_opportunities_detected': total_count,
                'type_counts': type_counts,
                'total_potential_margin_gain': round(total_potential_revenue_gain, 2)
            },
            'total_count': total_count,
            'opportunities': paginated
        }
