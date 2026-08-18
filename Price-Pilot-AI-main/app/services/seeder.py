import logging
import random
from datetime import datetime, timedelta
from app.models import db, Category, Product, Competitor, CompetitorCategory, CompetitorProduct, CompetitorPrice, DemandForecast
from app.services.pricing_strategy_engine import PricingStrategyEngine

logger = logging.getLogger(__name__)

def seed_catalog_and_competitors():
    """
    Auto-seeds realistic database catalog, categories, competitors, price feeds,
    demand forecasts, and recommendations if Product database is empty.
    """
    if Product.query.count() > 0:
        logger.info(f"Database already contains {Product.query.count()} products. Skipping seed.")
        return

    logger.info("Seeding database with catalog products, competitor feeds, demand forecasts, and AI pricing strategies...")

    # 1. Categories
    categories_data = [
        ('health_beauty', 'Health & Beauty'),
        ('computers_accessories', 'Computers & Accessories'),
        ('housewares', 'Housewares'),
        ('sports_leisure', 'Sports & Leisure'),
        ('watches_gifts', 'Watches & Gifts'),
        ('auto', 'Automotive'),
        ('furniture_decor', 'Furniture & Decor'),
        ('telephony', 'Telephony & Mobile')
    ]

    category_objs = {}
    for code, name_eng in categories_data:
        cat = Category.query.filter_by(category_name=code).first()
        if not cat:
            cat = Category(category_name=code, category_name_english=name_eng)
            db.session.add(cat)
            db.session.flush()
        category_objs[code] = cat

    # 2. Competitors
    competitors_data = [
        ('Amazon Brazil', 'https://amazon.com.br', 'BR', 95.0),
        ('Mercado Livre', 'https://mercadolivre.com.br', 'BR', 92.0),
        ('Magalu', 'https://magazineluiza.com.br', 'BR', 90.0),
        ('Americanas', 'https://americanas.com.br', 'BR', 88.0),
        ('Casas Bahia', 'https://casasbahia.com.br', 'BR', 85.0)
    ]

    competitor_objs = []
    for name, url, country, trust in competitors_data:
        comp = Competitor.query.filter_by(name=name).first()
        if not comp:
            comp = Competitor(name=name, website_url=url, country=country, trust_score=trust, is_active=True)
            db.session.add(comp)
            db.session.flush()
        competitor_objs.append(comp)

    # 3. Seed Products Template
    product_templates = [
        ('health_beauty', 'Natura', 'Loggi Express', 450.0, 129.90, 72.00, 0.44, 0.35, 90.00, 180.00),
        ('health_beauty', 'O Boticario', 'Direct Logistics', 320.0, 89.90, 48.00, 0.46, 0.35, 60.00, 130.00),
        ('health_beauty', 'L\'Oreal', 'Sequoia Express', 500.0, 159.00, 90.00, 0.43, 0.35, 110.00, 220.00),
        ('health_beauty', 'Avon', 'Loggi Express', 280.0, 69.90, 36.00, 0.48, 0.35, 45.00, 100.00),
        ('health_beauty', 'Dove', 'Unilever BR', 600.0, 49.90, 25.00, 0.50, 0.35, 35.00, 80.00),

        ('computers_accessories', 'Dell', 'Dell Logistics', 1200.0, 449.00, 280.00, 0.38, 0.35, 320.00, 650.00),
        ('computers_accessories', 'Logitech', 'Ingram Micro', 350.0, 199.90, 115.00, 0.42, 0.35, 140.00, 290.00),
        ('computers_accessories', 'Razer', 'Synnex BR', 480.0, 329.00, 190.00, 0.42, 0.35, 230.00, 480.00),
        ('computers_accessories', 'Kingston', 'Ingram Micro', 120.0, 119.90, 65.00, 0.45, 0.35, 80.00, 170.00),
        ('computers_accessories', 'LG', 'LG Electronics', 2400.0, 899.00, 580.00, 0.35, 0.35, 650.00, 1200.00),

        ('housewares', 'Tramontina', 'Tramontina BR', 1800.0, 249.90, 140.00, 0.44, 0.35, 175.00, 360.00),
        ('housewares', 'Walita', 'Philips BR', 1500.0, 189.90, 105.00, 0.44, 0.35, 130.00, 270.00),
        ('housewares', 'Oster', 'Jarden BR', 2100.0, 299.00, 175.00, 0.41, 0.35, 210.00, 420.00),
        ('housewares', 'Mondial', 'Mondial Line', 1300.0, 139.90, 75.00, 0.46, 0.35, 95.00, 200.00),
        ('housewares', 'Britania', 'Britania BR', 1400.0, 119.90, 65.00, 0.45, 0.35, 85.00, 180.00),

        ('sports_leisure', 'Nike', 'Centauro BR', 850.0, 279.90, 150.00, 0.46, 0.35, 190.00, 390.00),
        ('sports_leisure', 'Adidas', 'Adidas BR', 780.0, 259.90, 140.00, 0.46, 0.35, 180.00, 370.00),
        ('sports_leisure', 'Puma', 'Puma Brasil', 820.0, 229.90, 125.00, 0.45, 0.35, 160.00, 330.00),
        ('sports_leisure', 'Under Armour', 'Vulcabras', 690.0, 199.90, 110.00, 0.45, 0.35, 140.00, 290.00),
        ('sports_leisure', 'Mizuno', 'Vulcabras', 920.0, 319.90, 180.00, 0.43, 0.35, 220.00, 450.00),

        ('watches_gifts', 'Technos', 'Technos BR', 310.0, 389.00, 210.00, 0.46, 0.35, 270.00, 550.00),
        ('watches_gifts', 'Casio', 'Casio Brasil', 240.0, 249.90, 130.00, 0.48, 0.35, 175.00, 360.00),
        ('watches_gifts', 'Fossil', 'Fossil Group', 380.0, 599.00, 340.00, 0.43, 0.35, 420.00, 850.00),
        ('watches_gifts', 'Orient', 'Orient Watch', 290.0, 329.00, 180.00, 0.45, 0.35, 230.00, 480.00),

        ('auto', 'Bosch', 'Bosch Automotive', 1500.0, 219.90, 120.00, 0.45, 0.35, 150.00, 310.00),
        ('auto', 'Pirelli', 'Pirelli BR', 8500.0, 429.00, 260.00, 0.39, 0.35, 310.00, 600.00),
        ('auto', '3M', '3M do Brasil', 450.0, 79.90, 42.00, 0.47, 0.35, 55.00, 120.00),
        ('auto', 'Philips Auto', 'Philips BR', 280.0, 119.90, 62.00, 0.48, 0.35, 80.00, 170.00),

        ('telephony', 'Samsung', 'Samsung Electronics', 210.0, 1299.00, 850.00, 0.34, 0.35, 950.00, 1800.00),
        ('telephony', 'Motorola', 'Motorola BR', 195.0, 999.00, 640.00, 0.36, 0.35, 750.00, 1400.00),
        ('telephony', 'Xiaomi', 'DL Eletronicos', 205.0, 1149.00, 740.00, 0.35, 0.35, 850.00, 1600.00),
        ('telephony', 'Apple', 'Apple Brasil', 180.0, 3499.00, 2400.00, 0.31, 0.35, 280.00, 4800.00)
    ]

    now = datetime.utcnow()

    for idx, (cat_code, brand, supplier, weight, price, cost, margin, target_m, min_p, max_p) in enumerate(product_templates, start=1):
        sku = f"{cat_code}_{idx:03d}"
        cat_obj = category_objs[cat_code]

        prod = Product(
            product_id=sku,
            category_id=cat_obj.id,
            product_name_length=len(f"{brand} {cat_obj.category_name_english}"),
            product_description_length=120,
            product_photos_qty=4,
            product_weight_g=weight,
            product_length_cm=round(weight ** 0.33, 1),
            product_height_cm=12.0,
            product_width_cm=15.0,
            current_price=price,
            cost_price=cost,
            margin=margin,
            target_margin=target_m,
            minimum_price=min_p,
            maximum_price=max_p,
            brand=brand,
            sku=sku,
            supplier=supplier,
            created_at=now - timedelta(days=60)
        )
        db.session.add(prod)
        db.session.flush()

        # Seed Demand Forecast for product
        base_demand = round(random.uniform(22.0, 58.0), 1)
        forecast = DemandForecast(
            product_id=prod.product_id,
            forecast_date=(now + timedelta(days=30)).strftime('%Y-%m-%d'),
            forecasted_demand=base_demand,
            lower_bound=round(base_demand * 0.85, 1),
            upper_bound=round(base_demand * 1.15, 1)
        )
        db.session.add(forecast)

        # Seed Competitor Products and Price History Ledger
        assigned_comps = random.sample(competitor_objs, k=random.randint(2, 4))
        for comp_idx, comp in enumerate(assigned_comps):
            comp_sku = f"COMP-{comp.name[:3].upper()}-{sku}"
            comp_title = f"{brand} {cat_obj.category_name_english} - {comp.name} Feed"

            comp_prod = CompetitorProduct(
                competitor_id=comp.id,
                product_id=prod.id,
                internal_product_sku=prod.product_id,
                competitor_sku=comp_sku,
                title=comp_title,
                brand=brand,
                created_at=now - timedelta(days=45)
            )
            db.session.add(comp_prod)
            db.session.flush()

            # Variance ratio for competitor price relative to our price
            # Vary ratios so positioning labels span Market Leader, Aggressive, Below Market, At Market, Above Market, Premium
            variation_ratio = random.choice([0.88, 0.94, 0.98, 1.02, 1.08, 1.15])
            base_comp_price = round(price * variation_ratio, 2)

            # Insert time series observations across 30 days
            for d in [30, 21, 14, 7, 1]:
                obs_date = now - timedelta(days=d)
                # Introduce slight price trend / fluctuation over time
                fluctuation = random.uniform(-0.03, 0.03)
                obs_price = round(base_comp_price * (1.0 + fluctuation), 2)

                price_obs = CompetitorPrice(
                    competitor_product_id=comp_prod.id,
                    price=obs_price,
                    currency='BRL',
                    availability='in_stock',
                    source='AUTOMATED_SCRAPER',
                    recorded_at=obs_date
                )
                db.session.add(price_obs)

    db.session.commit()
    logger.info(f"Database successfully seeded with {Product.query.count()} products, competitor feeds, and demand forecasts.")

    # 4. Generate AI Pricing Recommendations for seeded products
    all_products = Product.query.all()
    for p in all_products:
        try:
            PricingStrategyEngine.generate_strategy_for_product(p)
        except Exception as e:
            logger.warning(f"Failed to generate initial recommendation for {p.product_id}: {str(e)}")

    db.session.commit()
    logger.info("AI Pricing Strategies & PriceRecommendations seeded successfully.")
