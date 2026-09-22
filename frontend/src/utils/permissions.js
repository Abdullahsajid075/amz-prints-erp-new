/** Module keys used for sidebar, routes, and user access assignment. */

export const APP_MODULES = [
  { key: 'dashboard', label: 'Dashboard', always: true },
  { key: 'quotations', label: 'Quotation' },
  { key: 'orders', label: 'Orders' },
  { key: 'tokens', label: 'Token Booking' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'customers', label: 'Customers' },
  { key: 'crm', label: 'CRM' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'pos', label: 'POS' },
  { key: 'hr', label: 'HR' },
  { key: 'calculator', label: 'Cost Calculator' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings', adminOnly: true },
];

const ASSIGNABLE_MODULES = APP_MODULES.filter((m) => !m.always && !m.adminOnly);

export function getAssignableModules() {
  return ASSIGNABLE_MODULES;
}

export function normalizePermissions(raw) {
  if (Array.isArray(raw)) {
    return raw.map((p) => String(p || '').trim().toLowerCase()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((p) => String(p || '').trim().toLowerCase()).filter(Boolean);
      }
    } catch {
      return raw.split(/[,|]/).map((p) => p.trim().toLowerCase()).filter(Boolean);
    }
  }
  return [];
}

export function hasFullAccess(user) {
  if (!user) return false;
  const role = String(user.role || '').trim().toLowerCase();
  return ['super admin', 'admin', 'administrator', 'owner'].includes(role);
}

/**
 * Effective module access:
 * - Admin / Super Admin / Owner → all modules
 * - Settings → admin roles only
 * - Dashboard → always for signed-in users
 * - Other modules → only if listed in user.permissions
 */
export function canAccessModule(user, moduleKey) {
  if (!user || !moduleKey) return false;
  const key = String(moduleKey).trim().toLowerCase();
  if (!key) return false;
  if (key === 'dashboard') return true;
  if (hasFullAccess(user)) return true;
  if (key === 'settings') return false;

  const perms = normalizePermissions(user.permissions);
  if (!perms.length) return false;
  if (perms.includes(key)) return true;
  if (perms.includes('*') || perms.includes('all')) return true;

  // Aliases
  if (key === 'warehouse' && (perms.includes('products') || perms.includes('inventory'))) return true;
  if (key === 'accounts' && (perms.includes('payments') || perms.includes('expenses'))) return true;
  if (key === 'hr' && perms.includes('employees')) return true;
  if (key === 'vendors' && perms.some((p) => /vendor|payable/i.test(p))) return true;
  return false;
}

/** Map a pathname to the controlling module key. */
export function moduleForPath(pathname) {
  const path = String(pathname || '').split('?')[0];
  if (!path || path === '/') return 'dashboard';
  if (path.startsWith('/dashboard')) return 'dashboard';
  if (path.startsWith('/quotations')) return 'quotations';
  if (path.startsWith('/orders')) return 'orders';
  if (path.startsWith('/tokens')) return 'tokens';
  if (path.startsWith('/invoices')) return 'invoices';
  if (path.startsWith('/customers')) return 'customers';
  if (path.startsWith('/crm')) return 'crm';
  if (path.startsWith('/purchases')) return 'purchases';
  if (path.startsWith('/warehouse') || path.startsWith('/products') || path.startsWith('/inventory') || path.startsWith('/production')) {
    return 'warehouse';
  }
  if (path.startsWith('/pos')) return 'pos';
  if (path.startsWith('/hr') || path.startsWith('/employees') || path.startsWith('/designers')) return 'hr';
  if (path.startsWith('/calculator')) return 'calculator';
  if (path.startsWith('/accounts/vendors') || path === '/vendors') return 'vendors';
  if (path.startsWith('/accounts') || path.startsWith('/payments') || path.startsWith('/expenses')) {
    return 'accounts';
  }
  if (path.startsWith('/reports')) return 'reports';
  if (path.startsWith('/settings')) return 'settings';
  return null;
}

export function canAccessPath(user, pathname) {
  const mod = moduleForPath(pathname);
  if (!mod) return hasFullAccess(user);
  return canAccessModule(user, mod);
}
