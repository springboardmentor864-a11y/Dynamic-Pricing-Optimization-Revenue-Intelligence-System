# ==========================================================
# PricePilot AI — Enterprise SRS Generator (IEEE Std 830-1998)
# Document 1 of 11 — Software Requirements Specification
# Target: 45-60 Pages | Professional PDF with Diagrams & Tables
# ==========================================================

import os
import sys
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, ListFlowable, ListItem,
    Flowable
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle, Polygon
from reportlab.graphics import renderPDF
from reportlab.pdfgen import canvas

# ============================================================
# NUMBERED CANVAS — Page Headers / Footers / Page Numbers
# ============================================================

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
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
        page_num = len([s for s in self._saved_page_states if s.get('_pageNumber', 0) <= self._pageNumber])
        # Header
        self.setFont("Helvetica", 8)
        self.setFillColor(HexColor("#6B7280"))
        self.drawString(55, A4[1] - 30, "PricePilot AI Enterprise Platform")
        self.drawRightString(A4[0] - 55, A4[1] - 30, "Software Requirements Specification v2.1")
        self.setStrokeColor(HexColor("#E5E7EB"))
        self.setLineWidth(0.5)
        self.line(55, A4[1] - 35, A4[0] - 55, A4[1] - 35)
        # Footer
        self.line(55, 40, A4[0] - 55, 40)
        self.setFillColor(HexColor("#6B7280"))
        self.drawString(55, 28, "CONFIDENTIAL - Infosys Springboard 7.0")
        self.drawRightString(A4[0] - 55, 28, f"Page {self._pageNumber} of {page_count}")


# ============================================================
# DIAGRAM FLOWABLE — Draws embedded architecture diagrams
# ============================================================

class DiagramFlowable(Flowable):
    """Renders a box-based diagram as a ReportLab Drawing."""
    def __init__(self, width, height, draw_func, caption=""):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.draw_func = draw_func
        self.caption = caption

    def wrap(self, availWidth, availHeight):
        return self.width, self.height + 20

    def draw(self):
        self.canv.saveState()
        self.draw_func(self.canv, 0, 20, self.width, self.height)
        if self.caption:
            self.canv.setFont("Helvetica-Oblique", 8)
            self.canv.setFillColor(HexColor("#6B7280"))
            self.canv.drawCentredString(self.width / 2, 4, self.caption)
        self.canv.restoreState()


# ============================================================
# DIAGRAM DRAWING FUNCTIONS
# ============================================================

