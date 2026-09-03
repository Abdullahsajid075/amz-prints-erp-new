/** Compress image for catalog only — never attach to order/invoice lines. */

// Keep under Google Sheets ~50k cell limit, but prefer sharp 1:1 display.
const DEFAULT_MAX_EDGE = 1200;
const DEFAULT_JPEG_QUALITY = 0.9;
const DEFAULT_MAX_CHARS = 45000;

/**
 * Draw the full photo into a canvas (contain, never crop).
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} img
 * @param {number} canvasW
 * @param {number} canvasH
 * @param {number} srcW
 * @param {number} srcH
 */
function drawContained(ctx, img, canvasW, canvasH, srcW, srcH) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);
  const scale = Math.min(canvasW / Math.max(srcW, 1), canvasH / Math.max(srcH, 1));
  const dw = Math.max(1, srcW * scale);
  const dh = Math.max(1, srcH * scale);
  const dx = (canvasW - dw) / 2;
  const dy = (canvasH - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/**
 * @param {File} file
 * @param {{ maxEdge?: number, maxChars?: number, quality?: number, square?: boolean }} [opts]
 */
export function compressImageFile(file, opts = {}) {
  const MAX_EDGE = opts.maxEdge || DEFAULT_MAX_EDGE;
  const JPEG_QUALITY = opts.quality || DEFAULT_JPEG_QUALITY;
  const MAX_DATA_URL_CHARS = opts.maxChars || DEFAULT_MAX_CHARS;
  const square = opts.square === true;

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
        const srcW = Math.max(1, img.naturalWidth || img.width || 1);
        const srcH = Math.max(1, img.naturalHeight || img.height || 1);

        let canvasW;
        let canvasH;
        if (square) {
          const size = Math.min(MAX_EDGE, Math.max(srcW, srcH));
          canvasW = size;
          canvasH = size;
        } else {
          const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH));
          canvasW = Math.max(1, Math.round(srcW * scale));
          canvasH = Math.max(1, Math.round(srcH * scale));
        }

        const tryEncode = (w, h, quality) => {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          drawContained(ctx, img, w, h, srcW, srcH);
          return canvas.toDataURL('image/jpeg', quality);
        };

        try {
          let dataUrl = tryEncode(canvasW, canvasH, JPEG_QUALITY);
          let q = JPEG_QUALITY;
          let w = canvasW;
          let h = canvasH;
          while (dataUrl.length > MAX_DATA_URL_CHARS && (q > 0.62 || w > 640)) {
            if (q > 0.62) {
              q = Math.max(0.62, q - 0.04);
            } else if (square) {
              w = Math.max(640, Math.round(w * 0.9));
              h = w;
            } else {
              w = Math.max(640, Math.round(w * 0.85));
              h = Math.max(640, Math.round(h * 0.85));
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
