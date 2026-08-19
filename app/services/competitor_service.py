import csv
import io
from datetime import datetime
from app.models import db, Competitor, CompetitorCategory, CompetitorProduct, CompetitorPrice, Product

VALID_SOURCES = {'CSV', 'API', 'MANUAL', 'SCRAPER'}
VALID_AVAILABILITY = {'in_stock', 'out_of_stock', 'limited_stock'}
VALID_CURRENCIES = {'BRL', 'USD', 'EUR', 'GBP'}

class CompetitorService:

    @staticmethod
    def get_or_create_competitor(name, website_url=None, country='BR', trust_score=1.0):
        if not name or not name.strip():
            raise ValueError("Competitor name cannot be empty")
        
        cleaned_name = name.strip()
        competitor = Competitor.query.filter_by(name=cleaned_name).first()
        if not competitor:
            competitor = Competitor(
                name=cleaned_name,
                website_url=website_url.strip() if website_url else None,
                country=country.strip() if country else 'BR',
                trust_score=float(trust_score) if trust_score is not None else 1.0
            )
            db.session.add(competitor)
            db.session.commit()
        return competitor

    @staticmethod
    def get_or_create_competitor_product(competitor_id, competitor_sku, title, internal_product_sku=None, brand=None, category_name=None, product_url=None):
        if not competitor_id or not competitor_sku or not title:
            raise ValueError("competitor_id, competitor_sku, and title are required")

        competitor_product = CompetitorProduct.query.filter_by(
            competitor_id=competitor_id,
            competitor_sku=str(competitor_sku).strip()
        ).first()

        category_id = None
        if category_name and category_name.strip():
            cat_name = category_name.strip()
            cat = CompetitorCategory.query.filter_by(competitor_id=competitor_id, category_name=cat_name).first()
            if not cat:
                cat = CompetitorCategory(competitor_id=competitor_id, category_name=cat_name)
                db.session.add(cat)
                db.session.flush()
            category_id = cat.id

        # Match with internal product if SKU provided
        internal_product_id = None
        if internal_product_sku and str(internal_product_sku).strip():
            sku_clean = str(internal_product_sku).strip()
            internal_prod = Product.query.filter_by(product_id=sku_clean).first()
            if internal_prod:
                internal_product_id = internal_prod.id
            else:
                if sku_clean.isdigit():
                    internal_prod_by_id = Product.query.get(int(sku_clean))
                    if internal_prod_by_id:
                        internal_product_id = internal_prod_by_id.id
                        sku_clean = internal_prod_by_id.product_id

        if not competitor_product:
            competitor_product = CompetitorProduct(
                competitor_id=competitor_id,
                competitor_sku=str(competitor_sku).strip(),
                title=title.strip(),
                internal_product_sku=str(internal_product_sku).strip() if internal_product_sku else None,
                product_id=internal_product_id,
                brand=brand.strip() if brand else None,
                category_id=category_id,
                product_url=product_url.strip() if product_url else None
            )
            db.session.add(competitor_product)
            db.session.flush()
        else:
            if internal_product_id and not competitor_product.product_id:
                competitor_product.product_id = internal_product_id
                competitor_product.internal_product_sku = str(internal_product_sku).strip()
            if brand and not competitor_product.brand:
                competitor_product.brand = brand.strip()
            if category_id and not competitor_product.category_id:
                competitor_product.category_id = category_id
            if product_url:
                competitor_product.product_url = product_url.strip()

        db.session.commit()
        return competitor_product

    @staticmethod
    def validate_price_record(record):
        errors = []
        cleaned = {}

        competitor_name = record.get('competitor_name') or record.get('competitor')
        competitor_id = record.get('competitor_id')
        if not competitor_name and not competitor_id:
            errors.append("Missing competitor_name or competitor_id")

        competitor_sku = record.get('competitor_sku') or record.get('sku')
        title = record.get('title') or record.get('product_name') or competitor_sku
        if not competitor_sku:
            errors.append("Missing competitor_sku")

        raw_price = record.get('price')
        if raw_price is None or raw_price == '':
            errors.append("Missing price")
        else:
            try:
                price = float(raw_price)
                if price <= 0:
                    errors.append(f"Invalid price value ({price}): must be greater than 0")
                else:
                    cleaned['price'] = price
            except (ValueError, TypeError):
                errors.append(f"Invalid price format: {raw_price}")

        currency = str(record.get('currency', 'BRL')).upper().strip()
        if currency not in VALID_CURRENCIES:
            errors.append(f"Unsupported currency: {currency}")
        else:
            cleaned['currency'] = currency

        availability = str(record.get('availability', 'in_stock')).lower().strip()
        if availability not in VALID_AVAILABILITY:
            errors.append(f"Invalid availability status: {availability}")
        else:
            cleaned['availability'] = availability

        source = str(record.get('source', 'CSV')).upper().strip()
        if source not in VALID_SOURCES:
            source = 'CSV'
        cleaned['source'] = source

        try:
            discount_percent = float(record.get('discount_percent', 0.0) or 0.0)
            if discount_percent < 0 or discount_percent > 100:
                errors.append(f"Invalid discount_percent: {discount_percent}")
            else:
                cleaned['discount_percent'] = discount_percent
        except (ValueError, TypeError):
            cleaned['discount_percent'] = 0.0

        try:
            orig_price = record.get('original_price')
            cleaned['original_price'] = float(orig_price) if orig_price else None
        except (ValueError, TypeError):
            cleaned['original_price'] = None

        cleaned['competitor_name'] = str(competitor_name).strip() if competitor_name else None
        cleaned['competitor_id'] = int(competitor_id) if competitor_id else None
        cleaned['competitor_sku'] = str(competitor_sku).strip() if competitor_sku else None
        cleaned['title'] = str(title).strip() if title else 'Competitor Product'
        cleaned['internal_product_sku'] = str(record.get('internal_product_sku') or record.get('product_id') or '').strip() or None
        cleaned['brand'] = str(record.get('brand')).strip() if record.get('brand') else None
        cleaned['category_name'] = str(record.get('category_name') or record.get('category') or '').strip() or None
        cleaned['offer_details'] = str(record.get('offer_details')).strip() if record.get('offer_details') else None
        cleaned['product_url'] = str(record.get('product_url')).strip() if record.get('product_url') else None

        if errors:
            return False, "; ".join(errors), None
        return True, None, cleaned

    @classmethod
    def ingest_price_records(cls, records, default_source='CSV'):
        success_count = 0
        rejected_count = 0
        rejection_errors = []
        ingested_ids = []

        for idx, rec in enumerate(records):
            if default_source and 'source' not in rec:
                rec['source'] = default_source

            is_valid, err_msg, cleaned = cls.validate_price_record(rec)
            if not is_valid:
                rejected_count += 1
                rejection_errors.append({'row': idx + 1, 'record': rec, 'reason': err_msg})
                continue

            try:
                if cleaned.get('competitor_id'):
                    competitor = Competitor.query.get(cleaned['competitor_id'])
                    if not competitor:
                        competitor = cls.get_or_create_competitor(cleaned['competitor_name'] or f"Competitor {cleaned['competitor_id']}")
                else:
                    competitor = cls.get_or_create_competitor(cleaned['competitor_name'])

                comp_product = cls.get_or_create_competitor_product(
                    competitor_id=competitor.id,
                    competitor_sku=cleaned['competitor_sku'],
                    title=cleaned['title'],
                    internal_product_sku=cleaned['internal_product_sku'],
                    brand=cleaned['brand'],
                    category_name=cleaned['category_name'],
                    product_url=cleaned['product_url']
                )

                price_rec = CompetitorPrice(
                    competitor_product_id=comp_product.id,
                    price=cleaned['price'],
                    currency=cleaned['currency'],
                    discount_percent=cleaned['discount_percent'],
                    original_price=cleaned['original_price'],
                    offer_details=cleaned['offer_details'],
                    source=cleaned['source'],
                    availability=cleaned['availability'],
                    recorded_at=datetime.utcnow()
                )
                db.session.add(price_rec)
                db.session.commit()

                success_count += 1
                ingested_ids.append(price_rec.id)
            except Exception as e:
                db.session.rollback()
                rejected_count += 1
                rejection_errors.append({'row': idx + 1, 'record': rec, 'reason': str(e)})

        return {
            'success_count': success_count,
            'rejected_count': rejected_count,
            'total_processed': len(records),
            'errors': rejection_errors,
            'ingested_ids': ingested_ids
        }

    @classmethod
    def ingest_csv_stream(cls, csv_text_or_file, default_source='CSV'):
        if isinstance(csv_text_or_file, bytes):
            csv_text = csv_text_or_file.decode('utf-8-sig', errors='ignore')
        elif isinstance(csv_text_or_file, str):
            csv_text = csv_text_or_file
        else:
            csv_text = csv_text_or_file.read().decode('utf-8-sig', errors='ignore')

        reader = csv.DictReader(io.StringIO(csv_text))
        records = list(reader)
        if not records:
            return {
                'success_count': 0,
                'rejected_count': 0,
                'total_processed': 0,
                'errors': [{'row': 0, 'reason': 'Empty CSV file or invalid headers'}],
                'ingested_ids': []
            }
        return cls.ingest_price_records(records, default_source=default_source)
