function qtyOf(v) { return Math.max(0, Number(v) || 0); }

function buildPurchaseNeeds({ orders = [], products = [], purchases = [] } = {}) {
  const incoming = new Map();
  purchases.forEach((po) => {
    const s = String(po.status || '').toLowerCase();
    if (/cancel/.test(s) || /received|complete/.test(s)) return;
    (po.items || []).forEach((item) => {
      const key = `${item.productId || item.name}::`;
      incoming.set(key, (incoming.get(key) || 0) + qtyOf(item.quantity));
    });
  });
  const groups = new Map();
  orders.forEach((order) => {
    const st = String(order.status || '').toLowerCase();
    if (/cancel/.test(st) || /^(delivered|completed|complete|closed)$/.test(st)) return;
    (order.products || []).forEach((line) => {
      const key = `${line.productId || line.name}::`;
      const product = products.find((p) => p.id === line.productId);
      const current = groups.get(key) || {
        required: 0,
        incoming: incoming.get(key) || 0,
        stock: qtyOf(product?.stock),
      };
      current.required += qtyOf(line.quantity);
      groups.set(key, current);
    });
  });
  return Array.from(groups.values()).map((row) => {
    const remaining = Math.max(0, row.required - row.stock - row.incoming);
    return { ...row, remaining, status: remaining <= 0 ? 'Covered' : (row.incoming > 0 || row.stock > 0 ? 'Partially covered' : 'Need to purchase') };
  }).filter((row) => row.remaining > 0);
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

const rows = buildPurchaseNeeds({
  products: [{ id: 'p1', name: 'Mug', stock: 0, trackInventory: true }],
  orders: [{ id: 'o1', status: 'Ready', products: [{ productId: 'p1', name: 'Mug', quantity: 100 }] }],
  purchases: [{ status: 'Ordered', items: [{ productId: 'p1', quantity: 40 }] }],
});
assert(rows.length === 1, 'partial stays visible');
assert(rows[0].required === 100, 'required 100');
assert(rows[0].incoming === 40, 'ordered 40');
assert(rows[0].remaining === 60, 'remaining 60');

const covered = buildPurchaseNeeds({
  products: [{ id: 'p1', stock: 20 }],
  orders: [{ status: 'Ready', products: [{ productId: 'p1', quantity: 100 }] }],
  purchases: [{ status: 'Ordered', items: [{ productId: 'p1', quantity: 80 }] }],
});
assert(covered.length === 0, 'fully covered hides');

const cancelled = buildPurchaseNeeds({
  products: [{ id: 'p1', stock: 0 }],
  orders: [{ status: 'Cancelled', products: [{ productId: 'p1', quantity: 100 }] }],
  purchases: [],
});
assert(cancelled.length === 0, 'cancelled order drops need');

function isLowQuantityStock(stock, threshold = 3) {
  return Math.max(0, Number(stock) || 0) < threshold;
}

function buildLowQuantityAlerts({ products = [], threshold = 3 } = {}) {
  const rows = [];
  products.forEach((product) => {
    if (/service/i.test(String(product.productType || ''))) return;
    if (product.trackInventory === false) return;
    const variations = Array.isArray(product.variations) ? product.variations : [];
    if (variations.length) {
      variations.forEach((variation) => {
        const stock = Math.max(0, Number(variation.stock) || 0);
        if (!isLowQuantityStock(stock, threshold)) return;
        rows.push({ name: `${product.name} · ${variation.name}`, stock });
      });
      return;
    }
    if (isLowQuantityStock(product.stock, threshold)) {
      rows.push({ name: product.name, stock: Math.max(0, Number(product.stock) || 0) });
    }
  });
  return rows;
}

assert(isLowQuantityStock(0), '0 is low');
assert(isLowQuantityStock(2), '2 is low');
assert(!isLowQuantityStock(3), '3 is not low');
assert(!isLowQuantityStock(10), '10 is not low');

const low = buildLowQuantityAlerts({
  products: [
    { id: 'a', name: 'Cards', stock: 2, trackInventory: true },
    { id: 'b', name: 'Mug', stock: 3, trackInventory: true },
    { id: 'c', name: 'Design', stock: 0, productType: 'Service' },
    { id: 'd', name: 'Banner', stock: 1, trackInventory: false },
    { id: 'e', name: 'Paper', variations: [{ id: 'v1', name: 'A4', stock: 1 }, { id: 'v2', name: 'A3', stock: 8 }] },
  ],
});
assert(low.some((r) => r.name === 'Cards' && r.stock === 2), 'cards low');
assert(!low.some((r) => r.name === 'Mug'), 'mug at 3 hidden');
assert(!low.some((r) => r.name === 'Design'), 'service skipped');
assert(!low.some((r) => r.name === 'Banner'), 'untracked skipped');
assert(low.some((r) => r.name === 'Paper · A4' && r.stock === 1), 'low variation');
assert(!low.some((r) => r.name === 'Paper · A3'), 'ok variation hidden');

console.log('purchaseNeeds ok');
