/** Compress image for catalog only — never attach to order/invoice lines. */

const DEFAULT_MAX_EDGE = 280;
const DEFAULT_JPEG_QUALITY = 0.62;
const DEFAULT_MAX_CHARS = 42000;

/**
 * @param {File} file
 * @param {{ maxEdge?: number, maxChars?: number, quality?: number }} [opts]
 */
export function compressImageFile(file, opts = {}) {
  const MAX_EDGE = opts.maxEdge || DEFAULT_MAX_EDGE;
  const JPEG_QUALITY = opts.quality || DEFAULT_JPEG_QUALITY;
  const MAX_DATA_URL_CHARS = opts.maxChars || DEFAULT_MAX_CHARS;

  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Please choose an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, MAX_EDGE / Math.max(width, height || 1));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const tryEncode = (w, h, quality) => {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          return canvas.toDataURL('image/jpeg', quality);
        };

        try {
          let dataUrl = tryEncode(width, height, JPEG_QUALITY);
          let q = JPEG_QUALITY;
          let w = width;
          let h = height;
          while (dataUrl.length > MAX_DATA_URL_CHARS && (q > 0.35 || w > 100)) {
            if (q > 0.35) q = Math.max(0.35, q - 0.08);
            else {
              w = Math.max(100, Math.round(w * 0.75));
              h = Math.max(100, Math.round(h * 0.75));
            }
            dataUrl = tryEncode(w, h, q);
          }
          if (dataUrl.length > MAX_DATA_URL_CHARS) {
            reject(new Error('Image still too large — pick a smaller photo'));
            return;
          }
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/** Safe src for catalog thumbnails (Drive + data URLs). */
export function productImageSrc(product) {
  return String(product?.image || product?.photo || '').trim();
}

/** Strip catalog-only fields before saving onto order/invoice line items */
export function catalogFieldsForOrderLine(product = {}) {
  const type = product.productType || product.product_type || 'Product';
  const isService = String(type).toLowerCase() === 'service';
  return {
    productId: String(product.id || product.productId || ''),
    name: product.name || '',
    quantity: 1,
    rate: Number(product.rate ?? product.basePrice ?? 0) || 0,
    size: isService ? '' : (product.size || ''),
    material: isService ? '' : (product.material || ''),
    notes: isService ? (product.description || '') : '',
    productType: isService ? 'Service' : 'Product',
    description: isService ? (product.description || '') : '',
    // intentionally NO image / photo
  };
}
