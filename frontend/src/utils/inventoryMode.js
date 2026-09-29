export const DEFAULT_INVENTORY_MODE = {
  active: false,
  startedAt: '',
  endsAt: '',
  durationHours: 24,
};

export const INVENTORY_MODE_PRESETS = [
  { hours: 1, label: '1 hour' },
  { hours: 4, label: '4 hours' },
  { hours: 8, label: '8 hours' },
  { hours: 24, label: '1 day' },
  { hours: 48, label: '2 days' },
  { hours: 168, label: '7 days' },
];

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

function toIso(value) {
  if (!value) return '';
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? '' : value.toISOString();
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function parseTime(value) {
  if (!value) return NaN;
  if (typeof value === 'number') return value;
  const t = Date.parse(String(value));
  return t;
}

export function parseInventoryMode(raw) {
  const src = asObject(raw);
  const nested = asObject(src.inventoryMode);
  const mode = Object.keys(nested).length ? nested : src;
  const durationHours = Math.max(1, Number(mode.durationHours) || 24);
  return {
    active: !!mode.active,
    startedAt: toIso(mode.startedAt || ''),
    endsAt: toIso(mode.endsAt || ''),
    durationHours,
  };
}

export function inventoryModeFromSettings(api = {}) {
  const settings = asObject(api);
  const inv = asObject(settings.inventory);
  if (inv.inventoryMode != null) return parseInventoryMode(inv.inventoryMode);
  if (settings.inventoryMode != null) return parseInventoryMode(settings.inventoryMode);
  return parseInventoryMode(inv);
}

export function inventoryModeRemaining(mode, now = Date.now()) {
  const parsed = parseInventoryMode(mode);
  const ends = parseTime(parsed.endsAt);
  const totalMs = parsed.active && Number.isFinite(ends) ? Math.max(0, ends - now) : 0;
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalMs, totalSeconds };
}

export function inventoryModeIsActive(mode, now = Date.now()) {
  return inventoryModeRemaining(mode, now).totalMs > 0;
}

export function startInventoryMode(durationHours = 24, now = Date.now()) {
  const hours = Math.max(1, Number(durationHours) || 24);
  const started = new Date(now);
  const ends = new Date(now + hours * 3600 * 1000);
  return {
    active: true,
    startedAt: started.toISOString(),
    endsAt: ends.toISOString(),
    durationHours: hours,
  };
}

export function stopInventoryMode(prev = {}) {
  const parsed = parseInventoryMode(prev);
  return {
    ...DEFAULT_INVENTORY_MODE,
    durationHours: parsed.durationHours || 24,
    startedAt: parsed.startedAt || '',
    endsAt: new Date().toISOString(),
    active: false,
  };
}

export function pad2(n) {
  return String(Math.max(0, Number(n) || 0)).padStart(2, '0');
}

export function inventoryModeCountdownParts(mode, now = Date.now()) {
  const rem = inventoryModeRemaining(mode, now);
  return [
    { key: 'days', label: 'Days', value: pad2(rem.days) },
    { key: 'hours', label: 'Hours', value: pad2(rem.hours) },
    { key: 'minutes', label: 'Minutes', value: pad2(rem.minutes) },
    { key: 'seconds', label: 'Seconds', value: pad2(rem.seconds) },
  ];
}
