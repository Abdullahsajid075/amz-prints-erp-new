/** Product catalog images — HD for website (Drive); Sheets only stores URLs. */

/** Google Sheets cell max is 50k; used only as Drive-failure fallback. */
export const SHEETS_MAX_IMAGE_CHARS = 49000;
/** Legacy alias. */
export const IMAGES_CELL_BUDGET = 49000;
export const GALLERY_EXTRA_MAX_CHARS = 49000;

/** Catalog photos stay small so product save does not time out on Supabase. */
export const WEB_IMAGE_MAX_EDGE = 480;
export const WEB_IMAGE_MAX_CHARS = 48000;

const DEFAULT_JPEG_QUALITY = 0.74;

function mimeForFile_(file) {
  const t = String(file?.type || '').toLowerCase();
  if (t === 'image/png') return 'image/png';
  if (t === 'image/jpeg' || t === 'image/jpg') return 'image/jpeg';
  if (t === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

/**
 * Encode image for catalog. Default is website-HD (2000px). Pass maxChars/maxEdge
 * to shrink only when a caller needs Sheets-cell fallback.
 */
export function encodeProductImageFile(file, opts = {}) {
  const MAX_CHARS = opts.maxChars ?? WEB_IMAGE_MAX_CHARS;
  const MAX_EDGE = opts.maxEdge === undefined ? WEB_IMAGE_MAX_EDGE : opts.maxEdge;
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
              q = 0.92;
            } else if (q > 0.75) {
              q = Math.max(0.75, +(q - 0.03).toFixed(2));
            } else if (w > 640) {
              w = Math.max(640, Math.round(w * 0.9));
              h = Math.max(640, Math.round(h * 0.9));
            } else if (q > 0.55) {
              q = Math.max(0.55, +(q - 0.05).toFixed(2));
            } else {
              break;
            }
            dataUrl = tryEncode(w, h, q, mime);
          }

          if (dataUrl.length > MAX_CHARS) {
            reject(new Error(
              `Photo is too large (${dataUrl.length} chars). Try a smaller file.`
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

/** Product upload — HD for website (GAS stores Drive URLs). */
export function compressGalleryImageFile(file) {
  return encodeProductImageFile(file, {
    maxEdge: WEB_IMAGE_MAX_EDGE,
    maxChars: WEB_IMAGE_MAX_CHARS,
    quality: 0.7,
  });
}

/** Customer / employee DP — small enough for a card + row save. */
export function compressPortraitFile(file) {
  return encodeProductImageFile(file, {
    maxEdge: 320,
    maxChars: 42000,
    quality: 0.72,
  });
}

/**
 * Keep up to 5 gallery photos. HD data-URLs are uploaded to Drive on save —
 * do not drop extras for Sheets cell size on the client.
 */
export function fitImagesForSheets(images) {
  const list = (Array.isArray(images) ? images : [])
    .map((s) => String(s || '').trim())
    .filter(Boolean);
  return list.slice(0, MAX_PRODUCT_IMAGES);
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
  };
}
