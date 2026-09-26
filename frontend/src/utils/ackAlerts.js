import { isOpenBookingOrder } from '@/utils/purchaseNeeds';

export function dateOnly(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function todayKey(now = new Date()) {
  const d = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(d.getTime())) return dateOnly(new Date().toISOString());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function overdueDays(due, now = new Date()) {
  const key = dateOnly(due);
  if (!key) return 0;
  const dueMs = new Date(`${key}T00:00:00`).getTime();
  const nowMs = new Date(`${todayKey(now)}T00:00:00`).getTime();
  if (!Number.isFinite(dueMs) || !Number.isFinite(nowMs)) return 0;
  return Math.max(0, Math.floor((nowMs - dueMs) / 86400000));
}

export function daysUntil(due, now = new Date()) {
  const key = dateOnly(due);
  if (!key) return null;
  const dueMs = new Date(`${key}T00:00:00`).getTime();
  const nowMs = new Date(`${todayKey(now)}T00:00:00`).getTime();
  if (!Number.isFinite(dueMs) || !Number.isFinite(nowMs)) return null;
  return Math.floor((dueMs - nowMs) / 86400000);
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function invoiceOutstanding(inv) {
  if (!inv) return 0;
  if (/cancel/i.test(String(inv.status || ''))) return 0;
  const total = num(inv.totalAmount != null ? inv.totalAmount : inv.total);
  const prev = num(inv.previousBalance);
  const paid = num(inv.paidAmount != null ? inv.paidAmount : inv.paid);
  return Math.max(0, total + prev - paid);
}

function purchaseOutstanding(po) {
  if (!po) return 0;
  if (/cancel/i.test(String(po.status || ''))) return 0;
  const total = num(po.totalAmount != null ? po.totalAmount : po.total);
  const paid = num(po.paidAmount != null ? po.paidAmount : po.paid);
  return Math.max(0, total - paid);
}

function isReceivedPurchase(po) {
  const s = String(po?.status || '').trim().toLowerCase();
  if (/cancel/.test(s)) return true;
  if (po?.actualDeliveryDate || po?.actual_delivery_date) return true;
  return /received|complete|closed/.test(s) && !/partial/.test(s);
}

export function buildLateOrders(orders = [], now = new Date()) {
  const today = todayKey(now);
  return (Array.isArray(orders) ? orders : [])
    .filter((o) => isOpenBookingOrder(o))
    .map((o) => {
      const due = dateOnly(o.deliveryDate || o.delivery_date);
      if (!due || due >= today) return null;
      const days = overdueDays(due, now);
      if (!(days > 0)) return null;
      return {
        key: `late:${o.id || o.orderId}`,
        kind: 'late-order',
        orderId: o.orderId || o.id,
        id: o.id,
        customerName: o.customerName || '',
        dueDate: due,
        overdueDays: days,
        status: o.status || '',
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.overdueDays - a.overdueDays || String(a.orderId).localeCompare(String(b.orderId)));
}

export function buildOverduePayables(purchases = [], now = new Date()) {
  const today = todayKey(now);
  return (Array.isArray(purchases) ? purchases : [])
    .map((po) => {
      const outstanding = purchaseOutstanding(po);
      if (!(outstanding > 0.009)) return null;
      const due = dateOnly(po.dueDate || po.expectedDeliveryDate || po.expected_delivery_date);
      if (!due || due >= today) return null;
      const days = overdueDays(due, now);
      if (!(days > 0)) return null;
      return {
        key: `payable:${po.id || po.poNumber}`,
        kind: 'overdue-payable',
        supplierName: po.vendorName || po.supplierName || 'Supplier',
        invoiceRef: po.vendorInvoiceNumber || po.poNumber || po.purchaseNo || po.id,
        outstanding,
        dueDate: due,
        overdueDays: days,
        status: po.status || 'Unpaid',
        id: po.id,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.overdueDays - a.overdueDays);
}

/** One row per customer: overall outstanding, not a single order/invoice. */
export function buildCustomerBalanceReminders({ invoices = [], customers = [] } = {}, now = new Date()) {
  const catalog = new Map();
  (Array.isArray(customers) ? customers : []).forEach((c) => {
    if (c?.id) catalog.set(`id:${String(c.id)}`, c);
    const phone = String(c?.phone || '').replace(/\D/g, '').slice(-10);
    if (phone) catalog.set(`phone:${phone}`, c);
    const name = String(c?.name || '').trim().toLowerCase();
    if (name) catalog.set(`name:${name}`, c);
  });

  const groups = new Map();
  (Array.isArray(invoices) ? invoices : []).forEach((inv) => {
    const dueAmt = invoiceOutstanding(inv);
    if (!(dueAmt > 0.009)) return;
    const due = dateOnly(inv.dueDate || inv.due_date);
    const overdue = due ? overdueDays(due, now) : 0;
    const phone = String(inv.customerPhone || '').replace(/\D/g, '').slice(-10);
    const customer = (inv.customerId && catalog.get(`id:${String(inv.customerId)}`))
      || (phone && catalog.get(`phone:${phone}`))
      || catalog.get(`name:${String(inv.customerName || '').trim().toLowerCase()}`)
      || null;
    const key = customer?.id
      ? `receivable-customer:${customer.id}`
      : `receivable-customer:${inv.customerId || phone || inv.customerName || inv.id}`;
    const current = groups.get(key) || {
      key,
      kind: 'customer-balance',
      customerId: customer?.id || inv.customerId || '',
      customerName: customer?.name || inv.customerName || 'Customer',
      customerPhone: customer?.phone || inv.customerPhone || '',
      customerCode: customer?.customerCode || customer?.id || '',
      invoiceOutstanding: 0,
      earliestDue: '',
      overdueDays: 0,
      invoiceCount: 0,
      customer,
    };
    current.invoiceOutstanding += dueAmt;
    current.invoiceCount += 1;
    if (due && (!current.earliestDue || due < current.earliestDue)) current.earliestDue = due;
    if (overdue > current.overdueDays) current.overdueDays = overdue;
    if (customer) current.customer = customer;
    if (customer?.phone) current.customerPhone = customer.phone;
    groups.set(key, current);
  });

  return Array.from(groups.values())
    .map((row) => {
      const overall = row.customer && row.customer.outstanding != null
        ? Math.max(num(row.customer.outstanding), row.invoiceOutstanding)
        : row.invoiceOutstanding;
      return {
        ...row,
        outstanding: overall,
        dueDate: row.earliestDue,
      };
    })
    .filter((row) => row.outstanding > 0.009 && row.overdueDays > 0)
    .sort((a, b) => b.outstanding - a.outstanding || b.overdueDays - a.overdueDays);
}

/** PO delivery reminder: appears from 2 days before expected delivery until the PO is received. */
export function buildPurchaseDeliveryReminders(purchases = [], now = new Date()) {
  return (Array.isArray(purchases) ? purchases : [])
    .map((po) => {
      if (isReceivedPurchase(po)) return null;
      const due = dateOnly(po.expectedDeliveryDate || po.expected_delivery_date);
      if (!due) return null;
      const until = daysUntil(due, now);
      if (until == null || until > 2) return null;
      return {
        key: `po-delivery:${po.id || po.poNumber || po.purchaseNo}`,
        kind: 'po-delivery',
        id: po.id,
        poNumber: po.poNumber || po.purchaseNo || po.id,
        vendorId: po.vendorId || '',
        vendorName: po.vendorName || 'Supplier',
        vendorPhone: po.vendorPhone || '',
        expectedDeliveryDate: due,
        daysUntil: until,
        status: po.status || '',
        items: Array.isArray(po.items) ? po.items : [],
        totalAmount: num(po.totalAmount != null ? po.totalAmount : po.total),
        purchase: po,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.daysUntil - b.daysUntil || String(a.poNumber).localeCompare(String(b.poNumber)));
}

const ACK_RESOLVED_KEY = 'amz_ack_resolved_v1';
const ACK_SCHEDULE_KEY = 'amz_ack_schedule_v1';

export function loadResolvedAckKeys() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ACK_RESOLVED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveResolvedAckKey(key, snapshot) {
  if (typeof window === 'undefined' || !key) return;
  const next = { ...loadResolvedAckKeys(), [key]: snapshot || true };
  window.localStorage.setItem(ACK_RESOLVED_KEY, JSON.stringify(next));
}

export function isAckExplicitlyResolved(row, resolvedMap = {}) {
  const saved = resolvedMap[row.key];
  if (!saved) return false;
  if (saved === true) return true;
  return String(saved.required || '') === String(row.required || '')
    && String(saved.remaining || '') === String(row.remaining || '');
}

export function loadAckSchedule() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ACK_SCHEDULE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistAckSchedule(map) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACK_SCHEDULE_KEY, JSON.stringify(map || {}));
}

export function markAckReminded(key, now = new Date()) {
  if (!key) return loadAckSchedule();
  const next = {
    ...loadAckSchedule(),
    [key]: {
      ...(loadAckSchedule()[key] || {}),
      reminded: true,
      remindedAt: todayKey(now),
    },
  };
  persistAckSchedule(next);
  return next;
}

export function rescheduleAck(key, date) {
  const when = dateOnly(date);
  if (!key || !when) return loadAckSchedule();
  const next = {
    ...loadAckSchedule(),
    [key]: {
      ...(loadAckSchedule()[key] || {}),
      hiddenUntil: when,
      reminded: false,
    },
  };
  persistAckSchedule(next);
  return next;
}

export function isAckSnoozed(key, schedule = {}, now = new Date()) {
  const row = schedule[key];
  if (!row) return false;
  const today = todayKey(now);
  if (row.hiddenUntil) {
    return today < String(row.hiddenUntil);
  }
  return !!row.reminded;
}

export function filterVisibleAckRows(rows, schedule, now = new Date()) {
  return (Array.isArray(rows) ? rows : []).filter((row) => !isAckSnoozed(row.key, schedule, now));
}
