/** Compress image for catalog only — never attach to order/invoice lines. */

/** Longest side in px — sharp enough for ERP + website product views. */
const DEFAULT_MAX_EDGE = 1200;
/** Prefer high quality; size loop will step down only if over Sheets limit. */
const DEFAULT_JPEG_QUALITY = 0.88;
/** Google Sheets cell max is 50k; stay under for a single Image cell. */
const DEFAULT_MAX_CHARS = 45000;
/** Images JSON cell budget (all gallery photos together). */
export const IMAGES_CELL_BUDGET = 45000;
/** Per-photo budget so several fit inside Images JSON. */
export const GALLERY_MAX_CHARS = 7500;

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
          let mime = preferWebp ? 'image/webp' : 'image/jpeg';
          let q = START_QUALITY;
          let w = width;
          let h = height;
          let dataUrl = tryEncode(w, h, q, mime);

          // Always fit under limit — never leave user with a hard failure if possible
          let steps = 0;
          while (dataUrl.length > MAX_DATA_URL_CHARS && steps < 40) {
            steps += 1;
            if (q > 0.55) {
              q = Math.max(0.55, +(q - 0.05).toFixed(2));
            } else if (mime === 'image/webp') {
              mime = 'image/jpeg';
              q = 0.78;
            } else if (w > 200 || h > 200) {
              w = Math.max(160, Math.round(w * 0.82));
              h = Math.max(160, Math.round(h * 0.82));
            } else if (q > 0.35) {
              q = Math.max(0.35, +(q - 0.05).toFixed(2));
            } else {
              break;
            }
            dataUrl = tryEncode(w, h, q, mime);
          }

          if (dataUrl.length > MAX_DATA_URL_CHARS) {
            // Last resort tiny JPEG
            dataUrl = tryEncode(160, 160, 0.4, 'image/jpeg');
          }
          if (dataUrl.length > MAX_DATA_URL_CHARS) {
            reject(new Error('Photo still too large after compress — try a simpler / smaller file'));
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

/** Gallery compress — sized so several photos fit in one Sheets Images cell. */
export function compressGalleryImageFile(file) {
  return compressImageFile(file, {
    maxEdge: 1000,
    maxChars: GALLERY_MAX_CHARS,
    quality: 0.82,
  });
}

/**
 * Pack gallery so JSON fits Sheets cell (~50k). Keeps as many photos as possible from the start.
 * Oversized single entries are skipped.
 */
export function fitImagesForSheets(images, budget = IMAGES_CELL_BUDGET) {
  const list = (Array.isArray(images) ? images : [])
    .map((s) => String(s || '').trim())
    .filter(Boolean);
  const out = [];
  for (const img of list) {
    if (img.length > GALLERY_MAX_CHARS + 2000) continue; // skip unusable giants
    const trial = [...out, img];
    if (JSON.stringify(trial).length > budget) break;
    out.push(img);
    if (out.length >= MAX_PRODUCT_IMAGES) break;
  }
  return out;
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
