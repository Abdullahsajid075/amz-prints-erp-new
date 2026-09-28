import { barcodeBlock, printHtml, printOnLoadScript, POS_MAJOR_SERVICES, documentFileName, SLIP_QR_CSS } from '@/utils/printHelpers';
import { buildSlipQrs, slipWebsiteUrl } from '@/utils/slipQr';
import { mergePosSettings } from '@/utils/moduleSettings';

const PDFJS_VERSION = '3.11.174';
const PDFJS_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

const RECEIPT_ACCEPT = 'application/pdf,image/png,image/jpeg,image/jpg,image/webp';

export function isReceiptUploadFile(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();
  if (type === 'application/pdf' || name.endsWith('.pdf')) return true;
  if (type.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp)$/i.test(name);
}

export function receiptAcceptAttr() {
  return RECEIPT_ACCEPT;
}

export function websiteWatermarkText(company = {}) {
  const site = String(company.website || 'amzprints.com').replace(/^https?:\/\//i, '').replace(/\/$/, '');
  return `WR · ${site || 'amzprints.com'}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('No document'));
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(window.pdfjsLib);
    script.onerror = () => reject(new Error('Could not load PDF engine'));
    document.head.appendChild(script);
  });
}

async function loadPdfJs() {
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    return window.pdfjsLib;
  }
  const lib = await loadScript(PDFJS_SRC);
  if (!lib) throw new Error('PDF engine unavailable');
  lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  return lib;
}

async function imageFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

async function pdfFileToPageImages(file) {
  const pdfjs = await loadPdfJs();
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages = [];
  const maxPages = Math.min(doc.numPages || 1, 12);
  for (let i = 1; i <= maxPages; i += 1) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2.2 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    pages.push(canvas.toDataURL('image/jpeg', 0.88));
  }
  return pages;
}

export async function receiptFileToPages(file) {
  if (!isReceiptUploadFile(file)) {
    throw new Error('Upload a PDF or image receipt');
  }
  const type = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const pages = await pdfFileToPageImages(file);
    if (!pages.length) throw new Error('PDF has no pages');
    return pages;
  }
  const url = await imageFileToDataUrl(file);
  if (!url) throw new Error('Could not read receipt image');
  return [url];
}

export function buildStampedReceiptHtml({
  pageDataUrls = [],
  company = {},
  services = POS_MAJOR_SERVICES,
  qrs = {},
  fileName = '',
} = {}) {
  const website = slipWebsiteUrl(company);
  const wm = websiteWatermarkText(company);
  const printTitle = documentFileName({
    docType: 'POS-Stamp',
    customerName: fileName || 'Receipt',
    orderNumber: 'WR',
  });
  const logoHtml = company.logo
    ? `<img src="${escapeHtml(company.logo)}" alt="logo" class="logo" />`
    : '';
  const pages = (pageDataUrls || [])
    .filter(Boolean)
    .map((src, i) => `
      <div class="receipt-page">
        <div class="wm">${escapeHtml(wm)}</div>
        <img src="${escapeHtml(src)}" alt="Receipt page ${i + 1}" />
      </div>`)
    .join('');
  const svc = (services || POS_MAJOR_SERVICES)
    .map((s) => `<div class="svc-card">${escapeHtml(s)}</div>`)
    .join('');
  return `<!DOCTYPE html><html><head><title>${escapeHtml(printTitle)}</title>
    <style>
      @page { size: 80mm auto; margin: 3mm; }
      * { box-sizing: border-box; color: #000 !important; }
      body { font-family: Arial, Helvetica, sans-serif; width: 72mm; margin: 0; color: #000; font-size: 12px; }
      .logo { height:48px; max-width:160px; display:block; margin:0 auto 3px; object-fit:contain; filter: grayscale(1) contrast(1.15); }
      h1 { font-size: 14px; margin: 0; text-align: center; font-weight: 800; }
      .tag { text-align: center; font-size: 10px; margin-top: 2px; font-weight: 700; }
      .center { text-align: center; }
      .title { text-align:center; font-weight:800; letter-spacing:0.12em; font-size:12px;
        border-top:2px solid #000; border-bottom:2px solid #000; padding:5px 0; margin:6px 0; }
      .receipt-page { position: relative; margin: 6px 0; overflow: hidden; }
      .receipt-page img { width: 100%; display: block; }
      .wm { position:absolute; inset:18%; display:flex; align-items:center; justify-content:center;
        pointer-events:none; opacity:0.16; font-weight:900; font-size:28px; letter-spacing:0.12em;
        transform:rotate(-28deg); white-space:nowrap; }
      hr { border: none; border-top: 1.5px dashed #000; margin: 8px 0; }
      ${SLIP_QR_CSS}
      .svc-grid { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
      .svc-card { border:1.5px solid #000; border-radius:4px; padding:4px 5px; font-size:10px; font-weight:800; width:calc(50% - 3px); box-sizing:border-box; }
      .powered { text-align:center; font-size:10px; font-weight:800; letter-spacing:0.04em; margin-top:8px; }
      .barcode-wrap { text-align:center; margin-top:8px; }
    </style></head><body>
    ${logoHtml}
    <h1>${escapeHtml(company.name || 'Amazon Printing Services')}</h1>
    <div class="tag">${escapeHtml(company.address || 'King Road, Mandi Bahauddin')}</div>
    <div class="center" style="font-size:10px;margin-top:2px;font-weight:800">${escapeHtml(wm)}</div>
    <div class="title">STAMPED RECEIPT</div>
    ${pages || '<div class="center">No receipt pages</div>'}
    <hr />
    ${qrs.html || ''}
    <div style="font-size:11px;font-weight:800;letter-spacing:0.06em">OUR SERVICES</div>
    <div class="svc-grid">${svc}</div>
    ${barcodeBlock('AMZ-WR', { id: 'stamp-barcode', height: 32 })}
    <div class="center" style="margin-top:8px;font-size:11px;font-weight:800">Scan WR QR · ${escapeHtml(website.replace(/^https?:\/\//, ''))}</div>
    <div class="powered">${escapeHtml(company.poweredBy || 'Powered By Amazon ERP')}</div>
    ${printOnLoadScript(800)}
    </body></html>`;
}

/**
 * Print an uploaded PDF/image receipt on the 80mm POS printer
 * together with AMZ services + website WR watermark.
 */
export async function printStampedReceipt(file, { company = {}, posCfg } = {}) {
  const pages = await receiptFileToPages(file);
  const cfg = posCfg || mergePosSettings({});
  const website = slipWebsiteUrl(company);
  const qrs = await buildSlipQrs({ company, verifyUrl: website });
  const html = buildStampedReceiptHtml({
    pageDataUrls: pages,
    company: { ...company, poweredBy: cfg.poweredBy },
    services: cfg.slipServices || POS_MAJOR_SERVICES,
    qrs,
    fileName: file?.name || 'Receipt',
  });
  return printHtml(html, { width: 360, height: 900, fallbackPopup: true });
}
