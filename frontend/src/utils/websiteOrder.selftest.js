const ORDER_STATUS = {
  PENDING: 'Pending',
  RECEIVED: 'Order Received',
};

const OPEN_ORDER_STATUSES = [ORDER_STATUS.PENDING, ORDER_STATUS.RECEIVED];

function isBookingOrder(order) {
  const dt = String(order?.docType || order?.doctype || 'Order').toLowerCase();
  if (dt === 'pos' || dt === 'quotation') return false;
  if (/pos\s*sale/i.test(String(order?.remarks || ''))) return false;
  return true;
}

function isSettledOrderStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  return s === 'delivered' || s === 'complete' || s === 'completed'
    || s === 'closed' || s === 'cancelled' || s === 'canceled';
}

function isOpenOrder(order) {
  if (!isBookingOrder(order)) return false;
  if (isSettledOrderStatus(order?.status)) return false;
  const s = String(order?.status || '').trim().toLowerCase();
  if (s === 'ready for delivery') return true;
  return OPEN_ORDER_STATUSES.some((st) => st.toLowerCase() === s);
}

function isNotStartedOrder(order) {
  const s = String(order?.status || '').trim().toLowerCase();
  return !s || s === 'order received' || s === 'received' || s === 'pending' || s === 'new';
}

function isPendingStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  return s === 'pending' || s === 'new' || s === 'awaiting confirmation';
}

function isWebsiteOrder(order) {
  if (!order) return false;
  const id = String(order.orderId || order.order_id || '').trim();
  if (/^WEB[-_]/i.test(id)) return true;
  const remarks = String(order.remarks || order.notes || '');
  if (/website/i.test(remarks)) return true;
  const source = String(order.source || order.channel || order.origin || '').trim().toLowerCase();
  return source === 'website' || source === 'web';
}

function isPendingWebsiteOrder(order) {
  return isWebsiteOrder(order) && isPendingStatus(order?.status);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(ORDER_STATUS.PENDING === 'Pending', 'pending constant');
assert(isPendingStatus('Pending'), 'pending status');
assert(isPendingStatus('new'), 'new is pending');
assert(!isPendingStatus('Order Received'), 'received is not pending');
assert(isWebsiteOrder({ orderId: 'WEB-2026-001', remarks: '' }), 'WEB- id');
assert(isWebsiteOrder({ orderId: 'ORD-1', remarks: 'Website order' }), 'website remarks');
assert(isWebsiteOrder({ remarks: 'Website · mug' }), 'website prefix');
assert(!isWebsiteOrder({ orderId: 'ORD-9', remarks: 'Counter booking' }), 'walk-in not website');

const pendingWeb = { orderId: 'WEB-1', remarks: 'Website order', status: 'Pending' };
assert(isPendingWebsiteOrder(pendingWeb), 'pending website');
assert(isNotStartedOrder(pendingWeb), 'pending is not started');
assert(isOpenOrder(pendingWeb), 'pending website stays in progress');
assert(!isPendingWebsiteOrder({ ...pendingWeb, status: 'Order Received' }), 'confirmed not pending');

console.log('websiteOrder ok');
