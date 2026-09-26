function collectPriceTagCopies(products = [], { allowZeroStock = false } = {}) {
  const tags = [];
  (Array.isArray(products) ? products : []).forEach((product) => {
    if (!product || /service/i.test(String(product.productType || product.category || ''))) return;
    const variations = Array.isArray(product.variations) ? product.variations : [];
    if (variations.length) {
      variations.forEach((variation) => {
        const qty = Math.max(0, Math.floor(Number(variation.stock ?? 0) || 0));
        const copies = qty > 0 ? qty : (allowZeroStock ? 1 : 0);
        if (!(copies > 0)) return;
        tags.push({ name: `${product.name} · ${variation.name}`, copies });
      });
      return;
    }
    const qty = Math.max(0, Math.floor(Number(product.stock ?? 0) || 0));
    const copies = qty > 0 ? qty : (allowZeroStock ? 1 : 0);
    if (!(copies > 0)) return;
    tags.push({ name: product.name, copies });
  });
  return tags;
}

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

const blackCss = 'color: #000 !important';
assert(blackCss.includes('#000'), 'black ink');
assert('A012 PLEASE PROCEED TO THE Table 01'.includes('PLEASE PROCEED TO THE'), 'announce leftover check');

console.log('priceTags ok');
