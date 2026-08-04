import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';
import { setUnauthorizedHandler } from '../services/gasClient';

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

function isLoginPath() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname || '';
  return path === '/login' || path.endsWith('/login') || /\/login\/?$/.test(path);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [loading, setLoading] = useState(() => {
    const token = tokenStorage.getToken();
    const saved = tokenStorage.getUser();
    // On login screen never block the form
    if (isLoginPath()) return false;
    return Boolean(token && !saved);
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Don't treat cached session as logged-in while sitting on /login
    if (isLoginPath()) return false;
    return Boolean(tokenStorage.getToken() && tokenStorage.getUser());
  });

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

  // Soft 401 handler — replaces window.location hard reload
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const initAuth = useCallback(async () => {
    // Login page: never call /auth/me (401 → used to hard-reload the page)
    if (isLoginPath()) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

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

    try {
      const res = await authAPI.getCurrentUser();
      if (res?.data) applyUser(res.data);
    } catch {
      // 401 already cleared via handler; ensure UI matches
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [applyUser, clearSession]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response.data;
      tokenStorage.setToken(token);
      applyUser(userData);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  const logout = () => {
    clearSession();
  };

  const value = { user, loading, isAuthenticated, login, logout, displayName: getUserDisplayName(user) };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
