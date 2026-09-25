const { computeCustomerLedger } = require('../lib/ledger');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const customer = { id: 'c1', name: 'Ali Press', phone: '03001234567', credit_balance: 100 };
const orders = [
  { id: 'o1', order_id: 'ORD-1', customer_id: 'c1', total_amount: 1000, balance_amount: 400, doc_type: 'Order', status: 'Ready' },
  { id: 'o2', order_id: 'ORD-2', customer_phone: '+92 300 1234567', total_amount: 500, balance_amount: 500, doc_type: 'Order', status: 'Printing' },
  { id: 'o3', order_id: 'ORD-X', customer_id: 'c1', total_amount: 50, balance_amount: 50, doc_type: 'Order', status: 'Cancelled' },
];
const invoices = [
  { id: 'i1', invoice_no: 'INV-1', customer_id: 'c1', order_id: 'ORD-1', total: 1000, paid: 600, previous_balance: 0, status: 'Partial' },
];

const led = computeCustomerLedger(customer, orders, invoices, []);
assert(led.outstanding === 800, `expected 800 got ${led.outstanding}`);
assert(led.creditBalance === 100, 'credit');

const paidEarly = computeCustomerLedger(
  { id: 'c1', phone: '03001234567', credit_balance: 0 },
  [{ id: 'o1', order_id: 'ORD-1', customer_id: 'c1', total_amount: 1000, balance_amount: 400, doc_type: 'Order' }],
  [{ id: 'i1', customer_id: 'c1', order_id: 'ORD-1', total: 1000, paid: 1000, previous_balance: 0 }],
  []
);
assert(paidEarly.outstanding === 0, `paid invoice must not keep stale order balance, got ${paidEarly.outstanding}`);

const parkedCredit = computeCustomerLedger(
  { id: 'c1', credit_balance: 3000 },
  [{ id: 'o1', order_id: 'ORD-1', customer_id: 'c1', total_amount: 3000, balance_amount: 3000, doc_type: 'Order' }],
  [{ id: 'i1', customer_id: 'c1', order_id: 'ORD-1', invoice_no: 'INV-1', total: 3000, paid: 0, previous_balance: 0 }],
  []
);
assert(parkedCredit.invoiceOutstanding === 3000, `invoice due should stay visible, got ${parkedCredit.invoiceOutstanding}`);
assert(parkedCredit.outstanding === 0, `unallocated credit offsets AR, got ${parkedCredit.outstanding}`);

console.log('ledger tests ok');
