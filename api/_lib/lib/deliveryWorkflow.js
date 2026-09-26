/**
 * Invoice vs delivery are separate operations.
 * Generating an invoice only makes an order eligible for delivery.
 */

const INVOICE_REQUIRED_MESSAGE = 'Invoice Required: Please generate the invoice before delivering this order.';
const INVOICE_ELIGIBLE_NOTE = 'Invoice generated — eligible for delivery (not delivered)';
const MANUAL_DELIVER_NOTE = 'Manual delivery confirmation — order closed';
const RESTORE_NOTE = 'Restored after incorrect auto-delivery on invoice';
const REOPEN_NOTE = 'Reopened — invoice required before delivery';
const ADMIN_REVIEW_NOTE = 'ADMIN REVIEW: delivery status could not be verified automatically';

const AUTO_DELIVER_NOTE_RE = /invoice linked\s*[—\-\u2013]\s*marked delivered/i;
const MANUAL_DELIVER_NOTE_RE = /manual delivery confirmation/i;
const GENUINE_DELIVER_NOTE_RE = /manual delivery|delivered by|delivery slip|physically delivered|staff delivered/i;
const SETTLED_RE = /^(delivered|complete|completed|closed)$/i;

function isSettledStatus(status) {
  return SETTLED_RE.test(String(status || '').trim());
}

function isDeliveredStatus(status) {
  return SETTLED_RE.test(String(status || '').trim());
}

function isCancelledStatus(status) {
  return /cancel/i.test(String(status || ''));
}

function isPosOrder(order) {
  const dt = String(order?.doc_type || order?.docType || 'Order').toLowerCase();
  if (dt === 'pos') return true;
  return /pos\s*sale/i.test(String(order?.remarks || ''));
}

function asHistory(order) {
  const raw = order?.status_history || order?.statusHistory;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function previousStatusBefore(history, idx) {
  const start = idx == null ? history.length - 1 : idx;
  for (let i = start - 1; i >= 0; i -= 1) {
    const st = String(history[i]?.status || '').trim();
    if (!st) continue;
    if (SETTLED_RE.test(st)) continue;
    return st;
  }
  return '';
}

function lastAutoDeliverIndex(history) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (AUTO_DELIVER_NOTE_RE.test(String(history[i]?.note || ''))) return i;
  }
  return -1;
}

function hasGenuineDeliveryEvidence(history) {
  return history.some((h) => {
    const note = String(h?.note || '');
    return MANUAL_DELIVER_NOTE_RE.test(note) || GENUINE_DELIVER_NOTE_RE.test(note);
  });
}

function isReadyStatus(status) {
  return /^ready(\s+for\s+delivery)?$/i.test(String(status || '').trim());
}

/**
 * Decide what to do with a Delivered order after the auto-deliver bug.
 * Conservative: restore only when history proves the system wrote Delivered.
 * Never guess a previous status — flag instead.
 */
function classifyIncorrectDelivery(order, { hasInvoice } = {}) {
  if (!order) return { action: 'skip', reason: 'missing' };
  if (isPosOrder(order)) return { action: 'keep', reason: 'pos' };
  if (isCancelledStatus(order.status)) return { action: 'skip', reason: 'cancelled' };
  if (!isDeliveredStatus(order.status)) return { action: 'skip', reason: 'not-delivered' };

  const history = asHistory(order);
  const autoIdx = lastAutoDeliverIndex(history);
  const genuine = hasGenuineDeliveryEvidence(history);

  if (autoIdx >= 0) {
    const afterAuto = history.slice(autoIdx + 1);
    const laterManual = afterAuto.some((h) => {
      const note = String(h?.note || '');
      return MANUAL_DELIVER_NOTE_RE.test(note) || GENUINE_DELIVER_NOTE_RE.test(note);
    });
    if (laterManual) return { action: 'keep', reason: 'manual-after-auto' };
    const previousStatus = previousStatusBefore(history, autoIdx);
    if (!hasInvoice) {
      return {
        action: 'reopen-ready',
        restoreTo: 'Ready',
        previousStatus: previousStatus || 'Ready',
        reason: 'auto-no-invoice',
        invoiceRequired: true,
      };
    }
    if (!previousStatus) {
      return { action: 'flag', reason: 'unknown-previous', keepStatus: true, invoiceRequired: false };
    }
    return {
      action: 'restore',
      restoreTo: previousStatus,
      previousStatus,
      reason: 'auto-invoice-deliver',
    };
  }

  if (!hasInvoice) {
    if (genuine) {
      return { action: 'flag', reason: 'genuine-no-invoice', keepStatus: true };
    }
    return { action: 'flag', reason: 'delivered-no-invoice', keepStatus: true };
  }

  const last = history[history.length - 1] || {};
  if (/^status update$/i.test(String(last.note || '')) && /delivered/i.test(String(last.status || order.status))) {
    const previousStatus = previousStatusBefore(history, history.length) || '';
    // Proven bulk PATCH from the 2026-09-26 auto-deliver repair (same minute).
    if (/^2026-09-26 07:14/.test(String(last.at || '')) && previousStatus) {
      return {
        action: 'restore',
        restoreTo: previousStatus,
        previousStatus,
        reason: 'bulk-status-patch',
      };
    }
    return {
      action: 'flag',
      reason: 'status-update-after-invoice',
      previousStatus,
      keepStatus: true,
    };
  }

  return { action: 'keep', reason: 'genuine-or-unknown' };
}

function buildHistoryEntry({ status, at, note, previousStatus, by, process }) {
  const row = { status, at, note: note || '' };
  if (previousStatus) row.previousStatus = previousStatus;
  if (by) row.by = by;
  if (process) row.process = process;
  return row;
}

function appendAdminReviewRemark(remarks, reason) {
  const tag = `[ADMIN REVIEW: delivery — ${reason}]`;
  const current = String(remarks || '').trim();
  if (current.includes('[ADMIN REVIEW: delivery')) return current;
  return current ? `${current} | ${tag}` : tag;
}

function canDeliverOrder({ hasInvoice, status, docType, remarks }) {
  if (isPosOrder({ doc_type: docType, remarks })) return { ok: true };
  if (isCancelledStatus(status)) return { ok: false, message: 'Cancelled orders cannot be delivered' };
  if (isDeliveredStatus(status)) return { ok: true, already: true };
  if (!hasInvoice) return { ok: false, message: INVOICE_REQUIRED_MESSAGE };
  return { ok: true };
}

module.exports = {
  INVOICE_REQUIRED_MESSAGE,
  INVOICE_ELIGIBLE_NOTE,
  MANUAL_DELIVER_NOTE,
  RESTORE_NOTE,
  REOPEN_NOTE,
  ADMIN_REVIEW_NOTE,
  AUTO_DELIVER_NOTE_RE,
  isSettledStatus,
  isDeliveredStatus,
  isCancelledStatus,
  isPosOrder,
  isReadyStatus,
  asHistory,
  classifyIncorrectDelivery,
  buildHistoryEntry,
  appendAdminReviewRemark,
  canDeliverOrder,
  previousStatusBefore,
};
