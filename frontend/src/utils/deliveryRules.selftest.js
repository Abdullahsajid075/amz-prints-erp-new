const INVOICE_REQUIRED_MESSAGE = 'Invoice Required: Please generate the invoice before delivering this order.';
const STOCK_REQUIRED_MESSAGE = 'Cannot deliver until items are purchased and received.';

function orderHasInvoice(order) {
  return !!(order?.invoiceId || order?.invoiceNumber || order?.hasInvoice);
}

function qtyOf(v) {
  return Math.max(0, Number(v) || 0);
}

function catalogOnHand(product, variationId) {
  const vid = String(variationId || '').trim();
  if (vid && Array.isArray(product?.variations)) {
    const found = product.variations.find((v) => String(v.id) === vid);
    if (found && found.stock != null && found.stock !== '') return qtyOf(found.stock);
  }
  return qtyOf(product?.stock);
}

function orderDeliveryShortages(order, catalog) {
  if (!Array.isArray(catalog)) return [];
  const lines = Array.isArray(order?.products) ? order.products : [];
  const shortages = [];
  lines.forEach((line) => {
    const product = (catalog || []).find((p) => String(p.id) === String(line.productId));
    if (!product) return;
    const type = String(product.productType || '').toLowerCase();
    if (type === 'service') return;
    if (product.trackInventory === false) return;
    const qty = qtyOf(line.quantity);
    const have = catalogOnHand(product, line.variationId);
    if (have + 0.0001 < qty) shortages.push({ name: line.name, required: qty, available: have });
  });
  return shortages;
}

function canManuallyDeliver(order, catalog) {
  if (/cancel/i.test(String(order?.status || ''))) return { ok: false };
  if (/^(delivered|complete|completed|closed)$/i.test(String(order?.status || ''))) return { ok: true, already: true };
  if (!orderHasInvoice(order)) return { ok: false, message: INVOICE_REQUIRED_MESSAGE };
  const shortages = orderDeliveryShortages(order, catalog);
  if (shortages.length) return { ok: false, message: STOCK_REQUIRED_MESSAGE, shortages };
  return { ok: true };
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

assert(canManuallyDeliver({ status: 'Ready' }).ok === false, 'block no invoice');
assert(canManuallyDeliver({ status: 'Ready' }).message === INVOICE_REQUIRED_MESSAGE, 'exact message');
assert(canManuallyDeliver({ status: 'Ready', invoiceId: 'inv1' }).ok === true, 'eligible');
assert(canManuallyDeliver({ status: 'Ready', invoiceId: 'inv1' }).already !== true, 'not auto delivered');
assert(canManuallyDeliver({ status: 'Delivered', invoiceId: 'inv1' }).already === true, 'already');

const mug = { id: 'p1', name: 'Mug', stock: 0, trackInventory: true, productType: 'Product' };
const shortGate = canManuallyDeliver({
  status: 'Ready',
  invoiceId: 'inv1',
  products: [{ productId: 'p1', name: 'Mug', quantity: 2 }],
}, [mug]);
assert(shortGate.ok === false && shortGate.message === STOCK_REQUIRED_MESSAGE, 'block until purchased');

const coveredGate = canManuallyDeliver({
  status: 'Ready',
  invoiceId: 'inv1',
  products: [{ productId: 'p1', name: 'Mug', quantity: 2 }],
}, [{ ...mug, stock: 2 }]);
assert(coveredGate.ok === true, 'deliver when received stock covers');

assert(canManuallyDeliver({
  status: 'Ready',
  invoiceId: 'inv1',
  products: [{ productId: 'p1', name: 'Mug', quantity: 9 }],
}).ok === true, 'no catalog skips client stock gate');

console.log('deliveryRules ok');
