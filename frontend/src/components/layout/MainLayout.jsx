import React, { Component, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ModuleGuard from '@/components/ModuleGuard';

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page render failed', error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center" data-testid="page-error">
          <p className="font-semibold text-red-800 text-lg">This page could not be displayed.</p>
          <p className="text-sm text-red-600 mt-2">{String(this.state.error.message || this.state.error)}</p>
          <button
            type="button"
            className="mt-4 text-sm font-medium underline text-red-800"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen erp-shell">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="pt-14 lg:pl-[260px] min-h-screen" data-testid="main-content">
        <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-[1600px] mx-auto">
          <ModuleGuard>
            <PageErrorBoundary resetKey={location.pathname}>
              <Outlet />
            </PageErrorBoundary>
          </ModuleGuard>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
