/**
 * Shared helpers for thermal / pocket print slips.
 * Barcode via JsBarcode CDN (no npm dep).
 */

export const POS_MAJOR_SERVICES = [
  'Digital Printing',
  'Offset Printing',
  'Large Format / Flex',
  'Visiting Cards',
  'Brochures & Flyers',
  'Photo Copy & Documents',
  'NADRA Services',
  'Designing / Artwork',
  'Lamination & Binding',
  'PALS Fee & Information',
];

export function moneyPKR(n) {
  return Number(n || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function openPrintWindow(html, { width = 360, height = 640 } = {}) {
  const win = window.open('', '_blank', `width=${width},height=${height}`);
  if (!win) return { ok: false, reason: 'popup_blocked' };
  win.document.write(html);
  win.document.close();
  return { ok: true, win };
}

/**
 * Print HTML without a popup tab — hidden iframe (works when popups are blocked).
 * Prefer this for payment slips after async API calls.
 */
export function printHtml(html, { fallbackPopup = true, width = 360, height = 640, autoPrint = false } = {}) {
  try {
    if (typeof document === 'undefined') {
      return fallbackPopup ? openPrintWindow(html, { width, height }) : { ok: false, reason: 'no_document' };
    }
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'print-frame');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      return fallbackPopup ? openPrintWindow(html, { width, height }) : { ok: false, reason: 'iframe_unavailable' };
    }
    doc.open();
    doc.write(html);
    doc.close();
    if (autoPrint) {
      const trigger = () => {
        try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch { /* ignore */ }
      };
      iframe.onload = () => setTimeout(trigger, 350);
      setTimeout(trigger, 700);
    }
    // Cleanup after print dialog (html may also call print via printOnLoadScript)
    setTimeout(() => {
      try { iframe.remove(); } catch { /* ignore */ }
    }, 8000);
    return { ok: true, method: 'iframe' };
  } catch {
    return fallbackPopup ? openPrintWindow(html, { width, height }) : { ok: false, reason: 'print_failed' };
  }
}

/** CODE128 barcode block — loads JsBarcode then prints. */
export function barcodeBlock(code, { id = 'barcode', height = 36 } = {}) {
  const safe = String(code || 'AMZ').replace(/[<>&"']/g, '');
  return `
    <div class="barcode-wrap">
      <svg id="${id}"></svg>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
    <script>
      (function(){
        function draw(){
          try {
            if (window.JsBarcode) {
              JsBarcode("#${id}", ${JSON.stringify(safe)}, {
                format: "CODE128",
                width: 1.15,
                height: ${height},
                displayValue: true,
                fontSize: 10,
                margin: 0,
                background: "#ffffff",
                lineColor: "#000000"
              });
            }
          } catch (e) {}
        }
        if (document.readyState === "complete") draw();
        else window.addEventListener("load", draw);
        setTimeout(draw, 200);
      })();
    <\/script>
  `;
}

/** ~1 inch printed QR on thermal / A5 / A4 slips. */
export const SLIP_QR_CSS = `
  .qr-row { display:flex; justify-content:space-between; align-items:flex-start; gap:3mm; margin:8px 0 4px; }
  .qr-box { flex:1; text-align:center; color:#000; }
  .qr-box img { width:25.4mm; height:25.4mm; display:block; margin:0 auto 3px; }
  .qr-box span { font-size:10px; font-weight:800; display:block; letter-spacing:0.04em; text-transform:uppercase; color:#000; }
`;

export function slipQrRowHtml(webQr, verifyQr, {
  webLabel = 'Website',
  verifyLabel = 'Scan to verify',
} = {}) {
  if (!webQr && !verifyQr) return '';
  return `<div class="qr-row">
    ${webQr ? `<div class="qr-box"><img src="${webQr}" alt="Website QR" /><span>${webLabel}</span></div>` : ''}
    ${verifyQr ? `<div class="qr-box"><img src="${verifyQr}" alt="Verify QR" /><span>${verifyLabel}</span></div>` : ''}
  </div>`;
}

export function printOnLoadScript(delay = 450) {
  return `
    <script>
      window.onload = function () {
        setTimeout(function () {
          window.print();
          setTimeout(function () { window.close(); }, 400);
        }, ${delay});
      };
    <\/script>
  `;
}

/** Safe filename segment for PDF / print downloads. */
export function slugFilePart(value, maxLen = 36) {
  return String(value || '')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen) || '';
}

/** e.g. Invoice-Ali-Hassan-ORD-2026-001 */
export function documentFileName({
  docType = 'Document',
  customerName = '',
  orderNumber = '',
  invoiceNumber = '',
  fallback = '',
} = {}) {
  const type = slugFilePart(docType, 24) || 'Document';
  const name = slugFilePart(customerName, 32) || 'Customer';
  const ref = slugFilePart(orderNumber || invoiceNumber || fallback, 32) || 'ref';
  return `${type}-${name}-${ref}`;
}

/** Sets document.title before print so Save as PDF uses a useful name. */
export function printWithDocumentTitle(title, printFn = () => window.print()) {
  if (typeof document === 'undefined') {
    printFn();
    return;
  }
  const prev = document.title;
  const safe = String(title || 'Document').trim() || 'Document';
  document.title = safe;
  const restore = () => {
    document.title = prev;
  };
  window.addEventListener('afterprint', restore, { once: true });
  setTimeout(restore, 5000);
  printFn();
}

/** Print only a node (A4 invoice) — ERP chrome is not included. */
export function printIsolatedNode(nodeOrId, title = 'Document') {
  const node = typeof nodeOrId === 'string' ? document.getElementById(nodeOrId) : nodeOrId;
  if (!node) {
    printWithDocumentTitle(title);
    return { ok: false, reason: 'missing_node' };
  }
  const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')]
    .map((el) => el.outerHTML)
    .join('\n');
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${String(title).replace(/[<>&]/g, '')}</title>
  ${styles}
  <style>
    @page { size: A4 portrait; margin: 10mm 9mm 12mm 9mm; }
    html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
    .no-print { display: none !important; }
    nav, aside, header { display: none !important; }
    .invoice-container { box-shadow: none !important; max-width: 100% !important; margin: 0 !important; }
  </style>
</head>
<body>
  ${node.outerHTML}
  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 280);
    };
  <\/script>
</body>
</html>`;
  return printHtml(html, { fallbackPopup: true, width: 900, height: 1200 });
}
