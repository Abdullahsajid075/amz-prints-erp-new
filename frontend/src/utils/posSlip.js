import { formatCurrency } from '@/utils/helpers';
import { barcodeBlock, openPrintWindow, printOnLoadScript, POS_MAJOR_SERVICES, documentFileName } from '@/utils/printHelpers';
import { qrPngDataUrl } from '@/utils/customerDocuments';
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
 * 80mm POS thermal slip — same layout as the till reprint.
 */
export async function printPosSlip(sale, { company = {}, posCfg } = {}) {
  const cfg = posCfg || mergePosSettings({});
  const rawWeb = company.website || 'https://amzprints.com';
  const website = /^https?:\/\//i.test(rawWeb) ? rawWeb : `https://${rawWeb}`;
  const logoHtml = company.logo
    ? `<img src="${company.logo}" alt="logo" style="height:58px;max-width:160px;display:block;margin:0 auto 2px;object-fit:contain;" />`
    : '';
  const code = sale.orderId || sale.id || `POS-${Date.now().toString().slice(-6)}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://erp.amzprints.com';
  const invoiceUrl = sale.invoiceUrl
    || (sale.shareToken ? `${origin}/invoice/${sale.shareToken}` : `${origin}/track/${encodeURIComponent(code)}`);
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
  let webQr = '';
  let invQr = '';
  try {
    if (cfg.showWebsiteQr) webQr = await qrPngDataUrl(website, 110);
    if (cfg.showInvoiceQr) invQr = await qrPngDataUrl(invoiceUrl, 110);
  } catch { /* slip still prints */ }
  const html = `<!DOCTYPE html><html><head><title>${escapeHtml(printTitle)}</title>
      <style>
        @page { size: 80mm auto; margin: 3mm; }
        body { font-family: Arial, Helvetica, sans-serif; width: 72mm; margin: 0; color: #000; font-size: 11px; }
        h1 { font-size: 12px; margin: 0; text-align: center; font-weight: 700; letter-spacing:0.01em; }
        .tag { text-align: center; font-size: 9px; margin-top: 2px; }
        .center { text-align: center; }
        .title { text-align:center; font-weight:800; letter-spacing:0.12em; font-size:11px;
          border-top:2px solid #000; border-bottom:2px solid #000; padding:4px 0; margin:6px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        td, th { padding: 2px 0; font-size: 10px; }
        th { border-bottom: 1px solid #000; text-align:left; }
        .r { text-align: right; }
        hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        .total { font-size: 13px; font-weight: 800; display:flex; justify-content:space-between; }
        .qr-row { display:flex; justify-content:space-between; gap:6px; margin-top:8px; }
        .qr-box { flex:1; text-align:center; }
        .qr-box img { width:52px; height:52px; display:block; margin:0 auto 2px; }
        .qr-box span { font-size:8px; font-weight:700; display:block; }
        .svc-grid { display:flex; flex-wrap:wrap; gap:3px; margin-top:6px; }
        .svc-card { border:1px solid #000; border-radius:4px; padding:3px 4px; font-size:8px; font-weight:700; width:calc(50% - 3px); box-sizing:border-box; }
        .powered { text-align:center; font-size:8px; font-weight:800; letter-spacing:0.04em; margin-top:8px; }
        .barcode-wrap { text-align:center; margin-top:6px; }
      </style></head><body>
      ${logoHtml}
      <h1>${escapeHtml(company.name || 'Amazon Printing Services')}</h1>
      <div class="tag">${escapeHtml(company.address || 'King Road, Mandi Bahauddin')}</div>
      <div class="center" style="font-size:9px;margin-top:2px">${escapeHtml(company.phone || '')} · ${escapeHtml(website.replace(/^https?:\/\//, ''))}</div>
      <div class="title">POS RECEIPT</div>
      <div>Sale: <strong>${escapeHtml(code)}</strong></div>
      <div>Customer: ${escapeHtml(sale.customerName || 'Walk-in')}</div>
      <div>Phone: ${escapeHtml(sale.customerPhone || '—')}</div>
      <div>Pay: ${escapeHtml(sale.paymentMethod || 'Cash')}</div>
      <div>Date: ${escapeHtml(sale.date || new Date().toLocaleString())}</div>
      <hr />
      <table>
        <thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amt</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <hr />
      ${Number(sale.subtotal) > 0 && Number(sale.discount) > 0
        ? `<div class="total" style="font-size:11px;font-weight:600"><span>SUBTOTAL</span><span>${formatCurrency(sale.subtotal)}</span></div>
           <div class="total" style="font-size:11px;font-weight:600"><span>DISCOUNT</span><span>-${formatCurrency(sale.discount)}</span></div>`
        : ''}
      <div class="total"><span>TOTAL</span><span>${formatCurrency(sale.totalAmount)}</span></div>
      <div class="total" style="font-size:11px;margin-top:2px"><span>RECEIVED</span><span>${formatCurrency(sale.receivedAmount != null ? sale.receivedAmount : sale.totalAmount)}</span></div>
      <div class="total" style="font-size:11px;margin-top:2px"><span>CHANGE</span><span>${formatCurrency(sale.changeBack != null ? sale.changeBack : 0)}</span></div>
      ${(webQr || invQr) ? `<div class="qr-row">
        ${webQr ? `<div class="qr-box"><img src="${webQr}" alt="Website QR" /><span>Website</span></div>` : ''}
        ${invQr ? `<div class="qr-box"><img src="${invQr}" alt="Invoice QR" /><span>Digital invoice</span></div>` : ''}
      </div>` : ''}
      <hr />
      <div style="font-size:9px;font-weight:800;letter-spacing:0.06em">OUR SERVICES</div>
      <div class="svc-grid">${services}</div>
      ${barcodeBlock(code, { height: 30 })}
      <div class="center" style="margin-top:6px;font-size:10px">Thank you for your business!</div>
      <div class="powered">${escapeHtml(cfg.poweredBy || 'Powered By Amazon ERP')}</div>
      ${printOnLoadScript(500)}
      </body></html>`;
  return openPrintWindow(html, { width: 360, height: 820 });
}
