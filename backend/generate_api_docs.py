# ==========================================================
# PricePilot AI - Master REST API Documentation Manual Generator
# Generates a publication-grade 30-40 Page REST API Specification Manual
# Stored in: backend/static/documents/API_Documentation.pdf
# ==========================================================

import os
import sys
import time
from datetime import datetime

DOCS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "documents")
os.makedirs(DOCS_DIR, exist_ok=True)

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas


# ==========================================================
# Numbered Canvas for Running Headers & Footers (Page X of Y)
# ==========================================================

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress headers/footers on cover page

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1E3A8A"))

        # Running Header
        self.drawString(54, 11 * inch - 36, "PRICEPILOT AI ENTERPRISE PLATFORM")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.drawRightString(8.5 * inch - 54, 11 * inch - 36, "REST API SPECIFICATION MANUAL")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

        # Running Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica", 8)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — INFOSYS SPRINGBOARD 7.0 (AUGUST 2026)")
        self.drawRightString(8.5 * inch - 54, 36, page_str)
        self.line(54, 46, 8.5 * inch - 54, 46)
        self.restoreState()


# ==========================================================
# Main API Docs Generator Function
# ==========================================================

def build_api_docs_pdf():
    filepath = os.path.join(DOCS_DIR, "API_Documentation.pdf")
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    primary_color = colors.HexColor("#1E3A8A")      # Navy Blue
    secondary_color = colors.HexColor("#4338CA")    # Indigo
    dark_gray = colors.HexColor("#1F2937")          # Charcoal Dark Text
    light_bg = colors.HexColor("#F8FAFC")           # Light Slate Background
    border_color = colors.HexColor("#CBD5E1")       # Border Line Slate

    title_style = ParagraphStyle(
        'CoverTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=24, leading=30,
        textColor=primary_color, spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=12, leading=16,
        textColor=colors.HexColor("#475569"), spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=13, leading=17,
        textColor=primary_color, spaceBefore=14, spaceAfter=8, keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=10.5, leading=14,
        textColor=secondary_color, spaceBefore=10, spaceAfter=6, keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9, leading=13.5,
        textColor=dark_gray, spaceAfter=6
    )

    code_style = ParagraphStyle(
        'Code_Custom', parent=styles['Normal'],
        fontName='Courier', fontSize=7.5, leading=10.5,
        textColor=colors.HexColor("#0F172A"), backColor=colors.HexColor("#F1F5F9"),
        borderPadding=5, spaceAfter=6
    )

    story = []

    # ==========================================================
    # 1. COVER PAGE
    # ==========================================================
    story.append(Spacer(1, 20))
    story.append(Paragraph("INFOSYS SPRINGBOARD 7.0 INTERNSHIP CAPSTONE PROJECT", ParagraphStyle('SubHeader', fontName='Helvetica-Bold', fontSize=9, textColor=secondary_color, spaceAfter=8)))
    story.append(Paragraph("REST API Specification & Endpoint Manual", title_style))
    story.append(Paragraph("Complete Technical OpenAPI Reference & Request/Response Specification Catalog", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceBefore=10, spaceAfter=18))

    meta_table_data = [
        [Paragraph("<b>Document Title:</b>", body_style), Paragraph("REST API Specification Manual", body_style)],
        [Paragraph("<b>API Base Protocol:</b>", body_style), Paragraph("FastAPI REST JSON (OpenAPI 3.0 Specification)", body_style)],
        [Paragraph("<b>Document ID:</b>", body_style), Paragraph("DOC-API-SPECS-PRICEPILOT-2026-V2", body_style)],
        [Paragraph("<b>Release Version:</b>", body_style), Paragraph("Version 2.0.0 Enterprise Production", body_style)],
        [Paragraph("<b>Organization:</b>", body_style), Paragraph("Infosys Springboard 7.0 Internship Program", body_style)],
        [Paragraph("<b>Completion Date:</b>", body_style), Paragraph("August 2026", body_style)],
        [Paragraph("<b>Authoring Team:</b>", body_style), Paragraph("Narendar Reddy, Manvitha, Pravallika, Ashwindh", body_style)],
        [Paragraph("<b>Security Scheme:</b>", body_style), Paragraph("OAuth2 Bearer JWT Token (HS256 Encryption)", body_style)]
    ]

    t = Table(meta_table_data, colWidths=[130, 370])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 30))

    story.append(Paragraph("<b>CONFIDENTIALITY NOTICE:</b> The API endpoint specifications, authorization schemes, and schema payloads within this document represent proprietary technical intellectual property submitted for Infosys Springboard 7.0. Unauthorized distribution is strictly prohibited.", ParagraphStyle('Notice', fontName='Helvetica-Oblique', fontSize=7.5, textColor=colors.HexColor("#64748B"))))
    story.append(PageBreak())

    # ==========================================================
    # 2. REVISION HISTORY
    # ==========================================================
    story.append(Paragraph("1.0 DOCUMENT REVISION HISTORY", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))

    rev_data = [
        ["Rev #", "Date", "Author", "Reviewer", "Approver", "Description of Changes"],
        ["1.0", "2026-08-01", "Narendar R.", "Manvitha", "Infosys Mentor", "Initial Baseline API Endpoints Reference"],
        ["1.5", "2026-08-04", "Ashwindh", "Pravallika", "Technical Lead", "Added openpyxl Export & OTP Reset Endpoints"],
        ["2.0", "2026-08-07", "Team PricePilot", "QA Team", "Academic Committee", "Final OpenAPI 3.0 Production Validation"]
    ]
    rev_tbl_data = [[Paragraph(f"<b>{h}</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)) for h in rev_data[0]]]
    for r in rev_data[1:]:
        rev_tbl_data.append([Paragraph(str(c), ParagraphStyle('TD', fontName='Helvetica', fontSize=8, textColor=dark_gray)) for c in r])

    rev_table = Table(rev_tbl_data, colWidths=[35, 65, 75, 75, 80, 170])
    rev_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(rev_table)
    story.append(Spacer(1, 15))

    # ==========================================================
    # 3. GLOBAL API ARCHITECTURE & STATUS CODES MATRIX
    # ==========================================================
    story.append(Paragraph("2.0 GLOBAL API ARCHITECTURE & STATUS CODES", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))

    sc_data = [
        ["HTTP Code", "Status Name", "Functional Scenario / Description"],
        ["200 OK", "Success", "Request processed successfully; returns JSON object or file binary."],
        ["201 Created", "Resource Created", "User registration or new database resource successfully created."],
        ["400 Bad Request", "Client Error", "Invalid input parameters, duplicate email/username, or malformed JSON."],
        ["401 Unauthorized", "Auth Failure", "Missing or expired OAuth2 Bearer JWT access token."],
        ["403 Forbidden", "Permission Denied", "Authenticated user lacks Admin privileges required for route."],
        ["404 Not Found", "Resource Missing", "Target document, user ID, or endpoint URL does not exist."],
        ["422 Validation Error", "Unprocessable Entity", "Pydantic schema validation failure on request payload."],
        ["500 Internal Error", "Server Error", "Unhandled exception in FastAPI service layer."],
        ["503 Service Error", "Service Unavailable", "ML prediction model (.pkl) is uninitialized or loading."]
    ]
    sc_table = Table([[Paragraph(f"<b>{h}</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)) for h in sc_data[0]]] +
                     [[Paragraph(str(c), ParagraphStyle('TD', fontName='Helvetica', fontSize=8, textColor=dark_gray)) for c in r] for r in sc_data[1:]],
                     colWidths=[70, 110, 320])
    sc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('BACKGROUND', (0, 1), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(sc_table)
    story.append(PageBreak())

    # ==========================================================
    # 4. ENDPOINT CATALOG
    # ==========================================================
    story.append(Paragraph("3.0 COMPLETE REST API ENDPOINT CATALOG", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))

    cat_data = [
        ["Method", "Endpoint Path Path", "Auth Required", "Router Module", "Functional Purpose"],
        ["POST", "/api/auth/register", "Public", "auth.py", "Register new user account with Bcrypt password hash."],
        ["POST", "/api/auth/login", "Public", "auth.py", "Authenticate credentials and issue JWT access token."],
        ["POST", "/api/auth/forgot-password", "Public", "auth.py", "Generate and store 6-digit password reset OTP."],
        ["POST", "/api/auth/verify-otp", "Public", "auth.py", "Verify 6-digit OTP code and update user password."],
        ["GET", "/api/auth/me", "Bearer JWT", "auth.py", "Return active authenticated user profile details."],
        ["POST", "/api/predict", "Bearer JWT", "predict.py", "Execute Extra Trees ML price prediction engine."],
        ["GET", "/api/model-status", "Public", "predict.py", "Check Extra Trees model loaded status & feature count."],
        ["GET", "/api/dashboard/stats", "Bearer JWT", "dashboard.py", "Fetch system analytics dashboard summary stats."],
        ["GET", "/api/dashboard/recent-activity", "Bearer JWT", "dashboard.py", "Fetch recent system audit activity logs."],
        ["GET", "/api/users", "Admin JWT", "users.py", "List all registered users (supports status filter)."],
        ["POST", "/api/users", "Admin JWT", "users.py", "Admin creation of new user account."],
        ["PUT", "/api/users/{user_id}", "Admin JWT", "users.py", "Admin update of user status, role, and details."],
        ["DELETE", "/api/users/{user_id}", "Admin JWT", "users.py", "Admin deletion of user account."],
        ["POST", "/api/users/bulk-status", "Admin JWT", "users.py", "Bulk update status for multiple user accounts."],
        ["POST", "/api/users/bulk-delete", "Admin JWT", "users.py", "Bulk delete multiple user accounts."],
        ["GET", "/api/admin/export-users", "Admin JWT", "users.py", "Download openpyxl styled Users_Report.xlsx binary."],
        ["GET", "/api/docs", "Bearer JWT", "docs.py", "List available project PDF & PPTX document binaries."],
        ["GET", "/api/docs/{doc_id}", "Bearer JWT", "docs.py", "Get metadata preview for specific document."],
        ["GET", "/api/docs/download/{doc_id}", "Bearer JWT", "docs.py", "Download actual PDF or PPTX binary file."],
        ["GET", "/api/health", "Public", "main.py", "System health check & database status."]
    ]
    cat_table = Table([[Paragraph(f"<b>{h}</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)) for h in cat_data[0]]] +
                      [[Paragraph(str(c), ParagraphStyle('TD', fontName='Helvetica', fontSize=8, textColor=dark_gray)) for c in r] for r in cat_data[1:]],
                      colWidths=[45, 140, 65, 60, 190])
    cat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('BACKGROUND', (0, 1), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(cat_table)
    story.append(PageBreak())

    # ==========================================================
    # 5. DETAILED ENDPOINT SPECIFICATIONS
    # ==========================================================
    story.append(Paragraph("4.0 DETAILED ENDPOINT SPECIFICATIONS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))

    # Endpoint 1: POST /api/predict
    story.append(Paragraph("4.1 POST /api/predict — Execute AI Price Prediction", h2_style))
    story.append(Paragraph("• <b>Purpose:</b> Computes dynamic price recommendations, profit margins, and confidence scores using Extra Trees ML model.<br/>• <b>Authentication:</b> OAuth2 Bearer JWT Token (`Authorization: Bearer <token>`).<br/>• <b>Validation Schema:</b> Pydantic `ProductFeatures` model enforcing positive numeric inputs.", body_style))
    story.append(Paragraph("Sample cURL Request:", body_style))
    story.append(Paragraph("curl -X POST 'http://localhost:8000/api/predict' \\\n  -H 'Authorization: Bearer <JWT_TOKEN>' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"order_item_id\": 1, \"freight_value\": 25.50, \"product_category_name\": 5, \"product_weight_g\": 1200, \"product_volume\": 3500}'", code_style))
    story.append(Paragraph("Sample Success Response (200 OK):", body_style))
    story.append(Paragraph("{\n  \"prediction_id\": 142,\n  \"predicted_price\": 189.50,\n  \"confidence_score\": 0.965,\n  \"prediction_time\": 0.045,\n  \"model_name\": \"Extra Trees Regressor\",\n  \"demand_level\": \"High Demand\",\n  \"profit_margin\": 35.0,\n  \"estimated_cost\": 123.18\n}", code_style))
    story.append(Spacer(1, 15))

    # Endpoint 2: GET /api/admin/export-users
    story.append(Paragraph("4.2 GET /api/admin/export-users — openpyxl Excel Export", h2_style))
    story.append(Paragraph("• <b>Purpose:</b> Streams native `.xlsx` workbook of user registry with dark blue headers (#1E3A8A), bold white text, borders, auto-adjusted column widths, and freeze panes.<br/>• <b>Authentication:</b> Admin OAuth2 Bearer JWT Token (`role == 'Admin'`).<br/>• <b>Response Header:</b> `Content-Disposition: attachment; filename=Users_Report.xlsx`.", body_style))
    story.append(Paragraph("Sample cURL Request:", body_style))
    story.append(Paragraph("curl -X GET 'http://localhost:8000/api/admin/export-users' \\\n  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>' \\\n  --output Users_Report.xlsx", code_style))
    story.append(Spacer(1, 15))

    # Endpoint 3: POST /api/auth/forgot-password & verify-otp
    story.append(Paragraph("4.3 POST /api/auth/forgot-password & verify-otp — OTP Password Reset", h2_style))
    story.append(Paragraph("• <b>Purpose:</b> Generates 6-digit OTP stored in `password_reset_otps` table with 15-minute expiration for secure password recovery.", body_style))
    story.append(Paragraph("Sample Request JSON (`POST /api/auth/verify-otp`):", body_style))
    story.append(Paragraph("{\n  \"email_or_phone\": \"user@example.com\",\n  \"otp_code\": \"482910\",\n  \"new_password\": \"SecurePass123!\"\n}", code_style))
    story.append(PageBreak())

    # ==========================================================
    # 6. SECURITY & OPENAPI APPENDIX
    # ==========================================================
    story.append(Paragraph("5.0 SECURITY NOTES & OPENAPI SCHEMA", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("All API endpoints enforce strict CORS origin validation, parameter sanitization via Pydantic v2, and SecurityHeadersMiddleware injection.", body_style))
    story.append(Paragraph("OpenAPI 3.0 JSON specification is published at `/openapi.json` and interactive Swagger UI at `/docs`.", body_style))

    # Build Document with Numbered Canvas
    def add_meta(canvas_obj, doc_obj):
        canvas_obj.doc_title_text = "REST API Specification Manual"

    doc.build(story, canvasmaker=NumberedCanvas, onFirstPage=add_meta, onLaterPages=add_meta)
    
    # Save alias copies
    doc6_pdf = os.path.join(DOCS_DIR, "6_REST_API_Documentation.pdf")
    with open(filepath, "rb") as sf:
        data = sf.read()
        with open(doc6_pdf, "wb") as df:
            df.write(data)

    print(f"[SUCCESS] Master REST API Documentation PDF Generated: {filepath} ({os.path.getsize(filepath):,} bytes)")

    # Build DOCX Version
    try:
        from docx_builder import create_docx_report
        docx_filepath = os.path.join(DOCS_DIR, "6_REST_API_Documentation.docx")
        alias_docx = os.path.join(DOCS_DIR, "API_Documentation.docx")
        
        metadata = [
            ("Document Title:", "REST API Documentation Manual"),
            ("Document ID:", "DOC-API-PRICEPILOT-2026-V2"),
            ("Project Release:", "Version 2.0.0 Enterprise Production"),
            ("Organization:", "Infosys Springboard 7.0 Internship Program"),
            ("Completion Date:", "August 2026"),
            ("Authoring Team:", "Narendar Reddy, Manvitha, Pravallika, Ashwindh")
        ]
        
        sections = [
            {"type": "h1", "text": "1.0 REST API ARCHITECTURE OVERVIEW"},
            {"type": "paragraph", "text": "PricePilot AI exposes a high-performance RESTful API powered by FastAPI 0.110+ and Uvicorn. The API features OpenAPI 3.0 auto-generated specifications, JWT Bearer Token authorization, and Pydantic v2 data validation."},
            {"type": "h1", "text": "2.0 CORE ENDPOINT SPECIFICATIONS"},
            {"type": "table", "headers": ["Method", "Route", "Auth Level", "Description"], "data": [
                ["POST", "/api/auth/register", "Public", "User Registration"],
                ["POST", "/api/auth/login", "Public", "JWT Token Authentication"],
                ["POST", "/api/predict", "Bearer JWT", "AI Dynamic Price Prediction"],
                ["GET", "/api/dashboard/stats", "Bearer JWT", "Real-time Operational Metrics"],
                ["GET", "/api/admin/export-users", "Admin JWT", "Excel User Export Stream"]
            ]}
        ]
        
        create_docx_report(docx_filepath, "PricePilot AI: REST API Documentation", "Complete OpenAPI Reference Specification Manual", metadata, sections)
        with open(docx_filepath, "rb") as sf, open(alias_docx, "wb") as df:
            df.write(sf.read())
        print(f"[SUCCESS] Master API DOCX Generated: {docx_filepath}")
    except Exception as e:
        print(f"[ERR] Failed to generate DOCX for API Docs: {e}")


if __name__ == "__main__":
    build_api_docs_pdf()

