import React, { useMemo } from 'react';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, LogOut, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const TITLE_MAP = [
  { match: '/dashboard', title: 'Dashboard' },
  { match: '/quotations', title: 'Quotations' },
  { match: '/orders', title: 'Orders' },
  { match: '/tokens', title: 'Token Booking' },
  { match: '/invoices', title: 'Invoices' },
  { match: '/customers', title: 'Customers' },
  { match: '/crm', title: 'CRM' },
  { match: '/purchases', title: 'Purchases' },
  { match: '/warehouse/products', title: 'Products' },
  { match: '/warehouse/inventory', title: 'Inventory' },
  { match: '/warehouse', title: 'Warehouse' },
  { match: '/pos/statement', title: 'POS Statement' },
  { match: '/pos', title: 'POS Counter' },
  { match: '/hr', title: 'HR' },
  { match: '/calculator', title: 'Cost Calculator' },
  { match: '/accounts/payments', title: 'Payments' },
  { match: '/accounts/expenses', title: 'Expenses' },
  { match: '/accounts/vendors', title: 'Vendors' },
  { match: '/accounts', title: 'Accounts' },
  { match: '/reports', title: 'Reports' },
  { match: '/settings', title: 'Settings' },
];

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { company, primary } = useBrand();
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = getUserDisplayName(user);
  const accent = primary || '#F26522';

  const pageTitle = useMemo(() => {
    const hit = TITLE_MAP.find((t) => location.pathname.startsWith(t.match));
    return hit?.title || company.name || 'AMZ Prints';
  }, [location.pathname, company.name]);

  const handleLogout = () => {
    logout();
    window.location.assign('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 lg:left-[260px] h-14 z-50 border-b border-black/[0.06] bg-white/85 backdrop-blur-md"
      data-testid="navbar"
    >
      <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0 h-9 w-9"
            onClick={toggleSidebar}
            data-testid="sidebar-toggle"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="lg:hidden flex items-center gap-2 min-w-0">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-8 w-auto max-w-[96px] object-contain"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: accent }}
                >
                  <span className="text-white font-bold text-sm font-display">
                    {(company.name || 'A').charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-slate-400 leading-none mb-0.5 hidden sm:block">
                {company.name || 'AMZ Prints'} · Ops
              </p>
              <h1 className="font-display text-base sm:text-lg font-bold text-ink truncate leading-tight">
                {pageTitle}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 px-2 rounded-xl hover:bg-slate-100"
              >
                <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                  <AvatarFallback
                    className="font-display text-xs font-bold"
                    style={{ backgroundColor: accent, color: 'white' }}
                  >
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-sm font-semibold text-ink">{displayName}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{user?.role || 'Staff'}</span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-display">{displayName}</span>
                  <span className="text-xs text-slate-500 font-normal">{user?.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
