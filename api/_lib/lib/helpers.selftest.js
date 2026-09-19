const { parseImages, collectOrderIds, invoiceStatusFromPaid, hashPortalPassword, checkPortalPassword, makePortalPassword } = require('./helpers');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(parseImages(['a', 'b'], 'a').join() === 'a,b', 'images unique');
assert(collectOrderIds({ orderIds: ['ORD-1'], orderId: 'ORD-2' }, {}).join() === 'ORD-1,ORD-2', 'order ids');
assert(invoiceStatusFromPaid(100, 0) === 'Unpaid', 'unpaid');
assert(invoiceStatusFromPaid(100, 40) === 'Partial', 'partial');
assert(invoiceStatusFromPaid(100, 100) === 'Paid', 'paid');
const stored = makePortalPassword('secret123');
assert(checkPortalPassword(stored, 'secret123'), 'portal hash');
assert(!checkPortalPassword(stored, 'nope'), 'portal reject');
assert(hashPortalPassword('x', 's').length === 64, 'sha256 hex');
console.log('helpers ok');
