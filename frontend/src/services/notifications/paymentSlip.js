/**
 * Pocket-size payment receipt (Cash In / Cash Out) — black, short, with barcode.
 */
import { barcodeBlock, moneyPKR, printHtml, printOnLoadScript } from '@/utils/printHelpers';

export function printPaymentSlip(payment = {}, company = {}) {
  const rawType = String(payment.type || payment.recordtype || '').toLowerCase();
  const isIn = rawType !== 'outflow' && rawType !== 'out';
  const title = isIn ? 'PAYMENT RECEIPT' : 'PAYMENT VOUCHER';
  const companyName = company.name || 'Amazon Printing Services';
  const companyAddress = company.address || 'King Road, Mandi Bahauddin';
  const companyPhone = company.phone || '';
  const companyWeb = company.website || 'amzprints.com';
  const amount = moneyPKR(payment.amount);
  const total = moneyPKR(payment.totalAmount || payment.total || 0);
  const balance = moneyPKR(payment.balanceDue || 0);
  const date = payment.date || new Date().toISOString().slice(0, 10);
  const time = payment.time || new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const txn = String(payment.reference || payment.refId || payment.id || `TXN-${Date.now().toString().slice(-8)}`);

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title} — ${txn}</title>
  <style>
    @page { size: 80mm auto; margin: 2.5mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      width: 72mm;
      margin: 0 auto;
      color: #000;
      padding: 1mm;
      font-size: 11px;
    }
    .brand { text-align: center; }
    .brand h1 { font-size: 14px; margin: 0; font-weight: 800; letter-spacing: 0.02em; }
    .brand p { font-size: 9px; margin: 1px 0; }
    .title {
      text-align: center;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      margin: 6px 0 2px;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 4px 0;
    }
    .kind { text-align: center; font-size: 10px; font-weight: 700; margin: 4px 0; }
    .amount { text-align: center; font-size: 20px; font-weight: 800; margin: 4px 0 2px; }
    hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
    .row { display: flex; justify-content: space-between; gap: 4px; margin: 2px 0; }
    .label { color: #000; }
    .val { font-weight: 700; text-align: right; word-break: break-word; }
    .barcode-wrap { text-align: center; margin: 6px 0 2px; }
    .barcode-wrap svg { max-width: 100%; }
    .footer { text-align: center; font-size: 9px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="brand">
    <h1>${companyName}</h1>
    <p>${companyAddress}</p>
    ${companyPhone ? `<p>${companyPhone}</p>` : ''}
    <p>${companyWeb}</p>
  </div>
  <div class="title">${title}</div>
  <div class="kind">${isIn ? 'CASH IN · RECEIVED' : 'CASH OUT · PAID'}</div>
  <div class="amount">Rs ${amount}</div>
  <hr />
  <div class="row"><span class="label">Date</span><span class="val">${date} ${time}</span></div>
  <div class="row"><span class="label">Party</span><span class="val">${payment.party || payment.customerName || '—'}</span></div>
  ${payment.partyPhone ? `<div class="row"><span class="label">Phone</span><span class="val">${payment.partyPhone}</span></div>` : ''}
  <div class="row"><span class="label">Method</span><span class="val">${payment.method || 'Cash'}</span></div>
  <div class="row"><span class="label">Category</span><span class="val">${payment.category || '—'}</span></div>
  ${(Number(payment.totalAmount) > 0) ? `<div class="row"><span class="label">Bill Total</span><span class="val">Rs ${total}</span></div>` : ''}
  <div class="row"><span class="label">Received/Paid</span><span class="val">Rs ${amount}</span></div>
  ${(payment.balanceDue != null && payment.balanceDue !== '') ? `<div class="row"><span class="label">Balance</span><span class="val">Rs ${balance}</span></div>` : ''}
  <div class="row"><span class="label">Txn</span><span class="val">${txn}</span></div>
  ${payment.notes ? `<div class="row"><span class="label">Notes</span><span class="val">${payment.notes}</span></div>` : ''}
  <hr />
  ${barcodeBlock(txn, { height: 32 })}
  <div class="footer">Keep this slip · ${isIn ? 'Payment Received' : 'Payment Issued'}</div>
  ${printOnLoadScript(500)}
</body>
</html>`;

  // Iframe print — no popup permission needed after async save
  return printHtml(html, { width: 340, height: 560, fallbackPopup: true });
}
