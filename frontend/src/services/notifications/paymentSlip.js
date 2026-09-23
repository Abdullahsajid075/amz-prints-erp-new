/**
 * Pocket-size payment receipt (Cash In / Cash Out) — black, 1-inch website + verify QRs.
 */
import { barcodeBlock, moneyPKR, printHtml, printOnLoadScript, documentFileName, SLIP_QR_CSS } from '@/utils/printHelpers';
import { buildSlipQrs, slipWebsiteUrl, verifyUrlForSlip } from '@/utils/slipQr';

export async function printPaymentSlip(payment = {}, company = {}) {
  const rawType = String(payment.type || payment.recordtype || '').toLowerCase();
  const isIn = rawType !== 'outflow' && rawType !== 'out';
  const title = isIn ? 'PAYMENT RECEIPT' : 'PAYMENT VOUCHER';
  const companyName = company.name || 'Amazon Printing Services';
  const companyAddress = company.address || 'King Road, Mandi Bahauddin';
  const companyPhone = company.phone || '';
  const website = slipWebsiteUrl(company);
  const companyWeb = website.replace(/^https?:\/\//, '');
  const amount = moneyPKR(payment.amount);
  const total = moneyPKR(payment.totalAmount || payment.total || 0);
  const balance = moneyPKR(payment.balanceDue || 0);
  const date = payment.date || new Date().toISOString().slice(0, 10);
  const time = payment.time || new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const txn = String(payment.reference || payment.refId || payment.id || `TXN-${Date.now().toString().slice(-8)}`);
  const printTitle = documentFileName({
    docType: isIn ? 'Receipt' : 'Voucher',
    customerName: payment.party || payment.customerName,
    orderNumber: payment.orderId || payment.reference || txn,
  });
  const verifyUrl = verifyUrlForSlip({
    shareToken: payment.shareToken,
    invoiceUrl: payment.invoiceUrl,
    orderId: payment.orderId,
    trackingNumber: payment.trackingNumber,
    reference: txn,
    paymentId: payment.id,
    code: txn,
  });
  const qrs = await buildSlipQrs({ company, verifyUrl });

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${printTitle}</title>
  <style>
    @page { size: 80mm auto; margin: 2.5mm; }
    * { box-sizing: border-box; color: #000 !important; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      width: 72mm;
      margin: 0 auto;
      color: #000;
      padding: 1mm;
      font-size: 13px;
    }
    .brand { text-align: center; }
    .brand h1 { font-size: 16px; margin: 0; font-weight: 800; letter-spacing: 0.02em; }
    .brand p { font-size: 11px; margin: 2px 0; font-weight: 600; }
    .title {
      text-align: center;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.08em;
      margin: 8px 0 4px;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 6px 0;
    }
    .kind { text-align: center; font-size: 12px; font-weight: 800; margin: 6px 0; }
    .amount { text-align: center; font-size: 24px; font-weight: 800; margin: 6px 0 4px; }
    hr { border: none; border-top: 1.5px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; gap: 4px; margin: 3px 0; font-size: 12px; }
    .label { color: #000; font-weight: 600; }
    .val { font-weight: 800; text-align: right; word-break: break-word; }
    .barcode-wrap { text-align: center; margin: 8px 0 2px; }
    .barcode-wrap svg { max-width: 100%; }
    .footer { text-align: center; font-size: 11px; margin-top: 8px; font-weight: 700; }
    ${SLIP_QR_CSS}
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
  ${qrs.html}
  <hr />
  ${barcodeBlock(txn, { height: 36 })}
  <div class="footer">Scan QR to verify · ${isIn ? 'Payment Received' : 'Payment Issued'}</div>
  ${printOnLoadScript(700)}
</body>
</html>`;

  return printHtml(html, { width: 340, height: 720, fallbackPopup: true });
}
