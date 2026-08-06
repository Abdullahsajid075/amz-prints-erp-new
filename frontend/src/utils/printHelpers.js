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
