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
export async function printOrderBookSlip(order = {}, { company = {}, includePayment = false } = {}) {
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
  const products = Array.isArray(order.products) ? order.products : [];
  const total = products.reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.rate) || 0), 0)
    || Number(order.totalAmount || 0);
  const advance = Number(order.advancePayment || 0);
  const balance = Math.max(0, Number(order.balanceAmount != null ? order.balanceAmount : (total - advance)));
  const showPay = includePayment || advance > 0;
  const rows = products
    .map((p) => {
      const extra = [p.variationName, p.size, p.material].filter(Boolean).join(' · ');
      const amount = (Number(p.quantity) || 0) * (Number(p.rate) || 0);
      return `<tr>
        <td>${escapeHtml(p.name || '')}${extra ? `<div class="extra">${escapeHtml(extra)}</div>` : ''}</td>
        <td class="r">${escapeHtml(p.quantity || 0)}</td>
        ${showPay ? `<td class="r">${escapeHtml(Number(p.rate || 0).toFixed(0))}</td><td class="r">${escapeHtml(amount.toFixed(0))}</td>` : ''}
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
    <div class="banner">${showPay ? 'ORDER + ADVANCE' : 'ORDER BOOKED'}</div>
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
        <thead><tr><th>Item</th><th class="r">Qty</th>${showPay ? '<th class="r">Rate</th><th class="r">Amt</th>' : ''}</tr></thead>
        <tbody>${rows || `<tr><td colspan="${showPay ? 4 : 2}">No items</td></tr>`}</tbody>
      </table>
      ${showPay ? `<div class="meta">Total: <span>${escapeHtml(total.toFixed(0))}</span></div>
      <div class="meta">Advance received: <span>${escapeHtml(advance.toFixed(0))}</span></div>
      <div class="meta">Balance: <span>${escapeHtml(balance.toFixed(0))}</span></div>` : ''}
      ${qrs.html}
      ${barcodeBlock(tracking || code || 'AMZ', { height: 34 })}
      <div class="thanks">Scan QR to track this order</div>
      <div class="foot">${showPay ? 'Customer copy · Combined order + payment' : 'Customer copy · No payment on this slip'}</div>
    </div>
    ${printOnLoadScript(700)}
    </body></html>`;

  return printHtml(html, { width: 360, height: 860, fallbackPopup: true });
}
