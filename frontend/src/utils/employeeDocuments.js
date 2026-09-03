/**
 * Employee ID card (2.2" × 3.5"), name badge (65×25 mm), experience letter.
 * Opens print window → Save as PDF from browser print dialog.
 */
import { barcodeBlock, openPrintWindow, printOnLoadScript } from '@/utils/printHelpers';

const CARD_W = '2.2in';
const CARD_H = '3.5in';
const BADGE_W = '65mm';
const BADGE_H = '25mm';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function empCode(emp) {
  return String(emp.employeeCode || emp.id || 'EMP').trim();
}

export function employeeVerifyUrl(emp) {
  const code = encodeURIComponent(empCode(emp));
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://erp.amzprints.com';
  return `${origin}/verify/employee/${code}`;
}

function qrImg(url, size = 88) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(url)}`;
  return `<img class="qr" src="${src}" width="${size}" height="${size}" alt="QR" />`;
}

function lineTextureCss() {
  return `
    background-color: #f7f4ef;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(30,45,70,0.045) 11px, rgba(30,45,70,0.045) 12px),
      repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(30,45,70,0.03) 11px, rgba(30,45,70,0.03) 12px),
      linear-gradient(165deg, #fff9f2 0%, #f0ebe3 55%, #e8e2d8 100%);
  `;
}

function companyBits(company = {}) {
  return {
    name: company.name || 'AMZ Prints',
    tagline: company.tagline || 'Professional Printing & Advertising Services',
    address: company.address || '',
    phone: company.phone || '',
    email: company.email || '',
    website: company.website || '',
    logo: company.logo || '',
    stamp: company.stamp || '',
    signature: company.signature || '',
    signatory: company.authorizedSignatory || 'CEO / Director',
  };
}

/** Double-sided classic employee card — 2.2in × 3.5in */
export function printEmployeeCard(emp, company = {}, { autoPrint = true } = {}) {
  const c = companyBits(company);
  const code = empCode(emp);
  const verify = employeeVerifyUrl(emp);
  const photo = emp.photo
    ? `<img class="photo" src="${esc(emp.photo)}" alt="" />`
    : `<div class="photo ph">PHOTO</div>`;
  const logo = c.logo
    ? `<img class="logo" src="${esc(c.logo)}" alt="" />`
    : `<div class="logo-text">${esc(c.name)}</div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>ID Card — ${esc(emp.name)}</title>
<style>
  @page { size: auto; margin: 8mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Segoe UI", Georgia, serif; color: #1a1a1a; background: #ddd; }
  .sheet { display: flex; flex-wrap: wrap; gap: 14px; padding: 12px; justify-content: center; }
  .card {
    width: ${CARD_W}; height: ${CARD_H};
    border: 1.5px solid #2a2a2a; border-radius: 6px; overflow: hidden;
    position: relative; ${lineTextureCss()}
    box-shadow: 0 2px 8px rgba(0,0,0,.18);
    page-break-inside: avoid;
  }
  .accent { height: 7px; background: linear-gradient(90deg, #ff6d00, #cc5700); }
  .front, .back { height: calc(100% - 7px); padding: 8px 9px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 6px; border-bottom: 1px solid rgba(0,0,0,.12); padding-bottom: 5px; }
  .logo { max-height: 28px; max-width: 72px; object-fit: contain; }
  .logo-text { font-size: 11px; font-weight: 800; letter-spacing: .04em; color: #ff6d00; }
  .brand small { display: block; font-size: 7px; color: #555; line-height: 1.2; }
  .title { text-align: center; font-size: 8px; letter-spacing: .18em; text-transform: uppercase; color: #444; margin: 6px 0 4px; font-weight: 700; }
  .photo-row { display: flex; gap: 7px; align-items: flex-start; }
  .photo { width: 58px; height: 70px; object-fit: cover; border: 1px solid #333; background: #fff; }
  .ph { display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999; }
  .meta { flex: 1; min-width: 0; }
  .name { font-size: 13px; font-weight: 800; line-height: 1.15; margin: 0 0 2px; }
  .desig { font-size: 9px; color: #ff6d00; font-weight: 700; margin-bottom: 4px; }
  .row { font-size: 8px; line-height: 1.35; margin: 1px 0; }
  .row b { display: inline-block; min-width: 42px; color: #555; font-weight: 600; }
  .barcode-wrap { text-align: center; margin-top: auto; padding-top: 4px; }
  .barcode-wrap svg { max-width: 100%; }
  .valid { font-size: 7.5px; text-align: center; margin-top: 3px; color: #333; }
  .label { position: absolute; top: 10px; right: 8px; font-size: 7px; opacity: .45; letter-spacing: .1em; }
  .back .rules { font-size: 8px; line-height: 1.4; color: #333; margin: 6px 0; flex: 1; }
  .back .rules li { margin: 0 0 3px 14px; }
  .verify-box { display: flex; gap: 8px; align-items: center; border-top: 1px solid rgba(0,0,0,.12); padding-top: 6px; margin-top: auto; }
  .verify-box p { font-size: 7.5px; margin: 0; line-height: 1.3; color: #333; }
  .qr { display: block; border: 1px solid #ccc; background: #fff; }
  .foot { font-size: 7px; text-align: center; color: #666; margin-top: 4px; }
  @media print {
    body { background: #fff; }
    .sheet { padding: 0; gap: 10mm; }
    .card { box-shadow: none; }
  }
</style></head><body>
<div class="sheet">
  <div class="card">
    <div class="accent"></div>
    <div class="front">
      <span class="label">FRONT</span>
      <div class="brand">${logo}<div><strong style="font-size:10px">${esc(c.name)}</strong><small>${esc(c.tagline)}</small></div></div>
      <div class="title">Employee Identity Card</div>
      <div class="photo-row">
        ${photo}
        <div class="meta">
          <p class="name">${esc(emp.name)}</p>
          <p class="desig">${esc(emp.designation || emp.role || 'Staff')}</p>
          <div class="row"><b>Code</b> ${esc(code)}</div>
          <div class="row"><b>Dept</b> ${esc(emp.department || '—')}</div>
          <div class="row"><b>CNIC</b> ${esc(emp.cnic || '—')}</div>
          <div class="row"><b>Phone</b> ${esc(emp.phone || '—')}</div>
        </div>
      </div>
      ${barcodeBlock(code, { id: 'bc-card', height: 28 })}
      <div class="valid">Valid: ${esc(fmtDate(emp.validFrom))} — ${esc(fmtDate(emp.validUntil || 'Open'))}</div>
    </div>
  </div>

  <div class="card">
    <div class="accent"></div>
    <div class="back">
      <span class="label">BACK</span>
      <div class="brand">${logo}<div><strong style="font-size:10px">${esc(c.name)}</strong><small>Official Staff Card</small></div></div>
      <ul class="rules">
        <li>This card is company property. Return on leaving service.</li>
        <li>If found, return to ${esc(c.name)}${c.phone ? ` · ${esc(c.phone)}` : ''}.</li>
        <li>Emergency: ${esc(emp.emergencyContact || '—')} ${esc(emp.emergencyPhone || '')}</li>
        <li>Address: ${esc(emp.address || emp.city || '—')}</li>
      </ul>
      <div class="verify-box">
        ${qrImg(verify, 72)}
        <p><strong>Scan to verify</strong><br/>Online employment check<br/><span style="word-break:break-all">${esc(verify)}</span></p>
      </div>
      <div class="foot">${esc(c.address || c.website || '')}</div>
    </div>
  </div>
</div>
${autoPrint ? printOnLoadScript(600) : ''}
</body></html>`;

  return openPrintWindow(html, { width: 720, height: 780 });
}

/** Name badge — 65mm × 25mm — name + designation only */
export function printEmployeeBadge(emp, company = {}, { autoPrint = true } = {}) {
  const c = companyBits(company);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Badge — ${esc(emp.name)}</title>
<style>
  @page { size: ${BADGE_W} ${BADGE_H}; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #ccc; font-family: "Segoe UI", Arial, sans-serif; }
  .wrap { padding: 10px; display: flex; justify-content: center; }
  .badge {
    width: ${BADGE_W}; height: ${BADGE_H};
    border: 1px solid #222; border-radius: 3px; overflow: hidden;
    display: flex; flex-direction: column; ${lineTextureCss()}
  }
  .top { height: 4px; background: #ff6d00; }
  .body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2px 6px; text-align: center; }
  .name { font-size: 11px; font-weight: 800; line-height: 1.1; margin: 0; color: #111; max-width: 100%; }
  .desig { font-size: 8px; font-weight: 600; color: #ff6d00; margin: 2px 0 0; letter-spacing: .02em; }
  .co { font-size: 6px; color: #666; margin-top: 2px; }
  @media print { body { background: #fff; } .wrap { padding: 0; } }
</style></head><body>
<div class="wrap">
  <div class="badge">
    <div class="top"></div>
    <div class="body">
      <p class="name">${esc(emp.name)}</p>
      <p class="desig">${esc(emp.designation || emp.role || 'Staff')}</p>
      <p class="co">${esc(c.name)}</p>
    </div>
  </div>
</div>
${autoPrint ? printOnLoadScript(450) : ''}
</body></html>`;

  return openPrintWindow(html, { width: 420, height: 280 });
}

/** Experience letter on company letterhead with stamp + scannable verification */
export function printExperienceLetter(emp, company = {}, { autoPrint = true } = {}) {
  const c = companyBits(company);
  const code = empCode(emp);
  const verify = employeeVerifyUrl(emp);
  const today = fmtDate(new Date().toISOString().slice(0, 10));
  const from = fmtDate(emp.joinDate);
  const to = emp.endDate ? fmtDate(emp.endDate) : 'present';
  const logo = c.logo
    ? `<img src="${esc(c.logo)}" alt="" style="max-height:64px;max-width:160px;object-fit:contain;" />`
    : `<div style="font-size:22px;font-weight:800;color:#ff6d00">${esc(c.name)}</div>`;
  const stamp = c.stamp
    ? `<img src="${esc(c.stamp)}" alt="stamp" style="max-height:90px;max-width:110px;object-fit:contain;" />`
    : '';
  const signature = c.signature
    ? `<img src="${esc(c.signature)}" alt="sign" style="max-height:54px;max-width:160px;object-fit:contain;" />`
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Experience Letter — ${esc(emp.name)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { margin: 0; font-family: "Times New Roman", Georgia, serif; color: #1a1a1a; background: #e8e8e8; }
  .page {
    width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 18mm 16mm;
    background: #fff; ${lineTextureCss()} position: relative;
  }
  .letterhead { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
    border-bottom: 2.5px solid #ff6d00; padding-bottom: 10px; margin-bottom: 14px; }
  .co-meta { text-align: right; font-size: 11px; line-height: 1.45; color: #333; font-family: "Segoe UI", Arial, sans-serif; }
  .ref { font-size: 12px; margin: 10px 0 18px; font-family: "Segoe UI", Arial, sans-serif; }
  h1 { text-align: center; font-size: 18px; letter-spacing: .12em; margin: 0 0 18px; text-decoration: underline; }
  .body { font-size: 13.5px; line-height: 1.65; text-align: justify; }
  .body p { margin: 0 0 12px; }
  .sign-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; gap: 20px; }
  .sign-block { min-width: 180px; }
  .sign-block .label { font-size: 12px; margin-top: 4px; font-family: "Segoe UI", Arial, sans-serif; }
  .verify { margin-top: 28px; display: flex; gap: 12px; align-items: center;
    border: 1px dashed #999; padding: 10px; background: rgba(255,255,255,.7);
    font-family: "Segoe UI", Arial, sans-serif; font-size: 11px; }
  .footer { margin-top: 18px; font-size: 10px; color: #666; text-align: center;
    font-family: "Segoe UI", Arial, sans-serif; border-top: 1px solid #ccc; padding-top: 8px; }
  @media print { body { background: #fff; } .page { margin: 0; width: auto; min-height: auto; box-shadow: none; } }
</style></head><body>
<div class="page">
  <div class="letterhead">
    <div>${logo}</div>
    <div class="co-meta">
      <strong>${esc(c.name)}</strong><br/>
      ${c.tagline ? `${esc(c.tagline)}<br/>` : ''}
      ${c.address ? `${esc(c.address)}<br/>` : ''}
      ${c.phone ? `Tel: ${esc(c.phone)}<br/>` : ''}
      ${c.email ? `${esc(c.email)}<br/>` : ''}
      ${c.website ? esc(c.website) : ''}
    </div>
  </div>

  <div class="ref">
    <div><strong>Ref:</strong> EXP/${esc(code)}/${new Date().getFullYear()}</div>
    <div><strong>Date:</strong> ${esc(today)}</div>
  </div>

  <h1>TO WHOM IT MAY CONCERN</h1>

  <div class="body">
    <p>This is to certify that <strong>${esc(emp.name)}</strong>${emp.cnic ? ` (CNIC: ${esc(emp.cnic)})` : ''}
    has been employed with <strong>${esc(c.name)}</strong> as
    <strong>${esc(emp.designation || emp.role || 'Staff')}</strong>
    ${emp.department ? ` in the <strong>${esc(emp.department)}</strong> department` : ''}
    from <strong>${esc(from)}</strong> to <strong>${esc(to)}</strong>.</p>

    <p>During the tenure of employment, the above-named employee performed duties diligently and
    maintained a satisfactory professional record. We wish them success in future endeavors.</p>

    <p>This letter is issued upon request for official / employment verification purposes.
    Authenticity can be confirmed by scanning the QR code below.</p>
  </div>

  <div class="sign-row">
    <div class="sign-block">
      ${signature || '<div style="height:54px"></div>'}
      <div style="border-top:1px solid #333;width:180px;margin-top:4px"></div>
      <div class="label"><strong>${esc(c.signatory)}</strong><br/>${esc(c.name)}</div>
    </div>
    <div class="sign-block" style="text-align:center">
      ${stamp || '<div style="height:90px;border:1px dashed #bbb;display:flex;align-items:center;justify-content:center;font-size:11px;color:#999">CEO STAMP</div>'}
      <div class="label">Authorized Stamp</div>
    </div>
  </div>

  <div class="verify">
    ${qrImg(verify, 96)}
    <div>
      <strong>Online verification</strong><br/>
      Scan QR or open:<br/>
      <span style="word-break:break-all;color:#1d4ed8">${esc(verify)}</span><br/>
      Employee code: <strong>${esc(code)}</strong>
    </div>
  </div>

  <div class="footer">Computer-generated on company letterhead · ${esc(c.name)} · ${esc(today)}</div>
</div>
${autoPrint ? printOnLoadScript(700) : ''}
</body></html>`;

  return openPrintWindow(html, { width: 900, height: 1000 });
}
