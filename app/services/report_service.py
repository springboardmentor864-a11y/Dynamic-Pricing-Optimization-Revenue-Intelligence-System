import io
import csv
from app.services.comparison_engine import PriceComparisonEngine

class PricingReportService:

    @classmethod
    def generate_report_data(cls, category_id=None, position_filter=None, search_query=None):
        """
        Generates structured data rows for pricing comparison report.
        """
        comparison_res = PriceComparisonEngine.get_catalog_comparison(
            category_id=category_id,
            position_filter=position_filter,
            search_query=search_query,
            limit=None,
            offset=0
        )

        rows = []
        for item in comparison_res['comparisons']:
            our_price = item['our_price']
            avg_price = item['average_competitor_price']
            min_price = item['lowest_competitor_price']
            max_price = item['highest_competitor_price']
            pos = item['price_position']
            gap_pct = item['price_difference_pct']
            gap_abs = item['price_difference']

            # Generate smart pricing recommendation
            if pos == 'Overpriced':
                rec = f"Lower price by R$ {abs(gap_abs):.2f} ({abs(gap_pct):.1f}%) to match market average."
            elif pos == 'Premium':
                rec = f"Price is premium. Consider a slight 2-4% reduction if conversion drops."
            elif pos == 'Competitive':
                rec = f"Price is competitive. Maintain current price."
            elif pos == 'Lowest':
                if avg_price and avg_price > our_price:
                    potential_gain = round(avg_price - our_price, 2)
                    rec = f"Lowest price in market. Opportunity to increase by up to R$ {potential_gain:.2f} for margin enhancement."
                else:
                    rec = f"Lowest market price. Maintain for high volume."
            else:
                rec = "Insufficient competitor data."

            rows.append({
                'Product SKU': item['product_id'],
                'Category': item['category_name'],
                'Our Price (BRL)': f"{our_price:.2f}",
                'Lowest Competitor Price (BRL)': f"{min_price:.2f}" if min_price is not None else "N/A",
                'Average Market Price (BRL)': f"{avg_price:.2f}" if avg_price is not None else "N/A",
                'Highest Competitor Price (BRL)': f"{max_price:.2f}" if max_price is not None else "N/A",
                'Price Gap (BRL)': f"{gap_abs:+.2f}" if avg_price is not None else "N/A",
                'Price Gap (%)': f"{gap_pct:+.1f}%" if avg_price is not None else "N/A",
                'Competitor Count': item['competitor_count'],
                'Competitive Rank': pos,
                'Pricing Recommendation': rec
            })

        return {
            'summary': comparison_res['summary'],
            'rows': rows
        }

    @classmethod
    def export_csv(cls, report_data):
        """
        Exports report rows as CSV string stream.
        """
        output = io.StringIO()
        rows = report_data.get('rows', [])
        if not rows:
            return ""

        headers = list(rows[0].keys())
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)

        return output.getvalue()

    @classmethod
    def export_excel(cls, report_data):
        """
        Exports report as Excel (.xlsx) file bytes. Fallbacks to CSV if openpyxl/pandas not installed.
        """
        rows = report_data.get('rows', [])
        try:
            import pandas as pd
            df = pd.DataFrame(rows)
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Price Comparison Report', index=False)
            return output.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'
        except ImportError:
            # Fallback to CSV format with Excel MIME type
            csv_str = cls.export_csv(report_data)
            return csv_str.encode('utf-8'), 'text/csv', 'csv'

    @classmethod
    def export_pdf(cls, report_data):
        """
        Exports report as PDF file bytes. Fallbacks to plain text PDF stream if reportlab not installed.
        """
        rows = report_data.get('rows', [])
        summary = report_data.get('summary', {})

        try:
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors

            output = io.BytesIO()
            doc = SimpleDocTemplate(output, pagesize=landscape(letter), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
            elements = []
            styles = getSampleStyleSheet()

            title_style = ParagraphStyle(
                'ReportTitle',
                parent=styles['Heading1'],
                fontSize=18,
                textColor=colors.HexColor('#1e293b'),
                spaceAfter=12
            )
            elements.append(Paragraph("PricePilot AI — Competitor Price Comparison Report", title_style))

            summary_text = (
                f"Total Products: {summary.get('total_products', 0)} | "
                f"Mapped Products: {summary.get('total_mapped_products', 0)} | "
                f"Tracked Competitors: {summary.get('total_competitors_tracked', 0)} | "
                f"Avg Catalog Gap: R$ {summary.get('avg_catalog_price_gap', 0):.2f}"
            )
            elements.append(Paragraph(summary_text, styles['Normal']))
            elements.append(Spacer(1, 15))

            if rows:
                col_headers = ['SKU', 'Category', 'Our Price', 'Min Comp', 'Avg Market', 'Max Comp', 'Gap %', 'Rank', 'Recommendation']
                data = [col_headers]
                for r in rows:
                    data.append([
                        r['Product SKU'][:16],
                        r['Category'][:14],
                        r['Our Price (BRL)'],
                        r['Lowest Competitor Price (BRL)'],
                        r['Average Market Price (BRL)'],
                        r['Highest Competitor Price (BRL)'],
                        r['Price Gap (%)'],
                        r['Competitive Rank'],
                        r['Pricing Recommendation'][:40]
                    ])

                t = Table(data, repeatRows=1)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1'))
                ]))
                elements.append(t)

            doc.build(elements)
            return output.getvalue(), 'application/pdf', 'pdf'
        except Exception:
            # Clean fallback formatted plain text PDF stream
            buffer = io.BytesIO()
            lines = ["========================================================================\n"]
            lines.append("PricePilot AI — Competitor Price Comparison Report\n")
            lines.append("========================================================================\n\n")
            for r in rows:
                lines.append(f"SKU: {r['Product SKU']} | Category: {r['Category']}\n")
                lines.append(f"  Our Price: {r['Our Price (BRL)']} | Market Avg: {r['Average Market Price (BRL)']} | Rank: {r['Competitive Rank']}\n")
                lines.append(f"  Recommendation: {r['Pricing Recommendation']}\n")
                lines.append("-" * 72 + "\n")
            buffer.write("".join(lines).encode('utf-8'))
            return buffer.getvalue(), 'text/plain', 'txt'
