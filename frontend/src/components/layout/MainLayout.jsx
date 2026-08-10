import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ModuleGuard from '@/components/ModuleGuard';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen erp-shell">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="pt-14 lg:pl-[260px] min-h-screen" data-testid="main-content">
        <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1600px] mx-auto">
          <ModuleGuard>
            <Outlet />
          </ModuleGuard>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
