import { moduleForPath, canAccessModule, canAccessPath } from './permissions.js';

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`permissions.selftest: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// The launcher (/dashboard) and the Overview KPI page (/overview) are both
// gated on the always-on 'dashboard' module — neither should ever bounce a
// signed-in user who otherwise has no special permissions assigned.
assertEqual(moduleForPath('/dashboard'), 'dashboard', 'dashboard path maps to the dashboard module');
assertEqual(moduleForPath('/overview'), 'dashboard', 'overview path maps to the dashboard module');

const staffNoPerms = { role: 'Staff', permissions: [] };
assertEqual(canAccessModule(staffNoPerms, 'dashboard'), true, 'dashboard module is always accessible');
assertEqual(canAccessPath(staffNoPerms, '/dashboard'), true, 'a permission-less staff user can open the launcher');
assertEqual(canAccessPath(staffNoPerms, '/overview'), true, 'a permission-less staff user can open Overview');

// Fine-grained module gating still applies to whatever Overview shows.
assertEqual(canAccessModule(staffNoPerms, 'accounts'), false, 'accounts stays gated without the permission');
const staffWithAccounts = { role: 'Staff', permissions: ['accounts'] };
assertEqual(canAccessModule(staffWithAccounts, 'accounts'), true, 'accounts opens up once granted');

console.log('permissions.selftest passed');
