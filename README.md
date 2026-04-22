# Nerval Quick Estimate Creator

A professional, web-based quotation and estimate system built for **Nerval** — designed for millwork, cabinetry, glass, and construction trades. Create branded quotes with line items, architectural drawings, pin annotations, and export to PDF.

**Live →** [https://icoolaca.github.io/Quote-Generator-Nrv/](https://icoolaca.github.io/Quote-Generator-Nrv/)

---

## Features

### Quotation Builder
- **Nerval-branded layout** — red/charcoal/white with embedded Nerval SVG logo
- **Editable document title** — change "QUOTATION" to "ESTIMATE", "INVOICE", or anything
- **Client info** — Prepared For / Ship To with proper form fields (auto-complete enabled)
- **Meta fields** — Customer #, Carrier, PO #, Ship Date, Salesperson
- **Quote number & date** — auto-generated, fully editable

### Line Items Table
- Add, duplicate, and remove rows
- Columns: LN, Image, Item No, Qty, UOM, Description, Net Price, Ext Amt
- **Proportional column widths** — Image, Item No, and Description are adjustable via Settings sliders or by dragging header dividers. Other columns are fixed. Always sums to 100%.
- **Item images** — upload, drag-and-drop, or **paste from clipboard** (Ctrl+V)
- **Auto-growing description** — textarea expands as you type
- **Bordered inputs** — all fields have visible borders for clarity on mobile and desktop
- **Horizontal scroll** — thin scrollbar appears if content exceeds viewport

### Visibility Toggles
- **Prices toggle** — hide/show Net Price and Ext Amt columns for clean client-facing quotes
- **Extras toggle** — hide/show Freight, PST, Deposit, and Balance for simplified estimates

### Drawings & Visuals
- Upload kitchen plans, renderings, or architectural drawings
- **Zoom & pan canvas** — use +/− buttons to zoom, Space+drag to pan
- **Pin annotations** — click anywhere on the drawing to place a pin with a main label and sub-text for specifications. Drag pins to reposition. Pins stay locked to image coordinates at any zoom level.
- Each drawing gets its own title, total price, and notes field
- Pins render in the exported PDF

### Settings & Customization
- **Font sizes** — sliders for Header, Subheader, Body, Small, and Pin Size
- **Column widths** — ratio sliders for Image, Item No, Description
- **Company logo** — Nerval logo included by default, replaceable
- **Currency selector** — CAD, USD, EUR, GBP, AUD
- **Notes and Terms & Conditions** fields
- **All CSS in `src/styles.css`** — edit directly for full styling control

### Calculations
- Auto-calculated subtotals for line items and drawings
- Freight, GST/HST, PST with editable rates
- Grand total, deposit, and balance

### Export & Sharing
- **PDF export** — professional A4 PDF with all images, drawings, pins, and totals
- **Print** — browser print with clean layout

### Data Persistence
- **Auto-save** — all changes save to localStorage automatically
- **Save / Load / Duplicate** — store up to 50 named quotations, duplicate with one click
- **New quote** — one-click reset with fresh quote number

### Mobile Responsive
- Stacked card layout on narrow screens with inline field labels
- All grids collapse to single column
- Touch-friendly inputs and controls

---

## Quick Start

```bash
git clone https://github.com/icoolaca/Quote-Generator-Nrv.git
cd Quote-Generator-Nrv
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Deploy to GitHub Pages

1. Go to **Settings → Pages → Source → GitHub Actions**
2. Push to `main` — the included workflow auto-builds and deploys
3. Live at `https://<username>.github.io/Quote-Generator-Nrv/`

---

## Customizing Styles

All CSS is in **`src/styles.css`** — organized into labeled sections:

- Fonts & Reset
- Animations
- Buttons (`.nv-btn`, `.nv-btn-red`, `.nv-btn-dark`)
- Table rows (`.nv-row`)
- Inputs (`.nv-cell-input`, `.nv-field-label`)
- Toggle switch (`.nv-toggle`)
- Column resizers (`.col-resizer`, `.nv-hdr-cell`)
- Drawing canvas (`.nv-canvas-viewport`)
- Pin annotations (`.nv-pin-dot`, `.nv-pin-label-main`, `.nv-pin-label-sub`)
- Logo (`.nv-logo`)
- Toast notifications (`.nv-toast`)
- Top bar (`.nv-topbar`)
- Side panels (`.nv-panel`)
- Mobile responsive (`@media max-width: 768px`)
- Print (`@media print`)

Edit any class, push, and it deploys.

---

## Project Structure

```
Quote-Generator-Nrv/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx              # React mount
│   ├── App.jsx               # Application logic
│   └── styles.css            # All styles (edit here)
└── .github/
    └── workflows/
        └── deploy.yml        # Auto-deploy
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Paste image into item or drawing | **Ctrl+V** (click cell first) |
| Pan drawing canvas | **Space + drag** |
| Place pin on drawing | **Click** on image |
| Move pin | **Drag** the pin dot |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| UI | React 18 |
| Build | Vite 6 |
| PDF | html2pdf.js (CDN) |
| Fonts | Barlow / Barlow Condensed (Google Fonts) |
| Storage | localStorage |
| Styling | Plain CSS (`styles.css`) |

---

## License

MIT
