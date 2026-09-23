import { formatCurrency } from '@/utils/helpers';
import { barcodeBlock, printHtml, printOnLoadScript, POS_MAJOR_SERVICES, documentFileName, SLIP_QR_CSS } from '@/utils/printHelpers';
import { buildSlipQrs, slipWebsiteUrl, verifyUrlForSlip } from '@/utils/slipQr';
import { mergePosSettings } from '@/utils/moduleSettings';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function saleFromPosOrder(order = {}) {
  const remarks = String(order.remarks || order.notes || '');
  const methodFromRemarks = remarks.split('·')[1] ? String(remarks.split('·')[1]).trim() : '';
  const recvMatch = remarks.match(/Recv\s+([\d.]+)/i);
  const changeMatch = remarks.match(/Change\s+([\d.]+)/i);
  const products = Array.isArray(order.products) ? order.products : [];
  const total = Number(order.totalAmount || order.total || 0)
    || products.reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.rate) || 0), 0);
  return {
    ...order,
    products,
    totalAmount: total,
    subtotal: Number(order.subtotal) || total,
    discount: Number(order.discount) || 0,
    receivedAmount: order.receivedAmount != null
      ? Number(order.receivedAmount)
      : (recvMatch ? Number(recvMatch[1]) : Number(order.advancePayment || order.paidAmount || total)),
    changeBack: order.changeBack != null
      ? Number(order.changeBack)
      : (changeMatch ? Number(changeMatch[1]) : 0),
    paymentMethod: order.paymentMethod || methodFromRemarks || 'Cash',
    customerName: order.customerName || 'Walk-in',
    customerPhone: order.customerPhone || '',
    date: order.date || '',
    orderId: order.orderId || order.id || '',
  };
}

export function buildPosWhatsAppReceipt(sale, company = {}) {
  const companyName = company?.name || 'Amazon Printing Services';
  const lines = (sale.products || [])
    .map((p) => `• ${p.name} × ${p.quantity} = ${formatCurrency((Number(p.quantity) || 0) * (Number(p.rate) || 0))}`)
    .join('\n');
  return (
    `*${companyName} — POS Receipt*\n`
    + `Sale: *${sale.orderId || sale.id}*\n`
    + `Customer: ${sale.customerName || 'Walk-in'}\n`
    + (lines ? `${lines}\n` : '')
    + (Number(sale.discount) > 0 ? `Discount: -${formatCurrency(sale.discount)}\n` : '')
    + `Total: *${formatCurrency(sale.totalAmount)}*\n`
    + `Received: ${formatCurrency(sale.receivedAmount != null ? sale.receivedAmount : sale.totalAmount)}\n`
    + `Change: ${formatCurrency(sale.changeBack != null ? sale.changeBack : 0)}\n`
    + `Pay: ${sale.paymentMethod || 'Cash'}\n`
    + `\nThank you!`
  );
}

/**
 * 80mm POS thermal slip — all black, ~1-inch website + verify QRs,
 * sent to the default printer via hidden iframe + window.print().
 */
