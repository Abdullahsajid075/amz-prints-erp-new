import { collectPriceTagCopies, productBarcodeCode, buildPriceTagHtml } from './priceTags.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(collectPriceTagCopies([{ name: 'Card', stock: 0 }]).length === 0, 'skip zero stock');
assert(collectPriceTagCopies([{ name: 'Card', stock: 0 }], { allowZeroStock: true })[0].copies === 1, 'zero stock 1 copy');
assert(collectPriceTagCopies([{ name: 'Card', stock: 3 }])[0].copies === 3, 'stock copies');
assert(collectPriceTagCopies([{ name: 'Design', productType: 'Service', stock: 5 }]).length === 0, 'skip service');
assert(
  collectPriceTagCopies([{
    name: 'Mug',
    variations: [{ name: 'Black', stock: 2 }, { name: 'White', stock: 0 }],
  }]).reduce((s, r) => s + r.copies, 0) === 2,
  'variation stock'
);
assert(
  collectPriceTagCopies([{
    name: 'Mug',
    variations: [{ name: 'White', stock: 0 }],
  }], { allowZeroStock: true })[0].copies === 1,
  'variation zero allowed'
);

const tagged = collectPriceTagCopies([{ id: 'p1', name: 'Mug', sku: 'MUG-01', stock: 1 }], { allowZeroStock: true })[0];
assert(tagged.barcode === 'MUG-01', 'sku is barcode');
assert(productBarcodeCode({ id: 'p9' }) === 'p9', 'id fallback');
assert(productBarcodeCode({ sku: 'BASE' }, { sku: 'VAR-A' }) === 'VAR-A', 'variation sku');

const html = buildPriceTagHtml([{ name: 'Mug', price: 100, sku: 'MUG-01', barcode: 'MUG-01' }], {
  widthMm: 80,
  heightMm: 40,
  showBarcode: true,
});
assert(html.includes('80mm 40mm'), 'POS sticker page size');
assert(html.includes('JsBarcode'), 'barcode engine');
assert(html.includes('CODE128'), 'CODE128');
assert(html.includes('MUG-01'), 'barcode value');
assert(html.includes('color: #000 !important'), 'black ink');

console.log('priceTags ok');
