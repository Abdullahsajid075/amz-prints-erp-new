/** Product catalog images — preserve upload resolution; only shrink if Sheets cell limit requires it. */

/** Google Sheets cell max is 50k; stay under for Image / Images cells. */
export const SHEETS_MAX_IMAGE_CHARS = 49000;
/** Legacy alias used by fitImagesForSheets (gallery extras JSON cell). */
export const IMAGES_CELL_BUDGET = 49000;
/** Per extra gallery photo soft target when packing JSON (primary lives in Image column). */
export const GALLERY_EXTRA_MAX_CHARS = 49000;

/** @deprecated — prefer encodeProductImageFile; kept for employee photos etc. */
const DEFAULT_JPEG_QUALITY = 0.98;

function mimeForFile_(file) {
  const t = String(file?.type || '').toLowerCase();
  if (t === 'image/png') return 'image/png';
  if (t === 'image/jpeg' || t === 'image/jpg') return 'image/jpeg';
  if (t === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

/**
 * Encode image at original resolution. JPEG/WebP use high quality; PNG stays lossless.
 * Resize / lower quality only when result exceeds maxChars (Sheets limit).
 * @param {File} file
 * @param {{ maxChars?: number, maxEdge?: number|null, quality?: number }} [opts]
 */
export function encodeProductImageFile(file, opts = {}) {
  const MAX_CHARS = opts.maxChars ?? SHEETS_MAX_IMAGE_CHARS;
  const MAX_EDGE = opts.maxEdge === undefined ? null : opts.maxEdge;
  const START_QUALITY = opts.quality ?? DEFAULT_JPEG_QUALITY;

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
        const origW = img.width || 1;
        const origH = img.height || 1;

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
          if (mime === 'image/png') return canvas.toDataURL('image/png');
          return canvas.toDataURL(mime, quality);
        };

        try {
          let mime = mimeForFile_(file);
          let q = mime === 'image/png' ? 1 : START_QUALITY;
          let w = origW;
          let h = origH;

          if (MAX_EDGE && Math.max(w, h) > MAX_EDGE) {
            const scale = MAX_EDGE / Math.max(w, h);
            w = Math.max(1, Math.round(w * scale));
            h = Math.max(1, Math.round(h * scale));
          }

          let dataUrl = tryEncode(w, h, q, mime);

          let steps = 0;
          while (dataUrl.length > MAX_CHARS && steps < 60) {
            steps += 1;
            if (mime === 'image/png') {
              mime = 'image/jpeg';
              q = 0.95;
            } else if (q > 0.75) {
              q = Math.max(0.75, +(q - 0.03).toFixed(2));
            } else if (w > Math.min(origW, origH) * 0.4) {
              w = Math.max(1, Math.round(w * 0.92));
              h = Math.max(1, Math.round(h * 0.92));
            } else if (q > 0.5) {
              q = Math.max(0.5, +(q - 0.05).toFixed(2));
            } else {
              break;
            }
            dataUrl = tryEncode(w, h, q, mime);
          }

          if (dataUrl.length > MAX_CHARS) {
            reject(new Error(
              `Photo is too large for storage (${dataUrl.length} chars). Try a smaller file or fewer gallery photos.`
            ));
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

/** @deprecated use encodeProductImageFile */
export function compressImageFile(file, opts = {}) {
  return encodeProductImageFile(file, opts);
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

/** Product upload — full resolution (Sheets limit applies only if needed). */
export function compressGalleryImageFile(file) {
  return encodeProductImageFile(file, { maxChars: SHEETS_MAX_IMAGE_CHARS });
}

/**
 * Pack gallery for Sheets: primary image uses Image column; extras share Images JSON cell.
 * Primary is never dropped — only extra photos may be skipped if JSON is full.
 */
export function fitImagesForSheets(images, budget = IMAGES_CELL_BUDGET) {
  const list = (Array.isArray(images) ? images : [])
    .map((s) => String(s || '').trim())
    .filter(Boolean);
  if (!list.length) return [];
  const primary = list[0];
  const extras = [];
  for (const img of list.slice(1)) {
    const trial = [...extras, img];
    if (JSON.stringify(trial).length > budget) break;
    extras.push(img);
    if (extras.length >= MAX_PRODUCT_IMAGES - 1) break;
  }
  return [primary, ...extras];
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
