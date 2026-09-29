/** Scannable CODE128 value used on POS stickers and POS barcode search. */
export function productBarcodeCode(product, variation) {
  const fromVar = String(variation?.sku || variation?.barcode || '').trim();
  if (fromVar) return fromVar;
  const fromProduct = String(product?.sku || product?.barcode || '').trim();
  if (fromProduct) return fromProduct;
  const vid = String(variation?.id || '').trim();
  if (vid) return vid;
  return String(product?.id || 'AMZ').trim() || 'AMZ';
}
