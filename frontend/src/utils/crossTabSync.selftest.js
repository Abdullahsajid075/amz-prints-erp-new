function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// --- SSR safety: no `window` at all must not throw ---
delete global.window;
{
  const { notifyDataChanged, onDataChanged } = require('./crossTabSync');
  notifyDataChanged('orders');
  const unsub = onDataChanged('orders', () => { throw new Error('should never fire without window'); });
  assert(typeof unsub === 'function', 'onDataChanged returns an unsubscribe fn even without window');
  unsub();
}

// --- Fake browser env: BroadcastChannel delivers to OTHER instances of the
// same name (never back to the sender's own object), matching the spec. ---
delete require.cache[require.resolve('./crossTabSync')];
const bcRegistry = new Map();
class FakeBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.listeners = new Set();
    if (!bcRegistry.has(name)) bcRegistry.set(name, new Set());
    bcRegistry.get(name).add(this);
  }
  addEventListener(_type, cb) { this.listeners.add(cb); }
  removeEventListener(_type, cb) { this.listeners.delete(cb); }
  postMessage(data) {
    for (const other of bcRegistry.get(this.name)) {
      if (other !== this) other.listeners.forEach((cb) => cb({ data }));
    }
  }
}

const storageListeners = new Set();
const fakeLocalStorage = {
  store: {},
  setItem(k, v) { this.store[k] = String(v); },
  getItem(k) { return this.store[k] ?? null; },
};

global.window = {
  BroadcastChannel: FakeBroadcastChannel,
  localStorage: fakeLocalStorage,
  addEventListener(type, cb) { if (type === 'storage') storageListeners.add(cb); },
  removeEventListener(type, cb) { if (type === 'storage') storageListeners.delete(cb); },
};

const { notifyDataChanged, onDataChanged } = require('./crossTabSync');

// Same-tab sender + listener share one cached channel object -> no self-delivery.
let selfFired = false;
const unsubSelf = onDataChanged('orders', () => { selfFired = true; });
notifyDataChanged('orders');
assert(!selfFired, 'a tab does not receive its own BroadcastChannel notification');
unsubSelf();

// Simulate a second tab: a fresh FakeBroadcastChannel instance for the same name.
let otherTabFired = 0;
const secondTabChannel = new FakeBroadcastChannel('amz-erp:orders');
secondTabChannel.addEventListener('message', () => { otherTabFired += 1; });
notifyDataChanged('orders');
assert(otherTabFired === 1, 'a second tab receives the notification');

// localStorage fallback fires via the window 'storage' event (how real
// browsers notify OTHER same-origin tabs of a change).
let storageFired = false;
const unsubStorage = onDataChanged('orders', () => { storageFired = true; });
storageListeners.forEach((cb) => cb({ key: 'amz-erp:orders:ping' }));
assert(storageFired, 'storage-event fallback triggers the callback');
unsubStorage();

let irrelevantFired = false;
onDataChanged('orders', () => { irrelevantFired = true; });
storageListeners.forEach((cb) => cb({ key: 'amz-erp:customers:ping' }));
assert(!irrelevantFired, 'a different topic key does not trigger the callback');

console.log('crossTabSync ok');
