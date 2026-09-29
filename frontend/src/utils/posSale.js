/** Shared POS sale helpers — statement, till, and slip. */

/** Payments ledger reference for a POS sale: POSR- + order number. */
export function posReceiptRef(orderId) {
  const raw = String(orderId || '').trim();
  const core = raw.replace(/^POSR[-_]?/i, '').trim();
  return core ? `POSR-${core}` : 'POSR';
}

export function isPosPayment(payment = {}) {
  const cat = String(payment.category || '').toLowerCase();
  const notes = String(payment.notes || '');
  const ref = String(payment.reference || payment.refId || payment.refid || '');
  if (/^posr\b/i.test(ref) || cat === 'pos sale' || /pos\s*sale/i.test(notes)) return true;
  return false;
}

export function displayPaymentRef(payment = {}) {
  const raw = String(payment.reference || payment.refId || payment.refid || '').trim();
  if (/^POSR[-_]?/i.test(raw)) return posReceiptRef(raw);
  if (!isPosPayment(payment)) return raw;
  const notes = String(payment.notes || '');
  const fromNotes = notes.match(/\b(?:order|sale)\s+([A-Z0-9][A-Z0-9/_-]*)/i);
  return posReceiptRef(fromNotes ? fromNotes[1] : raw);
}


export function isPosOrder(o) {
  const dt = String(o?.docType || o?.doctype || '').toLowerCase();
  if (dt === 'pos') return true;
  return /pos\s*sale/i.test(String(o?.remarks || o?.notes || ''));
}

export function orderAmount(o) {
  const direct = Number(o?.totalAmount || o?.total || 0);
  if (direct > 0) return direct;
  return (o?.products || []).reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.rate) || 0), 0);
}

export function parsePosCashier(order = {}) {
  const direct = String(order.soldBy || order.cashier || order.openedBy || '').trim();
  if (direct) return direct;
  const m = String(order.remarks || order.notes || '').match(/\bBy\s+([^·|,]+)/i);
  return m ? m[1].trim() : '';
}

export function parsePosMethod(order = {}) {
  if (order.paymentMethod) return order.paymentMethod;
  const remarks = String(order.remarks || '');
  const chunk = remarks.split('·')[1];
  if (chunk && !/^by\b/i.test(chunk.trim()) && !/^disc/i.test(chunk.trim()) && !/^recv/i.test(chunk.trim())) {
    return chunk.trim();
  }
  if (/card/i.test(remarks)) return 'Card';
  if (/cash/i.test(remarks)) return 'Cash';
  return 'Cash';
}

export function posItemSummary(order = {}, limit = 3) {
  const names = (order.products || [])
    .map((p) => String(p.name || '').trim())
    .filter(Boolean);
  if (!names.length) return '—';
  const head = names.slice(0, limit).join(', ');
  return names.length > limit ? `${head} +${names.length - limit}` : head;
}
