from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


output = Path(__file__).resolve().parents[1] / "output" / "pdf" / "mic-xero-sample-invoice.pdf"
output.parent.mkdir(parents=True, exist_ok=True)

styles = getSampleStyleSheet()
doc = SimpleDocTemplate(
    str(output),
    pagesize=A4,
    rightMargin=18 * mm,
    leftMargin=18 * mm,
    topMargin=16 * mm,
    bottomMargin=16 * mm,
    title="MIC Xero Sample Invoice",
)

story = []
header = Table(
    [
        [Paragraph("<b>TAX INVOICE</b>", styles["Title"]), Paragraph("<b>MIC AUTO PARTS</b>", styles["Heading2"])],
        ["", Paragraph("12 Industrial Avenue<br/>Dandenong South VIC 3175<br/>Australia", styles["Normal"])],
    ],
    colWidths=[105 * mm, 55 * mm],
)
header.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ("TEXTCOLOR", (0, 0), (0, 0), colors.HexColor("#173f2c")),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.append(header)
story.append(Spacer(1, 8 * mm))

details = Table(
    [
        [Paragraph("<b>To</b>", styles["Normal"]), "Invoice Date", "17 October 2026"],
        ["Capital SMART Dandenong South", "Invoice Number", "INV-TEST-1042"],
        ["42-44 Kitchen Road", "Reference", "CS-24017"],
        ["DANDENONG SOUTH VIC 3175", "Due Date", "31 October 2026"],
    ],
    colWidths=[92 * mm, 34 * mm, 34 * mm],
)
details.setStyle(TableStyle([
    ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
    ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
    ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#657168")),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story.append(details)
story.append(Spacer(1, 10 * mm))

items = [
    ["Description", "Part number", "Price AUD"],
    ["Front bumper bar", "C0065 32 333", "245.00"],
    ["Bumper reinforcement", "MG3015-BRKT", "89.50"],
    ["Left bumper guide", "52116-TBA-A00", "36.00"],
]
parts = Table(items, colWidths=[82 * mm, 48 * mm, 30 * mm], repeatRows=1)
parts.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#173f2c")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTNAME", (1, 1), (1, -1), "Courier-Bold"),
    ("ALIGN", (2, 0), (2, -1), "RIGHT"),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d8ddd5")),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f6f2")]),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 9),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
]))
story.append(parts)
story.append(Spacer(1, 8 * mm))

totals = Table(
    [["Subtotal", "370.50"], ["TOTAL GST 10%", "37.05"], ["TOTAL AUD", "407.55"]],
    colWidths=[130 * mm, 30 * mm],
)
totals.setStyle(TableStyle([
    ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
    ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
    ("LINEABOVE", (0, 2), (-1, 2), 1, colors.HexColor("#173f2c")),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(totals)
story.append(Spacer(1, 20 * mm))
story.append(Paragraph("This is a fictional invoice created only for MIC Auto workflow testing.", styles["Italic"]))

doc.build(story)
print(output)
