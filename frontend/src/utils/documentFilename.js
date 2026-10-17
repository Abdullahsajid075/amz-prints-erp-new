/**
 * Central, descriptive filename builder for every document-download feature
 * (PDF print titles, CSV/XLSX exports, etc.). One helper so naming stays
 * consistent across Orders, Invoices, Purchase Orders, POS, Accounts,
 * Acknowledgments, Resellers, and any future module.
 *
 * Convention: "Document Type - Identifier - Identifier.ext"
 *   e.g. "Invoice - INV-00125.pdf"
 *        "Purchase Order - PO-00125 - Acme Supplies.pdf"
 *        "Register Closing - 2026-10-16 - Register 01.pdf"
 */

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;

/** Strip characters invalid on Windows/macOS/Linux and collapse whitespace. */
export function sanitizeFilenamePart(value) {
  return String(value ?? '')
    .replace(INVALID_FILENAME_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "2026-01-01" and "2026-01-31" -> "2026-01-01 to 2026-01-31"; single date passthrough. */
export function formatDateRangeForFilename(from, to) {
  const a = sanitizeFilenamePart(from);
  const b = sanitizeFilenamePart(to);
  if (a && b && a !== b) return `${a} to ${b}`;
  return a || b || '';
}

/**
 * Build a descriptive, sanitized filename (without a leading path).
 * @param {string} type - Document type, e.g. "Invoice", "Vendor Ledger", "Register Closing".
 * @param {Array<string>|string} parts - Ordered identifiers appended after the type
 *        (e.g. [orderName, orderNumber]). Empty/falsy parts are dropped.
 * @param {{extension?: string, maxLength?: number}} [opts]
 */
export function buildDocumentFilename(type, parts = [], { extension = '', maxLength = 180 } = {}) {
  const safeType = sanitizeFilenamePart(type) || 'Document';
  const list = Array.isArray(parts) ? parts : [parts];
  const safeParts = list.map(sanitizeFilenamePart).filter(Boolean);
  let base = [safeType, ...safeParts].join(' - ');
  if (!base) base = 'Document';
  if (base.length > maxLength) base = base.slice(0, maxLength).trim();
  const ext = String(extension || '').replace(/^\./, '').trim();
  return ext ? `${base}.${ext}` : base;
}

/**
 * Trigger a browser download for a Blob/data URL with a descriptive filename,
 * without leaving stray object URLs or anchor nodes behind.
 */
export function downloadFile(blobOrUrl, filename) {
  if (typeof document === 'undefined') return;
  const isBlob = typeof Blob !== 'undefined' && blobOrUrl instanceof Blob;
  const url = isBlob ? URL.createObjectURL(blobOrUrl) : blobOrUrl;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'Document';
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (isBlob) setTimeout(() => URL.revokeObjectURL(url), 2000);
}
