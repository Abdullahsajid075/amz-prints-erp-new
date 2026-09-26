import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast as sonnerToast } from 'sonner';

const STORAGE_KEY = 'amz_notification_history_v1';
const MAX_ITEMS = 80;

const NotificationContext = createContext(null);

function loadHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistHistory(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* ignore quota */
  }
}

function fingerprint(kind, message) {
  return `${kind}:${String(message || '').trim().toLowerCase()}`;
}

function recordFactory(setItems) {
  return function record({ kind = 'info', message, title, persist = true } = {}) {
    const text = String(message || title || '').trim();
    if (!text || !persist) return;
    const fp = fingerprint(kind, text);
    const item = {
      id: `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      kind,
      title: title || '',
      message: text,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setItems((prev) => {
      const recent = prev[0];
      if (recent && fingerprint(recent.kind, recent.message) === fp) {
        const age = Date.now() - new Date(recent.createdAt).getTime();
        if (Number.isFinite(age) && age < 8000) {
          return prev;
        }
      }
      const next = [item, ...prev].slice(0, MAX_ITEMS);
      persistHistory(next);
      return next;
    });
  };
}

let sonnerHooked = false;
function hookSonner(record) {
  if (sonnerHooked || !sonnerToast) return;
  sonnerHooked = true;
  const kinds = ['success', 'error', 'warning', 'info', 'message'];
  kinds.forEach((kind) => {
    if (typeof sonnerToast[kind] !== 'function') return;
    const orig = sonnerToast[kind].bind(sonnerToast);
    sonnerToast[kind] = (message, opts) => {
      record({
        kind: kind === 'message' ? 'info' : kind,
        message: typeof message === 'string' ? message : (opts?.description || message?.title || String(message || '')),
        title: opts?.title,
      });
      return orig(message, opts);
    };
  });
}

export function NotificationProvider({ children }) {
  const [items, setItems] = useState(() => loadHistory());
  const [open, setOpen] = useState(false);

  const record = useMemo(() => recordFactory(setItems), []);

  useEffect(() => {
    hookSonner(record);
  }, [record]);

  const dismiss = useCallback((id) => {
    setItems((prev) => {
      const next = prev.filter((n) => n.id !== id);
      persistHistory(next);
      return next;
    });
  }, []);

  const markRead = useCallback((id) => {
    setItems((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persistHistory(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      persistHistory(next);
      return next;
    });
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  const value = useMemo(() => ({
    items,
    unreadCount,
    open,
    setOpen,
    record,
    dismiss,
    markRead,
    markAllRead,
  }), [items, unreadCount, open, record, dismiss, markRead, markAllRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationCenter() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return {
      items: [],
      unreadCount: 0,
      open: false,
      setOpen: () => {},
      record: () => {},
      dismiss: () => {},
      markRead: () => {},
      markAllRead: () => {},
    };
  }
  return ctx;
}
