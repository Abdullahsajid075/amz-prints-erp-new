const INVOICE_REQUIRED_MESSAGE = 'Invoice Required: Please generate the invoice before delivering this order.';

function orderHasInvoice(order) {
  return !!(order?.invoiceId || order?.invoiceNumber || order?.hasInvoice);
}

function canManuallyDeliver(order) {
  if (/cancel/i.test(String(order?.status || ''))) return { ok: false };
  if (/^(delivered|complete|completed|closed)$/i.test(String(order?.status || ''))) return { ok: true, already: true };
  if (!orderHasInvoice(order)) return { ok: false, message: INVOICE_REQUIRED_MESSAGE };
  return { ok: true };
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

assert(canManuallyDeliver({ status: 'Ready' }).ok === false, 'block no invoice');
assert(canManuallyDeliver({ status: 'Ready' }).message === INVOICE_REQUIRED_MESSAGE, 'exact message');
assert(canManuallyDeliver({ status: 'Ready', invoiceId: 'inv1' }).ok === true, 'eligible');
assert(canManuallyDeliver({ status: 'Ready', invoiceId: 'inv1' }).already !== true, 'not auto delivered');
assert(canManuallyDeliver({ status: 'Delivered', invoiceId: 'inv1' }).already === true, 'already');

console.log('deliveryRules ok');
