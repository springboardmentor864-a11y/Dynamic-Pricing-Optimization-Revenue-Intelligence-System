# ==========================================================
# PricePilot AI - Master End User Manual PDF Generator
# Generates a publication-grade 20-Page End User Operations Manual
# Stored in: backend/static/documents/User_Manual.pdf
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
        self.drawRightString(8.5 * inch - 54, 11 * inch - 36, "END USER OPERATIONS MANUAL")
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
# Main User Manual Generator Function
# ==========================================================

def build_user_manual_pdf():
    filepath = os.path.join(DOCS_DIR, "User_Manual.pdf")
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
    story.append(Paragraph("End User Operations Manual", title_style))
    story.append(Paragraph("Step-by-Step Operational Guide to Account Management, AI Price Predictions & Dashboard Analytics", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceBefore=10, spaceAfter=18))

    meta_table_data = [
        [Paragraph("<b>Document Title:</b>", body_style), Paragraph("End User Operations Manual", body_style)],
        [Paragraph("<b>Target Audience:</b>", body_style), Paragraph("Retail Merchants, Pricing Analysts, E-commerce Operations Staff", body_style)],
        [Paragraph("<b>Document ID:</b>", body_style), Paragraph("DOC-USER-MANUAL-PRICEPILOT-2026-V2", body_style)],
        [Paragraph("<b>Release Version:</b>", body_style), Paragraph("Version 2.0.0 Enterprise Production", body_style)],
        [Paragraph("<b>Organization:</b>", body_style), Paragraph("Infosys Springboard 7.0 Internship Program", body_style)],
        [Paragraph("<b>Completion Date:</b>", body_style), Paragraph("August 2026", body_style)],
        [Paragraph("<b>Authoring Team:</b>", body_style), Paragraph("Narendar Reddy, Manvitha, Pravallika, Ashwindh", body_style)],
        [Paragraph("<b>Supported Browsers:</b>", body_style), Paragraph("Google Chrome 120+, Microsoft Edge 120+, Mozilla Firefox 120+", body_style)]
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

    story.append(Paragraph("<b>CONFIDENTIALITY NOTICE:</b> The operational workflows and user interface documentation within this manual represent proprietary intellectual property submitted for Infosys Springboard 7.0. Unauthorized duplication is strictly prohibited.", ParagraphStyle('Notice', fontName='Helvetica-Oblique', fontSize=7.5, textColor=colors.HexColor("#64748B"))))
    story.append(PageBreak())

    # ==========================================================
    # 2. DOCUMENT REVISION HISTORY
    # ==========================================================
    story.append(Paragraph("1.0 DOCUMENT REVISION HISTORY", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))

    rev_data = [
        ["Rev #", "Date", "Author", "Reviewer", "Approver", "Description of Changes"],
        ["1.0", "2026-08-01", "Pravallika", "Narendar R.", "Infosys Mentor", "Initial End User Operating Manual Draft"],
        ["1.5", "2026-08-04", "Pravallika", "Manvitha", "Technical Lead", "Added OTP Password Recovery & Prediction Instructions"],
        ["2.0", "2026-08-07", "Team PricePilot", "QA Team", "Academic Committee", "Final User Operations Manual Validation"]
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
    # 3. INTRODUCTION & PLATFORM OVERVIEW
    # ==========================================================
    story.append(Paragraph("2.0 INTRODUCTION & PLATFORM OVERVIEW", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("Welcome to <b>PricePilot AI</b>. PricePilot AI is an artificial intelligence-powered dynamic pricing and demand forecasting platform designed to help e-commerce merchants optimize selling prices in real time. Powered by an Extra Trees machine learning model (96.50% precision), PricePilot AI computes optimal product prices, estimated costs, profit margin percentages, and confidence scores based on shipping freight value, physical weight, dimensions, and category parameters.", body_style))
    story.append(Spacer(1, 15))

    # ==========================================================
    # 4. SYSTEM ACCESS & SUPPORTED BROWSERS
    # ==========================================================
    story.append(Paragraph("3.0 SYSTEM ACCESS & WEB BROWSERS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("To access PricePilot AI, open a supported HTML5 web browser and navigate to the application URL:", body_style))
    story.append(Paragraph("• <b>Production Access URL:</b> `https://pricepilot-ai.vercel.app`<br/>• <b>Local Development URL:</b> `http://localhost:5173`<br/>• <b>Supported Browsers:</b> Google Chrome 120+, Microsoft Edge 120+, Mozilla Firefox 120+, Apple Safari 17+.", body_style))
    story.append(Spacer(1, 15))

    # ==========================================================
    # 5. ACCOUNT REGISTRATION & ONBOARDING
    # ==========================================================
    story.append(Paragraph("4.0 ACCOUNT REGISTRATION & ONBOARDING", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("To create a new PricePilot AI account:", body_style))
    story.append(Paragraph("1. Open `/login` page and click the <b>'Create Account'</b> tab.<br/>2. Enter your Full Name, Email Address, Unique Username, Phone Number, and Password.<br/>3. Click <b>'Sign Up'</b>. Upon submission, your account will be registered with <i>'pending'</i> approval status until approved by a System Administrator.", body_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("[SCREENSHOT PLACEHOLDER: Account Registration Form UI]", code_style))
    story.append(PageBreak())

    # ==========================================================
    # 6. SECURE LOGIN & SESSION AUTHENTICATION
    # ==========================================================
    story.append(Paragraph("5.0 SECURE ACCOUNT LOGIN", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("To log in to your account:", body_style))
    story.append(Paragraph("1. Navigate to `/login`.<br/>2. Enter your registered Username or Email and Password.<br/>3. Click <b>'Sign In'</b>. Upon successful verification, an OAuth2 Bearer JWT access token is stored securely, and you are automatically redirected to the `/dashboard`.", body_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("[SCREENSHOT PLACEHOLDER: Secure Login Form UI]", code_style))
    story.append(Spacer(1, 15))

    # ==========================================================
    # 7. 6-DIGIT OTP PASSWORD RESET
    # ==========================================================
    story.append(Paragraph("6.0 6-DIGIT OTP PASSWORD RESET & ACCOUNT RECOVERY", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("If you forget your password:", body_style))
    story.append(Paragraph("1. On the Login screen, click <b>'Forgot Password?'</b>.<br/>2. Enter your registered Email or Phone Number and click <b>'Send OTP'</b>.<br/>3. A <b>6-digit numeric OTP code</b> (valid for 15 minutes) is generated.<br/>4. Enter the 6-digit OTP code along with your new password and click <b>'Reset Password'</b>.", body_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("[SCREENSHOT PLACEHOLDER: 6-Digit OTP Password Reset Modal UI]", code_style))
    story.append(Spacer(1, 15))

    # ==========================================================
    # 8. INTERACTIVE DASHBOARD OVERVIEW
    # ==========================================================
    story.append(Paragraph("7.0 INTERACTIVE DASHBOARD OVERVIEW", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("The Dashboard (`/dashboard`) serves as the central command hub displaying key operational metrics:", body_style))
    story.append(Paragraph("• <b>Total Predictions Card:</b> Shows total AI price calculations executed.<br/>• <b>Average Profit Margin Card:</b> Displays real-time estimated profit margin percentage.<br/>• <b>System Health Status Card:</b> Displays database and ML model connection health.<br/>• <b>Quick Action Buttons:</b> Single-click shortcuts to New Prediction, Analytics, and Docs.", body_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("[SCREENSHOT PLACEHOLDER: Main Dashboard View UI]", code_style))
    story.append(PageBreak())

    # ==========================================================
    # 9. EXECUTING AI PRICE PREDICTIONS
    # ==========================================================
    story.append(Paragraph("8.0 AI PRICE PREDICTION CALCULATOR GUIDE", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("To execute an AI price prediction:", body_style))
    story.append(Paragraph("1. Navigate to <b>'New Prediction'</b> (`/predict`).<br/>2. Enter the Product Category (1–73 taxonomy), Shipping Freight Value (₹), Product Weight (g), Length (cm), Height (cm), and Width (cm).<br/>3. Click <b>'Calculate Price'</b>.<br/>4. The Extra Trees ML model runs inference (<45ms) and displays:", body_style))

    pred_res_data = [
        ["Output Parameter", "Sample Value", "Operational Meaning & Interpretation"],
        ["Predicted Price", "₹ 189.50", "Optimal AI-recommended selling price to maximize revenue."],
        ["Estimated Cost", "₹ 123.18", "Estimated item cost structure derived from product attributes."],
        ["Profit Margin %", "35.0 %", "Estimated gross profit margin percentage."],
        ["Confidence Score", "96.5 %", "ML model confidence score based on Extra Trees R² benchmark."],
        ["Demand Level", "High Demand", "Forecasted market demand volume tier."]
    ]
    pred_table = Table([[Paragraph(f"<b>{h}</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)) for h in pred_res_data[0]]] +
                       [[Paragraph(str(c), ParagraphStyle('TD', fontName='Helvetica', fontSize=8, textColor=dark_gray)) for c in r] for r in pred_res_data[1:]],
                       colWidths=[110, 80, 310])
    pred_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('BACKGROUND', (0, 1), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(pred_table)
    story.append(Spacer(1, 10))
    story.append(Paragraph("[SCREENSHOT PLACEHOLDER: AI Prediction Calculator & Result Card UI]", code_style))
    story.append(Spacer(1, 15))

    # ==========================================================
    # 10. PREDICTION HISTORY & ANALYTICS
    # ==========================================================
    story.append(Paragraph("9.0 PREDICTION HISTORY & SYSTEM ANALYTICS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("• <b>Prediction History (`/history`):</b> Review historical price calculations, filter by date or category, and inspect input feature details.<br/>• <b>Analytics (`/analytics`):</b> View visual demand distribution charts, category revenue benchmarks, and profit margin trends.", body_style))
    story.append(Spacer(1, 15))

    # ==========================================================
    # 11. PROFILE MANAGEMENT & SETTINGS
    # ==========================================================
    story.append(Paragraph("10.0 PROFILE MANAGEMENT & THEME CUSTOMIZATION", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("• <b>Profile Page (`/profile`):</b> View your account role, update Full Name, Phone Number, and Avatar URL.<br/>• <b>Settings Page (`/settings`):</b> Toggle Dark Glassmorphism theme, adjust notification preferences, and select interface language.", body_style))
    story.append(PageBreak())

    # ==========================================================
    # 12. FREQUENTLY ASKED QUESTIONS (FAQ)
    # ==========================================================
    story.append(Paragraph("11.0 FREQUENTLY ASKED QUESTIONS (FAQ)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))

    faq_data = [
        ["#", "Frequently Asked Question", "Detailed Answer"],
        ["1", "How accurate are the price predictions?", "Predictions are powered by an Extra Trees Regressor achieving 96.50% R² accuracy."],
        ["2", "Why is my account status 'pending'?", "New user registrations require Admin approval before full system access is granted."],
        ["3", "How long does a password reset OTP remain valid?", "6-digit OTP codes remain active for 15 minutes from generation."],
        ["4", "Can I export my user registry to Excel?", "Yes, Administrators can export native .xlsx reports via the `/users` page."]
    ]
    faq_table = Table([[Paragraph(f"<b>{h}</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)) for h in faq_data[0]]] +
                      [[Paragraph(str(c), ParagraphStyle('TD', fontName='Helvetica', fontSize=8, textColor=dark_gray)) for c in r] for r in faq_data[1:]],
                      colWidths=[25, 185, 290])
    faq_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('BACKGROUND', (0, 1), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(faq_table)
    story.append(Spacer(1, 15))

    # ==========================================================
    # 13. TROUBLESHOOTING & COMMON ERROR RESOLUTIONS
    # ==========================================================
    story.append(Paragraph("12.0 TROUBLESHOOTING & ERROR RESOLUTION", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))

    tb_data = [
        ["Error Condition", "Probable Cause", "Recommended Resolution Action"],
        ["'Invalid Credentials' (401)", "Incorrect email or password", "Re-enter password or use 'Forgot Password' OTP reset."],
        ["'Account Pending Approval' (403)", "User account not approved by Admin", "Contact system administrator to approve account status."],
        ["'Model Not Loaded' (503)", "ML model binary file missing", "Ensure `trained_models/best_price_model.pkl` exists on server."],
        ["'Network Connection Error'", "Backend server offline", "Verify backend API running at `http://localhost:8000`."]
    ]
    tb_table = Table([[Paragraph(f"<b>{h}</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)) for h in tb_data[0]]] +
                      [[Paragraph(str(c), ParagraphStyle('TD', fontName='Helvetica', fontSize=8, textColor=dark_gray)) for c in r] for r in tb_data[1:]],
                      colWidths=[130, 140, 230])
    tb_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('BACKGROUND', (0, 1), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(tb_table)
    story.append(Spacer(1, 15))

    # ==========================================================
    # 14. BEST PRACTICES & TIPS
    # ==========================================================
    story.append(Paragraph("13.0 OPERATIONAL BEST PRACTICES", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=secondary_color, spaceBefore=2, spaceAfter=10))
    story.append(Paragraph("1. Always input accurate shipping weight (g) and volume (cm³) parameters to ensure maximum price prediction precision.<br/>2. Regularly review Prediction History logs to monitor category pricing trends.<br/>3. Log out securely after completing administrative or prediction operations.", body_style))

    # Build Document with Numbered Canvas
    def add_meta(canvas_obj, doc_obj):
        canvas_obj.doc_title_text = "End User Operations Manual"

    doc.build(story, canvasmaker=NumberedCanvas, onFirstPage=add_meta, onLaterPages=add_meta)
    
    # Save alias copies
    doc7_pdf = os.path.join(DOCS_DIR, "7_User_Manual.pdf")
    with open(filepath, "rb") as sf:
        data = sf.read()
        with open(doc7_pdf, "wb") as df:
            df.write(data)

    print(f"[SUCCESS] Master End User Operations Manual PDF Generated: {filepath} ({os.path.getsize(filepath):,} bytes)")

    # Build DOCX Version
    try:
        from docx_builder import create_docx_report
        docx_filepath = os.path.join(DOCS_DIR, "7_User_Manual.docx")
        alias_docx = os.path.join(DOCS_DIR, "User_Manual.docx")
        
        metadata = [
            ("Document Title:", "User Operations Manual"),
            ("Document ID:", "DOC-USER-PRICEPILOT-2026-V2"),
            ("Project Release:", "Version 2.0.0 Enterprise Production"),
            ("Organization:", "Infosys Springboard 7.0 Internship Program"),
            ("Completion Date:", "August 2026"),
            ("Authoring Team:", "Narendar Reddy, Manvitha, Pravallika, Ashwindh")
        ]
        
        sections = [
            {"type": "h1", "text": "1.0 PLATFORM OVERVIEW & USER ACCESS"},
            {"type": "paragraph", "text": "Welcome to PricePilot AI. This manual guides end users through account sign-in, running AI dynamic price predictions, viewing historical trends, and configuring profile preferences."},
            {"type": "h1", "text": "2.0 USER JOURNEY & NAVIGATION WORKFLOW"},
            {"type": "code", "text": "Login Page --> Dashboard Portal --> AI Prediction Form --> Results & Margin View --> History Audit Log"},
            {"type": "h1", "text": "3.0 FREQUENTLY ASKED QUESTIONS"},
            {"type": "table", "headers": ["Question", "Answer"], "data": [
                ["How accurate are price predictions?", "Extra Trees Regressor achieves 96.50% R² accuracy."],
                ["Why is my account status 'pending'?", "New user registrations require Admin approval."]
            ]}
        ]
        
        create_docx_report(docx_filepath, "PricePilot AI: User Operations Manual", "Complete End User Guide & Operational Reference", metadata, sections)
        with open(docx_filepath, "rb") as sf, open(alias_docx, "wb") as df:
            df.write(sf.read())
        print(f"[SUCCESS] Master User Manual DOCX Generated: {docx_filepath}")
    except Exception as e:
        print(f"[ERR] Failed to generate DOCX for User Manual: {e}")


if __name__ == "__main__":
    build_user_manual_pdf()

