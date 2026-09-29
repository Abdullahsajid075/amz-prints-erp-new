import { useCallback, useEffect, useState } from 'react';
import { settingsAPI } from '@/services/api';
import {
  DEFAULT_INVENTORY_MODE,
  inventoryModeFromSettings,
  inventoryModeRemaining,
} from '@/utils/inventoryMode';

export default function useInventoryMode(pollMs = 20000) {
  const [mode, setMode] = useState(DEFAULT_INVENTORY_MODE);
  const [now, setNow] = useState(() => Date.now());

  const reload = useCallback(async () => {
    try {
      const res = await settingsAPI.get();
      setMode(inventoryModeFromSettings(res.data || {}));
    } catch {
      /* keep last known mode */
    }
  }, []);

  useEffect(() => {
    reload();
    if (!(pollMs > 0)) return undefined;
    const id = setInterval(reload, pollMs);
    return () => clearInterval(id);
  }, [reload, pollMs]);

  const remaining = inventoryModeRemaining(mode, now);
  const active = remaining.totalMs > 0;

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, mode.endsAt]);

  return { mode, setMode, active, remaining, reload, now };
}
