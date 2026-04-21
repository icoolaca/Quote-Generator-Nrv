import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   NERVAL QUOTATION GENERATOR v3
   - Font size configuration (header / body / small)
   - Clipboard paste for item images & drawing images
   - Resizable column widths via settings
   - Item images: 200×100 when present, tiny when empty
   - Pin annotations on drawings (main text + sub text)
   - Duplicate items, price toggle, PDF export
   ═══════════════════════════════════════════════════════════════ */

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().split("T")[0];
const fmt = (n, cur = "CAD") =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: cur, minimumFractionDigits: 2 }).format(n);

const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AUD"];

const emptyItem = () => ({ id: uid(), itemNo: "", qty: 1, uom: "ea", description: "", netPrice: 0, image: null });
const emptyDrawing = () => ({ id: uid(), image: null, title: "", totalPrice: 0, notes: "", pins: [] });
const emptyPin = (xPct, yPct) => ({ id: uid(), xPct, yPct, main: "Spec Title", sub: "Details here" });

const DEFAULT_FONTS = { header: 28, subheader: 14, body: 12, small: 10 };
const DEFAULT_COLS = { itemNo: 110, qty: 50, uom: 50, desc: 1, netPrice: 95, extAmt: 95 };

const DEFAULT = {
  quoteNumber: "34130", date: today(), shipDate: "", currency: "CAD",
  preparedFor: { name: "Kanvi Homes", address: "# 101, 1290-91 Street NW", cityProv: "Edmonton, AB T6X 0P2" },
  shipTo: { name: "Kanvi Homes", address: "# 101, 1290-91 Street NW", cityProv: "Edmonton, AB T6X 0P2", phone: "780-439-9000", email: "" },
  customerNo: "Kan9-90", carrier: "BestWay", poNumber: "Element", eta: "SEE TERMS", fob: "NA", salesperson: "",
  items: [emptyItem()], drawings: [], freight: 0, gstRate: 5, pstRate: 0, deposit: 0,
  notes: "Prices valid for 30 days from date of your quote.",
  termsNotes: "Returns: Note that product returns are not accepted after 45 days. All returns must be accompanied by the original receipt. Product must be returned in original packaging.\nCustom orders and clearance/discontinued items are not returnable.\nCustom order delivery schedules may vary due to circumstances beyond our control. Orders may not be cancelled due to extended delivery projections.",
  showPrices: true, logo: null,
  fonts: { ...DEFAULT_FONTS }, cols: { ...DEFAULT_COLS },
};

const STORAGE_KEY = "nerval-quote-data";
const SAVED_KEY = "nerval-saved-quotes";
const load = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const loadHtml2Pdf = () => new Promise((res) => {
  if (window.html2pdf) return res(window.html2pdf);
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
  s.onload = () => res(window.html2pdf);
  document.head.appendChild(s);
});

/* ─── Icons ─── */
const I = ({ d, size = 17, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d={d} /></svg>
);
const Plus = (p) => <I d="M12 5v14M5 12h14" {...p} />;
const Trash = (p) => <I d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-1 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6h10z" {...p} />;
const Download = (p) => <I d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" {...p} />;
const Printer = (p) => <I d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" {...p} />;
const Img = (p) => <I d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" {...p} />;
const SaveIcon = (p) => <I d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8" {...p} />;
const Folder = (p) => <I d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" {...p} />;
const XIcon = (p) => <I d="M18 6L6 18M6 6l12 12" {...p} />;
const Eye = (p) => <I d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...p} />;
const EyeOff = (p) => <I d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 01-4.24-4.24M1 1l22 22" {...p} />;
const Layers = (p) => <I d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" {...p} />;
const FileText = (p) => <I d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" {...p} />;
const Copy = (p) => <I d="M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" {...p} />;
const Settings = (p) => <I d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...p} />;
const MapPin = (p) => <I d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z" {...p} />;

