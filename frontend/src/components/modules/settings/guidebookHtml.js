import { GUIDE_EFFECTIVE, GUIDE_SECTIONS, GUIDE_VERSION } from './guidebookContent';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl(value) {
  return esc(value).replace(/\n/g, '<br/>');
}

export function buildGuidebookHtml({ company = {}, guidebook = {}, generatedAt } = {}) {
  const name = company.name || 'Amazon Printing Services';
  const stamp = generatedAt || new Date().toISOString();
  const house = [
    guidebook.openingHours && `<h3>Opening hours</h3><p>${nl(guidebook.openingHours)}</p>`,
    guidebook.escalation && `<h3>Escalation</h3><p>${nl(guidebook.escalation)}</p>`,
    guidebook.houseRules && `<h3>House rules / local SOP</h3><p>${nl(guidebook.houseRules)}</p>`,
    guidebook.supportNotes && `<h3>Internal notes</h3><p>${nl(guidebook.supportNotes)}</p>`,
  ].filter(Boolean).join('');

  const toc = GUIDE_SECTIONS.map((s) => `<li><a href="#${s.id}">${esc(s.title)}</a></li>`).join('');
  const chapters = GUIDE_SECTIONS.map((s) => `
    <section id="${s.id}">
      <h2>${esc(s.title)}</h2>
      <p class="meta">Audience: ${esc(s.audience)}</p>
      ${s.body.map((p) => `<p>${esc(p)}</p>`).join('')}
    </section>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${esc(name)} — ERP Operator Manual</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: "Segoe UI", Calibri, Arial, sans-serif; color: #1c2430; margin: 0; background: #f4f6f8; }
    .page { max-width: 880px; margin: 0 auto; background: #fff; padding: 36px 44px 64px; }
    .cover { border-bottom: 6px solid #0747a3; padding-bottom: 20px; margin-bottom: 28px; }
    .kicker { letter-spacing: .18em; text-transform: uppercase; font-size: 11px; color: #0747a3; font-weight: 700; }
    h1 { font-size: 28px; margin: 8px 0 6px; }
    .sub { color: #5b6573; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px; margin-top: 16px; }
    nav ol { columns: 2; padding-left: 18px; }
    h2 { color: #0747a3; border-top: 1px solid #e6eaf0; padding-top: 18px; margin-top: 28px; }
    h3 { margin-bottom: 6px; }
    p { line-height: 1.55; font-size: 14.5px; }
    .meta { font-size: 12px; color: #64748b; margin-top: -8px; }
    footer { margin-top: 40px; font-size: 11px; color: #64748b; border-top: 1px solid #e6eaf0; padding-top: 12px; }
    @media print {
      body { background: #fff; }
      .page { padding: 0; max-width: none; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <article class="page">
    <header class="cover">
      <div class="kicker">Controlled document · Internal use</div>
      <h1>${esc(name)}</h1>
      <p class="sub">Enterprise Resource Planning — Operator Manual &amp; User Guide</p>
      <div class="grid">
        <div><strong>Document</strong><br/>ERP Guide Book</div>
        <div><strong>Version</strong><br/>${esc(GUIDE_VERSION)} · ${esc(GUIDE_EFFECTIVE)}</div>
        <div><strong>Classification</strong><br/>Internal / Confidential</div>
        <div><strong>Generated</strong><br/>${esc(stamp)}</div>
        <div><strong>Address</strong><br/>${esc(company.address || '—')}</div>
        <div><strong>Contact</strong><br/>${esc(company.phone || '—')} · ${esc(company.email || '')}</div>
      </div>
    </header>
    <p>This manual is the official staff handbook for the AMZ Prints ERP. It describes how work is recorded, how money is measured, and how exceptions are handled. Local house rules entered in Settings are printed in the next section and override generic examples where they conflict.</p>
    ${house ? `<section id="house"><h2>0. Company-specific instructions</h2>${house}</section>` : ''}
    <nav><h2>Contents</h2><ol>${toc}</ol></nav>
    ${chapters}
    <footer>
      ${esc(name)} · ${esc(company.website || 'amzprints.com')} · Manual ${esc(GUIDE_VERSION)}.
      Printed copies are uncontrolled after the generation timestamp. Download a fresh copy from Settings → Guide Book after process changes.
    </footer>
  </article>
</body>
</html>`;
}

export function downloadGuidebookHtml(html, filename) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printGuidebookHtml(html) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => {
    setTimeout(() => frame.remove(), 500);
  };
  frame.onload = () => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } finally {
      cleanup();
    }
  };
}
