import { printHtml } from '@/utils/printHelpers';

export function customerPortalUrl(customerId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/portal?c=${encodeURIComponent(customerId || '')}`;
}

export function downloadSvgDataUrl(svgEl, filename) {
  if (!svgEl) return;
  const serializer = new XMLSerializer();
  const src = serializer.serializeToString(svgEl);
  const blob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'qr.svg';
  a.click();
  URL.revokeObjectURL(url);
}

export function printCustomerCard({ customer, company, qrUrl, outstanding, creditBalance }) {
  const name = customer?.name || 'Customer';
  const code = customer?.customerCode || customer?.id || '';
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Customer-Card-${String(name).replace(/[^\w-]+/g, '-')}</title>
  <style>
    @page { size: A6 landscape; margin: 6mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; color: #1c2430; }
    .card { width: 148mm; min-height: 95mm; border: 1.5px solid #0747a3; border-radius: 10px; overflow: hidden; }
    .top { background: linear-gradient(120deg, #0747a3, #ff6d00); color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; opacity: .85; }
    .title { font-size: 18px; font-weight: 800; margin: 4px 0 0; }
    .body { display: grid; grid-template-columns: 1fr 86px; gap: 12px; padding: 14px 16px; }
    .k { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; }
    .v { font-size: 13px; font-weight: 700; margin: 0 0 8px; }
    .qr { width: 86px; height: 86px; }
    .foot { border-top: 1px solid #e5e7eb; padding: 8px 16px; font-size: 10px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="top">
      <div>
        <div class="brand">${company?.name || 'AMZ Prints'}</div>
        <div class="title">Customer Card</div>
      </div>
      <div style="font-size:11px;text-align:right">ID<br/><strong>${code}</strong></div>
    </div>
    <div class="body">
      <div>
        <div class="k">Name</div><div class="v">${name}</div>
        <div class="k">Phone</div><div class="v">${customer?.phone || '—'}</div>
        <div class="k">Email</div><div class="v">${customer?.email || '—'}</div>
        <div class="k">Address</div><div class="v">${customer?.address || customer?.city || '—'}</div>
      </div>
      <div>
        ${qrUrl ? `<img class="qr" src="${qrUrl}" alt="QR"/>` : ''}
      </div>
    </div>
    <div class="foot">
      Scan QR → login to Customer Portal · Outstanding ${outstanding ?? '—'} · Advance ${creditBalance ?? '—'}
      ${company?.phone ? ` · ${company.phone}` : ''}
    </div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body>
</html>`;
  return printHtml(html, { width: 720, height: 520 });
}
