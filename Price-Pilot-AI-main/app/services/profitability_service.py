from app.models import Product
from app.services.revenue_optimization_engine import RevenueOptimizationEngine

class ProfitabilityService:

    @classmethod
    def get_profitability_analytics(cls, category_id=None):
        """
        Computes detailed catalog-wide profitability metrics, margins, contribution margins, and best/worst performing products.
        """
        query = Product.query
        if category_id:
            query = query.filter(Product.category_id == category_id)

        products = query.all()
        product_analytics = []

        total_gross_revenue = 0.0
        total_cost_of_goods = 0.0
        total_gross_profit = 0.0
        total_projected_profit = 0.0

        for p in products:
            m = RevenueOptimizationEngine.calculate_product_revenue_metrics(p)
            cogs = round(m['cost_price'] * m['current_demand'], 2)
            gross_prof = round(m['current_revenue'] - cogs, 2)
            contrib_margin_pct = round((gross_prof / m['current_revenue'] * 100.0), 2) if m['current_revenue'] > 0 else 0.0

            analytics_item = {
                'product_db_id': p.id,
                'product_id': p.product_id,
                'category_name': m['category_name'],
                'current_price': m['current_price'],
                'cost_price': m['cost_price'],
                'breakeven_price': m['breakeven_price'],
                'optimal_selling_price': m['optimal_selling_price'],
                'current_demand': m['current_demand'],
                'current_revenue': m['current_revenue'],
                'cogs': cogs,
                'gross_profit': gross_prof,
                'projected_profit': m['projected_profit'],
                'contribution_margin_pct': contrib_margin_pct,
                'gross_margin_pct': m['gross_margin_pct'],
                'net_margin_pct': m['net_margin_pct'],
                'expected_roi': m['expected_roi']
            }
            product_analytics.append(analytics_item)

            total_gross_revenue += m['current_revenue']
            total_cost_of_goods += cogs
            total_gross_profit += gross_prof
            total_projected_profit += m['projected_profit']

        overall_profit_margin_pct = round((total_gross_profit / total_gross_revenue * 100.0), 2) if total_gross_revenue > 0 else 0.0
        overall_net_margin_pct = round((total_projected_profit / total_gross_revenue * 100.0), 2) if total_gross_revenue > 0 else 0.0

        # Sort products for Best Performing, Worst Performing, and Loss Making
        sorted_by_profit = sorted(product_analytics, key=lambda x: x['gross_profit'], reverse=True)
        sorted_by_margin = sorted(product_analytics, key=lambda x: x['gross_margin_pct'])

        best_performers = sorted_by_profit[:5]
        worst_performers = sorted_by_margin[:5]
        loss_making = [p for p in product_analytics if p['gross_profit'] <= 0 or p['gross_margin_pct'] < 15.0]

        return {
            'summary': {
                'total_products': len(products),
                'total_gross_revenue': round(total_gross_revenue, 2),
                'total_cost_of_goods': round(total_cost_of_goods, 2),
                'total_gross_profit': round(total_gross_profit, 2),
                'total_projected_profit': round(total_projected_profit, 2),
                'overall_profit_margin_pct': overall_profit_margin_pct,
                'overall_net_margin_pct': overall_net_margin_pct,
                'loss_making_skus_count': len(loss_making)
            },
            'best_performing_products': best_performers,
            'worst_performing_products': worst_performers,
            'loss_making_products': loss_making,
            'products': product_analytics
        }
