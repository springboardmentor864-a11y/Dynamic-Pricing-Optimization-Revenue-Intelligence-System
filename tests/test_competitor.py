import io
import pytest
from app.models import db, Competitor, CompetitorCategory, CompetitorProduct, CompetitorPrice, Product, Category
from app.services.competitor_service import CompetitorService
from app.services.comparison_engine import PriceComparisonEngine
from app.services.report_service import PricingReportService

def test_competitor_db_models(app):
    """Test normalized competitor database model relationships and serialization."""
    with app.app_context():
        # Create internal category & product
        cat = Category(category_name="electronics_test")
        db.session.add(cat)
        db.session.flush()

        prod = Product(product_id="TEST-SKU-001", current_price=100.0, category_id=cat.id)
        db.session.add(prod)
        db.session.flush()

        # Create competitor
        comp = Competitor(name="TechStore BR", website_url="https://techstore.br", country="BR", trust_score=0.9)
        db.session.add(comp)
        db.session.flush()

        # Create competitor category & product
        comp_cat = CompetitorCategory(competitor_id=comp.id, category_name="Gadgets")
        db.session.add(comp_cat)
        db.session.flush()

        comp_prod = CompetitorProduct(
            competitor_id=comp.id,
            product_id=prod.id,
            internal_product_sku=prod.product_id,
            competitor_sku="COMP-TECH-01",
            title="TechStore Gadget X",
            category_id=comp_cat.id
        )
        db.session.add(comp_prod)
        db.session.flush()

        # Add price ledger record
        comp_price = CompetitorPrice(
            competitor_product_id=comp_prod.id,
            price=90.0,
            currency="BRL",
            source="MANUAL",
            availability="in_stock"
        )
        db.session.add(comp_price)
        db.session.commit()

        # Assertions
        fetched_comp = Competitor.query.filter_by(name="TechStore BR").first()
        assert fetched_comp is not None
        assert fetched_comp.trust_score == 0.9
        assert len(fetched_comp.products) == 1

        comp_dict = fetched_comp.to_dict()
        assert comp_dict['name'] == "TechStore BR"

        prod_dict = comp_prod.to_dict()
        assert prod_dict['competitor_sku'] == "COMP-TECH-01"
        assert prod_dict['latest_price'] == 90.0

def test_competitor_crud_apis(client):
    """Test REST API CRUD operations on /api/competitors."""
    # 1. Create Competitor
    create_res = client.post('/api/competitors', json={
        'name': 'Magalu Test',
        'website_url': 'https://magalu.com.br',
        'country': 'BR',
        'trust_score': 0.95
    })
    assert create_res.status_code == 201
    comp_id = create_res.get_json()['competitor']['id']

    # 2. Fetch Competitors list
    list_res = client.get('/api/competitors')
    assert list_res.status_code == 200
    assert list_res.get_json()['count'] >= 1

    # 3. Get single competitor
    get_res = client.get(f'/api/competitors/{comp_id}')
    assert get_res.status_code == 200
    assert get_res.get_json()['competitor']['name'] == 'Magalu Test'

    # 4. Update competitor
    put_res = client.put(f'/api/competitors/{comp_id}', json={
        'trust_score': 0.98,
        'country': 'BR'
    })
    assert put_res.status_code == 200
    assert put_res.get_json()['competitor']['trust_score'] == 0.98

    # 5. Delete competitor
    del_res = client.delete(f'/api/competitors/{comp_id}')
    assert del_res.status_code == 200

    # Verify 404 after delete
    assert client.get(f'/api/competitors/{comp_id}').status_code == 404

def test_data_ingestion_and_validation(app):
    """Test data collection ingestion & rejection of invalid records."""
    with app.app_context():
        # Valid and Invalid Records
        records = [
            # Valid Record
            {
                'competitor_name': 'IngestComp A',
                'competitor_sku': 'SKU-VAL-01',
                'title': 'Valid Item A',
                'price': 150.0,
                'currency': 'BRL',
                'availability': 'in_stock'
            },
            # Invalid Record 1: Negative Price
            {
                'competitor_name': 'IngestComp A',
                'competitor_sku': 'SKU-INV-01',
                'title': 'Negative Price Item',
                'price': -45.0,
                'currency': 'BRL'
            },
            # Invalid Record 2: Missing Price
            {
                'competitor_name': 'IngestComp A',
                'competitor_sku': 'SKU-INV-02',
                'title': 'No Price Item'
            },
            # Invalid Record 3: Unsupported Currency
            {
                'competitor_name': 'IngestComp A',
                'competitor_sku': 'SKU-INV-03',
                'title': 'Bitcoin Price Item',
                'price': 100.0,
                'currency': 'BTC'
            }
        ]

        res = CompetitorService.ingest_price_records(records, default_source='API')
        assert res['success_count'] == 1
        assert res['rejected_count'] == 3
        assert len(res['errors']) == 3

