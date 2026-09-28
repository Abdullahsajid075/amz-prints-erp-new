import { productBarcodeCode } from './productBarcode.js';

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

function variationSearchBlob(product) {
  const variations = Array.isArray(product?.variations) ? product.variations : [];
  return variations.map((v) => [
    v?.name,
    v?.sku,
    v?.barcode,
    v?.id,
    v?.size,
    v?.color,
  ].map((x) => String(x || '')).join(' ')).join(' ');
}

/** Match product by name, sku, barcode, category, material, size, type — every typed word must match. */
export function productMatchesQuery(product, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const p = product || {};
  const blob = [
    p.name,
    p.sku,
    p.barcode,
    p.category,
    p.material,
    p.size,
    p.description,
    p.fullDescription,
    p.productType,
    p.id,
    variationSearchBlob(p),
  ].map((x) => String(x || '')).join(' ');
  return textMatchesWords(blob, q);
}

function normCode(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Exact barcode / SKU / id match for POS scanners (hardware types the code + Enter).
 * Prefers a matching variation so the scanned sticker adds the correct size/color.
 */
export function findProductByBarcode(products, code) {
  const needle = normCode(code);
  if (!needle) return null;
  const list = Array.isArray(products) ? products : [];

  for (const product of list) {
    const variations = Array.isArray(product?.variations) ? product.variations : [];
    for (const variation of variations) {
      const candidates = [
        variation?.sku,
        variation?.barcode,
        variation?.id,
        productBarcodeCode(product, variation),
      ].map(normCode);
      if (candidates.includes(needle)) return { product, variation };
    }
  }

  for (const product of list) {
    const candidates = [
      product?.sku,
      product?.barcode,
      product?.id,
      productBarcodeCode(product),
    ].map(normCode);
    if (candidates.includes(needle)) {
      const variations = Array.isArray(product.variations) ? product.variations : [];
      return { product, variation: variations.length === 1 ? variations[0] : null };
    }
  }

  return null;
}
