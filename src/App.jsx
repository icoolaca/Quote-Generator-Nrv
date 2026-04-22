import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   NERVAL QUOTATION GENERATOR v5
   ═══════════════════════════════════════════════════════════════ */

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().split("T")[0];
const fmt = (n, cur = "CAD") => new Intl.NumberFormat("en-CA", { style: "currency", currency: cur, minimumFractionDigits: 2 }).format(n);
const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AUD"];
const emptyItem = () => ({ id: uid(), itemNo: "", qty: 1, uom: "ea", description: "", netPrice: 0, image: null });
const emptyDrawing = () => ({ id: uid(), image: null, title: "", totalPrice: 0, notes: "", pins: [] });
const emptyPin = (xPct, yPct) => ({ id: uid(), xPct, yPct, main: "Spec Title", sub: "Details here" });

const DF = { header: 28, subheader: 14, body: 12, small: 10 };
const DC = { img: 15, itemNo: 12, qty: 6, uom: 6, desc: 30, netPrice: 10, extAmt: 10 };

const DEFAULT = {
  quoteNumber: "34130", date: today(), shipDate: "", currency: "CAD",
  preparedFor: { name: "Kanvi Homes", address: "# 101, 1290-91 Street NW", cityProv: "Edmonton, AB T6X 0P2" },
  shipTo: { name: "Kanvi Homes", address: "# 101, 1290-91 Street NW", cityProv: "Edmonton, AB T6X 0P2", phone: "780-439-9000", email: "" },
  customerNo: "Kan9-90", carrier: "BestWay", poNumber: "Element", eta: "SEE TERMS", fob: "NA", salesperson: "",
  items: [emptyItem()], drawings: [], freight: 0, gstRate: 5, pstRate: 0, deposit: 0,
  notes: "Prices valid for 30 days from date of your quote.",
  termsNotes: "Returns: Note that product returns are not accepted after 45 days. All returns must be accompanied by the original receipt. Product must be returned in original packaging.\nCustom orders and clearance/discontinued items are not returnable.\nCustom order delivery schedules may vary due to circumstances beyond our control. Orders may not be cancelled due to extended delivery projections.",
  showPrices: true, logo: null, fonts: { ...DF }, cols: { ...DC },
};

