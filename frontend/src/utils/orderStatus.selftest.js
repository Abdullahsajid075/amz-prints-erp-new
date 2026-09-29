import { ORDER_STATUS, ORDER_STATUS_OPTIONS, normalizeOrderStatus, isOpenOrder } from './constants.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(ORDER_STATUS.READY === 'Ready for Delivery', 'single ready status');
assert(!ORDER_STATUS_OPTIONS.includes('Ready'), 'old Ready removed from dropdown');
assert(!ORDER_STATUS_OPTIONS.includes('Finishing'), 'finishing removed');
assert(!ORDER_STATUS_OPTIONS.includes('Packing'), 'packing removed');
assert(!ORDER_STATUS_OPTIONS.includes('Closed'), 'closed folded into delivered');
assert(normalizeOrderStatus('Ready') === 'Ready for Delivery', 'alias ready');
assert(normalizeOrderStatus('Packing') === 'Printing', 'alias packing');
assert(normalizeOrderStatus('Finishing and packing') === 'Printing', 'alias finishing+packing');
assert(normalizeOrderStatus('Closed') === 'Delivered', 'alias closed');
assert(isOpenOrder({ status: 'Ready', docType: 'Order' }), 'legacy ready is open');
assert(isOpenOrder({ status: 'Ready for Delivery', docType: 'Order' }), 'ready for delivery is open');
assert(!isOpenOrder({ status: 'Delivered', docType: 'Order' }), 'delivered not open');

console.log('orderStatus ok');
