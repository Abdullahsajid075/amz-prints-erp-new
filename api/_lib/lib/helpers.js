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
  return list;
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
    name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    city: c.city || '',
  };
}

function isBlocked(row) {
  if (!row) return false;
  if (row.blocked === true || row.blocked === 1) return true;
  const s = String(row.blocked || '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'blocked';
}

function productFromBody(b = {}, rid) {
  const productType = b.productType || b.product_type || 'Product';
  const isService = String(productType).toLowerCase() === 'service';
  const images = parseImages(b.images || b.gallery, b.image || b.photo || '');
  const showOnWebsite = b.showOnWebsite != null ? truthy(b.showOnWebsite, true) : (b.show_on_website != null ? truthy(b.show_on_website, true) : true);
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
    stock: num(b.stock),
    material: isService ? '' : (b.material || ''),
    size: isService ? '' : (b.size || ''),
    min_quantity: isService ? 1 : num(b.minQuantity),
    image: images[0] || '',
    images,
    sale_price: num(b.salePrice != null ? b.salePrice : b.sale_price),
    show_on_top: !!(b.showOnTop || b.show_on_top),
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
  invoiceStatusFromPaid,
  hashPortalPassword,
  makePortalPassword,
  checkPortalPassword,
  issueCustomerToken,
  parseCustomerToken,
  sanitizePortalCustomer,
  isBlocked,
  productFromBody,
};