const SK = "nerval-quote-data", SVK = "nerval-saved-quotes";
const ld = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const loadPdf = () => new Promise(r => { if (window.html2pdf) return r(window.html2pdf); const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"; s.onload = () => r(window.html2pdf); document.head.appendChild(s); });

/* ─── Icons ─── */
const I = ({ d, size = 17, ...p }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d={d} /></svg>;
const Plus=p=><I d="M12 5v14M5 12h14" {...p}/>;
const Trash=p=><I d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-1 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6h10z" {...p}/>;
const DL=p=><I d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" {...p}/>;
const Prn=p=><I d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" {...p}/>;
const Pic=p=><I d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" {...p}/>;
const Sav=p=><I d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8" {...p}/>;
const Fld=p=><I d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" {...p}/>;
const X=p=><I d="M18 6L6 18M6 6l12 12" {...p}/>;
const Lay=p=><I d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" {...p}/>;
const Fil=p=><I d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" {...p}/>;
const Cpy=p=><I d="M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" {...p}/>;
const Gear=p=><I d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...p}/>;
const Pin=p=><I d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z" {...p}/>;
const ZI=p=><I d="M11 8v6M8 11h6M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" {...p}/>;
const ZO=p=><I d="M8 11h6M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" {...p}/>;
const Rst=p=><I d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" {...p}/>;
const Move=p=><I d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" {...p}/>;

/* ═══ DrawingCanvas with zoom/pan/draggable pins ═══ */
function DrawingCanvas({ drw, onAddPin, onUpdatePin, onRemovePin, onMovePin, editingPin, setEditingPin, F }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingPin, setDraggingPin] = useState(null);
  const didPanRef = useRef(false);
  const imgRef = useRef(null);

  // Trackpad pinch fires ctrlKey+wheel; mouse scroll fires plain wheel
  const handleWheel = e => {
    if (e.ctrlKey || e.metaKey) {
      // Pinch-to-zoom (trackpad) or Ctrl+scroll (mouse)
      e.preventDefault();
      setZoom(z => Math.max(0.25, Math.min(5, z + (e.deltaY > 0 ? -0.08 : 0.08))));
    } else {
      // Plain mouse scroll — also zoom
      e.preventDefault();
      setZoom(z => Math.max(0.25, Math.min(5, z + (e.deltaY > 0 ? -0.15 : 0.15))));
    }
  };

  const handleMouseDown = e => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault(); e.stopPropagation();
      setPanning(true); didPanRef.current = false;
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  const handleMouseMove = e => {
    if (panning) {
      didPanRef.current = true;
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    if (draggingPin) {
      e.preventDefault();
      const img = imgRef.current;
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      onMovePin(drw.id, draggingPin, xPct, yPct);
    }
  };
  const handleMouseUp = () => { setPanning(false); setDraggingPin(null); };

  const handleImgClick = e => {
    if (didPanRef.current || draggingPin) return;
    if (e.altKey) return; // don't place pin on alt+click
    const img = imgRef.current; if (!img) return;
    const rect = img.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    if (xPct >= 0 && xPct <= 100 && yPct >= 0 && yPct <= 100) onAddPin(drw.id, xPct, yPct);
  };

  const startPinDrag = (e, pinId) => { e.stopPropagation(); e.preventDefault(); setDraggingPin(pinId); setEditingPin(null); };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="nv-btn" style={{ padding: "4px 8px", fontSize: 10 }} onClick={() => setZoom(z => Math.min(5, z + 0.25))}><ZI size={12} /></button>
        <button className="nv-btn" style={{ padding: "4px 8px", fontSize: 10 }} onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}><ZO size={12} /></button>
        <button className="nv-btn" style={{ padding: "4px 8px", fontSize: 10 }} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Rst size={12} /></button>
        <span style={{ fontSize: 10, color: "#999", fontWeight: 600 }}>{Math.round(zoom * 100)}%</span>
        <span style={{ fontSize: 9, color: "#BBB", marginLeft: 4 }}>Scroll/pinch=zoom · Alt+drag=pan · Click=pin · Drag pin=move</span>
      </div>
      <div onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        style={{ width: "100%", height: 460, overflow: "hidden", borderRadius: 6, border: "1px solid #E5E5E5", background: "#F0F0F0", cursor: draggingPin ? "grabbing" : panning ? "grabbing" : "crosshair", position: "relative", touchAction: "none" }}>
        <div style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: "center center", position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <img ref={imgRef} src={drw.image} alt="" onClick={handleImgClick} style={{ maxWidth: "100%", maxHeight: 440, objectFit: "contain", display: "block", userSelect: "none" }} draggable={false} />
            {(drw.pins || []).map(pin => (
              <div key={pin.id} style={{ position: "absolute", left: `${pin.xPct}%`, top: `${pin.yPct}%`, zIndex: 10 }}>
                {/* Draggable pin dot */}
                <div onMouseDown={e => startPinDrag(e, pin.id)}
                  onClick={e => { e.stopPropagation(); if (!draggingPin) setEditingPin(editingPin === pin.id ? null : pin.id); }}
                  style={{ width: 22, height: 22, borderRadius: "50%", background: draggingPin === pin.id ? "#FFD700" : "#C8102E", border: "3px solid #FFF", boxShadow: "0 2px 8px rgba(0,0,0,.4)", cursor: draggingPin === pin.id ? "grabbing" : "grab", transform: "translate(-50%,-50%)", transition: draggingPin ? "none" : "transform .15s" }}
                  onMouseEnter={e => { if (!draggingPin) e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.3)"; }}
                  onMouseLeave={e => { if (!draggingPin) e.currentTarget.style.transform = "translate(-50%,-50%)"; }} />
                {/* Label */}
                <div style={{ position: "absolute", left: "50%", top: 16, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 11 }}>
                  <div style={{ background: "rgba(200,16,46,.92)", color: "#FFF", padding: "3px 8px", borderRadius: 4, fontSize: Math.max(9, F.small), fontWeight: 700, lineHeight: 1.2, boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>{pin.main}</div>
                  {pin.sub && <div style={{ background: "rgba(0,0,0,.75)", color: "#FFF", padding: "2px 6px", borderRadius: 3, fontSize: Math.max(7, F.small - 2), marginTop: 2, lineHeight: 1.2 }}>{pin.sub}</div>}
                </div>
                {editingPin === pin.id && (
                  <div style={{ position: "absolute", left: "50%", top: 55, transform: "translateX(-50%)", zIndex: 30, background: "#FFF", border: "1px solid #E5E5E5", borderRadius: 8, padding: 12, width: 220, boxShadow: "0 8px 24px rgba(0,0,0,.2)", pointerEvents: "auto" }} onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#C8102E", marginBottom: 6 }}>Edit Pin <span style={{ color: "#999", fontWeight: 400 }}>(drag dot to move)</span></div>
                    <input value={pin.main} onChange={e => onUpdatePin(drw.id, pin.id, "main", e.target.value)} placeholder="Main text" style={{ width: "100%", padding: "6px 8px", border: "1px solid #D4D4D4", borderRadius: 4, fontSize: F.body, fontFamily: "'Barlow',sans-serif", marginBottom: 6, outline: "none", boxSizing: "border-box", fontWeight: 700 }} />
                    <input value={pin.sub} onChange={e => onUpdatePin(drw.id, pin.id, "sub", e.target.value)} placeholder="Sub text / specs" style={{ width: "100%", padding: "5px 8px", border: "1px solid #D4D4D4", borderRadius: 4, fontSize: F.small, fontFamily: "'Barlow',sans-serif", marginBottom: 8, outline: "none", boxSizing: "border-box", color: "#666" }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="nv-btn" style={{ flex: 1, padding: "4px 8px", fontSize: 9, justifyContent: "center" }} onClick={() => setEditingPin(null)}>Done</button>
                      <button className="nv-btn" style={{ padding: "4px 8px", fontSize: 9, color: "#C8102E" }} onClick={() => onRemovePin(drw.id, pin.id)}><Trash size={10} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 14, right: 14, background: "rgba(0,0,0,.55)", color: "#FFF", padding: "4px 10px", borderRadius: 4, fontSize: 9, fontWeight: 600, pointerEvents: "none" }}><Pin size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} /> Click=pin · Drag=move</div>
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function App() {
  const [s, setS] = useState(() => { const d = ld(SK); return d ? { ...DEFAULT, ...d, fonts: { ...DF, ...(d.fonts || {}) }, cols: { ...DC, ...(d.cols || {}) } } : DEFAULT; });
  const [savedList, setSavedList] = useState(() => ld(SVK) || []);
  const [panel, setPanel] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("items");
  const [editingPin, setEditingPin] = useState(null);
  const [resizing, setResizing] = useState(null);
  const printRef = useRef(null);
  const fileRefs = useRef({});
  const drawingRefs = useRef({});
  const tableRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => sv(SK, s), 500); return () => clearTimeout(t); }, [s]);
  const flash = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const F = s.fonts || DF;
  const C = s.cols || DC;

  const set = useCallback((path, val) => { setS(prev => { const n = JSON.parse(JSON.stringify(prev)); const k = path.split("."); let o = n; for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = val; return n; }); }, []);
  const updateItem = useCallback((id, f, v) => setS(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, [f]: v } : i) })), []);
  const updateDrawing = useCallback((id, f, v) => setS(p => ({ ...p, drawings: p.drawings.map(d => d.id === id ? { ...d, [f]: v } : d) })), []);
  const addItem = () => setS(p => ({ ...p, items: [...p.items, emptyItem()] }));
  const removeItem = id => setS(p => ({ ...p, items: p.items.length > 1 ? p.items.filter(i => i.id !== id) : p.items }));
  const dupItem = id => setS(p => { const i = p.items.findIndex(x => x.id === id); if (i < 0) return p; const c = { ...p.items[i], id: uid() }; const a = [...p.items]; a.splice(i + 1, 0, c); return { ...p, items: a }; });
  const addDrawing = () => setS(p => ({ ...p, drawings: [...p.drawings, emptyDrawing()] }));
  const removeDrawing = id => setS(p => ({ ...p, drawings: p.drawings.filter(d => d.id !== id) }));

  const readFile = file => new Promise(r => { const fr = new FileReader(); fr.onload = e => r(e.target.result); fr.readAsDataURL(file); });
  const handleFile = async (rm, id, f, file) => { if (!file) return; const d = await readFile(file); if (f === "logo") set("logo", d); else if (rm === "item") updateItem(id, f, d); else updateDrawing(id, f, d); };
  const handleDrop = (e, rm, id, f) => { e.preventDefault(); const fi = e.dataTransfer.files[0]; if (fi?.type.startsWith("image/")) handleFile(rm, id, f, fi); };
  const handlePaste = useCallback((rm, id, f) => e => { const it = e.clipboardData?.items; if (!it) return; for (let i = 0; i < it.length; i++) { if (it[i].type.startsWith("image/")) { e.preventDefault(); handleFile(rm, id, f, it[i].getAsFile()); return; } } }, []);

  const addPin = (did, x, y) => setS(p => ({ ...p, drawings: p.drawings.map(d => d.id === did ? { ...d, pins: [...(d.pins || []), emptyPin(x, y)] } : d) }));
  const updatePin = (did, pid, f, v) => setS(p => ({ ...p, drawings: p.drawings.map(d => d.id === did ? { ...d, pins: (d.pins || []).map(p2 => p2.id === pid ? { ...p2, [f]: v } : p2) } : d) }));
  const removePin = (did, pid) => { setS(p => ({ ...p, drawings: p.drawings.map(d => d.id === did ? { ...d, pins: (d.pins || []).filter(p2 => p2.id !== pid) } : d) })); setEditingPin(null); };
  const movePin = (did, pid, x, y) => setS(p => ({ ...p, drawings: p.drawings.map(d => d.id === did ? { ...d, pins: (d.pins || []).map(p2 => p2.id === pid ? { ...p2, xPct: x, yPct: y } : p2) } : d) }));

  const calc = useMemo(() => {
    const iS = s.items.reduce((a, i) => a + i.qty * i.netPrice, 0);
    const dS = s.drawings.reduce((a, d) => a + (d.totalPrice || 0), 0);
    const sub = iS + dS, fr = Number(s.freight) || 0;
    const gst = (sub + fr) * (s.gstRate / 100), pst = (sub + fr) * (s.pstRate / 100);
    const total = sub + fr + gst + pst, bal = total - (Number(s.deposit) || 0);
    return { iS, dS, sub, fr, gst, pst, total, bal };
  }, [s.items, s.drawings, s.freight, s.gstRate, s.pstRate, s.deposit]);

  const saveQ = () => { const e = { id: uid(), name: `${s.preparedFor.name} — #${s.quoteNumber}`, date: s.date, data: s }; const u = [e, ...savedList.slice(0, 49)]; setSavedList(u); sv(SVK, u); flash("Saved!"); };
  const loadQ = q => { setS({ ...DEFAULT, ...q.data, fonts: { ...DF, ...(q.data.fonts || {}) }, cols: { ...DC, ...(q.data.cols || {}) } }); setPanel(null); flash("Loaded!"); };
  const delQ = id => { const u = savedList.filter(q => q.id !== id); setSavedList(u); sv(SVK, u); };
  const newQ = () => { setS({ ...DEFAULT, quoteNumber: String(Math.floor(Math.random() * 90000) + 10000), items: [emptyItem()], drawings: [] }); flash("New quote!"); };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const h = await loadPdf(); const el = printRef.current;
      el.style.position = "absolute"; el.style.left = "0"; el.style.top = "0"; el.style.zIndex = "-1"; el.style.opacity = "1";
      await h().set({ margin: [6, 6, 6, 6], filename: `Quote-${s.quoteNumber}.pdf`, image: { type: "jpeg", quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, allowTaint: true, scrollY: 0 }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }, pagebreak: { mode: ["avoid-all", "css", "legacy"] } }).from(el).save();
      el.style.position = "fixed"; el.style.left = "-9999px"; el.style.zIndex = ""; flash("PDF exported!");
    } catch (e) { console.error(e); if (printRef.current) { printRef.current.style.position = "fixed"; printRef.current.style.left = "-9999px"; } flash("Export failed"); }
    setExporting(false);
  };
  const doPrint = () => { const el = printRef.current; el.style.position = "absolute"; el.style.left = "0"; el.style.top = "0"; el.style.zIndex = "9999"; el.style.opacity = "1"; setTimeout(() => { window.print(); el.style.position = "fixed"; el.style.left = "-9999px"; el.style.zIndex = ""; }, 100); };

  const gridCols = useMemo(() => `3% ${C.img}% ${C.itemNo}% ${C.qty}% ${C.uom}% ${C.desc}%` + (s.showPrices ? ` ${C.netPrice}% ${C.extAmt}%` : '') + ' 5%', [C, s.showPrices]);
  const colDefs = useMemo(() => { const b = [{ k: 'img', l: 'Img' }, { k: 'itemNo', l: 'Item No' }, { k: 'qty', l: 'Qty' }, { k: 'uom', l: 'UOM' }, { k: 'desc', l: 'Description' }]; if (s.showPrices) { b.push({ k: 'netPrice', l: 'Net Price' }, { k: 'extAmt', l: 'Ext Amt' }); } return b; }, [s.showPrices]);

  const handleResizeStart = (ck, e) => {
    e.preventDefault(); const sx = e.clientX, sv2 = C[ck], tw = tableRef.current?.offsetWidth || 1000, pp = tw / 100;
    const onM = ev => { const np = Math.max(3, Math.min(50, sv2 + (ev.clientX - sx) / pp)); set(`cols.${ck}`, Math.round(np * 10) / 10); };
    const onU = () => { document.removeEventListener('mousemove', onM); document.removeEventListener('mouseup', onU); setResizing(null); };
    setResizing(ck); document.addEventListener('mousemove', onM); document.addEventListener('mouseup', onU);
  };

  const Inp = ({ label, value, onChange, type = "text", placeholder, small }) => (
    <div>
      {label && <label style={{ display: "block", fontSize: F.small, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#888", marginBottom: 4 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: small ? "6px 8px" : "8px 10px", border: "1px solid #D4D4D4", borderRadius: 4, fontSize: small ? F.small : F.body, fontFamily: "'Barlow',sans-serif", color: "#1A1A1A", background: "#FFF", outline: "none", boxSizing: "border-box" }} onFocus={e => { e.target.style.borderColor = "#C8102E"; }} onBlur={e => { e.target.style.borderColor = "#D4D4D4"; }} />
    </div>
  );
  const FS = ({ label, path, min, max }) => <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 10, fontWeight: 700, width: 72, color: "#888", textTransform: "uppercase" }}>{label}</span><input type="range" min={min} max={max} value={s.fonts?.[path] || DF[path]} onChange={e => set(`fonts.${path}`, Number(e.target.value))} style={{ flex: 1, accentColor: "#C8102E" }} /><span style={{ fontSize: 11, fontWeight: 700, width: 28, textAlign: "right" }}>{s.fonts?.[path] || DF[path]}px</span></div>;
  const CS = ({ label, path, min, max }) => <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><span style={{ fontSize: 10, fontWeight: 700, width: 72, color: "#888", textTransform: "uppercase" }}>{label}</span><input type="range" min={min} max={max} step="0.5" value={s.cols?.[path] || DC[path]} onChange={e => set(`cols.${path}`, Number(e.target.value))} style={{ flex: 1, accentColor: "#C8102E" }} /><span style={{ fontSize: 11, fontWeight: 700, width: 32, textAlign: "right" }}>{s.cols?.[path] || DC[path]}%</span></div>;

  /* ═══ RENDER ═══ */
  return (
    <div style={{ fontFamily: "'Barlow',sans-serif", background: "#F0F0F0", minHeight: "100vh", color: "#1A1A1A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Barlow+Condensed:wght@600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{margin:0}
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
        .col-resizer{position:absolute;right:-3px;top:0;bottom:0;width:6px;cursor:col-resize;z-index:5;background:transparent;transition:background .15s}
        .col-resizer:hover,.col-resizer.active{background:rgba(255,255,255,.4)}
        /* Visible input borders in table cells */
        .nv-cell-input{width:100%;border:1px solid #E8E8E8;background:#FFF;border-radius:3px;font-family:'Barlow',sans-serif;outline:none;transition:border-color .15s;box-sizing:border-box}
        .nv-cell-input:focus{border-color:#C8102E!important;box-shadow:0 0 0 2px rgba(200,16,46,.08)}
        .nv-cell-input:hover{border-color:#CCC}
        /* Auto-grow textarea */
        .nv-auto-grow{overflow:hidden;resize:none;min-height:32px;field-sizing:content}
        /* Header column vertical dividers */
        .nv-hdr-cell{border-right:1px solid rgba(255,255,255,.2);position:relative;user-select:none}
        .nv-table-scroll{overflow-x:auto;overflow-y:visible}
        .nv-table-scroll::-webkit-scrollbar{height:6px}
        .nv-table-scroll::-webkit-scrollbar-track{background:#F0F0F0;border-radius:3px}
        .nv-table-scroll::-webkit-scrollbar-thumb{background:#CCC;border-radius:3px}
        .nv-table-scroll::-webkit-scrollbar-thumb:hover{background:#999}
        /* Mobile: stack items as cards */
        @media(max-width:768px){
          .nv-resp-2{grid-template-columns:1fr!important}
          .nv-resp-5{grid-template-columns:1fr 1fr!important}
          .nv-topbar-actions{flex-wrap:wrap;justify-content:center}
          .nv-mobile-card{display:flex!important;flex-direction:column!important;padding:12px!important;gap:8px!important;grid-template-columns:unset!important}
          .nv-mobile-card>*{width:100%!important;min-width:0!important}
          .nv-desk-header{display:none!important}
        }
        @media(min-width:769px){.nv-mob-only{display:none!important}}
        @media print{.no-print{display:none!important}body{background:#fff!important}}
      `}</style>

      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#2D2D2D", color: "#FFF", padding: "10px 28px", borderRadius: 6, fontSize: 13, fontWeight: 700, boxShadow: "0 8px 32px rgba(0,0,0,.25)", animation: "toastPop .3s ease-out", borderLeft: "4px solid #C8102E" }}>{toast}</div>}

      {/* TOP BAR */}
      <div className="no-print" style={{ background: "#FFF", borderBottom: "3px solid #C8102E", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#C8102E", color: "#FFF", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, padding: "3px 10px", borderRadius: 2 }}>N</div>
          <div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>NERVAL</div><div style={{ fontSize: 8, color: "#AAA", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase" }}>Quotation System</div></div>
        </div>
        <div className="nv-topbar-actions" style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 6px", borderRight: "1px solid #E5E5E5", marginRight: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: s.showPrices ? "#333" : "#C8102E" }}>{s.showPrices ? "Prices" : "Hidden"}</span>
            <button className={`nv-toggle ${s.showPrices ? "on" : ""}`} onClick={() => set("showPrices", !s.showPrices)} />
          </div>
          <button className="nv-btn" onClick={newQ}><Plus size={13} /></button>
          <button className="nv-btn" onClick={saveQ}><Sav size={13} /></button>
          <button className="nv-btn" onClick={() => setPanel(panel === "saved" ? null : "saved")}><Fld size={13} /></button>
          <button className="nv-btn" onClick={() => setPanel(panel === "settings" ? null : "settings")}><Gear size={13} /></button>
          <button className="nv-btn" onClick={doPrint}><Prn size={13} /></button>
          <button className="nv-btn nv-btn-red" onClick={exportPDF} disabled={exporting}><DL size={13} /> {exporting ? "…" : "PDF"}</button>
        </div>
      </div>

      {/* PANELS */}
      {panel && <div className="no-print" onClick={() => setPanel(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 150 }} />}
      {panel === "settings" && (
        <div className="no-print" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 400, maxWidth: "92vw", background: "#FFF", zIndex: 200, overflowY: "auto", padding: 24, animation: "slideIn .25s ease-out", boxShadow: "-8px 0 40px rgba(0,0,0,.15)", borderLeft: "3px solid #C8102E" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, textTransform: "uppercase" }}>Settings</h3><button className="nv-btn" style={{ padding: "4px 8px" }} onClick={() => setPanel(null)}><X size={14} /></button></div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 10 }}>Font Sizes</div>
          <FS label="Header" path="header" min={18} max={42} /><FS label="Subheader" path="subheader" min={10} max={22} /><FS label="Body" path="body" min={9} max={18} /><FS label="Small" path="small" min={7} max={14} />
          <button className="nv-btn" style={{ marginBottom: 20, fontSize: 10 }} onClick={() => set("fonts", { ...DF })}>Reset Fonts</button>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 10, marginTop: 10 }}>Column Widths (%)</div>
          <p style={{ fontSize: 10, color: "#999", marginBottom: 10 }}>Drag header dividers or use sliders. Table scrolls horizontally if columns exceed width.</p>
          <CS label="Image" path="img" min={5} max={30} /><CS label="Item No" path="itemNo" min={5} max={25} /><CS label="Qty" path="qty" min={3} max={15} /><CS label="UOM" path="uom" min={3} max={15} /><CS label="Description" path="desc" min={10} max={50} />
          {s.showPrices && <><CS label="Net Price" path="netPrice" min={5} max={20} /><CS label="Ext Amt" path="extAmt" min={5} max={20} /></>}
          <button className="nv-btn" style={{ fontSize: 10 }} onClick={() => set("cols", { ...DC })}>Reset Columns</button>
        </div>
      )}
      {panel === "saved" && (
        <div className="no-print" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 380, maxWidth: "92vw", background: "#FFF", zIndex: 200, overflowY: "auto", padding: 24, animation: "slideIn .25s ease-out", boxShadow: "-8px 0 40px rgba(0,0,0,.15)", borderLeft: "3px solid #C8102E" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, textTransform: "uppercase" }}>Saved</h3><button className="nv-btn" style={{ padding: "4px 8px" }} onClick={() => setPanel(null)}><X size={14} /></button></div>
          {savedList.length === 0 ? <p style={{ color: "#999", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No saved quotes.</p> :
            savedList.map(q => <div key={q.id} style={{ padding: 14, border: "1px solid #E5E5E5", borderRadius: 6, marginBottom: 8, cursor: "pointer", borderLeft: "3px solid transparent", transition: "all .2s" }} onClick={() => loadQ(q)} onMouseEnter={e => { e.currentTarget.style.borderLeftColor = "#C8102E"; e.currentTarget.style.background = "#FEF9F9"; }} onMouseLeave={e => { e.currentTarget.style.borderLeftColor = "transparent"; e.currentTarget.style.background = "#FFF"; }}><div style={{ fontWeight: 700, fontSize: 13 }}>{q.name}</div><div style={{ fontSize: 11, color: "#999", display: "flex", justifyContent: "space-between", marginTop: 4 }}><span>{q.date}</span><button style={{ background: "none", border: "none", color: "#C8102E", cursor: "pointer", fontSize: 11, fontWeight: 700 }} onClick={e => { e.stopPropagation(); delQ(q.id); }}>Delete</button></div></div>)}
        </div>
      )}

      {/* MAIN */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 12px 80px" }} className="no-print">
        {/* HEADER CARD */}
        <div className="nv-card" style={{ background: "#FFF", borderRadius: 6, overflow: "hidden", marginBottom: 16, border: "1px solid #E0E0E0" }}>
          <div style={{ background: "#C8102E", color: "#FFF", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ cursor: "pointer" }}>{s.logo ? <div style={{ position: "relative" }}><img src={s.logo} alt="" style={{ maxHeight: 36, borderRadius: 3 }} /><button onClick={e => { e.preventDefault(); set("logo", null); }} style={{ position: "absolute", top: -5, right: -5, width: 14, height: 14, borderRadius: "50%", background: "#000", color: "#FFF", border: "none", cursor: "pointer", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button></div> : <div style={{ border: "2px dashed rgba(255,255,255,.4)", borderRadius: 4, padding: "5px 12px", fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, opacity: .8 }}><Pic size={12} /> Logo</div>}<input type="file" accept="image/*" hidden onChange={e => handleFile(null, null, "logo", e.target.files[0])} /></label>
              <div style={{ fontSize: 9, opacity: .7, lineHeight: 1.5 }}><div>Tel: 780-452-1111 · Fax: 780-452-5775</div><div>1001 Buckingham Dr | Sherwood Park, AB | T8H 0X5</div></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: F.header, letterSpacing: ".08em", lineHeight: 1 }}>QUOTATION</div>
              <div style={{ display: "flex", gap: 10, fontSize: F.body, fontWeight: 600, marginTop: 4, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>Quote: <input value={s.quoteNumber} onChange={e => set("quoteNumber", e.target.value)} style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 3, color: "#FFF", padding: "2px 6px", fontFamily: "'Barlow',sans-serif", fontSize: F.subheader, fontWeight: 800, width: 72, outline: "none" }} /></span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>Date: <input type="date" value={s.date} onChange={e => set("date", e.target.value)} style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 3, color: "#FFF", padding: "2px 5px", fontFamily: "'Barlow',sans-serif", fontSize: F.body, fontWeight: 600, outline: "none", colorScheme: "dark" }} /></span>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }} className="nv-resp-2">
            <div style={{ padding: "14px 20px", borderRight: "1px solid #E5E5E5", borderBottom: "1px solid #E5E5E5" }}>
              <div style={{ fontSize: F.small, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 8, background: "#F7F7F7", padding: "3px 8px", display: "inline-block", borderRadius: 2 }}>Prepared For:</div>
              <Inp label="Name" value={s.preparedFor.name} onChange={v => set("preparedFor.name", v)} small /><div style={{ height: 5 }} /><Inp label="Address" value={s.preparedFor.address} onChange={v => set("preparedFor.address", v)} small /><div style={{ height: 5 }} /><Inp label="City/Prov/Postal" value={s.preparedFor.cityProv} onChange={v => set("preparedFor.cityProv", v)} small />
            </div>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E5E5" }}>
              <div style={{ fontSize: F.small, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 8, background: "#F7F7F7", padding: "3px 8px", display: "inline-block", borderRadius: 2 }}>Ship To:</div>
              <Inp label="Name" value={s.shipTo.name} onChange={v => set("shipTo.name", v)} small /><div style={{ height: 5 }} /><Inp label="Address" value={s.shipTo.address} onChange={v => set("shipTo.address", v)} small /><div style={{ height: 5 }} /><Inp label="City/Prov/Postal" value={s.shipTo.cityProv} onChange={v => set("shipTo.cityProv", v)} small /><div style={{ height: 5 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }} className="nv-resp-2"><Inp label="Phone" value={s.shipTo.phone} onChange={v => set("shipTo.phone", v)} small /><Inp label="Email" value={s.shipTo.email} onChange={v => set("shipTo.email", v)} small /></div>
            </div>
          </div>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", fontSize: F.small, fontWeight: 800, textTransform: "uppercase", color: "#FFF", background: "#C8102E" }} className="nv-resp-5">{["Customer #", "Carrier", "PO #", "Ship Date", "Salesperson"].map(h => <div key={h} style={{ padding: "5px 10px", borderRight: "1px solid rgba(255,255,255,.15)" }}>{h}</div>)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", background: "#FAFAFA" }} className="nv-resp-5">{[{ v: s.customerNo, k: "customerNo" }, { v: s.carrier, k: "carrier" }, { v: s.poNumber, k: "poNumber" }, { v: s.shipDate, k: "shipDate", type: "date" }, { v: s.salesperson, k: "salesperson" }].map(f => <div key={f.k} style={{ padding: "3px 8px", borderRight: "1px solid #E5E5E5" }}><input type={f.type || "text"} value={f.v} onChange={e => set(f.k, e.target.value)} style={{ width: "100%", border: "none", background: "transparent", fontSize: F.body, fontFamily: "'Barlow',sans-serif", fontWeight: 500, color: "#333", outline: "none", padding: "3px 0" }} /></div>)}</div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 2 }}>
          {[{ k: "items", i: <Fil size={12} />, l: `Items (${s.items.length})` }, { k: "drawings", i: <Lay size={12} />, l: `Drawings (${s.drawings.length})` }].map(t => <button key={t.k} className={`nv-btn ${tab === t.k ? "nv-btn-dark" : ""}`} onClick={() => setTab(t.k)} style={{ borderRadius: "6px 6px 0 0", borderBottom: tab === t.k ? "2px solid #2D2D2D" : "1px solid #D4D4D4", fontSize: 10 }}>{t.i} {t.l}</button>)}
        </div>

        {/* ITEMS TABLE — horizontal scroll wrapper */}
        {tab === "items" && (
          <div ref={tableRef} className="nv-card" style={{ background: "#FFF", borderRadius: "0 6px 6px 6px", border: "1px solid #E0E0E0", marginBottom: 16 }}>
            <div className="nv-table-scroll">
              <div style={{ minWidth: 700 }}>
                {/* Header */}
                <div className="nv-desk-header" style={{ display: "grid", gridTemplateColumns: gridCols, background: "#C8102E", color: "#FFF", fontSize: Math.max(8, F.small - 1), fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", position: "sticky", top: 0, zIndex: 2 }}>
                  <div className="nv-hdr-cell" style={{ padding: "8px 4px", textAlign: "center" }}>LN</div>
                  {colDefs.map(c => <div key={c.k} className="nv-hdr-cell" style={{ padding: "8px 6px", textAlign: c.k === 'netPrice' || c.k === 'extAmt' ? 'right' : 'left' }}>{c.l}<div className={`col-resizer ${resizing === c.k ? 'active' : ''}`} onMouseDown={e => handleResizeStart(c.k, e)} /></div>)}
                  <div className="nv-hdr-cell" style={{ borderRight: "none" }}></div>
                </div>
                {/* Rows */}
                {s.items.map((item, idx) => {
                  const hasImg = !!item.image;
                  return (
                    <div key={item.id} className="nv-row nv-mobile-card" style={{ display: "grid", gridTemplateColumns: gridCols, borderBottom: "1px solid #F0F0F0", background: idx % 2 === 0 ? "#FFF" : "#FAFAFA", alignItems: "stretch" }}>
                      {/* Mobile label helper */}
                      <div style={{ padding: "8px 4px", textAlign: "center", fontSize: F.body, color: "#BBB", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{idx + 1}</div>
                      {/* Image */}
                      <div style={{ padding: 4, display: "flex", alignItems: "flex-start" }} tabIndex={0} onPaste={handlePaste("item", item.id, "image")}>
                        <div className="nv-drop" onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("over"); }} onDragLeave={e => e.currentTarget.classList.remove("over")} onDrop={e => { e.currentTarget.classList.remove("over"); handleDrop(e, "item", item.id, "image"); }} onClick={() => fileRefs.current[item.id]?.click()}
                          style={{ width: "100%", minHeight: hasImg ? 80 : 36, borderRadius: 4, overflow: "hidden", border: hasImg ? "1px solid #E5E5E5" : "1.5px dashed #D4D4D4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: hasImg ? "#FAFAFA" : "#F9F9F9" }}>
                          {hasImg ? <div style={{ position: "relative", width: "100%" }}><img src={item.image} alt="" style={{ width: "100%", objectFit: "contain", display: "block" }} /><button onClick={e => { e.stopPropagation(); updateItem(item.id, "image", null); }} style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,.6)", color: "#FFF", border: "none", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button></div> : <div style={{ textAlign: "center", color: "#D4D4D4", padding: 2 }}><Pic size={12} /><div style={{ fontSize: 7 }}>Paste</div></div>}
                          <input ref={el => { fileRefs.current[item.id] = el; }} type="file" accept="image/*" hidden onChange={e => handleFile("item", item.id, "image", e.target.files[0])} />
                        </div>
                      </div>
                      <div style={{ padding: "6px", display: "flex", alignItems: "flex-start" }}><input value={item.itemNo} onChange={e => updateItem(item.id, "itemNo", e.target.value)} placeholder="SKU" className="nv-cell-input" style={{ fontSize: F.body, fontWeight: 600, padding: "5px 6px" }} /><span className="nv-mob-only" style={{ fontSize: 9, color: "#BBB", fontWeight: 700 }}>ITEM NO</span></div>
                      <div style={{ padding: "6px 2px", display: "flex", alignItems: "flex-start" }}><input type="number" min="0" value={item.qty} onChange={e => updateItem(item.id, "qty", Math.max(0, Number(e.target.value)))} className="nv-cell-input" style={{ fontSize: F.body, textAlign: "center", fontWeight: 700, padding: "5px 4px" }} /></div>
                      <div style={{ padding: "6px 2px", display: "flex", alignItems: "flex-start" }}><select value={item.uom} onChange={e => updateItem(item.id, "uom", e.target.value)} className="nv-cell-input" style={{ fontSize: F.small, cursor: "pointer", color: "#777", padding: "5px 2px" }}>{["ea", "ft", "sq ft", "ln ft", "set", "lot", "hr"].map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                      <div style={{ padding: "4px 6px", display: "flex", alignItems: "flex-start" }}><textarea value={item.description} onChange={e => { updateItem(item.id, "description", e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} onFocus={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder="Description..." className="nv-cell-input nv-auto-grow" style={{ fontSize: F.body, lineHeight: 1.4, padding: "5px 6px" }} /></div>
                      {s.showPrices && <div style={{ padding: "6px", display: "flex", alignItems: "flex-start" }}><input type="number" min="0" step="0.01" value={item.netPrice} onChange={e => updateItem(item.id, "netPrice", Math.max(0, Number(e.target.value)))} className="nv-cell-input" style={{ fontSize: F.body, textAlign: "right", fontWeight: 700, padding: "5px 6px" }} /></div>}
                      {s.showPrices && <div style={{ padding: "8px 6px", textAlign: "right", fontSize: F.body, fontWeight: 800, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>{fmt(item.qty * item.netPrice, s.currency)}</div>}
                      <div style={{ display: "flex", gap: 1, alignItems: "flex-start", justifyContent: "center", paddingTop: 8 }}>
                        <button onClick={() => dupItem(item.id)} title="Duplicate" style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D4D4", padding: 2 }} onMouseEnter={e => { e.currentTarget.style.color = "#2D2D2D"; }} onMouseLeave={e => { e.currentTarget.style.color = "#D4D4D4"; }}><Cpy size={11} /></button>
                        <button onClick={() => removeItem(item.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D4D4", padding: 2 }} onMouseEnter={e => { e.currentTarget.style.color = "#C8102E"; }} onMouseLeave={e => { e.currentTarget.style.color = "#D4D4D4"; }}><Trash size={11} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: "8px 14px", borderTop: "1px solid #F0F0F0" }}><button className="nv-btn" onClick={addItem} style={{ fontSize: 10 }}><Plus size={11} /> Add Item</button></div>
          </div>
        )}

        {/* DRAWINGS */}
        {tab === "drawings" && (
          <div className="nv-card" style={{ background: "#FFF", borderRadius: "0 6px 6px 6px", border: "1px solid #E0E0E0", padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: F.body, color: "#999", marginBottom: 14, lineHeight: 1.5 }}><strong>Scroll</strong>=zoom · <strong>Alt+drag</strong>=pan · <strong>Click</strong>=pin · <strong>Drag pin</strong>=move</p>
            {s.drawings.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "#D4D4D4" }}><Lay size={44} /><div style={{ marginTop: 12, fontSize: F.subheader, fontWeight: 700, color: "#BBB" }}>No drawings yet</div></div>}
            {s.drawings.map((drw, idx) => (
              <div key={drw.id} style={{ border: "1px solid #E5E5E5", borderRadius: 8, overflow: "visible", marginBottom: 14, borderLeft: "4px solid #C8102E" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: F.subheader, color: "#C8102E", textTransform: "uppercase" }}>Drawing #{idx + 1}</div>
                  <button onClick={() => removeDrawing(drw.id)} className="nv-btn" style={{ padding: "3px 8px", fontSize: 9 }}><Trash size={11} /> Remove</button>
                </div>
                <div style={{ padding: 14 }}>
                  <div tabIndex={0} onPaste={handlePaste("drawing", drw.id, "image")}>
                    {drw.image ? <DrawingCanvas drw={drw} onAddPin={addPin} onUpdatePin={updatePin} onRemovePin={removePin} onMovePin={movePin} editingPin={editingPin} setEditingPin={setEditingPin} F={F} />
                      : <div className="nv-drop" onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("over"); }} onDragLeave={e => e.currentTarget.classList.remove("over")} onDrop={e => { e.currentTarget.classList.remove("over"); handleDrop(e, "drawing", drw.id, "image"); }} onClick={() => drawingRefs.current[drw.id]?.click()} style={{ minHeight: 180, borderRadius: 6, border: "2px dashed #D4D4D4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#F9F9F9" }}><div style={{ textAlign: "center", color: "#CCC", padding: 16 }}><Pic size={36} /><div style={{ fontSize: F.body, fontWeight: 700, marginTop: 8, color: "#BBB" }}>Drop, click, or Ctrl+V</div></div></div>}
                    <input ref={el => { drawingRefs.current[drw.id] = el; }} type="file" accept="image/*" hidden onChange={e => handleFile("drawing", drw.id, "image", e.target.files[0])} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }} className="nv-resp-2">
                    <Inp label="Title / Room" value={drw.title} onChange={v => updateDrawing(drw.id, "title", v)} placeholder="Kitchen Plan" />
                    <div><label style={{ display: "block", fontSize: F.small, fontWeight: 700, textTransform: "uppercase", color: "#888", marginBottom: 4 }}>Total Price</label><input type="number" min="0" step="0.01" value={drw.totalPrice} onChange={e => updateDrawing(drw.id, "totalPrice", Math.max(0, Number(e.target.value)))} style={{ width: "100%", padding: "7px 8px", border: "1px solid #D4D4D4", borderRadius: 4, fontSize: F.subheader, fontFamily: "'Barlow',sans-serif", fontWeight: 700, outline: "none", boxSizing: "border-box" }} /><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: F.header * 0.7, color: "#C8102E", marginTop: 3 }}>{fmt(drw.totalPrice || 0, s.currency)}</div></div>
                    <div><label style={{ display: "block", fontSize: F.small, fontWeight: 700, textTransform: "uppercase", color: "#888", marginBottom: 4 }}>Notes</label><textarea value={drw.notes} onChange={e => updateDrawing(drw.id, "notes", e.target.value)} placeholder="Waterfall edge..." rows={3} style={{ width: "100%", padding: "7px 8px", border: "1px solid #D4D4D4", borderRadius: 4, fontSize: F.body, fontFamily: "'Barlow',sans-serif", color: "#555", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.4 }} /></div>
                  </div>
                  {(drw.pins || []).length > 0 && <div style={{ marginTop: 10, padding: "8px 10px", background: "#F9F9F9", borderRadius: 6, border: "1px solid #F0F0F0" }}><div style={{ fontSize: F.small, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 4 }}>{(drw.pins || []).length} Pin{(drw.pins || []).length > 1 ? "s" : ""}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{(drw.pins || []).map(p => <div key={p.id} style={{ background: "#FFF", border: "1px solid #E5E5E5", borderRadius: 4, padding: "3px 6px", fontSize: F.small, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }} onClick={() => setEditingPin(editingPin === p.id ? null : p.id)}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#C8102E" }} /><span style={{ fontWeight: 700 }}>{p.main}</span><span style={{ color: "#999" }}>— {p.sub}</span></div>)}</div></div>}
                </div>
              </div>
            ))}
            <button className="nv-btn nv-btn-red" onClick={addDrawing} style={{ marginTop: 6 }}><Plus size={12} /> Add Drawing</button>
          </div>
        )}

        {/* SUMMARY */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 }} className="nv-resp-2">
          <div className="nv-card" style={{ background: "#FFF", borderRadius: 6, border: "1px solid #E0E0E0", padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="nv-resp-2">
              <div><div style={{ fontSize: F.small, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 6 }}>Note:</div><textarea value={s.notes} onChange={e => set("notes", e.target.value)} rows={3} style={{ width: "100%", padding: "7px 8px", border: "1px solid #D4D4D4", borderRadius: 4, fontSize: F.body, fontFamily: "'Barlow',sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.4 }} /></div>
              <div><div style={{ fontSize: F.small, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 6 }}>Terms:</div><textarea value={s.termsNotes} onChange={e => set("termsNotes", e.target.value)} rows={3} style={{ width: "100%", padding: "7px 8px", border: "1px solid #D4D4D4", borderRadius: 4, fontSize: F.small, fontFamily: "'Barlow',sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", color: "#777", lineHeight: 1.4 }} /></div>
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}><label style={{ fontSize: F.small, fontWeight: 700, textTransform: "uppercase", color: "#888" }}>Currency</label><select value={s.currency} onChange={e => set("currency", e.target.value)} style={{ border: "1px solid #D4D4D4", borderRadius: 3, padding: "2px 6px", fontSize: F.body, fontFamily: "'Barlow',sans-serif", outline: "none", cursor: "pointer", fontWeight: 600 }}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="nv-card nv-red-stripe" style={{ background: "#FFF", borderRadius: 6, border: "1px solid #E0E0E0", padding: "16px 16px 16px 22px", alignSelf: "flex-start" }}>
            {calc.dS > 0 && <SR l="Drawings" v={fmt(calc.dS, s.currency)} F={F} />}{calc.iS > 0 && <SR l="Items" v={fmt(calc.iS, s.currency)} F={F} />}<SR l="SUBTOTAL" v={fmt(calc.sub, s.currency)} b F={F} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}><span style={{ fontSize: F.body, color: "#777", fontWeight: 600 }}>FREIGHT</span><input type="number" min="0" step="0.01" value={s.freight} onChange={e => set("freight", Math.max(0, Number(e.target.value)))} style={{ width: 80, textAlign: "right", border: "1px solid #E5E5E5", borderRadius: 3, padding: "3px 5px", fontSize: F.body, fontFamily: "'Barlow',sans-serif", fontWeight: 700, outline: "none" }} /></div>
            <TXR l="GST/HST" r={s.gstRate} onR={v => set("gstRate", v)} a={calc.gst} c={s.currency} F={F} /><TXR l="PST" r={s.pstRate} onR={v => set("pstRate", v)} a={calc.pst} c={s.currency} F={F} />
            <div style={{ borderTop: "3px solid #C8102E", marginTop: 6, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: F.subheader + 2, textTransform: "uppercase" }}>TOTAL</span><span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: F.header * 0.8, color: "#C8102E" }}>{fmt(calc.total, s.currency)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}><span style={{ fontSize: F.body, color: "#777", fontWeight: 600 }}>DEPOSIT</span><input type="number" min="0" step="0.01" value={s.deposit} onChange={e => set("deposit", Math.max(0, Number(e.target.value)))} style={{ width: 80, textAlign: "right", border: "1px solid #E5E5E5", borderRadius: 3, padding: "3px 5px", fontSize: F.body, fontFamily: "'Barlow',sans-serif", fontWeight: 700, outline: "none" }} /></div>
            <SR l="BALANCE" v={fmt(calc.bal, s.currency)} b ac F={F} />
          </div>
        </div>
      </div>

      {/* PDF RENDER */}
      <div ref={printRef} style={{ position: "fixed", left: "-9999px", top: 0, width: 780, background: "#FFF", color: "#1A1A1A", fontFamily: "'Barlow',sans-serif", fontSize: 11, lineHeight: 1.4 }}>
        <div style={{ background: "#C8102E", color: "#FFF", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}>{s.logo && <img src={s.logo} alt="" style={{ maxHeight: 36 }} />}<div style={{ fontSize: 10, opacity: .8, lineHeight: 1.6 }}><div>Tel: 780-452-1111 · Fax: 780-452-5775</div><div>1001 Buckingham Dr | Sherwood Park, AB | T8H 0X5</div></div></div><div style={{ textAlign: "right" }}><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, letterSpacing: ".08em" }}>QUOTATION</div><div style={{ fontSize: 11, marginTop: 2 }}>Quote: <strong>{s.quoteNumber}</strong> &nbsp; Date: <strong>{s.date}</strong></div></div></div>
        <div style={{ display: "flex", borderBottom: "1px solid #E5E5E5" }}><div style={{ flex: 1, padding: "12px 24px", borderRight: "1px solid #E5E5E5" }}><div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 3 }}>Prepared For:</div><div style={{ fontWeight: 700, fontSize: 12 }}>{s.preparedFor.name}</div><div>{s.preparedFor.address}</div><div>{s.preparedFor.cityProv}</div></div><div style={{ flex: 1, padding: "12px 24px" }}><div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 3 }}>Ship To:</div><div style={{ fontWeight: 700, fontSize: 12 }}>{s.shipTo.name}</div><div>{s.shipTo.address}</div><div>{s.shipTo.cityProv}</div>{s.shipTo.phone && <div>Phone: {s.shipTo.phone}</div>}</div></div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ background: "#C8102E", color: "#FFF", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{["Customer #", "Carrier", "PO #", "Ship Date", "Salesperson"].map(h => <th key={h} style={{ padding: "5px 10px", textAlign: "left" }}>{h}</th>)}</tr></thead><tbody><tr style={{ borderBottom: "1px solid #E5E5E5", fontSize: 11 }}><td style={{ padding: "5px 10px" }}>{s.customerNo}</td><td style={{ padding: "5px 10px" }}>{s.carrier}</td><td style={{ padding: "5px 10px" }}>{s.poNumber}</td><td style={{ padding: "5px 10px" }}>{s.shipDate}</td><td style={{ padding: "5px 10px" }}>{s.salesperson}</td></tr></tbody></table>
        {s.drawings.length > 0 && <div style={{ padding: "16px 24px" }}>{s.drawings.map((d, i) => <div key={d.id} style={{ marginBottom: 20, pageBreakInside: "avoid" }}><div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #C8102E", paddingBottom: 4, marginBottom: 6 }}><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>{d.title || `Drawing #${i + 1}`}</div>{s.showPrices && <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 16, color: "#C8102E" }}>Total: {fmt(d.totalPrice || 0, s.currency)}</div>}</div>{d.image && <div style={{ position: "relative", display: "inline-block", width: "100%" }}><img src={d.image} alt="" style={{ maxWidth: "100%", maxHeight: 340, objectFit: "contain", border: "1px solid #E5E5E5", borderRadius: 4 }} />{(d.pins || []).map(p => <div key={p.id}><div style={{ position: "absolute", left: `${p.xPct}%`, top: `${p.yPct}%`, width: 16, height: 16, borderRadius: "50%", background: "#C8102E", border: "2px solid #FFF", transform: "translate(-50%,-50%)", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} /><div style={{ position: "absolute", left: `${p.xPct}%`, top: `calc(${p.yPct}% + 12px)`, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}><div style={{ background: "rgba(200,16,46,.9)", color: "#FFF", padding: "2px 6px", borderRadius: 3, fontSize: 8, fontWeight: 700 }}>{p.main}</div>{p.sub && <div style={{ background: "rgba(0,0,0,.7)", color: "#FFF", padding: "1px 4px", borderRadius: 2, fontSize: 7, marginTop: 1 }}>{p.sub}</div>}</div></div>)}</div>}{d.notes && <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>NOTE: {d.notes}</div>}</div>)}</div>}
        {s.items.some(i => i.itemNo || i.description) && <table style={{ width: "100%", borderCollapse: "collapse", margin: "0 0 12px", fontSize: 10 }}><thead><tr style={{ background: "#C8102E", color: "#FFF", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}><th style={{ padding: "5px 8px", textAlign: "left", width: 22 }}>LN</th><th style={{ padding: "5px 6px", width: 50 }}>Img</th><th style={{ padding: "5px 8px" }}>Item No</th><th style={{ padding: "5px 6px", textAlign: "center", width: 28 }}>Qty</th><th style={{ padding: "5px 6px", width: 28 }}>UOM</th><th style={{ padding: "5px 8px" }}>Description</th>{s.showPrices && <th style={{ padding: "5px 8px", textAlign: "right" }}>Net Price</th>}{s.showPrices && <th style={{ padding: "5px 8px", textAlign: "right" }}>Ext Amt</th>}</tr></thead><tbody>{s.items.map((it, i) => <tr key={it.id} style={{ borderBottom: "1px solid #EEE", background: i % 2 === 0 ? "#FFF" : "#FAFAFA" }}><td style={{ padding: "5px 8px", color: "#999" }}>{i + 1}</td><td style={{ padding: "3px 4px" }}>{it.image && <img src={it.image} alt="" style={{ width: 46, height: 30, objectFit: "contain", borderRadius: 2 }} />}</td><td style={{ padding: "5px 8px", fontWeight: 600 }}>{it.itemNo}</td><td style={{ padding: "5px 6px", textAlign: "center" }}>{it.qty}</td><td style={{ padding: "5px 6px" }}>{it.uom}</td><td style={{ padding: "5px 8px", whiteSpace: "pre-wrap", lineHeight: 1.35 }}>{it.description}</td>{s.showPrices && <td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(it.netPrice, s.currency)}</td>}{s.showPrices && <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700 }}>{fmt(it.qty * it.netPrice, s.currency)}</td>}</tr>)}</tbody></table>}
        <div style={{ display: "flex", padding: "0 24px 20px", gap: 20 }}><div style={{ flex: 1, fontSize: 9, color: "#777", lineHeight: 1.5 }}>{s.notes && <><div style={{ marginBottom: 4 }}><strong style={{ color: "#333", fontSize: 10 }}>NOTE:</strong></div><div style={{ marginBottom: 8 }}>{s.notes}</div></>}{s.termsNotes && <div style={{ whiteSpace: "pre-wrap", borderTop: "1px solid #EEE", paddingTop: 6, marginTop: 4 }}>{s.termsNotes}</div>}</div><div style={{ width: 220 }}><PR l="SUBTOTAL" v={fmt(calc.sub, s.currency)} b /><PR l="FREIGHT" v={fmt(calc.fr, s.currency)} /><PR l="GST/HST" v={fmt(calc.gst, s.currency)} /><PR l="PST" v={fmt(calc.pst, s.currency)} /><div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", borderTop: "3px solid #C8102E", marginTop: 4, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15 }}><span>TOTAL</span><span style={{ color: "#C8102E" }}>{fmt(calc.total, s.currency)}</span></div><PR l="DEPOSIT" v={fmt(s.deposit, s.currency)} /><PR l="BALANCE" v={fmt(calc.bal, s.currency)} b /></div></div>
      </div>
    </div>
  );
}

/* Helpers */
function SR({ l, v, b, ac, F }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0", fontSize: b ? (F?.subheader || 13) : (F?.body || 12), fontWeight: b ? 800 : 600, color: ac ? "#C8102E" : b ? "#1A1A1A" : "#777", fontFamily: b ? "'Barlow Condensed',sans-serif" : "'Barlow',sans-serif", textTransform: b ? "uppercase" : "none" }}><span>{l}</span><span style={{ fontWeight: 800, fontSize: b ? (ac ? (F?.subheader || 14) + 4 : (F?.subheader || 14)) : (F?.body || 12) }}>{v}</span></div>; }
function TXR({ l, r, onR, a, c, F }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}><span style={{ fontSize: F?.body || 12, color: "#777", fontWeight: 600 }}>{l}</span><div style={{ display: "flex", alignItems: "center", gap: 3 }}><input type="number" min="0" max="100" step="0.01" value={r} onChange={e => onR(Math.max(0, Number(e.target.value)))} style={{ width: 40, textAlign: "right", border: "1px solid #E5E5E5", borderRadius: 3, padding: "2px 3px", fontSize: F?.small || 11, fontFamily: "'Barlow',sans-serif", outline: "none", fontWeight: 600 }} /><span style={{ fontSize: F?.small || 10, color: "#AAA", fontWeight: 600 }}>%</span><span style={{ fontWeight: 700, fontSize: F?.body || 12, minWidth: 65, textAlign: "right" }}>{fmt(a, c)}</span></div></div>; }
function PR({ l, v, b }) { return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontWeight: b ? 800 : 500, fontSize: b ? 12 : 11, color: b ? "#1A1A1A" : "#666" }}><span>{l}</span><span>{v}</span></div>; }
