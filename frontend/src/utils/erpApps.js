import {
  LayoutDashboard, Quote, ShoppingCart, Ticket, FileText, Users, Kanban, Store,
  ClipboardCheck, ShoppingBag, Warehouse, UsersRound, Calculator, ListTodo,
  Megaphone, CreditCard, BarChart3, Settings, Wallet, Receipt, Package,
} from 'lucide-react';

export const ERP_LEGAL_NAME = 'Amazon Printings (PVT) Ltd';

/**
 * Category order + labels for the app launcher grid. Each app below carries
 * a `group` matching one of these keys, grouped the same way the sidebar
 * already groups its menu (Sales / Operations / Finance / ...) so the two
 * navigation surfaces stay mentally consistent.
 */
export const ERP_HOME_CATEGORIES = [
  { key: 'overview', label: 'Overview' },
  { key: 'sales', label: 'Sales' },
  { key: 'operations', label: 'Operations' },
  { key: 'finance', label: 'Finance' },
  { key: 'comms', label: 'Communication' },
  { key: 'system', label: 'System' },
];

/** Same ERP modules as the sidebar — icons only, no feature changes. */
export const ERP_HOME_APPS = [
  { id: 'overview', label: 'Overview', path: '/overview', module: 'dashboard', icon: LayoutDashboard, tint: '#ff6d00', group: 'overview' },

  { id: 'quotations', label: 'Quotation', path: '/quotations', module: 'quotations', icon: Quote, tint: '#ff6d00', group: 'sales' },
  { id: 'orders', label: 'Orders', path: '/orders', module: 'orders', icon: ShoppingCart, tint: '#0747a3', group: 'sales' },
  { id: 'tokens', label: 'Token', path: '/tokens', module: 'tokens', icon: Ticket, tint: '#0747a3', group: 'sales' },
  { id: 'pos', label: 'POS', path: '/pos', module: 'pos', icon: Store, tint: '#ff6d00', group: 'sales' },
  { id: 'invoices', label: 'Invoices', path: '/invoices', module: 'invoices', icon: FileText, tint: '#0747a3', group: 'sales' },
  { id: 'customers', label: 'Customers', path: '/customers', module: 'customers', icon: Users, tint: '#ff6d00', group: 'sales' },
  { id: 'crm', label: 'CRM', path: '/crm', module: 'crm', icon: Kanban, tint: '#ff6d00', group: 'sales' },

  { id: 'acks', label: 'Acks', path: '/acknowledgments', module: 'acknowledgments', icon: ClipboardCheck, tint: '#ff6d00', group: 'operations' },
  { id: 'purchases', label: 'Purchases', path: '/purchases', module: 'purchases', icon: ShoppingBag, tint: '#0747a3', group: 'operations' },
  { id: 'inventory', label: 'Stock', path: '/warehouse/inventory', module: 'warehouse', icon: Warehouse, tint: '#0747a3', group: 'operations' },
  { id: 'products', label: 'Products', path: '/warehouse/products', module: 'warehouse', icon: Package, tint: '#ff6d00', group: 'operations' },
  { id: 'hr', label: 'Staff', path: '/hr/employees', module: 'hr', icon: UsersRound, tint: '#0747a3', group: 'operations' },
  { id: 'calculator', label: 'Calculator', path: '/calculator', module: 'calculator', icon: Calculator, tint: '#ff6d00', group: 'operations' },

  { id: 'payments', label: 'Cash', path: '/accounts/payments', module: 'accounts', icon: Wallet, tint: '#0747a3', group: 'finance' },
  { id: 'expenses', label: 'Expense', path: '/accounts/expenses', module: 'accounts', icon: Receipt, tint: '#ff6d00', group: 'finance' },
  { id: 'vendors', label: 'Vendors', path: '/accounts/vendors', module: 'vendors', icon: CreditCard, tint: '#0747a3', group: 'finance' },
  { id: 'reports', label: 'Reports', path: '/reports', module: 'reports', icon: BarChart3, tint: '#ff6d00', group: 'finance' },

  { id: 'tasks', label: 'Tasks', path: '/tasks', module: 'tasks', icon: ListTodo, tint: '#0747a3', group: 'comms' },
  { id: 'broadcasts', label: 'Broadcasts', path: '/broadcasts', module: 'broadcasts', icon: Megaphone, tint: '#ff6d00', group: 'comms' },

  { id: 'settings', label: 'Settings', path: '/settings', module: 'settings', icon: Settings, tint: '#0747a3', group: 'system' },
];
