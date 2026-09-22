import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { QRCodeCanvas } from 'qrcode.react';
import { printHtml } from '@/utils/printHelpers';

export function customerPortalUrl(customerId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/portal?c=${encodeURIComponent(customerId || '')}`;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function downloadDataUrl(dataUrl, filename) {
  if (!dataUrl) return;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename || 'download.png';
  a.click();
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

export function canvasPngDataUrl(canvas) {
  if (!canvas || typeof canvas.toDataURL !== 'function') return '';
  try {
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

/** Render a PNG QR off-screen so print/download always have a real bitmap. */
export async function qrPngDataUrl(value, size = 180) {
  const text = String(value || '').trim();
  if (!text || typeof document === 'undefined') return '';
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;overflow:hidden';
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(createElement(QRCodeCanvas, {
      value: text,
      size,
      level: 'M',
      includeMargin: true,
      bgColor: '#ffffff',
      fgColor: '#0747a3',
    }));
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    await new Promise((r) => setTimeout(r, 40));
    return canvasPngDataUrl(host.querySelector('canvas'));
  } finally {
    try { root.unmount(); } catch { /* ignore */ }
    host.remove();
  }
}

export async function printCustomerCard({ customer, company, qrUrl, outstanding, creditBalance }) {
  const name = customer?.name || 'Customer';
  const code = customer?.customerCode || customer?.id || '';
  const portal = customerPortalUrl(customer?.id);
  let qr = qrUrl || '';
  if (!qr || qr.startsWith('data:image/svg')) {
    qr = await qrPngDataUrl(portal, 200);
  }
  const logo = company?.logo || '';
  const photo = customer?.photo || customer?.image || '';
  const brand = esc(company?.name || 'AMZ Prints');
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Customer-Card-${String(name).replace(/[^\w-]+/g, '-')}</title>
  <style>
    @page { size: 85.6mm 54mm; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #fff; }
    .card {
      width: 85.6mm; height: 54mm;
      border-radius: 3.2mm; overflow: hidden;
      border: 0.35mm solid #0747a3;
      display: flex; flex-direction: column;
      background: #fff;
    }
    .top {
      background: linear-gradient(115deg, #05357c 0%, #0747a3 55%, #ff6d00 160%);
      color: #fff; padding: 2.4mm 3.2mm;
      display: flex; align-items: center; justify-content: space-between; gap: 2mm;
    }
    .logo { height: 9mm; max-width: 22mm; object-fit: contain; background: #fff; border-radius: 1.2mm; padding: 0.6mm; }
    .brand-name { font-size: 3.4mm; font-weight: 800; letter-spacing: 0.02em; line-height: 1.15; }
    .brand-sub { font-size: 2mm; opacity: .85; letter-spacing: .12em; text-transform: uppercase; margin-top: 0.4mm; }
    .mid { flex: 1; display: grid; grid-template-columns: 14mm 1fr 18mm; gap: 2.4mm; padding: 2.4mm 3mm 1.6mm; align-items: center; }
    .dp {
      width: 14mm; height: 16mm; object-fit: cover; border-radius: 1.4mm;
      border: 0.3mm solid #dbe3ef; background: #f1f5f9;
    }
    .dp-ph {
      width: 14mm; height: 16mm; border-radius: 1.4mm;
      background: #e8eef7; color: #0747a3; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 5mm;
    }
    .k { font-size: 1.7mm; color: #64748b; text-transform: uppercase; letter-spacing: .08em; }
    .v { font-size: 2.7mm; font-weight: 700; margin: 0 0 1.1mm; line-height: 1.2; }
    .code { font-family: ui-monospace, Consolas, monospace; color: #ff6d00; font-size: 2.4mm; }
    .qr { width: 18mm; height: 18mm; display: block; background: #fff; }
    .foot {
      background: #f8fafc; border-top: 0.25mm solid #e2e8f0;
      padding: 1.3mm 3mm; font-size: 1.8mm; color: #475569;
      display: flex; justify-content: space-between; gap: 2mm;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="top">
      <div style="display:flex;align-items:center;gap:2.2mm;min-width:0">
        ${logo ? `<img class="logo" src="${esc(logo)}" alt="logo"/>` : ''}
        <div>
          <div class="brand-name">${brand}</div>
          <div class="brand-sub">Customer card</div>
        </div>
      </div>
      <div style="text-align:right;font-size:2mm;opacity:.9">ID<br/><strong class="code" style="color:#fff">${esc(code)}</strong></div>
    </div>
    <div class="mid">
      ${photo
        ? `<img class="dp" src="${esc(photo)}" alt=""/>`
        : `<div class="dp-ph">${esc((name || 'C').charAt(0).toUpperCase())}</div>`}
      <div>
        <div class="k">Name</div><div class="v">${esc(name)}</div>
        <div class="k">Phone</div><div class="v">${esc(customer?.phone || '—')}</div>
        <div class="k">City / Address</div><div class="v">${esc(customer?.city || customer?.address || '—')}</div>
      </div>
      <div>
        ${qr ? `<img class="qr" src="${qr}" alt="QR"/>` : ''}
      </div>
    </div>
    <div class="foot">
      <span>Scan QR → Customer Portal login</span>
      <span>Due ${esc(outstanding ?? '—')} · Adv ${esc(creditBalance ?? '—')}</span>
    </div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},280)}</script>
</body>
</html>`;
  return printHtml(html, { width: 720, height: 460 });
}
