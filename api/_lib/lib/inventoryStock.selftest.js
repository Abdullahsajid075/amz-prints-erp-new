const {
  STOCK_REQUIRED_MESSAGE,
  isReceivedPurchaseStatus,
  purchaseHasStockApplied,
  withStockAppliedNote,
  withoutStockAppliedNote,
  catalogOnHand,
  orderDeliveryShortages,
  preserveProductStock,
  applyOnHandDelta,
} = require('./inventoryStock');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(isReceivedPurchaseStatus('Received'), 'received status');
assert(!isReceivedPurchaseStatus('Ordered'), 'ordered is not received');
assert(!purchaseHasStockApplied({ notes: 'hello' }), 'no marker');
const marked = withStockAppliedNote('PO paper');
assert(purchaseHasStockApplied({ notes: marked }), 'marker added');
assert(withStockAppliedNote(marked) === marked, 'marker once');
assert(withoutStockAppliedNote(marked) === 'PO paper', 'strip marker');

const mug = { id: 'p1', name: 'Mug', stock: 2, track_inventory: true, product_type: 'Product' };
assert(catalogOnHand(mug) === 2, 'parent on hand');
const paper = {
  id: 'p2',
  name: 'Paper',
  stock: 10,
  track_inventory: true,
  variations: [{ id: 'v1', name: 'A4', stock: 1 }],
};
assert(catalogOnHand(paper, 'v1') === 1, 'variation on hand');

const short = orderDeliveryShortages(
  { products: [{ productId: 'p1', name: 'Mug', quantity: 5 }] },
  [mug],
);
assert(short.length === 1 && short[0].required === 5 && short[0].available === 2, 'shortage');

const covered = orderDeliveryShortages(
  { products: [{ productId: 'p1', name: 'Mug', quantity: 2 }] },
  [mug],
);
assert(covered.length === 0, 'covered');

const service = orderDeliveryShortages(
  { products: [{ productId: 's1', name: 'Design', quantity: 9, productType: 'Service' }] },
  [{ id: 's1', name: 'Design', product_type: 'Service', stock: 0 }],
);
assert(service.length === 0, 'service never blocks');

const created = preserveProductStock({ name: 'Mug', stock: 99, variations: [{ id: 'v1', stock: 4 }] }, null);
assert(created.stock === 0 && created.variations[0].stock === 0, 'create stock locked to 0');

const updated = preserveProductStock(
  { name: 'Mug', stock: 0, variations: [{ id: 'v1', name: 'A4', stock: 99 }] },
  { stock: 7, variations: [{ id: 'v1', name: 'A4', stock: 3 }] },
);
assert(updated.stock === 7 && updated.variations[0].stock === 3, 'update keeps live stock');

const afterRecv = applyOnHandDelta(mug, { qty: 5 });
assert(afterRecv.stock === 7, 'receive increments');
const afterVar = applyOnHandDelta(paper, { variationId: 'v1', qty: 4 });
assert(afterVar.stock === 14 && afterVar.variations[0].stock === 5, 'receive variation');

assert(STOCK_REQUIRED_MESSAGE.includes('purchased and received'), 'deliver message');

console.log('inventoryStock ok');
