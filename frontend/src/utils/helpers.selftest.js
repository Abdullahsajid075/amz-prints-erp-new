import { toDateInputValue, formatDate, normalizePoStatus, isPoPayable, isPoReceived, PO_WORKFLOW_STATUSES } from './helpers.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(toDateInputValue('2026-09-28') === '2026-09-28', 'ymd');
assert(toDateInputValue('2026-09-28T19:00:00.000Z') === '2026-09-28', 'iso datetime uses date prefix');
assert(toDateInputValue('28-Sep-2026') === '2026-09-28', 'named day-mon-year');
assert(toDateInputValue('30-Sep-2026') === '2026-09-30', 'named expected delivery');
assert(toDateInputValue('') === '', 'empty');
assert(toDateInputValue(null) === '', 'null');
assert(formatDate('2026-09-28').includes('2026'), 'formatDate from ymd');

assert(PO_WORKFLOW_STATUSES.join() === 'Draft,Submitted,Received,Reversed,Cancelled', 'workflow list');
assert(normalizePoStatus('Ordered') === 'Submitted', 'ordered');
assert(normalizePoStatus('Partial Paid') === 'Submitted', 'partial paid');
assert(normalizePoStatus('Fully Paid') === 'Submitted', 'fully paid');
assert(normalizePoStatus('In Transit') === 'Submitted', 'in transit');
assert(normalizePoStatus('Received') === 'Received', 'received');
assert(normalizePoStatus('Fully Paid', { actualDeliveryDate: '2026-09-30' }) === 'Received', 'paid after receive stays received');
assert(normalizePoStatus('Fully Paid', { notes: '[STOCK_APPLIED]' }) === 'Received', 'stock marker');
assert(normalizePoStatus('Reversed') === 'Reversed', 'reversed');
assert(normalizePoStatus('Cancelled') === 'Cancelled', 'cancelled');
assert(normalizePoStatus('canceled') === 'Cancelled', 'canceled spelling');
assert(!isPoPayable('Cancelled'), 'cancelled not payable');
assert(!isPoPayable('Reversed'), 'reversed not payable');
assert(isPoPayable('Submitted'), 'submitted payable');
assert(isPoReceived('Received'), 'is received');
assert(!isPoReceived('Submitted'), 'submitted not received');

console.log('helpers po dates/status ok');