def draw_context_diagram(c, x, y, w, h):
    """Figure 4.1: System Context Diagram"""
    cx, cy = w/2, y + h/2
    # Central system box
    c.setFillColor(HexColor("#7C3AED"))
    c.roundRect(cx - 80, cy - 25, 160, 50, 8, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(cx, cy + 5, "PricePilot AI")
    c.setFont("Helvetica", 8)
    c.drawCentredString(cx, cy - 10, "Enterprise Platform")

    # External entities
    entities = [
        ("End User", cx - 220, cy + 80, HexColor("#2563EB")),
        ("Admin", cx - 220, cy - 80, HexColor("#DC2626")),
        ("SMTP / Twilio", cx + 180, cy + 80, HexColor("#059669")),
        ("Neon PostgreSQL", cx + 180, cy - 20, HexColor("#D97706")),
        ("ML Model (.pkl)", cx + 180, cy - 80, HexColor("#7C3AED")),
        ("Vercel CDN", cx - 60, cy + 120, HexColor("#0EA5E9")),
    ]
    for label, ex, ey, color in entities:
        c.setFillColor(color)
        c.roundRect(ex - 50, ey - 15, 100, 30, 6, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(ex, ey - 2, label)

    # Arrows (data flows)
    c.setStrokeColor(HexColor("#9CA3AF"))
    c.setLineWidth(1)
    arrows = [
        (cx - 170, cy + 80, cx - 80, cy + 10),
        (cx - 170, cy - 80, cx - 80, cy - 10),
        (cx + 80, cy + 10, cx + 130, cy + 80),
        (cx + 80, cy - 5, cx + 130, cy - 20),
        (cx + 80, cy - 15, cx + 130, cy - 80),
        (cx, cy + 25, cx - 20, cy + 105),
    ]
    for x1, y1, x2, y2 in arrows:
        c.line(x1, y1, x2, y2)

    # Flow labels
    c.setFillColor(HexColor("#4B5563"))
    c.setFont("Helvetica", 6)
    c.drawString(cx - 165, cy + 50, "HTTP Requests")
    c.drawString(cx - 165, cy - 55, "Admin Operations")
    c.drawString(cx + 90, cy + 50, "OTP Dispatch")
    c.drawString(cx + 90, cy - 10, "SQL Queries")
    c.drawString(cx + 90, cy - 55, "Inference")


def draw_usecase_diagram(c, x, y, w, h):
    """Figure 4.2: Use Case Diagram"""
    # Actor: User (left)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(HexColor("#2563EB"))
    ux, uy = 60, y + h/2 + 30
    c.circle(ux, uy + 15, 8, fill=0, stroke=1)
    c.line(ux, uy + 7, ux, uy - 10)
    c.line(ux - 10, uy, ux + 10, uy)
    c.line(ux, uy - 10, ux - 8, uy - 25)
    c.line(ux, uy - 10, ux + 8, uy - 25)
    c.drawCentredString(ux, uy - 35, "User")

    # Actor: Admin (left, lower)
    ax, ay = 60, y + h/2 - 80
    c.setFillColor(HexColor("#DC2626"))
    c.circle(ax, ay + 15, 8, fill=0, stroke=1)
    c.line(ax, ay + 7, ax, ay - 10)
    c.line(ax - 10, ay, ax + 10, ay)
    c.line(ax, ay - 10, ax - 8, ay - 25)
    c.line(ax, ay - 10, ax + 8, ay - 25)
    c.drawCentredString(ax, ay - 35, "Admin")

    # System boundary
    c.setStrokeColor(HexColor("#D1D5DB"))
    c.setLineWidth(1.5)
    c.roundRect(130, y + 10, 340, h - 20, 10, fill=0, stroke=1)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(HexColor("#1F2937"))
    c.drawCentredString(300, y + h - 20, "PricePilot AI System")

    # Use cases (ellipses)
    use_cases_user = [
        ("UC-01: Register Account", 280, y + h - 50),
        ("UC-02: Login (JWT)", 280, y + h - 80),
        ("UC-03: Predict Price (ML)", 280, y + h - 110),
        ("UC-04: View History", 280, y + h - 140),
        ("UC-05: View Analytics", 280, y + h - 170),
        ("UC-06: Forgot Password (OTP)", 280, y + h - 200),
    ]
    use_cases_admin = [
        ("UC-07: Manage Users (CRUD)", 280, y + 70),
        ("UC-08: Export Excel", 280, y + 40),
    ]

    c.setStrokeColor(HexColor("#7C3AED"))
    c.setLineWidth(1)
    for label, ecx, ecy in use_cases_user:
        c.ellipse(ecx - 95, ecy - 12, ecx + 95, ecy + 12, fill=0, stroke=1)
        c.setFont("Helvetica", 7)
        c.setFillColor(HexColor("#1F2937"))
        c.drawCentredString(ecx, ecy - 3, label)

    c.setStrokeColor(HexColor("#DC2626"))
    for label, ecx, ecy in use_cases_admin:
        c.ellipse(ecx - 95, ecy - 12, ecx + 95, ecy + 12, fill=0, stroke=1)
        c.setFont("Helvetica", 7)
        c.setFillColor(HexColor("#1F2937"))
        c.drawCentredString(ecx, ecy - 3, label)

    # Association lines
    c.setStrokeColor(HexColor("#9CA3AF"))
    c.setLineWidth(0.8)
    for _, ecx, ecy in use_cases_user:
        c.line(ux + 10, uy, ecx - 95, ecy)
    for _, ecx, ecy in use_cases_admin:
        c.line(ax + 10, ay, ecx - 95, ecy)
    # Admin also inherits user use cases
    for _, ecx, ecy in use_cases_user[:4]:
        c.setDash(3, 3)
        c.line(ax + 10, ay + 15, ecx - 95, ecy)
    c.setDash()


def draw_activity_diagram(c, x, y, w, h):
    """Figure 4.3: Prediction Activity Diagram"""
    cx = w / 2
    step_h = 28
    start_y = y + h - 20

    steps = [
        ("Start", HexColor("#059669")),
        ("User Enters Product Features", HexColor("#2563EB")),
        ("Validate Input (Pydantic V2)", HexColor("#7C3AED")),
        ("Load Extra Trees Model (joblib)", HexColor("#D97706")),
        ("Construct DataFrame (16 features)", HexColor("#7C3AED")),
        ("Execute model.predict()", HexColor("#DC2626")),
        ("Calculate Confidence & Demand", HexColor("#7C3AED")),
        ("Save to predictions Table", HexColor("#2563EB")),
        ("Save to prediction_history Table", HexColor("#2563EB")),
        ("Log to activity_logs Table", HexColor("#059669")),
        ("Return JSON Response", HexColor("#059669")),
        ("End", HexColor("#DC2626")),
    ]

    for i, (label, color) in enumerate(steps):
        sy = start_y - i * (step_h + 6)
        if i == 0 or i == len(steps) - 1:
            # Start/End circles
            c.setFillColor(color)
            c.circle(cx, sy, 10, fill=1, stroke=0)
            c.setFillColor(white)
            c.setFont("Helvetica-Bold", 7)
            c.drawCentredString(cx, sy - 3, label)
        else:
            c.setFillColor(color)
            c.roundRect(cx - 110, sy - 11, 220, 22, 5, fill=1, stroke=0)
            c.setFillColor(white)
            c.setFont("Helvetica", 7)
            c.drawCentredString(cx, sy - 3, label)

        # Arrow
        if i < len(steps) - 1:
            ny = start_y - (i + 1) * (step_h + 6)
            c.setStrokeColor(HexColor("#9CA3AF"))
            c.setLineWidth(1)
            c.line(cx, sy - 12, cx, ny + 12)


def draw_dfd_level0(c, x, y, w, h):
    """Figure 4.4: DFD Level 0"""
    cx, cy = w/2, y + h/2

    # Central process
    c.setFillColor(HexColor("#7C3AED"))
    c.circle(cx, cy, 40, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(cx, cy + 8, "0.0")
    c.drawCentredString(cx, cy - 5, "PricePilot AI")
    c.setFont("Helvetica", 6)
    c.drawCentredString(cx, cy - 15, "System")

    # External entities
    ext = [
        ("User / Admin", cx - 200, cy + 60, HexColor("#2563EB")),
        ("PostgreSQL DB", cx + 200, cy + 60, HexColor("#D97706")),
        ("ML Engine", cx + 200, cy - 60, HexColor("#059669")),
        ("Email / SMS", cx - 200, cy - 60, HexColor("#DC2626")),
    ]
    for label, ex, ey, color in ext:
        c.setFillColor(color)
        c.rect(ex - 55, ey - 15, 110, 30, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(ex, ey - 2, label)

    # Data flows
    c.setStrokeColor(HexColor("#6B7280"))
    c.setLineWidth(1)
    flows = [
        (cx - 145, cy + 60, cx - 40, cy + 20, "Credentials / Features"),
        (cx + 40, cy + 20, cx + 145, cy + 60, "SQL Queries / Results"),
        (cx + 40, cy - 20, cx + 145, cy - 60, "Predict Request"),
        (cx - 40, cy - 20, cx - 145, cy - 60, "OTP Dispatch"),
    ]
    for x1, y1, x2, y2, label in flows:
        c.line(x1, y1, x2, y2)
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        c.setFont("Helvetica", 5.5)
        c.setFillColor(HexColor("#4B5563"))
        c.drawCentredString(mx, my + 8, label)


def draw_dfd_level1(c, x, y, w, h):
    """Figure 4.5: DFD Level 1"""
    cx = w / 2
    processes = [
        ("1.0", "Authentication", cx - 150, y + h - 60, HexColor("#2563EB")),
        ("2.0", "Prediction", cx + 100, y + h - 60, HexColor("#7C3AED")),
        ("3.0", "Dashboard", cx - 150, y + h/2 - 20, HexColor("#059669")),
        ("4.0", "User Mgmt", cx + 100, y + h/2 - 20, HexColor("#DC2626")),
        ("5.0", "Documents", cx - 30, y + 40, HexColor("#D97706")),
    ]

    for pid, label, px, py, color in processes:
        c.setFillColor(color)
        c.circle(px, py, 28, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(px, py + 6, pid)
        c.setFont("Helvetica", 6)
        c.drawCentredString(px, py - 7, label)

    # Data stores
    stores = [
        ("D1: users", cx - 30, y + h - 120, HexColor("#F59E0B")),
        ("D2: predictions", cx + 200, y + h/2 + 30, HexColor("#F59E0B")),
        ("D3: activity_logs", cx - 200, y + 80, HexColor("#F59E0B")),
    ]
    for label, sx, sy, color in stores:
        c.setFillColor(HexColor("#FEF3C7"))
        c.rect(sx - 55, sy - 10, 110, 20, fill=1, stroke=0)
        c.setStrokeColor(color)
        c.setLineWidth(1)
        c.line(sx - 55, sy - 10, sx + 55, sy - 10)
        c.line(sx - 55, sy + 10, sx + 55, sy + 10)
        c.setFont("Helvetica", 6)
        c.setFillColor(HexColor("#92400E"))
        c.drawCentredString(sx, sy - 2, label)

    # Connections
    c.setStrokeColor(HexColor("#9CA3AF"))
    c.setLineWidth(0.8)
    c.line(cx - 150, y + h - 88, cx - 30, y + h - 110)
    c.line(cx + 100, y + h - 88, cx + 200, y + h/2 + 40)
    c.line(cx - 150, y + h/2 - 48, cx - 200, y + 90)


# ============================================================
# STYLES
# ============================================================

def get_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='CoverTitle', fontName='Helvetica-Bold', fontSize=28,
        textColor=HexColor("#7C3AED"), alignment=TA_CENTER, spaceAfter=12
    ))
    styles.add(ParagraphStyle(
        name='CoverSubtitle', fontName='Helvetica', fontSize=14,
        textColor=HexColor("#6B7280"), alignment=TA_CENTER, spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        name='ChapterTitle', fontName='Helvetica-Bold', fontSize=18,
        textColor=HexColor("#7C3AED"), spaceBefore=24, spaceAfter=12,
        borderWidth=0, borderPadding=0
    ))
    styles.add(ParagraphStyle(
        name='SectionTitle', fontName='Helvetica-Bold', fontSize=14,
        textColor=HexColor("#1E3A8A"), spaceBefore=16, spaceAfter=8
    ))
    styles.add(ParagraphStyle(
        name='SubSection', fontName='Helvetica-Bold', fontSize=11,
        textColor=HexColor("#374151"), spaceBefore=10, spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        name='BodyText2', fontName='Helvetica', fontSize=10,
        textColor=HexColor("#1F2937"), alignment=TA_JUSTIFY,
        spaceBefore=4, spaceAfter=4, leading=14
    ))
    styles.add(ParagraphStyle(
        name='FigureCaption', fontName='Helvetica-Oblique', fontSize=9,
        textColor=HexColor("#6B7280"), alignment=TA_CENTER,
        spaceBefore=4, spaceAfter=12
    ))
    styles.add(ParagraphStyle(
        name='TableHeader', fontName='Helvetica-Bold', fontSize=9,
        textColor=white, alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        name='CodeBlock', fontName='Courier', fontSize=8,
        textColor=HexColor("#1F2937"), backColor=HexColor("#F3F4F6"),
        spaceBefore=6, spaceAfter=6, leading=11, leftIndent=12, rightIndent=12
    ))
    return styles


# ============================================================
# TABLE BUILDER
# ============================================================

def build_table(data, col_widths=None, header_color=HexColor("#1E3A8A")):
    """Creates a styled ReportLab table."""
    if col_widths:
        t = Table(data, colWidths=col_widths, repeatRows=1)
    else:
        t = Table(data, repeatRows=1)

    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), header_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#D1D5DB")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    # Alternating row colors
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), HexColor("#F8FAFC")))
        else:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), white))

    t.setStyle(TableStyle(style_cmds))
    return t


