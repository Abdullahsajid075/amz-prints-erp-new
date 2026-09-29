import {
  LayoutDashboard, Quote, ShoppingCart, Ticket, FileText, Users, Kanban, Store,
  ClipboardCheck, ShoppingBag, Warehouse, UsersRound, Calculator, ListTodo,
  Megaphone, CreditCard, BarChart3, Settings, Wallet, Receipt, Package,
} from 'lucide-react';

export const ERP_LEGAL_NAME = 'Amazon Printings (PVT) Ltd';

/** Same ERP modules as the sidebar — icons only, no feature changes. */
export const ERP_HOME_APPS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', module: 'dashboard', icon: LayoutDashboard, tint: '#ff6d00', group: 'main' },
  { id: 'orders', label: 'Orders', path: '/orders', module: 'orders', icon: ShoppingCart, tint: '#0747a3', group: 'main' },
  { id: 'pos', label: 'POS', path: '/pos', module: 'pos', icon: Store, tint: '#ff6d00', group: 'main' },
  { id: 'invoices', label: 'Invoices', path: '/invoices', module: 'invoices', icon: FileText, tint: '#0747a3', group: 'main' },
  { id: 'customers', label: 'Customers', path: '/customers', module: 'customers', icon: Users, tint: '#ff6d00', group: 'main' },
  { id: 'inventory', label: 'Stock', path: '/warehouse/inventory', module: 'warehouse', icon: Warehouse, tint: '#0747a3', group: 'main' },
  { id: 'quotations', label: 'Quotation', path: '/quotations', module: 'quotations', icon: Quote, tint: '#ff6d00', group: 'more' },
  { id: 'tokens', label: 'Token', path: '/tokens', module: 'tokens', icon: Ticket, tint: '#0747a3', group: 'more' },
  { id: 'crm', label: 'CRM', path: '/crm', module: 'crm', icon: Kanban, tint: '#ff6d00', group: 'more' },
  { id: 'payments', label: 'Cash', path: '/accounts/payments', module: 'accounts', icon: Wallet, tint: '#0747a3', group: 'more' },
  { id: 'expenses', label: 'Expense', path: '/accounts/expenses', module: 'accounts', icon: Receipt, tint: '#ff6d00', group: 'more' },
  { id: 'purchases', label: 'Purchases', path: '/purchases', module: 'purchases', icon: ShoppingBag, tint: '#0747a3', group: 'more' },
  { id: 'products', label: 'Products', path: '/warehouse/products', module: 'warehouse', icon: Package, tint: '#ff6d00', group: 'more' },
  { id: 'hr', label: 'Staff', path: '/hr/employees', module: 'hr', icon: UsersRound, tint: '#0747a3', group: 'more' },
  { id: 'acks', label: 'Acks', path: '/acknowledgments', module: 'acknowledgments', icon: ClipboardCheck, tint: '#ff6d00', group: 'more' },
  { id: 'tasks', label: 'Tasks', path: '/tasks', module: 'tasks', icon: ListTodo, tint: '#0747a3', group: 'more' },
  { id: 'broadcasts', label: 'Broadcasts', path: '/broadcasts', module: 'broadcasts', icon: Megaphone, tint: '#ff6d00', group: 'more' },
  { id: 'calculator', label: 'Calculator', path: '/calculator', module: 'calculator', icon: Calculator, tint: '#0747a3', group: 'more' },
  { id: 'vendors', label: 'Vendors', path: '/accounts/vendors', module: 'vendors', icon: CreditCard, tint: '#ff6d00', group: 'more' },
  { id: 'reports', label: 'Reports', path: '/reports', module: 'reports', icon: BarChart3, tint: '#0747a3', group: 'more' },
  { id: 'settings', label: 'Settings', path: '/settings', module: 'settings', icon: Settings, tint: '#ff6d00', group: 'more' },
];
