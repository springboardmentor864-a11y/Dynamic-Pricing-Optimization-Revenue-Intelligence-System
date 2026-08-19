import numpy as np
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models import db, Product, CompetitorProduct, CompetitorPrice, Competitor, DemandForecast

class MarketIntelligenceEngine:

    @staticmethod
    def compute_statistical_metrics(prices):
        """
        Computes robust statistical metrics for a list of float prices.
        Returns dict with mean, median, min, max, std_dev, variance, volatility_pct, stability_score.
        """
        if not prices:
            return {
                'mean': None,
                'median': None,
                'min': None,
                'max': None,
                'std_dev': 0.0,
                'variance': 0.0,
                'volatility_pct': 0.0,
                'stability_score': 100.0
            }

        arr = np.array(prices, dtype=float)
        mean_val = float(np.mean(arr))
        median_val = float(np.median(arr))
        min_val = float(np.min(arr))
        max_val = float(np.max(arr))
        std_val = float(np.std(arr)) if len(arr) > 1 else 0.0
        var_val = float(np.var(arr)) if len(arr) > 1 else 0.0

        volatility_pct = (std_val / mean_val * 100.0) if mean_val > 0 else 0.0
        stability_score = max(0.0, min(100.0, 100.0 - volatility_pct))

        return {
            'mean': round(mean_val, 2),
            'median': round(median_val, 2),
            'min': round(min_val, 2),
            'max': round(max_val, 2),
            'std_dev': round(std_val, 2),
            'variance': round(var_val, 2),
            'volatility_pct': round(volatility_pct, 2),
            'stability_score': round(stability_score, 1)
        }

    @classmethod
    def classify_positioning(cls, our_price, metrics, competitor_count):
        """
        Determines competitive positioning label and explanation.
        Labels: Market Leader, Aggressive Pricing, Below Market, At Market, Above Market, Premium
        """
        median = metrics['median']
        min_p = metrics['min']
        max_p = metrics['max']

        if median is None:
            return "Unmapped", "Insufficient competitor price data."

        diff_from_median_pct = ((our_price - median) / median) * 100.0

        if our_price <= min_p and competitor_count >= 2:
            label = "Market Leader"
            explanation = f"Our price (R$ {our_price:.2f}) is the lowest in the market across {competitor_count} competitors."
        elif diff_from_median_pct < -10.0:
            label = "Aggressive Pricing"
            explanation = f"Our price is {abs(diff_from_median_pct):.1f}% below market median (R$ {median:.2f}), driving high volume but risking margin."
        elif diff_from_median_pct < -3.0:
            label = "Below Market"
            explanation = f"Our price is {abs(diff_from_median_pct):.1f}% below market median (R$ {median:.2f})."
        elif abs(diff_from_median_pct) <= 3.0:
            label = "At Market"
            explanation = f"Our price is perfectly aligned within 3% of market median (R$ {median:.2f})."
        elif diff_from_median_pct <= 12.0:
            label = "Above Market"
            explanation = f"Our price is {diff_from_median_pct:.1f}% above market median (R$ {median:.2f})."
        else:
            label = "Premium"
            explanation = f"Our price is {diff_from_median_pct:.1f}% above market median (R$ {median:.2f}), positioning as a premium offer."

        return label, explanation

    @classmethod
    def classify_risk(cls, our_price, metrics):
        """
        Determines market risk level and description.
        """
        median = metrics['median']
        max_p = metrics['max']
        volatility = metrics['volatility_pct']

        if median is None:
            return "Unknown Risk", "No competitor tracking data."

        if our_price > max_p or (median > 0 and (our_price / median) > 1.15):
            return "High Risk - Overpriced", f"Price (R$ {our_price:.2f}) exceeds market ceiling by {((our_price - max_p)/max_p)*100:.1f}%."
        elif volatility > 25.0:
            return "Volatility Risk", f"Market exhibits high price volatility ({volatility:.1f}% std dev ratio)."
        elif median > 0 and (our_price / median) < 0.85:
            return "Margin Risk - Low Price", f"Price is > 15% below market median, eroding potential gross margin."
        else:
            return "Low Risk", "Price is within balanced competitive boundaries."

    @classmethod
    def analyze_product_market(cls, product):
        """
        Analyzes full market intelligence for a single Product model instance.
        """
        # Fetch linked competitor products
        comp_prods = CompetitorProduct.query.filter(
            (CompetitorProduct.product_id == product.id) | 
            (CompetitorProduct.internal_product_sku == product.product_id)
        ).all()

        latest_prices = []
        historical_obs = []

        for cp in comp_prods:
            prices_qs = CompetitorPrice.query.filter_by(
                competitor_product_id=cp.id
            ).order_by(CompetitorPrice.recorded_at.desc()).all()

            if prices_qs:
                latest_prices.append(prices_qs[0].price)
                for p in prices_qs:
                    historical_obs.append({
                        'competitor_name': cp.competitor.name if cp.competitor else 'Unknown',
                        'price': p.price,
                        'source': p.source,
                        'availability': p.availability,
                        'timestamp': p.recorded_at
                    })

        our_price = round(float(product.current_price), 2)
        comp_count = len(latest_prices)
        metrics = cls.compute_statistical_metrics(latest_prices)

        position_label, position_exp = cls.classify_positioning(our_price, metrics, comp_count)
        risk_label, risk_exp = cls.classify_risk(our_price, metrics)

        # Check demand forecast if available
        forecast_rec = DemandForecast.query.filter_by(product_id=product.product_id).first()
        forecasted_demand = forecast_rec.forecasted_demand if forecast_rec else 30.0

        return {
            'product_db_id': product.id,
            'product_id': product.product_id,
            'category_name': product.category.category_name if product.category else 'Uncategorized',
            'our_price': our_price,
            'competitor_count': comp_count,
            'metrics': metrics,
            'average_market_price': metrics['mean'],
            'median_market_price': metrics['median'],
            'min_market_price': metrics['min'],
            'max_market_price': metrics['max'],
            'price_volatility_pct': metrics['volatility_pct'],
            'stability_score': metrics['stability_score'],
            'positioning_label': position_label,
            'positioning_explanation': position_exp,
            'risk_label': risk_label,
            'risk_explanation': risk_exp,
            'forecasted_demand': forecasted_demand,
            'historical_observation_count': len(historical_obs)
        }

    @classmethod
    def get_market_overview(cls, category_id=None, position_filter=None, risk_filter=None):
        """
        Generates catalog-wide Business Intelligence overview.
        """
        query = Product.query
        if category_id:
            query = query.filter(Product.category_id == category_id)

        products = query.all()
        results = []

        total_volatility = 0.0
        mapped_products_count = 0

        position_counts = {
            'Market Leader': 0,
            'Aggressive Pricing': 0,
            'Below Market': 0,
            'At Market': 0,
            'Above Market': 0,
            'Premium': 0,
            'Unmapped': 0
        }

        risk_counts = {
            'High Risk - Overpriced': 0,
            'Margin Risk - Low Price': 0,
            'Volatility Risk': 0,
            'Low Risk': 0,
            'Unknown Risk': 0
        }

        for p in products:
            analysis = cls.analyze_product_market(p)
            pos = analysis['positioning_label']
            risk = analysis['risk_label']

            position_counts[pos] = position_counts.get(pos, 0) + 1
            risk_counts[risk] = risk_counts.get(risk, 0) + 1

            if analysis['median_market_price'] is not None:
                total_volatility += analysis['price_volatility_pct']
                mapped_products_count += 1

            if position_filter and pos.lower() != position_filter.lower():
                continue
            if risk_filter and risk_filter.lower() not in risk.lower():
                continue

            results.append(analysis)

        avg_catalog_volatility = round(total_volatility / mapped_products_count, 2) if mapped_products_count > 0 else 0.0
        catalog_stability = max(0.0, min(100.0, round(100.0 - avg_catalog_volatility, 1)))

        return {
            'summary': {
                'total_products': len(products),
                'total_mapped_products': mapped_products_count,
                'avg_catalog_volatility_pct': avg_catalog_volatility,
                'catalog_stability_score': catalog_stability,
                'position_counts': position_counts,
                'risk_counts': risk_counts
            },
            'products': results
        }
