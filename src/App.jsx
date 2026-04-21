import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/*
 * ═══════════════════════════════════════════════════════════════
 *  NERVAL QUOTATION GENERATOR
 *  - Nerval brand: red (#C8102E) / charcoal / white
 *  - Drawings/renderings section for quick visual quotes
 *  - Toggle to hide/show unit prices for clean client view
 *  - PDF export with html2pdf.js
 *  - Persistent storage via localStorage
 * ═══════════════════════════════════════════════════════════════
 */

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().split("T")[0];
const fmt = (n, cur = "CAD") =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: cur,
    minimumFractionDigits: 2,
  }).format(n);

const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AUD"];

const emptyItem = () => ({
  id: uid(), itemNo: "", qty: 1, uom: "ea",
  description: "", netPrice: 0, image: null,
});

const emptyDrawing = () => ({
  id: uid(), image: null, title: "", totalPrice: 0, notes: "",
});

const DEFAULT = {
  quoteNumber: "34130",
  date: today(),
  shipDate: "",
  currency: "CAD",
  preparedFor: { name: "Kanvi Homes", address: "# 101, 1290-91 Street NW", cityProv: "Edmonton, AB T6X 0P2" },
  shipTo: { name: "Kanvi Homes", address: "# 101, 1290-91 Street NW", cityProv: "Edmonton, AB T6X 0P2", phone: "780-439-9000", email: "" },
  customerNo: "Kan9-90",
  carrier: "BestWay",
  poNumber: "Element",
  eta: "SEE TERMS",
  fob: "NA",
  salesperson: "",
  items: [emptyItem()],
  drawings: [],
  freight: 0,
  gstRate: 5,
  pstRate: 0,
  deposit: 0,
  notes: "Prices valid for 30 days from date of your quote.",
  termsNotes:
    "Returns: Note that product returns are not accepted after 45 days. All returns must be accompanied by the original receipt. Product must be returned in original packaging.\nCustom orders and clearance/discontinued items are not returnable.\nCustom order delivery schedules may vary due to circumstances beyond our control. Orders may not be cancelled due to extended delivery projections.",
  showPrices: true,
  logo: null,
};

const STORAGE_KEY = "nerval-quote-data";
const SAVED_KEY = "nerval-saved-quotes";

/* ─── localStorage helpers ─── */
const loadStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveStorage = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn("Storage save failed:", e);
  }
};

/* ─── html2pdf loader ─── */
const loadHtml2Pdf = () =>
  new Promise((resolve) => {
    if (window.html2pdf) return resolve(window.html2pdf);
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    s.onload = () => resolve(window.html2pdf);
    document.head.appendChild(s);
  });

