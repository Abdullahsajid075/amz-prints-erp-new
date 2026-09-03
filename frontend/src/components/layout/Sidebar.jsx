import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ShoppingCart, Users, Warehouse, FileText,
  CreditCard, BarChart3, Settings, X, Ticket,
  Store, Quote, Calculator, Kanban, ShoppingBag, UsersRound, ChevronDown, FileUser
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
  { icon: FileUser, label: 'CV Submissions', path: '/cvs', testId: 'nav-cvs' },
  { icon: BarChart3, label: 'Reports', path: '/reports', testId: 'nav-reports' },
  { icon: Settings, label: 'Settings', path: '/settings', testId: 'nav-settings' },
];

const pathMatches = (base, pathname) => {
  if (!base) return false;
  if (pathname === base) return true;
  return pathname.startsWith(`${base}/`);
};

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { company, primary } = useBrand();
  const { canAccessVendors } = useAuth();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState('');

  const visibleMenu = menuItems.map((item) => {
    if (!item.children) return item;
    const children = item.children.filter((c) => !c.requireVendors || canAccessVendors);
    return { ...item, children };
  });

  // Auto-expand the group that matches the current route
  useEffect(() => {
    const active = visibleMenu.find(
      (item) => item.children?.length && (
        pathMatches(item.path, location.pathname)
        || item.children.some((c) => pathMatches(c.path, location.pathname))
      )
    );
    setOpenGroup(active ? active.path : '');
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (path) => {
    setOpenGroup((prev) => (prev === path ? '' : path));
  };

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
              {visibleMenu.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const expanded = hasChildren && openGroup === item.path;
                const groupActive = hasChildren && (
                  pathMatches(item.path, location.pathname)
                  || item.children.some((c) => pathMatches(c.path, location.pathname))
                );

                if (!hasChildren) {
                  return (
                    <NavLink
                      key={item.path}
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
                  );
                }

                return (
                  <div key={item.path} className="space-y-0.5">
                    <button
                      type="button"
                      data-testid={item.testId}
                      onClick={() => toggleGroup(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                        groupActive ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
                      )}
                      style={{ backgroundColor: groupActive ? (primary || '#F26522') : 'transparent' }}
                      aria-expanded={expanded}
                    >
                      <item.icon className={cn('h-5 w-5', groupActive ? 'text-white' : 'text-gray-500')} />
                      <span className="flex-1">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 transition-transform duration-200',
                          groupActive ? 'text-white/90' : 'text-gray-400',
                          expanded ? 'rotate-180' : ''
                        )}
                      />
                    </button>
                    {expanded && (
                      <div className="ml-4 pl-3 border-l border-gray-200 space-y-0.5 pb-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            end={child.path === item.path}
                            onClick={closeSidebar}
                            className={({ isActive }) => cn(
                              'block text-sm py-2 px-2.5 rounded-md transition-colors',
                              isActive
                                ? 'font-semibold bg-orange-50'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                            style={({ isActive }) => ({ color: isActive ? (primary || '#F26522') : undefined })}
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
