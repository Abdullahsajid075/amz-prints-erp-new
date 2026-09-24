const crypto = require('crypto');
const { num, truthy } = require('./util');

function isAdminRole(user) {
  const role = String(user && user.role || '').trim().toLowerCase();
  return role === 'super admin' || role === 'admin' || role === 'administrator' || role === 'owner';
}

function userLabel(user) {
  return String((user && (user.name || user.username)) || 'staff');
}

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null || v === '') return [];
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return [];
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* fall through */ }
    }
    return t.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function uniqueStrings(list) {
  const out = [];
  (list || []).forEach((v) => {
    const s = String(v || '').trim();
    if (s && !out.includes(s)) out.push(s);
  });
  return out;
}

const DP_START = '[[AMZ_DP]]';
const DP_END = '[[/AMZ_DP]]';

function stripPhotoFromNotes(notes) {
  return String(notes || '').replace(/\[\[AMZ_DP\]\][\s\S]*?\[\[\/AMZ_DP\]\]/g, '').trim();
}

function extractPhotoFromNotes(notes) {
  const m = String(notes || '').match(/\[\[AMZ_DP\]\]([\s\S]*?)\[\[\/AMZ_DP\]\]/);
  return m ? String(m[1] || '').trim() : '';
}

function embedPhotoInNotes(notes, photo) {
  const clean = stripPhotoFromNotes(notes);
  const src = String(photo || '').trim();
  if (!src) return clean;
  return `${clean}${clean ? '\n' : ''}${DP_START}${src}${DP_END}`;
}

function customerPhoto(row) {
  if (!row) return '';
  return String(row.photo || row.image || extractPhotoFromNotes(row.notes) || '').trim();
}

function withCustomerPhoto(row, photo) {
  const src = photo == null ? customerPhoto(row) : String(photo || '').trim();
  const next = { ...row, notes: embedPhotoInNotes(row.notes, src) };
  if (src) {
    next.photo = src;
    next.image = src;
  } else {
    next.photo = '';
    next.image = '';
  }
  return next;
}

function collectOrderIds(body = {}, existing = {}) {
  const ids = uniqueStrings([
    ...asArray(body.orderIds != null ? body.orderIds : body.orderids),
    ...asArray(existing.order_ids),
    body.orderId || body.order_id || '',
    existing.order_id || '',
  ]);
  return ids;
}

function parseImages(images, fallback = '') {
  const list = uniqueStrings([
    ...asArray(images),
    fallback,
  ]);
  return list.slice(0, 5);
}

