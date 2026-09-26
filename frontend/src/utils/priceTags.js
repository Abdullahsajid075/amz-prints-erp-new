import { printHtml, openPrintWindow, printOnLoadScript, documentFileName } from '@/utils/printHelpers';
import { formatCurrency } from '@/utils/helpers';
import { isServiceItem } from '@/utils/inventoryTrack';

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
          name,
          price: sellingPrice(product, variation),
          sku: variation.sku || product.sku || product.id || '',
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
      name: product.name || 'Product',
      price: sellingPrice(product),
      sku: product.sku || product.id || '',
      copies,
    });
  });
  return tags;
}

export function buildPriceTagHtml(labels, {
  company = {},
  widthMm = 40,
  heightMm = 25,
  marginMm = 2,
  showBarcode = true,
} = {}) {
  const cards = labels.map((row) => `
    <article class="tag">
      <p class="co">${escapeHtml(company.name || 'AMZ Prints')}</p>
      <h3>${escapeHtml(row.name)}</h3>
      <p class="price">${escapeHtml(formatCurrency(row.price))}</p>
      ${showBarcode && row.sku ? `<p class="sku">${escapeHtml(row.sku)}</p>` : ''}
    </article>
  `).join('');

  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>${escapeHtml(documentFileName({ docType: 'PriceTags', customerName: company.name }))}</title>
    <style>
      @page { size: ${Number(widthMm) || 40}mm ${Number(heightMm) || 25}mm; margin: ${Number(marginMm) || 2}mm; }
      * { box-sizing: border-box; }
      html, body, .tag, .tag * {
        color: #000 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { margin: 0; font-family: Arial, Helvetica, sans-serif; }
      .tag {
        width: ${Math.max(20, (Number(widthMm) || 40) - (Number(marginMm) || 2) * 2)}mm;
        height: ${Math.max(14, (Number(heightMm) || 25) - (Number(marginMm) || 2) * 2)}mm;
        padding: 1.5mm;
        page-break-after: always;
        border: 0.4mm solid #000;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .co { font-size: 7px; letter-spacing: .08em; text-transform: uppercase; margin: 0 0 1mm; font-weight: 700; }
      h3 { font-size: 10px; margin: 0; line-height: 1.15; font-weight: 800; }
      .price { font-size: 14px; font-weight: 900; margin: 1mm 0 0; }
      .sku { font-size: 8px; font-family: "Courier New", monospace; margin: 1mm 0 0; letter-spacing: 0.04em; }
    </style>
  </head><body>${cards}${printOnLoadScript(400)}</body></html>`;
}

export function printPriceTags(products, {
  company = {},
  widthMm = 40,
  heightMm = 25,
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
  const popup = openPrintWindow(html, { width: 420, height: 320 });
  if (popup.ok) return { ...popup, copies: labels.length, ink: 'black' };
  return { ...printHtml(html, { width: 420, height: 320, fallbackPopup: false, autoPrint: true }), copies: labels.length, ink: 'black' };
}