/* ═══ MAIN ═══ */
export default function App() {
  const [s, setS] = useState(() => {
    const saved = load(STORAGE_KEY);
    return saved ? { ...DEFAULT, ...saved, fonts: { ...DEFAULT_FONTS, ...(saved.fonts || {}) }, cols: { ...DEFAULT_COLS, ...(saved.cols || {}) } } : DEFAULT;
  });
  const [savedList, setSavedList] = useState(() => load(SAVED_KEY) || []);
  const [panel, setPanel] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("items");
  const [editingPin, setEditingPin] = useState(null);
  const printRef = useRef(null);
  const fileRefs = useRef({});
  const drawingRefs = useRef({});

  useEffect(() => { const t = setTimeout(() => save(STORAGE_KEY, s), 500); return () => clearTimeout(t); }, [s]);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const F = s.fonts || DEFAULT_FONTS;
  const C = s.cols || DEFAULT_COLS;

  const set = useCallback((path, val) => {
    setS(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let o = next;
      for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
      o[keys[keys.length - 1]] = val;
      return next;
    });
  }, []);

  const updateItem = useCallback((id, field, val) => {
    setS(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, [field]: val } : i) }));
  }, []);
  const updateDrawing = useCallback((id, field, val) => {
    setS(prev => ({ ...prev, drawings: prev.drawings.map(d => d.id === id ? { ...d, [field]: val } : d) }));
  }, []);

  const addItem = () => setS(p => ({ ...p, items: [...p.items, emptyItem()] }));
  const removeItem = (id) => setS(p => ({ ...p, items: p.items.length > 1 ? p.items.filter(i => i.id !== id) : p.items }));
  const duplicateItem = (id) => setS(p => {
    const idx = p.items.findIndex(i => i.id === id);
    if (idx === -1) return p;
    const clone = { ...p.items[idx], id: uid() };
    const items = [...p.items]; items.splice(idx + 1, 0, clone);
    return { ...p, items };
  });
  const addDrawing = () => setS(p => ({ ...p, drawings: [...p.drawings, emptyDrawing()] }));
  const removeDrawing = (id) => setS(p => ({ ...p, drawings: p.drawings.filter(d => d.id !== id) }));

  /* ─── Image handling: file upload, drop, AND clipboard paste ─── */
  const readFileAsDataURL = (file) => new Promise((res) => {
    const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file);
  });

  const handleFile = async (refMap, id, field, file) => {
    if (!file) return;
    const data = await readFileAsDataURL(file);
    if (field === "logo") set("logo", data);
    else if (refMap === "item") updateItem(id, field, data);
    else updateDrawing(id, field, data);
  };

  const handleDrop = (e, refMap, id, field) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(refMap, id, field, f);
  };

  // Clipboard paste handler — works on any paste-target element
  const handlePaste = useCallback((refMap, id, field) => (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        handleFile(refMap, id, field, file);
        return;
      }
    }
  }, []);

  /* ─── Pin annotations on drawings ─── */
  const addPin = (drawingId, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setS(prev => ({
      ...prev,
      drawings: prev.drawings.map(d =>
        d.id === drawingId ? { ...d, pins: [...(d.pins || []), emptyPin(xPct, yPct)] } : d
      ),
    }));
  };

  const updatePin = (drawingId, pinId, field, val) => {
    setS(prev => ({
      ...prev,
      drawings: prev.drawings.map(d =>
        d.id === drawingId
          ? { ...d, pins: (d.pins || []).map(p => p.id === pinId ? { ...p, [field]: val } : p) }
          : d
      ),
    }));
  };

  const removePin = (drawingId, pinId) => {
    setS(prev => ({
      ...prev,
      drawings: prev.drawings.map(d =>
        d.id === drawingId ? { ...d, pins: (d.pins || []).filter(p => p.id !== pinId) } : d
      ),
    }));
    setEditingPin(null);
  };

  /* ─── Calculations ─── */
  const calc = useMemo(() => {
    const itemsSub = s.items.reduce((a, i) => a + i.qty * i.netPrice, 0);
    const drawSub = s.drawings.reduce((a, d) => a + (d.totalPrice || 0), 0);
    const sub = itemsSub + drawSub;
    const fr = Number(s.freight) || 0;
    const gst = (sub + fr) * (s.gstRate / 100);
    const pst = (sub + fr) * (s.pstRate / 100);
    const total = sub + fr + gst + pst;
    const bal = total - (Number(s.deposit) || 0);
    return { itemsSub, drawSub, sub, fr, gst, pst, total, bal };
  }, [s.items, s.drawings, s.freight, s.gstRate, s.pstRate, s.deposit]);

  /* ─── Save / Load / New ─── */
  const saveQuote = () => {
    const e = { id: uid(), name: `${s.preparedFor.name} — #${s.quoteNumber}`, date: s.date, data: s };
    const u = [e, ...savedList.slice(0, 49)]; setSavedList(u); save(SAVED_KEY, u); flash("Saved!");
  };
  const loadQuote = (q) => { setS({ ...DEFAULT, ...q.data, fonts: { ...DEFAULT_FONTS, ...(q.data.fonts || {}) }, cols: { ...DEFAULT_COLS, ...(q.data.cols || {}) } }); setPanel(null); flash("Loaded!"); };
  const deleteQuote = (id) => { const u = savedList.filter(q => q.id !== id); setSavedList(u); save(SAVED_KEY, u); };
  const newQuote = () => { setS({ ...DEFAULT, quoteNumber: String(Math.floor(Math.random() * 90000) + 10000), items: [emptyItem()], drawings: [] }); flash("New quote!"); };

  /* ─── Export PDF ─── */
  const exportPDF = async () => {
    setExporting(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      const el = printRef.current;
      el.style.position = "absolute"; el.style.left = "0"; el.style.top = "0"; el.style.zIndex = "-1"; el.style.opacity = "1";
      await html2pdf().set({
        margin: [6, 6, 6, 6], filename: `Quote-${s.quoteNumber}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, scrollY: 0 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      }).from(el).save();
      el.style.position = "fixed"; el.style.left = "-9999px"; el.style.zIndex = "";
      flash("PDF exported!");
    } catch (e) {
      console.error(e);
      if (printRef.current) { printRef.current.style.position = "fixed"; printRef.current.style.left = "-9999px"; }
      flash("Export failed");
    }
    setExporting(false);
  };

  const doPrint = () => {
    const el = printRef.current;
    el.style.position = "absolute"; el.style.left = "0"; el.style.top = "0"; el.style.zIndex = "9999"; el.style.opacity = "1";
    setTimeout(() => { window.print(); el.style.position = "fixed"; el.style.left = "-9999px"; el.style.zIndex = ""; }, 100);
  };

  /* ─── Build grid template from column widths ─── */
  const gridCols = useMemo(() => {
    const imgW = "auto";
    const base = `36px ${imgW} ${C.itemNo}px ${C.qty}px ${C.uom}px 1fr`;
    const priced = s.showPrices ? ` ${C.netPrice}px ${C.extAmt}px` : "";
    return base + priced + " 56px";
  }, [C, s.showPrices]);

  /* ─── Reusable input ─── */
  const Inp = ({ label, value, onChange, type = "text", placeholder, small }) => (
    <div>
      {label && <label style={{ display: "block", fontSize: F.small, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", marginBottom: 4 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: small ? "6px 8px" : "8px 10px", border: "1px solid #D4D4D4", borderRadius: 4, fontSize: small ? F.small : F.body, fontFamily: "'Barlow', sans-serif", color: "#1A1A1A", background: "#FFF", outline: "none", boxSizing: "border-box" }}
        onFocus={e => { e.target.style.borderColor = "#C8102E"; }} onBlur={e => { e.target.style.borderColor = "#D4D4D4"; }} />
    </div>
  );

  /* ─── Font size slider helper ─── */
  const FontSlider = ({ label, path, min, max }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, width: 72, color: "#888", textTransform: "uppercase" }}>{label}</span>
      <input type="range" min={min} max={max} value={s.fonts?.[path] || DEFAULT_FONTS[path]}
        onChange={e => set(`fonts.${path}`, Number(e.target.value))}
        style={{ flex: 1, accentColor: "#C8102E" }} />
      <span style={{ fontSize: 11, fontWeight: 700, width: 28, textAlign: "right" }}>{s.fonts?.[path] || DEFAULT_FONTS[path]}px</span>
    </div>
  );

  /* ─── Column width slider helper ─── */
  const ColSlider = ({ label, path, min, max }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 700, width: 72, color: "#888", textTransform: "uppercase" }}>{label}</span>
      <input type="range" min={min} max={max} value={s.cols?.[path] || DEFAULT_COLS[path]}
        onChange={e => set(`cols.${path}`, Number(e.target.value))}
        style={{ flex: 1, accentColor: "#C8102E" }} />
      <span style={{ fontSize: 11, fontWeight: 700, width: 32, textAlign: "right" }}>{s.cols?.[path] || DEFAULT_COLS[path]}px</span>
    </div>
  );

  /* ═══ RENDER ═══ */
  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", background: "#F0F0F0", minHeight: "100vh", color: "#1A1A1A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Barlow+Condensed:wght@600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{margin:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes toastPop{from{opacity:0;transform:translate(-50%,12px) scale(.95)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
        .nv-card{animation:fadeUp .3s ease-out both}
        .nv-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:3px;border:1px solid #D4D4D4;background:#FFF;color:#444;font-size:11px;font-weight:700;font-family:'Barlow',sans-serif;cursor:pointer;transition:all .15s;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
        .nv-btn:hover{background:#F5F5F5;border-color:#999;transform:translateY(-1px)}
        .nv-btn-red{background:#C8102E;color:#FFF;border-color:#C8102E}.nv-btn-red:hover{background:#A30D24}
        .nv-btn-dark{background:#2D2D2D;color:#FFF;border-color:#2D2D2D}.nv-btn-dark:hover{background:#444}
        .nv-row:hover{background:#FFF9F9!important}
        .nv-drop{transition:all .2s}.nv-drop:hover,.nv-drop.over{border-color:#C8102E!important;background:#FEF2F2!important}
        input:focus,select:focus,textarea:focus{border-color:#C8102E!important;box-shadow:0 0 0 2px rgba(200,16,46,.08)}
        .nv-toggle{position:relative;width:44px;height:24px;border-radius:12px;background:#D4D4D4;cursor:pointer;transition:background .2s;border:none;padding:0}
        .nv-toggle.on{background:#C8102E}.nv-toggle::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#FFF;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.15)}.nv-toggle.on::after{transform:translateX(20px)}
        .nv-red-stripe{position:relative}.nv-red-stripe::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#C8102E;border-radius:6px 0 0 6px}
        .pin-dot{width:24px;height:24px;border-radius:50%;background:#C8102E;border:3px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:pointer;position:absolute;transform:translate(-50%,-50%);z-index:10;transition:transform .15s}
        .pin-dot:hover{transform:translate(-50%,-50%) scale(1.25)}
        .pin-label{position:absolute;transform:translateX(-50%);z-index:11;pointer-events:none;text-align:center;white-space:nowrap}
        @media(max-width:768px){.nv-resp-2{grid-template-columns:1fr!important}.nv-resp-5{grid-template-columns:1fr 1fr!important}.nv-item-grid{display:flex!important;flex-direction:column!important;padding:12px!important;gap:8px!important}.nv-item-grid>*{width:100%!important}.nv-topbar-actions{flex-wrap:wrap;justify-content:center}}
        @media(max-width:480px){.nv-resp-5{grid-template-columns:1fr!important}}
        @media print{.no-print{display:none!important}body{background:#fff!important}}
      `}</style>

      {/* Toast */}
      {toast && <div style={{ position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:"#2D2D2D",color:"#FFF",padding:"10px 28px",borderRadius:6,fontSize:13,fontWeight:700,boxShadow:"0 8px 32px rgba(0,0,0,.25)",animation:"toastPop .3s ease-out",fontFamily:"'Barlow',sans-serif",borderLeft:"4px solid #C8102E" }}>{toast}</div>}

      {/* ═══ TOP BAR ═══ */}
      <div className="no-print" style={{ background:"#FFF",borderBottom:"3px solid #C8102E",padding:"8px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ background:"#C8102E",color:"#FFF",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,padding:"3px 10px",borderRadius:2 }}>N</div>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:16,lineHeight:1 }}>NERVAL</div>
            <div style={{ fontSize:8,color:"#AAA",fontWeight:600,letterSpacing:".12em",textTransform:"uppercase" }}>Quotation System</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:5,alignItems:"center",flexWrap:"wrap" }} className="nv-topbar-actions">
          <div style={{ display:"flex",alignItems:"center",gap:6,padding:"0 8px",borderRight:"1px solid #E5E5E5",marginRight:4 }}>
            <span style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",color:s.showPrices?"#333":"#C8102E" }}>{s.showPrices?"Prices On":"Prices Off"}</span>
            <button className={`nv-toggle ${s.showPrices?"on":""}`} onClick={() => set("showPrices",!s.showPrices)} />
          </div>
          <button className="nv-btn" onClick={newQuote}><Plus size={13}/> New</button>
          <button className="nv-btn" onClick={saveQuote}><SaveIcon size={13}/> Save</button>
          <button className="nv-btn" onClick={() => setPanel(panel==="saved"?null:"saved")}><Folder size={13}/> Load</button>
          <button className="nv-btn" onClick={() => setPanel(panel==="settings"?null:"settings")}><Settings size={13}/> Settings</button>
          <button className="nv-btn" onClick={doPrint}><Printer size={13}/> Print</button>
          <button className="nv-btn nv-btn-red" onClick={exportPDF} disabled={exporting}><Download size={13}/> {exporting?"Exporting…":"Export PDF"}</button>
        </div>
      </div>

      {/* ═══ SIDE PANELS ═══ */}
      {panel && <div className="no-print" onClick={() => setPanel(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:150 }} />}

      {/* Settings Panel */}
      {panel === "settings" && (
        <div className="no-print" style={{ position:"fixed",top:0,right:0,bottom:0,width:380,maxWidth:"92vw",background:"#FFF",zIndex:200,overflowY:"auto",padding:24,animation:"slideIn .25s ease-out",boxShadow:"-8px 0 40px rgba(0,0,0,.15)",borderLeft:"3px solid #C8102E" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,textTransform:"uppercase" }}>Settings</h3>
            <button className="nv-btn" style={{ padding:"4px 8px" }} onClick={() => setPanel(null)}><XIcon size={14}/></button>
          </div>

          <div style={{ fontSize:11,fontWeight:800,textTransform:"uppercase",color:"#C8102E",marginBottom:10,letterSpacing:".06em" }}>Font Sizes</div>
          <FontSlider label="Header" path="header" min={18} max={42} />
          <FontSlider label="Subheader" path="subheader" min={10} max={22} />
          <FontSlider label="Body" path="body" min={9} max={18} />
          <FontSlider label="Small" path="small" min={7} max={14} />
          <button className="nv-btn" style={{ marginBottom:20,fontSize:10 }} onClick={() => set("fonts", { ...DEFAULT_FONTS })}>Reset Fonts</button>

          <div style={{ fontSize:11,fontWeight:800,textTransform:"uppercase",color:"#C8102E",marginBottom:10,marginTop:10,letterSpacing:".06em" }}>Column Widths</div>
          <ColSlider label="Item No" path="itemNo" min={60} max={200} />
          <ColSlider label="Qty" path="qty" min={30} max={100} />
          <ColSlider label="UOM" path="uom" min={30} max={100} />
          <ColSlider label="Net Price" path="netPrice" min={60} max={160} />
          <ColSlider label="Ext Amt" path="extAmt" min={60} max={160} />
          <button className="nv-btn" style={{ fontSize:10 }} onClick={() => set("cols", { ...DEFAULT_COLS })}>Reset Columns</button>
        </div>
      )}

      {/* Saved Panel */}
      {panel === "saved" && (
        <div className="no-print" style={{ position:"fixed",top:0,right:0,bottom:0,width:380,maxWidth:"92vw",background:"#FFF",zIndex:200,overflowY:"auto",padding:24,animation:"slideIn .25s ease-out",boxShadow:"-8px 0 40px rgba(0,0,0,.15)",borderLeft:"3px solid #C8102E" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,textTransform:"uppercase" }}>Saved Quotations</h3>
            <button className="nv-btn" style={{ padding:"4px 8px" }} onClick={() => setPanel(null)}><XIcon size={14}/></button>
          </div>
          {savedList.length===0 ? <p style={{ color:"#999",fontSize:13,textAlign:"center",padding:"40px 0" }}>No saved quotations yet.</p> :
            savedList.map(q => (
              <div key={q.id} style={{ padding:14,border:"1px solid #E5E5E5",borderRadius:6,marginBottom:8,cursor:"pointer",transition:"all .2s",borderLeft:"3px solid transparent" }}
                onClick={() => loadQuote(q)}
                onMouseEnter={e => { e.currentTarget.style.borderLeftColor="#C8102E"; e.currentTarget.style.background="#FEF9F9"; }}
                onMouseLeave={e => { e.currentTarget.style.borderLeftColor="transparent"; e.currentTarget.style.background="#FFF"; }}>
                <div style={{ fontWeight:700,fontSize:13 }}>{q.name}</div>
                <div style={{ fontSize:11,color:"#999",display:"flex",justifyContent:"space-between",marginTop:4 }}>
                  <span>{q.date}</span>
                  <button style={{ background:"none",border:"none",color:"#C8102E",cursor:"pointer",fontSize:11,fontWeight:700 }} onClick={e => { e.stopPropagation(); deleteQuote(q.id); }}>Delete</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ═══ MAIN FORM ═══ */}
      <div style={{ maxWidth:1100,margin:"0 auto",padding:"20px 16px 80px" }} className="no-print">

        {/* ── QUOTE HEADER ── */}
        <div className="nv-card" style={{ background:"#FFF",borderRadius:6,overflow:"hidden",marginBottom:16,border:"1px solid #E0E0E0",boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
          <div className="nv-header-flex" style={{ background:"#C8102E",color:"#FFF",padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
            <div style={{ display:"flex",alignItems:"center",gap:14 }}>
              <label style={{ cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
                {s.logo ? (
                  <div style={{ position:"relative" }}>
                    <img src={s.logo} alt="" style={{ maxHeight:40,borderRadius:3 }} />
                    <button onClick={e => { e.preventDefault(); set("logo",null); }} style={{ position:"absolute",top:-6,right:-6,width:16,height:16,borderRadius:"50%",background:"#000",color:"#FFF",border:"none",cursor:"pointer",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
                  </div>
                ) : (
                  <div style={{ border:"2px dashed rgba(255,255,255,.4)",borderRadius:4,padding:"6px 14px",fontSize:F.small,fontWeight:600,display:"flex",alignItems:"center",gap:5,opacity:.8 }}>
                    <Img size={13}/> Upload Logo
                  </div>
                )}
                <input type="file" accept="image/*" hidden onChange={e => handleFile(null,null,"logo",e.target.files[0])} />
              </label>
              <div style={{ fontSize:F.small,opacity:.75,lineHeight:1.6 }}>
                <div>Tel: 780-452-1111 &nbsp; Fax: 780-452-5775</div>
                <div>1001 Buckingham Drive | Sherwood Park, AB | T8H 0X5</div>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:F.header,letterSpacing:".08em",lineHeight:1 }}>QUOTATION</div>
              <div style={{ display:"flex",gap:14,fontSize:F.body,fontWeight:600,marginTop:6,justifyContent:"flex-end",alignItems:"center",flexWrap:"wrap" }}>
                <span style={{ display:"flex",alignItems:"center",gap:4 }}>Quote:
                  <input value={s.quoteNumber} onChange={e => set("quoteNumber",e.target.value)} style={{ background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:3,color:"#FFF",padding:"3px 8px",fontFamily:"'Barlow',sans-serif",fontSize:F.subheader,fontWeight:800,width:80,outline:"none" }} />
                </span>
                <span style={{ display:"flex",alignItems:"center",gap:4 }}>Date:
                  <input type="date" value={s.date} onChange={e => set("date",e.target.value)} style={{ background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:3,color:"#FFF",padding:"3px 6px",fontFamily:"'Barlow',sans-serif",fontSize:F.body,fontWeight:600,outline:"none",colorScheme:"dark" }} />
                </span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:0 }} className="nv-resp-2">
            <div style={{ padding:"16px 24px",borderRight:"1px solid #E5E5E5",borderBottom:"1px solid #E5E5E5" }}>
              <div style={{ fontSize:F.small,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#C8102E",marginBottom:10,background:"#F7F7F7",padding:"4px 10px",display:"inline-block",borderRadius:2 }}>Prepared For:</div>
              <Inp label="Name" value={s.preparedFor.name} onChange={v => set("preparedFor.name",v)} small />
              <div style={{ height:6 }} />
              <Inp label="Address" value={s.preparedFor.address} onChange={v => set("preparedFor.address",v)} small />
              <div style={{ height:6 }} />
              <Inp label="City / Province / Postal" value={s.preparedFor.cityProv} onChange={v => set("preparedFor.cityProv",v)} small />
            </div>
            <div style={{ padding:"16px 24px",borderBottom:"1px solid #E5E5E5" }}>
              <div style={{ fontSize:F.small,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",color:"#C8102E",marginBottom:10,background:"#F7F7F7",padding:"4px 10px",display:"inline-block",borderRadius:2 }}>Ship To:</div>
              <Inp label="Name" value={s.shipTo.name} onChange={v => set("shipTo.name",v)} small />
              <div style={{ height:6 }} />
              <Inp label="Address" value={s.shipTo.address} onChange={v => set("shipTo.address",v)} small />
              <div style={{ height:6 }} />
              <Inp label="City / Province / Postal" value={s.shipTo.cityProv} onChange={v => set("shipTo.cityProv",v)} small />
              <div style={{ height:6 }} />
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }} className="nv-resp-2">
                <Inp label="Phone" value={s.shipTo.phone} onChange={v => set("shipTo.phone",v)} small />
                <Inp label="Email" value={s.shipTo.email} onChange={v => set("shipTo.email",v)} small />
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",fontSize:F.small,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",color:"#FFF",background:"#C8102E" }} className="nv-resp-5">
              {["Customer #","Carrier","PO #","Ship Date","Salesperson"].map(h => <div key={h} style={{ padding:"6px 12px",borderRight:"1px solid rgba(255,255,255,.15)" }}>{h}</div>)}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",background:"#FAFAFA" }} className="nv-resp-5">
              {[{v:s.customerNo,k:"customerNo"},{v:s.carrier,k:"carrier"},{v:s.poNumber,k:"poNumber"},{v:s.shipDate,k:"shipDate",type:"date"},{v:s.salesperson,k:"salesperson"}].map(f => (
                <div key={f.k} style={{ padding:"4px 10px",borderRight:"1px solid #E5E5E5" }}>
                  <input type={f.type||"text"} value={f.v} onChange={e => set(f.k,e.target.value)} style={{ width:"100%",border:"none",background:"transparent",fontSize:F.body,fontFamily:"'Barlow',sans-serif",fontWeight:500,color:"#333",outline:"none",padding:"4px 0" }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex",gap:2 }}>
          {[{key:"items",icon:<FileText size={13}/>,label:`Line Items (${s.items.length})`},{key:"drawings",icon:<Layers size={13}/>,label:`Drawings & Visuals (${s.drawings.length})`}].map(t => (
            <button key={t.key} className={`nv-btn ${activeTab===t.key?"nv-btn-dark":""}`} onClick={() => setActiveTab(t.key)}
              style={{ borderRadius:"6px 6px 0 0",borderBottom:activeTab===t.key?"2px solid #2D2D2D":"1px solid #D4D4D4" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── ITEMS TABLE ── */}
        {activeTab === "items" && (
          <div className="nv-card" style={{ background:"#FFF",borderRadius:"0 6px 6px 6px",border:"1px solid #E0E0E0",overflow:"hidden",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            {/* Header */}
            <div style={{ display:"grid",gridTemplateColumns:gridCols,gap:0,background:"#C8102E",color:"#FFF",fontSize:Math.max(8,F.small-1),fontWeight:800,textTransform:"uppercase",letterSpacing:".06em" }} className="nv-item-grid">
              <div style={{ padding:"8px 4px",textAlign:"center" }}>LN</div>
              <div style={{ padding:"8px 4px" }}>Img</div>
              <div style={{ padding:"8px 8px" }}>Item No</div>
              <div style={{ padding:"8px 2px",textAlign:"center" }}>Qty</div>
              <div style={{ padding:"8px 2px" }}>UOM</div>
              <div style={{ padding:"8px 8px" }}>Description</div>
              {s.showPrices && <div style={{ padding:"8px 8px",textAlign:"right" }}>Net Price</div>}
              {s.showPrices && <div style={{ padding:"8px 8px",textAlign:"right" }}>Ext Amt</div>}
              <div></div>
            </div>

            {/* Rows */}
            {s.items.map((item, idx) => {
              const hasImg = !!item.image;
              return (
                <div key={item.id} className="nv-row nv-item-grid" style={{ display:"grid",gridTemplateColumns:gridCols,gap:0,alignItems:"center",borderBottom:"1px solid #F0F0F0",background:idx%2===0?"#FFF":"#FAFAFA",transition:"background .15s" }}>
                  <div style={{ padding:"8px 4px",textAlign:"center",fontSize:F.body,color:"#BBB",fontWeight:700 }}>{idx+1}</div>

                  {/* Image cell — 200×100 when image exists, 42×42 when empty */}
                  <div style={{ padding:"4px 3px" }}
                    tabIndex={0}
                    onPaste={handlePaste("item", item.id, "image")}
                  >
                    <div className="nv-drop"
                      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("over"); }}
                      onDragLeave={e => { e.currentTarget.classList.remove("over"); }}
                      onDrop={e => { e.currentTarget.classList.remove("over"); handleDrop(e,"item",item.id,"image"); }}
                      onClick={() => fileRefs.current[item.id]?.click()}
                      style={{
                        width: hasImg ? 200 : 42, height: hasImg ? 100 : 42,
                        borderRadius: 4, overflow: "hidden",
                        border: hasImg ? "1px solid #E5E5E5" : "1.5px dashed #D4D4D4",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", background: hasImg ? "#FAFAFA" : "#F9F9F9",
                        transition: "all .2s",
                      }}>
                      {hasImg ? (
                        <div style={{ position:"relative",width:"100%",height:"100%" }}>
                          <img src={item.image} alt="" style={{ width:"100%",height:"100%",objectFit:"contain" }} />
                          <button onClick={e => { e.stopPropagation(); updateItem(item.id,"image",null); }}
                            style={{ position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"rgba(0,0,0,.6)",color:"#FFF",border:"none",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
                        </div>
                      ) : (
                        <div style={{ textAlign:"center",color:"#D4D4D4" }}>
                          <Img size={14}/>
                          <div style={{ fontSize:7,marginTop:2 }}>Paste/Drop</div>
                        </div>
                      )}
                      <input ref={el => { fileRefs.current[item.id] = el; }} type="file" accept="image/*" hidden onChange={e => handleFile("item",item.id,"image",e.target.files[0])} />
                    </div>
                  </div>

                  <input value={item.itemNo} onChange={e => updateItem(item.id,"itemNo",e.target.value)} placeholder="SKU"
                    style={{ width:"100%",border:"none",background:"transparent",padding:"8px 6px",fontSize:F.body,fontFamily:"'Barlow',sans-serif",fontWeight:600,outline:"none" }} />
                  <input type="number" min="0" value={item.qty} onChange={e => updateItem(item.id,"qty",Math.max(0,Number(e.target.value)))}
                    style={{ width:"100%",border:"none",background:"transparent",padding:"8px 2px",fontSize:F.body,fontFamily:"'Barlow',sans-serif",textAlign:"center",outline:"none",fontWeight:700 }} />
                  <select value={item.uom} onChange={e => updateItem(item.id,"uom",e.target.value)}
                    style={{ border:"none",background:"transparent",fontSize:F.small,fontFamily:"'Barlow',sans-serif",outline:"none",cursor:"pointer",padding:"4px 0",color:"#777" }}>
                    {["ea","ft","sq ft","ln ft","set","lot","hr"].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <textarea value={item.description} onChange={e => updateItem(item.id,"description",e.target.value)} placeholder="Description..." rows={2}
                    style={{ width:"100%",border:"none",background:"transparent",padding:"6px 8px",fontSize:F.body,fontFamily:"'Barlow',sans-serif",outline:"none",resize:"vertical",minHeight:34,lineHeight:1.4 }} />
                  {s.showPrices && <input type="number" min="0" step="0.01" value={item.netPrice} onChange={e => updateItem(item.id,"netPrice",Math.max(0,Number(e.target.value)))}
                    style={{ width:"100%",border:"none",background:"transparent",padding:"8px 6px",fontSize:F.body,fontFamily:"'Barlow',sans-serif",textAlign:"right",outline:"none",fontWeight:700 }} />}
                  {s.showPrices && <div style={{ padding:"8px 8px",textAlign:"right",fontSize:F.body,fontWeight:800,color:"#333" }}>{fmt(item.qty*item.netPrice,s.currency)}</div>}
                  <div style={{ display:"flex",gap:2,alignItems:"center",justifyContent:"center" }}>
                    <button onClick={() => duplicateItem(item.id)} title="Duplicate" style={{ background:"none",border:"none",cursor:"pointer",color:"#D4D4D4",padding:3,transition:"color .15s" }} onMouseEnter={e => { e.currentTarget.style.color="#2D2D2D"; }} onMouseLeave={e => { e.currentTarget.style.color="#D4D4D4"; }}><Copy size={12}/></button>
                    <button onClick={() => removeItem(item.id)} title="Delete" style={{ background:"none",border:"none",cursor:"pointer",color:"#D4D4D4",padding:3,transition:"color .15s" }} onMouseEnter={e => { e.currentTarget.style.color="#C8102E"; }} onMouseLeave={e => { e.currentTarget.style.color="#D4D4D4"; }}><Trash size={12}/></button>
                  </div>
                </div>
              );
            })}
            <div style={{ padding:"10px 16px",borderTop:"1px solid #F0F0F0" }}>
              <button className="nv-btn" onClick={addItem} style={{ fontSize:10 }}><Plus size={12}/> Add Item</button>
            </div>
          </div>
        )}

        {/* ── DRAWINGS TAB ── */}
        {activeTab === "drawings" && (
          <div className="nv-card" style={{ background:"#FFF",borderRadius:"0 6px 6px 6px",border:"1px solid #E0E0E0",padding:20,marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <p style={{ fontSize:F.body,color:"#999",marginBottom:16,lineHeight:1.5 }}>
              Upload drawings and click on the image to place <strong>pin annotations</strong> with spec labels. Each drawing gets its own total price.
            </p>
            {s.drawings.length===0 && (
              <div style={{ textAlign:"center",padding:"50px 0",color:"#D4D4D4" }}>
                <Layers size={48}/><div style={{ marginTop:14,fontSize:F.subheader,fontWeight:700,color:"#BBB" }}>No drawings yet</div>
              </div>
            )}

            {s.drawings.map((drw,idx) => (
              <div key={drw.id} style={{ border:"1px solid #E5E5E5",borderRadius:8,overflow:"hidden",marginBottom:14,animation:"fadeUp .3s ease-out",borderLeft:"4px solid #C8102E" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",background:"#FAFAFA",borderBottom:"1px solid #F0F0F0" }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:F.subheader,color:"#C8102E",textTransform:"uppercase" }}>Drawing #{idx+1}</div>
                  <button onClick={() => removeDrawing(drw.id)} className="nv-btn" style={{ padding:"3px 10px",fontSize:10 }}><Trash size={12}/> Remove</button>
                </div>

                <div style={{ padding:16 }}>
                  {/* Drawing image with pin annotations */}
                  <div style={{ marginBottom:12 }}
                    tabIndex={0}
                    onPaste={handlePaste("drawing", drw.id, "image")}
                  >
                    {drw.image ? (
                      <div style={{ position:"relative",display:"inline-block",width:"100%",background:"#F5F5F5",borderRadius:6,overflow:"visible",border:"1px solid #E5E5E5" }}>
                        <img src={drw.image} alt="" style={{ width:"100%",maxHeight:500,objectFit:"contain",display:"block",borderRadius:6 }}
                          onClick={e => addPin(drw.id, e)} />
                        {/* Pin dots */}
                        {(drw.pins||[]).map(pin => (
                          <div key={pin.id}>
                            <div className="pin-dot" style={{ left:`${pin.xPct}%`,top:`${pin.yPct}%` }}
                              onClick={e => { e.stopPropagation(); setEditingPin(editingPin===pin.id?null:pin.id); }} />
                            {/* Pin label */}
                            <div className="pin-label" style={{ left:`${pin.xPct}%`,top:`calc(${pin.yPct}% + 16px)` }}>
                              <div style={{ background:"rgba(200,16,46,.92)",color:"#FFF",padding:"3px 8px",borderRadius:4,fontSize:F.small,fontWeight:700,lineHeight:1.2,boxShadow:"0 2px 8px rgba(0,0,0,.2)" }}>
                                {pin.main}
                              </div>
                              {pin.sub && <div style={{ background:"rgba(0,0,0,.72)",color:"#FFF",padding:"2px 6px",borderRadius:3,fontSize:Math.max(7,F.small-2),marginTop:2,lineHeight:1.2 }}>{pin.sub}</div>}
                            </div>
                            {/* Edit popover */}
                            {editingPin===pin.id && (
                              <div style={{ position:"absolute",left:`${pin.xPct}%`,top:`calc(${pin.yPct}% + 50px)`,transform:"translateX(-50%)",zIndex:20,background:"#FFF",border:"1px solid #E5E5E5",borderRadius:8,padding:12,width:220,boxShadow:"0 8px 24px rgba(0,0,0,.15)" }}
                                onClick={e => e.stopPropagation()}>
                                <div style={{ fontSize:9,fontWeight:700,textTransform:"uppercase",color:"#C8102E",marginBottom:6 }}>Edit Pin</div>
                                <input value={pin.main} onChange={e => updatePin(drw.id,pin.id,"main",e.target.value)} placeholder="Main text"
                                  style={{ width:"100%",padding:"6px 8px",border:"1px solid #D4D4D4",borderRadius:4,fontSize:F.body,fontFamily:"'Barlow',sans-serif",marginBottom:6,outline:"none",boxSizing:"border-box",fontWeight:700 }} />
                                <input value={pin.sub} onChange={e => updatePin(drw.id,pin.id,"sub",e.target.value)} placeholder="Sub text / specs"
                                  style={{ width:"100%",padding:"5px 8px",border:"1px solid #D4D4D4",borderRadius:4,fontSize:F.small,fontFamily:"'Barlow',sans-serif",marginBottom:8,outline:"none",boxSizing:"border-box",color:"#666" }} />
                                <div style={{ display:"flex",gap:6 }}>
                                  <button className="nv-btn" style={{ flex:1,padding:"4px 8px",fontSize:9,justifyContent:"center" }} onClick={() => setEditingPin(null)}>Done</button>
                                  <button className="nv-btn" style={{ padding:"4px 8px",fontSize:9,color:"#C8102E" }} onClick={() => removePin(drw.id,pin.id)}><Trash size={10}/></button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <div style={{ position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.6)",color:"#FFF",padding:"4px 10px",borderRadius:4,fontSize:9,fontWeight:600,pointerEvents:"none" }}>
                          <MapPin size={10} style={{ display:"inline",verticalAlign:"middle",marginRight:3 }}/> Click to add pin
                        </div>
                      </div>
                    ) : (
                      <div className="nv-drop"
                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("over"); }}
                        onDragLeave={e => { e.currentTarget.classList.remove("over"); }}
                        onDrop={e => { e.currentTarget.classList.remove("over"); handleDrop(e,"drawing",drw.id,"image"); }}
                        onClick={() => drawingRefs.current[drw.id]?.click()}
                        style={{ minHeight:200,borderRadius:6,border:"2px dashed #D4D4D4",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#F9F9F9" }}>
                        <div style={{ textAlign:"center",color:"#CCC",padding:20 }}>
                          <Img size={40}/><div style={{ fontSize:F.body,fontWeight:700,marginTop:10,color:"#BBB" }}>Drop, click, or paste (Ctrl+V) to upload</div>
                          <div style={{ fontSize:F.small,color:"#D4D4D4",marginTop:4 }}>Kitchen plans, renderings, elevations</div>
                        </div>
                      </div>
                    )}
                    <input ref={el => { drawingRefs.current[drw.id]=el; }} type="file" accept="image/*" hidden onChange={e => handleFile("drawing",drw.id,"image",e.target.files[0])} />
                  </div>

                  {/* Drawing details */}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }} className="nv-resp-2">
                    <Inp label="Title / Room" value={drw.title} onChange={v => updateDrawing(drw.id,"title",v)} placeholder="e.g. Kitchen Plan & Elevations" />
                    <div>
                      <label style={{ display:"block",fontSize:F.small,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"#888",marginBottom:4 }}>Total Price</label>
                      <input type="number" min="0" step="0.01" value={drw.totalPrice} onChange={e => updateDrawing(drw.id,"totalPrice",Math.max(0,Number(e.target.value)))}
                        style={{ width:"100%",padding:"8px 10px",border:"1px solid #D4D4D4",borderRadius:4,fontSize:F.subheader,fontFamily:"'Barlow',sans-serif",fontWeight:700,outline:"none",boxSizing:"border-box" }} />
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:F.header*0.75,color:"#C8102E",marginTop:4 }}>{fmt(drw.totalPrice||0,s.currency)}</div>
                    </div>
                    <div>
                      <label style={{ display:"block",fontSize:F.small,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"#888",marginBottom:4 }}>Notes</label>
                      <textarea value={drw.notes} onChange={e => updateDrawing(drw.id,"notes",e.target.value)} placeholder="e.g. Waterfall edge, island end panels..." rows={3}
                        style={{ width:"100%",padding:"8px 10px",border:"1px solid #D4D4D4",borderRadius:4,fontSize:F.body,fontFamily:"'Barlow',sans-serif",color:"#555",outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.5 }} />
                    </div>
                  </div>
                  {/* Pin list */}
                  {(drw.pins||[]).length > 0 && (
                    <div style={{ marginTop:12,padding:"10px 12px",background:"#F9F9F9",borderRadius:6,border:"1px solid #F0F0F0" }}>
                      <div style={{ fontSize:F.small,fontWeight:800,textTransform:"uppercase",color:"#C8102E",marginBottom:6 }}>{(drw.pins||[]).length} Pin{(drw.pins||[]).length>1?"s":""}</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                        {(drw.pins||[]).map(p => (
                          <div key={p.id} style={{ background:"#FFF",border:"1px solid #E5E5E5",borderRadius:4,padding:"4px 8px",fontSize:F.small,cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}
                            onClick={() => setEditingPin(editingPin===p.id?null:p.id)}>
                            <div style={{ width:8,height:8,borderRadius:"50%",background:"#C8102E" }} />
                            <span style={{ fontWeight:700 }}>{p.main}</span>
                            <span style={{ color:"#999" }}>— {p.sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button className="nv-btn nv-btn-red" onClick={addDrawing} style={{ marginTop:8 }}><Plus size={13}/> Add Drawing / Visual</button>
          </div>
        )}

        {/* ── SUMMARY / NOTES ── */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 360px",gap:16 }} className="nv-resp-2">
          <div className="nv-card" style={{ background:"#FFF",borderRadius:6,border:"1px solid #E0E0E0",padding:20,boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }} className="nv-resp-2">
              <div>
                <div style={{ fontSize:F.small,fontWeight:800,textTransform:"uppercase",color:"#C8102E",marginBottom:8,display:"flex",alignItems:"center",gap:6 }}>
                  <div style={{ width:3,height:14,background:"#C8102E",borderRadius:2 }}/> Note:
                </div>
                <textarea value={s.notes} onChange={e => set("notes",e.target.value)} rows={4}
                  style={{ width:"100%",padding:"8px 10px",border:"1px solid #D4D4D4",borderRadius:4,fontSize:F.body,fontFamily:"'Barlow',sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.5 }} />
              </div>
              <div>
                <div style={{ fontSize:F.small,fontWeight:800,textTransform:"uppercase",color:"#C8102E",marginBottom:8,display:"flex",alignItems:"center",gap:6 }}>
                  <div style={{ width:3,height:14,background:"#C8102E",borderRadius:2 }}/> Terms
                </div>
                <textarea value={s.termsNotes} onChange={e => set("termsNotes",e.target.value)} rows={4}
                  style={{ width:"100%",padding:"8px 10px",border:"1px solid #D4D4D4",borderRadius:4,fontSize:F.small,fontFamily:"'Barlow',sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box",color:"#777",lineHeight:1.5 }} />
              </div>
            </div>
            <div style={{ marginTop:12,display:"flex",alignItems:"center",gap:8 }}>
              <label style={{ fontSize:F.small,fontWeight:700,textTransform:"uppercase",color:"#888" }}>Currency</label>
              <select value={s.currency} onChange={e => set("currency",e.target.value)}
                style={{ border:"1px solid #D4D4D4",borderRadius:3,padding:"3px 8px",fontSize:F.body,fontFamily:"'Barlow',sans-serif",outline:"none",cursor:"pointer",fontWeight:600 }}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Totals */}
          <div className="nv-card nv-red-stripe" style={{ background:"#FFF",borderRadius:6,border:"1px solid #E0E0E0",padding:"20px 20px 20px 26px",boxShadow:"0 1px 4px rgba(0,0,0,.04)",alignSelf:"flex-start" }}>
            {calc.drawSub > 0 && <SumRow label="Drawings" value={fmt(calc.drawSub,s.currency)} F={F} />}
            {calc.itemsSub > 0 && <SumRow label="Line Items" value={fmt(calc.itemsSub,s.currency)} F={F} />}
            <SumRow label="SUBTOTAL" value={fmt(calc.sub,s.currency)} bold F={F} />
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0" }}>
              <span style={{ fontSize:F.body,color:"#777",fontWeight:600 }}>FREIGHT</span>
              <input type="number" min="0" step="0.01" value={s.freight} onChange={e => set("freight",Math.max(0,Number(e.target.value)))}
                style={{ width:90,textAlign:"right",border:"1px solid #E5E5E5",borderRadius:3,padding:"4px 6px",fontSize:F.body,fontFamily:"'Barlow',sans-serif",fontWeight:700,outline:"none" }} />
            </div>
            <TaxRow label="GST/HST" rate={s.gstRate} onRate={v => set("gstRate",v)} amount={calc.gst} currency={s.currency} F={F} />
            <TaxRow label="PST" rate={s.pstRate} onRate={v => set("pstRate",v)} amount={calc.pst} currency={s.currency} F={F} />
            <div style={{ borderTop:"3px solid #C8102E",marginTop:8,paddingTop:10,display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:F.subheader+2,textTransform:"uppercase" }}>TOTAL</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:F.header*0.85,color:"#C8102E" }}>{fmt(calc.total,s.currency)}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0" }}>
              <span style={{ fontSize:F.body,color:"#777",fontWeight:600 }}>DEPOSIT</span>
              <input type="number" min="0" step="0.01" value={s.deposit} onChange={e => set("deposit",Math.max(0,Number(e.target.value)))}
                style={{ width:90,textAlign:"right",border:"1px solid #E5E5E5",borderRadius:3,padding:"4px 6px",fontSize:F.body,fontFamily:"'Barlow',sans-serif",fontWeight:700,outline:"none" }} />
            </div>
            <SumRow label="BALANCE" value={fmt(calc.bal,s.currency)} bold accent F={F} />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          PDF / PRINT RENDER (off-screen)
         ════════════════════════════════════════════ */}
      <div ref={printRef} style={{ position:"fixed",left:"-9999px",top:0,width:780,background:"#FFF",color:"#1A1A1A",fontFamily:"'Barlow',sans-serif",fontSize:11,lineHeight:1.4 }}>
        <div style={{ background:"#C8102E",color:"#FFF",padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            {s.logo && <img src={s.logo} alt="" style={{ maxHeight:36 }} />}
            <div style={{ fontSize:10,opacity:.8,lineHeight:1.6 }}><div>Tel: 780-452-1111 &nbsp; Fax: 780-452-5775</div><div>1001 Buckingham Drive | Sherwood Park, AB | T8H 0X5</div></div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,letterSpacing:".08em" }}>QUOTATION</div>
            <div style={{ fontSize:11,marginTop:2 }}>Quote: <strong>{s.quoteNumber}</strong> &nbsp;&nbsp; Date: <strong>{s.date}</strong></div>
          </div>
        </div>
        <div style={{ display:"flex",borderBottom:"1px solid #E5E5E5" }}>
          <div style={{ flex:1,padding:"12px 24px",borderRight:"1px solid #E5E5E5" }}>
            <div style={{ fontSize:9,fontWeight:800,textTransform:"uppercase",color:"#C8102E",marginBottom:3 }}>Prepared For:</div>
            <div style={{ fontWeight:700,fontSize:12 }}>{s.preparedFor.name}</div><div>{s.preparedFor.address}</div><div>{s.preparedFor.cityProv}</div>
          </div>
          <div style={{ flex:1,padding:"12px 24px" }}>
            <div style={{ fontSize:9,fontWeight:800,textTransform:"uppercase",color:"#C8102E",marginBottom:3 }}>Ship To:</div>
            <div style={{ fontWeight:700,fontSize:12 }}>{s.shipTo.name}</div><div>{s.shipTo.address}</div><div>{s.shipTo.cityProv}</div>
            {s.shipTo.phone && <div>Phone: {s.shipTo.phone}</div>}
          </div>
        </div>
        <table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr style={{ background:"#C8102E",color:"#FFF",fontSize:9,fontWeight:800,textTransform:"uppercase" }}>
          <th style={{ padding:"5px 10px",textAlign:"left" }}>Customer #</th><th style={{ padding:"5px 10px",textAlign:"left" }}>Carrier</th><th style={{ padding:"5px 10px",textAlign:"left" }}>PO #</th><th style={{ padding:"5px 10px",textAlign:"left" }}>Ship Date</th><th style={{ padding:"5px 10px",textAlign:"left" }}>Salesperson</th>
        </tr></thead><tbody><tr style={{ borderBottom:"1px solid #E5E5E5",fontSize:11 }}>
          <td style={{ padding:"5px 10px" }}>{s.customerNo}</td><td style={{ padding:"5px 10px" }}>{s.carrier}</td><td style={{ padding:"5px 10px" }}>{s.poNumber}</td><td style={{ padding:"5px 10px" }}>{s.shipDate}</td><td style={{ padding:"5px 10px" }}>{s.salesperson}</td>
        </tr></tbody></table>

        {/* PDF Drawings with pins */}
        {s.drawings.length > 0 && <div style={{ padding:"16px 24px" }}>
          {s.drawings.map((drw,i) => (
            <div key={drw.id} style={{ marginBottom:20,pageBreakInside:"avoid" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6,borderBottom:"2px solid #C8102E",paddingBottom:4 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:14,textTransform:"uppercase" }}>{drw.title||`Drawing #${i+1}`}</div>
                {s.showPrices && <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:"#C8102E" }}>Total: {fmt(drw.totalPrice||0,s.currency)}</div>}
              </div>
              {drw.image && (
                <div style={{ position:"relative",display:"inline-block",width:"100%" }}>
                  <img src={drw.image} alt="" style={{ maxWidth:"100%",maxHeight:340,objectFit:"contain",border:"1px solid #E5E5E5",borderRadius:4 }} />
                  {(drw.pins||[]).map(pin => (
                    <div key={pin.id}>
                      <div style={{ position:"absolute",left:`${pin.xPct}%`,top:`${pin.yPct}%`,width:16,height:16,borderRadius:"50%",background:"#C8102E",border:"2px solid #FFF",transform:"translate(-50%,-50%)",boxShadow:"0 1px 4px rgba(0,0,0,.3)" }} />
                      <div style={{ position:"absolute",left:`${pin.xPct}%`,top:`calc(${pin.yPct}% + 12px)`,transform:"translateX(-50%)",textAlign:"center",whiteSpace:"nowrap" }}>
                        <div style={{ background:"rgba(200,16,46,.9)",color:"#FFF",padding:"2px 6px",borderRadius:3,fontSize:8,fontWeight:700 }}>{pin.main}</div>
                        {pin.sub && <div style={{ background:"rgba(0,0,0,.7)",color:"#FFF",padding:"1px 4px",borderRadius:2,fontSize:7,marginTop:1 }}>{pin.sub}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {drw.notes && <div style={{ fontSize:10,color:"#666",marginTop:4 }}>NOTE: {drw.notes}</div>}
            </div>
          ))}
        </div>}

        {/* PDF Items */}
        {s.items.some(i => i.itemNo||i.description) && (
          <table style={{ width:"100%",borderCollapse:"collapse",margin:"0 0 12px",fontSize:10 }}>
            <thead><tr style={{ background:"#C8102E",color:"#FFF",fontSize:9,fontWeight:800,textTransform:"uppercase" }}>
              <th style={{ padding:"5px 8px",textAlign:"left",width:22 }}>LN</th><th style={{ padding:"5px 6px",width:50 }}>Img</th>
              <th style={{ padding:"5px 8px",textAlign:"left" }}>Item No</th><th style={{ padding:"5px 6px",textAlign:"center",width:28 }}>Qty</th><th style={{ padding:"5px 6px",width:28 }}>UOM</th>
              <th style={{ padding:"5px 8px",textAlign:"left" }}>Description</th>
              {s.showPrices && <th style={{ padding:"5px 8px",textAlign:"right" }}>Net Price</th>}
              {s.showPrices && <th style={{ padding:"5px 8px",textAlign:"right" }}>Ext Amt</th>}
            </tr></thead>
            <tbody>{s.items.map((item,i) => (
              <tr key={item.id} style={{ borderBottom:"1px solid #EEE",background:i%2===0?"#FFF":"#FAFAFA" }}>
                <td style={{ padding:"5px 8px",color:"#999" }}>{i+1}</td>
                <td style={{ padding:"3px 4px" }}>{item.image && <img src={item.image} alt="" style={{ width:46,height:30,objectFit:"contain",borderRadius:2 }} />}</td>
                <td style={{ padding:"5px 8px",fontWeight:600 }}>{item.itemNo}</td>
                <td style={{ padding:"5px 6px",textAlign:"center" }}>{item.qty}</td><td style={{ padding:"5px 6px" }}>{item.uom}</td>
                <td style={{ padding:"5px 8px",whiteSpace:"pre-wrap",lineHeight:1.35 }}>{item.description}</td>
                {s.showPrices && <td style={{ padding:"5px 8px",textAlign:"right" }}>{fmt(item.netPrice,s.currency)}</td>}
                {s.showPrices && <td style={{ padding:"5px 8px",textAlign:"right",fontWeight:700 }}>{fmt(item.qty*item.netPrice,s.currency)}</td>}
              </tr>
            ))}</tbody>
          </table>
        )}

        {/* PDF Footer */}
        <div style={{ display:"flex",padding:"0 24px 20px",gap:20 }}>
          <div style={{ flex:1,fontSize:9,color:"#777",lineHeight:1.5 }}>
            {s.notes && <><div style={{ display:"flex",alignItems:"center",gap:4,marginBottom:4 }}><div style={{ width:3,height:10,background:"#C8102E",borderRadius:1 }}/><strong style={{ color:"#333",fontSize:10 }}>NOTE:</strong></div><div style={{ marginBottom:8 }}>{s.notes}</div></>}
            {s.termsNotes && <div style={{ whiteSpace:"pre-wrap",borderTop:"1px solid #EEE",paddingTop:6,marginTop:4 }}>{s.termsNotes}</div>}
          </div>
          <div style={{ width:220 }}>
            <PdfRow label="SUBTOTAL" value={fmt(calc.sub,s.currency)} bold />
            <PdfRow label="FREIGHT" value={fmt(calc.fr,s.currency)} />
            <PdfRow label="GST/HST" value={fmt(calc.gst,s.currency)} />
            <PdfRow label="PST" value={fmt(calc.pst,s.currency)} />
            <div style={{ display:"flex",justifyContent:"space-between",padding:"8px 0 4px",borderTop:"3px solid #C8102E",marginTop:4,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15 }}>
              <span>TOTAL</span><span style={{ color:"#C8102E" }}>{fmt(calc.total,s.currency)}</span>
            </div>
            <PdfRow label="DEPOSIT" value={fmt(s.deposit,s.currency)} />
            <PdfRow label="BALANCE" value={fmt(calc.bal,s.currency)} bold />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helper components ─── */
function SumRow({ label, value, bold, accent, F }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"5px 0",fontSize:bold?(F?.subheader||13):(F?.body||12),fontWeight:bold?800:600,color:accent?"#C8102E":bold?"#1A1A1A":"#777",fontFamily:bold?"'Barlow Condensed',sans-serif":"'Barlow',sans-serif",textTransform:bold?"uppercase":"none" }}>
      <span>{label}</span><span style={{ fontWeight:800,fontSize:bold?(accent?(F?.subheader||14)+4:(F?.subheader||14)):(F?.body||12) }}>{value}</span>
    </div>
  );
}
function TaxRow({ label, rate, onRate, amount, currency, F }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0" }}>
      <span style={{ fontSize:F?.body||12,color:"#777",fontWeight:600 }}>{label}</span>
      <div style={{ display:"flex",alignItems:"center",gap:4 }}>
        <input type="number" min="0" max="100" step="0.01" value={rate} onChange={e => onRate(Math.max(0,Number(e.target.value)))}
          style={{ width:44,textAlign:"right",border:"1px solid #E5E5E5",borderRadius:3,padding:"3px 4px",fontSize:F?.small||11,fontFamily:"'Barlow',sans-serif",outline:"none",fontWeight:600 }} />
        <span style={{ fontSize:F?.small||10,color:"#AAA",fontWeight:600 }}>%</span>
        <span style={{ fontWeight:700,fontSize:F?.body||12,minWidth:70,textAlign:"right" }}>{fmt(amount,currency)}</span>
      </div>
    </div>
  );
}
function PdfRow({ label, value, bold }) {
  return <div style={{ display:"flex",justifyContent:"space-between",padding:"3px 0",fontWeight:bold?800:500,fontSize:bold?12:11,color:bold?"#1A1A1A":"#666" }}><span>{label}</span><span>{value}</span></div>;
}
