import { qrPngDataUrl } from '@/utils/customerDocuments';
import { slipQrRowHtml } from '@/utils/printHelpers';

/** High-res source so a 1-inch printed QR stays sharp on thermal paper. */
export const SLIP_QR_PX = 256;

export function slipWebsiteUrl(company = {}) {
  const raw = String(company.website || 'https://amzprints.com').trim() || 'https://amzprints.com';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function slipOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : 'https://erp.amzprints.com';
}

/** Public page that confirms the document (invoice, POS/order, or payment). */
export function verifyUrlForSlip({
  shareToken,
  invoiceUrl,
  orderId,
  trackingNumber,
  reference,
  paymentId,
  code,
} = {}) {
  const origin = slipOrigin();
  if (shareToken) return `${origin}/invoice/${encodeURIComponent(shareToken)}`;
  if (invoiceUrl) return invoiceUrl;
  const key = String(trackingNumber || orderId || reference || paymentId || code || '').trim();
  if (!key) return `${origin}/verify`;
  return `${origin}/verify/${encodeURIComponent(key)}`;
}

export async function blackQrPng(value, size = SLIP_QR_PX) {
  return qrPngDataUrl(value, size, { fgColor: '#000000' });
}

export async function buildSlipQrs({ company = {}, verifyUrl } = {}) {
  const website = slipWebsiteUrl(company);
  const verify = verifyUrl || website;
  let webQr = '';
  let verifyQr = '';
  try {
    [webQr, verifyQr] = await Promise.all([
      blackQrPng(website),
      blackQrPng(verify),
    ]);
  } catch {
    /* slip still prints without QRs */
  }
  return {
    website,
    verifyUrl: verify,
    webQr,
    verifyQr,
    html: slipQrRowHtml(webQr, verifyQr),
  };
}