export async function printPosSlip(sale, { company = {}, posCfg } = {}) {
  const cfg = posCfg || mergePosSettings({});
  const website = slipWebsiteUrl(company);
  const logoHtml = company.logo
    ? `<img src="${company.logo}" alt="logo" class="logo" />`
    : '';
  const code = sale.orderId || sale.id || `POS-${Date.now().toString().slice(-6)}`;
  const publicInvoice = String(sale.invoiceUrl || '').includes('/invoice/')
    ? sale.invoiceUrl
    : '';
  const invoiceUrl = sale.shareToken
    ? verifyUrlForSlip({ shareToken: sale.shareToken })
    : (publicInvoice || verifyUrlForSlip({
      orderId: code,
      trackingNumber: sale.trackingNumber,
      reference: sale.reference,
      code,
    }));
  const printTitle = documentFileName({
    docType: 'POS',
    customerName: sale.customerName,
    orderNumber: code,
  });
  const rows = (sale.products || [])
    .map(
      (p) =>
        `<tr><td>${escapeHtml(p.name)}</td><td class="r">${escapeHtml(p.quantity)}</td><td class="r">${formatCurrency(p.rate)}</td><td class="r">${formatCurrency((Number(p.quantity) || 0) * (Number(p.rate) || 0))}</td></tr>`
    )
    .join('');
  const services = (cfg.slipServices || POS_MAJOR_SERVICES)
    .map((s) => `<div class="svc-card">${escapeHtml(s)}</div>`)
    .join('');
  const qrs = await buildSlipQrs({ company, verifyUrl: invoiceUrl });
  const html = `<!DOCTYPE html><html><head><title>${escapeHtml(printTitle)}</title>
      <style>
        @page { size: 80mm auto; margin: 3mm; }
        * { box-sizing: border-box; color: #000 !important; }
        body { font-family: Arial, Helvetica, sans-serif; width: 72mm; margin: 0; color: #000; font-size: 13px; }
        .logo { height:64px; max-width:180px; display:block; margin:0 auto 4px; object-fit:contain; filter: grayscale(1) contrast(1.15); }
        h1 { font-size: 16px; margin: 0; text-align: center; font-weight: 800; letter-spacing:0.01em; }
        .tag { text-align: center; font-size: 11px; margin-top: 3px; font-weight: 600; }
        .center { text-align: center; }
        .title { text-align:center; font-weight:800; letter-spacing:0.14em; font-size:14px;
          border-top:2px solid #000; border-bottom:2px solid #000; padding:6px 0; margin:8px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        td, th { padding: 3px 0; font-size: 12px; }
        th { border-bottom: 2px solid #000; text-align:left; font-size: 12px; }
        .r { text-align: right; }
        hr { border: none; border-top: 1.5px dashed #000; margin: 8px 0; }
        .total { font-size: 16px; font-weight: 800; display:flex; justify-content:space-between; }
        .meta { font-size: 12px; font-weight: 600; margin: 2px 0; }
        ${SLIP_QR_CSS}
        .svc-grid { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
        .svc-card { border:1.5px solid #000; border-radius:4px; padding:4px 5px; font-size:10px; font-weight:800; width:calc(50% - 3px); box-sizing:border-box; }
        .powered { text-align:center; font-size:10px; font-weight:800; letter-spacing:0.04em; margin-top:10px; }
        .barcode-wrap { text-align:center; margin-top:8px; }
      </style></head><body>
      ${logoHtml}
      <h1>${escapeHtml(company.name || 'Amazon Printing Services')}</h1>
      <div class="tag">${escapeHtml(company.address || 'King Road, Mandi Bahauddin')}</div>
      <div class="center" style="font-size:11px;margin-top:3px;font-weight:700">${escapeHtml(company.phone || '')} · ${escapeHtml(website.replace(/^https?:\/\//, ''))}</div>
      <div class="title">POS RECEIPT</div>
      <div class="meta">Sale: <strong>${escapeHtml(code)}</strong></div>
      <div class="meta">Customer: ${escapeHtml(sale.customerName || 'Walk-in')}</div>
      <div class="meta">Phone: ${escapeHtml(sale.customerPhone || '—')}</div>
      <div class="meta">Pay: ${escapeHtml(sale.paymentMethod || 'Cash')}</div>
      <div class="meta">Date: ${escapeHtml(sale.date || new Date().toLocaleString())}</div>
      <hr />
      <table>
        <thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amt</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <hr />
      ${Number(sale.subtotal) > 0 && Number(sale.discount) > 0
        ? `<div class="total" style="font-size:13px;font-weight:700"><span>SUBTOTAL</span><span>${formatCurrency(sale.subtotal)}</span></div>
           <div class="total" style="font-size:13px;font-weight:700"><span>DISCOUNT</span><span>-${formatCurrency(sale.discount)}</span></div>`
        : ''}
      <div class="total"><span>TOTAL</span><span>${formatCurrency(sale.totalAmount)}</span></div>
      <div class="total" style="font-size:13px;margin-top:3px"><span>RECEIVED</span><span>${formatCurrency(sale.receivedAmount != null ? sale.receivedAmount : sale.totalAmount)}</span></div>
      <div class="total" style="font-size:13px;margin-top:3px"><span>CHANGE</span><span>${formatCurrency(sale.changeBack != null ? sale.changeBack : 0)}</span></div>
      ${qrs.html}
      <hr />
      <div style="font-size:11px;font-weight:800;letter-spacing:0.06em">OUR SERVICES</div>
      <div class="svc-grid">${services}</div>
      ${barcodeBlock(code, { height: 36 })}
      <div class="center" style="margin-top:8px;font-size:12px;font-weight:700">Thank you for your business!</div>
      <div class="center" style="font-size:10px;font-weight:700;margin-top:4px">Scan QR to verify this receipt</div>
      <div class="powered">${escapeHtml(cfg.poweredBy || 'Powered By Amazon ERP')}</div>
      ${printOnLoadScript(700)}
      </body></html>`;
  return printHtml(html, { width: 360, height: 900, fallbackPopup: true });
}
