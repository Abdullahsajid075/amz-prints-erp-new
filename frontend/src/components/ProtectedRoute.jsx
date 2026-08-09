import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { canAccessModule, canAccessPath } from '@/utils/permissions';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.requireVendors] — Vendors module / admin accounts roles
 * @param {string} [props.module] — required app module key
 * @param {string} [props.path] — pathname to resolve module from (optional)
 */
const ProtectedRoute = ({ children, requireVendors = false, module, path }) => {
  const { isAuthenticated, loading, user, canAccessVendors } = useAuth();
  const deniedToastFor = useRef('');

  const moduleDenied = Boolean(
    module && isAuthenticated && !loading && !canAccessModule(user, module)
  );
  const pathDenied = Boolean(
    path && isAuthenticated && !loading && !canAccessPath(user, path)
  );
  const vendorsDenied = Boolean(
    requireVendors && isAuthenticated && !loading && !canAccessVendors
  );
  const denied = moduleDenied || pathDenied || vendorsDenied;

  useEffect(() => {
    if (!denied) return;
    const key = module || path || (requireVendors ? 'vendors' : 'denied');
    if (deniedToastFor.current === key) return;
    deniedToastFor.current = key;
    toast.error('Permission not granted');
  }, [denied, module, path, requireVendors]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F7FB' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#F26522', borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (denied) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
