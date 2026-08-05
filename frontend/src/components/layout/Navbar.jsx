import React from 'react';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Menu, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { company, primary } = useBrand();
  const navigate = useNavigate();
  const displayName = getUserDisplayName(user);

  const handleLogout = () => {
    logout();
    // Full navigation unmounts app shell — avoids login remount loops
    window.location.assign('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 shadow-sm" data-testid="navbar">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar} data-testid="sidebar-toggle">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="h-10 w-auto max-w-[120px] object-contain bg-transparent" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primary || '#F26522' }}>
                <span className="text-white font-bold text-lg">{(company.name || 'A').charAt(0)}</span>
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold" style={{ color: '#2E2E2E' }}>{company.name || 'AMZ Prints'}</h1>
              <p className="text-xs text-gray-500 -mt-0.5">{company.tagline || 'ERP'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback style={{ backgroundColor: primary || '#F26522', color: 'white' }}>
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{displayName}</span>
                  <span className="text-xs text-gray-500 font-normal">{user?.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
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
