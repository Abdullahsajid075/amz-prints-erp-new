import { sanitizeDashboardOrder, sameDashboardOrder } from './dashboardLayout.js';

function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`dashboardLayout.selftest: ${label} — expected ${e}, got ${a}`);
  }
}

// A saved order is respected as-is when it exactly matches the current apps.
assertEqual(
  sanitizeDashboardOrder(['pos', 'orders', 'crm'], ['orders', 'pos', 'crm']),
  ['pos', 'orders', 'crm'],
  'respects a saved order covering every current app',
);

// A newly granted module (not in the saved order) is appended at the end.
assertEqual(
  sanitizeDashboardOrder(['pos', 'orders'], ['orders', 'pos', 'invoices']),
  ['pos', 'orders', 'invoices'],
  'appends newly accessible apps at the end',
);

// An app the user lost access to (revoked permission) is dropped, not left as a ghost slot.
assertEqual(
  sanitizeDashboardOrder(['pos', 'hr', 'orders'], ['orders', 'pos']),
  ['pos', 'orders'],
  'drops ids no longer in the accessible set',
);

// Duplicate ids in a corrupted/old saved order are deduped, keeping the first occurrence.
assertEqual(
  sanitizeDashboardOrder(['pos', 'pos', 'orders'], ['orders', 'pos']),
  ['pos', 'orders'],
  'dedupes a saved order with repeated ids',
);

// No saved order (null/undefined/empty) falls back to the natural default order.
assertEqual(sanitizeDashboardOrder(null, ['orders', 'pos']), ['orders', 'pos'], 'falls back to defaults when nothing is stored');
assertEqual(sanitizeDashboardOrder([], ['orders', 'pos']), ['orders', 'pos'], 'falls back to defaults for an empty saved order');

// sameDashboardOrder: equality helper used to decide whether to show "Reset layout".
if (!sameDashboardOrder(['a', 'b'], ['a', 'b'])) {
  throw new Error('dashboardLayout.selftest: identical orders should be equal');
}
if (sameDashboardOrder(['a', 'b'], ['b', 'a'])) {
  throw new Error('dashboardLayout.selftest: reordered lists must not be equal');
}
if (sameDashboardOrder(['a'], ['a', 'b'])) {
  throw new Error('dashboardLayout.selftest: different-length lists must not be equal');
}

console.log('dashboardLayout.selftest passed');
