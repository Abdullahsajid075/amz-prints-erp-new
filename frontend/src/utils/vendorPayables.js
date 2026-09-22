/** Shared vendor / purchase payable helpers */

export function isPurchaseCancelled(status) {
  return /cancel/i.test(String(status || ''));
}

export function isPurchaseFullyPaid(purchase = {}) {
  const status = String(purchase.status || purchase.paymentStatus || '').toLowerCase();
  if (/fully\s*paid|^paid$/.test(status)) return true;
  const total = Number(purchase.totalAmount ?? purchase.total ?? 0);
  const paid = Number(purchase.paidAmount ?? purchase.paid ?? 0);
  return total > 0 && paid >= total;
}

/** Remaining amount owed to vendor on one PO */
export function purchaseOutstanding(purchase = {}) {
  if (isPurchaseCancelled(purchase.status)) return 0;
  if (isPurchaseFullyPaid(purchase)) return 0;
  const total = Number(purchase.totalAmount ?? purchase.total ?? 0);
  const paid = Number(purchase.paidAmount ?? purchase.paid ?? 0);
  return Math.max(0, total - paid);
}

/** Sum of all unpaid / partial purchase balances */
export function totalVendorPayables(purchases = []) {
  return (purchases || []).reduce((sum, p) => sum + purchaseOutstanding(p), 0);
}

/** Per-vendor aggregates from purchases list */
export function aggregateVendorPurchases(purchases = []) {
  const byVendor = {};
  (purchases || []).forEach((p) => {
    if (isPurchaseCancelled(p.status)) return;
    const key = String(p.vendorId || p.vendorName || '').trim();
    if (!key) return;
    if (!byVendor[key]) {
      byVendor[key] = { totalPurchases: 0, outstandingBalance: 0, count: 0 };
    }
    const total = Number(p.totalAmount ?? p.total ?? 0);
    byVendor[key].totalPurchases += total;
    byVendor[key].outstandingBalance += purchaseOutstanding(p);
    byVendor[key].count += 1;
  });
  return byVendor;
}

/** Roles / modules allowed to manage vendors / see payables detail */
export function canAccessVendors(user) {
  if (!user) return false;
  const role = String(user.role || '').trim().toLowerCase();
  if (['super admin', 'admin', 'administrator', 'owner'].includes(role)) {
    return true;
  }
  const perms = Array.isArray(user.permissions)
    ? user.permissions.map((p) => String(p || '').trim().toLowerCase())
    : [];
  if (perms.includes('vendors') || perms.includes('accounts')) return true;
  if (perms.some((p) => /vendor|payable/i.test(String(p)))) return true;
  // Legacy role fallback only when no module list is assigned yet
  if (!perms.length && ['accounts', 'account', 'accountant', 'manager', 'finance'].includes(role)) {
    return true;
  }
  return false;
}

export function canManageVendors(user) {
  if (!canAccessVendors(user)) return false;
  const role = String(user.role || '').trim().toLowerCase();
  return ['super admin', 'admin', 'administrator', 'owner', 'accounts', 'account', 'accountant', 'manager', 'finance'].includes(role);
}
