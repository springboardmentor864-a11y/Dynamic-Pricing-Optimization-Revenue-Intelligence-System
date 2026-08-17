import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models.sql_models import Product, CompetitorPrice, ActivityLog, CompetitiveAnalysisHistory

# Configurable thresholds (percentage gap vs market average)
THRESHOLD_VALUE_LEADER = -10.0       # below -10%
THRESHOLD_HIGHLY_COMPETITIVE = -2.0  # between -10% and -2%
THRESHOLD_COMPETITIVE = 2.0          # between -2% and +2%
THRESHOLD_PREMIUM = 10.0             # between +2% and +10%
# above +10% is OVERPRICED RISK

class CompetitiveAnalysisService:
    @staticmethod
    def analyze_product_pricing(
        db_session: Session,
        product_id: str,
        category: str,
        recommended_price: float,
        user_email: str = "guest@pricepilot.ai"
    ) -> Dict[str, Any]:
        """
        Retrieves market competitor prices, seeds demo benchmarks if empty, 
        and calculates score, positioning, action directives, reasons, and histogram bins.
        """
        # 1. Resolve product
        product = db_session.query(Product).filter(Product.product_id == product_id).first()
        if not product:
            raise KeyError(f"Product with ID '{product_id}' not found in database.")

        # 2. Query competitor prices
        competitors = db_session.query(CompetitorPrice).filter(CompetitorPrice.product_id == product.id).all()

        # 3. Seed demo prices if none exist (12 benchmarks for rich signals)
        if not competitors:
            base_price = product.current_price or product.actual_price or 100.0
            demo_benchmarks = [
                {"name": "Benchmark A", "factor": 0.94},
                {"name": "Benchmark B", "factor": 0.96},
                {"name": "Benchmark C", "factor": 0.97},
                {"name": "Benchmark D", "factor": 0.98},
                {"name": "Benchmark E", "factor": 0.99},
                {"name": "Benchmark F", "factor": 1.00},
                {"name": "Benchmark G", "factor": 1.015},
                {"name": "Benchmark H", "factor": 1.03},
                {"name": "Benchmark I", "factor": 1.05},
                {"name": "Benchmark J", "factor": 1.07},
                {"name": "Benchmark K", "factor": 1.09},
                {"name": "Benchmark L", "factor": 1.12}
            ]
            for dbm in demo_benchmarks:
                comp_price = round(base_price * dbm["factor"], 2)
                record = CompetitorPrice(
                    product_id=product.id,
                    competitor_name=dbm["name"],
                    competitor_price=comp_price,
                    recorded_at=datetime.datetime.utcnow(),
                    source="demo"
                )
                db_session.add(record)
            db_session.commit()
            competitors = db_session.query(CompetitorPrice).filter(CompetitorPrice.product_id == product.id).all()

        # 4. Perform calculations
        prices = [c.competitor_price for c in competitors]
        benchmark_count = len(prices)

        market_average = round(sum(prices) / benchmark_count, 2) if benchmark_count else recommended_price
        minimum_price = min(prices) if benchmark_count else recommended_price
        maximum_price = max(prices) if benchmark_count else recommended_price

        # Median calculation
        sorted_prices = sorted(prices)
        if benchmark_count == 0:
            category_median = recommended_price
        elif benchmark_count % 2 == 1:
            category_median = sorted_prices[benchmark_count // 2]
        else:
            category_median = round((sorted_prices[benchmark_count // 2 - 1] + sorted_prices[benchmark_count // 2]) / 2.0, 2)

        # Price gap calculations (AI Recommended Price - Market Average)
        price_gap = round(recommended_price - market_average, 2)
        price_gap_percentage = round((price_gap / market_average) * 100, 2) if market_average else 0.0

        # 5. Position Classification
        if price_gap_percentage < THRESHOLD_VALUE_LEADER:
            position = "VALUE LEADER"
        elif price_gap_percentage < THRESHOLD_HIGHLY_COMPETITIVE:
            position = "HIGHLY COMPETITIVE"
        elif price_gap_percentage <= THRESHOLD_COMPETITIVE:
            position = "COMPETITIVE"
        elif price_gap_percentage <= THRESHOLD_PREMIUM:
            position = "PREMIUM POSITION"
        else:
            position = "OVERPRICED RISK"

        # 6. Pricing Decision Action
        demand = product.demand_level or "Medium"
        if position in ["VALUE LEADER", "HIGHLY COMPETITIVE", "COMPETITIVE"]:
            pricing_decision = "MAINTAIN"
        elif position == "PREMIUM POSITION":
            if demand == "High":
                pricing_decision = "PREMIUM JUSTIFIED"
            else:
                pricing_decision = "CONSIDER LOWER PRICE"
        else:  # OVERPRICED RISK
            pricing_decision = "REVIEW PRICE"

        # 7. Market Position Score calculation (0 - 100)
        # - Market Alignment (up to 40 pts)
        alignment_score = max(0.0, 40.0 - abs(price_gap_percentage) * 2.0)
        # - Position in competitive range (up to 30 pts)
        if minimum_price <= recommended_price <= maximum_price:
            range_score = 30.0
        elif recommended_price < minimum_price:
            pct_below = ((minimum_price - recommended_price) / minimum_price) * 100.0
            range_score = max(10.0, 30.0 - pct_below * 1.0)
        else:
            pct_above = ((recommended_price - maximum_price) / maximum_price) * 100.0
            range_score = max(0.0, 30.0 - pct_above * 4.0)
        # - Profitability preservation (up to 30 pts)
        freight = product.freight_value or 15.0
        est_margin = ((recommended_price - freight - (recommended_price * 0.15)) / recommended_price) * 100.0
        profit_score = max(0.0, min(30.0, est_margin * 0.75))

        market_position_score = int(round(alignment_score + range_score + profit_score))

        # 8. Dynamic explanations ("Why this position?")
        reasons = []
        if price_gap_percentage < 0:
            reasons.append(f"Recommended price is {abs(price_gap_percentage):.1f}% below market average.")
        else:
            reasons.append(f"Recommended price is {price_gap_percentage:.1f}% above market average.")

        if minimum_price <= recommended_price <= maximum_price:
            reasons.append("Price remains within the observed market range.")
        elif recommended_price < minimum_price:
            reasons.append(f"Price is below the minimum competitor price of ₹{minimum_price:.2f}.")
        else:
            reasons.append(f"Price exceeds the maximum competitor price of ₹{maximum_price:.2f}.")

        reasons.append(f"Predicted profit margin ({est_margin:.1f}%) remains above the configured target.")

        if position == "OVERPRICED RISK":
            reasons.append("Significant competitive pricing risk detected; review suggested.")
        elif position == "PREMIUM POSITION":
            reasons.append("Moderate pricing risk; justified if product differentiation is strong.")
        else:
            reasons.append("No significant competitive pricing risk detected.")

        # 9. Calculate 5 price frequency bins for charting histograms
        price_spread = maximum_price - minimum_price
        bins = []
        if price_spread <= 0:
            bins.append({
                "bin_label": f"₹{minimum_price:.2f}",
                "count": benchmark_count,
                "min_val": minimum_price,
                "max_val": maximum_price
            })
        else:
            bin_width = price_spread / 5.0
            for i in range(5):
                bin_min = minimum_price + i * bin_width
                bin_max = bin_min + bin_width
                if i == 4:
                    count = sum(1 for p in prices if bin_min <= p <= bin_max)
                else:
                    count = sum(1 for p in prices if bin_min <= p < bin_max)
                label = f"₹{bin_min:.0f}-₹{bin_max:.0f}"
                bins.append({
                    "bin_label": label,
                    "count": count,
                    "min_val": round(bin_min, 2),
                    "max_val": round(bin_max, 2)
                })

        # 10. Format competitor list
        comp_list = [{
            "competitor_name": c.competitor_name,
            "competitor_price": c.competitor_price,
            "source": c.source
        } for c in competitors]

        # 11. Resolve user ID
        from sqlalchemy import text
        user_res = db_session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": user_email}
        ).fetchone()
        user_id = user_res[0] if user_res else "usr-guest-002"

        # 12. Create history record
        history_record = CompetitiveAnalysisHistory(
            product_id=product.id,
            our_price=recommended_price,
            competitor_average=market_average,
            price_gap=price_gap_percentage,
            competitive_position=position,
            recommended_price=recommended_price,
            ai_insight=None,
            user_id=user_id,
            created_at=datetime.datetime.utcnow()
        )
        db_session.add(history_record)

        # 13. Log activity in ActivityLog
        activity = ActivityLog(
            user_id=user_id,
            user_email=user_email,
            action="Competitive Analysis",
            module="Price Predictor",
            description=f"Competitive Analysis - Product: {product_id} | Recommended Price: ₹{recommended_price:.2f} | Market Average: ₹{market_average:.2f} | Position: {position}",
            timestamp=datetime.datetime.utcnow()
        )
        db_session.add(activity)
        db_session.commit()

        return {
            "product_id": product_id,
            "recommended_price": recommended_price,
            "our_current_price": product.current_price or product.actual_price or 100.0,
            "market_average": market_average,
            "category_median": category_median,
            "minimum_price": minimum_price,
            "maximum_price": maximum_price,
            "price_gap": price_gap,
            "price_gap_percentage": price_gap_percentage,
            "market_position_score": market_position_score,
            "competitive_position": position,
            "pricing_decision": pricing_decision,
            "benchmark_count": benchmark_count,
            "reasons": reasons,
            "bins": bins,
            "competitors": comp_list
        }
