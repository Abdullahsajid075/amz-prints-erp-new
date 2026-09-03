#!/usr/bin/env python3
"""Build Amazon Printings Pvt Ltd — Printing & Designing Company Profile PDF."""
from __future__ import annotations

import io
import os
from pathlib import Path

import requests
from PIL import Image
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path("/tmp/amz-book")
FONT = ROOT / "fonts"
IMG = ROOT / "img"
OUT = Path("/workspace/Amazon-Printings-Company-Profile.pdf")
ART = Path("/opt/cursor/artifacts/Amazon-Printings-Company-Profile.pdf")
W, H = A4
ORANGE = HexColor("#F26522")
BLACK = HexColor("#07090c")
INK = HexColor("#0E141B")
MUTED = HexColor("#B8BFC8")
FALLBACK_ID = "photo-1562564055-71e051d33c19"

PHOTOS = {
    "press": "photo-1581092160562-40aa08e78837",
    "shop": "photo-1562564055-71e051d33c19",
    "design": "photo-1519389950473-47ba0277781c",
    "desk": "photo-1542744173-8e7e53415bb0",
    "cards": "photo-1586075010923-2dd4570fb338",
    "pack": "photo-1607349913338-fca6f7fc42d0",
    "merch": "photo-1529374255404-311a2a4f1fd9",
    "invite": "photo-1513885535751-8b9238bd345a",
    "banner": "photo-1561070791-2526d30994b5",
    "car": "photo-1449965408869-eaa3f722e40d",
    "truck": "photo-1593941707882-a5bba14938c7",
    "shirt": "photo-1521572163474-6864f9cf17ab",
    "mug": "photo-1495474472287-4d71bcdd2085",
    "bag": "photo-1553062407-98eeb64c6a62",
    "event": "photo-1540575467063-178a50c2df87",
    "store": "photo-1441986300917-64674bd600d8",
    "label": "photo-1586495777744-4413f21062fa",
    "studio": "photo-1526170375885-4d8ecf77b99f",
    "team": "photo-1522071820081-009f0129c71c",
    "paper": "photo-1452860606245-08befc0ff44b",
    "news": "photo-1504711434969-e33886168f5c",
    "office": "photo-1497366216548-37526070297c",
    "lobby": "photo-1497366811353-6870744d04b2",
    "city": "photo-1486406146926-c627a92ad1ab",
    "tools": "photo-1504148455328-c376907d081c",
    "color": "photo-1550684848-fac1c5b4e853",
    "box": "photo-1535957998253-26ae1ef29506",
    "neon": "photo-1497366754035-f200968a6e72",
    "clothes": "photo-1489987707025-afc232f7ea0f",
    "tee": "photo-1503342217505-b0a15ec3261c",
    "meet": "photo-1517048676732-d65bc937f952",
    "docs": "photo-1586281380349-632531db7ed4",
}

