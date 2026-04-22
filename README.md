# Nerval Quick Estimate Creator

A professional, web-based quotation and estimate system built for **Nerval** — designed for millwork, cabinetry, glass, and construction trades. Create branded quotes with line items, architectural drawings, pin annotations, and save as PDF.

**Live →** [https://icoolaca.github.io/Quote-Generator-Nrv/](https://icoolaca.github.io/Quote-Generator-Nrv/)

---

## Features

### Quotation Builder
- **Nerval-branded layout** — red/charcoal/white with embedded Nerval SVG logo
- **Editable document title** — change "QUOTATION" to "ESTIMATE", "INVOICE", or anything
- **Editable number label** — "#:" by default, change to "Quote:", "Ref:", "PO:", etc.
- **Editable contact info** — two-line textarea in the red header for phone, fax, address
- **Client info** — Prepared For / Ship To with proper form fields (auto-complete enabled)
- **Meta fields** — Customer #, Carrier, PO #, Ship Date, Salesperson (with mobile inline labels)
- **Quote number & date** — auto-generated, fully editable

### Line Items Table
- Add, duplicate, and remove rows
- Columns: LN, Image, Item No, Qty, UOM, Description, Net Price, Ext Amt
- **Proportional column widths** — Image, Item No, and Description adjustable via Settings or by dragging header dividers. Always fills 100%.
- **Item images** — upload, drag-and-drop, or **paste from clipboard** (Ctrl+V)
- **Auto-growing description** — textarea expands as you type
- **Bordered inputs** — all fields have visible borders for clarity

### Visibility Toggles
- **Prices toggle** — hide/show Net Price and Ext Amt columns
- **Extras toggle** — hide/show Freight, PST, Deposit, and Balance (defaults to Simple/hidden)

### Drawings & Visuals
- Upload kitchen plans, renderings, or architectural drawings
- **Zoom & pan canvas** — +/− buttons to zoom, Space+drag to pan
- **Pin annotations** — click to place, drag to move, edit text inline. Pins stay accurate at any zoom level.
- Each drawing gets its own title, total price, and notes
- Drawing titles appear in the summary totals (e.g. "Kitchen Plan $9,180.00" instead of generic "Drawings")
- Pins render in printed/saved PDF

### Settings & Customization
- **Font sizes** — sliders for Header, Subheader, Body, Small, Contact Info, and Pin Size
- **Column widths** — ratio sliders for Image, Item No, Description
- **Company logo** — Nerval logo default, replaceable
- **Currency selector** — CAD, USD, EUR, GBP, AUD
- **Notes and Terms & Conditions** fields
- **All CSS in `src/styles.css`** — edit directly for full styling control

### Calculations
- Auto-calculated subtotals per drawing and for line items
- GST/HST with editable rate (always visible)
- Freight, PST, Deposit, Balance (toggleable via Extras switch)
- Grand total

### Save & Print
- **Save as PDF** — opens print dialog, choose "Save as PDF" as destination
- **Print** — browser print with clean multi-page layout
- Both use native browser rendering for reliable multi-page output with all images

### Data Persistence
- **Auto-save** — all changes save to localStorage automatically
- **Save / Load / Duplicate** — store up to 50 named quotations
- **New quote** — one-click reset with fresh number

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

1. **Settings → Pages → Source → GitHub Actions**
2. Push to `main` — auto-builds and deploys
3. Live at `https://<username>.github.io/Quote-Generator-Nrv/`

---

## Customizing Styles

All CSS is in **`src/styles.css`** — organized into labeled sections:

| Section | Classes |
|---------|---------|
| Buttons | `.nv-btn`, `.nv-btn-red`, `.nv-btn-dark` |
| Inputs | `.nv-cell-input`, `.nv-field-label` |
| Table | `.nv-row`, `.nv-hdr-cell`, `.nv-table-scroll` |
| Toggle | `.nv-toggle` |
| Canvas | `.nv-canvas-viewport` |
| Pins | `.nv-pin-dot`, `.nv-pin-label-main`, `.nv-pin-label-sub` |
| Logo | `.nv-logo` |
| Layout | `.nv-card`, `.nv-red-stripe`, `.nv-toast` |
| Mobile | `.nv-mobile-card`, `.nv-mob-label` |

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
| Paste image | **Ctrl+V** (click cell first) |
| Pan drawing | **Space + drag** |
| Place pin | **Click** on image |
| Move pin | **Drag** the pin dot |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| UI | React 18 |
| Build | Vite 6 |
| PDF | Native browser print → Save as PDF |
| Fonts | Barlow / Barlow Condensed (Google Fonts) |
| Storage | localStorage |
| Styling | Plain CSS (`styles.css`) |

---

## Built By

**JohnL** — Product Designer & Developer

---

## License

MIT