/* ─── Icons ─── */
const I = ({ d, size = 17, ...p }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d={d} />
  </svg>
);
const Plus = (p) => <I d="M12 5v14M5 12h14" {...p} />;
const Trash = (p) => (
  <I
    d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-1 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6h10z"
    {...p}
  />
);
const Download = (p) => (
  <I d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" {...p} />
);
const Printer = (p) => (
  <I
    d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"
    {...p}
  />
);
const Img = (p) => (
  <I
    d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21"
    {...p}
  />
);
const SaveIcon = (p) => (
  <I
    d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8"
    {...p}
  />
);
const Folder = (p) => (
  <I
    d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
    {...p}
  />
);
const XIcon = (p) => <I d="M18 6L6 18M6 6l12 12" {...p} />;
const Eye = (p) => (
  <I
    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
    {...p}
  />
);
const EyeOff = (p) => (
  <I
    d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 01-4.24-4.24M1 1l22 22"
    {...p}
  />
);
const Layers = (p) => (
  <I d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" {...p} />
);
const FileText = (p) => (
  <I
    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"
    {...p}
  />
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [s, setS] = useState(() => {
    const saved = loadStorage(STORAGE_KEY);
    return saved ? { ...DEFAULT, ...saved } : DEFAULT;
  });
  const [savedList, setSavedList] = useState(() => loadStorage(SAVED_KEY) || []);
  const [panel, setPanel] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("items");
  const printRef = useRef(null);
  const fileRefs = useRef({});
  const drawingRefs = useRef({});

  // Auto-save on state change
  useEffect(() => {
    const t = setTimeout(() => saveStorage(STORAGE_KEY, s), 500);
    return () => clearTimeout(t);
  }, [s]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const set = useCallback((path, val) => {
    setS((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let o = next;
      for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
      o[keys[keys.length - 1]] = val;
      return next;
    });
  }, []);

  const updateItem = useCallback((id, field, val) => {
    setS((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, [field]: val } : i)),
    }));
  }, []);

  const updateDrawing = useCallback((id, field, val) => {
    setS((prev) => ({
      ...prev,
      drawings: prev.drawings.map((d) =>
        d.id === id ? { ...d, [field]: val } : d
      ),
    }));
  }, []);

  const addItem = () =>
    setS((p) => ({ ...p, items: [...p.items, emptyItem()] }));
  const removeItem = (id) =>
    setS((p) => ({
      ...p,
      items: p.items.length > 1 ? p.items.filter((i) => i.id !== id) : p.items,
    }));
  const addDrawing = () =>
    setS((p) => ({ ...p, drawings: [...p.drawings, emptyDrawing()] }));
  const removeDrawing = (id) =>
    setS((p) => ({ ...p, drawings: p.drawings.filter((d) => d.id !== id) }));

  const handleFile = (refMap, id, field, file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = (e) => {
      if (field === "logo") set("logo", e.target.result);
      else if (refMap === "item") updateItem(id, field, e.target.result);
      else updateDrawing(id, field, e.target.result);
    };
    r.readAsDataURL(file);
  };

  const handleDrop = (e, refMap, id, field) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(refMap, id, field, f);
  };

  /* ─── Calculations ─── */
  const calc = useMemo(() => {
    const itemsSubtotal = s.items.reduce(
      (sum, i) => sum + i.qty * i.netPrice,
      0
    );
    const drawingsSubtotal = s.drawings.reduce(
      (sum, d) => sum + (d.totalPrice || 0),
      0
    );
    const subtotal = itemsSubtotal + drawingsSubtotal;
    const freight = Number(s.freight) || 0;
    const gst = (subtotal + freight) * (s.gstRate / 100);
    const pst = (subtotal + freight) * (s.pstRate / 100);
    const total = subtotal + freight + gst + pst;
    const balance = total - (Number(s.deposit) || 0);
    return {
      itemsSubtotal,
      drawingsSubtotal,
      subtotal,
      freight,
      gst,
      pst,
      total,
      balance,
    };
  }, [s.items, s.drawings, s.freight, s.gstRate, s.pstRate, s.deposit]);

  /* ─── Save / Load ─── */
  const saveQuote = () => {
    const entry = {
      id: uid(),
      name: `${s.preparedFor.name} — #${s.quoteNumber}`,
      date: s.date,
      data: s,
    };
    const updated = [entry, ...savedList.slice(0, 49)];
    setSavedList(updated);
    saveStorage(SAVED_KEY, updated);
    flash("Quotation saved!");
  };
  const loadQuote = (q) => {
    setS(q.data);
    setPanel(null);
    flash("Loaded!");
  };
  const deleteQuote = (id) => {
    const u = savedList.filter((q) => q.id !== id);
    setSavedList(u);
    saveStorage(SAVED_KEY, u);
  };
  const newQuote = () => {
    setS({
      ...DEFAULT,
      quoteNumber: String(Math.floor(Math.random() * 90000) + 10000),
      items: [emptyItem()],
      drawings: [],
    });
    flash("New quotation created!");
  };

  /* ─── Export ─── */
  const exportPDF = async () => {
    setExporting(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      await html2pdf()
        .set({
          margin: [6, 6, 6, 6],
          filename: `Quote-${s.quoteNumber}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(printRef.current)
        .save();
      flash("PDF exported!");
    } catch (e) {
      console.error(e);
      flash("Export failed");
    }
    setExporting(false);
  };

  /* ─── Reusable input ─── */
  const Inp = ({ label, value, onChange, type = "text", placeholder, style: sx, small }) => (
    <div style={sx}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#888",
            marginBottom: 4,
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: small ? "6px 8px" : "8px 10px",
          border: "1px solid #D4D4D4",
          borderRadius: 4,
          fontSize: small ? 12 : 13,
          fontFamily: "'Barlow', sans-serif",
          color: "#1A1A1A",
          background: "#FFF",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#C8102E";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#D4D4D4";
        }}
      />
    </div>
  );

  /* ═══ RENDER ═══ */
  return (
    <div
      style={{
        fontFamily: "'Barlow', sans-serif",
        background: "#F0F0F0",
        minHeight: "100vh",
        color: "#1A1A1A",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Barlow+Condensed:wght@600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes toastPop { from { opacity:0; transform:translate(-50%,12px) scale(0.95); } to { opacity:1; transform:translate(-50%,0) scale(1); } }
        .nv-card { animation: fadeUp 0.3s ease-out both; }
        .nv-btn { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:3px; border:1px solid #D4D4D4; background:#FFF; color:#444; font-size:11px; font-weight:700; font-family:'Barlow',sans-serif; cursor:pointer; transition:all 0.15s; text-transform:uppercase; letter-spacing:0.04em; white-space:nowrap; }
        .nv-btn:hover { background:#F5F5F5; border-color:#999; transform:translateY(-1px); }
        .nv-btn-red { background:#C8102E; color:#FFF; border-color:#C8102E; }
        .nv-btn-red:hover { background:#A30D24; border-color:#A30D24; }
        .nv-btn-dark { background:#2D2D2D; color:#FFF; border-color:#2D2D2D; }
        .nv-btn-dark:hover { background:#444; }
        .nv-btn-ghost { background:transparent; border-color:transparent; color:#888; }
        .nv-btn-ghost:hover { color:#C8102E; background:#FEF2F2; }
        .nv-row:hover { background:#FFF9F9 !important; }
        .nv-drop { transition: all 0.2s; }
        .nv-drop:hover, .nv-drop.over { border-color:#C8102E !important; background:#FEF2F2 !important; }
        input:focus, select:focus, textarea:focus { border-color:#C8102E !important; box-shadow:0 0 0 2px rgba(200,16,46,0.08); }
        .nv-toggle { position:relative; width:44px; height:24px; border-radius:12px; background:#D4D4D4; cursor:pointer; transition:background 0.2s; border:none; padding:0; }
        .nv-toggle.on { background:#C8102E; }
        .nv-toggle::after { content:''; position:absolute; top:2px; left:2px; width:20px; height:20px; border-radius:50%; background:#FFF; transition:transform 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.15); }
        .nv-toggle.on::after { transform:translateX(20px); }
        .nv-red-stripe { position:relative; }
        .nv-red-stripe::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:#C8102E; border-radius:6px 0 0 6px; }
        @media (max-width:768px) {
          .nv-resp-2 { grid-template-columns:1fr !important; }
          .nv-resp-5 { grid-template-columns:1fr 1fr !important; }
          .nv-item-grid { display:flex !important; flex-direction:column !important; padding:12px !important; gap:8px !important; }
          .nv-item-grid > * { width:100% !important; }
          .nv-topbar-actions { flex-wrap:wrap; justify-content:center; }
          .nv-header-flex { flex-direction:column !important; text-align:center !important; }
          .nv-header-right { text-align:center !important; }
        }
        @media (max-width:480px) {
          .nv-resp-5 { grid-template-columns:1fr !important; }
        }
        @media print {
          .no-print { display:none !important; }
          body { background:white !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
            background: "#2D2D2D", color: "#FFF", padding: "10px 28px", borderRadius: 6,
            fontSize: 13, fontWeight: 700, boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            animation: "toastPop 0.3s ease-out", fontFamily: "'Barlow', sans-serif",
            borderLeft: "4px solid #C8102E",
          }}
        >
          {toast}
        </div>
      )}

      {/* ═══ TOP BAR ═══ */}
      <div
        className="no-print"
        style={{
          background: "#FFF", borderBottom: "3px solid #C8102E",
          padding: "8px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 8,
          position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background: "#C8102E", color: "#FFF",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: 18, padding: "3px 10px", borderRadius: 2,
              letterSpacing: "0.04em", lineHeight: 1.2,
            }}
          >
            N
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800, fontSize: 16, letterSpacing: "0.02em", lineHeight: 1,
              }}
            >
              NERVAL
            </div>
            <div
              style={{
                fontSize: 8, color: "#AAA", fontWeight: 600,
                letterSpacing: "0.12em", textTransform: "uppercase",
              }}
            >
              Quotation System
            </div>
          </div>
        </div>

        <div
          style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}
          className="nv-topbar-actions"
        >
          {/* Price toggle */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0 8px", borderRight: "1px solid #E5E5E5", marginRight: 4,
            }}
          >
            <span
              style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: s.showPrices ? "#333" : "#C8102E",
              }}
            >
              {s.showPrices ? "Prices Visible" : "Prices Hidden"}
            </span>
            <button
              className={`nv-toggle ${s.showPrices ? "on" : ""}`}
              onClick={() => set("showPrices", !s.showPrices)}
            />
          </div>
          <button className="nv-btn" onClick={newQuote}><Plus size={13} /> New</button>
          <button className="nv-btn" onClick={saveQuote}><SaveIcon size={13} /> Save</button>
          <button className="nv-btn" onClick={() => setPanel(panel === "saved" ? null : "saved")}><Folder size={13} /> Load</button>
          <button className="nv-btn" onClick={() => window.print()}><Printer size={13} /> Print</button>
          <button className="nv-btn nv-btn-red" onClick={exportPDF} disabled={exporting}>
            <Download size={13} /> {exporting ? "Exporting…" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* ═══ SAVED PANEL ═══ */}
      {panel === "saved" && (
        <>
          <div
            className="no-print"
            onClick={() => setPanel(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 150,
            }}
          />
          <div
            className="no-print"
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, width: 380, maxWidth: "92vw",
              background: "#FFF", zIndex: 200, overflowY: "auto", padding: 24,
              animation: "slideIn 0.25s ease-out",
              boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
              borderLeft: "3px solid #C8102E",
            }}
          >
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 20,
              }}
            >
              <h3
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800, fontSize: 18, textTransform: "uppercase",
                }}
              >
                Saved Quotations
              </h3>
              <button
                className="nv-btn"
                style={{ padding: "4px 8px" }}
                onClick={() => setPanel(null)}
              >
                <XIcon size={14} />
              </button>
            </div>
            {savedList.length === 0 ? (
              <p
                style={{
                  color: "#999", fontSize: 13, textAlign: "center", padding: "40px 0",
                }}
              >
                No saved quotations yet.
              </p>
            ) : (
              savedList.map((q) => (
                <div
                  key={q.id}
                  style={{
                    padding: 14, border: "1px solid #E5E5E5", borderRadius: 6,
                    marginBottom: 8, cursor: "pointer", transition: "all 0.2s",
                    borderLeft: "3px solid transparent",
                  }}
                  onClick={() => loadQuote(q)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderLeftColor = "#C8102E";
                    e.currentTarget.style.background = "#FEF9F9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderLeftColor = "transparent";
                    e.currentTarget.style.background = "#FFF";
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{q.name}</div>
                  <div
                    style={{
                      fontSize: 11, color: "#999", display: "flex",
                      justifyContent: "space-between", marginTop: 4,
                    }}
                  >
                    <span>{q.date}</span>
                    <button
                      style={{
                        background: "none", border: "none", color: "#C8102E",
                        cursor: "pointer", fontSize: 11, fontWeight: 700,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuote(q.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ═══ MAIN FORM AREA ═══ */}
      <div
        style={{ maxWidth: 1060, margin: "0 auto", padding: "20px 16px 80px" }}
        className="no-print"
      >
        {/* ── QUOTE HEADER ── */}
        <div
          className="nv-card"
          style={{
            background: "#FFF", borderRadius: 6, overflow: "hidden",
            marginBottom: 16, border: "1px solid #E0E0E0",
            boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          }}
        >
          {/* Red banner */}
          <div
            className="nv-header-flex"
            style={{
              background: "#C8102E", color: "#FFF", padding: "14px 24px",
              display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                {s.logo ? (
                  <div style={{ position: "relative" }}>
                    <img src={s.logo} alt="Logo" style={{ maxHeight: 40, borderRadius: 3 }} />
                    <button
                      onClick={(e) => { e.preventDefault(); set("logo", null); }}
                      style={{
                        position: "absolute", top: -6, right: -6, width: 16, height: 16,
                        borderRadius: "50%", background: "#000", color: "#FFF", border: "none",
                        cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      border: "2px dashed rgba(255,255,255,0.4)", borderRadius: 4,
                      padding: "6px 14px", fontSize: 10, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 5, opacity: 0.8,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.8"; }}
                  >
                    <Img size={13} /> Upload Logo
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFile(null, null, "logo", e.target.files[0])}
                />
              </label>
              <div style={{ fontSize: 10, opacity: 0.75, lineHeight: 1.6 }}>
                <div>Tel: 780-452-1111 &nbsp; Fax: 780-452-5775</div>
                <div>1001 Buckingham Drive | Sherwood Park, AB | T8H 0X5</div>
              </div>
            </div>
            <div className="nv-header-right" style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900, fontSize: 30, letterSpacing: "0.08em", lineHeight: 1,
                }}
              >
                QUOTATION
              </div>
              <div
                style={{
                  display: "flex", gap: 14, fontSize: 12, fontWeight: 600,
                  marginTop: 6, justifyContent: "flex-end", alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  Quote:
                  <input
                    value={s.quoteNumber}
                    onChange={(e) => set("quoteNumber", e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: 3, color: "#FFF", padding: "3px 8px",
                      fontFamily: "'Barlow', sans-serif", fontSize: 14,
                      fontWeight: 800, width: 80, outline: "none",
                    }}
                  />
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  Date:
                  <input
                    type="date"
                    value={s.date}
                    onChange={(e) => set("date", e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: 3, color: "#FFF", padding: "3px 6px",
                      fontFamily: "'Barlow', sans-serif", fontSize: 12,
                      fontWeight: 600, outline: "none", colorScheme: "dark",
                    }}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Prepared For / Ship To */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}
            className="nv-resp-2"
          >
            <div
              style={{
                padding: "16px 24px", borderRight: "1px solid #E5E5E5",
                borderBottom: "1px solid #E5E5E5",
              }}
            >
              <div
                style={{
                  fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#C8102E", marginBottom: 10,
                  background: "#F7F7F7", padding: "4px 10px",
                  display: "inline-block", borderRadius: 2,
                }}
              >
                Prepared For:
              </div>
              <Inp label="Name" value={s.preparedFor.name} onChange={(v) => set("preparedFor.name", v)} small />
              <div style={{ height: 6 }} />
              <Inp label="Address" value={s.preparedFor.address} onChange={(v) => set("preparedFor.address", v)} small />
              <div style={{ height: 6 }} />
              <Inp label="City / Province / Postal" value={s.preparedFor.cityProv} onChange={(v) => set("preparedFor.cityProv", v)} small />
            </div>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E5E5" }}>
              <div
                style={{
                  fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#C8102E", marginBottom: 10,
                  background: "#F7F7F7", padding: "4px 10px",
                  display: "inline-block", borderRadius: 2,
                }}
              >
                Ship To:
              </div>
              <Inp label="Name" value={s.shipTo.name} onChange={(v) => set("shipTo.name", v)} small />
              <div style={{ height: 6 }} />
              <Inp label="Address" value={s.shipTo.address} onChange={(v) => set("shipTo.address", v)} small />
              <div style={{ height: 6 }} />
              <Inp label="City / Province / Postal" value={s.shipTo.cityProv} onChange={(v) => set("shipTo.cityProv", v)} small />
              <div style={{ height: 6 }} />
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
                className="nv-resp-2"
              >
                <Inp label="Phone" value={s.shipTo.phone} onChange={(v) => set("shipTo.phone", v)} small />
                <Inp label="Email" value={s.shipTo.email} onChange={(v) => set("shipTo.email", v)} small />
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div>
            <div
              style={{
                display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0,
                fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.06em", color: "#FFF", background: "#C8102E",
              }}
              className="nv-resp-5"
            >
              {["Customer #", "Carrier", "PO #", "Ship Date", "Salesperson"].map(
                (h) => (
                  <div
                    key={h}
                    style={{
                      padding: "6px 12px",
                      borderRight: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    {h}
                  </div>
                )
              )}
            </div>
            <div
              style={{
                display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
                gap: 0, background: "#FAFAFA",
              }}
              className="nv-resp-5"
            >
              {[
                { v: s.customerNo, k: "customerNo" },
                { v: s.carrier, k: "carrier" },
                { v: s.poNumber, k: "poNumber" },
                { v: s.shipDate, k: "shipDate", type: "date" },
                { v: s.salesperson, k: "salesperson" },
              ].map((f) => (
                <div
                  key={f.k}
                  style={{
                    padding: "4px 10px",
                    borderRight: "1px solid #E5E5E5",
                  }}
                >
                  <input
                    type={f.type || "text"}
                    value={f.v}
                    onChange={(e) => set(f.k, e.target.value)}
                    style={{
                      width: "100%", border: "none", background: "transparent",
                      fontSize: 12, fontFamily: "'Barlow', sans-serif",
                      fontWeight: 500, color: "#333", outline: "none", padding: "4px 0",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{ display: "flex", gap: 2, marginBottom: 0 }}>
          {[
            { key: "items", icon: <FileText size={13} />, label: `Line Items (${s.items.length})` },
            { key: "drawings", icon: <Layers size={13} />, label: `Drawings & Visuals (${s.drawings.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`nv-btn ${activeTab === tab.key ? "nv-btn-dark" : ""}`}
              onClick={() => setActiveTab(tab.key)}
              style={{
                borderRadius: "6px 6px 0 0",
                borderBottom:
                  activeTab === tab.key
                    ? "2px solid #2D2D2D"
                    : "1px solid #D4D4D4",
                paddingBottom: activeTab === tab.key ? 9 : 7,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── ITEMS TABLE ── */}
        {activeTab === "items" && (
          <div
            className="nv-card"
            style={{
              background: "#FFF", borderRadius: "0 6px 6px 6px",
              border: "1px solid #E0E0E0", overflow: "hidden",
              marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: s.showPrices
                  ? "32px 52px 100px 44px 46px 1fr 90px 90px 32px"
                  : "32px 52px 120px 50px 50px 1fr 32px",
                gap: 0, background: "#C8102E", color: "#FFF",
                fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
              className="nv-item-grid"
            >
              <div style={{ padding: "8px 4px", textAlign: "center" }}>LN</div>
              <div style={{ padding: "8px 4px" }}>Img</div>
              <div style={{ padding: "8px 8px" }}>Item No</div>
              <div style={{ padding: "8px 2px", textAlign: "center" }}>Qty</div>
              <div style={{ padding: "8px 2px" }}>UOM</div>
              <div style={{ padding: "8px 8px" }}>Description</div>
              {s.showPrices && (
                <div style={{ padding: "8px 8px", textAlign: "right" }}>Net Price</div>
              )}
              {s.showPrices && (
                <div style={{ padding: "8px 8px", textAlign: "right" }}>Ext Amt</div>
              )}
              <div></div>
            </div>

            {s.items.map((item, idx) => (
              <div
                key={item.id}
                className="nv-row nv-item-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: s.showPrices
                    ? "32px 52px 100px 44px 46px 1fr 90px 90px 32px"
                    : "32px 52px 120px 50px 50px 1fr 32px",
                  gap: 0, alignItems: "center",
                  borderBottom: "1px solid #F0F0F0",
                  background: idx % 2 === 0 ? "#FFF" : "#FAFAFA",
                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{
                    padding: "8px 4px", textAlign: "center",
                    fontSize: 11, color: "#BBB", fontWeight: 700,
                  }}
                >
                  {idx + 1}
                </div>

                {/* Image */}
                <div style={{ padding: "4px 3px" }}>
                  <div
                    className="nv-drop"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("over");
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove("over");
                    }}
                    onDrop={(e) => {
                      e.currentTarget.classList.remove("over");
                      handleDrop(e, "item", item.id, "image");
                    }}
                    onClick={() => fileRefs.current[item.id]?.click()}
                    style={{
                      width: 42, height: 42, borderRadius: 3, overflow: "hidden",
                      border: item.image ? "1px solid #E5E5E5" : "1.5px dashed #D4D4D4",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                      background: item.image ? "transparent" : "#F9F9F9",
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Img size={13} style={{ color: "#D4D4D4" }} />
                    )}
                    <input
                      ref={(el) => { fileRefs.current[item.id] = el; }}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) =>
                        handleFile("item", item.id, "image", e.target.files[0])
                      }
                    />
                  </div>
                </div>

                <input
                  value={item.itemNo}
                  onChange={(e) => updateItem(item.id, "itemNo", e.target.value)}
                  placeholder="SKU"
                  style={{
                    width: "100%", border: "none", background: "transparent",
                    padding: "8px 6px", fontSize: 11,
                    fontFamily: "'Barlow', sans-serif", fontWeight: 600, outline: "none",
                  }}
                />

                <input
                  type="number"
                  min="0"
                  value={item.qty}
                  onChange={(e) =>
                    updateItem(item.id, "qty", Math.max(0, Number(e.target.value)))
                  }
                  style={{
                    width: "100%", border: "none", background: "transparent",
                    padding: "8px 2px", fontSize: 12,
                    fontFamily: "'Barlow', sans-serif", textAlign: "center",
                    outline: "none", fontWeight: 700,
                  }}
                />

                <select
                  value={item.uom}
                  onChange={(e) => updateItem(item.id, "uom", e.target.value)}
                  style={{
                    border: "none", background: "transparent", fontSize: 10,
                    fontFamily: "'Barlow', sans-serif", outline: "none",
                    cursor: "pointer", padding: "4px 0", color: "#777",
                  }}
                >
                  {["ea", "ft", "sq ft", "ln ft", "set", "lot", "hr"].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>

                <textarea
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, "description", e.target.value)
                  }
                  placeholder="Description..."
                  rows={2}
                  style={{
                    width: "100%", border: "none", background: "transparent",
                    padding: "6px 8px", fontSize: 11,
                    fontFamily: "'Barlow', sans-serif", outline: "none",
                    resize: "vertical", minHeight: 34, lineHeight: 1.4,
                  }}
                />

                {s.showPrices && (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.netPrice}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "netPrice",
                        Math.max(0, Number(e.target.value))
                      )
                    }
                    style={{
                      width: "100%", border: "none", background: "transparent",
                      padding: "8px 6px", fontSize: 12,
                      fontFamily: "'Barlow', sans-serif", textAlign: "right",
                      outline: "none", fontWeight: 700,
                    }}
                  />
                )}

                {s.showPrices && (
                  <div
                    style={{
                      padding: "8px 8px", textAlign: "right",
                      fontSize: 12, fontWeight: 800, color: "#333",
                    }}
                  >
                    {fmt(item.qty * item.netPrice, s.currency)}
                  </div>
                )}

                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#D4D4D4", padding: 4, transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#C8102E"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#D4D4D4"; }}
                >
                  <Trash size={13} />
                </button>
              </div>
            ))}

            <div style={{ padding: "10px 16px", borderTop: "1px solid #F0F0F0" }}>
              <button className="nv-btn" onClick={addItem} style={{ fontSize: 10 }}>
                <Plus size={12} /> Add Item
              </button>
            </div>
          </div>
        )}

        {/* ── DRAWINGS TAB ── */}
        {activeTab === "drawings" && (
          <div
            className="nv-card"
            style={{
              background: "#FFF", borderRadius: "0 6px 6px 6px",
              border: "1px solid #E0E0E0", padding: 20, marginBottom: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <p style={{ fontSize: 12, color: "#999", marginBottom: 16, lineHeight: 1.5 }}>
              Upload kitchen plans, renderings, or architectural drawings. Each gets
              its own total price for quick visual quoting.
            </p>

            {s.drawings.length === 0 && (
              <div style={{ textAlign: "center", padding: "50px 0", color: "#D4D4D4" }}>
                <Layers size={48} />
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: "#BBB" }}>
                  No drawings added yet
                </div>
                <div style={{ fontSize: 11, color: "#CCC", marginTop: 4 }}>
                  Click below to add your first visual reference
                </div>
              </div>
            )}

            {s.drawings.map((drw, idx) => (
              <div
                key={drw.id}
                style={{
                  border: "1px solid #E5E5E5", borderRadius: 8,
                  overflow: "hidden", marginBottom: 14,
                  animation: "fadeUp 0.3s ease-out",
                  borderLeft: "4px solid #C8102E",
                }}
              >
                <div
                  style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "10px 16px",
                    background: "#FAFAFA", borderBottom: "1px solid #F0F0F0",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800, fontSize: 14, color: "#C8102E",
                      textTransform: "uppercase",
                    }}
                  >
                    Drawing #{idx + 1}
                  </div>
                  <button
                    onClick={() => removeDrawing(drw.id)}
                    className="nv-btn"
                    style={{ padding: "3px 10px", fontSize: 10 }}
                  >
                    <Trash size={12} /> Remove
                  </button>
                </div>

                <div
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 320px",
                    gap: 16, padding: 16,
                  }}
                  className="nv-resp-2"
                >
                  {/* Image drop zone */}
                  <div
                    className="nv-drop"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("over");
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove("over");
                    }}
                    onDrop={(e) => {
                      e.currentTarget.classList.remove("over");
                      handleDrop(e, "drawing", drw.id, "image");
                    }}
                    onClick={() => drawingRefs.current[drw.id]?.click()}
                    style={{
                      minHeight: 200, borderRadius: 6, overflow: "hidden",
                      border: drw.image
                        ? "1px solid #E5E5E5"
                        : "2px dashed #D4D4D4",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", cursor: "pointer",
                      background: drw.image ? "#FAFAFA" : "#F9F9F9",
                    }}
                  >
                    {drw.image ? (
                      <img
                        src={drw.image}
                        alt=""
                        style={{
                          width: "100%", height: "100%",
                          objectFit: "contain", maxHeight: 360,
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: "center", color: "#CCC", padding: 20 }}>
                        <Img size={40} />
                        <div
                          style={{
                            fontSize: 12, fontWeight: 700, marginTop: 10, color: "#BBB",
                          }}
                        >
                          Drop image or click to upload
                        </div>
                        <div style={{ fontSize: 10, color: "#D4D4D4", marginTop: 4 }}>
                          Kitchen plans, renderings, elevations
                        </div>
                      </div>
                    )}
                    <input
                      ref={(el) => { drawingRefs.current[drw.id] = el; }}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) =>
                        handleFile("drawing", drw.id, "image", e.target.files[0])
                      }
                    />
                  </div>

                  {/* Drawing details */}
                  <div>
                    <Inp
                      label="Title / Room / Section"
                      value={drw.title}
                      onChange={(v) => updateDrawing(drw.id, "title", v)}
                      placeholder="e.g. Kitchen Plan & Elevations"
                    />
                    <div style={{ height: 12 }} />

                    <label
                      style={{
                        display: "block", fontSize: 10, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        color: "#888", marginBottom: 4,
                      }}
                    >
                      Total Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={drw.totalPrice}
                      onChange={(e) =>
                        updateDrawing(
                          drw.id,
                          "totalPrice",
                          Math.max(0, Number(e.target.value))
                        )
                      }
                      style={{
                        width: "100%", padding: "10px 12px",
                        border: "1px solid #D4D4D4", borderRadius: 4,
                        fontSize: 16, fontFamily: "'Barlow', sans-serif",
                        fontWeight: 700, color: "#1A1A1A", outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <div
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900, fontSize: 28, color: "#C8102E", marginTop: 8,
                      }}
                    >
                      {fmt(drw.totalPrice || 0, s.currency)}
                    </div>

                    <div style={{ height: 12 }} />
                    <label
                      style={{
                        display: "block", fontSize: 10, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        color: "#888", marginBottom: 4,
                      }}
                    >
                      Notes
                    </label>
                    <textarea
                      value={drw.notes}
                      onChange={(e) => updateDrawing(drw.id, "notes", e.target.value)}
                      placeholder="e.g. Island end panels removed for waterfall edge..."
                      rows={4}
                      style={{
                        width: "100%", padding: "8px 10px",
                        border: "1px solid #D4D4D4", borderRadius: 4,
                        fontSize: 12, fontFamily: "'Barlow', sans-serif",
                        color: "#555", outline: "none", resize: "vertical",
                        boxSizing: "border-box", lineHeight: 1.5,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              className="nv-btn nv-btn-red"
              onClick={addDrawing}
              style={{ marginTop: 8 }}
            >
              <Plus size={13} /> Add Drawing / Visual
            </button>
          </div>
        )}

        {/* ── SUMMARY / NOTES ── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}
          className="nv-resp-2"
        >
          {/* Notes + Terms */}
          <div
            className="nv-card"
            style={{
              background: "#FFF", borderRadius: 6, border: "1px solid #E0E0E0",
              padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
              className="nv-resp-2"
            >
              <div>
                <div
                  style={{
                    fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.06em", color: "#C8102E", marginBottom: 8,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <div style={{ width: 3, height: 14, background: "#C8102E", borderRadius: 2 }} />
                  Note:
                </div>
                <textarea
                  value={s.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={4}
                  style={{
                    width: "100%", padding: "8px 10px",
                    border: "1px solid #D4D4D4", borderRadius: 4,
                    fontSize: 11, fontFamily: "'Barlow', sans-serif",
                    outline: "none", resize: "vertical",
                    boxSizing: "border-box", lineHeight: 1.5,
                  }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.06em", color: "#C8102E", marginBottom: 8,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <div style={{ width: 3, height: 14, background: "#C8102E", borderRadius: 2 }} />
                  Terms
                </div>
                <textarea
                  value={s.termsNotes}
                  onChange={(e) => set("termsNotes", e.target.value)}
                  rows={4}
                  style={{
                    width: "100%", padding: "8px 10px",
                    border: "1px solid #D4D4D4", borderRadius: 4,
                    fontSize: 10, fontFamily: "'Barlow', sans-serif",
                    outline: "none", resize: "vertical",
                    boxSizing: "border-box", color: "#777", lineHeight: 1.5,
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label
                  style={{
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.06em", color: "#888",
                  }}
                >
                  Currency
                </label>
                <select
                  value={s.currency}
                  onChange={(e) => set("currency", e.target.value)}
                  style={{
                    border: "1px solid #D4D4D4", borderRadius: 3,
                    padding: "3px 8px", fontSize: 11,
                    fontFamily: "'Barlow', sans-serif", outline: "none",
                    cursor: "pointer", fontWeight: 600,
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div
            className="nv-card nv-red-stripe"
            style={{
              background: "#FFF", borderRadius: 6, border: "1px solid #E0E0E0",
              padding: "20px 20px 20px 26px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)", alignSelf: "flex-start",
            }}
          >
            {calc.drawingsSubtotal > 0 && (
              <SumRow label="Drawings / Visuals" value={fmt(calc.drawingsSubtotal, s.currency)} />
            )}
            {calc.itemsSubtotal > 0 && (
              <SumRow label="Line Items" value={fmt(calc.itemsSubtotal, s.currency)} />
            )}
            <SumRow label="SUBTOTAL" value={fmt(calc.subtotal, s.currency)} bold />

            <div
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "5px 0",
              }}
            >
              <span style={{ fontSize: 12, color: "#777", fontWeight: 600 }}>FREIGHT</span>
              <input
                type="number" min="0" step="0.01" value={s.freight}
                onChange={(e) => set("freight", Math.max(0, Number(e.target.value)))}
                style={{
                  width: 90, textAlign: "right", border: "1px solid #E5E5E5",
                  borderRadius: 3, padding: "4px 6px", fontSize: 12,
                  fontFamily: "'Barlow', sans-serif", fontWeight: 700, outline: "none",
                }}
              />
            </div>

            <TaxRow label="GST/HST" rate={s.gstRate} onRate={(v) => set("gstRate", v)} amount={calc.gst} currency={s.currency} />
            <TaxRow label="PST" rate={s.pstRate} onRate={(v) => set("pstRate", v)} amount={calc.pst} currency={s.currency} />

            <div
              style={{
                borderTop: "3px solid #C8102E", marginTop: 8, paddingTop: 10,
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900, fontSize: 16, textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                TOTAL
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900, fontSize: 26, color: "#C8102E",
                }}
              >
                {fmt(calc.total, s.currency)}
              </span>
            </div>

            <div
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "6px 0",
              }}
            >
              <span style={{ fontSize: 12, color: "#777", fontWeight: 600 }}>DEPOSIT</span>
              <input
                type="number" min="0" step="0.01" value={s.deposit}
                onChange={(e) => set("deposit", Math.max(0, Number(e.target.value)))}
                style={{
                  width: 90, textAlign: "right", border: "1px solid #E5E5E5",
                  borderRadius: 3, padding: "4px 6px", fontSize: 12,
                  fontFamily: "'Barlow', sans-serif", fontWeight: 700, outline: "none",
                }}
              />
            </div>

            <SumRow label="BALANCE" value={fmt(calc.balance, s.currency)} bold accent />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          PDF / PRINT RENDER (hidden off-screen)
         ════════════════════════════════════════════════════════════ */}
      <div
        ref={printRef}
        style={{
          position: "fixed", left: "-9999px", top: 0, width: 780,
          background: "#FFF", color: "#1A1A1A",
          fontFamily: "'Barlow', sans-serif", fontSize: 11, lineHeight: 1.4,
        }}
      >
        {/* PDF Red Banner */}
        <div
          style={{
            background: "#C8102E", color: "#FFF", padding: "14px 24px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {s.logo && <img src={s.logo} alt="" style={{ maxHeight: 36 }} />}
            <div style={{ fontSize: 10, opacity: 0.8, lineHeight: 1.6 }}>
              <div>Tel: 780-452-1111 &nbsp; Fax: 780-452-5775</div>
              <div>Email: info@nervalcorp.com</div>
              <div>1001 Buckingham Drive | Sherwood Park, AB | T8H 0X5</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 26, letterSpacing: "0.08em",
              }}
            >
              QUOTATION
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              Quote: <strong>{s.quoteNumber}</strong> &nbsp;&nbsp; Date:{" "}
              <strong>{s.date}</strong>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div style={{ display: "flex", borderBottom: "1px solid #E5E5E5" }}>
          <div
            style={{
              flex: 1, padding: "12px 24px",
              borderRight: "1px solid #E5E5E5",
            }}
          >
            <div
              style={{
                fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                color: "#C8102E", marginBottom: 3,
              }}
            >
              Prepared For:
            </div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{s.preparedFor.name}</div>
            <div>{s.preparedFor.address}</div>
            <div>{s.preparedFor.cityProv}</div>
          </div>
          <div style={{ flex: 1, padding: "12px 24px" }}>
            <div
              style={{
                fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                color: "#C8102E", marginBottom: 3,
              }}
            >
              Ship To:
            </div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{s.shipTo.name}</div>
            <div>{s.shipTo.address}</div>
            <div>{s.shipTo.cityProv}</div>
            {s.shipTo.phone && <div>Phone: {s.shipTo.phone}</div>}
          </div>
        </div>

        {/* Meta */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "#C8102E", color: "#FFF",
                fontSize: 9, fontWeight: 800, textTransform: "uppercase",
              }}
            >
              <th style={{ padding: "5px 10px", textAlign: "left" }}>Customer #</th>
              <th style={{ padding: "5px 10px", textAlign: "left" }}>Carrier</th>
              <th style={{ padding: "5px 10px", textAlign: "left" }}>PO #</th>
              <th style={{ padding: "5px 10px", textAlign: "left" }}>Ship Date</th>
              <th style={{ padding: "5px 10px", textAlign: "left" }}>Salesperson</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #E5E5E5", fontSize: 11 }}>
              <td style={{ padding: "5px 10px" }}>{s.customerNo}</td>
              <td style={{ padding: "5px 10px" }}>{s.carrier}</td>
              <td style={{ padding: "5px 10px" }}>{s.poNumber}</td>
              <td style={{ padding: "5px 10px" }}>{s.shipDate}</td>
              <td style={{ padding: "5px 10px" }}>{s.salesperson}</td>
            </tr>
          </tbody>
        </table>

        {/* PDF Drawings */}
        {s.drawings.length > 0 && (
          <div style={{ padding: "16px 24px" }}>
            {s.drawings.map((drw, i) => (
              <div key={drw.id} style={{ marginBottom: 20, pageBreakInside: "avoid" }}>
                <div
                  style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", marginBottom: 6,
                    borderBottom: "2px solid #C8102E", paddingBottom: 4,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800, fontSize: 14, textTransform: "uppercase",
                    }}
                  >
                    {drw.title || `Drawing #${i + 1}`}
                  </div>
                  {s.showPrices && (
                    <div
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900, fontSize: 16, color: "#C8102E",
                      }}
                    >
                      Total: {fmt(drw.totalPrice || 0, s.currency)}
                    </div>
                  )}
                </div>
                {drw.image && (
                  <img
                    src={drw.image}
                    alt=""
                    style={{
                      maxWidth: "100%", maxHeight: 320, objectFit: "contain",
                      border: "1px solid #E5E5E5", borderRadius: 4,
                    }}
                  />
                )}
                {drw.notes && (
                  <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
                    NOTE: {drw.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PDF Items */}
        {s.items.some((i) => i.itemNo || i.description) && (
          <table
            style={{
              width: "100%", borderCollapse: "collapse",
              margin: "0 0 12px", fontSize: 10,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#C8102E", color: "#FFF",
                  fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                }}
              >
                <th style={{ padding: "5px 8px", textAlign: "left", width: 22 }}>LN</th>
                <th style={{ padding: "5px 6px", width: 42 }}>Img</th>
                <th style={{ padding: "5px 8px", textAlign: "left" }}>Item No</th>
                <th style={{ padding: "5px 6px", textAlign: "center", width: 28 }}>Qty</th>
                <th style={{ padding: "5px 6px", width: 28 }}>UOM</th>
                <th style={{ padding: "5px 8px", textAlign: "left" }}>Description</th>
                {s.showPrices && (
                  <th style={{ padding: "5px 8px", textAlign: "right" }}>Net Price</th>
                )}
                {s.showPrices && (
                  <th style={{ padding: "5px 8px", textAlign: "right" }}>Ext Amt</th>
                )}
              </tr>
            </thead>
            <tbody>
              {s.items.map((item, i) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid #EEE",
                    background: i % 2 === 0 ? "#FFF" : "#FAFAFA",
                  }}
                >
                  <td style={{ padding: "5px 8px", color: "#999" }}>{i + 1}</td>
                  <td style={{ padding: "3px 4px" }}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        style={{
                          width: 34, height: 34, objectFit: "cover", borderRadius: 2,
                        }}
                      />
                    )}
                  </td>
                  <td style={{ padding: "5px 8px", fontWeight: 600 }}>{item.itemNo}</td>
                  <td style={{ padding: "5px 6px", textAlign: "center" }}>{item.qty}</td>
                  <td style={{ padding: "5px 6px" }}>{item.uom}</td>
                  <td
                    style={{
                      padding: "5px 8px", whiteSpace: "pre-wrap", lineHeight: 1.35,
                    }}
                  >
                    {item.description}
                  </td>
                  {s.showPrices && (
                    <td style={{ padding: "5px 8px", textAlign: "right" }}>
                      {fmt(item.netPrice, s.currency)}
                    </td>
                  )}
                  {s.showPrices && (
                    <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700 }}>
                      {fmt(item.qty * item.netPrice, s.currency)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* PDF Footer */}
        <div style={{ display: "flex", padding: "0 24px 20px", gap: 20 }}>
          <div style={{ flex: 1, fontSize: 9, color: "#777", lineHeight: 1.5 }}>
            {s.notes && (
              <>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 4, marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 3, height: 10, background: "#C8102E", borderRadius: 1,
                    }}
                  />
                  <strong style={{ color: "#333", fontSize: 10 }}>NOTE:</strong>
                </div>
                <div style={{ marginBottom: 8 }}>{s.notes}</div>
              </>
            )}
            {s.termsNotes && (
              <div
                style={{
                  whiteSpace: "pre-wrap", borderTop: "1px solid #EEE",
                  paddingTop: 6, marginTop: 4,
                }}
              >
                {s.termsNotes}
              </div>
            )}
          </div>
          <div style={{ width: 220 }}>
            <PdfTotalRow label="SUBTOTAL" value={fmt(calc.subtotal, s.currency)} bold />
            <PdfTotalRow label="FREIGHT" value={fmt(calc.freight, s.currency)} />
            <PdfTotalRow label="GST/HST" value={fmt(calc.gst, s.currency)} />
            <PdfTotalRow label="PST" value={fmt(calc.pst, s.currency)} />
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0 4px", borderTop: "3px solid #C8102E",
                marginTop: 4, fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 15,
              }}
            >
              <span>TOTAL</span>
              <span style={{ color: "#C8102E" }}>{fmt(calc.total, s.currency)}</span>
            </div>
            <PdfTotalRow label="DEPOSIT" value={fmt(s.deposit, s.currency)} />
            <PdfTotalRow label="BALANCE" value={fmt(calc.balance, s.currency)} bold />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helper components ─── */
function SumRow({ label, value, bold, accent }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "baseline", padding: "5px 0",
        fontSize: bold ? 13 : 12, fontWeight: bold ? 800 : 600,
        color: accent ? "#C8102E" : bold ? "#1A1A1A" : "#777",
        fontFamily: bold
          ? "'Barlow Condensed', sans-serif"
          : "'Barlow', sans-serif",
        textTransform: bold ? "uppercase" : "none",
        letterSpacing: bold ? "0.03em" : "0",
      }}
    >
      <span>{label}</span>
      <span style={{ fontWeight: 800, fontSize: bold ? (accent ? 18 : 14) : 12 }}>
        {value}
      </span>
    </div>
  );
}

function TaxRow({ label, rate, onRate, amount, currency }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "5px 0",
      }}
    >
      <span style={{ fontSize: 12, color: "#777", fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={rate}
          onChange={(e) => onRate(Math.max(0, Number(e.target.value)))}
          style={{
            width: 44, textAlign: "right", border: "1px solid #E5E5E5",
            borderRadius: 3, padding: "3px 4px", fontSize: 11,
            fontFamily: "'Barlow', sans-serif", outline: "none", fontWeight: 600,
          }}
        />
        <span style={{ fontSize: 10, color: "#AAA", fontWeight: 600 }}>%</span>
        <span style={{ fontWeight: 700, fontSize: 12, minWidth: 70, textAlign: "right" }}>
          {fmt(amount, currency)}
        </span>
      </div>
    </div>
  );
}

function PdfTotalRow({ label, value, bold }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", padding: "3px 0",
        fontWeight: bold ? 800 : 500, fontSize: bold ? 12 : 11,
        color: bold ? "#1A1A1A" : "#666",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