def test_csv_import_api(client):
    """Test CSV file ingestion API endpoint."""
    csv_data = (
        "competitor_name,competitor_sku,internal_product_sku,title,price,currency,availability\n"
        "Retailer X,RET-101,PROD-101,Widget X,120.00,BRL,in_stock\n"
        "Retailer Y,RET-102,PROD-101,Widget X,140.00,BRL,in_stock\n"
        "Retailer Z,RET-103,PROD-101,Widget X,-10.00,BRL,in_stock\n" # Should be rejected
    )

    res = client.post(
        '/api/competitors/import/csv',
        data=csv_data.encode('utf-8'),
        content_type='text/csv'
    )
    assert res.status_code == 200
    json_data = res.get_json()['result']
    assert json_data['success_count'] == 2
    assert json_data['rejected_count'] == 1

def test_price_comparison_engine(app):
    """Test PriceComparisonEngine min, max, avg, gap %, and position labeling logic."""
    with app.app_context():
        # Setup internal product
        prod = Product(product_id="COMP-ENGINE-SKU", current_price=100.0)
        db.session.add(prod)
        db.session.commit()

        # Ingest 3 competitor prices: 80, 100, 120 (Avg = 100)
        records = [
            {'competitor_name': 'Comp 1', 'competitor_sku': 'SKU-1', 'internal_product_sku': 'COMP-ENGINE-SKU', 'title': 'P1', 'price': 80.0},
            {'competitor_name': 'Comp 2', 'competitor_sku': 'SKU-2', 'internal_product_sku': 'COMP-ENGINE-SKU', 'title': 'P1', 'price': 100.0},
            {'competitor_name': 'Comp 3', 'competitor_sku': 'SKU-3', 'internal_product_sku': 'COMP-ENGINE-SKU', 'title': 'P1', 'price': 120.0}
        ]
        CompetitorService.ingest_price_records(records)

        comp_res = PriceComparisonEngine.compare_product(prod)
        assert comp_res['our_price'] == 100.0
        assert comp_res['lowest_competitor_price'] == 80.0
        assert comp_res['highest_competitor_price'] == 120.0
        assert comp_res['average_competitor_price'] == 100.0
        assert comp_res['price_difference'] == 0.0
        assert comp_res['price_difference_pct'] == 0.0
        assert comp_res['price_position'] == 'Competitive'
        assert comp_res['competitor_count'] == 3

        # Test Position Classifications
        # 1. Our price 75 < lowest 80 => Lowest
        assert PriceComparisonEngine.classify_price_position(75.0, 80.0, 120.0, 100.0) == "Lowest"
        # 2. Our price 90 within [lowest, avg] => Competitive
        assert PriceComparisonEngine.classify_price_position(90.0, 80.0, 120.0, 100.0) == "Competitive"
        # 3. Our price 110 > avg 100 but <= max 120 => Premium
        assert PriceComparisonEngine.classify_price_position(110.0, 80.0, 120.0, 100.0) == "Premium"
        # 4. Our price 130 > max 120 => Overpriced
        assert PriceComparisonEngine.classify_price_position(130.0, 80.0, 120.0, 100.0) == "Overpriced"

def test_report_generation_and_export(client, app):
    """Test report generation service and export endpoints (CSV, Excel, PDF)."""
    with app.app_context():
        prod = Product(product_id="REPORT-TEST-SKU", current_price=200.0)
        db.session.add(prod)
        db.session.commit()

        CompetitorService.ingest_price_records([
            {'competitor_name': 'ReportComp', 'competitor_sku': 'RC-1', 'internal_product_sku': 'REPORT-TEST-SKU', 'title': 'R1', 'price': 150.0}
        ])

    # 1. Export CSV
    csv_res = client.get('/api/competitors/reports/export?format=csv')
    assert csv_res.status_code == 200
    assert csv_res.content_type == 'text/csv'
    assert b'Our Price (BRL)' in csv_res.data

    # 2. Export Excel
    excel_res = client.get('/api/competitors/reports/export?format=excel')
    assert excel_res.status_code == 200
    assert excel_res.content_type in ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']

    # 3. Export PDF
    pdf_res = client.get('/api/competitors/reports/export?format=pdf')
    assert pdf_res.status_code == 200
    assert pdf_res.content_type in ['application/pdf', 'text/plain']

def test_comparison_api_endpoint(client):
    """Test /api/competitors/comparison endpoint."""
    res = client.get('/api/competitors/comparison?limit=10')
    assert res.status_code == 200
    data = res.get_json()
    assert 'summary' in data
    assert 'comparisons' in data
    assert 'total_competitors_tracked' in data['summary']
