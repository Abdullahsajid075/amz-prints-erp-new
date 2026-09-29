import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const HomeLauncherContext = createContext(null);

export function markHomeToOpenAfterLogin() {
  /* Dashboard is the Apps home — login already lands on /dashboard. */
}

export function HomeLauncherProvider({ children }) {
  const navigate = useNavigate();

  const openHome = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const value = useMemo(
    () => ({ openHome, closeHome: () => {} }),
    [openHome]
  );

  return (
    <HomeLauncherContext.Provider value={value}>
      {children}
    </HomeLauncherContext.Provider>
  );
}

export function useHomeLauncher() {
  const ctx = useContext(HomeLauncherContext);
  if (!ctx) {
    return { openHome: () => {}, closeHome: () => {} };
  }
  return ctx;
}
