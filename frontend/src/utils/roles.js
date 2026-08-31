/** Shared role helpers. */

const ADMIN_ROLES = ['admin', 'administrator', 'owner', 'super admin', 'superadmin'];

/** Only admin-level roles may unblock customers. */
export function isAdmin(user) {
  const role = String(user?.role || '').trim().toLowerCase();
  return ADMIN_ROLES.includes(role);
}
