export const INVOICE_REQUIRED_MESSAGE = 'Invoice Required: Please generate the invoice before delivering this order.';

export function orderHasInvoice(order) {
  return !!(order?.invoiceId || order?.invoiceNumber || order?.hasInvoice);
}

export function isReadyForDeliveryStatus(status) {
  return /^ready(\s+for\s+delivery)?$/i.test(String(status || '').trim());
}

export function isClosedOrDeliveredStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  return s === 'delivered' || s === 'complete' || s === 'completed' || s === 'closed';
}

export function canManuallyDeliver(order) {
  if (!order) return { ok: false, message: INVOICE_REQUIRED_MESSAGE };
  const status = order.status;
  if (/cancel/i.test(String(status || ''))) {
    return { ok: false, message: 'Cancelled orders cannot be delivered' };
  }
  if (isClosedOrDeliveredStatus(status)) {
    return { ok: true, already: true };
  }
  if (!orderHasInvoice(order)) {
    return { ok: false, message: INVOICE_REQUIRED_MESSAGE };
  }
  return { ok: true };
}
