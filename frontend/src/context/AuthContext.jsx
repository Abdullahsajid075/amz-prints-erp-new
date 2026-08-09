import React, { createContext, useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { authAPI } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';
import { setUnauthorizedHandler } from '../services/gasClient';
import { canAccessVendors, canManageVendors } from '@/utils/vendorPayables';
import { canAccessModule, canAccessPath, hasFullAccess } from '@/utils/permissions';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/** Users sheet "Name" column — same text shown after Welcome Back. */
export function getUserDisplayName(user) {
  if (!user) return 'User';
  const name = String(user.name || '').trim();
  if (name) return name;
  const username = String(user.username || '').trim();
  if (username) return username;
  const email = String(user.email || '').trim();
  if (email) return email.split('@')[0] || email;
  return 'User';
}

/**
 * AuthProvider only mounts inside the authenticated app shell (not on /login).
 */
export const AuthProvider = ({ children }) => {
  const booted = useRef(false);
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [loading, setLoading] = useState(() => {
    const token = tokenStorage.getToken();
    const saved = tokenStorage.getUser();
    return Boolean(token && !saved);
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(tokenStorage.getToken() && tokenStorage.getUser())
  );

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  }, []);

  const applyUser = useCallback((userData) => {
    if (!userData) {
      clearSession();
      return;
    }
    setUser(userData);
    setIsAuthenticated(true);
    tokenStorage.setUser(userData);
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const token = tokenStorage.getToken();
    const savedUser = tokenStorage.getUser();

    if (!token) {
      clearSession();
      return;
    }

    if (savedUser) {
      setUser(savedUser);
      setIsAuthenticated(true);
      setLoading(false);
    }

    (async () => {
      try {
        const res = await authAPI.getCurrentUser();
        if (res?.data) applyUser(res.data);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, [applyUser, clearSession]);

  const login = useCallback(async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response.data || {};
      if (!token) {
        return { success: false, error: 'Login failed — no token returned.' };
      }
      tokenStorage.setToken(token);
      applyUser(userData);
      setLoading(false);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  }, [applyUser]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const checkModule = useCallback((moduleKey) => canAccessModule(user, moduleKey), [user]);
  const checkPath = useCallback((pathname) => canAccessPath(user, pathname), [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      displayName: getUserDisplayName(user),
      hasFullAccess: hasFullAccess(user),
      canAccessModule: checkModule,
      canAccessPath: checkPath,
      canAccessVendors: canAccessVendors(user) || canAccessModule(user, 'vendors'),
      canManageVendors: canManageVendors(user) || hasFullAccess(user),
    }),
    [user, loading, isAuthenticated, login, logout, checkModule, checkPath]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
