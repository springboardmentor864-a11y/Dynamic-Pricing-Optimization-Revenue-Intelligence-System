from flask import Blueprint, request, send_file, jsonify, Response
from app.services.executive_report_service import ExecutiveReportService

report_bp = Blueprint('reports', __name__)

@report_bp.route('/export', methods=['GET'])
def export_executive_report():
    """
    Generate downloadable Executive Reports in PDF, Excel, or CSV format.
    ---
    tags:
      - Executive Reports
    parameters:
      - in: query
        name: report_type
        type: string
        default: Executive Summary
      - in: query
        name: format
        type: string
        default: pdf
      - in: query
        name: category_id
        type: integer
    responses:
      200:
        description: Downloadable report file stream
    """
    try:
        report_type = request.args.get('report_type', default='Executive Summary')
        file_format = request.args.get('format', default='pdf')
        category_id = request.args.get('category_id', type=int)

        file_bytes, mime_type, filename = ExecutiveReportService.generate_report(
            report_type=report_type,
            file_format=file_format,
            category_id=category_id
        )

        return Response(
            file_bytes,
            mimetype=mime_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        return jsonify({'error': f'Report generation failed: {str(e)}'}), 500
