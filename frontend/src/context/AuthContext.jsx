import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';

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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [loading, setLoading] = useState(() => {
    // Only block UI when we have a token but no cached user yet
    const token = tokenStorage.getToken();
    const saved = tokenStorage.getUser();
    return Boolean(token && !saved);
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(tokenStorage.getToken() && tokenStorage.getUser());
  });

  const applyUser = useCallback((userData) => {
    if (!userData) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }
    setUser(userData);
    setIsAuthenticated(true);
    tokenStorage.setUser(userData);
  }, []);

  const initAuth = useCallback(async () => {
    const token = tokenStorage.getToken();
    const savedUser = tokenStorage.getUser();

    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // Instant paint from cache — do NOT wait on GAS cold start
    if (savedUser) {
      setUser(savedUser);
      setIsAuthenticated(true);
      setLoading(false);
    }

    try {
      const res = await authAPI.getCurrentUser();
      if (res?.data) applyUser(res.data);
    } catch {
      if (!savedUser) {
        tokenStorage.clear();
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

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
    tokenStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = { user, loading, isAuthenticated, login, logout, displayName: getUserDisplayName(user) };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
