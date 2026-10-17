/**
 * Pure helpers behind the per-user persisted dashboard/POS icon ordering
 * (see `useDashboardLayout`). Kept free of React/network so the merge rules
 * can be unit-tested directly.
 */

/** Keeps every id from `defaultIds` exactly once, preferring the user's saved
 * order and appending anything new (newly granted module, etc.) at the end.
 * Drops ids the user no longer has access to instead of leaving ghost slots. */
export function sanitizeDashboardOrder(storedIds, defaultIds) {
  const allowed = new Set(defaultIds);
  const seen = new Set();
  const ordered = [];
  (Array.isArray(storedIds) ? storedIds : []).forEach((id) => {
    if (allowed.has(id) && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  });
  defaultIds.forEach((id) => {
    if (!seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  });
  return ordered;
}

export function sameDashboardOrder(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((id, i) => id === b[i]);
}
