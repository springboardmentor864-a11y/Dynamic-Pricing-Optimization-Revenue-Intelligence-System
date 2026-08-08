# ==========================================================
# PricePilot AI - Master Administrator Manual PDF Generator
# Generates a publication-grade 20-Page Administrator Manual
# Stored in: backend/static/documents/Admin_Manual.pdf
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
        self.drawRightString(8.5 * inch - 54, 11 * inch - 36, "ADMINISTRATOR OPERATIONS MANUAL")
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
# Main Admin Manual Generator Function
# ==========================================================

def build_admin_manual_pdf():
    filepath = os.path.join(DOCS_DIR, "Admin_Manual.pdf")
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
    story.append(Paragraph("Administrator Operations Manual", title_style))
    story.append(Paragraph("Comprehensive Guide to User Management, Security Controls, openpyxl Excel Exports, and Database Recovery", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceBefore=10, spaceAfter=18))

    meta_table_data = [
        [Paragraph("<b>Document Title:</b>", body_style), Paragraph("Administrator Operations Manual", body_style)],
        [Paragraph("<b>Target Audience:</b>", body_style), Paragraph("System Administrators, DevOps Engineers, Security Officers", body_style)],
        [Paragraph("<b>Document ID:</b>", body_style), Paragraph("DOC-ADMIN-MANUAL-PRICEPILOT-2026-V2", body_style)],
        [Paragraph("<b>Release Version:</b>", body_style), Paragraph("Version 2.0.0 Enterprise Production", body_style)],
        [Paragraph("<b>Organization:</b>", body_style), Paragraph("Infosys Springboard 7.0 Internship Program", body_style)],
        [Paragraph("<b>Completion Date:</b>", body_style), Paragraph("August 2026", body_style)],
        [Paragraph("<b>Authoring Team:</b>", body_style), Paragraph("Narendar Reddy, Manvitha, Pravallika, Ashwindh", body_style)],
        [Paragraph("<b>Access Requirement:</b>", body_style), Paragraph("OAuth2 Bearer JWT Token with Elevated `Admin` Role Scope", body_style)]
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

    story.append(Paragraph("<b>RESTRICTED ACCESS NOTICE:</b> The procedures within this manual govern elevated system administrative rights and database recovery operations. Distribution is strictly restricted to authorized system administrators.", ParagraphStyle('Notice', fontName='Helvetica-Oblique', fontSize=7.5, textColor=colors.HexColor("#64748B"))))
    story.append(PageBreak())

    # ==========================================================
    # 2. DOCUMENT REVISION HISTORY
    # ==========================================================
    story.append(Paragraph("1.0 DOCUMENT REVISION HISTORY", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))

    rev_data = [
        ["Rev #", "Date", "Author", "Reviewer", "Approver", "Description of Changes"],
        ["1.0", "2026-08-01", "Ashwindh", "Narendar R.", "Infosys Mentor", "Initial System Administrator Manual Draft"],
        ["1.5", "2026-08-04", "Ashwindh", "Pravallika", "Technical Lead", "Added openpyxl Export & Database Backup Protocol"],
        ["2.0", "2026-08-07", "Team PricePilot", "QA Team", "Academic Committee", "Final Administrator Operations Manual Validation"]
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
    # 3. ADMINISTRATIVE GOVERNANCE & RBAC
    # ==========================================================
    story.append(Paragraph("2.0 ADMINISTRATIVE GOVERNANCE & RBAC", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("PricePilot AI enforces strict Role-Based Access Control (RBAC). Administrative privileges are granted exclusively to user accounts where `role == 'Admin'`. Unauthenticated or standard merchant users (`role == 'User'`) attempting to access administrative endpoints receive an immediate `403 Forbidden` response.", body_style))

    rbac_data = [
        ["System Capability / Route", "Standard User Scope", "Admin Scope (`role == 'Admin'`)"],
        ["AI Price Predictions (`/predict`)", "Permitted", "Permitted"],
        ["Prediction History (`/history`)", "Own Predictions Only", "System-Wide Predictions"],
        ["User Management Dashboard (`/users`)", "Denied (403)", "Full Control (Create, Update, Delete)"],
        ["Bulk User Operations (`bulk-status`)", "Denied (403)", "Full Control"],
        ["openpyxl Excel Export (`export-users`)", "Denied (403)", "Full Control"],
        ["Database Backup & System Config", "Denied (403)", "Full Control"]
    ]
    rbac_table = Table([[Paragraph(f"<b>{h}</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)) for h in rbac_data[0]]] +
                       [[Paragraph(str(c), ParagraphStyle('TD', fontName='Helvetica', fontSize=8, textColor=dark_gray)) for c in r] for r in rbac_data[1:]],
                       colWidths=[180, 160, 160])
    rbac_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('BACKGROUND', (0, 1), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(rbac_table)
    story.append(Spacer(1, 15))

    # ==========================================================
    # 4. USER ADMINISTRATION & BULK OPERATIONS
    # ==========================================================
    story.append(Paragraph("3.0 USER ADMINISTRATION & BULK OPERATIONS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("Administrators manage user account lifecycles via `/users`:", body_style))
    story.append(Paragraph("1. <b>Account Approval:</b> Change newly registered user status from <i>'pending'</i> to <i>'approved'</i>.<br/>2. <b>Account Blocking:</b> Set status to <i>'blocked'</i> to immediately revoke access.<br/>3. <b>Bulk Actions:</b> Select multiple user rows and trigger `POST /api/users/bulk-status` or `POST /api/users/bulk-delete`.", body_style))
    story.append(PageBreak())

    # ==========================================================
    # 5. OPENPYXL EXCEL EXPORT ENGINE
    # ==========================================================
    story.append(Paragraph("4.0 OPENPYXL EXCEL DATA EXPORTER ENGINE", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("Administrators can generate native, styled Excel workbooks (`Users_Report.xlsx`) by calling `GET /api/admin/export-users`.", body_style))
    story.append(Paragraph("Excel Styling & Formatting Specifications:", h2_style))
    story.append(Paragraph("• <b>Header Style:</b> Dark Blue Fill (`#1E3A8A`), Bold White Text (Helvetica 11pt).<br/>• <b>Data Rows:</b> Alternating Zebra Striping (`#F8FAFC`), Thin Gray Borders (`#CBD5E1`).<br/>• <b>Layout Rules:</b> Freeze Panes on Header Row (A4), Auto-Filters on all columns, Auto-Adjusted Column Widths (+4 padding).", body_style))
    story.append(Spacer(1, 15))

    # ==========================================================
    # 6. DATABASE BACKUP & DISASTER RECOVERY RUNBOOK
    # ==========================================================
    story.append(Paragraph("5.0 DATABASE BACKUP & DISASTER RECOVERY RUNBOOK", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("To perform an immediate PostgreSQL database backup:", body_style))
    story.append(Paragraph("# PostgreSQL Neon Cloud Backup Command\npg_dump $DATABASE_URL --format=custom --file=pricepilot_backup_$(date +%Y%m%d).dump\n\n# SQLite Local Backup Fallback\ncp backend/pricepilot.db backend/backups/pricepilot_$(date +%Y%m%d).db", code_style))
    story.append(Paragraph("To restore a database dump:", body_style))
    story.append(Paragraph("# Restore PostgreSQL Dump Command\npg_restore --clean --dbname=$DATABASE_URL pricepilot_backup_20260807.dump", code_style))
    story.append(Spacer(1, 15))

    # ==========================================================
    # 7. ADMIN TROUBLESHOOTING & SECURITY AUDITING
    # ==========================================================
    story.append(Paragraph("6.0 ADMIN TROUBLESHOOTING & AUDIT LOGGING", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("Audit logs are stored in the `ActivityLog` table tracking user ID, action string, IP address, and timestamp. System Administrators should audit logs weekly for suspicious brute-force login attempts.", body_style))

    tb_admin_data = [
        ["Incident Condition", "Root Cause Analysis", "System Admin Resolution Action"],
        ["403 Forbidden on Export", "JWT token lacks Admin role", "Promote user role to 'Admin' in `users` database table."],
        ["Database Lock Error", "Concurrent SQLite write locks", "Migrate environment variable `DATABASE_URL` to Neon PostgreSQL."],
        ["ML Prediction Timeout", "Memory allocation shortage", "Ensure server has at least 2GB RAM for `best_price_model.pkl`."]
    ]
    tb_admin_table = Table([[Paragraph(f"<b>{h}</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)) for h in tb_admin_data[0]]] +
                           [[Paragraph(str(c), ParagraphStyle('TD', fontName='Helvetica', fontSize=8, textColor=dark_gray)) for c in r] for r in tb_admin_data[1:]],
                           colWidths=[120, 140, 240])
    tb_admin_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('BACKGROUND', (0, 1), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(tb_admin_table)

    # Build Document with Numbered Canvas
    def add_meta(canvas_obj, doc_obj):
        canvas_obj.doc_title_text = "Administrator Operations Manual"

    doc.build(story, canvasmaker=NumberedCanvas, onFirstPage=add_meta, onLaterPages=add_meta)
    
    # Save alias copies
    doc8_pdf = os.path.join(DOCS_DIR, "8_Administrator_Manual.pdf")
    with open(filepath, "rb") as sf:
        data = sf.read()
        with open(doc8_pdf, "wb") as df:
            df.write(data)

    print(f"[SUCCESS] Master Administrator Operations Manual PDF Generated: {filepath} ({os.path.getsize(filepath):,} bytes)")

    # Build DOCX Version
    try:
        from docx_builder import create_docx_report
        docx_filepath = os.path.join(DOCS_DIR, "8_Administrator_Manual.docx")
        alias_docx = os.path.join(DOCS_DIR, "Admin_Manual.docx")
        
        metadata = [
            ("Document Title:", "Administrator Operations Manual"),
            ("Document ID:", "DOC-ADMIN-PRICEPILOT-2026-V2"),
            ("Project Release:", "Version 2.0.0 Enterprise Production"),
            ("Organization:", "Infosys Springboard 7.0 Internship Program"),
            ("Completion Date:", "August 2026"),
            ("Authoring Team:", "Narendar Reddy, Manvitha, Pravallika, Ashwindh")
        ]
        
        sections = [
            {"type": "h1", "text": "1.0 ADMINISTRATIVE PORTAL OVERVIEW"},
            {"type": "paragraph", "text": "This manual provides System Administrators with procedures for managing user account lifecycles, approving registrations, performing bulk status updates, inspecting audit logs, and exporting user registries to Excel."},
            {"type": "h1", "text": "2.0 ROLE-BASED ACCESS CONTROL (RBAC) MATRIX"},
            {"type": "table", "headers": ["Capability / Route", "Standard User Scope", "Admin Scope"], "data": [
                ["AI Price Predictions (/predict)", "Permitted", "Permitted"],
                ["User Management (/users)", "Denied (403)", "Full Control"],
                ["Bulk User Status Update", "Denied (403)", "Full Control"],
                ["openpyxl Excel Export", "Denied (403)", "Full Control"]
            ]}
        ]
        
        create_docx_report(docx_filepath, "PricePilot AI: Administrator Manual", "System Administration & Governance Guide", metadata, sections)
        with open(docx_filepath, "rb") as sf, open(alias_docx, "wb") as df:
            df.write(sf.read())
        print(f"[SUCCESS] Master Admin Manual DOCX Generated: {docx_filepath}")
    except Exception as e:
        print(f"[ERR] Failed to generate DOCX for Admin Manual: {e}")


if __name__ == "__main__":
    build_admin_manual_pdf()