SERVICES = [
    ("Digital Printing", "shop", "Fast, colour-true output for documents and marketing pieces.", [
        ("Color Printing", "color"), ("Black & White", "paper"), ("A4 / A5 / A6", "paper"),
        ("Certificates", "cards"), ("Result Cards", "cards"), ("Invitations", "invite"),
        ("Menus", "invite"), ("Brochures", "design"), ("Flyers", "banner"),
        ("Catalogues", "desk"), ("Reports", "news"), ("Company Profiles", "design"),
        ("Documents", "docs"), ("Forms", "paper"),
    ]),
    ("Offset Printing", "news", "High-volume commercial print for stationery, books and packaging runs.", [
        ("Business Cards", "cards"), ("Letterheads", "paper"), ("Envelopes", "paper"),
        ("Brochures", "design"), ("Flyers", "banner"), ("Books", "desk"),
        ("Registers", "paper"), ("Notebooks", "paper"), ("Catalogues", "desk"),
        ("Corporate Stationery", "cards"), ("Packaging Materials", "pack"), ("Bulk Printing", "press"),
    ]),
    ("Large Format Printing", "banner", "Indoor and outdoor campaigns that command attention at street scale.", [
        ("Flex Printing", "banner"), ("Vinyl Printing", "tools"), ("Banners", "event"),
        ("Outdoor Advertising", "city"), ("Indoor Advertising", "lobby"), ("Promotional Backdrops", "event"),
        ("Event Backdrops", "event"), ("Billboards", "city"), ("Shop Branding", "store"), ("Wall Graphics", "neon"),
    ]),
    ("Signage Solutions", "store", "Durable identity for storefronts, offices and wayfinding.", [
        ("Acrylic Sign Boards", "lobby"), ("3D Sign Boards", "store"), ("LED Sign Boards", "neon"),
        ("Light Boxes", "banner"), ("Shop Signs", "store"), ("Office Signs", "office"),
        ("Reception Signs", "lobby"), ("Directional Signs", "office"), ("Safety Signs", "tools"), ("Corporate Signage", "city"),
    ]),
    ("Branding Services", "design", "Complete visual identity — from logo systems to brand kits.", [
        ("Complete Brand Identity", "design"), ("Logo Design", "color"), ("Brand Guidelines", "desk"),
        ("Brand Kit", "cards"), ("Business Card Design", "cards"), ("Letterhead Design", "paper"),
        ("Packaging Design", "pack"), ("Product Label Design", "label"), ("Social Media Branding", "banner"),
        ("Corporate Branding", "office"),
    ]),
    ("Vehicle Branding", "car", "Moving billboards — wraps and graphics for cars, vans and fleets.", [
        ("Car Branding", "car"), ("Van Branding", "truck"), ("Truck Branding", "truck"),
        ("Bus Branding", "truck"), ("Commercial Vehicles", "truck"), ("Full Vehicle Wrap", "car"),
        ("Partial Wrap", "car"), ("Vinyl Graphics", "tools"), ("Promotional Graphics", "banner"),
    ]),
    ("Promotional Printing", "tee", "Wearables and gifts that keep your brand in customers' hands.", [
        ("T-Shirts", "tee"), ("Workwear", "clothes"), ("Worker Jackets", "clothes"),
        ("Caps", "merch"), ("Mugs", "mug"), ("Magic Mugs", "mug"),
        ("Promotional Bags", "bag"), ("Corporate Gifts", "invite"), ("Keychains", "merch"),
        ("DTF Printing", "shirt"), ("Heat Transfer", "tee"),
    ]),
    ("Cards & Stationery", "cards", "Premium cards, IDs and office stationery with sharp finishing.", [
        ("UV Visiting Cards", "cards"), ("Premium Visiting Cards", "cards"), ("PVC Cards", "cards"),
        ("ID / Employee Cards", "cards"), ("Loyalty Cards", "cards"), ("Invitation Cards", "invite"),
        ("Wedding Cards", "invite"), ("Certificates", "paper"), ("Letterheads", "paper"),
        ("Envelopes", "paper"), ("Receipt / Invoice Books", "docs"), ("Notebooks", "paper"),
    ]),
    ("Stickers & Labels", "label", "Product and packaging labels with clean cuts and durable adhesives.", [
        ("Vinyl Stickers", "label"), ("Product Labels", "pack"), ("Packaging Labels", "box"),
        ("Die-Cut Stickers", "label"), ("Transparent Stickers", "label"), ("Promotional Stickers", "banner"),
        ("Barcode Labels", "box"), ("Product Branding Labels", "pack"),
    ]),
    ("Packaging Solutions", "pack", "Retail-ready packs that protect products and sell on the shelf.", [
        ("Product Boxes", "box"), ("Packaging Sleeves", "pack"), ("Food Packaging", "pack"),
        ("Product Labels", "label"), ("Shopping Bags", "bag"), ("Custom Packaging", "box"),
        ("Retail Packaging", "pack"), ("Corporate Packaging", "desk"),
    ]),
    ("Exhibition & Events", "event", "Stands, backdrops and event systems for launches and trade shows.", [
        ("Roll-Up Stands", "banner"), ("Exhibition Backdrops", "event"), ("Promotional Stands", "event"),
        ("Event Banners", "banner"), ("Step & Repeat", "event"), ("Table Displays", "desk"),
        ("Promotional Boards", "banner"), ("Event Signage", "store"),
    ]),
    ("Graphic Design", "color", "Creative that works in print and on screen.", [
        ("Logo Design", "design"), ("Social Media Posts", "banner"), ("Posters", "banner"),
        ("Flyers", "design"), ("Brochures", "desk"), ("Catalogues", "desk"),
        ("Menu Designs", "invite"), ("Packaging Designs", "pack"), ("Corporate Designs", "office"),
        ("Campaign Designs", "color"),
    ]),
    ("Studio & Documentation", "studio", "Photos, documents, NADRA facilitation and everyday office services.", [
        ("Passport Photos", "studio"), ("Photo Printing", "studio"), ("Document Printing", "docs"),
        ("Scanning", "docs"), ("Photocopy", "news"), ("Document Formatting", "desk"),
        ("NADRA E-Services", "office"), ("Online Applications", "meet"), ("Office Documentation", "paper"),
        ("CV / Resume Design", "design"),
    ]),
]


