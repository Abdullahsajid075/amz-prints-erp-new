import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ShoppingCart, Users, Package, Palette, Factory, Warehouse, FileText, CreditCard, Receipt, UsersRound, BarChart3, Settings, X, Building2, ShoppingBag, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', testId: 'nav-dashboard' },
  { icon: Ticket, label: 'Token Booking', path: '/tokens', testId: 'nav-tokens' },
  { icon: ShoppingCart, label: 'Orders', path: '/orders', testId: 'nav-orders' },
  { icon: Users, label: 'Customers', path: '/customers', testId: 'nav-customers' },
  { icon: Package, label: 'Products', path: '/products', testId: 'nav-products' },
  { icon: Palette, label: 'Designers', path: '/designers', testId: 'nav-designers' },
  { icon: Factory, label: 'Production', path: '/production', testId: 'nav-production' },
  { icon: Building2, label: 'Vendors', path: '/vendors', testId: 'nav-vendors' },
  { icon: ShoppingBag, label: 'Purchases', path: '/purchases', testId: 'nav-purchases' },
  { icon: Warehouse, label: 'Inventory', path: '/inventory', testId: 'nav-inventory' },
  { icon: FileText, label: 'Invoices', path: '/invoices', testId: 'nav-invoices' },
  { icon: CreditCard, label: 'Payments', path: '/payments', testId: 'nav-payments' },
  { icon: Receipt, label: 'Expenses', path: '/expenses', testId: 'nav-expenses' },
  { icon: UsersRound, label: 'Employees', path: '/employees', testId: 'nav-employees' },
  { icon: BarChart3, label: 'Reports', path: '/reports', testId: 'nav-reports' },
  { icon: Settings, label: 'Settings', path: '/settings', testId: 'nav-settings' }
];

const Sidebar = ({ isOpen, closeSidebar }) => {
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
            <h2 className="text-lg font-semibold" style={{ color: '#2E2E2E' }}>Menu</h2>
            <Button variant="ghost" size="icon" onClick={closeSidebar}><X className="h-5 w-5" /></Button>
          </div>
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  data-testid={item.testId}
                  className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'text-white' : 'text-gray-700 hover:bg-gray-100')}
                  style={({ isActive }) => ({ backgroundColor: isActive ? '#F26522' : 'transparent' })}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-gray-500')} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
