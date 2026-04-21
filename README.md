# Nerval Quotation Generator

A professional, web-based quotation system built for **Nerval** — designed for millwork, cabinetry, glass, and construction trades. Create branded quotes with line items, architectural drawings, pin annotations, and export to PDF in seconds.

**Live →** [https://icoolaca.github.io/Quote-Generator-Nrv/](https://icoolaca.github.io/Quote-Generator-Nrv/)

---

## Features

### Quotation Builder
- **Nerval-branded layout** — red/charcoal/white matching the corporate quotation format
- **Client info** — Prepared For / Ship To with full address fields
- **Meta fields** — Customer #, Carrier, PO #, Ship Date, Salesperson
- **Quote number & date** — auto-generated, fully editable

### Line Items Table
- Add, duplicate, and remove rows
- Columns: LN, Image, Item No, Qty, UOM, Description, Net Price, Ext Amt
- **Percentage-based column widths** — adjust via Settings panel sliders or drag the dividers between column headers directly
- **Item images** — upload, drag-and-drop, or **paste from clipboard** (Ctrl+V). Cells expand to 200×100px when an image is present, stay compact when empty
- **Price toggle** — hide Net Price / Ext Amt columns for clean client-facing quotes

### Drawings & Visuals
- Upload kitchen plans, renderings, or architectural drawings
- **Zoom & pan canvas** — scroll to zoom (0.25×–5×), Alt+drag to pan
- **Pin annotations** — click anywhere on the drawing to drop a pin with a main label and sub-text for specifications. Pins stay locked to the image coordinates at any zoom level and are never clipped by the container
- Each drawing gets its own title, total price, and notes field
- Pins render in the exported PDF

### Settings & Customization
- **Font sizes** — sliders for Header, Subheader, Body, and Small text sizes
- **Column widths** — percentage sliders for every column, with live preview
- Company logo upload
- Currency selector (CAD, USD, EUR, GBP, AUD)
- Notes and Terms & Conditions fields

### Calculations
- Auto-calculated subtotals for line items and drawings
- Freight, GST/HST, PST with editable rates
- Grand total, deposit, and balance

### Export & Sharing
- **PDF export** — generates a professional A4 PDF with all images, drawings, pin annotations, and totals preserved
- **Print** — browser print with clean layout (form controls hidden)

### Data Persistence
- **Auto-save** — all changes save to localStorage automatically
- **Save / Load** — store up to 50 named quotations and switch between them
- **New quote** — one-click reset with fresh quote number

---

## Quick Start

```bash
git clone https://github.com/icoolaca/Quote-Generator-Nrv.git
cd Quote-Generator-Nrv
npm install
npm run dev
```

Open **http://localhost:5173** — that's it.

---

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow that auto-builds and deploys on every push to `main`.

1. Go to **Settings → Pages → Source → GitHub Actions**
2. Push to `main` — the workflow handles the rest
3. Live at `https://<username>.github.io/Quote-Generator-Nrv/`

To deploy elsewhere (Netlify, Vercel, any static host):

```bash
npm run build
# Upload the dist/ folder
```

---

## Project Structure

```
Quote-Generator-Nrv/
├── index.html                    # Entry point
├── package.json                  # Dependencies (React 18, Vite 6)
├── vite.config.js                # Build config with base URL
├── src/
│   ├── main.jsx                  # React mount
│   └── App.jsx                   # Entire application (single file)
└── .github/
    └── workflows/
        └── deploy.yml            # Auto-deploy to GitHub Pages
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| UI | React 18 |
| Build | Vite 6 |
| PDF | html2pdf.js (CDN) |
| Fonts | Barlow / Barlow Condensed (Google Fonts) |
| Storage | localStorage |

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Paste image into item or drawing | **Ctrl+V** (click the cell first) |
| Pan drawing canvas | **Alt + drag** |
| Zoom drawing canvas | **Scroll wheel** |
| Place pin on drawing | **Click** on the image |

---

## License

MIT
