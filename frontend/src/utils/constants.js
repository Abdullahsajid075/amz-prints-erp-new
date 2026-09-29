export const MODULES = {
  DASHBOARD: 'dashboard',
  QUOTATIONS: 'quotations',
  ORDERS: 'orders',
  TOKENS: 'tokens',
  INVOICES: 'invoices',
  CUSTOMERS: 'customers',
  CRM: 'crm',
  PURCHASES: 'purchases',
  WAREHOUSE: 'warehouse',
  POS: 'pos',
  HR: 'hr',
  CALCULATOR: 'calculator',
  ACCOUNTS: 'accounts',
  VENDORS: 'vendors',
  REPORTS: 'reports',
  SETTINGS: 'settings',
};

export const ORDER_STATUS = {
  PENDING: 'Pending',
  RECEIVED: 'Order Received',
  DESIGNING: 'Designing',
  PROOF_APPROVAL: 'Proof Approval',
  PRINTING: 'Printing',
  READY: 'Ready for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/** Legacy labels folded into the live statuses (dropdown shows one of each). */
const ORDER_STATUS_ALIASES = {
  Ready: ORDER_STATUS.READY,
  'Ready for Delivery': ORDER_STATUS.READY,
  Finishing: ORDER_STATUS.PRINTING,
  Packing: ORDER_STATUS.PRINTING,
  'Finishing and packing': ORDER_STATUS.PRINTING,
  'Finishing and Packing': ORDER_STATUS.PRINTING,
  Closed: ORDER_STATUS.DELIVERED,
  Complete: ORDER_STATUS.DELIVERED,
  Completed: ORDER_STATUS.DELIVERED,
};

export function normalizeOrderStatus(status) {
  const raw = String(status || '').trim();
  if (!raw) return ORDER_STATUS.RECEIVED;
  if (ORDER_STATUS_ALIASES[raw]) return ORDER_STATUS_ALIASES[raw];
  const lower = raw.toLowerCase();
  if (lower === 'ready' || lower === 'ready for delivery') return ORDER_STATUS.READY;
  if (lower === 'finishing' || lower === 'packing' || lower === 'finishing and packing') return ORDER_STATUS.PRINTING;
  if (lower === 'closed' || lower === 'complete' || lower === 'completed') return ORDER_STATUS.DELIVERED;
  return raw;
}

export const ORDER_STATUS_OPTIONS = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.RECEIVED,
  ORDER_STATUS.DESIGNING,
  ORDER_STATUS.PROOF_APPROVAL,
  ORDER_STATUS.PRINTING,
  ORDER_STATUS.READY,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
];

export const OPEN_ORDER_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.RECEIVED,
  ORDER_STATUS.DESIGNING,
  ORDER_STATUS.PROOF_APPROVAL,
  ORDER_STATUS.PRINTING,
  ORDER_STATUS.READY,
];

export function isBookingOrder(order) {
  const dt = String(order?.docType || order?.doctype || 'Order').toLowerCase();
  if (dt === 'pos' || dt === 'quotation') return false;
  if (/pos\s*sale/i.test(String(order?.remarks || ''))) return false;
  return true;
}

export function isSettledOrderStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  return s === 'delivered' || s === 'complete' || s === 'completed'
    || s === 'closed' || s === 'cancelled' || s === 'canceled';
}

export function isOpenOrder(order) {
  if (!isBookingOrder(order)) return false;
  if (isSettledOrderStatus(order?.status)) return false;
  const s = normalizeOrderStatus(order?.status).toLowerCase();
  return OPEN_ORDER_STATUSES.some((st) => st.toLowerCase() === s);
}

/** Job has not moved into production yet — keep these at the top of the list. */
export function isNotStartedOrder(order) {
  const s = String(order?.status || '').trim().toLowerCase();
  return !s || s === 'order received' || s === 'received' || s === 'pending' || s === 'new';
}

export function isPendingStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  return s === 'pending' || s === 'new' || s === 'awaiting confirmation';
}

/** Website checkout jobs — WEB- ids and/or Website remarks. */
export function isWebsiteOrder(order) {
  if (!order) return false;
  const id = String(order.orderId || order.order_id || '').trim();
  if (/^WEB[-_]/i.test(id)) return true;
  const remarks = String(order.remarks || order.notes || '');
  if (/website/i.test(remarks)) return true;
  const source = String(order.source || order.channel || order.origin || '').trim().toLowerCase();
  return source === 'website' || source === 'web';
}

export function isPendingWebsiteOrder(order) {
  return isWebsiteOrder(order) && isPendingStatus(order?.status);
}

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  BANK: 'Bank Transfer',
  ONLINE: 'Online Payment',
  UPI: 'UPI',
  CHEQUE: 'Cheque'
};

export const USER_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALES: 'Sales',
  DESIGNER: 'Designer',
  PRODUCTION: 'Production Staff',
  ACCOUNTS: 'Accounts',
  CASHIER: 'Cashier',
  EMPLOYEE: 'Employee'
};

export const COLORS = {
  PRIMARY: '#ff6d00',
  SECONDARY: '#0747a3',
  BACKGROUND: '#F5F7FB',
  CARD: '#FFFFFF',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#0747a3'
};