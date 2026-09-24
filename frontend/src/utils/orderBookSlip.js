import { barcodeBlock, printHtml, printOnLoadScript, documentFileName, SLIP_QR_CSS } from '@/utils/printHelpers';
import { buildSlipQrs, slipWebsiteUrl, verifyUrlForSlip } from '@/utils/slipQr';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Colour 80mm POS-printer slip for a booked order.
 * Tracking + website/verify QRs. No rates, totals, or payment.
 */
export async function printOrderBookSlip(order = {}, { company = {} } = {}) {
  const website = slipWebsiteUrl(company);
  const code = order.orderId || order.id || '';
  const tracking = order.trackingNumber || code;
  const printTitle = documentFileName({
    docType: 'OrderSlip',
    customerName: order.customerName,
    orderNumber: code || tracking,
  });
  const verifyUrl = verifyUrlForSlip({
    shareToken: order.shareToken,
    orderId: code,
    trackingNumber: tracking,
    code: tracking || code,
  });
  const qrs = await buildSlipQrs({ company, verifyUrl });
  const rows = (Array.isArray(order.products) ? order.products : [])
    .map((p) => {
      const extra = [p.size, p.material].filter(Boolean).join(' · ');
      return `<tr>
        <td>${escapeHtml(p.name || '')}${extra ? `<div class="extra">${escapeHtml(extra)}</div>` : ''}</td>
        <td class="r">${escapeHtml(p.quantity || 0)}</td>
      </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html><html><head><title>${escapeHtml(printTitle)}</title>
    <style>
      @page { size: 80mm auto; margin: 2.5mm; }
      * { box-sizing: border-box; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        width: 72mm;
        margin: 0 auto;
        color: #0b1b33;
        font-size: 13px;
        background: #fff;
      }
      .hero {
        background: #ff6d00;
        color: #fff;
        text-align: center;
        padding: 8px 6px 7px;
        border-radius: 6px 6px 0 0;
      }
      .hero h1 { margin: 0; font-size: 15px; font-weight: 800; letter-spacing: 0.02em; color: #fff; }
      .hero p { margin: 3px 0 0; font-size: 10px; font-weight: 700; color: #fff; }
      .banner {
        background: #0747a3;
        color: #fff;
        text-align: center;
        font-weight: 800;
        letter-spacing: 0.16em;
        font-size: 13px;
        padding: 7px 4px;
      }
      .pad { padding: 8px 4px 4px; }
      .track {
        text-align: center;
        border: 2px solid #ff6d00;
        border-radius: 6px;
        padding: 6px 4px;
        margin: 6px 0;
        background: #fff7f0;
      }
      .track .lbl { font-size: 9px; font-weight: 800; letter-spacing: 0.12em; color: #ff6d00; text-transform: uppercase; }
      .track .val { font-size: 16px; font-weight: 800; color: #0747a3; margin-top: 2px; word-break: break-all; }
      .meta { font-size: 12px; font-weight: 700; margin: 3px 0; color: #0b1b33; }
      .meta span { color: #0747a3; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; }
      th { text-align: left; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #0747a3; border-bottom: 2px solid #ff6d00; padding: 3px 0; }
      td { padding: 4px 0; font-size: 12px; font-weight: 700; border-bottom: 1px dashed #ffd0b0; }
      .r { text-align: right; }
      .extra { font-size: 10px; font-weight: 600; color: #0747a3; }
      ${SLIP_QR_CSS}
      .barcode-wrap { text-align: center; margin-top: 8px; }
      .foot { text-align: center; font-size: 11px; font-weight: 800; color: #0747a3; margin-top: 6px; }
      .thanks { text-align: center; font-size: 12px; font-weight: 800; color: #ff6d00; margin-top: 8px; }
    </style></head><body>
    <div class="hero">
      <h1>${escapeHtml(company.name || 'Amazon Printing Services')}</h1>
      <p>${escapeHtml(company.address || 'King Road, Mandi Bahauddin')}</p>
      <p>${escapeHtml(company.phone || '')} · ${escapeHtml(website.replace(/^https?:\/\//, ''))}</p>
    </div>
    <div class="banner">ORDER BOOKED</div>
    <div class="pad">
      <div class="track">
        <div class="lbl">Tracking number</div>
        <div class="val">${escapeHtml(tracking || '—')}</div>
      </div>
      <div class="meta">Order: <span>${escapeHtml(code || '—')}</span></div>
      <div class="meta">Customer: <span>${escapeHtml(order.customerName || 'Walk-in')}</span></div>
      ${order.customerPhone ? `<div class="meta">Phone: <span>${escapeHtml(order.customerPhone)}</span></div>` : ''}
      <div class="meta">Booked: <span>${escapeHtml(order.date || new Date().toISOString().slice(0, 10))}</span></div>
      ${order.deliveryDate ? `<div class="meta">Delivery: <span>${escapeHtml(order.deliveryDate)}</span></div>` : ''}
      <table>
        <thead><tr><th>Item</th><th class="r">Qty</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="2">No items</td></tr>'}</tbody>
      </table>
      ${qrs.html}
      ${barcodeBlock(tracking || code || 'AMZ', { height: 34 })}
      <div class="thanks">Scan QR to track this order</div>
      <div class="foot">Customer copy · No payment on this slip</div>
    </div>
    ${printOnLoadScript(700)}
    </body></html>`;

  return printHtml(html, { width: 360, height: 860, fallbackPopup: true });
}
