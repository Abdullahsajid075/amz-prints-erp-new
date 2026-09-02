/**
 * Light client-side sorter for list screens.
 * @param {Array} rows
 * @param {{ field: string, dir?: 'asc'|'desc' }} sort
 * @param {Record<string, (row: any) => any>} [getters]
 */
export function sortBy(rows, sort, getters = {}) {
  if (!Array.isArray(rows) || !rows.length) return Array.isArray(rows) ? rows : [];
  const field = sort?.field || '';
  if (!field) return rows;
  const mul = String(sort?.dir || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  const get = getters[field] || ((r) => r?.[field]);

  return [...rows].sort((a, b) => {
    let av = get(a);
    let bv = get(b);
    if (av == null || av === '') av = null;
    if (bv == null || bv === '') bv = null;
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    const an = typeof av === 'number' ? av : Number(av);
    const bn = typeof bv === 'number' ? bv : Number(bv);
    if (Number.isFinite(an) && Number.isFinite(bn) && String(av).trim() !== '' && String(bv).trim() !== '') {
      // Prefer numeric compare when both look numeric (amounts, stock)
      if (/^-?\d+(\.\d+)?$/.test(String(av).trim()) && /^-?\d+(\.\d+)?$/.test(String(bv).trim())) {
        return (an - bn) * mul;
      }
    }

    // Dates yyyy-MM-dd
    const as = String(av);
    const bs = String(bv);
    if (/^\d{4}-\d{2}-\d{2}/.test(as) && /^\d{4}-\d{2}-\d{2}/.test(bs)) {
      return as.slice(0, 10).localeCompare(bs.slice(0, 10)) * mul;
    }

    return as.localeCompare(bs, undefined, { numeric: true, sensitivity: 'base' }) * mul;
  });
}

/**
 * Keep the current sort, but move important rows first.
 * Higher score floats to the top; equal scores stay in the original order.
 */
export function pinFirst(rows, scoreFn) {
  if (!Array.isArray(rows) || !rows.length) return Array.isArray(rows) ? rows : [];
  const decorated = rows.map((row, index) => ({
    row,
    index,
    score: Number(typeof scoreFn === 'function' ? scoreFn(row) : 0) || 0,
  }));
  decorated.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });
  return decorated.map((d) => d.row);
}

export const SORT_DIR_OPTIONS = [
  { value: 'asc', label: 'Asc ↑' },
  { value: 'desc', label: 'Desc ↓' },
];
