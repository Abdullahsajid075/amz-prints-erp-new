import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { canAccessPath } from '@/utils/permissions';

/**
 * Blocks navigation to modules the signed-in user is not allowed to open.
 */
const ModuleGuard = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const lastToastPath = useRef('');

  const allowed = !isAuthenticated || loading || canAccessPath(user, location.pathname);

  useEffect(() => {
    if (loading || !isAuthenticated || allowed) return;
    if (lastToastPath.current === location.pathname) return;
    lastToastPath.current = location.pathname;
    toast.error('Permission not granted');
  }, [allowed, isAuthenticated, loading, location.pathname]);

  if (loading) return children;
  if (!isAuthenticated) return children;
  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ModuleGuard;
