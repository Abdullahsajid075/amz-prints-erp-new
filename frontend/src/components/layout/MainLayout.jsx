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
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FB' }}>
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      
      <main className="pt-16 lg:pl-64 min-h-screen" data-testid="main-content">
        <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-[1600px] mx-auto">
          <ModuleGuard>
            <Outlet />
          </ModuleGuard>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;