# ============================================================
# MAIN DOCUMENT BUILDER
# ============================================================

def generate_srs():
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "documents")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "SRS_Document.pdf")

    styles = get_styles()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        topMargin=50,
        bottomMargin=55,
        leftMargin=55,
        rightMargin=55,
        title="PricePilot AI - Software Requirements Specification",
        author="Team PricePilot AI"
    )

    story = []
    W = A4[0] - 110  # Usable width

    # =========================================
    # COVER PAGE
    # =========================================
    story.append(Spacer(1, 100))
    story.append(Paragraph("PricePilot AI", styles['CoverTitle']))
    story.append(Paragraph("Enterprise Dynamic Pricing &amp; Demand Forecasting Platform", styles['CoverSubtitle']))
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="60%", thickness=2, color=HexColor("#7C3AED")))
    story.append(Spacer(1, 30))
    story.append(Paragraph("SOFTWARE REQUIREMENTS SPECIFICATION", ParagraphStyle(
        'CoverDoc', fontName='Helvetica-Bold', fontSize=16,
        textColor=HexColor("#1E3A8A"), alignment=TA_CENTER, spaceAfter=6
    )))
    story.append(Paragraph("IEEE Std 830-1998 Compliant", ParagraphStyle(
        'CoverStd', fontName='Helvetica', fontSize=11,
        textColor=HexColor("#6B7280"), alignment=TA_CENTER, spaceAfter=30
    )))
    story.append(Paragraph("Version 2.1 | August 2026", styles['CoverSubtitle']))
    story.append(Spacer(1, 40))

    cover_data = [
        ["Property", "Details"],
        ["Organization", "Infosys Springboard 7.0"],
        ["Project", "PricePilot AI Enterprise Platform"],
        ["Team Members", "Narendar Reddy, Manvitha, Pravallika, Ashwindh"],
        ["Document Version", "v2.1"],
        ["Date", datetime.now().strftime("%B %d, %Y")],
        ["Classification", "CONFIDENTIAL"],
    ]
    story.append(build_table(cover_data, col_widths=[W * 0.35, W * 0.65]))
    story.append(PageBreak())

    # =========================================
    # REVISION HISTORY
    # =========================================
    story.append(Paragraph("Revision History", styles['ChapterTitle']))
    rev_data = [
        ["Version", "Date", "Author", "Description"],
        ["1.0", "2026-07-01", "Narendar Reddy", "Initial SRS draft with core requirements"],
        ["1.5", "2026-07-15", "Team PricePilot", "Added ML requirements, OTP specifications"],
        ["2.0", "2026-08-01", "Team PricePilot", "Complete IEEE 830 restructure, all endpoints documented"],
        ["2.1", datetime.now().strftime("%Y-%m-%d"), "Enterprise Generator", "Auto-generated from source code analysis"],
    ]
    story.append(build_table(rev_data, col_widths=[W*0.12, W*0.15, W*0.25, W*0.48]))
    story.append(PageBreak())

    # =========================================
    # TABLE OF CONTENTS
    # =========================================
    story.append(Paragraph("Table of Contents", styles['ChapterTitle']))
    toc_items = [
        "1. Introduction ........................................ 4",
        "   1.1 Purpose",
        "   1.2 Scope",
        "   1.3 Definitions, Acronyms, and Abbreviations",
        "   1.4 References",
        "   1.5 Overview",
        "2. Overall Description ................................. 8",
        "   2.1 Product Perspective",
        "   2.2 Product Functions",
        "   2.3 User Characteristics",
        "   2.4 Constraints",
        "   2.5 Assumptions and Dependencies",
        "3. Specific Requirements ............................... 14",
        "   3.1 External Interface Requirements",
        "   3.2 Functional Requirements",
        "   3.3 Non-Functional Requirements",
        "4. System Models ....................................... 32",
        "   4.1 Context Diagram",
        "   4.2 Use Case Diagram",
        "   4.3 Activity Diagram",
        "   4.4 Data Flow Diagram (Level 0)",
        "   4.5 Data Flow Diagram (Level 1)",
        "5. Appendices .......................................... 42",
        "   5.1 Glossary",
        "   5.2 References",
    ]
    for item in toc_items:
        indent = 20 if item.startswith("   ") else 0
        story.append(Paragraph(item, ParagraphStyle(
            'TOC', fontName='Courier' if not item.startswith("   ") else 'Helvetica',
            fontSize=9 if not item.startswith("   ") else 8,
            textColor=HexColor("#1F2937"), leftIndent=indent, spaceAfter=2, leading=13
        )))
    story.append(PageBreak())

    # =========================================
    # LIST OF FIGURES
    # =========================================
    story.append(Paragraph("List of Figures", styles['ChapterTitle']))
    figs = [
        "Figure 4.1: System Context Diagram ......................... 33",
        "Figure 4.2: Use Case Diagram ............................... 35",
        "Figure 4.3: Prediction Activity Diagram .................... 37",
        "Figure 4.4: Data Flow Diagram Level 0 ...................... 39",
        "Figure 4.5: Data Flow Diagram Level 1 ...................... 41",
    ]
    for f in figs:
        story.append(Paragraph(f, ParagraphStyle('FigList', fontName='Helvetica', fontSize=9, spaceAfter=3, leading=13)))
    story.append(Spacer(1, 20))

    story.append(Paragraph("List of Tables", styles['ChapterTitle']))
    tbls = [
        "Table 1.1: Definitions and Acronyms ........................ 5",
        "Table 2.1: Hardware Requirements ........................... 9",
        "Table 2.2: Software Requirements ........................... 10",
        "Table 2.3: User Characteristics ............................ 11",
        "Table 3.1: External Interface Requirements ................. 14",
        "Table 3.2: Functional Requirements Matrix .................. 16",
        "Table 3.3: Non-Functional Requirements ..................... 28",
        "Table 3.4: API Endpoint Summary ............................ 30",
    ]
    for t in tbls:
        story.append(Paragraph(t, ParagraphStyle('TblList', fontName='Helvetica', fontSize=9, spaceAfter=3, leading=13)))
    story.append(PageBreak())

    # =========================================
    # CHAPTER 1: INTRODUCTION
    # =========================================
    story.append(Paragraph("1. Introduction", styles['ChapterTitle']))

    story.append(Paragraph("1.1 Purpose", styles['SectionTitle']))
    story.append(Paragraph(
        "This Software Requirements Specification (SRS) document provides a comprehensive description of the "
        "PricePilot AI Enterprise Platform. It defines the functional and non-functional requirements, system "
        "constraints, external interfaces, and behavioral models of the system. This document is prepared in "
        "compliance with IEEE Std 830-1998 (IEEE Recommended Practice for Software Requirements Specifications) "
        "and serves as the authoritative requirements baseline for all development, testing, and deployment activities.",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "The intended audience includes the development team (Narendar Reddy, Manvitha, Pravallika, Ashwindh), "
        "project evaluators at Infosys Springboard 7.0, university final-year project examiners, and any "
        "stakeholders involved in reviewing the technical scope of the platform.",
        styles['BodyText2']
    ))

    story.append(Paragraph("1.2 Scope", styles['SectionTitle']))
    story.append(Paragraph(
        "PricePilot AI is an enterprise-grade, AI-powered dynamic pricing and demand forecasting Software-as-a-Service "
        "(SaaS) platform. The system enables e-commerce businesses to optimize product pricing strategies using "
        "machine learning regression models trained on the Brazilian Olist E-Commerce dataset (112,650 order records "
        "across 3 source tables).",
        styles['BodyText2']
    ))
    story.append(Paragraph("The platform provides the following core capabilities:", styles['BodyText2']))

    capabilities = [
        "<b>AI-Powered Price Prediction</b> - Real-time price prediction using an Extra Trees Regressor model "
        "accepting 16 engineered features and returning predicted price, confidence score, demand level, "
        "profit margin, and strategic recommendation.",
        "<b>Enterprise Authentication</b> - JWT-based access and refresh token authentication with bcrypt "
        "password hashing (12 rounds), role-based access control (Admin/User), OTP-based password recovery "
        "via SMTP email or Twilio SMS, and rate-limited authentication endpoints.",
        "<b>Administrative Control Panel</b> - Full user lifecycle management including registration approval, "
        "account suspension, role assignment, bulk operations, and styled Excel report generation via openpyxl.",
        "<b>Real-Time Analytics Dashboard</b> - KPI visualization including total predictions, average/min/max "
        "prices, system health monitoring (CPU, RAM, database connection pool), and historical trend charts.",
        "<b>Prediction History</b> - Persistent storage of all prediction inputs, outputs, and metadata in "
        "PostgreSQL with per-prediction activity logging.",
        "<b>Project Documentation Hub</b> - In-application document library with 22 registered enterprise "
        "documents accessible via REST API with download capability.",
    ]
    for cap in capabilities:
        story.append(Paragraph(cap, ParagraphStyle(
            'BulletBody', fontName='Helvetica', fontSize=9, textColor=HexColor("#1F2937"),
            alignment=TA_JUSTIFY, spaceBefore=3, spaceAfter=3, leading=13,
            leftIndent=20, bulletIndent=8, bulletFontName='Symbol', bulletFontSize=8
        )))

    story.append(Paragraph("1.3 Definitions, Acronyms, and Abbreviations", styles['SectionTitle']))
    defs_data = [
        ["Term", "Definition"],
        ["JWT", "JSON Web Token - industry standard RFC 7519 method for secure claims transfer"],
        ["OTP", "One-Time Password - 6-digit secure code for identity verification (5-min expiry)"],
        ["RBAC", "Role-Based Access Control - authorization model with Admin and User roles"],
        ["SPA", "Single Page Application - client-side rendered React application"],
        ["ASGI", "Asynchronous Server Gateway Interface - FastAPI's server protocol"],
        ["ORM", "Object-Relational Mapping - SQLAlchemy abstraction layer over PostgreSQL"],
        ["bcrypt", "Adaptive cryptographic hash function for password storage (12 salt rounds)"],
        ["HS256", "HMAC-SHA256 - JWT signing algorithm"],
        ["Extra Trees", "Extremely Randomized Trees - ensemble regression algorithm (scikit-learn)"],
        ["MAE", "Mean Absolute Error - average absolute prediction deviation"],
        ["RMSE", "Root Mean Square Error - standard deviation of prediction errors"],
        ["R2 Score", "Coefficient of Determination - proportion of variance explained by model"],
        ["CORS", "Cross-Origin Resource Sharing - browser security policy for API access"],
        ["HSTS", "HTTP Strict Transport Security - forces HTTPS connections"],
        ["CDN", "Content Delivery Network - Vercel edge caching for frontend assets"],
        ["Neon", "Serverless PostgreSQL cloud platform used for production database"],
        ["Alembic", "SQLAlchemy migration tool for database schema versioning"],
        ["openpyxl", "Python library for Excel (.xlsx) file generation with styled formatting"],
        ["Pydantic V2", "Data validation library using Python type hints (request/response schemas)"],
    ]
    story.append(build_table(defs_data, col_widths=[W * 0.22, W * 0.78]))
    story.append(Paragraph("<i>Table 1.1: Definitions, Acronyms, and Abbreviations</i>", styles['FigureCaption']))

    story.append(Paragraph("1.4 References", styles['SectionTitle']))
    refs = [
        "IEEE Std 830-1998 - IEEE Recommended Practice for Software Requirements Specifications",
        "IEEE Std 1016-2009 - IEEE Standard for Software Design Descriptions",
        "OWASP Top 10 (2021) - Open Web Application Security Project vulnerability classification",
        "RFC 7519 - JSON Web Token (JWT) specification",
        "RFC 7617 - HTTP Basic and Bearer authentication framework",
        "Scikit-learn Documentation - ExtraTreesRegressor algorithm reference",
        "FastAPI Official Documentation (v0.110+) - ASGI framework reference",
        "SQLAlchemy 2.0 Documentation - ORM and engine configuration reference",
        "React 19 Documentation - Component model and hooks API reference",
        "Olist Brazilian E-Commerce Dataset - Kaggle public dataset (Olist, 2018)",
    ]
    for i, ref in enumerate(refs, 1):
        story.append(Paragraph(f"[{i}] {ref}", ParagraphStyle(
            'Ref', fontName='Helvetica', fontSize=9, leftIndent=20, spaceAfter=2, leading=12
        )))

    story.append(Paragraph("1.5 Overview", styles['SectionTitle']))
    story.append(Paragraph(
        "The remainder of this SRS is organized as follows: Section 2 provides an overall description of the "
        "product including its perspective, functions, user characteristics, constraints, and assumptions. "
        "Section 3 specifies the detailed functional and non-functional requirements organized by external "
        "interfaces, functional requirement identifiers (FR-001 through FR-028), and quality attributes. "
        "Section 4 presents system models including context diagrams, use case diagrams, activity diagrams, "
        "and data flow diagrams. Section 5 contains appendices with the complete glossary and reference list.",
        styles['BodyText2']
    ))
    story.append(PageBreak())

    # =========================================
    # CHAPTER 2: OVERALL DESCRIPTION
    # =========================================
    story.append(Paragraph("2. Overall Description", styles['ChapterTitle']))

    story.append(Paragraph("2.1 Product Perspective", styles['SectionTitle']))
    story.append(Paragraph(
        "PricePilot AI is a standalone, self-contained enterprise platform designed as a new product with no "
        "dependencies on existing systems. The platform implements a decoupled 4-tier architecture:",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "<b>Tier 1 - Presentation Layer:</b> React 19 Single Page Application built with Vite 8 as the build "
        "tool, Tailwind CSS 4 for utility-first styling, Framer Motion for animations, Recharts and Chart.js "
        "for data visualization, and React Router v7 for client-side routing. The frontend communicates with "
        "the backend exclusively through Axios HTTP client with automatic JWT token injection via request interceptors.",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "<b>Tier 2 - Application Layer:</b> FastAPI (v0.110+) ASGI backend running on Uvicorn. The application "
        "layer implements 5 modular API routers (auth, predict, dashboard, users, docs) with 28 REST endpoints. "
        "Middleware stack includes CORS configuration, security headers (Helmet equivalent), and in-memory "
        "token bucket rate limiting (20 requests per 60 seconds on authentication endpoints).",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "<b>Tier 3 - Machine Learning Engine:</b> Scikit-learn Extra Trees Regressor with 100 estimators, "
        "serialized as a joblib pickle file (815 MB). The model accepts 16 features per prediction request "
        "and executes inference in under 50ms. The ML pipeline includes 4 preprocessing stages: dataset "
        "merging (3 CSVs), data cleaning (deduplication, date parsing), feature engineering (5 derived "
        "columns), and preprocessing (imputation, label encoding, 80/20 train-test split).",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "<b>Tier 4 - Data Layer:</b> PostgreSQL database hosted on Neon Cloud with SQLAlchemy ORM abstraction. "
        "Connection pooling configured with pool_size=20, max_overflow=10, pool_timeout=30s, pool_recycle=1800s, "
        "and pool_pre_ping=True for automatic stale connection detection. Schema managed through Alembic "
        "migrations with 2 version scripts and automatic seed data injection via seed.py.",
        styles['BodyText2']
    ))

    story.append(Paragraph("2.2 Product Functions", styles['SectionTitle']))
    story.append(Paragraph(
        "The following table summarizes the major functional areas of the PricePilot AI platform as verified "
        "from the actual source code implementation:",
        styles['BodyText2']
    ))
    funcs_data = [
        ["Function Area", "Description", "Backend Router"],
        ["User Registration", "Account creation with email validation, username uniqueness check, first-user auto-admin", "auth.py"],
        ["Authentication", "Login via username or email, JWT access (24h) + refresh (7d) tokens, bcrypt verification", "auth.py"],
        ["OTP Recovery", "Forgot password flow: request OTP (SMTP/Twilio), verify 6-digit code, reset password", "auth.py"],
        ["Profile Management", "Edit name, email, username, phone, avatar, password with current password verification", "auth.py"],
        ["Price Prediction", "16-feature input, Extra Trees inference, confidence/demand/profit scoring, DB persistence", "predict.py"],
        ["Dashboard Analytics", "Real-time KPIs, system status (psutil), trend data, category distribution, recent logs", "dashboard.py"],
        ["User Management", "Admin CRUD: list, create, approve, reject, suspend, role change, password reset, delete", "users.py"],
        ["Bulk Operations", "Multi-user status update and bulk delete with admin self-protection", "users.py"],
        ["Excel Export", "openpyxl styled workbook: title, metadata, headers, data rows, filters, freeze pane, auto-width", "users.py"],
        ["Document Library", "22-document registry with metadata, preview, and binary download endpoints", "docs.py"],
    ]
    story.append(build_table(funcs_data, col_widths=[W*0.20, W*0.58, W*0.22]))

    story.append(Paragraph("2.3 User Characteristics", styles['SectionTitle']))
    users_data = [
        ["User Class", "Technical Level", "Access Level", "Primary Operations"],
        ["System Admin", "Advanced", "Full system access", "User management, approval, Excel export, monitoring, all user features"],
        ["End User", "Intermediate", "Approved features only", "Prediction, history, analytics, profile, settings, documents"],
        ["Pending User", "Any", "No access (blocked at login)", "Registration only; awaiting admin approval"],
        ["Suspended User", "Any", "No access (blocked at login)", "None; account deactivated by admin"],
    ]
    story.append(build_table(users_data, col_widths=[W*0.18, W*0.17, W*0.27, W*0.38]))
    story.append(Paragraph("<i>Table 2.3: User Characteristics Matrix</i>", styles['FigureCaption']))

    story.append(Paragraph("2.4 Constraints", styles['SectionTitle']))
    constraints = [
        "The ML model file (best_price_model.pkl) is 815 MB and must be loaded into memory at application startup. This requires a minimum of 2 GB available RAM on the backend server.",
        "The system requires a PostgreSQL database connection. If PostgreSQL is unavailable, the system falls back to a local SQLite database with reduced connection pooling capabilities.",
        "OTP delivery depends on external services: Gmail SMTP (requires 16-character App Password) or Twilio SMS API. If neither is configured, the password recovery feature is unavailable.",
        "The JWT secret key is currently hardcoded in config.py. For production deployment, this must be migrated to an environment variable.",
        "CORS is configured with a wildcard fallback ('*'), which must be restricted to specific domains for production security.",
        "The frontend communicates with the backend at localhost:8000 by default. Production deployment requires environment-based API URL configuration.",
    ]
    for con in constraints:
        story.append(Paragraph(f"- {con}", ParagraphStyle(
            'Constraint', fontName='Helvetica', fontSize=9, leftIndent=15, spaceAfter=4, leading=13,
            textColor=HexColor("#1F2937"), alignment=TA_JUSTIFY
        )))

    story.append(Paragraph("2.5 Assumptions and Dependencies", styles['SectionTitle']))
    assumptions = [
        "Python 3.10 or later is installed on the backend server.",
        "Node.js 18 or later is available for frontend development and build.",
        "PostgreSQL 14+ is available (Neon Cloud or local installation).",
        "The trained ML model file (best_price_model.pkl) is present in the trained_models/ directory.",
        "Users will access the platform through modern web browsers (Chrome 90+, Firefox 88+, Edge 90+, Safari 15+).",
        "The backend server has at least 2 GB RAM for ML model loading and inference.",
        "For OTP functionality, valid SMTP credentials or Twilio API credentials are configured in backend/.env.",
        "All timestamps are stored in UTC and displayed in the user's local timezone by the frontend.",
    ]
    for asm in assumptions:
        story.append(Paragraph(f"- {asm}", ParagraphStyle(
            'Assumption', fontName='Helvetica', fontSize=9, leftIndent=15, spaceAfter=3, leading=12,
            textColor=HexColor("#1F2937")
        )))
    story.append(PageBreak())

    # =========================================
    # CHAPTER 3: SPECIFIC REQUIREMENTS
    # =========================================
    story.append(Paragraph("3. Specific Requirements", styles['ChapterTitle']))

    story.append(Paragraph("3.1 External Interface Requirements", styles['SectionTitle']))

    story.append(Paragraph("3.1.1 User Interfaces", styles['SubSection']))
    story.append(Paragraph(
        "The PricePilot AI frontend is a React 19 Single Page Application featuring 20 distinct page components "
        "accessible through React Router v7. The UI implements a glassmorphic dark theme design system with "
        "Tailwind CSS 4, featuring a persistent sidebar navigation (Sidebar.jsx, 8,830 bytes), a global header "
        "with user context and notifications (Header.jsx, 14,574 bytes), and animated transitions via Framer Motion. "
        "Key pages include:",
        styles['BodyText2']
    ))
    ui_pages = [
        ["Page", "File", "Size", "Access"],
        ["Login / Register / OTP", "LoginPage.jsx", "34,389 B", "Public"],
        ["Dashboard", "DashboardPage.jsx", "28,287 B", "Admin, User"],
        ["Price Prediction", "PredictionPage.jsx", "26,363 B", "Admin, User"],
        ["User Management", "UsersPage.jsx", "48,472 B", "Admin Only"],
        ["Documentation Hub", "DocsPage.jsx", "56,461 B", "Admin, User"],
        ["Prediction History", "HistoryPage.jsx", "12,151 B", "Admin, User"],
        ["Analytics", "AnalyticsPage.jsx", "12,863 B", "Admin, User"],
        ["Profile", "ProfilePage.jsx", "16,146 B", "Admin, User"],
        ["ML Models", "MLModelsPage.jsx", "8,981 B", "Admin, User"],
        ["Settings", "SettingsPage.jsx", "6,641 B", "Admin, User"],
        ["Database Monitor", "DatabasePage.jsx", "5,534 B", "Admin Only"],
        ["Dataset Overview", "DatasetPage.jsx", "7,372 B", "Admin Only"],
    ]
    story.append(build_table(ui_pages, col_widths=[W*0.22, W*0.28, W*0.15, W*0.35]))

    story.append(Paragraph("3.1.2 Hardware Interfaces", styles['SubSection']))
    hw_data = [
        ["Component", "Minimum Requirement", "Recommended"],
        ["Backend CPU", "2 cores", "4+ cores (for ML inference)"],
        ["Backend RAM", "2 GB", "4+ GB"],
        ["Storage", "1 GB (model file)", "5 GB (model + datasets)"],
        ["Frontend (Client)", "Modern browser", "Chrome 90+, 4 GB RAM"],
        ["Network", "100 Mbps", "1 Gbps (for concurrent users)"],
    ]
    story.append(build_table(hw_data, col_widths=[W*0.25, W*0.35, W*0.40]))
    story.append(Paragraph("<i>Table 2.1: Hardware Requirements</i>", styles['FigureCaption']))

    story.append(Paragraph("3.1.3 Software Interfaces", styles['SubSection']))
    sw_data = [
        ["Software", "Version", "Purpose"],
        ["Python", "3.10+", "Backend runtime environment"],
        ["FastAPI", "0.110+", "ASGI web framework"],
        ["Uvicorn", "0.28+", "ASGI server"],
        ["SQLAlchemy", "2.0+", "ORM and database abstraction"],
        ["Alembic", "1.13+", "Database schema migrations"],
        ["scikit-learn", "1.4+", "Machine learning (ExtraTreesRegressor)"],
        ["XGBoost", "2.0+", "Gradient boosting regression"],
        ["LightGBM", "4.3+", "Light gradient boosting regression"],
        ["CatBoost", "1.2+", "Categorical boosting regression"],
        ["joblib", "1.3+", "Model serialization/deserialization"],
        ["pandas", "2.2+", "DataFrame construction for inference"],
        ["bcrypt", "4.0+", "Password hashing (12 salt rounds)"],
        ["PyJWT", "2.8+", "JWT token creation and verification"],
        ["openpyxl", "3.1+", "Excel report generation"],
        ["psutil", "5.9+", "System metrics (CPU, RAM monitoring)"],
        ["Node.js", "18+", "Frontend build environment"],
        ["React", "19.2+", "UI component framework"],
        ["Vite", "8.1+", "Frontend build tool and dev server"],
        ["Tailwind CSS", "4.3+", "Utility-first CSS framework"],
        ["Axios", "1.18+", "HTTP client with interceptors"],
        ["React Router", "7.18+", "Client-side routing"],
        ["Recharts", "3.10+", "Chart visualization library"],
        ["Framer Motion", "12.43+", "Animation library"],
        ["PostgreSQL", "14+", "Relational database (Neon Cloud)"],
    ]
    story.append(build_table(sw_data, col_widths=[W*0.22, W*0.13, W*0.65]))
    story.append(Paragraph("<i>Table 2.2: Software Requirements</i>", styles['FigureCaption']))
    story.append(PageBreak())

    # ---- 3.2 Functional Requirements ----
    story.append(Paragraph("3.2 Functional Requirements", styles['SectionTitle']))
    story.append(Paragraph(
        "The following functional requirements are derived from direct analysis of the PricePilot AI source code. "
        "Each requirement is traceable to a specific backend endpoint, frontend page, or system behavior. "
        "Requirements are organized by functional module.",
        styles['BodyText2']
    ))

    fr_data = [
        ["ID", "Requirement", "Source", "Priority"],
        # Authentication Module
        ["FR-001", "The system SHALL allow new users to register with name, email, username, password, and optional phone number. Email must match RFC 5322 format. Username must be >= 3 characters. Password must be >= 6 characters.", "POST /api/auth/register", "High"],
        ["FR-002", "The first registered user SHALL automatically receive Admin role and approved status. Subsequent users SHALL receive User role and pending status.", "auth.py L134-138", "High"],
        ["FR-003", "The system SHALL allow login via username OR email address. On successful login, the system SHALL return JWT access token (24h), refresh token (7d), and user profile.", "POST /api/auth/login", "High"],
        ["FR-004", "The system SHALL reject login for users with is_approved=False or status='pending' or status='suspended'.", "auth.py L217-227", "High"],
        ["FR-005", "The system SHALL update user.last_login timestamp on each successful authentication.", "auth.py L230", "Medium"],
        ["FR-006", "The system SHALL create an ActivityLog entry for every login, registration, and profile update.", "auth.py L157,234,632", "Medium"],
        ["FR-007", "The system SHALL generate a 6-digit OTP via secrets.randbelow() with 5-minute expiry for password recovery.", "auth.py L414-415", "High"],
        ["FR-008", "The system SHALL dispatch OTP via Twilio SMS (if phone + Twilio configured) or SMTP email (Gmail App Password), with HTML-formatted email template.", "auth.py L290-377", "High"],
        ["FR-009", "The system SHALL enforce OTP rate limiting: max 3 OTP requests per 15 minutes per user, max 5 verification attempts per OTP.", "auth.py L398-405, 470-473", "High"],
        ["FR-010", "The system SHALL allow password reset only with valid, unexpired OTP. New password must be >= 6 characters. OTP is invalidated after use.", "POST /api/auth/forgot-password/reset-password", "High"],
        ["FR-011", "The system SHALL issue new access and refresh tokens via token refresh endpoint, validating refresh token type.", "POST /api/auth/refresh", "High"],
        ["FR-012", "The system SHALL allow authenticated users to update their profile: name, email, username, phone, avatar, and password (with current password verification).", "PUT /api/auth/profile", "Medium"],
        ["FR-013", "The system SHALL log logout events in ActivityLog and return success message.", "POST /api/auth/logout", "Low"],
        # Prediction Module
        ["FR-014", "The system SHALL load the Extra Trees Regressor model from trained_models/best_price_model.pkl at application startup via joblib.load().", "predict.py L25-33", "High"],
        ["FR-015", "The system SHALL accept 16 numeric features (order_item_id, freight_value, order_status, product_category_name, product_name_lenght, product_description_lenght, product_photos_qty, product_weight_g, product_length_cm, product_height_cm, product_width_cm, purchase_year, purchase_month, purchase_day, purchase_weekday, product_volume) via POST /api/predict.", "ProductFeatures schema", "High"],
        ["FR-016", "The system SHALL execute model.predict() on a single-row DataFrame and return: prediction_id, predicted_price, confidence_score, prediction_time, model_name, demand_level, profit_margin, estimated_cost, and recommendation.", "predict.py L57-105", "High"],
        ["FR-017", "The system SHALL persist each prediction to the predictions table and prediction_history table (with JSON-serialized input data), and create an ActivityLog entry.", "predict.py L68-92", "High"],
        ["FR-018", "The system SHALL return HTTP 503 if the ML model is not loaded.", "predict.py L46-50", "Medium"],
        # Dashboard Module
        ["FR-019", "The system SHALL compute real-time KPIs: total predictions (COUNT), average price (AVG), max price (MAX), min price (MIN) from the predictions table.", "dashboard.py L21-24", "Medium"],
        ["FR-020", "The system SHALL return system health metrics: FastAPI status, PostgreSQL connection, database pool status, CPU usage, RAM usage, model status, and prediction speed.", "dashboard.py L36-52", "Medium"],
        ["FR-021", "The system SHALL return the 5 most recent activity logs and 5 most recent predictions.", "dashboard.py L76-96", "Low"],
        # User Management Module (Admin Only)
        ["FR-022", "Admin SHALL be able to list all users with optional status filter, create new users, and update user attributes (name, email, username, role, phone, avatar, is_active, is_approved, status, password).", "GET/POST/PUT /api/users", "High"],
        ["FR-023", "Admin SHALL be able to approve, reject, and suspend user accounts. Admins CANNOT suspend or reject their own account.", "PUT /api/users/{id}/approve|reject|suspend", "High"],
        ["FR-024", "Admin SHALL be able to change user roles (Admin/User) and reset user passwords.", "PUT /api/users/{id}/role|reset-password", "Medium"],
        ["FR-025", "Admin SHALL be able to delete user accounts (with cascading ActivityLog cleanup). Admins CANNOT delete their own account.", "DELETE /api/users/{id}", "High"],
        ["FR-026", "Admin SHALL be able to export user data as a styled Excel (.xlsx) file with: title row, metadata, header styling, data rows, alternating colors, auto-filter, freeze pane, and auto column width.", "GET /api/users/export/excel", "Medium"],
        ["FR-027", "Admin SHALL be able to perform bulk status updates and bulk deletes on multiple users simultaneously.", "POST /api/users/bulk-status|bulk-delete", "Medium"],
        # Document Module
        ["FR-028", "The system SHALL maintain a registry of 22 project documents with metadata (id, title, category, filename, version, description) and provide list, detail, and download endpoints.", "GET /api/docs, GET /api/docs/{id}, GET /api/docs/download/{id}", "Low"],
    ]
    story.append(build_table(fr_data, col_widths=[W*0.08, W*0.52, W*0.25, W*0.15]))
    story.append(Paragraph("<i>Table 3.2: Functional Requirements Matrix (FR-001 to FR-028)</i>", styles['FigureCaption']))
    story.append(PageBreak())

    # ---- 3.3 Non-Functional Requirements ----
    story.append(Paragraph("3.3 Non-Functional Requirements", styles['SectionTitle']))

    nfr_data = [
        ["ID", "Category", "Requirement", "Verification"],
        ["NFR-001", "Performance", "ML prediction inference SHALL complete in < 50ms per request.", "predict.py timing measurement"],
        ["NFR-002", "Performance", "API response time SHALL be < 200ms for non-ML endpoints under normal load.", "API benchmarking"],
        ["NFR-003", "Performance", "Database connection pool SHALL maintain 20 idle connections with 10 overflow capacity.", "database.py pool_size=20, max_overflow=10"],
        ["NFR-004", "Security", "All passwords SHALL be hashed using bcrypt with 12 salt rounds.", "security.py bcrypt.gensalt(rounds=12)"],
        ["NFR-005", "Security", "JWT tokens SHALL use HS256 algorithm with configurable secret key.", "security.py jwt.encode(..., algorithm='HS256')"],
        ["NFR-006", "Security", "Access tokens SHALL expire after 24 hours. Refresh tokens SHALL expire after 7 days.", "config.py + security.py"],
        ["NFR-007", "Security", "Authentication endpoints SHALL be rate limited to 20 requests per 60 seconds per IP.", "middleware.py RateLimiter"],
        ["NFR-008", "Security", "All HTTP responses SHALL include security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, Referrer-Policy.", "middleware.py SecurityHeadersMiddleware"],
        ["NFR-009", "Security", "OTP codes SHALL be 6-digit, cryptographically random, expire in 5 minutes, with max 3 requests/15min and 5 verification attempts.", "auth.py OTP implementation"],
        ["NFR-010", "Reliability", "The system SHALL fall back to SQLite if PostgreSQL is unavailable.", "database.py except clause"],
        ["NFR-011", "Reliability", "Database connections SHALL use pool_pre_ping=True for automatic stale connection detection.", "database.py pool_pre_ping=True"],
        ["NFR-012", "Usability", "The frontend SHALL support dark and light themes with persistent localStorage preference.", "AuthContext.jsx theme toggle"],
        ["NFR-013", "Usability", "The frontend SHALL auto-redirect to /login on receiving 401 Unauthorized responses.", "api.js response interceptor"],
        ["NFR-014", "Maintainability", "Backend code SHALL be organized in modular routers with separated concerns (auth, predict, dashboard, users, docs).", "main.py router includes"],
        ["NFR-015", "Portability", "The system SHALL support PostgreSQL (production) and SQLite (development) without code changes.", "database.py conditional engine creation"],
    ]
    story.append(build_table(nfr_data, col_widths=[W*0.08, W*0.12, W*0.52, W*0.28]))
    story.append(Paragraph("<i>Table 3.3: Non-Functional Requirements Matrix</i>", styles['FigureCaption']))

    # API Summary Table
    story.append(Spacer(1, 15))
    story.append(Paragraph("3.4 API Endpoint Summary", styles['SectionTitle']))
    api_data = [
        ["Method", "Route", "Auth", "Description"],
        ["POST", "/api/auth/register", "None", "User registration"],
        ["POST", "/api/auth/login", "None", "JWT authentication"],
        ["POST", "/api/auth/forgot-password/request-otp", "None", "Request OTP for password recovery"],
        ["POST", "/api/auth/forgot-password/verify-otp", "None", "Verify 6-digit OTP code"],
        ["POST", "/api/auth/forgot-password/reset-password", "None", "Reset password with valid OTP"],
        ["POST", "/api/auth/refresh", "Refresh Token", "Issue new access/refresh token pair"],
        ["GET", "/api/auth/me", "Bearer JWT", "Get current user profile"],
        ["PUT", "/api/auth/profile", "Bearer JWT", "Update user profile"],
        ["POST", "/api/auth/logout", "Bearer JWT", "Log out and record activity"],
        ["GET", "/api/model-status", "None", "Check ML model load status"],
        ["POST", "/api/predict", "None", "Execute ML price prediction"],
        ["GET", "/api/dashboard/stats", "Bearer JWT", "Dashboard KPIs and system status"],
        ["GET", "/api/users", "Admin JWT", "List all users"],
        ["POST", "/api/users", "Admin JWT", "Create new user"],
        ["PUT", "/api/users/{id}", "Admin JWT", "Update user attributes"],
        ["DELETE", "/api/users/{id}", "Admin JWT", "Delete user account"],
        ["PUT", "/api/users/{id}/approve", "Admin JWT", "Approve pending user"],
        ["PUT", "/api/users/{id}/reject", "Admin JWT", "Reject pending user"],
        ["PUT", "/api/users/{id}/suspend", "Admin JWT", "Suspend active user"],
        ["PUT", "/api/users/{id}/role", "Admin JWT", "Change user role"],
        ["PUT", "/api/users/{id}/reset-password", "Admin JWT", "Admin reset user password"],
        ["GET", "/api/users/export/excel", "Admin JWT", "Export users to Excel"],
        ["POST", "/api/users/bulk-status", "Admin JWT", "Bulk update user status"],
        ["POST", "/api/users/bulk-delete", "Admin JWT", "Bulk delete users"],
        ["GET", "/api/admin/export-users", "Admin JWT", "Admin export users (alternate)"],
        ["GET", "/api/docs", "Bearer JWT", "List project documents"],
        ["GET", "/api/docs/{doc_id}", "Bearer JWT", "Get document details"],
        ["GET", "/api/docs/download/{doc_id}", "Bearer JWT", "Download document file"],
        ["GET", "/", "None", "Platform info"],
        ["GET", "/api/health", "None", "Health check"],
        ["GET", "/api/db-status", "None", "Database status"],
    ]
    story.append(build_table(api_data, col_widths=[W*0.10, W*0.38, W*0.17, W*0.35]))
    story.append(Paragraph("<i>Table 3.4: Complete API Endpoint Registry (32 endpoints)</i>", styles['FigureCaption']))
    story.append(PageBreak())

    # =========================================
    # CHAPTER 4: SYSTEM MODELS (DIAGRAMS)
    # =========================================
    story.append(Paragraph("4. System Models", styles['ChapterTitle']))
    story.append(Paragraph(
        "This section presents the visual system models for PricePilot AI. All diagrams are derived from "
        "the actual source code implementation and accurately represent the system's architecture, behavior, "
        "and data flows.",
        styles['BodyText2']
    ))

    # Figure 4.1: Context Diagram
    story.append(Paragraph("4.1 System Context Diagram", styles['SectionTitle']))
    story.append(Paragraph(
        "The context diagram illustrates the PricePilot AI system boundary and its interactions with external "
        "entities. The system receives HTTP requests from End Users and Administrators, dispatches OTP codes "
        "via SMTP/Twilio, executes SQL queries against PostgreSQL (Neon Cloud), performs ML inference using "
        "the serialized Extra Trees model, and serves the React SPA through Vercel CDN.",
        styles['BodyText2']
    ))
    story.append(DiagramFlowable(W, 260, draw_context_diagram, "Figure 4.1: System Context Diagram"))
    story.append(PageBreak())

    # Figure 4.2: Use Case Diagram
    story.append(Paragraph("4.2 Use Case Diagram", styles['SectionTitle']))
    story.append(Paragraph(
        "The use case diagram identifies 8 primary use cases. Users (UC-01 through UC-06) can register, "
        "authenticate, predict prices, view history, access analytics, and recover passwords. Administrators "
        "inherit all user capabilities and additionally manage users (UC-07) and export Excel reports (UC-08). "
        "Dashed lines indicate admin's inherited access to user use cases.",
        styles['BodyText2']
    ))
    story.append(DiagramFlowable(W, 300, draw_usecase_diagram, "Figure 4.2: Use Case Diagram"))
    story.append(PageBreak())

    # Figure 4.3: Activity Diagram
    story.append(Paragraph("4.3 Prediction Activity Diagram", styles['SectionTitle']))
    story.append(Paragraph(
        "The activity diagram traces the complete prediction workflow from user input to response. "
        "The process begins with 16 product features submitted via the prediction form, passes through "
        "Pydantic V2 validation, constructs a single-row pandas DataFrame, executes model.predict() on the "
        "Extra Trees Regressor, calculates derived metrics (confidence, demand level, profit margin), "
        "persists results to both the predictions and prediction_history tables, logs the activity, "
        "and returns the comprehensive JSON response.",
        styles['BodyText2']
    ))
    story.append(DiagramFlowable(W, 430, draw_activity_diagram, "Figure 4.3: Prediction Activity Diagram"))
    story.append(PageBreak())

    # Figure 4.4: DFD Level 0
    story.append(Paragraph("4.4 Data Flow Diagram - Level 0", styles['SectionTitle']))
    story.append(Paragraph(
        "The Level 0 DFD presents the PricePilot AI system as a single process with four external entities: "
        "User/Admin (providing credentials and feature inputs), PostgreSQL Database (receiving and returning "
        "data), ML Engine (processing prediction requests), and Email/SMS service (receiving OTP dispatch requests).",
        styles['BodyText2']
    ))
    story.append(DiagramFlowable(W, 240, draw_dfd_level0, "Figure 4.4: Data Flow Diagram - Level 0"))
    story.append(PageBreak())

    # Figure 4.5: DFD Level 1
    story.append(Paragraph("4.5 Data Flow Diagram - Level 1", styles['SectionTitle']))
    story.append(Paragraph(
        "The Level 1 DFD decomposes the system into 5 processes: (1.0) Authentication handles user registration, "
        "login, OTP, and profile management; (2.0) Prediction executes ML inference and stores results; "
        "(3.0) Dashboard aggregates KPIs and system metrics; (4.0) User Management provides admin CRUD and "
        "Excel export; (5.0) Documents serves the project documentation library. Data stores D1 (users), "
        "D2 (predictions), and D3 (activity_logs) are shown with their relationships to each process.",
        styles['BodyText2']
    ))
    story.append(DiagramFlowable(W, 260, draw_dfd_level1, "Figure 4.5: Data Flow Diagram - Level 1"))
    story.append(PageBreak())

    # =========================================
    # CHAPTER 5: APPENDICES
    # =========================================
    story.append(Paragraph("5. Appendices", styles['ChapterTitle']))

    story.append(Paragraph("5.1 Known Limitations", styles['SectionTitle']))
    story.append(Paragraph(
        "The following limitations were identified through source code analysis and are documented for "
        "transparency and future improvement planning:",
        styles['BodyText2']
    ))
    limitations = [
        "<b>No Hyperparameter Tuning:</b> train_models.py uses default hyperparameters for all 7 models. No GridSearchCV, RandomizedSearchCV, or cross-validation code exists. This is documented as future scope.",
        "<b>No CI/CD Pipeline:</b> No .github/workflows, Jenkinsfile, or deployment automation files exist in the project.",
        "<b>No Dockerfile:</b> No containerization configuration exists. Deployment is currently manual to Vercel (frontend) and Render (backend).",
        "<b>No Unit Tests:</b> tests/__init__.py is empty. No pytest test files have been implemented.",
        "<b>Static Confidence Score:</b> predict.py hardcodes confidence_score = 0.965 rather than computing it from actual model prediction variance or probability distributions.",
        "<b>Hardcoded Dashboard Data:</b> dashboard.py returns static historical trend and category distribution data rather than computing from actual database records.",
        "<b>R2 Score Discrepancy:</b> The dashboard displays 96.5% prediction accuracy, but model_comparison.csv shows the actual Extra Trees R2 = 0.6742 (67.42%). The displayed value is aspirational/UI-optimized.",
        "<b>Missing Predictions List Endpoint:</b> Frontend api.js calls GET /api/predictions, but no corresponding backend endpoint exists. The prediction history is read from the dashboard stats.",
        "<b>Prediction Not Bound to User:</b> predict.py does not populate the user_id field in the predictions table, despite the foreign key existing in the schema.",
    ]
    for lim in limitations:
        story.append(Paragraph(f"- {lim}", ParagraphStyle(
            'Limitation', fontName='Helvetica', fontSize=9, leftIndent=15, spaceAfter=5, leading=13,
            textColor=HexColor("#1F2937"), alignment=TA_JUSTIFY
        )))

    story.append(Paragraph("5.2 References", styles['SectionTitle']))
    final_refs = [
        "[1] IEEE Std 830-1998 - Recommended Practice for Software Requirements Specifications",
        "[2] IEEE Std 1016-2009 - Standard for Software Design Descriptions",
        "[3] OWASP Top 10 (2021) - Web Application Security Risks",
        "[4] RFC 7519 - JSON Web Token (JWT)",
        "[5] RFC 7617 - The 'Basic' HTTP Authentication Scheme",
        "[6] Scikit-learn: ExtraTreesRegressor - Extremely Randomized Trees",
        "[7] FastAPI Official Documentation - https://fastapi.tiangolo.com",
        "[8] SQLAlchemy 2.0 Documentation - https://docs.sqlalchemy.org",
        "[9] React 19 Documentation - https://react.dev",
        "[10] Olist Brazilian E-Commerce Dataset - Kaggle (2018)",
        "[11] Neon Cloud PostgreSQL - https://neon.tech",
        "[12] Vite Build Tool Documentation - https://vitejs.dev",
        "[13] Tailwind CSS 4 Documentation - https://tailwindcss.com",
        "[14] Framer Motion Documentation - https://motion.dev",
        "[15] ReportLab PDF Documentation - https://www.reportlab.com",
    ]
    for ref in final_refs:
        story.append(Paragraph(ref, ParagraphStyle(
            'FinalRef', fontName='Helvetica', fontSize=9, leftIndent=20, spaceAfter=2, leading=12
        )))

    story.append(Spacer(1, 40))
    story.append(HRFlowable(width="100%", thickness=1, color=HexColor("#D1D5DB")))
    story.append(Paragraph(
        "END OF DOCUMENT - Software Requirements Specification v2.1",
        ParagraphStyle('EndDoc', fontName='Helvetica-Oblique', fontSize=9,
                       textColor=HexColor("#9CA3AF"), alignment=TA_CENTER, spaceBefore=10)
    ))

    # =========================================
    # BUILD PDF
    # =========================================
    print("[SRS] Building PDF document...")
    doc.build(story, canvasmaker=NumberedCanvas)
    file_size = os.path.getsize(output_path)
    print(f"[SRS] SUCCESS: {output_path}")
    print(f"[SRS] File size: {file_size:,} bytes")
    return output_path


if __name__ == "__main__":
    generate_srs()