def register_fonts():
    pdfmetrics.registerFont(TTFont("U", str(FONT / "Unbounded-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("UX", str(FONT / "Unbounded-ExtraBold.ttf")))
    pdfmetrics.registerFont(TTFont("M", str(FONT / "Manrope-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("MS", str(FONT / "Manrope-SemiBold.ttf")))
    pdfmetrics.registerFont(TTFont("MB", str(FONT / "Manrope-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("MX", str(FONT / "Manrope-ExtraBold.ttf")))


def fetch_image(key: str) -> ImageReader:
    pid = PHOTOS.get(key, FALLBACK_ID)
    path = IMG / f"{key}.jpg"
    if not path.exists() or path.stat().st_size < 2000:
        url = f"https://images.unsplash.com/{pid}?auto=format&fit=crop&w=1400&q=80"
        r = requests.get(url, timeout=30)
        if r.status_code != 200 or len(r.content) < 2000:
            url = f"https://images.unsplash.com/{FALLBACK_ID}?auto=format&fit=crop&w=1400&q=80"
            r = requests.get(url, timeout=30)
        path.write_bytes(r.content)
    im = Image.open(path).convert("RGB")
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=88)
    buf.seek(0)
    return ImageReader(buf)


def draw_image_cover(c: canvas.Canvas, key: str, opacity: float = 0.42):
    img = fetch_image(key)
    iw, ih = img.getSize()
    scale = max(W / iw, H / ih)
    nw, nh = iw * scale, ih * scale
    x, y = (W - nw) / 2, (H - nh) / 2
    c.saveState()
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.drawImage(img, x, y, nw, nh, preserveAspectRatio=True, mask="auto")
    c.setFillColor(Color(0.03, 0.035, 0.047, alpha=1 - opacity))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.restoreState()


def photo_page(c: canvas.Canvas, key: str, kicker: str, caption: str):
    img = fetch_image(key)
    iw, ih = img.getSize()
    scale = max(W / iw, H / ih)
    nw, nh = iw * scale, ih * scale
    x, y = (W - nw) / 2, (H - nh) / 2
    c.drawImage(img, x, y, nw, nh, preserveAspectRatio=True, mask="auto")
    c.setFillColor(Color(0, 0, 0, alpha=0.55))
    c.rect(0, 0, W, 150, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.setFont("MX", 10)
    c.drawString(36, 78, kicker.upper())
    c.setFillColor(white)
    c.setFont("UX", 18)
    for i, line in enumerate(simpleSplit(caption, "UX", 18, W - 72)):
        c.drawString(36, 50 - i * 22, line)
    c.showPage()


def footer(c: canvas.Canvas, n: int):
    c.setFillColor(ORANGE)
    c.rect(36, 28, 7, 7, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("MS", 8)
    c.drawString(50, 30, "AMAZON PRINTING SERVICES")
    c.drawRightString(W - 36, 30, f"{n:02d}")


def text_page(c: canvas.Canvas, kicker: str, title: str, paras: list[str], n: int):
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setStrokeColor(HexColor("#2A1A12"))
    c.setLineWidth(1)
    c.rect(18, 18, W - 36, H - 36, fill=0, stroke=1)
    c.setFillColor(ORANGE)
    c.setFont("MX", 10)
    c.drawString(40, H - 58, kicker.upper())
    c.setFillColor(white)
    c.setFont("UX", 28)
    y = H - 100
    for line in simpleSplit(title, "UX", 28, W - 80):
        c.drawString(40, y, line)
        y -= 34
    c.setFillColor(ORANGE)
    c.rect(40, y + 8, 56, 4, fill=1, stroke=0)
    y -= 18
    c.setFillColor(HexColor("#E4E7EC"))
    c.setFont("M", 11.5)
    for p in paras:
        for line in simpleSplit(p, "M", 11.5, W - 80):
            if y < 60:
                break
            c.drawString(40, y, line)
            y -= 16
        y -= 8
    footer(c, n)
    c.showPage()


def table_page(c: canvas.Canvas, kicker: str, title: str, rows: list[tuple[str, str]], n: int):
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setStrokeColor(HexColor("#2A1A12"))
    c.rect(18, 18, W - 36, H - 36, fill=0, stroke=1)
    c.setFillColor(ORANGE)
    c.setFont("MX", 10)
    c.drawString(40, H - 58, kicker.upper())
    c.setFillColor(white)
    c.setFont("UX", 26)
    y = H - 98
    for line in simpleSplit(title, "UX", 26, W - 80):
        c.drawString(40, y, line)
        y -= 32
    y -= 10
    for k, v in rows:
        c.setStrokeColor(HexColor("#2A211C"))
        c.line(40, y - 6, W - 40, y - 6)
        c.setFillColor(ORANGE)
        c.setFont("MX", 8)
        c.drawString(40, y + 6, k.upper())
        c.setFillColor(white)
        c.setFont("MB", 11)
        for i, line in enumerate(simpleSplit(v, "MB", 11, 300)):
            c.drawString(200, y + 6 - i * 14, line)
        y -= 32
    footer(c, n)
    c.showPage()


def toc_page(c: canvas.Canvas, items: list[str], n: int):
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.setFont("MX", 10)
    c.drawString(40, H - 58, "CONTENTS")
    c.setFillColor(white)
    c.setFont("UX", 28)
    c.drawString(40, H - 96, "Inside this book")
    y = H - 140
    for i, t in enumerate(items, 1):
        c.setFillColor(ORANGE)
        c.setFont("MX", 10)
        c.drawString(40, y, f"{i:02d}")
        c.setFillColor(white)
        c.setFont("MB", 11)
        c.drawString(78, y, t)
        c.setStrokeColor(HexColor("#3A2A22"))
        c.setDash(1, 3)
        c.line(78, y - 4, W - 40, y - 4)
        c.setDash()
        y -= 22
        if y < 50:
            break
    footer(c, n)
    c.showPage()


def chips_page(c: canvas.Canvas, kicker: str, title: str, intro: str, chips: list[str], n: int):
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.setFont("MX", 10)
    c.drawString(40, H - 58, kicker.upper())
    c.setFillColor(white)
    c.setFont("UX", 26)
    y = H - 98
    for line in simpleSplit(title, "UX", 26, W - 80):
        c.drawString(40, y, line)
        y -= 32
    c.setFillColor(HexColor("#E4E7EC"))
    c.setFont("M", 11.5)
    for line in simpleSplit(intro, "M", 11.5, W - 80):
        c.drawString(40, y, line)
        y -= 16
    y -= 16
    x = 40
    row_h = 26
    for chip in chips:
        tw = pdfmetrics.stringWidth(chip, "MB", 9) + 18
        if x + tw > W - 40:
            x = 40
            y -= row_h + 8
        c.setStrokeColor(ORANGE)
        c.setFillColor(HexColor("#1A100C"))
        c.roundRect(x, y - 8, tw, row_h, 3, fill=1, stroke=1)
        c.setFillColor(white)
        c.setFont("MB", 9)
        c.drawString(x + 9, y, chip)
        x += tw + 8
    footer(c, n)
    c.showPage()


def values_page(c: canvas.Canvas, n: int):
    vals = [
        "Quality", "Customer Satisfaction", "Innovation", "Reliability",
        "Professionalism", "Integrity", "Creativity", "Timely Delivery",
        "Continuous Improvement", "Technology & Modernization",
    ]
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.setFont("MX", 10)
    c.drawString(40, H - 58, "04 — CORE VALUES")
    c.setFillColor(white)
    c.setFont("UX", 28)
    c.drawString(40, H - 98, "Orange standard.")
    y = H - 150
    col_w = (W - 92) / 2
    for i, v in enumerate(vals):
        col = i % 2
        row = i // 2
        x = 40 + col * (col_w + 12)
        yy = y - row * 52
        c.setStrokeColor(ORANGE)
        c.setFillColor(HexColor("#120E0C"))
        c.rect(x, yy - 18, col_w, 42, fill=1, stroke=1)
        c.setFillColor(ORANGE)
        c.setFont("MX", 8)
        c.drawString(x + 12, yy + 8, f"{i+1:02d}")
        c.setFillColor(white)
        c.setFont("MB", 11)
        c.drawString(x + 12, yy - 8, v)
    footer(c, n)
    c.showPage()


def service_page(c: canvas.Canvas, title: str, intro: str, items: list[tuple[str, str]], n: int):
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.setFont("MX", 10)
    c.drawString(40, H - 52, "SERVICE")
    c.setFillColor(white)
    c.setFont("UX", 24)
    y = H - 88
    for line in simpleSplit(title, "UX", 24, W - 80):
        c.drawString(40, y, line)
        y -= 28
    c.setFillColor(HexColor("#E4E7EC"))
    c.setFont("M", 11)
    for line in simpleSplit(intro, "M", 11, W - 80):
        c.drawString(40, y, line)
        y -= 15
    y -= 12
    col_w = (W - 92) / 2
    box_h = 46
    for i, (name, key) in enumerate(items):
        col = i % 2
        row = i // 2
        x = 40 + col * (col_w + 12)
        yy = y - row * (box_h + 8)
        if yy < 50:
            break
        c.setFillColor(HexColor("#12161C"))
        c.rect(x, yy - 12, col_w, box_h, fill=1, stroke=0)
        try:
            thumb = fetch_image(key)
            c.drawImage(thumb, x + 4, yy - 8, 38, 38, preserveAspectRatio=True, mask="auto")
        except Exception:
            pass
        c.setFillColor(white)
        c.setFont("MB", 9)
        tx = x + 50
        for j, line in enumerate(simpleSplit(name, "MB", 9, col_w - 58)):
            c.drawString(tx, yy + 12 - j * 11, line)
    footer(c, n)
    c.showPage()


def stats_page(c: canvas.Canvas, n: int):
    stats = [("13", "Production Unit"), ("7", "Office Staff"), ("6", "Design Interns"),
             ("4", "Female Office"), ("1", "Marketing Manager"), ("1", "Assistant Marketing")]
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.setFont("MX", 10)
    c.drawString(40, H - 58, "HUMAN RESOURCES")
    c.setFillColor(white)
    c.setFont("UX", 28)
    c.drawString(40, H - 98, "A working house.")
    y = H - 160
    col_w = (W - 92) / 2
    for i, (num, label) in enumerate(stats):
        col = i % 2
        row = i // 2
        x = 40 + col * (col_w + 12)
        yy = y - row * 90
        c.setStrokeColor(ORANGE)
        c.setFillColor(HexColor("#12161C"))
        c.rect(x, yy - 20, col_w, 78, fill=1, stroke=1)
        c.setFillColor(ORANGE)
        c.setFont("UX", 28)
        c.drawCentredString(x + col_w / 2, yy + 22, num)
        c.setFillColor(white)
        c.setFont("MB", 10)
        c.drawCentredString(x + col_w / 2, yy, label)
    c.setFillColor(MUTED)
    c.setFont("M", 10)
    c.drawString(40, 90, "Departments: Management, Design, Digital, Offset, Large Format,")
    c.drawString(40, 76, "Signage, Production, Finishing, Sales, Marketing, Support, IT, Accounts.")
    footer(c, n)
    c.showPage()


def why_page(c: canvas.Canvas, n: int):
    items = [
        "One-stop printing and branding",
        "Wide range of printing services",
        "Professional graphic design",
        "Modern production capabilities",
        "Customized solutions",
        "Corporate printing expertise",
        "Competitive pricing",
        "Quality-focused production",
        "Fast turnaround",
        "Customer-focused service",
        "Digital + traditional print together",
        "Branding + print + digital one company",
    ]
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.setFont("MX", 10)
    c.drawString(40, H - 58, "WHY CHOOSE US")
    c.setFillColor(white)
    c.setFont("UX", 26)
    c.drawString(40, H - 98, "One roof. Full finish.")
    y = H - 140
    for i, t in enumerate(items, 1):
        c.setFillColor(ORANGE)
        c.setFont("MX", 10)
        c.drawString(40, y, f"{i:02d}")
        c.setFillColor(white)
        c.setFont("MB", 12)
        c.drawString(78, y, t)
        y -= 28
    footer(c, n)
    c.showPage()


def portfolio_page(c: canvas.Canvas, tiles: list[tuple[str, str]], n: int):
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    gap = 10
    cols, rows = 2, 2
    pw = (W - 48 - gap) / cols
    ph = (H - 70 - gap) / rows
    for i, (key, cap) in enumerate(tiles):
        col, row = i % cols, i // cols
        x = 24 + col * (pw + gap)
        y = H - 36 - (row + 1) * ph - row * gap
        try:
            c.drawImage(fetch_image(key), x, y, pw, ph, preserveAspectRatio=True, mask="auto")
        except Exception:
            c.setFillColor(INK)
            c.rect(x, y, pw, ph, fill=1, stroke=0)
        c.setFillColor(Color(0, 0, 0, alpha=0.45))
        c.rect(x, y, pw, 28, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("MX", 9)
        c.drawString(x + 8, y + 10, cap.upper())
    footer(c, n)
    c.showPage()


def contact_page(c: canvas.Canvas, n: int):
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.setFont("MX", 10)
    c.drawString(40, H - 70, "CONTACT")
    c.setFillColor(white)
    c.setFont("UX", 36)
    c.drawString(40, H - 120, "Let's print.")
    c.setFillColor(ORANGE)
    c.rect(40, H - 140, 64, 5, fill=1, stroke=0)
    lines = [
        ("Company", "Amazon Printings Pvt Ltd"),
        ("Brand", "Amazon Printing Services"),
        ("CEO", "Muhammad Abdullah Sajid"),
        ("Office", "King Chowk / King Road"),
        ("City", "Mandi Bahauddin, Pakistan"),
        ("WhatsApp", "0327-6650001"),
        ("Website", "amzprints.com"),
        ("Hours", "Mon–Sat · 9am – 6pm"),
    ]
    y = H - 190
    for k, v in lines:
        c.setFillColor(ORANGE)
        c.setFont("MX", 8)
        c.drawString(40, y, k.upper())
        c.setFillColor(white)
        c.setFont("MB", 14)
        c.drawString(40, y - 18, v)
        y -= 48
    footer(c, n)
    c.showPage()


def cover(c: canvas.Canvas):
    img = fetch_image("press")
    iw, ih = img.getSize()
    scale = max(W / iw, H / ih)
    nw, nh = iw * scale, ih * scale
    c.drawImage(img, (W - nw) / 2, (H - nh) / 2, nw, nh, preserveAspectRatio=True, mask="auto")
    c.setFillColor(Color(0.03, 0.035, 0.047, alpha=0.72))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setStrokeColor(ORANGE)
    c.setLineWidth(1.2)
    c.rect(22, 22, W - 44, H - 44, fill=0, stroke=1)
    c.setFillColor(ORANGE)
    c.setFont("MX", 11)
    c.drawString(48, H - 70, "OFFICIAL PROFILE 2026")
    c.setFillColor(white)
    c.setFont("UX", 42)
    y = 280
    for line in ["Amazon", "Printings"]:
        c.drawString(48, y, line)
        y -= 50
    c.setFillColor(ORANGE)
    c.setFont("UX", 32)
    c.drawString(48, y, "Pvt Ltd")
    c.rect(48, y - 22, 72, 5, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("U", 22)
    c.drawString(48, y - 58, "Company Profile")
    c.setFillColor(MUTED)
    c.setFont("MS", 12)
    c.drawString(48, y - 80, "(Printing and Designing Services)")
    c.showPage()


def back_cover(c: canvas.Canvas):
    img = fetch_image("press")
    iw, ih = img.getSize()
    scale = max(W / iw, H / ih)
    nw, nh = iw * scale, ih * scale
    c.drawImage(img, (W - nw) / 2, (H - nh) / 2, nw, nh, preserveAspectRatio=True, mask="auto")
    c.setFillColor(Color(0.03, 0.035, 0.047, alpha=0.78))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setStrokeColor(ORANGE)
    c.rect(22, 22, W - 44, H - 44, fill=0, stroke=1)
    c.setFillColor(white)
    c.setFont("UX", 36)
    c.drawCentredString(W / 2, H / 2 + 20, "Amazon Printings")
    c.setFillColor(ORANGE)
    c.rect(W / 2 - 36, H / 2, 72, 4, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("MB", 13)
    c.drawCentredString(W / 2, H / 2 - 28, "amzprints.com")
    c.setFillColor(ORANGE)
    c.setFont("MX", 12)
    c.drawCentredString(W / 2, H / 2 - 50, "WhatsApp 0327-6650001")
    c.showPage()


def build():
    IMG.mkdir(parents=True, exist_ok=True)
    register_fonts()
    print("Downloading images...")
    for k in PHOTOS:
        fetch_image(k)
        print(" ", k)

    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("Amazon Printings Pvt Ltd — Company Profile (Printing and Designing Services)")
    c.setAuthor("Amazon Printings Pvt Ltd")
    n = 1

    cover(c)

    photo_page(c, "city", "Identity", "Mandi Bahauddin, Pakistan")
    table_page(c, "Company Identity", "Amazon Printings Pvt Ltd", [
        ("Registered", "Amazon Printings Pvt Ltd."),
        ("Brand", "Amazon Printing Services"),
        ("Type", "Printing, Advertising, Branding & Digital"),
        ("CEO", "Muhammad Abdullah Sajid"),
        ("Office", "King Chowk / King Road, Mandi Bahauddin"),
        ("WhatsApp", "0327-6650001"),
        ("Website", "amzprints.com"),
        ("Hours", "Mon–Sat · 9am – 6pm"),
    ], n); n += 1

    toc = [
        "Company Identity", "Introduction", "CEO Message", "Vision & Mission", "Core Values",
        "Digital Printing", "Offset Printing", "Large Format", "Signage", "Branding",
        "Vehicle Branding", "Promotional", "Cards & Stationery", "Stickers & Labels", "Packaging",
        "Exhibition & Events", "Graphic Design", "Studio & Docs", "Production", "Our Team",
        "Quality", "Markets", "Portfolio", "Why Choose Us", "Contact",
    ]
    toc_page(c, toc, n); n += 1

    photo_page(c, "shop", "01 — Head Office", "King Road, Mandi Bahauddin")
    text_page(c, "01 — The Company", "Print. Brand. Deliver.", [
        "Amazon Printings Pvt Ltd — trading as Amazon Printing Services — is a full-service print, branding and advertising house.",
        "From King Chowk / King Road, Mandi Bahauddin, we produce commercial print, large-format campaigns, signage, vehicle branding, packaging and graphic design under one roof.",
        "We serve individuals, retailers, corporates, schools, hospitals, restaurants, real estate, agencies and government organisations across Punjab and Pakistan.",
    ], n); n += 1

    photo_page(c, "office", "02 — Leadership", "Chief Executive Officer")
    text_page(c, "02 — CEO Message", "Craft you can trust.", [
        "Every brand deserves print that feels intentional — sharp colour, reliable timelines, and creative that earns repeat work.",
        "From Mandi Bahauddin to clients across Pakistan, our team builds lasting partnerships through craftsmanship and clear communication.",
        "Whether you need a visiting card or a complete branding system, we deliver with professionalism and care.",
        "Muhammad Abdullah Sajid  ·  Chief Executive Officer  ·  Amazon Printings Pvt Ltd",
    ], n); n += 1

    photo_page(c, "press", "03 — Direction", "Vision & Mission")
    text_page(c, "03 — Vision & Mission", "Built to lead.", [
        "Vision — To become a trusted and leading printing, branding, advertising and digital solutions company, delivering innovative, high-quality and reliable solutions to businesses, organisations and individuals in Pakistan and international markets.",
        "Mission — To provide professional printing, branding, design, advertising and digital solutions through modern technology, skilled professionals, quality materials and customer-focused service.",
    ], n); n += 1

    photo_page(c, "design", "04 — Values", "How we work")
    values_page(c, n); n += 1

    for i, (title, hero, intro, items) in enumerate(SERVICES, 5):
        photo_page(c, hero, f"{i:02d} — Service", title)
        service_page(c, title, intro, items, n); n += 1

    photo_page(c, "tools", "Production", "In-house facilities")
    service_page(c, "Made on our floor.", "Digital, offset, large format, signage, acrylic, vinyl, DTF, finishing and quality control — under one roof.", [
        ("Digital Printing Unit", "shop"), ("Offset Printing", "news"), ("Large Format", "banner"),
        ("Signage / Acrylic", "store"), ("Vinyl / Stickers", "label"), ("DTF Printing", "shirt"),
        ("Finishing & Cutting", "cards"), ("Quality Control", "desk"),
    ], n); n += 1

    photo_page(c, "team", "Team", "People behind the press")
    stats_page(c, n); n += 1

    photo_page(c, "color", "Quality", "Checked at every station")
    text_page(c, "Quality Policy", "Colour that matches.", [
        "Every job passes design, production and finishing checks before handover.",
        "Quality raw materials. Professional design process. Pre-production checking. Production quality control. Colour consistency. Finishing inspection. Final product inspection. Customer approval where required. Timely delivery. Continuous improvement.",
    ], n); n += 1

    photo_page(c, "city", "Markets", "Pakistan and beyond")
    chips_page(c, "Industries", "Who we serve.", "Primary market: Mandi Bahauddin · Punjab · Pakistan. Expansion focus: Saudi Arabia, UAE, Qatar, Oman, Kuwait, United Kingdom, Europe, Estonia.", [
        "Individuals", "Retail", "Corporate", "Schools", "Colleges", "Universities", "Hospitals",
        "Pharmacies", "Restaurants", "Hotels", "Real Estate", "Banks", "Government", "NGOs",
        "Startups", "Manufacturers", "Distributors", "Agencies", "Events",
    ], n); n += 1

    portfolio_page(c, [("cards", "Stationery"), ("pack", "Packaging"), ("banner", "Campaigns"), ("tee", "Promotional")], n); n += 1
    portfolio_page(c, [("car", "Vehicle"), ("event", "Events"), ("store", "Signage"), ("invite", "Invitations")], n); n += 1

    photo_page(c, "shop", "Choose us", "Why Amazon Printing Services")
    why_page(c, n); n += 1

    photo_page(c, "lobby", "Group", "Associated companies")
    text_page(c, "Group Companies", "Partners in growth.", [
        "Bitrex Solutions — IT & digital solutions company with Pakistan operations (Lahore / Islamabad) and an international business focus.",
        "Telenoc — Regional / international technology support based in Riyadh, Saudi Arabia, supporting operations across the wider GCC region.",
        "Presented as associated companies, subject to confirming exact legal relationships.",
    ], n); n += 1

    photo_page(c, "store", "Visit", "King Chowk / King Road")
    contact_page(c, n)

    back_cover(c)
    c.save()
    ART.parent.mkdir(parents=True, exist_ok=True)
    ART.write_bytes(OUT.read_bytes())
    print("Wrote", OUT, OUT.stat().st_size)
    print("Wrote", ART)


if __name__ == "__main__":
    build()
