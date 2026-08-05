/**
 * Pocket-size (80mm) payment slip printer for Cash In / Cash Out.
 */
export function printPaymentSlip(payment = {}, company = {}) {
  const isIn = String(payment.type || '').toLowerCase() === 'inflow';
  const title = isIn ? 'PAYMENT RECEIVED' : 'PAYMENT SENT';
  const accent = isIn ? '#10B981' : '#EF4444';
  const companyName = company.name || 'Amazon Printing Services';
  const companyAddress = company.address || 'King Road, Mandi Bahauddin';
  const companyPhone = company.phone || '';
  const companyWeb = company.website || 'amzprints.com';
  const amount = Number(payment.amount || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const date = payment.date || new Date().toISOString().slice(0, 10);
  const time = payment.time || new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title} — ${payment.reference || payment.id || ''}</title>
  <style>
    @page { size: 80mm auto; margin: 3mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      width: 74mm;
      margin: 0 auto;
      color: #111;
      padding: 2mm;
    }
    .brand { text-align: center; }
    .brand h1 { font-size: 15px; margin: 0 0 2px; letter-spacing: 0.02em; }
    .brand p { font-size: 9px; color: #555; margin: 0; line-height: 1.35; }
    .badge {
      margin: 8px auto 6px;
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      background: ${accent};
      letter-spacing: 0.06em;
    }
    .amount {
      text-align: center;
      font-size: 22px;
      font-weight: 800;
      margin: 8px 0 4px;
      color: ${accent};
    }
    .sign { text-align: center; font-size: 12px; font-weight: 700; color: ${accent}; }
    hr { border: none; border-top: 1px dashed #333; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; gap: 6px; font-size: 11px; margin: 3px 0; }
    .label { color: #666; }
    .val { font-weight: 600; text-align: right; word-break: break-word; }
    .footer { text-align: center; font-size: 9px; color: #666; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="brand">
    <h1>${companyName}</h1>
    <p>${companyAddress}</p>
    ${companyPhone ? `<p>${companyPhone}</p>` : ''}
    <p>${companyWeb}</p>
  </div>
  <div style="text-align:center"><span class="badge">${title}</span></div>
  <div class="sign">${isIn ? 'CASH IN' : 'CASH OUT'}</div>
  <div class="amount">Rs ${amount}</div>
  <hr />
  <div class="row"><span class="label">Date</span><span class="val">${date} ${time}</span></div>
  <div class="row"><span class="label">Party</span><span class="val">${payment.party || '—'}</span></div>
  ${payment.partyPhone ? `<div class="row"><span class="label">Phone</span><span class="val">${payment.partyPhone}</span></div>` : ''}
  <div class="row"><span class="label">Category</span><span class="val">${payment.category || '—'}</span></div>
  <div class="row"><span class="label">Method</span><span class="val">${payment.method || '—'}</span></div>
  <div class="row"><span class="label">Txn / Ref</span><span class="val">${payment.reference || payment.id || '—'}</span></div>
  ${payment.notes ? `<div class="row"><span class="label">Notes</span><span class="val">${payment.notes}</span></div>` : ''}
  <hr />
  <div class="footer">Thank you · Pocket receipt · Keep for records</div>
  <script>
    window.onload = function () {
      window.print();
      setTimeout(function () { window.close(); }, 350);
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=340,height=520');
  if (!win) {
    return { ok: false, reason: 'popup_blocked' };
  }
  win.document.write(html);
  win.document.close();
  return { ok: true };
}
