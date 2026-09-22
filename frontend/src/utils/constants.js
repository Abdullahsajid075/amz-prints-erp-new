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
  RECEIVED: 'Order Received',
  DESIGNING: 'Designing',
  PROOF_APPROVAL: 'Proof Approval',
  PRINTING: 'Printing',
  FINISHING: 'Finishing',
  PACKING: 'Packing',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

export const OPEN_ORDER_STATUSES = [
  ORDER_STATUS.RECEIVED,
  ORDER_STATUS.DESIGNING,
  ORDER_STATUS.PROOF_APPROVAL,
  ORDER_STATUS.PRINTING,
  ORDER_STATUS.FINISHING,
  ORDER_STATUS.PACKING,
  ORDER_STATUS.READY,
];

export function isBookingOrder(order) {
  const dt = String(order?.docType || order?.doctype || 'Order').toLowerCase();
  if (dt === 'pos' || dt === 'quotation') return false;
  if (/pos\s*sale/i.test(String(order?.remarks || ''))) return false;
  return true;
}

export function isOpenOrder(order) {
  if (!isBookingOrder(order)) return false;
  const s = String(order?.status || '').trim().toLowerCase();
  return OPEN_ORDER_STATUSES.some((st) => st.toLowerCase() === s);
}

/** Job has not moved into production yet — keep these at the top of the list. */
export function isNotStartedOrder(order) {
  const s = String(order?.status || '').trim().toLowerCase();
  return !s || s === 'order received' || s === 'received' || s === 'pending' || s === 'new';
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