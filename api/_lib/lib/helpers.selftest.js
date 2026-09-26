const { parseImages, isRealProductPhoto, isWebsiteCatalogReady, isListedOnWebsite, collectOrderIds, invoiceStatusFromPaid, hashPortalPassword, checkPortalPassword, makePortalPassword } = require('./helpers');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(parseImages(['a', 'b'], 'a').join() === 'a,b', 'images unique');
assert(isRealProductPhoto('https://cdn.example.com/p.jpg'), 'https photo');
assert(isRealProductPhoto('data:image/png;base64,abc123'), 'data photo');
assert(!isRealProductPhoto('A'), 'letter is not a photo');
assert(!isWebsiteCatalogReady({ name: 'Old', description: 'Print item', images: [] }), 'no image hidden');
assert(!isWebsiteCatalogReady({ name: 'Old', description: 'Print item', image: 'x' }), 'junk image hidden');
assert(isWebsiteCatalogReady({ name: 'Mug', description: 'Photo mug', image: 'https://cdn.example.com/mug.jpg' }), 'ready with photo');
const readyMug = { name: 'Mug', description: 'Photo mug', image: 'https://cdn.example.com/mug.jpg', active: true };
assert(isListedOnWebsite(readyMug), 'listed when on');
assert(!isListedOnWebsite({ ...readyMug, showOnWebsite: false }), 'hidden when switch off');
assert(!isListedOnWebsite({ ...readyMug, show_on_website: false }), 'hidden when db flag off');
assert(!isListedOnWebsite({ ...readyMug, active: false }), 'hidden when inactive');
assert(!isListedOnWebsite({ name: 'Mug', description: 'Photo mug', images: [] }), 'hidden when incomplete');
assert(collectOrderIds({ orderIds: ['ORD-1'], orderId: 'ORD-2' }, {}).join() === 'ORD-1,ORD-2', 'order ids');
assert(invoiceStatusFromPaid(100, 0) === 'Unpaid', 'unpaid');
assert(invoiceStatusFromPaid(100, 40) === 'Partial', 'partial');
assert(invoiceStatusFromPaid(100, 100) === 'Paid', 'paid');
const stored = makePortalPassword('secret123');
assert(checkPortalPassword(stored, 'secret123'), 'portal hash');
assert(!checkPortalPassword(stored, 'nope'), 'portal reject');
assert(checkPortalPassword('plain', 'plain'), 'legacy plaintext portal');
assert(hashPortalPassword('x', 's').length === 64, 'sha256 hex');
console.log('helpers ok');
