import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "./styles.css";

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

const DF = { header: 28, subheader: 14, body: 12, small: 10, pinSize: 22, contact: 9, logoH: 36 };
const DC = { img: 15, itemNo: 12, qty: 6, uom: 6, desc: 30, netPrice: 10, extAmt: 12.9 };
// Only img, itemNo, desc are user-adjustable; rest are fixed
const FIXED_COLS = { qty: 6, uom: 6, netPrice: 10, extAmt: 12.9 };

const DEFAULT = {
  quoteNumber: "34130", quoteLabel: "#:", date: today(), shipDate: "", currency: "CAD",
  contactInfo: "Tel: 780-452-1111 · Fax: 780-452-5775\n1001 Buckingham Dr | Sherwood Park, AB | T8H 0X5",
  preparedFor: { name: "Kanvi Homes", address: "# 101, 1290-91 Street NW", cityProv: "Edmonton, AB T6X 0P2" },
  shipTo: { name: "Kanvi Homes", address: "# 101, 1290-91 Street NW", cityProv: "Edmonton, AB T6X 0P2", phone: "780-439-9000", email: "" },
  customerNo: "Kan9-90", carrier: "BestWay", poNumber: "Element", eta: "SEE TERMS", fob: "NA", salesperson: "",
  items: [emptyItem()], drawings: [], freight: 0, gstRate: 5, pstRate: 0, deposit: 0,
  notes: "Prices valid for 30 days from date of your quote.",
  termsNotes: "Returns: Note that product returns are not accepted after 45 days. All returns must be accompanied by the original receipt. Product must be returned in original packaging.\nCustom orders and clearance/discontinued items are not returnable.\nCustom order delivery schedules may vary due to circumstances beyond our control. Orders may not be cancelled due to extended delivery projections.",
  showPrices: true, showExtras: false, showCarrier: true, showShipDate: true, priceMode: "both", docTitle: "QUOTATION", logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl8yIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3NTUuNyAyMjkuNDMiPjxkZWZzPjxzdHlsZT4uY2xzLTF7c3Ryb2tlLXdpZHRoOjBweDt9PC9zdHlsZT48L2RlZnM+PGcgaWQ9IkxheWVyXzEtMiI+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOC45MywxNjcuMTNzOC44NywxLjk5LDI3LjA2LTE1LjA4YzE4LjE5LTE3LjA4LDQxLjkyLTQwLjgxLDQxLjkyLTQwLjgxLDAsMCwyMS4wNy0xOS45NiwyNi42Mi0yMS45Niw1LjU1LTIsOS41NC0xLjc4LDkuNTQtMS43OCwwLDAsMTEuNzUtLjg5LDEzLjA5LDEzLjk3djQ0LjhzLjIyLDE2Ljg2LDE2LjQxLDE5Ljc0bDMuMTYuMzNoMTM3LjQxczExLjk4LjUsMTQuMTQtMTUuOFYxMi40OHMtMi4xNi0yNC43OS0yOS45NC0yLjgzbC01OS4wNiw1Ni43M3MtOC44MiwxMS4zMS0yMy42MiwxMS45OGMtMTQuOC42Ny0xNS40Ny0xNS4zLTE1LjQ3LTE1LjNWMTkuMTNzLjE3LTE3LjgtMjAuNzktMTkuMTNIMTguOFMwLDAsMCwxOC44djEzMC41OXMtLjExLDE2Ljg2LDguOTMsMTcuNzVoMFoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zNDYuMiw5MS4xNmMtMy41NywzLjc5LTUuNTcsOS4xNy02LjAxLDE2LjEzbDU0LjYtLjEzdjE2LjMzaC01NC43M2MwLDMuMzEuMzcsNi40OSwxLjExLDkuNTMuNzQsMy4wNSwyLjI0LDUuODQsNC41MSw4LjM2LDIsMi4zNSw0LjM4LDMuODEsNy4xMiw0LjM4LDIuNzQuNTcsNS41NS44NSw4LjQyLjg1aDEuMThsMzIuMzktLjEzdjE2LjMzaC0zMy4zMWMtNS4zMSwwLTEwLjQzLS40OC0xNS4zNS0xLjQ0LTQuOTItLjk2LTkuNTYtMy4xOC0xMy45MS02LjY2LTUuMjItNC4yNy04Ljg4LTkuNDctMTAuOTctMTUuNjEtMi4wOS02LjE0LTMuMjItMTIuNDMtMy40LTE4Ljg3LS4wOS0xLjM5LS4xMS0yLjc0LS4wNy00LjA1LjA0LTEuMzEuMTEtMi42MS4yLTMuOTIuOTYtMTQuOCw0Ljk4LTI1LjY5LDEyLjA4LTMyLjY1LDcuMS02Ljk3LDE3Ljc0LTEwLjQ1LDMxLjkzLTEwLjQ1bDMyLjc4LS4xM3YxNi4zM2gtMzIuMzljLTcuMjMuMDktMTIuNjMsMi4wMi0xNi4yLDUuODFaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDYwLjYxLDY5LjAzYy45Ni4wOSwxLjg5LjEzLDIuODEuMTNzMS44NS4wNSwyLjgxLjEzYzMuNTcuMTgsNy4wNy43NCwxMC41MSwxLjcsMy40NC45Niw2LjQ3LDIuNzQsOS4wOCw1LjM2LDIuMzUsMi4yNyw0LjEyLDQuOTIsNS4yOSw3Ljk3LDEuMTgsMy4wNSwxLjg5LDYuMTgsMi4xNiw5LjQsMCwuNjEuMDIsMS4yMi4wNywxLjgzLjA0LjYxLjA2LDEuMjIuMDYsMS44My4wOSw2LjUzLTEuNDIsMTIuMTctNC41LDE2LjkxLTMuMDksNC43NS03LjksNy45LTE0LjQzLDkuNDdsMjMuMzgsMzkuMDVoLTIyLjJsLTIwLjY0LTM2LjgzaC0yMy4yNXYzNi44M2gtMTkuNzJ2LTkzLjc4aDQ4LjU5Wk00NTUuOTEsODUuNzVoLTI0LjE2djIzLjY0aDI0LjE2Yy4xNy4wOS4zNS4xMy41Mi4xM2guNTJjNC4xOCwwLDcuOTktLjYzLDExLjQzLTEuODksMy40NC0xLjI2LDUuMTEtNC41OSw1LjAzLTkuOTksMC01LjU3LTEuODEtOC45Mi01LjQyLTEwLjA2LTMuNjEtMS4xMy03LjY0LTEuNy0xMi4wOC0xLjd2LS4xM1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik00OTYuMjcsNjkuMDNoMjIuMmwyOC4yMSw2OS44OCwyOC44Ni02OS44OGgyMS4wM2wtMzkuMTgsOTMuNzhoLTIwLjM3bC00MC43NS05My43OFoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik02NDcuMDQsNjkuMDNsMzkuOTcsOTMuNzhoLTIxLjk0bC04LjYyLTIyLjMzaC00MC43NWwtOC4zNiwyMi4zM2gtMjAuNzdsMzkuNTgtOTMuNzhoMjAuOVpNNjIyLjA5LDEyMy43NWgyNy45NWwtMTQuMjQtMzYuMDUtMTMuNzIsMzYuMDVaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNzE0LjExLDE2MS40M2MtNS4xOC0uOTEtOS45NS0zLjY4LTE0LjMtOC4yOS0zLjc1LTMuOTItNi4xLTguMzEtNy4wNS0xMy4xOS0uOTYtNC44OC0xLjQ0LTkuODgtMS40NC0xNS4wMnYtNTUuOWgxOS43MnY1MS40NmMtLjA5LDguNzEuODcsMTUuMzcsMi44NywxOS45OCwyLDQuNjIsOC4xOCw2LjkyLDE4LjU1LDYuOTJsMjMuMjUtLjEzdjE1LjU0aC0yNC45NWMtNS45MiwwLTExLjQ3LS40Ni0xNi42NS0xLjM3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTUyMi45OCwyMTguMjJjMCw3LjAyLTMuNTksMTEuMjEtMTAuOTMsMTEuMjFoLTQuODljLTYuOTEsMC0xMC41Ni0zLjkyLTEwLjg4LTEwLjI4LS4wNS0uNjUuMzMtMS4wMywxLjAzLTEuMDNoNC4wOGMuNiwwLDEuMDMuMzgsMS4wOSwxLjAzLjIxLDMuNDgsMS42Myw0LjY4LDQuNjgsNC42OGg0Ljg5YzMuMzIsMCw0LjczLTEuMjUsNC43My01LjYsMC00LjU3LTIuNTUtNS4yMi02LjQyLTYuMDRsLTIuNjctLjU0Yy02LjYzLTEuMzYtMTEuMS0zLjkyLTExLjEtMTAuODMsMC02LjQyLDMuNjQtMTAuMDEsMTEuMDQtMTAuMDFoMy4zMmM2Ljg1LDAsMTAuMzQsMy45MiwxMC43MiwxMC4wNy4wNS43MS0uMzMsMS4wOS0uOTgsMS4wOWgtNC4wOGMtLjY1LDAtMS4wOS0uMzgtMS4xNC0xLjA5LS4yMi0zLjIxLTEuNTgtNC40Ni00LjUyLTQuNDZoLTMuMzJjLTMuMzcsMC00Ljg0LjcxLTQuODQsNC40MSwwLDMuNDguODEsNC4zNSw1LjE3LDUuMjJsMi42Ny41NGM1Ljk4LDEuMjUsMTIuMzUsMy4yNiwxMi4zNSwxMS42NFoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik01MjkuNzgsMTkxLjA3aDQuNDFjLjU1LDAsLjgxLjI3LjgxLjgydjQuM2MwLC41NS0uMjcuODItLjgxLjgyaC00LjQxYy0uNTUsMC0uODItLjI3LS44Mi0uODJ2LTQuM2MwLS41NS4yNy0uODIuODItLjgyWk01MjkuNzgsMjAxLjk2aDQuNDFjLjU1LDAsLjgxLjI3LjgxLjgxdjI1LjU3YzAsLjU0LS4yNy44Mi0uODEuODJoLTQuNDFjLS41NSwwLS44Mi0uMjctLjgyLS44MnYtMjUuNTdjMC0uNTQuMjctLjgxLjgyLS44MVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik01NjMuODQsMjExLjMxdjE3LjAzYzAsLjU0LS4yNy44Mi0uODEuODJoLTQuNDFjLS41NSwwLS44Mi0uMjctLjgyLS44MnYtMTcuNjNjMC0yLjUtMS4yNS0zLjUzLTMuNTktMy41M2gtLjdjLTIuODMsMC00LjczLDEuMzYtNS4zOSwyLjQ1djE4LjcyYzAsLjU0LS4yNy44Mi0uODEuODJoLTQuNDFjLS41NSwwLS44Mi0uMjctLjgyLS44MnYtMjUuNTdjMC0uNTQuMjctLjgxLjgyLS44MWg0LjQxYy41NCwwLC44MS4yNy44MS44MXYyLjYxYzEuMTUtMS43NCwzLjM3LTMuNjQsNy4yNC0zLjY0aC4zOGM2LjAzLDAsOC4xLDMuODYsOC4xLDkuNTdaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNTg0Ljk5LDIxMC4yM2MtLjI3LTIuMjMtMS4zNS0yLjk5LTMuMDUtMi45OWgtMi42NmMtMi4xMiwwLTMuNTQsMS4wMy0zLjU0LDMuNjR2OS40N2MwLDIuNSwxLjQyLDMuNjQsMy41NCwzLjY0aDIuNjZjMi41MSwwLDMuMjctLjgyLDQuMzUtMi4yMy4zOC0uNDQuOTItLjM4LDEuNDcsMGwyLjYxLDEuODVjLjQ5LjM4LjQ5LjcxLjE2LDEuMTQtMS45NiwyLjM5LTMuNjQsNC42OC04LjYsNC42OGgtMi42NmMtNS45OSwwLTkuNzQtNC40Ni05Ljc0LTEwLjIzdi03LjU2YzAtNS44MiwzLjc2LTkuODUsOS43NC05Ljg1aDIuNjZjNS4wMSwwLDguNiwzLjI3LDkuMTQsOC4zMi4wNS43Ni0uMzMsMS4xNS0xLjAzLDEuMTVoLTMuOTdjLS42NiwwLTEuMDMtLjM4LTEuMDktMS4wM1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik02MTcuMzcsMjExLjY0djQuNjhjMCwxLjAzLS41NSwxLjYzLTEuNjMsMS42M2gtMTMuNzd2Mi40YzAsMi41LDEuNDEsMy42NCwzLjUzLDMuNjRoMi42N2MzLjA1LDAsMy43Ni0uNiw0Ljg5LTEuOS4zMy0uMzguNjYtLjM4LDEuMiwwbDIuMjMsMS40N2MuNTQuMzguNi43Ni4yNywxLjItMS45NiwyLjM5LTMuNzYsNC42OC04LjYsNC42OGgtMi42N2MtNS45OCwwLTkuNzQtNC40Ni05Ljc0LTEwLjIzdi03LjU2YzAtNS44OCwzLjc2LTkuOSw5Ljc0LTkuOWgyLjY3YzUuMTIsMCw5LjIsMy43NSw5LjIsOS45Wk02MTEuMzMsMjEwLjgyYzAtMi42MS0xLjI2LTMuNjQtMy4xNi0zLjY0aC0yLjY3Yy0yLjEyLDAtMy41MywxLjAzLTMuNTMsMy43djIuMzRoOS4zNnYtMi4zOVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik02NTIuNTYsMTkxLjg5djM2LjQ1YzAsLjU0LS4yNy44Mi0uODEuODJoLTQuNDFjLS41NSwwLS44Mi0uMjctLjgyLS44MnYtMjguMjRsLTEuOTYsMS45Yy0uMjcuMzMtLjgxLjM4LTEuMTksMGwtMy4yMi0zLjIxYy0uMzgtLjM4LS4yNy0uNzYuMDYtMS4xNGw2LjQyLTYuMzFjMC0uMDUuMTEtLjExLjE2LS4xMS4xMS0uMTEuMjctLjE2LjU1LS4xNmg0LjQxYy41NCwwLC44MS4yNy44MS44MloiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik02NjEuNTMsMjAzLjI2YzAtOCwzLjUzLTEyLjQ2LDEwLjkzLTEyLjQ2aDYuMjVjNy4zLDAsMTAuODgsMy44MSwxMC44OCwxOC4wNiwwLDEzLjQ5LTEuNzksMjAuNTctMTIuODksMjAuNTdoLTIuMjNjLTguNjUsMC0xMS44Ni0zLjQ4LTEyLjA3LTkuNzQsMC0uNTQuMjctLjgyLjgxLS44Mmg0LjUyYy41NCwwLC43Ni4yNy44MS44Mi4yMiwzLjIxLDIuMDIsNC4zLDUuOTMsNC4zaDIuMTJjNC44NCwwLDYuNTMtMS40Nyw2Ljc1LTEwLjk5LTEuMjUuOTgtMy4yMSwxLjY5LTUuNiwxLjY5aC01LjMzYy03LjM1LDAtMTAuODgtNC4xOS0xMC44OC0xMS40M1pNNjY3Ljc0LDIwMy4yNmMwLDMuNDMsMS4zNiw2LjIsNC42OCw2LjJoNi4zMWMzLjQzLDAsNC42OC0xLjA5LDQuNjgtNS4wMSwwLTUuOTgtMS4zNi04LjA1LTQuNjgtOC4wNWgtNi4yNWMtMy4zMiwwLTQuNzMsMi4wMS00LjczLDYuODZaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNzI0LjE1LDIxNy4xM2MwLDguMzItNC4yNCwxMi4zLTExLjIxLDEyLjNoLTYuOTZjLTcuMDIsMC0xMS4yMS0zLjk3LTExLjIxLTEyLjMsMC00LjU3LDEuNjMtNy43OCw1LjQ5LTkuNjMtMi44Mi0xLjY5LTMuNDgtNC4wMy0zLjQ4LTcuNTEsMC01LjcxLDMuMjctOS4yLDEwLjkzLTkuMmgzLjQzYzcuNzMsMCwxMC45MywzLjU0LDEwLjkzLDkuMiwwLDMuNDgtMS4yLDUuNzEtMy40OCw3LjQ1LDMuOTgsMS45LDUuNTUsNS4xMiw1LjU1LDkuNjhaTTcxOCwyMTcuMDhjMC0zLjkxLS44Ny02Ljc1LTYuMjUtNi43NWgtNC41N2MtNS40NCwwLTYuMzEsMi44My02LjMxLDYuNzUsMCw1LjIyLDEuOTEsNy4wMiw1LjYsNy4wMmg1Ljk5YzMuNywwLDUuNTUtMS44LDUuNTUtNy4wMlpNNzAyLjI4LDIwMC40M2MwLDMuMjcuOTgsNS4yMyw1LjMzLDUuMjNoMy42NGM0LjQxLDAsNS4zOC0xLjk2LDUuMzgtNS4yMywwLTIuOTQtLjk4LTQuNzktNS40OS00Ljc5aC0zLjQzYy00LjUxLDAtNS40MywxLjg1LTUuNDMsNC43OVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik03NTUuNywyMTcuNTFjMCw3LjUxLTMuNTksMTEuOTItMTAuOTQsMTEuOTJoLTQuNzhjLTcuMDcsMC0xMC42MS00LjAzLTEwLjk0LTEwLjgzLS4wNS0uNjUuMzMtMS4wMywxLjAzLTEuMDNoNC4wOGMuNiwwLDEuMDMuMzgsMS4wOSwxLjAzLjE2LDMuOTcsMS41OCw1LjIyLDQuNzQsNS4yMmg0Ljc4YzMuMzIsMCw0Ljc0LTEuNDcsNC43NC02LjMxcy0xLjQyLTcuODktNC42OC03Ljg5aC0yLjk0Yy0zLjc2LDAtNS41NSwxLjg1LTYuNDgsMi43OGgtNS4xN2MtLjU0LDAtLjgxLS4yNy0uODEtLjgydi0xLjAzbDEuOTEtMTguNjZjLjA1LS41NS4yNy0uODIuODEtLjgyaDIwLjQ2Yy41NSwwLC44MS4yNy44MS44MnYzLjgxYzAsLjU0LS4yNy44Mi0uODEuODJoLTE2bC0uOTgsOS41MmMxLjk2LTEuMjUsMy45Mi0xLjg1LDYuMjUtMS44NWgyLjk0YzcuMjksMCwxMC44OCw0LjQ2LDEwLjg4LDEzLjMzWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTcyNC4yNCwxNi44MnYtMi4xOGMwLTguMTYsNi43NC0xNC42NCwxNS43MS0xNC42NHMxNS43NSw2LjU1LDE1Ljc1LDE0LjY0djIuMThjMCw4LjY2LTYuNTksMTUuMS0xNS43NSwxNS4xcy0xNS43MS02LjQ0LTE1LjcxLTE1LjFaTTc1Mi4yNiwxNi43OHYtMi4xNWMwLTYuMjQtNS4yMS0xMS4zMS0xMi4zLTExLjMxcy0xMi4yMyw1LjA2LTEyLjIzLDExLjN2Mi4xNWMwLDYuNyw1LjEsMTEuNzMsMTIuMjMsMTEuNzNzMTIuMy01LjAyLDEyLjMtMTEuNzNaTTczNC4xNywyMy4zVjcuOTNoNy4zNmMyLjk1LDAsNC45OCwxLjk5LDQuOTgsNC42NCwwLDIuMy0xLjM0LDQuMDYtMy4wNiw0LjU2bDMuNTYsNi4xN2gtMy44N2wtMy4xMS01LjcxaC0yLjUzdjUuNzFoLTMuMzRaTTczNy41NCwxNS4xM2gyLjQyYzEuNDYsMCwzLjE0LS4zNCwzLjE0LTIuMzcsMC0xLjU3LTEuMTEtMi4zLTIuNzYtMi4zaC0yLjh2NC42OFoiLz48L2c+PC9zdmc+", fonts: { ...DF }, cols: { ...DC },
};

