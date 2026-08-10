/** Compress image for catalog only — never attach to order/invoice lines. */

// Keep under Google Sheets ~50k cell limit, but prefer sharp display quality.
const DEFAULT_MAX_EDGE = 1000;
const DEFAULT_JPEG_QUALITY = 0.86;
const DEFAULT_MAX_CHARS = 45000;

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
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          return canvas.toDataURL('image/jpeg', quality);
        };

        try {
          // Prefer high quality first; only reduce if Sheets cell limit requires it.
          let dataUrl = tryEncode(width, height, JPEG_QUALITY);
          let q = JPEG_QUALITY;
          let w = width;
          let h = height;
          while (dataUrl.length > MAX_DATA_URL_CHARS && (q > 0.55 || w > 480)) {
            if (q > 0.55) {
              q = Math.max(0.55, q - 0.05);
            } else {
              w = Math.max(480, Math.round(w * 0.85));
              h = Math.max(480, Math.round(h * 0.85));
            }
            dataUrl = tryEncode(w, h, q);
          }
          if (dataUrl.length > MAX_DATA_URL_CHARS) {
            reject(new Error('Image still too large for storage — use a clearer, smaller photo (under ~2MB)'));
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
