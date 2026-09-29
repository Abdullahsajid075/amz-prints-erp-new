import { printHtml, openPrintWindow, printOnLoadScript, documentFileName } from './printHelpers.js';
import { formatCurrency } from './helpers.js';
import { isServiceItem } from './inventoryTrack.js';
import { productBarcodeCode } from './productBarcode.js';

export { productBarcodeCode };

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sellingPrice(product, variation) {
  if (variation && variation.price != null && variation.price !== '') {
    const n = Number(variation.price);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const sale = Number(product.salePrice || product.sale_price || 0);
  if (sale > 0) return sale;
  return Number(product.basePrice ?? product.rate ?? 0) || 0;
}

export function collectPriceTagCopies(products = [], { allowZeroStock = false } = {}) {
  const tags = [];
  (Array.isArray(products) ? products : []).forEach((product) => {
    if (!product || isServiceItem(product)) return;
    const variations = Array.isArray(product.variations) ? product.variations : [];
    if (variations.length) {
      variations.forEach((variation) => {
        const qty = Math.max(0, Math.floor(Number(variation.stock ?? 0) || 0));
        const copies = qty > 0 ? qty : (allowZeroStock ? 1 : 0);
        if (!(copies > 0)) return;
        const name = [product.name, variation.name || variation.size || variation.color].filter(Boolean).join(' · ');
        tags.push({
          productId: product.id,
          variationId: variation.id || '',
          name,
          price: sellingPrice(product, variation),
          sku: variation.sku || product.sku || product.id || '',
          barcode: productBarcodeCode(product, variation),
          copies,
        });
      });
      return;
    }
    const qty = Math.max(0, Math.floor(Number(product.stock ?? 0) || 0));
    const copies = qty > 0 ? qty : (allowZeroStock ? 1 : 0);
    if (!(copies > 0)) return;
    tags.push({
      productId: product.id,
      variationId: '',
      name: product.name || 'Product',
      price: sellingPrice(product),
      sku: product.sku || product.id || '',
      barcode: productBarcodeCode(product),
      copies,
    });
  });
  return tags;
}

function barcodeDrawScript(entries) {
  const draws = entries.map((row) => (
    `try { JsBarcode("#${row.id}", ${JSON.stringify(row.code)}, { format: "CODE128", width: 1.05, height: ${row.height}, displayValue: true, fontSize: 9, margin: 0, background: "#ffffff", lineColor: "#000000" }); } catch (e) {}`
  )).join('\n');
  return `
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
    <script>
      (function () {
        function drawAll() {
          if (!window.JsBarcode) return;
          ${draws}
        }
        if (document.readyState === "complete") drawAll();
        else window.addEventListener("load", drawAll);
        setTimeout(drawAll, 180);
        setTimeout(drawAll, 450);
      })();
    <\/script>
  `;
}

export function buildPriceTagHtml(labels, {
  company = {},
  widthMm = 80,
  heightMm = 40,
  marginMm = 2,
  showBarcode = true,
} = {}) {
  const width = Number(widthMm) || 80;
  const height = Number(heightMm) || 40;
  const margin = Number(marginMm);
  const pad = Number.isFinite(margin) ? margin : 2;
  const barcodeHeight = Math.max(22, Math.min(36, Math.round(height * 0.7)));
  const entries = [];
  const cards = labels.map((row, i) => {
    const id = `bc_${i}`;
    const code = String(row.barcode || row.sku || 'AMZ');
    if (showBarcode !== false) entries.push({ id, code, height: barcodeHeight });
    return `
    <article class="tag">
      <p class="co">${escapeHtml(company.name || 'AMZ Prints')}</p>
      <h3>${escapeHtml(row.name)}</h3>
      <p class="price">${escapeHtml(formatCurrency(row.price))}</p>
      ${showBarcode !== false ? `<div class="barcode-wrap"><svg id="${id}"></svg></div>` : (row.sku ? `<p class="sku">${escapeHtml(row.sku)}</p>` : '')}
    </article>`;
  }).join('');

  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>${escapeHtml(documentFileName({ docType: 'PosStickers', customerName: company.name }))}</title>
    <style>
      @page { size: ${width}mm ${height}mm; margin: ${pad}mm; }
      * { box-sizing: border-box; }
      html, body, .tag, .tag * {
        color: #000 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { margin: 0; font-family: Arial, Helvetica, sans-serif; }
      .tag {
        width: ${Math.max(20, width - pad * 2)}mm;
        height: ${Math.max(18, height - pad * 2)}mm;
        padding: 1.2mm 1.5mm;
        page-break-after: always;
        break-after: page;
        border: 0.35mm solid #000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: stretch;
      }
      .co { font-size: 7px; letter-spacing: .08em; text-transform: uppercase; margin: 0 0 0.6mm; font-weight: 700; }
      h3 { font-size: 11px; margin: 0; line-height: 1.12; font-weight: 800; }
      .price { font-size: 13px; font-weight: 900; margin: 0.6mm 0 0.8mm; }
      .sku { font-size: 8px; font-family: "Courier New", monospace; margin: 1mm 0 0; letter-spacing: 0.04em; }
      .barcode-wrap { text-align: center; margin-top: 0.4mm; }
      .barcode-wrap svg { max-width: 100%; height: auto; }
    </style>
  </head><body>${cards}${showBarcode !== false ? barcodeDrawScript(entries) : ''}${printOnLoadScript(700)}</body></html>`;
}

export function printPriceTags(products, {
  company = {},
  widthMm = 80,
  heightMm = 40,
  marginMm = 2,
  showBarcode = true,
  allowZeroStock = false,
} = {}) {
  const rows = collectPriceTagCopies(products, { allowZeroStock });
  const labels = [];
  rows.forEach((row) => {
    for (let i = 0; i < row.copies; i += 1) labels.push(row);
  });
  if (!labels.length) return { ok: false, reason: 'no_stock' };

  const html = buildPriceTagHtml(labels, { company, widthMm, heightMm, marginMm, showBarcode });
  const popup = openPrintWindow(html, { width: 420, height: 360 });
  if (popup.ok) return { ...popup, copies: labels.length, ink: 'black' };
  return { ...printHtml(html, { width: 420, height: 360, fallbackPopup: false, autoPrint: true }), copies: labels.length, ink: 'black' };
}
