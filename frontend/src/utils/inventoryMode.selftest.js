import {
  DEFAULT_INVENTORY_MODE,
  inventoryModeFromSettings,
  inventoryModeIsActive,
  parseInventoryMode,
  startInventoryMode,
  stopInventoryMode,
  inventoryModeRemaining,
  pad2,
} from './inventoryMode.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const frozen = parseInventoryMode({ active: false });
assert(frozen.active === false && frozen.durationHours === 24, 'default hours');

const t0 = Date.parse('2026-09-29T12:00:00.000Z');
const started = startInventoryMode(24, t0);
assert(started.active === true, 'start active');
assert(started.startedAt === '2026-09-29T12:00:00.000Z', 'start at');
assert(started.endsAt === '2026-09-30T12:00:00.000Z', 'end 24h later');
assert(inventoryModeIsActive(started, t0 + 1000), 'live window');
assert(!inventoryModeIsActive(started, t0 + 24 * 3600 * 1000 + 1), 'expired');

const long = startInventoryMode(72, t0);
const rem = inventoryModeRemaining(long, t0 + (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
assert(rem.days === 0 && rem.hours === 20 && rem.minutes === 55 && rem.seconds === 55, 'countdown split');

const early = startInventoryMode(1, t0);
const remH = inventoryModeRemaining(early, t0);
assert(remH.days === 0 && remH.hours === 1 && remH.minutes === 0 && remH.seconds === 0, '1 hour');

const stopped = stopInventoryMode(started);
assert(stopped.active === false, 'stop');
assert(!inventoryModeIsActive(stopped, t0 + 1000), 'stopped is off');

const fromApi = inventoryModeFromSettings({
  inventory: { inventoryMode: started },
});
assert(fromApi.endsAt === started.endsAt, 'from settings.inventory');

const fromTop = inventoryModeFromSettings({ inventoryMode: started });
assert(fromTop.active === true, 'top-level inventoryMode');

assert(pad2(3) === '03' && pad2(12) === '12', 'pad');
assert(DEFAULT_INVENTORY_MODE.active === false, 'default off');

console.log('inventoryMode ok');
