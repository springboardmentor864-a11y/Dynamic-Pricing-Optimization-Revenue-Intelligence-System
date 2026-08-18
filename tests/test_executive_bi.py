import io
import pytest
from app.models import db, Product
from app.services.executive_bi_service import ExecutiveBIService
from app.services.executive_report_service import ExecutiveReportService
from app.services.alert_service import AlertService
from app.services.monitoring_service import MonitoringService

def test_executive_bi_kpis_and_drilldown(app):
    """Test Executive BI KPI aggregation and hierarchical drilldown."""
    with app.app_context():
        p1 = Product(product_id="EXEC-SKU-1", current_price=150.0, cost_price=80.0)
        p2 = Product(product_id="EXEC-SKU-2", current_price=90.0, cost_price=70.0)
        db.session.add_all([p1, p2])
        db.session.commit()

        exec_data = ExecutiveBIService.get_executive_overview()
        kpis = exec_data['executive_kpis']

        assert kpis['total_revenue'] > 0.0
        assert kpis['projected_profit'] > 0.0
        assert 'forecast_accuracy_pct' in kpis

        drilldown = ExecutiveBIService.get_hierarchical_drilldown(dimension='category')
        assert drilldown['dimension'] == 'category'
        assert isinstance(drilldown['items'], list)

def test_executive_report_generation(app):
    """Test multi-format PDF, Excel, and CSV report generation across all 8 report types."""
    with app.app_context():
        report_types = [
            'Executive Summary',
            'Revenue Report',
            'Profit Report',
            'Market Intelligence Report',
            'Competitor Analysis Report',
            'Forecast Report',
            'Pricing Recommendation Report',
            'Simulation Report'
        ]
        
        for rtype in report_types:
            # 1. PDF Generation
            pdf_bytes, pdf_mime, pdf_fname = ExecutiveReportService.generate_report(rtype, 'pdf')
            assert pdf_mime == 'application/pdf'
            assert pdf_fname.endswith('.pdf')
            assert len(pdf_bytes) > 0

            # 2. Excel Generation
            xlsx_bytes, xlsx_mime, xlsx_fname = ExecutiveReportService.generate_report(rtype, 'xlsx')
            assert xlsx_mime == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            assert xlsx_fname.endswith('.xlsx')
            assert len(xlsx_bytes) > 0

            # 3. CSV Generation
            csv_bytes, csv_mime, csv_fname = ExecutiveReportService.generate_report(rtype, 'csv')
            assert csv_mime == 'text/csv'
            assert csv_fname.endswith('.csv')
            assert len(csv_bytes) > 0

def test_alert_service(app):
    """Test active business alert triggers and severity classifications."""
    with app.app_context():
        # Low margin product -> Margin Risk Alert
        p_low = Product(product_id="ALERT-SKU-LOW", current_price=50.0, cost_price=48.0)
        db.session.add(p_low)
        db.session.commit()

        alert_res = AlertService.get_active_business_alerts()
        assert alert_res['summary']['total_alerts'] > 0
        assert len(alert_res['alerts']) > 0

def test_monitoring_service(app):
    """Test system health evaluation, database connectivity, and process metrics."""
    with app.app_context():
        health = MonitoringService.get_system_health()
        assert health['system_status'] == 'OPERATIONAL'
        assert health['database']['status'] == 'HEALTHY'
        assert health['memory_usage_mb'] > 0
        assert health['response_latency_ms'] >= 0

def test_executive_bi_apis(client, app):
    """Test REST API endpoints under /api/bi, /api/reports, /api/alerts, and /api/monitoring."""
    with app.app_context():
        prod = Product(product_id="EXEC-API-SKU", current_price=100.0)
        db.session.add(prod)
        db.session.commit()

    # 1. GET /api/bi/overview
    res_bi = client.get('/api/bi/overview')
    assert res_bi.status_code == 200
    assert 'executive_kpis' in res_bi.get_json()

    # 2. GET /api/bi/drilldown
    res_drill = client.get('/api/bi/drilldown?dimension=category')
    assert res_drill.status_code == 200
    assert 'items' in res_drill.get_json()

    # 3. GET /api/reports/export (PDF)
    res_rep_pdf = client.get('/api/reports/export?report_type=Executive%20Summary&format=pdf')
    assert res_rep_pdf.status_code == 200
    assert res_rep_pdf.mimetype == 'application/pdf'

    # 4. GET /api/reports/export (CSV)
    res_rep_csv = client.get('/api/reports/export?report_type=Revenue%20Report&format=csv')
    assert res_rep_csv.status_code == 200
    assert res_rep_csv.mimetype == 'text/csv'

    # 5. GET /api/alerts
    res_alerts = client.get('/api/alerts')
    assert res_alerts.status_code == 200
    assert 'alerts' in res_alerts.get_json()

    # 6. POST /api/alerts/acknowledge
    res_ack = client.post('/api/alerts/acknowledge', json={'alert_id': 'ALERT-123'})
    assert res_ack.status_code == 200

    # 7. GET /api/monitoring/health
    res_health = client.get('/api/monitoring/health')
    assert res_health.status_code == 200
    assert res_health.get_json()['system_status'] == 'OPERATIONAL'
