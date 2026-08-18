import io
from flask import Blueprint, request, jsonify, make_response
from app.models import db, Competitor, CompetitorProduct, CompetitorPrice, Product
from app.services.competitor_service import CompetitorService
from app.services.comparison_engine import PriceComparisonEngine
from app.services.report_service import PricingReportService

competitor_bp = Blueprint('competitors', __name__)

@competitor_bp.route('', methods=['POST'])
def create_competitor():
    """
    Create a new competitor.
    ---
    tags:
      - Competitors
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
          properties:
            name:
              type: string
            website_url:
              type: string
            country:
              type: string
            trust_score:
              type: number
    responses:
      210:
        description: Competitor created successfully
      400:
        description: Validation error
    """
    try:
        data = request.get_json() or {}
        name = data.get('name')
        if not name or not str(name).strip():
            return jsonify({'error': 'Competitor name is required'}), 400

        competitor = CompetitorService.get_or_create_competitor(
            name=name,
            website_url=data.get('website_url'),
            country=data.get('country', 'BR'),
            trust_score=data.get('trust_score', 1.0)
        )
        return jsonify({
            'message': 'Competitor created successfully',
            'competitor': competitor.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to create competitor: {str(e)}'}), 500

@competitor_bp.route('', methods=['GET'])
def fetch_competitors():
    """
    Fetch all active competitors.
    ---
    tags:
      - Competitors
    responses:
      200:
        description: List of competitors
    """
    try:
        competitors = Competitor.query.order_by(Competitor.name.asc()).all()
        return jsonify({
            'count': len(competitors),
            'competitors': [c.to_dict() for c in competitors]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/<int:competitor_id>', methods=['GET'])
def get_competitor(competitor_id):
    """
    Fetch a single competitor by ID.
    ---
    tags:
      - Competitors
    """
    competitor = Competitor.query.get_or_404(competitor_id)
    return jsonify({'competitor': competitor.to_dict()}), 200

@competitor_bp.route('/<int:competitor_id>', methods=['PUT'])
def update_competitor(competitor_id):
    """
    Update an existing competitor.
    ---
    tags:
      - Competitors
    """
    try:
        competitor = Competitor.query.get_or_404(competitor_id)
        data = request.get_json() or {}

        if 'name' in data:
            if not data['name'] or not str(data['name']).strip():
                return jsonify({'error': 'Competitor name cannot be empty'}), 400
            competitor.name = str(data['name']).strip()
        if 'website_url' in data:
            competitor.website_url = str(data['website_url']).strip() if data['website_url'] else None
        if 'country' in data:
            competitor.country = str(data['country']).strip()
        if 'trust_score' in data:
            try:
                competitor.trust_score = float(data['trust_score'])
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid trust_score format'}), 400
        if 'is_active' in data:
            competitor.is_active = bool(data['is_active'])

        db.session.commit()
        return jsonify({
            'message': 'Competitor updated successfully',
            'competitor': competitor.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/<int:competitor_id>', methods=['DELETE'])
def delete_competitor(competitor_id):
    """
    Delete a competitor and associated products/prices.
    ---
    tags:
      - Competitors
    """
    try:
        competitor = Competitor.query.get_or_404(competitor_id)
        db.session.delete(competitor)
        db.session.commit()
        return jsonify({'message': f'Competitor {competitor_id} deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/products', methods=['POST'])
def create_competitor_product():
    """
    Create or map a competitor product.
    ---
    tags:
      - Competitor Products
    """
    try:
        data = request.get_json() or {}
        comp_id = data.get('competitor_id')
        comp_sku = data.get('competitor_sku')
        title = data.get('title')

        if not comp_id or not comp_sku or not title:
            return jsonify({'error': 'competitor_id, competitor_sku, and title are required'}), 400

        comp_prod = CompetitorService.get_or_create_competitor_product(
            competitor_id=comp_id,
            competitor_sku=comp_sku,
            title=title,
            internal_product_sku=data.get('internal_product_sku') or data.get('product_id'),
            brand=data.get('brand'),
            category_name=data.get('category_name'),
            product_url=data.get('product_url')
        )
        return jsonify({
            'message': 'Competitor product created/mapped successfully',
            'competitor_product': comp_prod.to_dict()
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/products', methods=['GET'])
def fetch_competitor_products():
    """
    Fetch list of competitor products.
    ---
    tags:
      - Competitor Products
    """
    try:
        comp_id = request.args.get('competitor_id', type=int)
        query = CompetitorProduct.query
        if comp_id:
            query = query.filter_by(competitor_id=comp_id)

        products = query.order_by(CompetitorProduct.id.desc()).all()
        return jsonify({
            'count': len(products),
            'competitor_products': [p.to_dict() for p in products]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/prices', methods=['POST'])
def ingest_price():
    """
    Ingest a single price update (API / Manual entry).
    ---
    tags:
      - Competitor Prices
    """
    try:
        data = request.get_json() or {}
        result = CompetitorService.ingest_price_records([data], default_source=data.get('source', 'MANUAL'))

        if result['rejected_count'] > 0:
            err_msg = result['errors'][0]['reason'] if result['errors'] else 'Invalid record'
            return jsonify({'error': err_msg, 'details': result}), 400

        return jsonify({
            'message': 'Price record ingested successfully',
            'result': result
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/import/csv', methods=['POST'])
def import_csv():
    """
    Bulk ingest competitor prices via CSV file upload or text.
    ---
    tags:
      - Competitor Prices
    """
    try:
        if 'file' in request.files:
            file = request.files['file']
            if not file.filename:
                return jsonify({'error': 'No selected file'}), 400
            csv_content = file.read()
        elif request.data:
            csv_content = request.data
        else:
            return jsonify({'error': 'No CSV file or data provided'}), 400

        result = CompetitorService.ingest_csv_stream(csv_content, default_source='CSV')
        return jsonify({
            'message': f"CSV Ingestion complete: {result['success_count']} inserted, {result['rejected_count']} rejected.",
            'result': result
        }), 200 if result['success_count'] > 0 else 400
    except Exception as e:
        return jsonify({'error': f'CSV Ingestion failed: {str(e)}'}), 500

@competitor_bp.route('/prices/history', methods=['GET'])
def fetch_historical_prices():
    """
    Fetch historical price ledger for a product or competitor SKU.
    ---
    tags:
      - Competitor Prices
    """
    try:
        comp_prod_id = request.args.get('competitor_product_id', type=int)
        product_sku = request.args.get('product_sku')
        limit = request.args.get('limit', default=50, type=int)

        query = CompetitorPrice.query

        if comp_prod_id:
            query = query.filter_by(competitor_product_id=comp_prod_id)
        elif product_sku:
            comp_prods = CompetitorProduct.query.filter(
                (CompetitorProduct.internal_product_sku == product_sku) |
                (CompetitorProduct.competitor_sku == product_sku)
            ).all()
            ids = [cp.id for cp in comp_prods]
            if not ids:
                return jsonify({'count': 0, 'history': []}), 200
            query = query.filter(CompetitorPrice.competitor_product_id.in_(ids))

        history = query.order_by(CompetitorPrice.recorded_at.desc()).limit(limit).all()
        return jsonify({
            'count': len(history),
            'history': [h.to_dict() for h in history]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/comparison', methods=['GET'])
def get_comparison():
    """
    Fetch catalog-wide or single product price comparison analysis.
    ---
    tags:
      - Price Comparison Engine
    """
    try:
        category_id = request.args.get('category_id', type=int)
        position_filter = request.args.get('position')
        search_query = request.args.get('search')
        limit = request.args.get('limit', default=50, type=int)
        offset = request.args.get('offset', default=0, type=int)

        result = PriceComparisonEngine.get_catalog_comparison(
            category_id=category_id,
            position_filter=position_filter,
            search_query=search_query,
            limit=limit,
            offset=offset
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@competitor_bp.route('/reports/export', methods=['GET'])
def export_report():
    """
    Export price comparison reports in CSV, Excel, or PDF format.
    ---
    tags:
      - Pricing Reports
    """
    try:
        fmt = request.args.get('format', 'csv').lower()
        category_id = request.args.get('category_id', type=int)
        position_filter = request.args.get('position')
        search_query = request.args.get('search')

        report_data = PricingReportService.generate_report_data(
            category_id=category_id,
            position_filter=position_filter,
            search_query=search_query
        )

        if fmt == 'csv':
            csv_data = PricingReportService.export_csv(report_data)
            response = make_response(csv_data)
            response.headers["Content-Disposition"] = "attachment; filename=price_comparison_report.csv"
            response.headers["Content-Type"] = "text/csv"
            return response

        elif fmt in ['excel', 'xlsx']:
            content, mime, ext = PricingReportService.export_excel(report_data)
            response = make_response(content)
            response.headers["Content-Disposition"] = f"attachment; filename=price_comparison_report.{ext}"
            response.headers["Content-Type"] = mime
            return response

        elif fmt == 'pdf':
            content, mime, ext = PricingReportService.export_pdf(report_data)
            response = make_response(content)
            response.headers["Content-Disposition"] = f"attachment; filename=price_comparison_report.{ext}"
            response.headers["Content-Type"] = mime
            return response

        else:
            return jsonify({'error': f'Unsupported export format: {fmt}. Use csv, excel, or pdf.'}), 400

    except Exception as e:
        return jsonify({'error': f'Report export failed: {str(e)}'}), 500
