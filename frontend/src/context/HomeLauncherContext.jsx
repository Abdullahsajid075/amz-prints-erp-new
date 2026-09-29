import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SHOW_KEY = 'amz_erp_show_home';
const HomeLauncherContext = createContext(null);

export function shouldOpenHomeAfterLogin() {
  try {
    return sessionStorage.getItem(SHOW_KEY) === '1';
  } catch {
    return false;
  }
}

export function markHomeToOpenAfterLogin() {
  try { sessionStorage.setItem(SHOW_KEY, '1'); } catch { /* ignore */ }
}

export function clearHomeAfterLoginFlag() {
  try { sessionStorage.removeItem(SHOW_KEY); } catch { /* ignore */ }
}

export function HomeLauncherProvider({ children }) {
  const [open, setOpen] = useState(() => shouldOpenHomeAfterLogin());
  const [leaving, setLeaving] = useState(false);

  const openHome = useCallback(() => {
    setLeaving(false);
    setOpen(true);
  }, []);

  const closeHome = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    clearHomeAfterLoginFlag();
    window.setTimeout(() => {
      setOpen(false);
      setLeaving(false);
    }, 420);
  }, [leaving]);

  const value = useMemo(
    () => ({ open, leaving, openHome, closeHome }),
    [open, leaving, openHome, closeHome]
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
    return {
      open: false,
      leaving: false,
      openHome: () => {},
      closeHome: () => {},
    };
  }
  return ctx;
}
