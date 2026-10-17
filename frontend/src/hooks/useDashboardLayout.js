import { useCallback, useEffect, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { settingsAPI } from '@/services/api';
import { sanitizeDashboardOrder as sanitizeOrder, sameDashboardOrder as sameOrder } from '@/utils/dashboardLayout';

const SETTINGS_KEY = 'dashboardLayout';

/**
 * Per-user, cross-device persisted icon ordering for grouped grids (Dashboard
 * launcher today; POS panels can reuse this later). Stored under the existing
 * `settings` key/value table as settings.dashboardLayout[userId] = { group: [ids] },
 * so no database migration is required. Anyone without a saved layout yet (or
 * whose saved layout references apps they no longer have / have newly gained)
 * sees the normal default order, which `sanitizeOrder` guarantees.
 */
export function useDashboardLayout(userId, defaultGroups) {
  const [groups, setGroups] = useState(defaultGroups);
  const [loaded, setLoaded] = useState(false);
  const rawSettingsRef = useRef({});
  const defaultGroupsRef = useRef(defaultGroups);
  defaultGroupsRef.current = defaultGroups;

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setGroups(defaultGroupsRef.current);
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
        const defaults = defaultGroupsRef.current;
        const next = {};
        Object.keys(defaults).forEach((group) => {
          const groupDefaults = defaults[group] || [];
          const stored = perUser && Array.isArray(perUser[group]) ? perUser[group] : null;
          next[group] = stored ? sanitizeOrder(stored, groupDefaults) : groupDefaults;
        });
        setGroups(next);
      })
      .catch(() => { /* fall back to default order silently — this is a convenience preference */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [userId]);

  // If the accessible-app set changes (permission change, new module shipped)
  // re-sanitize the saved order instead of waiting for the next full reload.
  useEffect(() => {
    setGroups((prev) => {
      let changed = false;
      const next = {};
      Object.keys(defaultGroups).forEach((group) => {
        const groupDefaults = defaultGroups[group] || [];
        const current = prev[group];
        const sanitized = sanitizeOrder(current || groupDefaults, groupDefaults);
        next[group] = sanitized;
        if (!sameOrder(sanitized, current)) changed = true;
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultGroups)]);

  const persist = useCallback(async (nextGroups) => {
    if (!userId) return;
    try {
      const latest = await settingsAPI.get();
      const all = (latest.data && typeof latest.data === 'object') ? latest.data : rawSettingsRef.current || {};
      const existingByUser = all[SETTINGS_KEY] && typeof all[SETTINGS_KEY] === 'object' ? all[SETTINGS_KEY] : {};
      const updatedByUser = { ...existingByUser, [userId]: nextGroups };
      await settingsAPI.update({ [SETTINGS_KEY]: updatedByUser });
      rawSettingsRef.current = { ...all, [SETTINGS_KEY]: updatedByUser };
    } catch {
      // Layout is a UI convenience, not a business record — ignore save failures.
    }
  }, [userId]);

  const reorderGroup = useCallback((group, activeId, overId) => {
    setGroups((prev) => {
      const list = prev[group] || [];
      const fromIndex = list.indexOf(activeId);
      const toIndex = list.indexOf(overId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
      const nextGroups = { ...prev, [group]: arrayMove(list, fromIndex, toIndex) };
      persist(nextGroups);
      return nextGroups;
    });
  }, [persist]);

  const resetLayout = useCallback(() => {
    setGroups(defaultGroupsRef.current);
    persist(defaultGroupsRef.current);
  }, [persist]);

  const isCustomized = Object.keys(defaultGroups).some((group) => !sameOrder(groups[group], defaultGroups[group]));

  return { groups, reorderGroup, resetLayout, isCustomized, loaded };
}