/** Website catalog: at least one photo and a real description. */
function isWebsiteCatalogReady(p) {
  if (!p) return false;
  const images = parseImages(p.images || p.gallery, p.image || p.photo || '');
  const desc = String(p.description || p.fullDescription || p.full_description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return images.length > 0 && desc.length >= 3;
}

function invoiceStatusFromPaid(total, paid) {
  const t = num(total);
  const p = num(paid);
  if (t <= 0) return p > 0 ? 'Paid' : 'Unpaid';
  if (p <= 0) return 'Unpaid';
  if (p + 0.009 >= t) return 'Paid';
  return 'Partial';
}

function hashPortalPassword(password, salt) {
  return crypto.createHash('sha256')
    .update(`${String(salt || '')}|${String(password || '')}`, 'utf8')
    .digest('hex');
}

function makePortalPassword(password) {
  const salt = crypto.randomUUID();
  return `${salt}:${hashPortalPassword(password, salt)}`;
}

function checkPortalPassword(stored, password) {
  const raw = String(stored || '');
  const idx = raw.indexOf(':');
  if (idx < 0) return false;
  const salt = raw.slice(0, idx);
  const hash = raw.slice(idx + 1);
  return hashPortalPassword(password, salt) === hash;
}

function issueCustomerToken(customer) {
  const payload = {
    typ: 'customer',
    id: String(customer.id || ''),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function parseCustomerToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(String(token), 'base64url').toString('utf8'));
    if (payload.typ !== 'customer') return null;
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function sanitizePortalCustomer(c) {
  if (!c) return null;
  return {
    id: c.id,
    customerCode: c.customer_code || c.id || '',
    name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    city: c.city || '',
    photo: customerPhoto(c),
    outstanding: num(c.outstanding),
    creditBalance: num(c.creditBalance != null ? c.creditBalance : c.credit_balance),
  };
}

function isBlocked(row) {
  if (!row) return false;
  if (row.blocked === true || row.blocked === 1) return true;
  const s = String(row.blocked || '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'blocked';
}

function isServiceProduct(p) {
  if (!p) return false;
  const type = String(p.productType || p.product_type || '').toLowerCase();
  if (type === 'service') return true;
  if (type === 'product') return false;
  return /service/i.test(String(p.category || ''));
}

/** Services never track. Products default ON unless trackInventory is explicitly off. */
function productTracksInventory(p) {
  if (!p || isServiceProduct(p)) return false;
  if (p.trackInventory === false || p.track_inventory === false) return false;
  if (p.trackInventory === true || p.track_inventory === true) return true;
  const raw = p.trackInventory != null ? p.trackInventory : p.track_inventory;
  return truthy(raw, true);
}

function productFromBody(b = {}, rid) {
  const productType = b.productType || b.product_type || 'Product';
  const isService = String(productType).toLowerCase() === 'service';
  const trackInventory = isService
    ? false
    : (b.trackInventory != null
      ? truthy(b.trackInventory, true)
      : (b.track_inventory != null ? truthy(b.track_inventory, true) : true));
  let images = parseImages(b.images || b.gallery, b.image || b.photo || '');
  // Live products table often has no `image` column — cover lives in `images` jsonb.
  // Cap payload so Vercel/PostgREST does not time out on huge data-URLs.
  while (images.length > 1 && JSON.stringify(images).length > 220000) {
    images = images.slice(0, -1);
  }
  const catalogReady = isWebsiteCatalogReady({
    images,
    description: b.description || '',
    fullDescription: b.fullDescription || b.full_description || '',
  });
  const explicitHide = b.showOnWebsite === false || b.show_on_website === false;
  const showOnWebsite = catalogReady && !explicitHide;
  return {
    id: rid || b.id || '',
    name: b.name || '',
    category: isService ? (b.category || 'Services') : (b.category || ''),
    rate: num(b.rate != null ? b.rate : b.basePrice),
    unit: isService ? 'service' : (b.unit || ''),
    description: b.description || '',
    full_description: b.fullDescription || b.full_description || '',
    status: b.active === false ? 'Inactive' : (b.status || 'Active'),
    product_type: productType,
    designer: isService ? '' : (b.designer || ''),
    stock: isService ? 0 : num(b.stock),
    track_inventory: trackInventory,
    material: isService ? '' : (b.material || ''),
    size: isService ? '' : (b.size || ''),
    min_quantity: isService ? 1 : num(b.minQuantity),
    images,
    sale_price: num(b.salePrice != null ? b.salePrice : b.sale_price),
    show_on_top: showOnWebsite && !!(b.showOnTop || b.show_on_top),
    show_on_website: showOnWebsite,
    variations: Array.isArray(b.variations) ? b.variations : asArray(b.variations),
  };
}

module.exports = {
  isAdminRole,
  userLabel,
  asArray,
  uniqueStrings,
  collectOrderIds,
  parseImages,
  isWebsiteCatalogReady,
  isServiceProduct,
  productTracksInventory,
  invoiceStatusFromPaid,
  hashPortalPassword,
  makePortalPassword,
  checkPortalPassword,
  issueCustomerToken,
  parseCustomerToken,
  sanitizePortalCustomer,
  isBlocked,
  productFromBody,
  stripPhotoFromNotes,
  extractPhotoFromNotes,
  embedPhotoInNotes,
  customerPhoto,
  withCustomerPhoto,
};
