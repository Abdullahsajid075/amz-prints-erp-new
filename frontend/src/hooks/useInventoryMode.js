import { useCallback, useEffect, useState } from 'react';
import { settingsAPI } from '@/services/api';
import {
  DEFAULT_INVENTORY_MODE,
  inventoryModeFromSettings,
  inventoryModeRemaining,
} from '@/utils/inventoryMode';

// Inventory Mode only changes via an explicit admin action (turning it on,
// extending it, or cancelling it) — not something that needs sub-minute
// responsiveness. This hook is mounted on the Dashboard, Inventory, and
// Products pages, so a short poll here runs continuously, in the
// background, for every staff member who leaves one of those pages open —
// and each poll pulls back the *entire* settings object, including the
// base64 company logo/stamp/signature, not just the small inventory-mode
// flag it actually needs. 60s keeps the countdown/badge reasonably fresh
// while cutting this background cost by 3x compared to the previous 20s.
export default function useInventoryMode(pollMs = 60000) {
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
