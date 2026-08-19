from sqlalchemy import func
from app.models import db, Product, CompetitorProduct, CompetitorPrice, Competitor

class PriceComparisonEngine:

    @staticmethod
    def classify_price_position(our_price, min_price, max_price, avg_price):
        """
        Classifies price position label: Lowest, Competitive, Premium, Overpriced
        """
        if min_price is None or avg_price is None:
            return "Unmapped"

        if our_price < min_price:
            return "Lowest"
        elif our_price <= (avg_price * 1.02):
            return "Competitive"
        elif our_price <= max_price and our_price <= (avg_price * 1.15):
            return "Premium"
        else:
            return "Overpriced"

    @classmethod
    def compare_product(cls, product):
        """
        Computes detailed competitor price comparison for a single Product model instance.
        """
        # Find all CompetitorProducts linked to this product (by product_id FK or internal_product_sku)
        comp_prods = CompetitorProduct.query.filter(
            (CompetitorProduct.product_id == product.id) | 
            (CompetitorProduct.internal_product_sku == product.product_id)
        ).all()

        competitor_prices = []

        for cp in comp_prods:
            latest_price = CompetitorPrice.query.filter_by(
                competitor_product_id=cp.id
            ).order_by(CompetitorPrice.recorded_at.desc()).first()

            if latest_price:
                competitor_prices.append({
                    'competitor_id': cp.competitor_id,
                    'competitor_name': cp.competitor.name if cp.competitor else f"Competitor {cp.competitor_id}",
                    'competitor_sku': cp.competitor_sku,
                    'title': cp.title,
                    'price': latest_price.price,
                    'currency': latest_price.currency,
                    'availability': latest_price.availability,
                    'recorded_at': latest_price.recorded_at.isoformat() if latest_price.recorded_at else None
                })

        our_price = round(float(product.current_price), 2)
        comp_count = len(competitor_prices)

        if comp_count > 0:
            prices_list = [cp['price'] for cp in competitor_prices]
            lowest_price = round(min(prices_list), 2)
            highest_price = round(max(prices_list), 2)
            avg_price = round(sum(prices_list) / comp_count, 2)
            price_diff = round(our_price - avg_price, 2)
            price_diff_pct = round((price_diff / avg_price) * 100, 2) if avg_price > 0 else 0.0
            price_position = cls.classify_price_position(our_price, lowest_price, highest_price, avg_price)
        else:
            lowest_price = None
            highest_price = None
            avg_price = None
            price_diff = 0.0
            price_diff_pct = 0.0
            price_position = "Unmapped"

        return {
            'product_db_id': product.id,
            'product_id': product.product_id,
            'category_name': product.category.category_name if product.category else 'Uncategorized',
            'our_price': our_price,
            'lowest_competitor_price': lowest_price,
            'highest_competitor_price': highest_price,
            'average_competitor_price': avg_price,
            'price_difference': price_diff,
            'price_difference_pct': price_diff_pct,
            'competitor_count': comp_count,
            'price_position': price_position,
            'competitor_details': competitor_prices
        }

    @classmethod
    def get_catalog_comparison(cls, category_id=None, position_filter=None, search_query=None, limit=100, offset=0):
        """
        Computes price comparisons for products across the catalog.
        """
        query = Product.query

        if category_id:
            query = query.filter(Product.category_id == category_id)

        if search_query:
            sq = f"%{search_query.strip()}%"
            query = query.filter(Product.product_id.ilike(sq))

        products = query.all()
        comparisons = []

        position_counts = {
            'Lowest': 0,
            'Competitive': 0,
            'Premium': 0,
            'Overpriced': 0,
            'Unmapped': 0
        }

        total_price_gap = 0.0
        mapped_count = 0

        for p in products:
            comp = cls.compare_product(p)
            pos = comp['price_position']
            position_counts[pos] = position_counts.get(pos, 0) + 1

            if comp['average_competitor_price'] is not None:
                total_price_gap += comp['price_difference']
                mapped_count += 1

            if position_filter and pos.lower() != position_filter.lower():
                continue

            comparisons.append(comp)

        total_compared = len(comparisons)
        paginated_items = comparisons[offset: offset + limit] if limit else comparisons

        avg_catalog_gap = round(total_price_gap / mapped_count, 2) if mapped_count > 0 else 0.0

        summary = {
            'total_products': len(products),
            'total_mapped_products': mapped_count,
            'total_competitors_tracked': Competitor.query.count(),
            'avg_catalog_price_gap': avg_catalog_gap,
            'position_counts': position_counts,
            'position_percentages': {
                k: round((v / len(products)) * 100, 1) if products else 0.0
                for k, v in position_counts.items()
            }
        }

        return {
            'summary': summary,
            'total_count': total_compared,
            'comparisons': paginated_items
        }
