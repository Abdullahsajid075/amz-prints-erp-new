/** Any-word matching for catalog search (order form, POS, etc.). */

export function textMatchesWords(haystack, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const text = String(haystack || '').toLowerCase();
  if (text.includes(q)) return true;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return text.includes(q);
  return words.every((w) => text.includes(w));
}

/** Match product by name, sku, category, material, size, type — every typed word must match. */
export function productMatchesQuery(product, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const p = product || {};
  const blob = [
    p.name,
    p.sku,
    p.category,
    p.material,
    p.size,
    p.description,
    p.fullDescription,
    p.productType,
    p.id,
  ].map((x) => String(x || '')).join(' ');
  return textMatchesWords(blob, q);
}
