import { findProductByBarcode, productMatchesQuery } from './productSearch.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const catalog = [
  { id: 'p1', name: 'Mug', sku: 'MUG-01', stock: 4 },
  {
    id: 'p2',
    name: 'T-shirt',
    sku: 'TEE',
    variations: [
      { id: 'v-black', name: 'Black', sku: 'TEE-BLK', stock: 2 },
      { id: 'v-white', name: 'White', sku: 'TEE-WHT', stock: 1 },
    ],
  },
];

assert(productMatchesQuery(catalog[0], 'MUG-01'), 'sku search');
assert(productMatchesQuery(catalog[1], 'TEE-BLK'), 'variation sku search');
assert(!productMatchesQuery(catalog[0], 'nope'), 'miss');

const skuHit = findProductByBarcode(catalog, 'MUG-01');
assert(skuHit?.product?.id === 'p1' && !skuHit.variation, 'product sku scan');

const varHit = findProductByBarcode(catalog, 'tee-wht');
assert(varHit?.product?.id === 'p2' && varHit.variation?.id === 'v-white', 'variation barcode scan');

const idHit = findProductByBarcode(catalog, 'p1');
assert(idHit?.product?.id === 'p1', 'id fallback scan');

assert(findProductByBarcode(catalog, 'missing') == null, 'unknown barcode');
assert(findProductByBarcode(catalog, '  ') == null, 'blank ignored');

console.log('productSearch ok');
