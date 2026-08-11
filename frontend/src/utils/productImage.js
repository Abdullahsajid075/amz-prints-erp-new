/** Compress image for catalog only — never attach to order/invoice lines. */

/** Longest side in px — sharp enough for ERP + website product views. */
const DEFAULT_MAX_EDGE = 1400;
/** Prefer high quality; size loop will step down only if over Sheets limit. */
const DEFAULT_JPEG_QUALITY = 0.92;
/** Google Sheets cell max is 50k; stay slightly under for safety. */
const DEFAULT_MAX_CHARS = 48000;

function supportsWebpDataUrl_() {
  try {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * @param {File} file
 * @param {{ maxEdge?: number, maxChars?: number, quality?: number, preferWebp?: boolean }} [opts]
 */
export function compressImageFile(file, opts = {}) {
  const MAX_EDGE = opts.maxEdge || DEFAULT_MAX_EDGE;
  const START_QUALITY = opts.quality || DEFAULT_JPEG_QUALITY;
  const MAX_DATA_URL_CHARS = opts.maxChars || DEFAULT_MAX_CHARS;
  const preferWebp = opts.preferWebp !== false && supportsWebpDataUrl_();

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

        const tryEncode = (w, h, quality, mime) => {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          // High-quality downsample (default is often blurry)
          ctx.imageSmoothingEnabled = true;
          if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
          if (mime === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
          } else {
            ctx.clearRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);
          return canvas.toDataURL(mime, quality);
        };

        try {
          const mimePrimary = preferWebp ? 'image/webp' : 'image/jpeg';
          const mimeFallback = 'image/jpeg';

          let mime = mimePrimary;
          let q = START_QUALITY;
          let w = width;
          let h = height;
          let dataUrl = tryEncode(w, h, q, mime);

          // Prefer keeping resolution; ease quality first, then mild shrink
          let steps = 0;
          while (dataUrl.length > MAX_DATA_URL_CHARS && steps < 28) {
            steps += 1;
            if (q > 0.72) {
              q = Math.max(0.72, +(q - 0.03).toFixed(2));
            } else if (q > 0.58) {
              q = Math.max(0.58, +(q - 0.04).toFixed(2));
            } else if (w > 720 || h > 720) {
              w = Math.max(720, Math.round(w * 0.9));
              h = Math.max(720, Math.round(h * 0.9));
            } else if (mime === 'image/webp') {
              // WebP still too big — try JPEG at same size
              mime = mimeFallback;
              q = Math.min(START_QUALITY, 0.88);
            } else if (w > 480 || h > 480) {
              w = Math.max(480, Math.round(w * 0.88));
              h = Math.max(480, Math.round(h * 0.88));
            } else {
              break;
            }
            dataUrl = tryEncode(w, h, q, mime);
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
  const list = productImagesList(product);
  return list[0] || '';
}

export const MAX_PRODUCT_IMAGES = 5;

/** Normalize product.images / image / photo → unique non-empty list (max 5). */
export function productImagesList(product) {
  const out = [];
  const push = (v) => {
    const s = String(v || '').trim();
    if (!s || out.includes(s) || out.length >= MAX_PRODUCT_IMAGES) return;
    out.push(s);
  };
  let extra = product?.images ?? product?.gallery;
  if (typeof extra === 'string') {
    try { extra = JSON.parse(extra); } catch { extra = []; }
  }
  if (Array.isArray(extra)) extra.forEach(push);
  push(product?.image);
  push(product?.photo);
  return out;
}

/** Gallery compress — fits multiple images in one Sheets cell as JSON. */
export function compressGalleryImageFile(file) {
  return compressImageFile(file, {
    maxEdge: 1200,
    maxChars: 9000,
    quality: 0.88,
  });
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
