import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.requireVendors] — Admin / Accounts / Manager only
 */
const ProtectedRoute = ({ children, requireVendors = false }) => {
  const { isAuthenticated, loading, canAccessVendors } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F7FB' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#ff6d00', borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireVendors && !canAccessVendors) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
