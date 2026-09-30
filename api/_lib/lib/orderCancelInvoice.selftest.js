const {
  amountToForfeit,
  remainingOrderIds,
  stripCancelledOrderItems,
  planInvoiceAfterOrderCancel,
  invoiceHoldsOrder,
} = require('./orderCancelInvoice');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const orderA = { id: 'oa', order_id: 'ORD-1', total_amount: 100, advance_payment: 40, products: [{ name: 'Cards', quantity: 2 }] };
const orderB = { id: 'ob', order_id: 'ORD-2', total_amount: 50, advance_payment: 0, products: [{ name: 'Banner', quantity: 1 }] };

const single = {
  id: 'inv1',
  invoice_no: 'INV-1',
  order_id: 'ORD-1',
  order_ids: ['ORD-1'],
  items: [{ name: 'Cards', quantity: 2, sourceOrderId: 'ORD-1' }],
  subtotal: 100,
  total: 100,
  paid: 40,
  previous_balance: 0,
  payment_history: [{ amount: 40, applied: 40, orderId: 'ORD-1', notes: 'Advance allocated from order ORD-1' }],
  notes: '',
  status: 'Partial',
};

const singlePlan = planInvoiceAfterOrderCancel(single, orderA);
assert(singlePlan.action === 'deleted-invoice', 'single invoice deleted');
assert(singlePlan.deleteInvoice === true, 'delete flag');
assert(singlePlan.paid === 0 && singlePlan.total === 0, 'single totals cleared');
assert(singlePlan.reversePaid === 0, 'no cash reversal');
assert(singlePlan.forfeitPaid === 40, 'advance forfeited');
assert(singlePlan.creditExtra === 0, 'no credit back');
assert(/deleted/i.test(singlePlan.message) && /forfeit/i.test(singlePlan.message), 'delete + forfeit message');

const multi = {
  id: 'inv2',
  invoice_no: 'INV-2',
  order_id: 'ORD-1',
  order_ids: ['ORD-1', 'ORD-2'],
  items: [
    { name: 'Cards', quantity: 2, sourceOrderId: 'ORD-1' },
    { name: 'Banner', quantity: 1, sourceOrderId: 'ORD-2' },
  ],
  subtotal: 150,
  total: 150,
  paid: 40,
  previous_balance: 0,
  payment_history: [{ amount: 40, applied: 40, orderId: 'ORD-1', notes: 'Advance allocated from order ORD-1' }],
  notes: '',
  status: 'Partial',
};

assert(invoiceHoldsOrder(multi, orderA), 'holds A');
assert(remainingOrderIds(multi, orderA).join() === 'ORD-2', 'B remains');
const stripped = stripCancelledOrderItems(multi.items, orderA);
assert(stripped.length === 1 && stripped[0].name === 'Banner', 'strip A lines');

const multiPlan = planInvoiceAfterOrderCancel(multi, orderA);
assert(multiPlan.action === 'removed-from-invoice', 'multi keeps invoice');
assert(multiPlan.orderIds.join() === 'ORD-2', 'only B');
assert(multiPlan.total === 50 && multiPlan.subtotal === 50, 'totals drop A');
assert(multiPlan.reversePaid === 0 && multiPlan.forfeitPaid === 40 && multiPlan.paid === 0, 'A advance forfeited, not reversed');
assert(multiPlan.creditExtra === 0, 'no credit on multi');
assert(multiPlan.status === 'Unpaid', 'remaining unpaid');

const untagged = {
  id: 'inv3',
  invoice_no: 'INV-3',
  order_ids: ['ORD-1', 'ORD-2'],
  items: [{ name: 'Cards', quantity: 2 }, { name: 'Banner', quantity: 1 }],
  subtotal: 150,
  total: 150,
  paid: 0,
  previous_balance: 0,
  payment_history: [],
};
const untaggedPlan = planInvoiceAfterOrderCancel(untagged, orderA);
assert(untaggedPlan.items.length === 1 && untaggedPlan.items[0].name === 'Banner', 'untagged strip by name');
assert(amountToForfeit(untagged, orderA) === 0, 'nothing to forfeit');

const leftoverPaid = {
  ...multi,
  paid: 150,
  payment_history: [{ amount: 150, applied: 150, notes: 'bulk' }],
};
const leftoverPlan = planInvoiceAfterOrderCancel(leftoverPaid, orderA);
assert(leftoverPlan.reversePaid === 0, 'no reversal on leftover');
assert(leftoverPlan.creditExtra === 0, 'excess forfeited not credited');
assert(leftoverPlan.paid === 50, 'remaining due stays paid');
assert(Math.abs(leftoverPlan.forfeitPaid - 100) < 0.01, 'cancelled share forfeited');

console.log('orderCancelInvoice ok');
