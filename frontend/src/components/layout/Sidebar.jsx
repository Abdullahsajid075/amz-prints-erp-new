import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ShoppingCart, Users, Warehouse, FileText,
  CreditCard, BarChart3, Settings, X, Ticket,
  Store, Quote, Calculator, Kanban, ShoppingBag, UsersRound, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBrand } from '@/context/BrandContext';
import { useAuth } from '@/context/AuthContext';
import { ordersAPI } from '@/services/api';
import { isOpenOrder } from '@/utils/constants';

const menuGroups = [
  {
    id: 'overview',
    label: null,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', module: 'dashboard', testId: 'nav-dashboard' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    items: [
      { icon: Quote, label: 'Quotation', path: '/quotations', module: 'quotations', testId: 'nav-quotations' },
      { icon: ShoppingCart, label: 'Orders', path: '/orders', module: 'orders', testId: 'nav-orders' },
      { icon: Ticket, label: 'Token Booking', path: '/tokens', module: 'tokens', testId: 'nav-tokens' },
      { icon: FileText, label: 'Invoices', path: '/invoices', module: 'invoices', testId: 'nav-invoices' },
      { icon: Users, label: 'Customers', path: '/customers', module: 'customers', testId: 'nav-customers' },
      { icon: Kanban, label: 'CRM', path: '/crm', module: 'crm', testId: 'nav-crm' },
      {
        icon: Store,
        label: 'POS',
        path: '/pos',
        module: 'pos',
        testId: 'nav-pos',
        children: [
          { label: 'Counter', path: '/pos', module: 'pos' },
          { label: 'POS Statement', path: '/pos/statement', module: 'pos' },
        ],
      },
    ],
  },
  {
    id: 'ops',
    label: 'Operations',
    items: [
      { icon: ShoppingBag, label: 'Purchases', path: '/purchases', module: 'purchases', testId: 'nav-purchases' },
      {
        icon: Warehouse,
        label: 'Warehouse',
        path: '/warehouse',
        module: 'warehouse',
        testId: 'nav-warehouse',
        children: [
          { label: 'Products', path: '/warehouse/products', module: 'warehouse' },
          { label: 'Inventory', path: '/warehouse/inventory', module: 'warehouse' },
        ],
      },
      {
        icon: UsersRound,
        label: 'HR',
        path: '/hr',
        module: 'hr',
        testId: 'nav-hr',
        children: [
          { label: 'Employees', path: '/hr/employees', module: 'hr' },
        ],
      },
      { icon: Calculator, label: 'Cost Calculator', path: '/calculator', module: 'calculator', testId: 'nav-calculator' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      {
        icon: CreditCard,
        label: 'Accounts',
        path: '/accounts',
        module: 'accounts',
        testId: 'nav-accounts',
        children: [
          { label: 'Payments', path: '/accounts/payments', module: 'accounts' },
          { label: 'Expenses', path: '/accounts/expenses', module: 'accounts' },
          { label: 'Vendors', path: '/accounts/vendors', module: 'vendors' },
        ],
      },
      { icon: BarChart3, label: 'Reports', path: '/reports', module: 'reports', testId: 'nav-reports' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings', module: 'settings', testId: 'nav-settings' },
    ],
  },
];

const pathMatches = (base, pathname) => {
  if (!base) return false;
  if (pathname === base) return true;
  return pathname.startsWith(`${base}/`);
};

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { company, primary } = useBrand();
  const { canAccessModule } = useAuth();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState('');
  const [openOrderCount, setOpenOrderCount] = useState(0);
  const accent = primary || '#ff6d00';

  const visibleGroups = useMemo(() => {
    return menuGroups
      .map((group) => {
        const items = group.items
          .map((item) => {
            if (!item.children) {
              return canAccessModule(item.module) ? item : null;
            }
            const children = item.children.filter((c) => canAccessModule(c.module || item.module));
            if (!children.length) return null;
            return { ...item, children };
          })
          .filter(Boolean);
        if (!items.length) return null;
        return { ...group, items };
      })
      .filter(Boolean);
  }, [canAccessModule]);

  const flatItems = useMemo(
    () => visibleGroups.flatMap((g) => g.items),
    [visibleGroups]
  );

  useEffect(() => {
    const active = flatItems.find(
      (item) => item.children?.length && (
        pathMatches(item.path, location.pathname)
        || item.children.some((c) => pathMatches(c.path, location.pathname))
      )
    );
    setOpenGroup(active ? active.path : '');
  }, [location.pathname, flatItems]);

  useEffect(() => {
    if (!canAccessModule('orders')) {
      setOpenOrderCount(0);
      return undefined;
    }
    let cancelled = false;
    ordersAPI.getAll()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setOpenOrderCount(list.filter(isOpenOrder).length);
      })
      .catch(() => {
        if (!cancelled) setOpenOrderCount(0);
      });
    return () => { cancelled = true; };
  }, [location.pathname, canAccessModule]);

  const toggleGroup = (path) => {
    setOpenGroup((prev) => (prev === path ? '' : path));
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/50 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 w-[260px] z-40 transform transition-transform duration-300 ease-out',
          'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        data-testid="sidebar"
      >
        <div className="h-full flex flex-col">
          <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-8 w-auto max-w-[110px] object-contain brightness-0 invert opacity-95"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg"
                  style={{ backgroundColor: accent }}
                >
                  <span className="text-white font-display font-bold text-sm">
                    {(company.name || 'A').charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0 leading-tight">
                <p className="font-display font-bold text-sm text-white truncate">
                  {company.name || 'AMZ Prints'}
                </p>
                <p className="text-[10px] text-sidebar-muted font-medium tracking-wide uppercase">
                  Press Ops
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
              onClick={closeSidebar}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 px-2.5 py-3">
            <nav className="space-y-4">
              {visibleGroups.map((group) => (
                <div key={group.id}>
                  {group.label && (
                    <p className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-muted/80">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
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
                            className={({ isActive }) => cn(
                              'erp-nav-link',
                              isActive
                                ? 'text-white shadow-md'
                                : 'text-sidebar-muted hover:text-white hover:bg-white/[0.06]'
                            )}
                            style={({ isActive }) => ({
                              backgroundColor: isActive ? accent : undefined,
                            })}
                          >
                            {({ isActive }) => (
                              <>
                                <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-sidebar-muted')} />
                                <span className="flex-1 truncate">{item.label}</span>
                                {item.path === '/orders' && openOrderCount > 0 && (
                                  <span
                                    className="ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold leading-5 text-center tabular-nums"
                                    style={{
                                      backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : accent,
                                      color: '#fff',
                                    }}
                                    title={`${openOrderCount} open orders`}
                                    aria-label={`${openOrderCount} open orders`}
                                  >
                                    {openOrderCount > 99 ? '99+' : openOrderCount}
                                  </span>
                                )}
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
                              'erp-nav-link w-full text-left',
                              groupActive
                                ? 'text-white'
                                : 'text-sidebar-muted hover:text-white hover:bg-white/[0.06]'
                            )}
                            style={{
                              backgroundColor: groupActive ? `${accent}22` : undefined,
                              boxShadow: groupActive ? `inset 3px 0 0 ${accent}` : undefined,
                            }}
                            aria-expanded={expanded}
                          >
                            <item.icon className={cn('h-4 w-4 shrink-0', groupActive ? 'text-white' : 'text-sidebar-muted')} />
                            <span className="flex-1">{item.label}</span>
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                                expanded ? 'rotate-180' : '',
                                groupActive ? 'text-white/80' : 'text-sidebar-muted'
                              )}
                            />
                          </button>
                          {expanded && (
                            <div className="ml-3 pl-2.5 border-l border-white/10 space-y-0.5 py-0.5">
                              {item.children.map((child) => (
                                <NavLink
                                  key={child.path}
                                  to={child.path}
                                  end={child.path === item.path}
                                  onClick={closeSidebar}
                                  className={({ isActive }) => cn(
                                    'block text-[12.5px] py-1.5 px-2.5 rounded-md transition-colors',
                                    isActive
                                      ? 'font-semibold text-white'
                                      : 'text-sidebar-muted hover:text-white hover:bg-white/[0.05]'
                                  )}
                                  style={({ isActive }) => ({
                                    backgroundColor: isActive ? `${accent}33` : undefined,
                                    color: isActive ? accent : undefined,
                                  })}
                                >
                                  {child.label}
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
            <p className="text-[10px] text-sidebar-muted text-center tracking-wide">
              AMZ Press Ops
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
