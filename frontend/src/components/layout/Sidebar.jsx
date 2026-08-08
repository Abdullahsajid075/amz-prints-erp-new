import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ShoppingCart, Users, Package, Warehouse, FileText,
  CreditCard, Receipt, BarChart3, Settings, X, Ticket, ClipboardList,
  Store, Quote, Calculator, Kanban, ShoppingBag, UsersRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBrand } from '@/context/BrandContext';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', testId: 'nav-dashboard' },
  { icon: Quote, label: 'Quotation', path: '/quotations', testId: 'nav-quotations' },
  { icon: ShoppingCart, label: 'Orders', path: '/orders', testId: 'nav-orders' },
  { icon: Ticket, label: 'Token Booking', path: '/tokens', testId: 'nav-tokens' },
  { icon: FileText, label: 'Invoices', path: '/invoices', testId: 'nav-invoices' },
  { icon: Users, label: 'Customers', path: '/customers', testId: 'nav-customers' },
  { icon: Kanban, label: 'CRM', path: '/crm', testId: 'nav-crm' },
  { icon: ShoppingBag, label: 'Purchases', path: '/purchases', testId: 'nav-purchases' },
  { icon: Warehouse, label: 'Warehouse', path: '/warehouse', testId: 'nav-warehouse',
    children: [
      { label: 'Products', path: '/warehouse/products' },
      { label: 'Inventory', path: '/warehouse/inventory' },
    ]
  },
  { icon: Store, label: 'POS', path: '/pos', testId: 'nav-pos',
    children: [
      { label: 'Counter', path: '/pos' },
      { label: 'POS Statement', path: '/pos/statement' },
    ]
  },
  { icon: UsersRound, label: 'HR', path: '/hr', testId: 'nav-hr',
    children: [
      { label: 'Employees', path: '/hr/employees' },
    ]
  },
  { icon: Calculator, label: 'Cost Calculator', path: '/calculator', testId: 'nav-calculator' },
  { icon: CreditCard, label: 'Accounts', path: '/accounts', testId: 'nav-accounts',
    children: [
      { label: 'Payments', path: '/accounts/payments' },
      { label: 'Expenses', path: '/accounts/expenses' },
      { label: 'Vendors', path: '/accounts/vendors', requireVendors: true },
    ]
  },
  { icon: BarChart3, label: 'Reports', path: '/reports', testId: 'nav-reports' },
  { icon: Settings, label: 'Settings', path: '/settings', testId: 'nav-settings' },
];

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { company, primary } = useBrand();
  const { canAccessVendors } = useAuth();

  const visibleMenu = menuItems.map((item) => {
    if (!item.children) return item;
    const children = item.children.filter((c) => !c.requireVendors || canAccessVendors);
    return { ...item, children };
  });

  return (
    <>
      {isOpen && (<div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />)}
      <aside
        className={cn('fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}
        data-testid="sidebar"
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 lg:hidden">
            <h2 className="text-lg font-semibold" style={{ color: '#2E2E2E' }}>{company.name || 'Menu'}</h2>
            <Button variant="ghost" size="icon" onClick={closeSidebar}><X className="h-5 w-5" /></Button>
          </div>
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {visibleMenu.map((item) => (
                <div key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={closeSidebar}
                    data-testid={item.testId}
                    className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive ? 'text-white' : 'text-gray-700 hover:bg-gray-100')}
                    style={({ isActive }) => ({ backgroundColor: isActive ? (primary || '#F26522') : 'transparent' })}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-gray-500')} />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                  {item.children && item.children.length > 0 && (
                    <div className="ml-8 mt-1 mb-2 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={closeSidebar}
                          className={({ isActive }) => cn('block text-xs py-1.5 px-2 rounded', isActive ? 'font-semibold' : 'text-gray-500 hover:text-gray-800')}
                          style={({ isActive }) => ({ color: isActive ? primary : undefined })}
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
