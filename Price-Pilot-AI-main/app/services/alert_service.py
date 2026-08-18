from datetime import datetime
from app.models import Product, DemandForecast
from app.services.market_intelligence_engine import MarketIntelligenceEngine

class AlertService:

    @classmethod
    def get_active_business_alerts(cls):
        """
        Scans catalog and generates prioritized business notifications & alerts.
        """
        products = Product.query.order_by(Product.id.desc()).limit(50).all()
        alerts = []

        for p in products:
            mkt = MarketIntelligenceEngine.analyze_product_market(p)
            cost = p.get_cost()
            curr_price = p.current_price
            median_mkt = mkt['median_market_price']
            margin_pct = ((curr_price - cost) / curr_price * 100.0) if curr_price > 0 else 0.0

            # Rule 1: Margin Risk Alert
            if margin_pct < 15.0 or curr_price <= cost:
                alerts.append({
                    'id': f"ALERT-MARG-{p.id}",
                    'product_id': p.product_id,
                    'type': 'Margin Risk',
                    'severity': 'CRITICAL',
                    'priority': 'HIGH',
                    'title': f"Margin Erosion Warning on {p.product_id}",
                    'message': f"Current gross margin ({margin_pct:.1f}%) is below safety threshold. Price (R$ {curr_price:.2f}) operates close to cost floor (R$ {cost:.2f}).",
                    'recommendation': "Increase price or renegotiate supplier cost floor.",
                    'timestamp': datetime.utcnow().isoformat()
                })

            # Rule 2: Competitor Price Drop Alert
            elif median_mkt and curr_price > (median_mkt * 1.15):
                alerts.append({
                    'id': f"ALERT-COMP-{p.id}",
                    'product_id': p.product_id,
                    'type': 'Competitor Price Cut',
                    'severity': 'WARNING',
                    'priority': 'HIGH',
                    'title': f"Competitor Price Undercut on {p.product_id}",
                    'message': f"Market median (R$ {median_mkt:.2f}) is 15%+ lower than your current price (R$ {curr_price:.2f}). Risk of losing customer volume.",
                    'recommendation': "Re-align price to competitive market matching strategy.",
                    'timestamp': datetime.utcnow().isoformat()
                })

            # Rule 3: High Opportunity Alert
            elif median_mkt and curr_price < (median_mkt * 0.85):
                alerts.append({
                    'id': f"ALERT-OPP-{p.id}",
                    'product_id': p.product_id,
                    'type': 'High Opportunity',
                    'severity': 'INFO',
                    'priority': 'MEDIUM',
                    'title': f"Margin Expansion Opportunity on {p.product_id}",
                    'message': f"Your price (R$ {curr_price:.2f}) is significantly below market median (R$ {median_mkt:.2f}). High margin gain potential.",
                    'recommendation': "Increase price by +8% to capture additional profit margin.",
                    'timestamp': datetime.utcnow().isoformat()
                })

        # Summary metadata
        critical_count = sum(1 for a in alerts if a['severity'] == 'CRITICAL')
        warning_count = sum(1 for a in alerts if a['severity'] == 'WARNING')

        return {
            'summary': {
                'total_alerts': len(alerts),
                'critical_count': critical_count,
                'warning_count': warning_count,
                'info_count': len(alerts) - (critical_count + warning_count)
            },
            'alerts': alerts
        }
