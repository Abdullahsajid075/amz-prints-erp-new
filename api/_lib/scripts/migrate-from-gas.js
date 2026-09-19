/**
 * Copy live GAS (Google Sheets) records into Supabase by the same IDs.
 *
 * Usage (from api/):
 *   GAS_API_URL=https://script.google.com/macros/s/.../exec \
 *   GAS_ADMIN_USER=admin GAS_ADMIN_PASSWORD=yourpass \
 *   node _lib/scripts/migrate-from-gas.js
 *
 * Safe to re-run: upserts overwrite by id. Google Sheet is not deleted.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { supabase } = require('../db');
const { asArray, parseImages } = require('../lib/helpers');

const GAS_API_URL = process.env.GAS_API_URL || process.env.REACT_APP_GAS_API_URL || '';
const GAS_USER = process.env.GAS_ADMIN_USER || process.env.DEFAULT_ADMIN_USER || 'admin';
const GAS_PASS = process.env.GAS_ADMIN_PASSWORD || '';

function unwrap(payload) {
  if (payload == null) return payload;
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object' && payload.data !== undefined && payload._array) return payload.data;
  const { _status, ...rest } = payload;
  if (Array.isArray(rest.data) && Object.keys(rest).length <= 2) return rest.data;
  return rest;
}

async function gasRequest(method, path, { token, data } = {}) {
  const url = new URL(GAS_API_URL);
  url.searchParams.set('path', path);
  let http = method.toUpperCase();
  if (token) url.searchParams.set('token', token);
  if (http !== 'GET' && http !== 'POST') {
    url.searchParams.set('_method', http);
    http = 'POST';
  }
  const res = await fetch(url.toString(), {
    method: http,
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: http === 'GET' ? undefined : JSON.stringify(data || {}),
    redirect: 'follow',
  });
  const text = await res.text();
  let payload;
  try { payload = text ? JSON.parse(text) : {}; } catch {
    throw new Error(`${path}: non-JSON from GAS (${text.slice(0, 80)})`);
  }
  const body = unwrap(payload);
  if (body && body._status >= 400) throw new Error(`${path}: ${body.message || JSON.stringify(body)}`);
  if (body && body.message && (body._status === 401 || /unauthor/i.test(body.message))) {
    throw new Error(`${path}: ${body.message}`);
  }
  return body;
}

async function upsert(table, rows) {
  if (!rows.length) return { table, upserted: 0 };
  const chunk = 40;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await supabase.from(table).upsert(slice, { onConflict: 'id' });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
    console.log(`  ${table}: ${Math.min(i + chunk, rows.length)}/${rows.length}`);
  }
  return { table, upserted: rows.length };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function bool(v, fallback = false) {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(s);
}

const MAP = {
  users: (r) => ({
    id: r.id,
    username: r.username || r.email || '',
    password: r.password || '',
    name: r.name || '',
    role: r.role || 'Admin',
    status: r.status || 'Active',
    permissions: Array.isArray(r.permissions) ? r.permissions : asArray(r.permissions),
    email: r.email || r.username || '',
    employee_id: r.employeeId || r.employee_id || '',
  }),
  customers: (r) => ({
    id: r.id,
    name: r.name || '',
    phone: r.phone || '',
    email: r.email || '',
    address: r.address || '',
    city: r.city || '',
    notes: r.notes || '',
    in_crm: !!r.inCrm,
    stage: r.stage || '',
    stage_updated_at: r.stageUpdatedAt || '',
    notify_whatsapp: r.notifyWhatsApp !== false,
    notify_email: r.notifyEmail !== false,
    customer_code: r.customerCode || r.id || '',
    blocked: !!r.blocked,
    block_reason: r.blockReason || '',
    blocked_at: r.blockedAt || '',
    blocked_by: r.blockedBy || '',
    credit_balance: num(r.creditBalance),
    portal_password: r.portalPassword || r.portal_password || '',
  }),
  products: (r) => {
    const images = parseImages(r.images, r.image || r.photo || '');
    return {
      id: r.id,
      name: r.name || '',
      category: r.category || '',
      rate: num(r.rate != null ? r.rate : r.basePrice),
      unit: r.unit || '',
      description: r.description || '',
      full_description: r.fullDescription || '',
      status: r.status || (r.active === false ? 'Inactive' : 'Active'),
      product_type: r.productType || 'Product',
      designer: r.designer || '',
      stock: num(r.stock),
      material: r.material || '',
      size: r.size || '',
      min_quantity: num(r.minQuantity),
      image: images[0] || '',
      images,
      sale_price: num(r.salePrice),
      show_on_top: !!r.showOnTop,
      show_on_website: r.showOnWebsite !== false,
      variations: Array.isArray(r.variations) ? r.variations : asArray(r.variations),
    };
  },
  orders: (r) => ({
    id: r.id,
    order_id: r.orderId || '',
    date: r.date || '',
    customer_id: r.customerId || '',
    customer_name: r.customerName || '',
    customer_phone: r.customerPhone || '',
    customer_email: r.customerEmail || '',
    customer_address: r.customerAddress || '',
    status: r.status || '',
    delivery_date: r.deliveryDate || '',
    products: Array.isArray(r.products) ? r.products : asArray(r.products),
    total_amount: num(r.totalAmount),
    advance_payment: num(r.advancePayment),
    balance_amount: num(r.balanceAmount),
    remarks: r.remarks || '',
    assigned_designer: r.assignedDesigner || '',
    token_no: r.tokenNo || '',
    doc_type: r.docType || 'Order',
    tracking_number: r.trackingNumber || '',
    status_history: Array.isArray(r.statusHistory) ? r.statusHistory : asArray(r.statusHistory),
    delivery_address: r.deliveryAddress || '',
    quotation_id: r.quotationId || '',
    payment_method: r.paymentMethod || '',
  }),
  invoices: (r) => ({
    id: r.id,
    invoice_no: r.invoiceNumber || r.invoiceNo || '',
    date: r.date || '',
    due_date: r.dueDate || '',
    order_id: r.orderId || '',
    order_ids: Array.isArray(r.orderIds) ? r.orderIds : asArray(r.orderIds || r.orderId),
    customer_id: r.customerId || '',
    customer_name: r.customerName || '',
    customer_phone: r.customerPhone || '',
    customer_email: r.customerEmail || '',
    customer_address: r.customerAddress || '',
    items: Array.isArray(r.items) ? r.items : asArray(r.items),
    subtotal: num(r.subtotal),
    tax_rate: num(r.taxRate),
    tax: num(r.tax),
    discount: num(r.discount),
    previous_balance: num(r.previousBalance),
    total: num(r.totalAmount != null ? r.totalAmount : r.total),
    paid: num(r.paidAmount != null ? r.paidAmount : r.paid),
    status: r.status || '',
    notes: r.notes || '',
    share_token: r.shareToken || '',
    payment_history: Array.isArray(r.paymentHistory) ? r.paymentHistory : asArray(r.paymentHistory),
  }),
  employees: (r) => ({
    id: r.id,
    employee_code: r.employeeCode || '',
    name: r.name || '',
    phone: r.phone || '',
    email: r.email || '',
    cnic: r.cnic || '',
    role: r.role || 'Staff',
    designation: r.designation || '',
    department: r.department || '',
    join_date: r.joinDate || '',
    end_date: r.endDate || '',
    valid_from: r.validFrom || '',
    valid_until: r.validUntil || '',
    salary: num(r.salary),
    status: r.status || 'Active',
    address: r.address || '',
    city: r.city || '',
    emergency_contact: r.emergencyContact || '',
    emergency_phone: r.emergencyPhone || '',
    notes: r.notes || '',
    photo: r.photo || r.image || '',
  }),
  vendors: (r) => ({
    id: r.id,
    name: r.name || '',
    phone: r.phone || '',
    email: r.email || '',
    address: r.address || '',
    notes: r.notes || '',
    contact_person: r.contactPerson || '',
    category: r.category || '',
    payment_terms: r.paymentTerms || '',
    tax_id: r.taxId || '',
  }),
  purchases: (r) => ({
    id: r.id,
    purchase_no: r.poNumber || r.purchaseNo || '',
    date: r.purchaseDate || r.date || '',
    vendor_id: r.vendorId || '',
    vendor_name: r.vendorName || '',
    vendor_invoice_number: r.vendorInvoiceNumber || '',
    expected_delivery_date: r.expectedDeliveryDate || '',
    actual_delivery_date: r.actualDeliveryDate || '',
    linked_order_id: r.linkedOrderId || '',
    items: Array.isArray(r.items) ? r.items : asArray(r.items),
    total: num(r.total != null ? r.total : r.totalAmount),
    paid_amount: num(r.paidAmount != null ? r.paidAmount : r.paid),
    status: r.status || '',
    notes: r.notes || '',
  }),
  expenses: (r) => ({
    id: r.id,
    date: r.date || '',
    category: r.category || '',
    amount: num(r.amount),
    description: r.description || '',
    payment_method: r.paymentMethod || '',
    paid_to: r.paidTo || '',
    notes: r.notes || '',
    approved: bool(r.approved, false) || String(r.status || '').toLowerCase() === 'approved',
    approved_by: r.approvedBy || '',
    approved_at: r.approvedAt || '',
  }),
  payments: (r) => ({
    id: r.id,
    date: r.date || '',
    type: r.type || 'inflow',
    category: r.category || '',
    ref_id: r.refId || '',
    customer_name: r.customerName || r.party || '',
    customer_id: r.customerId || '',
    party_phone: r.partyPhone || '',
    amount: num(r.amount),
    method: r.method || '',
    notes: r.notes || '',
    balance_due: num(r.balanceDue),
    total_amount: num(r.totalAmount),
  }),
  counters: (r) => ({
    id: r.id,
    counter_name: r.counterName || r.name || 'Counter',
    access_holder: r.accessHolder || '',
    prefix: r.prefix || 'T',
    last_number: num(r.lastNumber),
    status: r.status || 'Active',
  }),
  tokens: (r) => ({
    id: r.id,
    token_no: r.tokenNo || '',
    date: r.date || '',
    time: r.time || '',
    customer_id: r.customerId || '',
    customer_name: r.customerName || '',
    customer_phone: r.customerPhone || '',
    service: r.service || '',
    service_note: r.serviceNote || '',
    token_status: r.tokenStatus || 'Waiting',
    called_at: r.calledAt || '',
    order_id: r.orderId || '',
    notes: r.notes || '',
    counter_name: r.counterName || '',
  }),
};

const ENDPOINTS = [
  ['users', '/users'],
  ['customers', '/customers'],
  ['products', '/products'],
  ['employees', '/employees'],
  ['vendors', '/vendors'],
  ['orders', '/orders'],
  ['quotations', '/quotations'],
  ['invoices', '/invoices'],
  ['purchases', '/purchases'],
  ['expenses', '/expenses'],
  ['payments', '/payments'],
  ['counters', '/counters'],
  ['tokens', '/tokens'],
];

async function countTable(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) return { error: error.message };
  return count;
}

async function main() {
  if (!GAS_API_URL) {
    console.error('Set GAS_API_URL to the live Apps Script /exec URL');
    process.exit(1);
  }
  if (!GAS_PASS) {
    console.error('Set GAS_ADMIN_PASSWORD (ERP admin password). Do not delete the Google Sheet.');
    process.exit(1);
  }
  if (!process.env.SUPABASE_URL || !(process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error('Set SUPABASE_URL and SUPABASE_API_KEY in api/.env');
    process.exit(1);
  }

  console.log('Logging into GAS…');
  const login = await gasRequest('POST', '/auth/login', {
    data: { username: GAS_USER, email: GAS_USER, password: GAS_PASS },
  });
  const token = login.token;
  if (!token) {
    console.error('GAS login failed', login);
    process.exit(1);
  }

  const report = [];

  for (const [table, path] of ENDPOINTS) {
    console.log(`Fetch ${path}`);
    const payload = await gasRequest('GET', path, { token });
    let rows = Array.isArray(payload) ? payload : (payload.products || payload.data || []);
    if (!Array.isArray(rows)) rows = [];
    const target = table === 'quotations' ? 'orders' : table;
    const mapper = MAP[target];
    const mapped = rows.map(mapper).filter((r) => r && r.id);
    if (table === 'quotations') {
      mapped.forEach((r) => { r.doc_type = r.doc_type || 'Quotation'; });
    }
    const result = await upsert(target, mapped);
    report.push({ source: path, table: target, gas: rows.length, upserted: result.upserted, supabase: await countTable(target) });
  }

  console.log('Fetch /settings');
  const settings = await gasRequest('GET', '/settings', { token });
  if (settings && typeof settings === 'object') {
    const keys = Object.keys(settings).filter((k) => !k.startsWith('_'));
    for (const key of keys) {
      await supabase.from('settings').upsert({
        key,
        value: settings[key],
        updated_at: new Date().toISOString(),
      });
    }
    report.push({ source: '/settings', table: 'settings', gas: keys.length, upserted: keys.length, supabase: await countTable('settings') });
  }

  console.log('\n=== row counts (do not switch ERP until GAS ≈ Supabase) ===');
  console.table(report);
  console.log('Google Sheet is unchanged. Re-run this script anytime; IDs overwrite.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
