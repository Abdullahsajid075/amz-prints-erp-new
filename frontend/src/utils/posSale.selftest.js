import { posReceiptRef, isPosPayment, displayPaymentRef, parsePosCashier } from './posSale.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(posReceiptRef('POS-1001') === 'POSR-POS-1001', 'POSR prefix');
assert(posReceiptRef('POSR-POS-1001') === 'POSR-POS-1001', 'already prefixed');
assert(isPosPayment({ category: 'POS Sale', reference: 'INV-1' }), 'pos category');
assert(displayPaymentRef({ category: 'POS Sale', notes: 'POS Sale POS-88', reference: 'INV-9' }) === 'POSR-POS-88', 'display from notes');
assert(parsePosCashier({ remarks: 'POS Sale · Cash · By Ali Khan · Recv 100' }) === 'Ali Khan', 'cashier from remarks');
assert(parsePosCashier({ cashier: 'Sara' }) === 'Sara', 'cashier field');

console.log('posSale ok');
