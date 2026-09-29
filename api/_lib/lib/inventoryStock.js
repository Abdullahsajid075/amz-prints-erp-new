/**
 * Purchase-linked inventory.
 * On-hand changes only from: PO Received (+), POS sale (−), order Delivery (−).
 * Booking may create an order with shortage; delivery is blocked until stock covers it.
 */

const { num } = require('./util');
const { isServiceProduct, productTracksInventory } = require('./helpers');

const STOCK_REQUIRED_MESSAGE = 'Cannot deliver until items are purchased and received.';
const STOCK_APPLIED_MARKER = '[STOCK_APPLIED]';

function isReceivedPurchaseStatus(status) {
  return /^received$/i.test(String(status || '').trim());
}

function purchaseHasStockApplied(row) {
  return /\[STOCK_APPLIED\]/i.test(String(row?.notes || ''));
}

function withStockAppliedNote(notes) {
  const current = String(notes || '').trim();
  if (purchaseHasStockApplied({ notes: current })) return current;
  return current ? `${current} ${STOCK_APPLIED_MARKER}` : STOCK_APPLIED_MARKER;
}

function withoutStockAppliedNote(notes) {
  return String(notes || '')
    .replace(/\s*\[STOCK_APPLIED\]\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function catalogOnHand(product, variationId) {
  const vid = String(variationId || '').trim();
  if (vid && Array.isArray(product?.variations)) {
    const found = product.variations.find((v) => String(v.id) === vid);
    if (found && found.stock != null && found.stock !== '') return Math.max(0, num(found.stock));
  }
  return Math.max(0, num(product?.stock));
}

function findCatalogProduct(catalog, line) {
  const rows = Array.isArray(catalog) ? catalog : [];
  const pid = String(line?.productId || line?.product_id || line?.id || '').trim();
  if (pid) {
    const byId = rows.find((r) => String(r.id) === pid);
    if (byId) return byId;
  }
  const name = String(line?.name || '').trim().toLowerCase();
  if (!name) return null;
  return rows.find((r) => String(r.name || '').trim().toLowerCase() === name) || null;
}

function orderDeliveryShortages(order, catalog = []) {
  const lines = Array.isArray(order?.products)
    ? order.products
    : (Array.isArray(order?.items) ? order.items : []);
  const shortages = [];
  lines.forEach((line) => {
    if (String(line?.productId || line?.product_id || '').startsWith('calc_')) return;
    const product = findCatalogProduct(catalog, line);
    if (!product || isServiceProduct(product) || !productTracksInventory(product)) return;
    const qty = num(line.quantity);
    if (!(qty > 0)) return;
    const have = catalogOnHand(product, line.variationId || line.variation_id);
    if (have + 0.0001 < qty) {
      shortages.push({
        name: line.variationName || line.name || product.name || 'Item',
        required: qty,
        available: have,
      });
    }
  });
  return shortages;
}

function mergeVariationStocks(incomingVars, existingVars) {
  const existing = Array.isArray(existingVars) ? existingVars : [];
  const incoming = Array.isArray(incomingVars) ? incomingVars : [];
  return incoming.map((v) => {
    const match = existing.find((e) => String(e.id) === String(v.id)) || null;
    return { ...v, stock: match ? num(match.stock) : 0 };
  });
}

function asSettingsObject(raw) {
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

function parseInventoryMode(raw) {
  const src = asSettingsObject(raw);
  const nested = asSettingsObject(src.inventoryMode);
  const mode = Object.keys(nested).length ? nested : src;
  return {
    active: !!mode.active,
    startedAt: mode.startedAt || '',
    endsAt: mode.endsAt || '',
    durationHours: Math.max(1, Number(mode.durationHours) || 24),
  };
}

function inventoryModeFromSettings(settings = {}) {
  const obj = asSettingsObject(settings);
  const inv = asSettingsObject(obj.inventory);
  if (inv.inventoryMode != null) return parseInventoryMode(inv.inventoryMode);
  if (obj.inventoryMode != null) return parseInventoryMode(obj.inventoryMode);
  return parseInventoryMode(inv);
}

function inventoryModeIsActive(settingsOrMode, now = Date.now()) {
  const mode = settingsOrMode && (settingsOrMode.inventory != null || settingsOrMode.inventoryMode != null)
    ? inventoryModeFromSettings(settingsOrMode)
    : parseInventoryMode(settingsOrMode);
  if (!mode.active) return false;
  const ends = Date.parse(String(mode.endsAt || ''));
  return Number.isFinite(ends) && ends > now;
}

function clampOnHand(value) {
  const n = num(value);
  return n > 0 ? n : 0;
}

/** Product form cannot set quantity unless Inventory Mode is on. Create starts at 0; update keeps live on-hand. */
function preserveProductStock(incoming, existing, options = {}) {
  if (!incoming) return incoming;
  const next = { ...incoming };
  const allowManual = options.allowManualStock === true;
  if (allowManual) {
    next.stock = clampOnHand(next.stock);
    if (Array.isArray(next.variations)) {
      next.variations = next.variations.map((v) => ({ ...v, stock: clampOnHand(v.stock) }));
    }
    return next;
  }
  if (!existing) {
    next.stock = 0;
    next.variations = mergeVariationStocks(next.variations, []);
    return next;
  }
  next.stock = num(existing.stock);
  next.variations = mergeVariationStocks(next.variations, existing.variations);
  return next;
}

function applyOnHandDelta(product, { variationId, qty }) {
  const delta = num(qty);
  const next = {
    ...product,
    stock: Math.max(0, num(product?.stock) + delta),
  };
  const vid = String(variationId || '').trim();
  if (vid && Array.isArray(product?.variations)) {
    next.variations = product.variations.map((v) => (
      String(v.id) === vid
        ? { ...v, stock: Math.max(0, num(v.stock) + delta) }
        : v
    ));
  } else {
    next.variations = Array.isArray(product?.variations) ? product.variations : [];
  }
  return next;
}

module.exports = {
  STOCK_REQUIRED_MESSAGE,
  STOCK_APPLIED_MARKER,
  isReceivedPurchaseStatus,
  purchaseHasStockApplied,
  withStockAppliedNote,
  withoutStockAppliedNote,
  catalogOnHand,
  findCatalogProduct,
  orderDeliveryShortages,
  mergeVariationStocks,
  parseInventoryMode,
  inventoryModeFromSettings,
  inventoryModeIsActive,
  preserveProductStock,
  applyOnHandDelta,
};
