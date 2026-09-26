const {
  INVOICE_REQUIRED_MESSAGE,
  classifyIncorrectDelivery,
  canDeliverOrder,
  asHistory,
  appendAdminReviewRemark,
} = require('./deliveryWorkflow');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(canDeliverOrder({ hasInvoice: false, status: 'Ready' }).ok === false, 'block without invoice');
assert(canDeliverOrder({ hasInvoice: false, status: 'Ready' }).message === INVOICE_REQUIRED_MESSAGE, 'exact invoice toast');
assert(canDeliverOrder({ hasInvoice: true, status: 'Ready' }).ok === true, 'allow with invoice');
assert(canDeliverOrder({ hasInvoice: true, status: 'Ready' }).already !== true, 'not auto delivered');
assert(canDeliverOrder({ hasInvoice: true, status: 'Delivered' }).already === true, 'already delivered');
assert(canDeliverOrder({ hasInvoice: true, status: 'Printing', docType: 'pos' }).ok === true, 'pos ok');

const auto = classifyIncorrectDelivery({
  status: 'Delivered',
  doc_type: 'Order',
  status_history: [
    { status: 'Ready', at: '2026-09-01 10:00', note: 'Status update' },
    { status: 'Delivered', at: '2026-09-20 12:00', note: 'Invoice linked — marked Delivered' },
  ],
}, { hasInvoice: true });
assert(auto.action === 'restore' && auto.restoreTo === 'Ready', `auto restore, got ${auto.action}/${auto.restoreTo}`);

const autoNoInv = classifyIncorrectDelivery({
  status: 'Delivered',
  doc_type: 'Order',
  status_history: [
    { status: 'Packing', note: 'Status update' },
    { status: 'Delivered', note: 'Invoice linked — marked Delivered' },
  ],
}, { hasInvoice: false });
assert(autoNoInv.action === 'reopen-ready', 'reopen ready without invoice');

const genuineNoInv = classifyIncorrectDelivery({
  status: 'Delivered',
  doc_type: 'Order',
  status_history: [
    { status: 'Ready', note: 'Status update' },
    { status: 'Delivered', note: 'Manual delivery confirmation — order closed' },
  ],
}, { hasInvoice: false });
assert(genuineNoInv.action === 'flag' && genuineNoInv.keepStatus === true, 'keep genuine no-invoice');

const unknown = classifyIncorrectDelivery({
  status: 'Delivered',
  doc_type: 'Order',
  status_history: [
    { status: 'Delivered', note: 'Invoice linked — marked Delivered' },
  ],
}, { hasInvoice: true });
assert(unknown.action === 'flag', 'flag when previous unknown');

const bulk = classifyIncorrectDelivery({
  status: 'Delivered',
  doc_type: 'Order',
  status_history: [
    { status: 'Packing', note: 'Status update' },
    { status: 'Delivered', note: 'Status update', at: '2026-09-26 07:14:47' },
  ],
}, { hasInvoice: true });
assert(bulk.action === 'restore' && bulk.restoreTo === 'Packing', 'bulk patch restore');

const staff = classifyIncorrectDelivery({
  status: 'Delivered',
  doc_type: 'Order',
  status_history: [
    { status: 'Ready', note: 'Status update' },
    { status: 'Delivered', note: 'Status update' },
  ],
}, { hasInvoice: true });
assert(staff.action === 'flag' && staff.keepStatus === true, 'do not guess Status update');

const pos = classifyIncorrectDelivery({ status: 'Delivered', doc_type: 'pos' }, { hasInvoice: false });
assert(pos.action === 'keep', 'keep pos');

const laterManual = classifyIncorrectDelivery({
  status: 'Delivered',
  doc_type: 'Order',
  status_history: [
    { status: 'Ready', note: 'x' },
    { status: 'Delivered', note: 'Invoice linked — marked Delivered' },
    { status: 'Delivered', note: 'Manual delivery confirmation — order closed' },
  ],
}, { hasInvoice: true });
assert(laterManual.action === 'keep', 'keep if staff confirmed after auto');

assert(asHistory({ status_history: '[{"status":"Ready"}]' }).length === 1, 'parse json history');
assert(appendAdminReviewRemark('', 'x').includes('ADMIN REVIEW'), 'flag remark');

console.log('deliveryWorkflow ok');
