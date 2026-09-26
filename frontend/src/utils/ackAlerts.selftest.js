/**
 * Standalone Node self-test for acknowledgment alert math.
 * Mirrors frontend/src/utils/ackAlerts.js (keep in sync).
 */
function dateOnly(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return '';
}

function todayKey(now) {
  return now.toISOString().slice(0, 10);
}

function overdueDays(due, now) {
  const key = dateOnly(due);
  if (!key) return 0;
  const dueMs = new Date(`${key}T00:00:00`).getTime();
  const nowMs = new Date(`${todayKey(now)}T00:00:00`).getTime();
  return Math.max(0, Math.floor((nowMs - dueMs) / 86400000));
}

function isOpenBookingOrder(order) {
  const dt = String(order.docType || order.doctype || 'Order').toLowerCase();
  if (dt === 'pos' || dt === 'quotation') return false;
  const s = String(order.status || '').trim().toLowerCase();
  if (/cancel/.test(s)) return false;
  if (/^(delivered|completed|complete|closed)$/.test(s)) return false;
  return true;
}

function buildLateOrders(orders, now) {
  const today = todayKey(now);
  return orders.filter(isOpenBookingOrder).map((o) => {
    const due = dateOnly(o.deliveryDate);
    if (!due || due >= today) return null;
    const days = overdueDays(due, now);
    if (!(days > 0)) return null;
    return { orderId: o.orderId, overdueDays: days, status: o.status };
  }).filter(Boolean);
}

function invoiceOutstanding(inv) {
  return Math.max(0, Number(inv.totalAmount || 0) + Number(inv.previousBalance || 0) - Number(inv.paidAmount || 0));
}

function buildOverdueReceivables(invoices, now) {
  const today = todayKey(now);
  return invoices.map((inv) => {
    const outstanding = invoiceOutstanding(inv);
    if (!(outstanding > 0.009)) return null;
    const due = dateOnly(inv.dueDate);
    if (!due || due >= today) return null;
    return { invoiceNumber: inv.invoiceNumber, outstanding, overdueDays: overdueDays(due, now) };
  }).filter(Boolean);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const now = new Date('2026-09-25T12:00:00Z');
assert(overdueDays('2026-09-20', now) === 5, 'overdue days');
assert(overdueDays('2026-09-25', now) === 0, 'due today');

const late = buildLateOrders([
  { orderId: 'ORD-1', status: 'Ready', deliveryDate: '2026-09-20', docType: 'Order' },
  { orderId: 'ORD-2', status: 'Delivered', deliveryDate: '2026-09-01', docType: 'Order' },
  { orderId: 'ORD-3', status: 'Printing', deliveryDate: '2026-09-26', docType: 'Order' },
], now);
assert(late.length === 1 && late[0].orderId === 'ORD-1' && late[0].overdueDays === 5, 'late order stays until delivered');

const rec = buildOverdueReceivables([
  { invoiceNumber: 'INV-1', totalAmount: 1000, paidAmount: 400, dueDate: '2026-09-10' },
  { invoiceNumber: 'INV-2', totalAmount: 1000, paidAmount: 1000, dueDate: '2026-09-10' },
  { invoiceNumber: 'INV-3', totalAmount: 500, paidAmount: 100, dueDate: '2026-09-26' },
], now);
assert(rec.length === 1 && rec[0].invoiceNumber === 'INV-1' && rec[0].outstanding === 600, 'partial receivable stays');

console.log('ackAlerts ok');
