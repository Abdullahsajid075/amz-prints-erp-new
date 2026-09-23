/** Service catalog items never carry inventory quantity. */
export function isServiceItem(p) {
  const type = String(p?.productType || p?.product_type || '').toLowerCase();
  if (type === 'service') return true;
  if (type === 'product') return false;
  return /service/i.test(String(p?.category || ''));
}

/**
 * Per-product track-inventory flag.
 * Services never track. Products default ON; if the switch is off, sell without stock.
 */
export function tracksInventory(p) {
  if (!p || isServiceItem(p)) return false;
  if (p.trackInventory === false || p.track_inventory === false) return false;
  if (p.trackInventory === true || p.track_inventory === true) return true;
  const raw = p.trackInventory != null ? p.trackInventory : p.track_inventory;
  if (raw == null || raw === '') return true;
  const s = String(raw).trim().toLowerCase();
  return !['0', 'false', 'no', 'off', 'n'].includes(s);
}
