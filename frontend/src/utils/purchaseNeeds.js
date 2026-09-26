import { isServiceItem, tracksInventory } from '@/utils/inventoryTrack';

function qtyOf(v) {
  return Math.max(0, Number(v) || 0);
}

export function productStock(product, variationId) {
  if (variationId && Array.isArray(product?.variations)) {
    const found = product.variations.find((v) => String(v.id) === String(variationId));
    if (found && found.stock != null && found.stock !== '') return qtyOf(found.stock);
  }
  return qtyOf(product?.stock);
}

export function isOpenBookingOrder(order) {
  if (!order) return false;
  const dt = String(order.docType || order.doctype || 'Order').toLowerCase();
  if (dt === 'pos' || dt === 'quotation') return false;
  if (/pos\s*sale/i.test(String(order.remarks || ''))) return false;
  const s = String(order.status || '').trim().toLowerCase();
  if (/cancel/.test(s)) return false;
  if (/^(delivered|completed|complete|closed)$/.test(s)) return false;
  return true;
}

export function isCoveringPurchase(purchase) {
  if (!purchase) return false;
  const s = String(purchase.status || '').trim().toLowerCase();
  if (!s) return true;
  if (/cancel/.test(s)) return false;
  if (/received|complete/.test(s)) return false;
  return true;
}

function lineKey(line = {}) {
  return `${String(line.productId || line.product_id || line.id || line.name || '').trim()}::${String(line.variationId || line.variation_id || '').trim()}`;
}

/** Booked qty that still needs stock. Live on-hand is subtracted later so the row vanishes when stock arrives. */
export function lineShortage(line, product) {
  if (!product || isServiceItem(product) || !tracksInventory(product)) return 0;
  return qtyOf(line.quantity);
}

export function buildPurchaseNeeds({ orders = [], products = [], purchases = [] } = {}) {
  const catalog = new Map();
  (Array.isArray(products) ? products : []).forEach((p) => {
    if (p?.id) catalog.set(String(p.id), p);
    if (p?.name) catalog.set(`name:${String(p.name).trim().toLowerCase()}`, p);
  });
  const findProduct = (line) => {
    const id = String(line.productId || line.product_id || '').trim();
    if (id && catalog.has(id)) return catalog.get(id);
    const name = String(line.name || '').trim().toLowerCase();
    if (name && catalog.has(`name:${name}`)) return catalog.get(`name:${name}`);
    return null;
  };

  const incoming = new Map();
  (Array.isArray(purchases) ? purchases : []).filter(isCoveringPurchase).forEach((po) => {
    (Array.isArray(po.items) ? po.items : []).forEach((item) => {
      const key = lineKey(item);
      incoming.set(key, (incoming.get(key) || 0) + qtyOf(item.quantity));
    });
  });

  const groups = new Map();
  (Array.isArray(orders) ? orders : []).filter(isOpenBookingOrder).forEach((order) => {
    (Array.isArray(order.products) ? order.products : []).forEach((line) => {
      const product = findProduct(line);
      const need = lineShortage(line, product);
      if (!(need > 0)) return;
      const key = lineKey({ ...line, productId: line.productId || product?.id, name: line.name || product?.name });
      const current = groups.get(key) || {
        key,
        productId: product?.id || line.productId || '',
        variationId: line.variationId || '',
        name: line.variationName || line.name || product?.name || 'Item',
        required: 0,
        incoming: incoming.get(key) || 0,
        stock: productStock(product, line.variationId),
        orders: [],
      };
      current.required += need;
      current.orders.push({
        id: order.id,
        orderId: order.orderId || order.id,
        customerName: order.customerName || '',
        need,
      });
      groups.set(key, current);
    });
  });

  return Array.from(groups.values())
    .map((row) => {
      const ordered = row.incoming || 0;
      const remaining = Math.max(0, row.required - row.stock - ordered);
      let status = 'Need to purchase';
      if (remaining <= 0) status = 'Covered';
      else if (ordered > 0 || row.stock > 0) status = 'Partially covered';
      return {
        ...row,
        ordered,
        remaining,
        status,
      };
    })
    .filter((row) => row.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining || a.name.localeCompare(b.name));
}
