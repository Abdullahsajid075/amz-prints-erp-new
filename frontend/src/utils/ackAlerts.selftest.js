/**
 * Standalone Node self-test for acknowledgment alert math.
 */
function dateOnly(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function todayKey(now) {
  const d = now instanceof Date ? now : new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function overdueDays(due, now) {
  const key = dateOnly(due);
  if (!key) return 0;
  const dueMs = Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10));
  const t = todayKey(now);
  const nowMs = Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10));
  return Math.max(0, Math.floor((nowMs - dueMs) / 86400000));
}

function daysUntil(due, now) {
  const key = dateOnly(due);
  if (!key) return null;
  const dueMs = Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10));
  const t = todayKey(now);
  const nowMs = Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10));
  return Math.floor((dueMs - nowMs) / 86400000);
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

function buildCustomerBalanceReminders({ invoices, customers }, now) {
  const groups = new Map();
  invoices.forEach((inv) => {
    const dueAmt = invoiceOutstanding(inv);
    if (!(dueAmt > 0.009)) return;
    const due = dateOnly(inv.dueDate);
    const overdue = due ? overdueDays(due, now) : 0;
    const cust = customers.find((c) => String(c.id) === String(inv.customerId));
    const key = `receivable-customer:${inv.customerId}`;
    const current = groups.get(key) || { customerId: inv.customerId, invoiceOutstanding: 0, overdueDays: 0 };
    current.invoiceOutstanding += dueAmt;
    if (overdue > current.overdueDays) current.overdueDays = overdue;
    current.outstanding = cust && cust.outstanding != null
      ? Math.max(Number(cust.outstanding) || 0, current.invoiceOutstanding)
      : current.invoiceOutstanding;
    groups.set(key, current);
  });
  return Array.from(groups.values()).filter((r) => r.outstanding > 0.009 && r.overdueDays > 0);
}

function isReceivedPurchase(po) {
  const s = String(po.status || '').toLowerCase();
  if (/cancel/.test(s)) return true;
  if (po.actualDeliveryDate) return true;
  return /received|complete|closed/.test(s) && !/partial/.test(s);
}

function buildPurchaseDeliveryReminders(purchases, now) {
  return purchases.map((po) => {
    if (isReceivedPurchase(po)) return null;
    const due = dateOnly(po.expectedDeliveryDate);
    if (!due) return null;
    const until = daysUntil(due, now);
    if (until == null || until > 2) return null;
    return { poNumber: po.poNumber, daysUntil: until };
  }).filter(Boolean);
}

function isAckSnoozed(key, schedule, now) {
  const row = schedule[key];
  if (!row) return false;
  const today = todayKey(now);
  if (row.hiddenUntil) return today < String(row.hiddenUntil);
  return !!row.reminded;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const now = new Date(Date.UTC(2026, 8, 25, 12, 0, 0));
assert(overdueDays('2026-09-20', now) === 5, 'overdue days');
assert(overdueDays('2026-09-25', now) === 0, 'due today');
assert(daysUntil('2026-09-27', now) === 2, '2 days before');
assert(daysUntil('2026-09-26', now) === 1, '1 day before');
assert(daysUntil('2026-09-25', now) === 0, 'due today until');

const late = buildLateOrders([
  { orderId: 'ORD-1', status: 'Ready', deliveryDate: '2026-09-20', docType: 'Order' },
  { orderId: 'ORD-2', status: 'Delivered', deliveryDate: '2026-09-01', docType: 'Order' },
  { orderId: 'ORD-3', status: 'Printing', deliveryDate: '2026-09-26', docType: 'Order' },
], now);
assert(late.length === 1 && late[0].orderId === 'ORD-1', 'delivered orders stay out of late list');

const rec = buildCustomerBalanceReminders({
  invoices: [
    { customerId: 'c1', invoiceNumber: 'INV-1', totalAmount: 400, paidAmount: 0, dueDate: '2026-09-10' },
    { customerId: 'c1', invoiceNumber: 'INV-2', totalAmount: 600, paidAmount: 200, dueDate: '2026-09-12' },
    { customerId: 'c2', invoiceNumber: 'INV-3', totalAmount: 500, paidAmount: 100, dueDate: '2026-09-26' },
  ],
  customers: [{ id: 'c1', outstanding: 1200 }],
}, now);
assert(rec.length === 1 && rec[0].customerId === 'c1', 'one row per overdue customer');
assert(rec[0].outstanding === 1200, 'overall customer balance, not one invoice');

const pos = buildPurchaseDeliveryReminders([
  { poNumber: 'PO-1', expectedDeliveryDate: '2026-09-27', status: 'Ordered' },
  { poNumber: 'PO-2', expectedDeliveryDate: '2026-09-30', status: 'Ordered' },
  { poNumber: 'PO-3', expectedDeliveryDate: '2026-09-26', status: 'Received' },
], now);
assert(pos.length === 1 && pos[0].poNumber === 'PO-1' && pos[0].daysUntil === 2, 'PO shows 2 days before, received hidden');

assert(isAckSnoozed('x', { x: { reminded: true } }, now) === true, 'reminded hides');
assert(isAckSnoozed('x', { x: { hiddenUntil: '2026-09-28' } }, now) === true, 'future reschedule hides');
assert(isAckSnoozed('x', { x: { hiddenUntil: '2026-09-25' } }, now) === false, 'appears on reschedule date');

console.log('ackAlerts ok');
