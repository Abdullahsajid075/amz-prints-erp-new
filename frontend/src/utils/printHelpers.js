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
export function printHtml(html, { fallbackPopup = true, width = 360, height = 640 } = {}) {
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
