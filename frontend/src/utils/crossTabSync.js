/**
 * Same-browser, cross-tab/window "data changed" pings — e.g. so an Orders
 * list tab can refresh itself the moment an Order Booking tab saves a
 * change, without either tab polling the server. Zero extra network/API
 * calls: the tab that already made the write just also pings its siblings.
 *
 * Uses BroadcastChannel when available (every evergreen browser), with a
 * same-origin localStorage-event fallback for anything older.
 */

const channels = new Map();

function getChannel(topic) {
  if (typeof window === 'undefined') return null;
  if (!channels.has(topic)) {
    const hasBroadcastChannel = typeof window.BroadcastChannel === 'function';
    channels.set(topic, {
      bc: hasBroadcastChannel ? new window.BroadcastChannel(`amz-erp:${topic}`) : null,
      storageKey: `amz-erp:${topic}:ping`,
    });
  }
  return channels.get(topic);
}

/** Tell other same-browser tabs that this topic's data changed (e.g. 'orders'). */
export function notifyDataChanged(topic) {
  const ch = getChannel(topic);
  if (!ch) return;
  if (ch.bc) {
    try { ch.bc.postMessage({ at: Date.now() }); } catch { /* ignore */ }
  }
  try { window.localStorage.setItem(ch.storageKey, String(Date.now())); } catch { /* ignore */ }
}

/** Run `callback` whenever another tab calls notifyDataChanged(topic). Returns an unsubscribe fn. */
export function onDataChanged(topic, callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') return () => {};
  const ch = getChannel(topic);
  if (!ch) return () => {};

  const onMessage = () => callback();
  const onStorage = (e) => { if (e.key === ch.storageKey) callback(); };

  if (ch.bc) ch.bc.addEventListener('message', onMessage);
  window.addEventListener('storage', onStorage);

  return () => {
    if (ch.bc) ch.bc.removeEventListener('message', onMessage);
    window.removeEventListener('storage', onStorage);
  };
}
