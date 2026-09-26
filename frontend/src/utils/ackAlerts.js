import { isOpenBookingOrder } from '@/utils/purchaseNeeds';

function dateOnly(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function todayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function overdueDays(due, now = new Date()) {
  const key = dateOnly(due);
  if (!key) return 0;
  const dueMs = new Date(`${key}T00:00:00`).getTime();
  const nowMs = new Date(`${todayKey(now)}T00:00:00`).getTime();
  if (!Number.isFinite(dueMs) || !Number.isFinite(nowMs)) return 0;
  return Math.max(0, Math.floor((nowMs - dueMs) / 86400000));
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

export function buildOverdueReceivables(invoices = [], now = new Date()) {
  const today = todayKey(now);
  return (Array.isArray(invoices) ? invoices : [])
    .map((inv) => {
      const outstanding = invoiceOutstanding(inv);
      if (!(outstanding > 0.009)) return null;
      const due = dateOnly(inv.dueDate || inv.due_date);
      if (!due || due >= today) return null;
      const days = overdueDays(due, now);
      if (!(days > 0)) return null;
      return {
        key: `receivable:${inv.id || inv.invoiceNumber}`,
        kind: 'overdue-receivable',
        customerName: inv.customerName || '',
        invoiceNumber: inv.invoiceNumber || inv.invoiceNo || inv.id,
        outstanding,
        dueDate: due,
        overdueDays: days,
        status: inv.status || 'Unpaid',
        id: inv.id,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.overdueDays - a.overdueDays);
}

export function buildAdminReviewOrders(orders = []) {
  return (Array.isArray(orders) ? orders : [])
    .filter((o) => /\[ADMIN REVIEW: delivery/i.test(String(o.remarks || o.notes || '')))
    .map((o) => ({
      key: `review:${o.id || o.orderId}`,
      kind: 'admin-review',
      orderId: o.orderId || o.id,
      id: o.id,
      customerName: o.customerName || '',
      status: o.status || '',
      remarks: o.remarks || '',
    }));
}

const ACK_RESOLVED_KEY = 'amz_ack_resolved_v1';

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