const SK = "nerval-quote-data", SVK = "nerval-saved-quotes";
const ld = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
/* PDF uses native browser print → Save as PDF */

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
function DrawingCanvas({ drw, onAddPin, onUpdatePin, onRemovePin, onMovePin, editingPin, setEditingPin, F, canvasView, setCanvasView }) {
  const zoom = canvasView?.zoom ?? 1;
  const pan = canvasView?.pan ?? { x: 0, y: 0 };
  const setZoom = (z) => {
    const newZ = typeof z === 'function' ? z(zoom) : z;
    setCanvasView({ ...canvasView, zoom: newZ });
  };
  const setPanVal = (p) => {
    const newP = typeof p === 'function' ? p(pan) : p;
    setCanvasView({ ...canvasView, pan: newP });
  };
  
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingPin, setDraggingPin] = useState(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const didPanRef = useRef(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const isHovering = useRef(false);

  // Spacebar hold detection — only when hovering over canvas AND not typing in an input
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === "Space" && !e.repeat && isHovering.current) {
        // Don't hijack space if user is typing in an input or textarea
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setSpaceDown(true);
      }
    };
    const onKeyUp = (e) => { if (e.code === "Space") setSpaceDown(false); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, []);

  const handleMouseDown = e => {
    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      e.preventDefault(); e.stopPropagation();
      setPanning(true); didPanRef.current = false;
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  const handleMouseMove = e => {
    if (panning) {
      didPanRef.current = true;
      setPanVal({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
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
    if (spaceDown) return; // don't place pin while panning
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
        <button className="nv-btn" style={{ padding: "4px 8px", fontSize: 10 }} onClick={() => setCanvasView({ zoom: 1, pan: { x: 0, y: 0 } })}><Rst size={12} /></button>
        <span style={{ fontSize: 10, color: "#999", fontWeight: 600 }}>{Math.round(zoom * 100)}%</span>
        <span style={{ fontSize: 9, color: "#BBB", marginLeft: 4 }}>Space+drag=pan · Click=pin · Drag pin=move</span>
      </div>
      <div onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); isHovering.current = false; setSpaceDown(false); }}
        onMouseEnter={() => { isHovering.current = true; }}
        className="nv-canvas-viewport"
        style={{ cursor: draggingPin ? "grabbing" : panning ? "grabbing" : spaceDown ? "grab" : "crosshair" }}>
        <div style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: "center center", position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <img ref={imgRef} src={drw.image} alt="" onClick={handleImgClick} style={{ maxWidth: "100%", maxHeight: 440, objectFit: "contain", display: "block", userSelect: "none" }} draggable={false} />
            {(drw.pins || []).map(pin => (
              <div key={pin.id} style={{ position: "absolute", left: `${pin.xPct}%`, top: `${pin.yPct}%`, zIndex: 10 }}>
                {/* Draggable pin dot */}
                <div onMouseDown={e => startPinDrag(e, pin.id)}
                  onClick={e => { e.stopPropagation(); if (!draggingPin) setEditingPin(editingPin === pin.id ? null : pin.id); }}
                  className={`nv-pin-dot ${draggingPin === pin.id ? 'dragging' : ''}`}
                  style={{ width: F.pinSize || 22, height: F.pinSize || 22, background: draggingPin === pin.id ? undefined : "#C8102E" }} />
                {/* Label */}
                <div style={{ position: "absolute", left: "50%", top: 16, transform: "translateX(-50%)", textAlign: "left", whiteSpace: "pre-wrap", pointerEvents: "none", zIndex: 11, maxWidth: 200 }}>
                  <div className="nv-pin-label-main" style={{ fontSize: Math.max(9, F.small) }}>{pin.main}</div>
                  {pin.sub && <div className="nv-pin-label-sub" style={{ fontSize: Math.max(7, F.small - 2) }}>{pin.sub}</div>}
                </div>
                {editingPin === pin.id && (
                  <div style={{ position: "absolute", left: "50%", top: 55, transform: "translateX(-50%)", zIndex: 30, background: "#FFF", border: "1px solid #E5E5E5", borderRadius: 8, padding: 12, width: 220, boxShadow: "0 8px 24px rgba(0,0,0,.2)", pointerEvents: "auto" }} onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#C8102E", marginBottom: 6 }}>Edit Pin <span style={{ color: "#999", fontWeight: 400 }}>(drag dot to move)</span></div>
                    <textarea value={pin.main} onChange={e => { const lines = e.target.value.split("\n"); if (lines.length <= 5) onUpdatePin(drw.id, pin.id, "main", e.target.value); }} placeholder="Main text" rows={2} style={{ width: "100%", padding: "6px 8px", border: "1px solid #D4D4D4", borderRadius: 4, fontSize: F.body, fontFamily: "'Barlow',sans-serif", marginBottom: 6, outline: "none", boxSizing: "border-box", fontWeight: 700, resize: "vertical" }} />
                    <textarea value={pin.sub} onChange={e => { const lines = e.target.value.split("\n"); if (lines.length <= 5) onUpdatePin(drw.id, pin.id, "sub", e.target.value); }} placeholder="Sub text / specs" rows={2} style={{ width: "100%", padding: "5px 8px", border: "1px solid #D4D4D4", borderRadius: 4, fontSize: F.small, fontFamily: "'Barlow',sans-serif", marginBottom: 8, outline: "none", boxSizing: "border-box", color: "#666", resize: "vertical" }} />
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
      <div style={{ position: "absolute", bottom: 14, right: 14, background: "rgba(0,0,0,.55)", color: "#FFF", padding: "4px 10px", borderRadius: 4, fontSize: 9, fontWeight: 600, pointerEvents: "none" }}><Pin size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} /> Click=pin · Drag=move · Space+drag=pan</div>
    </div>
  );
}

/* ─── Stable form input (defined outside App to prevent re-mount) ─── */
function Inp({ label, value, onChange, type = "text", placeholder, small, autoComplete, name }) {
  return (
    <div>
      {label && <label className="nv-field-label">{label}</label>}
      <input
        type={type}
        name={name || label?.toLowerCase().replace(/[^a-z]/g, '')}
        autoComplete={autoComplete || "off"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="nv-cell-input"
        style={{ padding: small ? "6px 8px" : "8px 10px" }}
      />
    </div>
  );
}

/* ─── Slider helpers (stable) ─── */
function FontSlider({ label, path, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, width: 72, color: "#888", textTransform: "uppercase" }}>{label}</span>
      <input type="range" min={path === "pinSize" ? 12 : path === "logoH" ? 20 : path === "header" ? 18 : path === "subheader" ? 10 : path === "body" ? 9 : path === "contact" ? 6 : 7}
        max={path === "pinSize" ? 74 : path === "logoH" ? 120 : path === "header" ? 42 : path === "subheader" ? 22 : path === "body" ? 18 : path === "contact" ? 16 : 14}
        value={value} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: "#C8102E" }} />
      <span style={{ fontSize: 11, fontWeight: 700, width: 28, textAlign: "right" }}>{value}px</span>
    </div>
  );
}

function ColSlider({ label, path, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 700, width: 72, color: "#888", textTransform: "uppercase" }}>{label}</span>
      <input type="range" min={path === "desc" ? 10 : 5} max={path === "desc" ? 60 : path === "img" ? 40 : 30}
        step="0.5" value={value} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: "#C8102E" }} />
      <span style={{ fontSize: 11, fontWeight: 700, width: 32, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function App() {
  const [s, setS] = useState(() => { const d = ld(SK); return d ? { ...DEFAULT, ...d, fonts: { ...DF, ...(d.fonts || {}) }, cols: { ...DC, ...(d.cols || {}) } } : DEFAULT; });
  const [savedList, setSavedList] = useState(() => ld(SVK) || []);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("items");
  const [editingPin, setEditingPin] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [canvasViews, setCanvasViews] = useState({});
  const printRef = useRef(null);
  const fileRefs = useRef({});
  const drawingRefs = useRef({});
  const tableRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => sv(SK, s), 500); return () => clearTimeout(t); }, [s]);
  const flash = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const F = s.fonts || DF;
  const C = s.cols || DC;

  const set = useCallback((path, val) => {
    setS(prev => {
      const keys = path.split(".");
      if (keys.length === 1) return { ...prev, [keys[0]]: val };
      if (keys.length === 2) return { ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: val } };
      if (keys.length === 3) return { ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: { ...prev[keys[0]][keys[1]], [keys[2]]: val } } };
      return prev;
    });
  }, []);
  const updateItem = useCallback((id, f, v) => setS(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, [f]: v } : i) })), []);
  const updateDrawing = useCallback((id, f, v) => setS(p => ({ ...p, drawings: p.drawings.map(d => d.id === id ? { ...d, [f]: v } : d) })), []);
  const addItem = () => setS(p => ({ ...p, items: [...p.items, emptyItem()] }));
  const removeItem = id => setS(p => ({ ...p, items: p.items.length > 1 ? p.items.filter(i => i.id !== id) : p.items }));
  const dupItem = id => setS(p => { const i = p.items.findIndex(x => x.id === id); if (i < 0) return p; const c = { ...p.items[i], id: uid() }; const a = [...p.items]; a.splice(i + 1, 0, c); return { ...p, items: a }; });
  const addDrawing = () => setS(p => ({ ...p, drawings: [...p.drawings, emptyDrawing()] }));
  const removeDrawing = id => setS(p => ({ ...p, drawings: p.drawings.filter(d => d.id !== id) }));
  const dupDrawing = id => setS(p => { const idx = p.drawings.findIndex(d => d.id === id); if (idx < 0) return p; const clone = JSON.parse(JSON.stringify(p.drawings[idx])); clone.id = uid(); clone.pins = (clone.pins || []).map(pin => ({ ...pin, id: uid() })); const arr = [...p.drawings]; arr.splice(idx + 1, 0, clone); return { ...p, drawings: arr }; });

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
  const dupQ = q => { const clone = { ...q, id: uid(), name: q.name + " (copy)", data: JSON.parse(JSON.stringify(q.data)) }; const u = [clone, ...savedList]; setSavedList(u); sv(SVK, u); flash("Duplicated!"); };
  const newQ = () => { setS({ ...DEFAULT, quoteNumber: String(Math.floor(Math.random() * 90000) + 10000), items: [emptyItem()], drawings: [] }); flash("New quote!"); };

  // Both export and print use the same approach: show the PDF element, trigger print dialog
  // For "Save as PDF", user selects "Save as PDF" as the printer destination
  const triggerPrint = () => {
    const src = printRef.current;
    src.style.position = "static";
    src.style.left = "auto";
    src.style.visibility = "visible";
    src.style.width = "100%";
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        src.style.position = "fixed";
        src.style.left = "-9999px";
        src.style.visibility = "hidden";
      }, 500);
    }, 200);
  };
  const exportPDF = () => { flash("Choose 'Save as PDF' as destination in print dialog"); triggerPrint(); };
  const doPrint = () => triggerPrint();

  // Adjustable: img, itemNo, desc — these 3 share the "flexible" portion
  // Fixed: LN(3%), qty, uom, netPrice, extAmt, actions(5%)
  const gridCols = useMemo(() => {
    const fc = FIXED_COLS;
    const fixedTotal = 3 + fc.qty + fc.uom + (s.priceMode === 'both' ? fc.netPrice : 0) + (s.priceMode !== 'hidden' ? fc.extAmt : 0) + 5;
    const flexTotal = 100 - fixedTotal;
    // User ratios for the 3 adjustable columns
    const rawImg = C.img, rawItemNo = C.itemNo, rawDesc = C.desc;
    const rawSum = rawImg + rawItemNo + rawDesc;
    const img = (rawImg / rawSum) * flexTotal;
    const itemNo = (rawItemNo / rawSum) * flexTotal;
    const desc = (rawDesc / rawSum) * flexTotal;
    return `3% ${img.toFixed(1)}% ${itemNo.toFixed(1)}% ${fc.qty}% ${fc.uom}% ${desc.toFixed(1)}%` + (s.priceMode === 'both' ? ` ${fc.netPrice}%` : '') + (s.priceMode !== 'hidden' ? ` ${fc.extAmt}%` : '') + ' 5%';
  }, [C, s.priceMode]);
  const colDefs = useMemo(() => { const b = [{ k: 'img', l: 'Img' }, { k: 'itemNo', l: 'Item No' }, { k: 'qty', l: 'Qty' }, { k: 'uom', l: 'UOM' }, { k: 'desc', l: 'Description' }]; if (s.priceMode === 'both') b.push({ k: 'netPrice', l: 'Net Price' }); if (s.priceMode !== 'hidden') b.push({ k: 'extAmt', l: 'Ext Amt' }); return b; }, [s.priceMode]);

  const handleResizeStart = (ck, e) => {
    e.preventDefault(); const sx = e.clientX, sv2 = C[ck], tw = tableRef.current?.offsetWidth || 1000, pp = tw / 100;
    const onM = ev => { const np = Math.max(3, Math.min(50, sv2 + (ev.clientX - sx) / pp)); set(`cols.${ck}`, Math.round(np * 10) / 10); };
    const onU = () => { document.removeEventListener('mousemove', onM); document.removeEventListener('mouseup', onU); setResizing(null); };
    setResizing(ck); document.addEventListener('mousemove', onM); document.addEventListener('mouseup', onU);
  };

  /* Inp, FontSlider, ColSlider defined outside App for stability */


  /* ═══ RENDER ═══ */
  return (
    <div style={{ fontFamily: "'Barlow',sans-serif", background: "#F0F0F0", minHeight: "100vh", color: "#1A1A1A" }}>

      {toast && <div className="nv-toast">{toast}</div>}

      {/* TOP BAR */}
      <div className="no-print" style={{ background: "#FFF", borderBottom: "3px solid #C8102E", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#C8102E", color: "#FFF", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, padding: "3px 10px", borderRadius: 2 }}>N</div>
          <div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>NERVAL</div><div style={{ fontSize: 8, color: "#AAA", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase" }}>Quick Estimate Creator</div></div>
        </div>
        <div className="nv-topbar-actions" style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 6px", borderRight: "1px solid #E5E5E5", marginRight: 2 }}>
            <button className="nv-btn" style={{ padding: "4px 10px", fontSize: 9, color: s.priceMode === "hidden" ? "#C8102E" : "#333" }}
              onClick={() => set("priceMode", s.priceMode === "both" ? "extOnly" : s.priceMode === "extOnly" ? "hidden" : "both")}>
              {s.priceMode === "both" ? "All Prices" : s.priceMode === "extOnly" ? "Ext Only" : "No Prices"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 6px", borderRight: "1px solid #E5E5E5", marginRight: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: s.showExtras ? "#333" : "#C8102E" }}>{s.showExtras ? "Extras" : "Simple"}</span>
            <button className={`nv-toggle ${s.showExtras ? "on" : ""}`} onClick={() => set("showExtras", !s.showExtras)} />
          </div>
          <button className="nv-btn" onClick={newQ}><Plus size={13} /></button>
          <button className="nv-btn" onClick={saveQ}><Sav size={13} /></button>
          <button className="nv-btn" onClick={() => setPanel(panel === "saved" ? null : "saved")}><Fld size={13} /></button>
          <button className="nv-btn" onClick={() => setPanel(panel === "settings" ? null : "settings")}><Gear size={13} /></button>
          <button className="nv-btn" onClick={doPrint}><Prn size={13} /></button>
          <button className="nv-btn nv-btn-red" onClick={exportPDF}><DL size={13} /> Save PDF</button>
        </div>
      </div>

      {/* PANELS */}
      {panel && <div className="no-print" onClick={() => setPanel(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 150 }} />}
      {panel === "settings" && (
        <div className="no-print" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 400, maxWidth: "92vw", background: "#FFF", zIndex: 200, overflowY: "auto", padding: 24, animation: "slideIn .25s ease-out", boxShadow: "-8px 0 40px rgba(0,0,0,.15)", borderLeft: "3px solid #C8102E" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, textTransform: "uppercase" }}>Settings</h3><button className="nv-btn" style={{ padding: "4px 8px" }} onClick={() => setPanel(null)}><X size={14} /></button></div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 10 }}>Font Sizes</div>
          <FontSlider label="Header" path="header" value={F.header} onChange={v => set("fonts.header", v)} />
          <FontSlider label="Subheader" path="subheader" value={F.subheader} onChange={v => set("fonts.subheader", v)} />
          <FontSlider label="Body" path="body" value={F.body} onChange={v => set("fonts.body", v)} />
          <FontSlider label="Small" path="small" value={F.small} onChange={v => set("fonts.small", v)} />
          <FontSlider label="Contact" path="contact" value={F.contact || 9} onChange={v => set("fonts.contact", v)} />
          <FontSlider label="Logo H" path="logoH" value={F.logoH || 36} onChange={v => set("fonts.logoH", v)} />
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 10, marginTop: 14 }}>Pin Annotations</div>
          <FontSlider label="Pin Size" path="pinSize" value={F.pinSize || 22} onChange={v => set("fonts.pinSize", v)} />
          <button className="nv-btn" style={{ marginBottom: 20, fontSize: 10 }} onClick={() => set("fonts", { ...DF })}>Reset Fonts</button>

          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 10 }}>Visibility</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>Show Carrier column</span>
            <button className={`nv-toggle ${s.showCarrier !== false ? "on" : ""}`} onClick={() => set("showCarrier", !(s.showCarrier !== false))} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>Show Ship Date column</span>
            <button className={`nv-toggle ${s.showShipDate !== false ? "on" : ""}`} onClick={() => set("showShipDate", !(s.showShipDate !== false))} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 10, marginTop: 10 }}>Column Widths (ratio)</div>
          <p style={{ fontSize: 10, color: "#999", marginBottom: 10 }}>Adjust Image, Item No, and Description proportions. They auto-scale to fill available space. Other columns are fixed.</p>
          <ColSlider label="Image" path="img" value={C.img} onChange={v => set("cols.img", v)} />
          <ColSlider label="Item No" path="itemNo" value={C.itemNo} onChange={v => set("cols.itemNo", v)} />
          <ColSlider label="Description" path="desc" value={C.desc} onChange={v => set("cols.desc", v)} />
          <button className="nv-btn" style={{ fontSize: 10 }} onClick={() => set("cols", { ...DC })}>Reset Columns</button>
        </div>
      )}
      {panel === "saved" && (
        <div className="no-print" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 380, maxWidth: "92vw", background: "#FFF", zIndex: 200, overflowY: "auto", padding: 24, animation: "slideIn .25s ease-out", boxShadow: "-8px 0 40px rgba(0,0,0,.15)", borderLeft: "3px solid #C8102E" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, textTransform: "uppercase" }}>Saved</h3><button className="nv-btn" style={{ padding: "4px 8px" }} onClick={() => setPanel(null)}><X size={14} /></button></div>
          {savedList.length === 0 ? <p style={{ color: "#999", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No saved quotes.</p> :
            savedList.map(q => <div key={q.id} style={{ padding: 14, border: "1px solid #E5E5E5", borderRadius: 6, marginBottom: 8, cursor: "pointer", borderLeft: "3px solid transparent", transition: "all .2s" }} onClick={() => loadQ(q)} onMouseEnter={e => { e.currentTarget.style.borderLeftColor = "#C8102E"; e.currentTarget.style.background = "#FEF9F9"; }} onMouseLeave={e => { e.currentTarget.style.borderLeftColor = "transparent"; e.currentTarget.style.background = "#FFF"; }}><div style={{ fontWeight: 700, fontSize: 13 }}>{q.name}</div><div style={{ fontSize: 11, color: "#999", display: "flex", justifyContent: "space-between", marginTop: 4, gap: 8 }}><span>{q.date}</span><div style={{ display: "flex", gap: 8 }}><button style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 11, fontWeight: 700 }} onClick={e => { e.stopPropagation(); dupQ(q); }}>Duplicate</button><button style={{ background: "none", border: "none", color: "#C8102E", cursor: "pointer", fontSize: 11, fontWeight: 700 }} onClick={e => { e.stopPropagation(); delQ(q.id); }}>Delete</button></div></div></div>)}
        </div>
      )}

      {/* MAIN */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 12px 80px" }} className="no-print">
        {/* HEADER CARD */}
        <div className="nv-card" style={{ background: "#FFF", borderRadius: 6, overflow: "hidden", marginBottom: 16, border: "1px solid #E0E0E0" }}>
          <div style={{ background: "#C8102E", color: "#FFF", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ cursor: "pointer" }}>{s.logo ? <div style={{ position: "relative" }}><img src={s.logo} alt="" className="nv-logo" style={{ height: F.logoH || 36, borderRadius: 3 }} /><button onClick={e => { e.preventDefault(); set("logo", null); }} style={{ position: "absolute", top: -5, right: -5, width: 14, height: 14, borderRadius: "50%", background: "#000", color: "#FFF", border: "none", cursor: "pointer", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button></div> : <div style={{ border: "2px dashed rgba(255,255,255,.4)", borderRadius: 4, padding: "5px 12px", fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, opacity: .8 }}><Pic size={12} /> Logo</div>}<input type="file" accept="image/*" hidden onChange={e => handleFile(null, null, "logo", e.target.files[0])} /></label>
              <div style={{ fontSize: 9, opacity: .7, lineHeight: 1.5 }}>
                <textarea value={s.contactInfo || ""} onChange={e => set("contactInfo", e.target.value)} rows={2}
                  style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.8)", fontSize: F.contact || 9, fontFamily: "'Barlow',sans-serif", lineHeight: 1.5, outline: "none", resize: "vertical", width: 260, minHeight: 30 }} />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: F.header, letterSpacing: ".08em", lineHeight: 1 }}>
                <input value={s.docTitle || "QUOTATION"} onChange={e => set("docTitle", e.target.value)}
                  style={{ background: "transparent", border: "none", borderBottom: "2px solid rgba(255,255,255,.3)", color: "#FFF", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: F.header, letterSpacing: ".08em", lineHeight: 1, outline: "none", textAlign: "right", width: "100%", textTransform: "uppercase" }} />
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: F.body, fontWeight: 600, marginTop: 4, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <input value={s.quoteLabel || "#:"} onChange={e => set("quoteLabel", e.target.value)}
                    style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.25)", color: "rgba(255,255,255,.7)", fontFamily: "'Barlow',sans-serif", fontSize: F.body, fontWeight: 600, width: 52, outline: "none", textAlign: "right" }} />
                  <input value={s.quoteNumber} onChange={e => set("quoteNumber", e.target.value)} style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 3, color: "#FFF", padding: "2px 6px", fontFamily: "'Barlow',sans-serif", fontSize: F.subheader, fontWeight: 800, width: 72, outline: "none" }} />
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>Date: <input type="date" value={s.date} onChange={e => set("date", e.target.value)} style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 3, color: "#FFF", padding: "2px 5px", fontFamily: "'Barlow',sans-serif", fontSize: F.body, fontWeight: 600, outline: "none", colorScheme: "dark" }} /></span>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }} className="nv-resp-2">
            <div style={{ padding: "14px 20px", borderRight: "1px solid #E5E5E5", borderBottom: "1px solid #E5E5E5" }}>
              <div style={{ fontSize: F.small, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 8, background: "#F7F7F7", padding: "3px 8px", display: "inline-block", borderRadius: 2 }}>Prepared For:</div>
              <Inp label="Name" name="prepared-name" autoComplete="organization" value={s.preparedFor.name} onChange={v => set("preparedFor.name", v)} small /><div style={{ height: 5 }} />
              <Inp label="Address" name="prepared-address" autoComplete="street-address" value={s.preparedFor.address} onChange={v => set("preparedFor.address", v)} small /><div style={{ height: 5 }} />
              <Inp label="City/Prov/Postal" name="prepared-city" autoComplete="address-level2" value={s.preparedFor.cityProv} onChange={v => set("preparedFor.cityProv", v)} small />
            </div>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E5E5" }}>
              <div style={{ fontSize: F.small, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 8, background: "#F7F7F7", padding: "3px 8px", display: "inline-block", borderRadius: 2 }}>Ship To:</div>
              <Inp label="Name" name="ship-name" autoComplete="organization" value={s.shipTo.name} onChange={v => set("shipTo.name", v)} small /><div style={{ height: 5 }} />
              <Inp label="Address" name="ship-address" autoComplete="street-address" value={s.shipTo.address} onChange={v => set("shipTo.address", v)} small /><div style={{ height: 5 }} />
              <Inp label="City/Prov/Postal" name="ship-city" autoComplete="address-level2" value={s.shipTo.cityProv} onChange={v => set("shipTo.cityProv", v)} small /><div style={{ height: 5 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }} className="nv-resp-2">
                <Inp label="Phone" name="ship-phone" type="tel" autoComplete="tel" value={s.shipTo.phone} onChange={v => set("shipTo.phone", v)} small />
                <Inp label="Email" name="ship-email" type="email" autoComplete="email" value={s.shipTo.email} onChange={v => set("shipTo.email", v)} small />
              </div>
            </div>
          </div>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${3 + (s.showCarrier !== false ? 1 : 0) + (s.showShipDate !== false ? 1 : 0)},1fr)`, fontSize: F.small, fontWeight: 800, textTransform: "uppercase", color: "#FFF", background: "#C8102E" }} className="nv-resp-5 nv-desk-header">
              {["Customer #", ...(s.showCarrier !== false ? ["Carrier"] : []), "PO #", ...(s.showShipDate !== false ? ["Ship Date"] : []), "Salesperson"].map(h => <div key={h} className="nv-hdr-cell" style={{ padding: "5px 10px" }}>{h}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${3 + (s.showCarrier !== false ? 1 : 0) + (s.showShipDate !== false ? 1 : 0)},1fr)`, background: "#FAFAFA", borderBottom: "1px solid #E5E5E5" }} className="nv-resp-5">
              {[{ v: s.customerNo, k: "customerNo", l: "Customer #" }, ...(s.showCarrier !== false ? [{ v: s.carrier, k: "carrier", l: "Carrier" }] : []), { v: s.poNumber, k: "poNumber", l: "PO #" }, ...(s.showShipDate !== false ? [{ v: s.shipDate, k: "shipDate", type: "date", l: "Ship Date" }] : []), { v: s.salesperson, k: "salesperson", l: "Salesperson" }].map(f => <div key={f.k} style={{ padding: "4px 8px", borderRight: "1px solid #E5E5E5" }}>
              <div className="nv-mob-label" style={{ marginBottom: 2 }}><span style={{ fontSize: 9, fontWeight: 800, color: "#C8102E", textTransform: "uppercase" }}>{f.l}</span></div>
              <input type={f.type || "text"} value={f.v} onChange={e => set(f.k, e.target.value)} className="nv-cell-input" style={{ fontSize: F.body, fontWeight: 500, padding: "4px 6px" }} />
            </div>)}</div>
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
              <div style={{ width: "100%" }}>
                {/* Header */}
                <div className="nv-desk-header" style={{ display: "grid", gridTemplateColumns: gridCols, background: "#C8102E", color: "#FFF", fontSize: Math.max(8, F.small - 1), fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", position: "sticky", top: 0, zIndex: 2 }}>
                  <div className="nv-hdr-cell" style={{ padding: "8px 4px", textAlign: "center" }}>LN</div>
                  {colDefs.map(c => {
                    const isAdjustable = c.k === 'img' || c.k === 'itemNo' || c.k === 'desc';
                    return <div key={c.k} className="nv-hdr-cell" style={{ padding: "8px 6px", textAlign: c.k === 'netPrice' || c.k === 'extAmt' ? 'right' : 'left' }}>{c.l}{isAdjustable && <div className={`col-resizer ${resizing === c.k ? 'active' : ''}`} onMouseDown={e => handleResizeStart(c.k, e)} />}</div>;
                  })}
                  <div className="nv-hdr-cell" style={{ borderRight: "none" }}></div>
                </div>
                {/* Rows */}
                {s.items.map((item, idx) => {
                  const hasImg = !!item.image;
                  return (
                    <div key={item.id} className="nv-row nv-mobile-card" style={{ display: "grid", gridTemplateColumns: gridCols, borderBottom: "1px solid #F0F0F0", background: idx % 2 === 0 ? "#FFF" : "#FAFAFA", alignItems: "stretch" }}>
                      {/* LN */}
                      <div style={{ padding: "8px 4px", textAlign: "center", fontSize: F.body, color: "#BBB", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}><span className="nv-mob-label" style={{ color: "#C8102E", fontSize: 9, fontWeight: 800, marginRight: 4 }}>#</span>{idx + 1}</div>
                      {/* Image */}
                      <div style={{ padding: 4 }} tabIndex={0} onPaste={handlePaste("item", item.id, "image")}>
                        <div className="nv-mob-label" style={{ marginBottom: 3 }}><span className="nv-mob-field-label" style={{ fontSize: 9, fontWeight: 800, color: "#C8102E", textTransform: "uppercase" }}>Image</span></div>
                        <div className="nv-drop" onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("over"); }} onDragLeave={e => e.currentTarget.classList.remove("over")} onDrop={e => { e.currentTarget.classList.remove("over"); handleDrop(e, "item", item.id, "image"); }} onClick={() => fileRefs.current[item.id]?.click()}
                          style={{ width: "100%", minHeight: hasImg ? 80 : 36, borderRadius: 4, overflow: "hidden", border: hasImg ? "1px solid #E5E5E5" : "1.5px dashed #D4D4D4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: hasImg ? "#FAFAFA" : "#F9F9F9" }}>
                          {hasImg ? <div style={{ position: "relative", width: "100%" }}><img src={item.image} alt="" style={{ width: "100%", objectFit: "contain", display: "block" }} /><button onClick={e => { e.stopPropagation(); updateItem(item.id, "image", null); }} style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,.6)", color: "#FFF", border: "none", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button></div> : <div style={{ textAlign: "center", color: "#D4D4D4", padding: 2 }}><Pic size={12} /><div style={{ fontSize: 7 }}>Paste</div></div>}
                          <input ref={el => { fileRefs.current[item.id] = el; }} type="file" accept="image/*" hidden onChange={e => handleFile("item", item.id, "image", e.target.files[0])} />
                        </div>
                      </div>
                      {/* Item No */}
                      <div style={{ padding: "6px" }}><div className="nv-mob-label" style={{ marginBottom: 2 }}><span style={{ fontSize: 9, fontWeight: 800, color: "#C8102E", textTransform: "uppercase" }}>Item No</span></div><input value={item.itemNo} onChange={e => updateItem(item.id, "itemNo", e.target.value)} placeholder="SKU" className="nv-cell-input" style={{ fontSize: F.body, fontWeight: 600, padding: "5px 6px" }} /></div>
                      {/* Qty */}
                      <div style={{ padding: "6px 2px" }}><div className="nv-mob-label" style={{ marginBottom: 2 }}><span style={{ fontSize: 9, fontWeight: 800, color: "#C8102E", textTransform: "uppercase" }}>Qty</span></div><input type="number" min="0" value={item.qty} onChange={e => updateItem(item.id, "qty", Math.max(0, Number(e.target.value)))} className="nv-cell-input" style={{ fontSize: F.body, textAlign: "center", fontWeight: 700, padding: "5px 4px" }} /></div>
                      {/* UOM */}
                      <div style={{ padding: "6px 2px" }}><div className="nv-mob-label" style={{ marginBottom: 2 }}><span style={{ fontSize: 9, fontWeight: 800, color: "#C8102E", textTransform: "uppercase" }}>UOM</span></div><select value={item.uom} onChange={e => updateItem(item.id, "uom", e.target.value)} className="nv-cell-input" style={{ fontSize: F.small, cursor: "pointer", color: "#777", padding: "5px 2px" }}>{["ea", "ft", "sq ft", "ln ft", "set", "lot", "hr"].map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                      {/* Description */}
                      <div style={{ padding: "4px 6px" }}><div className="nv-mob-label" style={{ marginBottom: 2 }}><span style={{ fontSize: 9, fontWeight: 800, color: "#C8102E", textTransform: "uppercase" }}>Description</span></div><textarea value={item.description} onChange={e => { updateItem(item.id, "description", e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} onFocus={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder="Description..." className="nv-cell-input nv-auto-grow" style={{ fontSize: F.body, lineHeight: 1.4, padding: "5px 6px" }} /></div>
                      {/* Net Price */}
                      {s.priceMode === 'both' && <div style={{ padding: "6px" }}><div className="nv-mob-label" style={{ marginBottom: 2 }}><span style={{ fontSize: 9, fontWeight: 800, color: "#C8102E", textTransform: "uppercase" }}>Net Price</span></div><input type="number" min="0" step="0.01" value={item.netPrice} onChange={e => updateItem(item.id, "netPrice", Math.max(0, Number(e.target.value)))} className="nv-cell-input" style={{ fontSize: F.body, textAlign: "right", fontWeight: 700, padding: "5px 6px" }} /></div>}
                      {/* Ext Amt */}
                      {s.priceMode !== 'hidden' && <div style={{ padding: "6px", display: "flex", flexDirection: "column" }}><div className="nv-mob-label" style={{ marginBottom: 2 }}><span style={{ fontSize: 9, fontWeight: 800, color: "#C8102E", textTransform: "uppercase" }}>Ext Amt</span></div><div style={{ fontSize: F.body, fontWeight: 800, textAlign: "right", padding: "5px 0" }}>{fmt(item.qty * item.netPrice, s.currency)}</div></div>}
                      {/* Actions */}
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
            <p style={{ fontSize: F.body, color: "#999", marginBottom: 14, lineHeight: 1.5 }}>Use <strong>+/−</strong> buttons to zoom · <strong>Space+drag</strong> to pan · <strong>Click</strong> to place pin · <strong>Drag pin</strong> to move</p>
            {s.drawings.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "#D4D4D4" }}><Lay size={44} /><div style={{ marginTop: 12, fontSize: F.subheader, fontWeight: 700, color: "#BBB" }}>No drawings yet</div></div>}
            {s.drawings.map((drw, idx) => (
              <div key={drw.id} style={{ border: "1px solid #E5E5E5", borderRadius: 8, overflow: "visible", marginBottom: 14, borderLeft: "4px solid #C8102E" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: F.subheader, color: "#C8102E", textTransform: "uppercase" }}>Drawing #{idx + 1}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => dupDrawing(drw.id)} className="nv-btn" style={{ padding: "3px 8px", fontSize: 9 }}><Cpy size={11} /> Duplicate</button>
                    <button onClick={() => removeDrawing(drw.id)} className="nv-btn" style={{ padding: "3px 8px", fontSize: 9 }}><Trash size={11} /> Remove</button>
                  </div>
                </div>
                <div style={{ padding: 14 }}>
                  <div tabIndex={0} onPaste={handlePaste("drawing", drw.id, "image")}>
                    {drw.image ? <DrawingCanvas drw={drw} onAddPin={addPin} onUpdatePin={updatePin} onRemovePin={removePin} onMovePin={movePin} editingPin={editingPin} setEditingPin={setEditingPin} F={F}
                      canvasView={canvasViews[drw.id] || { zoom: 1, pan: { x: 0, y: 0 } }}
                      setCanvasView={v => setCanvasViews(prev => ({ ...prev, [drw.id]: v }))} />
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
            {s.drawings.map(d => d.totalPrice > 0 ? <SR key={d.id} l={d.title || "Drawing"} v={fmt(d.totalPrice, s.currency)} F={F} /> : null)}
            {calc.iS > 0 && <SR l="Items" v={fmt(calc.iS, s.currency)} F={F} />}<SR l="SUBTOTAL" v={fmt(calc.sub, s.currency)} b F={F} />
            {s.showExtras && <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}><span style={{ fontSize: F.body, color: "#777", fontWeight: 600 }}>FREIGHT</span><input type="number" min="0" step="0.01" value={s.freight} onChange={e => set("freight", Math.max(0, Number(e.target.value)))} style={{ width: 80, textAlign: "right", border: "1px solid #E5E5E5", borderRadius: 3, padding: "3px 5px", fontSize: F.body, fontFamily: "'Barlow',sans-serif", fontWeight: 700, outline: "none" }} /></div>
            </>}
            <TXR l="GST/HST" r={s.gstRate} onR={v => set("gstRate", v)} a={calc.gst} c={s.currency} F={F} />
            {s.showExtras && <TXR l="PST" r={s.pstRate} onR={v => set("pstRate", v)} a={calc.pst} c={s.currency} F={F} />}
            <div style={{ borderTop: "3px solid #C8102E", marginTop: 6, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: F.subheader + 2, textTransform: "uppercase" }}>TOTAL</span><span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: F.header * 0.8, color: "#C8102E" }}>{fmt(calc.total, s.currency)}</span></div>
            {s.showExtras && <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}><span style={{ fontSize: F.body, color: "#777", fontWeight: 600 }}>DEPOSIT</span><input type="number" min="0" step="0.01" value={s.deposit} onChange={e => set("deposit", Math.max(0, Number(e.target.value)))} style={{ width: 80, textAlign: "right", border: "1px solid #E5E5E5", borderRadius: 3, padding: "3px 5px", fontSize: F.body, fontFamily: "'Barlow',sans-serif", fontWeight: 700, outline: "none" }} /></div>
              <SR l="BALANCE" v={fmt(calc.bal, s.currency)} b ac F={F} />
            </>}
          </div>
        </div>
      </div>

      {/* PDF RENDER */}
      <div ref={printRef} style={{ position: "fixed", left: "-9999px", top: 0, width: 780, background: "#FFF", color: "#1A1A1A", fontFamily: "'Barlow',sans-serif", fontSize: 11, lineHeight: 1.4, visibility: "hidden" }}>
        <div style={{ background: "#C8102E", color: "#FFF", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}>{s.logo && <img src={s.logo} alt="" className="nv-logo" style={{ height: F.logoH || 36 }} />}<div style={{ fontSize: F.contact || 9, opacity: .8, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.contactInfo || "Tel: 780-452-1111 · Fax: 780-452-5775\n1001 Buckingham Dr | Sherwood Park, AB | T8H 0X5"}</div></div><div style={{ textAlign: "right" }}><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, letterSpacing: ".08em", textTransform: "uppercase" }}>{s.docTitle || "QUOTATION"}</div><div style={{ fontSize: 11, marginTop: 2 }}>{s.quoteLabel || "#:"} <strong>{s.quoteNumber}</strong> &nbsp; Date: <strong>{s.date}</strong></div></div></div>
        <div style={{ display: "flex", borderBottom: "1px solid #E5E5E5" }}><div style={{ flex: 1, padding: "12px 24px", borderRight: "1px solid #E5E5E5" }}><div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 3 }}>Prepared For:</div><div style={{ fontWeight: 700, fontSize: 12 }}>{s.preparedFor.name}</div><div>{s.preparedFor.address}</div><div>{s.preparedFor.cityProv}</div></div><div style={{ flex: 1, padding: "12px 24px" }}><div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "#C8102E", marginBottom: 3 }}>Ship To:</div><div style={{ fontWeight: 700, fontSize: 12 }}>{s.shipTo.name}</div><div>{s.shipTo.address}</div><div>{s.shipTo.cityProv}</div>{s.shipTo.phone && <div>Phone: {s.shipTo.phone}</div>}</div></div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ background: "#C8102E", color: "#FFF", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{["Customer #", ...(s.showCarrier !== false ? ["Carrier"] : []), "PO #", ...(s.showShipDate !== false ? ["Ship Date"] : []), "Salesperson"].map(h => <th key={h} style={{ padding: "5px 10px", textAlign: "left" }}>{h}</th>)}</tr></thead><tbody><tr style={{ borderBottom: "1px solid #E5E5E5", fontSize: 11 }}><td style={{ padding: "5px 10px" }}>{s.customerNo}</td>{s.showCarrier !== false && <td style={{ padding: "5px 10px" }}>{s.carrier}</td>}<td style={{ padding: "5px 10px" }}>{s.poNumber}</td>{s.showShipDate !== false && <td style={{ padding: "5px 10px" }}>{s.shipDate}</td>}<td style={{ padding: "5px 10px" }}>{s.salesperson}</td></tr></tbody></table>
        {s.drawings.length > 0 && <div style={{ padding: "16px 24px" }}>{s.drawings.map((d, i) => <div key={d.id} style={{ marginBottom: 20, pageBreakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #C8102E", paddingBottom: 4, marginBottom: 6 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>{d.title || `Drawing #${i + 1}`}</div>
            {s.priceMode !== 'hidden' && <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 16, color: "#C8102E" }}>Total: {fmt(d.totalPrice || 0, s.currency)}</div>}
          </div>
          {d.image && <div style={{ position: "relative", display: "inline-block" }}>
            <img src={d.image} alt="" style={{ maxWidth: 730, maxHeight: 340, display: "block", border: "1px solid #E5E5E5", borderRadius: 4 }} />
            {/* Pins overlay — positioned as % of the image element */}
            <div style={{ position: "absolute", inset: 0 }}>
              {(d.pins || []).map(p => <div key={p.id} style={{ position: "absolute", left: `${p.xPct}%`, top: `${p.yPct}%` }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#C8102E", border: "2px solid #FFF", transform: "translate(-50%,-50%)", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
                <div style={{ position: "absolute", left: "50%", top: 10, transform: "translateX(-50%)", textAlign: "left", whiteSpace: "pre-wrap", maxWidth: 180 }}>
                  <div style={{ background: "rgba(200,16,46,.9)", color: "#FFF", padding: "2px 6px", borderRadius: 3, fontSize: 8, fontWeight: 700, whiteSpace: "pre-wrap" }}>{p.main}</div>
                  {p.sub && <div style={{ background: "rgba(0,0,0,.7)", color: "#FFF", padding: "1px 4px", borderRadius: 2, fontSize: 7, marginTop: 1, whiteSpace: "pre-wrap" }}>{p.sub}</div>}
                </div>
              </div>)}
            </div>
          </div>}
          {d.notes && <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>NOTE: {d.notes}</div>}
        </div>)}</div>}
        {s.items.some(i => i.itemNo || i.description) && <table style={{ width: "100%", borderCollapse: "collapse", margin: "0 0 12px", fontSize: 10 }}><thead><tr style={{ background: "#C8102E", color: "#FFF", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}><th style={{ padding: "5px 8px", textAlign: "left", width: 22 }}>LN</th><th style={{ padding: "5px 6px", width: 50 }}>Img</th><th style={{ padding: "5px 8px" }}>Item No</th><th style={{ padding: "5px 6px", textAlign: "center", width: 28 }}>Qty</th><th style={{ padding: "5px 6px", width: 28 }}>UOM</th><th style={{ padding: "5px 8px" }}>Description</th>{s.priceMode === 'both' && <th style={{ padding: "5px 8px", textAlign: "right" }}>Net Price</th>}{s.priceMode !== 'hidden' && <th style={{ padding: "5px 8px", textAlign: "right" }}>Ext Amt</th>}</tr></thead><tbody>{s.items.map((it, i) => <tr key={it.id} style={{ borderBottom: "1px solid #EEE", background: i % 2 === 0 ? "#FFF" : "#FAFAFA" }}><td style={{ padding: "5px 8px", color: "#999" }}>{i + 1}</td><td style={{ padding: "3px 4px" }}>{it.image && <img src={it.image} alt="" style={{ width: 46, height: 30, objectFit: "contain", borderRadius: 2 }} />}</td><td style={{ padding: "5px 8px", fontWeight: 600 }}>{it.itemNo}</td><td style={{ padding: "5px 6px", textAlign: "center" }}>{it.qty}</td><td style={{ padding: "5px 6px" }}>{it.uom}</td><td style={{ padding: "5px 8px", whiteSpace: "pre-wrap", lineHeight: 1.35 }}>{it.description}</td>{s.priceMode === 'both' && <td style={{ padding: "5px 8px", textAlign: "right" }}>{fmt(it.netPrice, s.currency)}</td>}{s.priceMode !== 'hidden' && <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700 }}>{fmt(it.qty * it.netPrice, s.currency)}</td>}</tr>)}</tbody></table>}
        <div style={{ display: "flex", padding: "0 24px 20px", gap: 20 }}><div style={{ flex: 1, fontSize: 9, color: "#777", lineHeight: 1.5 }}>{s.notes && <><div style={{ marginBottom: 4 }}><strong style={{ color: "#333", fontSize: 10 }}>NOTE:</strong></div><div style={{ marginBottom: 8 }}>{s.notes}</div></>}{s.termsNotes && <div style={{ whiteSpace: "pre-wrap", borderTop: "1px solid #EEE", paddingTop: 6, marginTop: 4 }}>{s.termsNotes}</div>}</div><div style={{ width: 220 }}>
          <PR l="SUBTOTAL" v={fmt(calc.sub, s.currency)} b />
          {s.showExtras && <PR l="FREIGHT" v={fmt(calc.fr, s.currency)} />}
          <PR l="GST/HST" v={fmt(calc.gst, s.currency)} />
          {s.showExtras && <PR l="PST" v={fmt(calc.pst, s.currency)} />}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", borderTop: "3px solid #C8102E", marginTop: 4, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15 }}><span>TOTAL</span><span style={{ color: "#C8102E" }}>{fmt(calc.total, s.currency)}</span></div>
          {s.showExtras && <><PR l="DEPOSIT" v={fmt(s.deposit, s.currency)} /><PR l="BALANCE" v={fmt(calc.bal, s.currency)} b /></>}
        </div></div>
      </div>
    </div>
  );
}

/* Helpers */
function SR({ l, v, b, ac, F }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0", fontSize: b ? (F?.subheader || 13) : (F?.body || 12), fontWeight: b ? 800 : 600, color: ac ? "#C8102E" : b ? "#1A1A1A" : "#777", fontFamily: b ? "'Barlow Condensed',sans-serif" : "'Barlow',sans-serif", textTransform: b ? "uppercase" : "none" }}><span>{l}</span><span style={{ fontWeight: 800, fontSize: b ? (ac ? (F?.subheader || 14) + 4 : (F?.subheader || 14)) : (F?.body || 12) }}>{v}</span></div>; }
function TXR({ l, r, onR, a, c, F }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}><span style={{ fontSize: F?.body || 12, color: "#777", fontWeight: 600 }}>{l}</span><div style={{ display: "flex", alignItems: "center", gap: 3 }}><input type="number" min="0" max="100" step="0.01" value={r} onChange={e => onR(Math.max(0, Number(e.target.value)))} style={{ width: 40, textAlign: "right", border: "1px solid #E5E5E5", borderRadius: 3, padding: "2px 3px", fontSize: F?.small || 11, fontFamily: "'Barlow',sans-serif", outline: "none", fontWeight: 600 }} /><span style={{ fontSize: F?.small || 10, color: "#AAA", fontWeight: 600 }}>%</span><span style={{ fontWeight: 700, fontSize: F?.body || 12, minWidth: 65, textAlign: "right" }}>{fmt(a, c)}</span></div></div>; }
function PR({ l, v, b }) { return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontWeight: b ? 800 : 500, fontSize: b ? 12 : 11, color: b ? "#1A1A1A" : "#666" }}><span>{l}</span><span>{v}</span></div>; }
