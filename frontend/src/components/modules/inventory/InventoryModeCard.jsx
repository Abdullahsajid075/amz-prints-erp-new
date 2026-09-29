import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { settingsAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import {
  DEFAULT_INVENTORY_MODE,
  INVENTORY_MODE_PRESETS,
  inventoryModeCountdownParts,
  inventoryModeFromSettings,
  inventoryModeIsActive,
  parseInventoryMode,
  startInventoryMode,
  stopInventoryMode,
} from '@/utils/inventoryMode';
import { Clock, Package } from 'lucide-react';
import { toast } from 'sonner';

function asObject(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export default function InventoryModeCard({
  value,
  onChange,
  compact = false,
}) {
  const [mode, setMode] = useState(value || DEFAULT_INVENTORY_MODE);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const durationHours = Math.max(1, Number(mode?.durationHours) || 24);
  const parts = inventoryModeCountdownParts(mode, now);
  const active = inventoryModeIsActive(mode, now);

  useEffect(() => {
    if (value) setMode(parseInventoryMode(value));
  }, [value]);

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, mode?.endsAt]);

  const persist = async (next) => {
    setBusy(true);
    try {
      const res = await settingsAPI.get();
      const data = res.data || {};
      const inv = asObject(data.inventory);
      await settingsAPI.update({
        inventory: {
          ...inv,
          inventoryMode: next,
        },
      });
      clearGasCache();
      setMode(next);
      onChange?.(next);
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update Inventory Mode');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    const next = startInventoryMode(durationHours);
    const ok = await persist(next);
    if (ok) toast.success('Inventory Mode is on. You can correct stock until the countdown ends.');
  };

  const stop = async () => {
    const next = stopInventoryMode(mode);
    const ok = await persist(next);
    if (ok) toast.success('Inventory Mode is off. Manual stock changes are locked again.');
  };

  const toggle = (on) => {
    if (on) start();
    else stop();
  };

  const setDuration = (hours) => {
    const next = { ...mode, durationHours: hours };
    setMode(next);
    onChange?.(next);
  };

  return (
    <div
      className={`rounded-2xl border p-5 space-y-4 ${active ? 'border-orange-300 bg-orange-50/70' : 'bg-white'}`}
      data-testid="inventory-mode-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" style={{ color: '#ff6d00' }} />
            <Label className="text-base font-semibold">Inventory Mode</Label>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Turn on to manually correct on-hand stock. Purchase-linked lock is paused until the countdown ends.
            The dashboard shows an Inventory Mode tag with days, hours, minutes, and seconds remaining.
          </p>
        </div>
        <Switch
          checked={active}
          disabled={busy}
          onCheckedChange={toggle}
          data-testid="inventory-mode-switch"
        />
      </div>

      {!compact && (
        <div>
          <Label className="text-xs uppercase tracking-wide text-slate-500">Duration</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {INVENTORY_MODE_PRESETS.map((preset) => {
              const selected = durationHours === preset.hours;
              return (
                <Button
                  key={preset.hours}
                  type="button"
                  size="sm"
                  variant={selected ? 'default' : 'outline'}
                  className={selected ? 'text-white' : ''}
                  style={selected ? { backgroundColor: '#ff6d00' } : undefined}
                  disabled={busy || active}
                  onClick={() => setDuration(preset.hours)}
                  data-testid={`inventory-mode-duration-${preset.hours}`}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {active && (
        <div className="rounded-xl bg-white border border-orange-200 p-3" data-testid="inventory-mode-countdown">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-700 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Time remaining
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            {parts.map((part) => (
              <div key={part.key} className="rounded-lg bg-slate-900 text-white py-2 px-1">
                <div className="font-display text-lg font-bold tabular-nums leading-none">{part.value}</div>
                <div className="mt-1 text-[9px] uppercase tracking-wide text-white/70">{part.label}</div>
              </div>
            ))}
          </div>
          <Button type="button" size="sm" variant="outline" className="mt-3" onClick={stop} disabled={busy}>
            Stop now
          </Button>
        </div>
      )}
    </div>
  );
}

export function seedInventoryModeFromSettings(data) {
  return inventoryModeFromSettings(data || {});
}
