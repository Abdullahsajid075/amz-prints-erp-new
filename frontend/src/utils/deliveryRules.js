export const INVOICE_REQUIRED_MESSAGE = 'Invoice Required: Please generate the invoice before delivering this order.';
export const STOCK_REQUIRED_MESSAGE = 'Cannot deliver until items are purchased and received.';

export function orderHasInvoice(order) {
  return !!(order?.invoiceId || order?.invoiceNumber || order?.hasInvoice);
}

export function isReadyForDeliveryStatus(status) {
  return /^ready(\s+for\s+delivery)?$/i.test(String(status || '').trim());
}

export function isClosedOrDeliveredStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  return s === 'delivered' || s === 'complete' || s === 'completed' || s === 'closed';
}

function qtyOf(v) {
  return Math.max(0, Number(v) || 0);
}

function isServiceProduct(p) {
  const type = String(p?.productType || p?.product_type || '').toLowerCase();
  if (type === 'service') return true;
  if (type === 'product') return false;
  return /service/i.test(String(p?.category || ''));
}

function tracksInventory(p) {
  if (!p || isServiceProduct(p)) return false;
  if (p.trackInventory === false || p.track_inventory === false) return false;
  if (p.trackInventory === true || p.track_inventory === true) return true;
  const raw = p.trackInventory != null ? p.trackInventory : p.track_inventory;
  if (raw == null || raw === '') return true;
  const s = String(raw).trim().toLowerCase();
  return !['0', 'false', 'no', 'off', 'n'].includes(s);
}

function catalogOnHand(product, variationId) {
  const vid = String(variationId || '').trim();
  if (vid && Array.isArray(product?.variations)) {
    const found = product.variations.find((v) => String(v.id) === vid);
    if (found && found.stock != null && found.stock !== '') return qtyOf(found.stock);
  }
  return qtyOf(product?.stock);
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

/** Tracked lines that on-hand cannot cover. Empty catalog skips the stock gate. */
export function orderDeliveryShortages(order, catalog) {
  if (!Array.isArray(catalog)) return [];
  const lines = Array.isArray(order?.products)
    ? order.products
    : (Array.isArray(order?.items) ? order.items : []);
  const shortages = [];
  lines.forEach((line) => {
    if (String(line?.productId || line?.product_id || '').startsWith('calc_')) return;
    const product = findCatalogProduct(catalog, line);
    if (!product || isServiceProduct(product) || !tracksInventory(product)) return;
    const qty = qtyOf(line.quantity);
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

export function canManuallyDeliver(order, catalog) {
  if (!order) return { ok: false, message: INVOICE_REQUIRED_MESSAGE };
  const status = order.status;
  if (/cancel/i.test(String(status || ''))) {
    return { ok: false, message: 'Cancelled orders cannot be delivered' };
  }
  if (isClosedOrDeliveredStatus(status)) {
    return { ok: true, already: true };
  }
  if (!orderHasInvoice(order)) {
    return { ok: false, message: INVOICE_REQUIRED_MESSAGE };
  }
  const shortages = orderDeliveryShortages(order, catalog);
  if (shortages.length) {
    const names = shortages.map((s) => s.name).filter(Boolean).slice(0, 3).join(', ');
    return {
      ok: false,
      message: STOCK_REQUIRED_MESSAGE,
      shortages,
      detail: names,
    };
  }
  return { ok: true };
}
