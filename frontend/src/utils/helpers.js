export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return '';
  const ymd = toDateInputValue(date);
  if (!ymd) return '';
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/** Value for `<input type="date">` — always yyyy-MM-dd or empty. */
export function toDateInputValue(value) {
  if (value == null || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const months = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const named = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{4})$/);
  if (named) {
    const mon = months[named[2].slice(0, 3).toLowerCase()];
    if (mon) return `${named[3]}-${mon}-${String(named[1]).padStart(2, '0')}`;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const PO_WORKFLOW_STATUSES = ['Draft', 'Submitted', 'Received', 'Reversed', 'Cancelled'];

/**
 * Workflow status only. Payment is paidAmount, not status.
 * Legacy Ordered / Partial Paid / Fully Paid → Submitted, unless the PO was already received.
 */
export function normalizePoStatus(status, extra = {}) {
  const s = String(status || '').trim();
  const lower = s.toLowerCase();
  if (/revers/.test(lower)) return 'Reversed';
  if (/cancel/.test(lower)) return 'Cancelled';
  if (lower === 'received' || /^received\b/.test(lower)) return 'Received';
  const delivered = extra.actualDeliveryDate || extra.actualdeliverydate || extra.actual_delivery_date;
  const notes = String(extra.notes || '');
  if ((delivered && String(delivered).trim()) || /\[STOCK_APPLIED\]/i.test(notes)) {
    return 'Received';
  }
  if (!s || lower === 'draft') return 'Draft';
  if (['ordered', 'purchase order', 'in transit', 'partial paid', 'fully paid', 'partial', 'submitted'].includes(lower)) {
    return 'Submitted';
  }
  return PO_WORKFLOW_STATUSES.includes(s) ? s : 'Submitted';
}

export function isPoPayable(status, extra = {}) {
  const n = normalizePoStatus(status, extra);
  return n !== 'Cancelled' && n !== 'Reversed';
}

export function isPoReceived(status, extra = {}) {
  return normalizePoStatus(status, extra) === 'Received';
}

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateOrderTotal = (products = []) => {
  return products.reduce((total, product) => {
    return total + (product.quantity * product.rate);
  }, 0);
};

/** Always a string array — never crash .join() if the API sent a JSON string. */
export const invoiceOrderIds = (invoice) => {
  if (!invoice) return [];
  const ids = [];
  const push = (v) => {
    const s = String(v || '').trim();
    if (s && !ids.includes(s)) ids.push(s);
  };
  let extra = invoice.orderIds ?? invoice.orderids;
  if (typeof extra === 'string') {
    const t = extra.trim();
    if (!t) extra = [];
    else if (t.startsWith('[')) {
      try { extra = JSON.parse(t); } catch { extra = t.split(/[,|]/); }
    } else extra = t.split(/[,|]/);
  }
  if (Array.isArray(extra)) extra.forEach(push);
  push(invoice.orderId || invoice.orderid);
  return ids;
};

export const invoiceLineItems = (invoice) => {
  let items = invoice?.items;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  return Array.isArray(items) ? items.filter(Boolean) : [];
};

export const invoiceBalanceDue = (invoice) =>
  Math.max(
    0,
    Number(invoice?.totalAmount ?? invoice?.total ?? 0)
      + Number(invoice?.previousBalance ?? invoice?.previousbalance ?? 0)
      - Number(invoice?.paidAmount ?? invoice?.paid ?? 0)
  );

/** 2 = unpaid, 1 = partial due, 0 = paid / cancelled — used to pin pending invoices on top. */
export function invoicePendingScore(invoice) {
  const st = String(invoice?.status || '').toLowerCase();
  if (st === 'paid' || st === 'cancelled' || st === 'canceled' || st === 'void') return 0;
  if (!(invoiceBalanceDue(invoice) > 0.009)) return 0;
  const paid = Number(invoice?.paidAmount ?? invoice?.paid ?? 0);
  return paid <= 0.009 ? 2 : 1;
}

export const getStatusColor = (status) => {
  const colors = {
    'Pending': 'bg-amber-100 text-amber-800',
    'Order Received': 'bg-blue-100 text-blue-800',
    'Designing': 'bg-purple-100 text-purple-800',
    'Proof Approval': 'bg-yellow-100 text-yellow-800',
    'Printing': 'bg-indigo-100 text-indigo-800',
    'Finishing': 'bg-pink-100 text-pink-800',
    'Packing': 'bg-cyan-100 text-cyan-800',
    'Ready': 'bg-green-100 text-green-800',
    'Ready for Delivery': 'bg-green-100 text-green-800',
    'Delivered': 'bg-emerald-100 text-emerald-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/** Legacy blank / missing approved counts as approved so old expenses stay on the books. */
export const isExpenseApproved = (expense) => {
  if (!expense) return false;
  if (expense.approved === false) return false;
  const s = String(expense.approved ?? expense.status ?? '').trim().toLowerCase();
  if (s === 'false' || s === '0' || s === 'no' || s === 'pending' || s === 'rejected') return false;
  return true;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};