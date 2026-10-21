import { useCallback, useEffect, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { settingsAPI } from '@/services/api';
import { sanitizeDashboardOrder as sanitizeOrder, sameDashboardOrder as sameOrder } from '@/utils/dashboardLayout';

const SETTINGS_KEY = 'posCartLayout';

/**
 * Per-user, cross-device persisted ordering for the POS screen's quick
 * category filter chips — same settings-table pattern as the Dashboard app
 * launcher (`useDashboardLayout`), so each cashier can drag their most-used
 * categories to the front and it sticks across logins/devices.
 */
export function usePosCartLayout(userId, defaultCategories) {
  const [categories, setCategories] = useState(defaultCategories);
  const [loaded, setLoaded] = useState(false);
  const rawSettingsRef = useRef({});
  const defaultsRef = useRef(defaultCategories);
  defaultsRef.current = defaultCategories;

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setCategories(defaultsRef.current);
      setLoaded(true);
      return undefined;
    }
    settingsAPI.get()
      .then((res) => {
        if (cancelled) return;
        const all = res.data && typeof res.data === 'object' ? res.data : {};
        rawSettingsRef.current = all;
        const byUser = all[SETTINGS_KEY] && typeof all[SETTINGS_KEY] === 'object' ? all[SETTINGS_KEY] : {};
        const perUser = byUser[userId] && typeof byUser[userId] === 'object' ? byUser[userId] : null;
        const stored = perUser && Array.isArray(perUser.categories) ? perUser.categories : null;
        setCategories(stored ? sanitizeOrder(stored, defaultsRef.current) : defaultsRef.current);
      })
      .catch(() => { /* fall back to default order silently — this is a convenience preference */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [userId]);

  // Re-sanitize if the product catalog's category set changes mid-session.
  useEffect(() => {
    setCategories((prev) => {
      const sanitized = sanitizeOrder(prev, defaultCategories);
      return sameOrder(sanitized, prev) ? prev : sanitized;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultCategories)]);

  const persist = useCallback(async (next) => {
    if (!userId) return;
    try {
      const latest = await settingsAPI.get();
      const all = (latest.data && typeof latest.data === 'object') ? latest.data : rawSettingsRef.current || {};
      const existingByUser = all[SETTINGS_KEY] && typeof all[SETTINGS_KEY] === 'object' ? all[SETTINGS_KEY] : {};
      const updatedByUser = { ...existingByUser, [userId]: { categories: next } };
      await settingsAPI.update({ [SETTINGS_KEY]: updatedByUser });
      rawSettingsRef.current = { ...all, [SETTINGS_KEY]: updatedByUser };
    } catch {
      // Layout is a UI convenience, not a business record — ignore save failures.
    }
  }, [userId]);

  const reorder = useCallback((activeId, overId) => {
    setCategories((prev) => {
      const fromIndex = prev.indexOf(activeId);
      const toIndex = prev.indexOf(overId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
      const next = arrayMove(prev, fromIndex, toIndex);
      persist(next);
      return next;
    });
  }, [persist]);

  const resetLayout = useCallback(() => {
    setCategories(defaultsRef.current);
    persist(defaultsRef.current);
  }, [persist]);

  const isCustomized = !sameOrder(categories, defaultCategories);

  return { categories, reorder, resetLayout, isCustomized, loaded };
}
