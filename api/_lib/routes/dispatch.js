const { supabase } = require('../db');
const { handleLogin, validateToken, sanitizeUser } = require('../lib/auth');
const { id, today, nowTime, dateKey, num, truthy, send, sendError } = require('../lib/util');
const { websiteCatalogSyncScript } = require('../lib/websiteCatalogSync');
const {
  mapCustomer, mapOrder, mapProduct, mapInvoice, mapEmployee,
  mapVendor, mapPayment, mapExpense, mapPurchase, mapUser, mapToken,
  mapTask, mapBroadcast, mapBroadcastSend,
} = require('../lib/mappers');
const {
  listRows, getRow, insertRow, updateRow, deleteRow, listSends, insertSend,
  taskFromBody, broadcastFromBody, nowIso, id: opsId,
} = require('../lib/opsStore');
const { sendWhatsAppCloud, cloudConfigured } = require('../lib/whatsappCloud');
const {
  isAdminRole, userLabel, collectOrderIds, invoiceStatusFromPaid, asArray, uniqueStrings,
  makePortalPassword, checkPortalPassword, portalPasswordFromRow, issueCustomerToken, parseCustomerToken,
  sanitizePortalCustomer, isBlocked, productFromBody,
  withCustomerPhoto, customerPhoto, isWebsiteCatalogReady, isListedOnWebsite,
  isServiceProduct, productTracksInventory,
} = require('../lib/helpers');
const {
  computeCustomerLedger,
  computeCompanyReceivables,
  computeVendorOutstanding,
  isQuotation,
  isCancelledStatus,
  purchaseOutstanding,
} = require('../lib/ledger');
const {
  INVOICE_REQUIRED_MESSAGE,
  INVOICE_ELIGIBLE_NOTE,
  MANUAL_DELIVER_NOTE,
  RESTORE_NOTE,
  REOPEN_NOTE,
  classifyIncorrectDelivery,
  buildHistoryEntry,
  appendAdminReviewRemark,
  canDeliverOrder,
  isDeliveredStatus,
  isPosOrder,
} = require('../lib/deliveryWorkflow');

function expenseIsApproved(row) {
  if (!row) return false;
  if (row.approved === false) return false;
  const s = String(row.approved ?? row.status ?? '').trim().toLowerCase();
  if (s === 'false' || s === '0' || s === 'no' || s === 'pending' || s === 'rejected') return false;
  return true;
}

function attachCustomerLedger(row, orders, invoices, payments) {
  const api = mapCustomer(row);
  const led = computeCustomerLedger(row, orders || [], invoices || [], payments || []);
  api.outstanding = led.outstanding;
  api.creditBalance = led.creditBalance;
  api.payable = led.payable;
  return api;
}

function missingSchemaColumn(err) {
  const msg = String((err && (err.message || err.details)) || err || '');
  const m = msg.match(/Could not find the '([^']+)' column/i);
  return m ? m[1] : '';
}

function dbErrorMessage(err) {
  return String((err && (err.message || err.details || err.hint || err.code)) || err || '');
}

async function dbWrite(table, row, { mode = 'insert', id: rid } = {}) {
  const payload = { ...row };
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const q = mode === 'update'
      ? supabase.from(table).update(payload).eq('id', rid).select('id')
      : supabase.from(table).insert(payload).select('id');
    const { data, error } = await q;
    if (!error) {
      if (mode === 'update' && rid && (!data || !data.length)) {
        throw new Error('Record not found — nothing was updated');
      }
      return payload;
    }
    const col = missingSchemaColumn(error);
    if (col && Object.prototype.hasOwnProperty.call(payload, col)) {
      delete payload[col];
      continue;
    }
    const msg = dbErrorMessage(error);
    if (/invalid input|malformed json|jsonb|not a valid json/i.test(msg)) {
      let converted = false;
      ['images', 'variations', 'products', 'items', 'permissions', 'status_history', 'payment_history', 'order_ids'].forEach((k) => {
        if (payload[k] != null && typeof payload[k] !== 'string') {
          payload[k] = JSON.stringify(payload[k]);
          converted = true;
        }
      });
      if (converted) continue;
    }
    throw new Error(msg || 'Could not save record');
  }
  throw new Error('Could not save record');
}

function slimProductImages(images) {
  const list = (Array.isArray(images) ? images : []).map((s) => String(s || '').trim()).filter(Boolean);
  const http = list.filter((u) => /^https?:\/\//i.test(u));
  const rest = list.filter((u) => !/^https?:\/\//i.test(u));
  const out = [...http];
  rest.forEach((u) => {
    if (JSON.stringify([...out, u]).length > 160000) return;
    out.push(u);
  });
  return out.slice(0, 5);
}

async function saveProductRow(row, { mode, id: rid } = {}) {
  const payload = { ...row, images: slimProductImages(row.images) };
  try {
    return await dbWrite('products', payload, { mode, id: rid });
  } catch (err) {
    const msg = dbErrorMessage(err);
    if (!/images|payload|too large|timeout|bytes|statement/i.test(msg) && payload.images) {
      throw err;
    }
    const httpOnly = { ...payload, images: (payload.images || []).filter((u) => /^https?:\/\//i.test(String(u))) };
    try {
      return await dbWrite('products', httpOnly, { mode, id: rid });
    } catch (err2) {
      const core = { ...httpOnly };
      delete core.images;
      return dbWrite('products', core, { mode, id: rid });
    }
  }
}

async function dbSelect(table, cols, extraFn) {
  let selectCols = cols;
  let fn = extraFn;
  for (let attempt = 0; attempt < 16; attempt += 1) {
    let q = supabase.from(table).select(selectCols);
    if (typeof fn === 'function') q = fn(q) || q;
    const { data, error } = await q;
    if (!error) return data || [];
    const col = missingSchemaColumn(error);
    if (col) {
      const next = String(selectCols).split(',').map((s) => s.trim()).filter((c) => c && c !== col);
      if (next.length === 0 || next.join(',') === selectCols) {
        selectCols = '*';
        fn = undefined;
        continue;
      }
      selectCols = next.join(',');
      continue;
    }
    if (selectCols !== '*') {
      selectCols = '*';
      fn = undefined;
      continue;
    }
    throw error;
  }
  return [];
}

async function dbSelectSafe(table, cols, extraFn) {
  try {
    return await dbSelect(table, cols, extraFn);
  } catch (err) {
    console.error('dbSelectSafe', table, dbErrorMessage(err));
    return [];
  }
}

function persistIncompleteWebsiteHides(rows) {
  syncWebsiteCatalogFlags(rows).catch((err) => console.error('website catalog sync', dbErrorMessage(err)));
}

/** Website rule: incomplete (no photo/desc) auto-hide. User Off stays Off — never auto-publish. */
async function syncWebsiteCatalogFlags(rows) {
  const list = rows || [];
  const hide = [];
  for (const row of list) {
    const api = mapProduct(row);
    if (!api || !api.id) continue;
    const ready = isWebsiteCatalogReady(api);
    if (!ready && row.show_on_website !== false) hide.push(row.id);
  }
  const writes = hide.slice(0, 80).map((pid) => (
    supabase.from('products').update({ show_on_website: false, show_on_top: false }).eq('id', pid)
  ));
  if (writes.length) {
    await Promise.all(writes).catch((err) => console.error('website catalog sync', dbErrorMessage(err)));
  }
  const hideSet = new Set(hide);
  for (const row of list) {
    if (hideSet.has(row.id)) {
      row.show_on_website = false;
      row.show_on_top = false;
    }
  }
  return { hidden: hide.length, published: list.filter((row) => isListedOnWebsite(mapProduct(row))).length };
}

const LEAN_ORDER_COLS = 'id,order_id,date,created_at,customer_id,customer_phone,customer_name,status,doc_type,total_amount,advance_payment,balance_amount,delivery_date,tracking_number';
const LEAN_INVOICE_COLS = 'id,customer_id,customer_phone,order_id,total,paid,previous_balance,status,invoice_no,date';
/** Live payments table has party_phone, not customer_phone. */
const LEAN_PAYMENT_COLS = 'id,date,type,amount,customer_id,customer_name,party_phone,category,method,notes,ref_id';
/** Live expenses table has approved, not status. */
const LEAN_EXPENSE_COLS = 'id,date,amount,approved,description,category,payment_method,paid_to';
/** Live purchases table has date, not purchase_date. */
const LEAN_PURCHASE_COLS = 'id,date,vendor_id,vendor_name,total,paid_amount,status';

function attachVendorPayables(row, purchases) {
  const api = mapVendor(row);
  api.outstandingBalance = computeVendorOutstanding(row, purchases || []);
  return api;
}

function buildMonthlySales(orders, expenses) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      key,
      month: d.toLocaleString('en-US', { month: 'short' }),
      sales: 0,
      orders: 0,
      expenses: 0,
    });
  }
  const index = Object.fromEntries(months.map((m) => [m.key, m]));
  (orders || []).forEach((o) => {
    if (isQuotation(o) || isCancelledStatus(o.status)) return;
    const key = dateKey(o.date).slice(0, 7);
    if (!index[key]) return;
    index[key].sales += num(o.total_amount);
    index[key].orders += 1;
  });
  (expenses || []).forEach((e) => {
    if (!expenseIsApproved(e)) return;
    const key = dateKey(e.date).slice(0, 7);
    if (!index[key]) return;
    index[key].expenses += num(e.amount);
  });
  return months;
}

async function ensureWalkIn() {
  const { data } = await supabase.from('customers').select('*').eq('id', 'cust_walkin').maybeSingle();
  if (data) return mapCustomer(data);
  const row = {
    id: 'cust_walkin',
    name: 'Walk-in',
    phone: '',
    notes: 'Default POS walk-in customer',
    in_crm: false,
    notify_whatsapp: false,
    notify_email: false,
  };
  await supabase.from('customers').upsert(row);
  return mapCustomer(row);
}

async function getSettingsObject() {
  const { data, error } = await supabase.from('settings').select('key,value');
  if (error) throw error;
  const obj = {};
  (data || []).forEach((r) => { obj[r.key] = r.value; });
  return obj;
}

async function saveSettingsObject(incoming = {}) {
  const keys = Object.keys(incoming).filter((k) => !k.startsWith('_'));
  for (const key of keys) {
    await supabase.from('settings').upsert({
      key,
      value: incoming[key],
      updated_at: new Date().toISOString(),
    });
  }
  return getSettingsObject();
}

function orderFromBody(body = {}, existing = {}) {
  const products = body.products || body.items || existing.products || [];
  const total = num(
    body.totalAmount != null ? body.totalAmount : (body.total != null ? body.total : existing.total_amount),
    0
  );
  const advance = num(body.advancePayment != null ? body.advancePayment : existing.advance_payment, 0);
  return {
    id: body.id || existing.id || id('order'),
    order_id: body.orderId || body.order_id || existing.order_id || '',
    date: body.date || existing.date || today(),
    customer_id: body.customerId || existing.customer_id || '',
    customer_name: body.customerName || existing.customer_name || '',
    customer_phone: body.customerPhone || existing.customer_phone || '',
    customer_email: body.customerEmail || existing.customer_email || '',
    customer_address: body.customerAddress || existing.customer_address || '',
    status: body.status || existing.status || 'Order Received',
    delivery_date: body.deliveryDate || existing.delivery_date || '',
    products: Array.isArray(products) ? products : [],
    total_amount: total,
    advance_payment: advance,
    balance_amount: body.balanceAmount != null ? num(body.balanceAmount) : Math.max(0, total - advance),
    remarks: body.remarks || existing.remarks || '',
    assigned_designer: body.assignedDesigner || existing.assigned_designer || '',
    token_no: body.tokenNo || existing.token_no || '',
    doc_type: body.docType || body.doctype || existing.doc_type || 'Order',
    tracking_number: body.trackingNumber || existing.tracking_number || '',
    status_history: body.statusHistory || existing.status_history || [],
    delivery_address: body.deliveryAddress || existing.delivery_address || '',
    quotation_id: body.quotationId || existing.quotation_id || '',
    payment_method: body.paymentMethod || existing.payment_method || '',
  };
}

function assertCustomerNotBlocked(row) {
  if (!row || String(row.id) === 'cust_walkin') return;
  if (isBlocked(row)) {
    throw new Error('Customer is blocked: ' + (row.block_reason || 'Contact Admin to unblock.'));
  }
}

async function loadCustomer(cid) {
  if (!cid) return null;
  const { data } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
  return data || null;
}

function isStockTrackedLine(p) {
  if (!p) return false;
  if (String(p.productId || p.product_id || '').startsWith('calc_')) return false;
  return productTracksInventory(p);
}

function collectLineQtys(lines) {
  const list = [];
  (Array.isArray(lines) ? lines : []).forEach((p) => {
    if (!isStockTrackedLine(p)) return;
    const qty = num(p.quantity);
    if (!(qty > 0)) return;
    list.push({
      id: String(p.productId || p.product_id || '').trim(),
      variationId: String(p.variationId || p.variation_id || '').trim(),
      name: String(p.name || '').trim().toLowerCase(),
      qty,
    });
  });
  return list;
}

async function loadInventoryPolicy() {
  try {
    const s = await getSettingsObject();
    const inv = s.inventory && typeof s.inventory === 'object' ? s.inventory : {};
    const prod = s.products && typeof s.products === 'object' ? s.products : {};
    return {
      track: inv.trackStock != null ? !!inv.trackStock : prod.trackStock !== false,
      allowNeg: !!(inv.allowNegativeStock ?? prod.allowNegativeStock),
    };
  } catch {
    return { track: true, allowNeg: false };
  }
}

function annotateBackorders(lines, catalogRows = []) {
  const rows = Array.isArray(catalogRows) ? catalogRows : [];
  const findRow = (line) => {
    const pid = String(line.productId || line.product_id || '').trim();
    if (pid) {
      const byId = rows.find((r) => String(r.id) === pid);
      if (byId) return byId;
    }
    const name = String(line.name || '').trim().toLowerCase();
    if (!name) return null;
    return rows.find((r) => String(r.name || '').trim().toLowerCase() === name) || null;
  };
  return (Array.isArray(lines) ? lines : []).map((line) => {
    const row = findRow(line);
    if (!row || isServiceProduct(row) || !productTracksInventory(row)) {
      return { ...line, backorder: 0 };
    }
    const variationId = String(line.variationId || line.variation_id || '').trim();
    let have = num(row.stock);
    if (variationId && Array.isArray(row.variations)) {
      const found = row.variations.find((v) => String(v.id) === variationId);
      if (found && found.stock != null && found.stock !== '') have = num(found.stock);
    }
    const qty = num(line.quantity);
    const backorder = have <= 0 ? qty : Math.max(0, qty - have);
    return { ...line, backorder };
  });
}

/** Apply stock change: selling more (new > old) decreases on-hand. */
async function syncProductStock(oldLines, newLines, opts = {}) {
  const policy = await loadInventoryPolicy();
  if (!policy.track) return;
  const catalog = await dbSelectSafe('products', 'id,name,stock,product_type,category,track_inventory,variations');
  const rows = catalog || [];
  const findRow = (line) => {
    if (line.id) {
      const byId = rows.find((r) => String(r.id) === line.id);
      if (byId) return byId;
    }
    if (line.name) {
      return rows.find((r) => String(r.name || '').trim().toLowerCase() === line.name);
    }
    return null;
  };
  const oldMap = new Map();
  collectLineQtys(oldLines).forEach((line) => {
    const row = findRow(line);
    if (!row) return;
    oldMap.set(row.id, (oldMap.get(row.id) || 0) + line.qty);
  });
  const newMap = new Map();
  collectLineQtys(newLines).forEach((line) => {
    const row = findRow(line);
    if (!row) return;
    newMap.set(row.id, (newMap.get(row.id) || 0) + line.qty);
  });
  const ids = new Set([...oldMap.keys(), ...newMap.keys()]);
  for (const pid of ids) {
    const delta = (newMap.get(pid) || 0) - (oldMap.get(pid) || 0);
    if (!delta) continue;
    const row = rows.find((r) => r.id === pid);
    if (!row || !productTracksInventory(row) || isServiceProduct(row)) continue;
    const have = num(row.stock);
    const next = have - delta;
    if (delta > 0 && next < -0.0001 && !policy.allowNeg && !opts.allowShortage) {
      throw new Error(`Insufficient stock for ${row.name || 'item'}: available ${have}, required ${delta}`);
    }
    const stored = policy.allowNeg ? next : Math.max(0, next);
    const { error } = await supabase.from('products').update({ stock: stored }).eq('id', pid);
    if (error) throw error;
    row.stock = stored;
  }

  const varDelta = new Map();
  collectLineQtys(oldLines).forEach((line) => {
    if (!line.variationId) return;
    const key = `${line.id}::${line.variationId}`;
    varDelta.set(key, (varDelta.get(key) || 0) - line.qty);
  });
  collectLineQtys(newLines).forEach((line) => {
    if (!line.variationId) return;
    const key = `${line.id}::${line.variationId}`;
    varDelta.set(key, (varDelta.get(key) || 0) + line.qty);
  });
  for (const [key, delta] of varDelta.entries()) {
    if (!delta) continue;
    const [pid, variationId] = key.split('::');
    const row = rows.find((r) => r.id === pid);
    if (!row) continue;
    const variations = Array.isArray(row.variations) ? row.variations.map((v) => ({ ...v })) : [];
    const idx = variations.findIndex((v) => String(v.id) === String(variationId));
    if (idx < 0) continue;
    const have = num(variations[idx].stock);
    variations[idx].stock = Math.max(0, have - delta);
    await supabase.from('products').update({ variations }).eq('id', pid);
  }
}

async function persistOrderStock(row, { isPos = false, oldLines = [] } = {}) {
  if (isPos) {
    await syncProductStock(oldLines, row.products, { allowShortage: false });
    return;
  }
  const catalog = await dbSelectSafe('products', 'id,name,stock,product_type,category,track_inventory,variations');
  row.products = annotateBackorders(row.products, catalog || []);
  await syncProductStock(oldLines, row.products, { allowShortage: true });
}

async function withInvoiceMeta(apiOrder) {
  if (!apiOrder) return apiOrder;
  const { data: invoices } = await supabase.from('invoices').select('*');
  const keys = [apiOrder.orderId, apiOrder.id].filter(Boolean).map(String);
  const inv = (invoices || []).find((row) => {
    const ids = collectOrderIds({}, row);
    return keys.some((k) => ids.includes(k) || String(row.order_id) === k);
  });
  if (inv) {
    apiOrder.invoiceId = inv.id || '';
    apiOrder.invoiceNumber = inv.invoice_no || '';
    apiOrder.shareToken = inv.share_token || '';
  } else {
    apiOrder.invoiceId = '';
    apiOrder.invoiceNumber = '';
    apiOrder.shareToken = '';
  }
  return apiOrder;
}

async function markOrdersEligibleForDelivery(invoice, user) {
  if (!invoice) return;
  const ids = collectOrderIds({}, invoice);
  for (const key of ids) {
    if (!key) continue;
    const order = await loadOrderByRef(key);
    if (!order || isCancelledStatus(order.status)) continue;
    const hist = Array.isArray(order.status_history) ? [...order.status_history] : [];
    const already = hist.some((h) => String(h.note || '') === INVOICE_ELIGIBLE_NOTE);
    if (already) continue;
    hist.push(buildHistoryEntry({
      status: order.status,
      at: `${today()} ${nowTime()}`,
      note: INVOICE_ELIGIBLE_NOTE,
      previousStatus: order.status,
      by: userLabel(user),
      process: 'invoice',
    }));
    await supabase.from('orders').update({ status_history: hist }).eq('id', order.id);
  }
}

async function confirmManualDelivery(order, user) {
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (isPosOrder(order)) {
    return order;
  }
  const holder = await findInvoiceHoldingOrder(order);
  const gate = canDeliverOrder({
    hasInvoice: !!holder,
    status: order.status,
    docType: order.doc_type,
    remarks: order.remarks,
  });
  if (!gate.ok) {
    throw Object.assign(new Error(gate.message || INVOICE_REQUIRED_MESSAGE), { statusCode: 400 });
  }
  if (gate.already) return order;
  const hist = Array.isArray(order.status_history) ? [...order.status_history] : [];
  const at = `${today()} ${nowTime()}`;
  hist.push(buildHistoryEntry({
    status: 'Delivered',
    at,
    note: MANUAL_DELIVER_NOTE,
    previousStatus: order.status,
    by: userLabel(user),
    process: 'manual-delivery',
  }));
  hist.push(buildHistoryEntry({
    status: 'Closed',
    at,
    note: 'Closed after delivery',
    previousStatus: 'Delivered',
    by: userLabel(user),
    process: 'manual-delivery',
  }));
  await supabase.from('orders').update({ status: 'Delivered', status_history: hist }).eq('id', order.id);
  const { data } = await supabase.from('orders').select('*').eq('id', order.id).maybeSingle();
  return data || { ...order, status: 'Delivered', status_history: hist };
}

async function restoreIncorrectDeliveries(user) {
  const fs = require('fs');
  const path = require('path');
  const { data: orders } = await supabase.from('orders').select('*');
  const { data: invoices } = await supabase.from('invoices').select('id,order_id,order_ids');
  const backup = [];
  for (const order of (orders || [])) {
    if (!isDeliveredStatus(order.status) && !/^delivered$/i.test(String(order.status))) continue;
    const keys = [order.order_id, order.id].filter(Boolean).map(String);
    const hasInvoice = (invoices || []).some((inv) => {
      const ids = collectOrderIds({}, inv).map(String);
      return keys.some((k) => ids.includes(k) || String(inv.order_id) === k);
    });
    const decision = classifyIncorrectDelivery(order, { hasInvoice });
    backup.push({
      id: order.id,
      orderId: order.order_id,
      status: order.status,
      remarks: order.remarks || '',
      status_history: order.status_history,
      hasInvoice,
      decision,
    });
  }
  try {
    const dir = path.join(__dirname, '../../../.restore-backups');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `orders-delivery-${Date.now()}.json`), JSON.stringify({
      at: new Date().toISOString(),
      by: userLabel(user) || 'system',
      backup,
    }));
  } catch (err) {
    console.error('restore backup write failed', err.message);
  }

  const restored = [];
  const flagged = [];
  const skipped = [];
  for (const snapshot of backup) {
    const order = (orders || []).find((o) => o.id === snapshot.id);
    const decision = snapshot.decision;
    if (!order || decision.action === 'skip' || decision.action === 'keep') {
      skipped.push({ id: snapshot.id, orderId: snapshot.orderId, reason: decision.reason });
      continue;
    }
    const hist = Array.isArray(order.status_history) ? [...order.status_history] : [];
    const at = `${today()} ${nowTime()}`;
    if (decision.action === 'restore' || decision.action === 'reopen-ready') {
      const nextStatus = decision.restoreTo || 'Ready';
      hist.push(buildHistoryEntry({
        status: nextStatus,
        at,
        note: decision.action === 'reopen-ready' ? REOPEN_NOTE : RESTORE_NOTE,
        previousStatus: order.status,
        by: userLabel(user) || 'system',
        process: 'restore-auto-delivery',
      }));
      await supabase.from('orders').update({
        status: nextStatus,
        status_history: hist,
      }).eq('id', order.id);
      restored.push({
        id: order.id,
        orderId: order.order_id,
        from: order.status,
        to: nextStatus,
        reason: decision.reason,
        invoiceRequired: !!decision.invoiceRequired,
      });
      continue;
    }
    if (decision.action === 'flag') {
      const remarks = appendAdminReviewRemark(order.remarks, decision.reason);
      hist.push(buildHistoryEntry({
        status: order.status,
        at,
        note: `${decision.reason === 'genuine-no-invoice' ? 'Genuine delivery preserved' : 'ADMIN REVIEW'}: ${decision.reason}`,
        previousStatus: order.status,
        by: userLabel(user) || 'system',
        process: 'restore-auto-delivery',
      }));
      await supabase.from('orders').update({ remarks, status_history: hist }).eq('id', order.id);
      flagged.push({
        id: order.id,
        orderId: order.order_id,
        status: order.status,
        reason: decision.reason,
        previousStatus: decision.previousStatus || '',
        kept: true,
      });
    }
  }
  return { backupCount: backup.length, restored, flagged, skipped: skipped.length };
}

async function findOpenInvoiceForCustomer(order) {
  const cid = String(order.customer_id || '');
  const phone = String(order.customer_phone || '').replace(/\D/g, '').slice(-10);
  if (!cid && !phone) return null;
  const { data: invoices } = await supabase.from('invoices').select('*');
  const open = (invoices || []).filter((inv) => {
    if (!(invoiceRemaining(inv) > 0.009)) return false;
    if (cid && String(inv.customer_id || '') === cid) return true;
    const p = String(inv.customer_phone || '').replace(/\D/g, '').slice(-10);
    return !!(phone && p && phone === p);
  });
  if (!open.length) return null;
  open.sort((a, b) => String(a.date || a.created_at || '').localeCompare(String(b.date || b.created_at || '')));
  return open[0];
}

async function findOrCreateInvoiceForOrder(order) {
  const holder = await findInvoiceHoldingOrder(order);
  if (holder) return holder;
  const open = await findOpenInvoiceForCustomer(order);
  if (open) return addOrderOntoInvoice(open, order);
  const { data: invoices } = await supabase.from('invoices').select('*');
  const keys = [order.order_id, order.id].filter(Boolean).map(String);
  const existing = (invoices || []).find((row) => {
    const ids = collectOrderIds({}, row);
    return keys.some((k) => ids.includes(k) || String(row.order_id) === k);
  });
  if (existing) return existing;
  const total = num(order.total_amount);
  const row = {
    id: id('inv'),
    invoice_no: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    date: order.date || today(),
    due_date: '',
    order_id: order.order_id || order.id,
    order_ids: [order.order_id || order.id].filter(Boolean),
    customer_id: order.customer_id || '',
    customer_name: order.customer_name || '',
    customer_phone: order.customer_phone || '',
    customer_email: order.customer_email || '',
    customer_address: order.customer_address || '',
    items: Array.isArray(order.products) ? order.products : [],
    subtotal: total,
    tax_rate: 0,
    tax: 0,
    discount: 0,
    previous_balance: 0,
    total,
    paid: 0,
    status: invoiceStatusFromPaid(total, 0),
    notes: '',
    share_token: `share_${Date.now().toString(36)}`,
    payment_history: [],
  };
  await supabase.from('invoices').insert(row);
  await markOrdersEligibleForDelivery(row);
  return row;
}

async function allocateAdvanceOntoInvoice(order, invoice) {
  const advance = num(order.advance_payment);
  const paid = num(invoice.paid);
  const need = Math.max(0, advance - paid);
  if (!(need > 0.009)) return invoice;
  const history = Array.isArray(invoice.payment_history) ? invoice.payment_history : [];
  const already = history.some((h) => /advance/i.test(String(h.notes || '')) && num(h.amount) === need);
  if (already) return invoice;
  const result = await recordInvoicePayment(invoice.id, {
    amount: need,
    method: 'Cash',
    notes: `Advance allocated from order ${order.order_id || order.id}`,
    orderId: order.order_id || order.id,
    skipOrderSnapshot: true,
  });
  return result.invoice ? {
    ...invoice,
    id: result.invoice.id || invoice.id,
    paid: result.invoice.paidAmount != null ? result.invoice.paidAmount : (paid + need),
    invoice_no: result.invoice.invoiceNumber || invoice.invoice_no,
  } : invoice;
}

async function ensureOrderInvoice(order) {
  const invoice = await findOrCreateInvoiceForOrder(order);
  const afterAdvance = await allocateAdvanceOntoInvoice(order, invoice);
  if (order.customer_id) {
    const cust = await loadCustomer(order.customer_id);
    if (cust && num(cust.credit_balance) > 0.009) {
      await applyExistingCreditToInvoices(cust);
      const { data: refreshed } = await supabase.from('invoices').select('*').eq('id', (afterAdvance && afterAdvance.id) || invoice.id).maybeSingle();
      return refreshed || afterAdvance;
    }
  }
  await markOrdersEligibleForDelivery(afterAdvance);
  return afterAdvance;
}

function invoiceRemaining(inv) {
  if (!inv || isCancelledStatus(inv.status)) return 0;
  return Math.max(0, num(inv.total != null ? inv.total : inv.total_amount) + num(inv.previous_balance) - num(inv.paid));
}

async function syncLinkedOrderBalances(invoice) {
  if (!invoice) return null;
  const ids = collectOrderIds({}, invoice);
  const due = invoiceRemaining(invoice);
  let first = null;
  for (const key of ids) {
    if (!key) continue;
    let { data: order } = await supabase.from('orders').select('*').eq('id', key).maybeSingle();
    if (!order) {
      const { data: byCode } = await supabase.from('orders').select('*').eq('order_id', key).maybeSingle();
      order = byCode;
    }
    if (!order) continue;
    const total = num(order.total_amount);
    const nextBal = ids.length <= 1 ? due : Math.min(due, Math.max(0, total - num(order.advance_payment)));
    await supabase.from('orders').update({
      balance_amount: nextBal,
      advance_payment: Math.max(0, total - nextBal),
    }).eq('id', order.id);
    if (!first) {
      const { data: refreshed } = await supabase.from('orders').select('*').eq('id', order.id).maybeSingle();
      first = refreshed;
    }
  }
  return first;
}

async function findInvoiceForCustomerRef(customer, ref) {
  const raw = String(ref || '').trim();
  if (!raw) return null;
  const tryOne = async (col, val) => {
    const { data } = await supabase.from('invoices').select('*').eq(col, val).maybeSingle();
    return data || null;
  };
  if (/^inv/i.test(raw) || raw.startsWith('invoice_')) {
    return (await tryOne('invoice_no', raw)) || (await tryOne('id', raw));
  }
  if (/^ord/i.test(raw) || raw.startsWith('order_')) {
    const { data: byOrder } = await supabase.from('invoices').select('*').eq('order_id', raw);
    const match = (byOrder || []).find((inv) => String(inv.customer_id) === String(customer.id)) || (byOrder || [])[0];
    if (match) return match;
    return (await tryOne('order_id', raw));
  }
  return (await tryOne('invoice_no', raw)) || (await tryOne('id', raw));
}

async function listOpenInvoicesForCustomer(customerId) {
  const { data } = await supabase.from('invoices').select('*').eq('customer_id', customerId);
  return (data || [])
    .filter((inv) => invoiceRemaining(inv) > 0.009)
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
}

async function applyExistingCreditToInvoices(customer) {
  let credit = num(customer.credit_balance);
  if (!(credit > 0.009)) return { applied: 0, creditAfter: credit, invoices: [] };
  const open = await listOpenInvoicesForCustomer(customer.id);
  if (!open.length) return { applied: 0, creditAfter: credit, invoices: [] };
  const touched = [];
  for (const inv of open) {
    if (!(credit > 0.009)) break;
    const due = invoiceRemaining(inv);
    const use = Math.min(credit, due);
    if (!(use > 0)) continue;
    const history = Array.isArray(inv.payment_history) ? [...inv.payment_history] : [];
    history.push({
      id: id('pay'),
      date: today(),
      amount: use,
      applied: use,
      extra: 0,
      method: 'Advance',
      notes: 'Allocated from customer credit / portal payment',
      locked: true,
    });
    const paidAfter = num(inv.paid) + use;
    await supabase.from('invoices').update({
      paid: paidAfter,
      status: invoiceStatusFromPaid(num(inv.total != null ? inv.total : inv.total_amount), paidAfter),
      payment_history: history,
    }).eq('id', inv.id);
    await syncLinkedOrderBalances({ ...inv, paid: paidAfter });
    credit = Math.max(0, credit - use);
    touched.push({ invoiceId: inv.id, invoiceNo: inv.invoice_no, allocated: use });
  }
  await supabase.from('customers').update({ credit_balance: credit }).eq('id', customer.id);
  const { data: creditPays } = await supabase.from('payments')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('category', 'Customer Credit');
  let leftover = credit;
  for (const pay of (creditPays || []).sort((a, b) => String(b.date).localeCompare(String(a.date)))) {
    const have = num(pay.balance_due != null ? pay.balance_due : pay.amount);
    if (!(have > 0.009)) continue;
    const keep = Math.min(have, leftover);
    leftover = Math.max(0, leftover - keep);
    await supabase.from('payments').update({
      balance_due: keep,
      notes: keep > 0.009
        ? (pay.notes || 'Unallocated customer payment')
        : `${pay.notes || 'Customer payment'} · applied to invoice`,
      category: keep > 0.009 ? pay.category : 'Invoice Payment',
      ref_id: keep > 0.009 ? pay.ref_id : (touched[0]?.invoiceNo || pay.ref_id),
    }).eq('id', pay.id);
  }
  return { applied: num(customer.credit_balance) - credit, creditAfter: credit, invoices: touched };
}

function orderLinesForInvoice(order) {
  const products = Array.isArray(order.products) ? order.products : asArray(order.products);
  const oid = order.order_id || order.id;
  return products.map((p) => ({
    productId: p.productId || p.product_id || '',
    name: p.name || '',
    quantity: num(p.quantity) || 1,
    rate: num(p.rate),
    size: p.size || '',
    material: p.material || '',
    description: p.description || p.notes || '',
    notes: p.description || p.notes || '',
    productType: p.productType || p.product_type || 'Product',
    sourceOrderId: oid,
  }));
}

async function loadOrderByRef(ref) {
  const key = String(ref || '').trim();
  if (!key) return null;
  let { data: order } = await supabase.from('orders').select('*').eq('id', key).maybeSingle();
  if (!order) {
    const { data: byCode } = await supabase.from('orders').select('*').eq('order_id', key).maybeSingle();
    order = byCode;
  }
  return order || null;
}

async function findInvoiceHoldingOrder(order, exceptId = '') {
  const keys = [order.order_id, order.id].filter(Boolean).map(String);
  const { data: invoices } = await supabase.from('invoices').select('*');
  return (invoices || []).find((inv) => {
    if (exceptId && String(inv.id) === String(exceptId)) return false;
    const ids = collectOrderIds({}, inv).map(String);
    return keys.some((k) => ids.includes(k) || String(inv.order_id) === k);
  }) || null;
}

async function assertOrderCanBeDelivered(order) {
  if (isPosOrder(order)) return true;
  if (await findInvoiceHoldingOrder(order)) return true;
  throw Object.assign(new Error(INVOICE_REQUIRED_MESSAGE), { statusCode: 400 });
}

async function addOrderOntoInvoice(invoice, order) {
  const oid = order.order_id || order.id;
  const existingIds = collectOrderIds({}, invoice).map(String);
  if (existingIds.includes(String(oid)) || existingIds.includes(String(order.id))) {
    return invoice;
  }
  const items = [...asArray(invoice.items), ...orderLinesForInvoice(order)];
  const addTotal = num(order.total_amount);
  const nextSub = num(invoice.subtotal) + addTotal;
  const nextTotal = num(invoice.total != null ? invoice.total : invoice.total_amount) + addTotal;
  const nextIds = uniqueStrings([...existingIds, oid]);
  await supabase.from('invoices').update({
    items,
    subtotal: nextSub,
    total: nextTotal,
    order_id: nextIds[0] || invoice.order_id,
    order_ids: nextIds,
    customer_id: invoice.customer_id || order.customer_id,
    customer_name: invoice.customer_name || order.customer_name,
    customer_phone: invoice.customer_phone || order.customer_phone,
    status: invoiceStatusFromPaid(nextTotal + num(invoice.previous_balance), num(invoice.paid)),
  }).eq('id', invoice.id);
  const { data: refreshed } = await supabase.from('invoices').select('*').eq('id', invoice.id).maybeSingle();
  const afterAdvance = await allocateAdvanceOntoInvoice(order, refreshed || invoice);
  const { data: latest } = await supabase.from('invoices').select('*').eq('id', invoice.id).maybeSingle();
  const finalInv = latest || afterAdvance || refreshed || invoice;
  await syncLinkedOrderBalances(finalInv);
  await markOrdersEligibleForDelivery(finalInv);
  return finalInv;
}

async function combineOpenInvoices(ids) {
  const rows = [];
  for (const raw of ids) {
    const { data } = await supabase.from('invoices').select('*').eq('id', raw).maybeSingle();
    if (data) rows.push(data);
  }
  if (rows.length < 2) throw new Error('Select at least two open invoices');
  const cid = String(rows[0].customer_id || '');
  const phone = String(rows[0].customer_phone || '').replace(/\D/g, '').slice(-10);
  const sameCustomer = rows.every((r) => {
    if (cid && String(r.customer_id || '') === cid) return true;
    const p = String(r.customer_phone || '').replace(/\D/g, '').slice(-10);
    return !!(phone && p && phone === p);
  });
  if (!sameCustomer) {
    throw new Error('Only invoices of the same customer can be combined');
  }
  const open = rows.filter((r) => invoiceRemaining(r) > 0.009);
  if (open.length < 2) throw new Error('Select open (unpaid / partial) invoices only');
  const target = open.slice().sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))[0];
  const sources = open.filter((r) => r.id !== target.id);
  const allIds = uniqueStrings(open.flatMap((r) => collectOrderIds({}, r)));
  const allItems = open.flatMap((r) => asArray(r.items));
  const total = open.reduce((s, r) => s + num(r.total != null ? r.total : r.total_amount), 0);
  const subtotal = open.reduce((s, r) => s + num(r.subtotal != null ? r.subtotal : r.total), 0);
  const paid = open.reduce((s, r) => s + num(r.paid), 0);
  const history = open.flatMap((r) => (Array.isArray(r.payment_history) ? r.payment_history : []));
  const prev = num(target.previous_balance);
  await supabase.from('invoices').update({
    items: allItems,
    order_ids: allIds,
    order_id: allIds[0] || target.order_id,
    subtotal,
    total,
    paid,
    previous_balance: prev,
    payment_history: history,
    status: invoiceStatusFromPaid(total + prev, paid),
    notes: `${target.notes || ''}${sources.length ? ` | Combined ${sources.map((s) => s.invoice_no).join(', ')}` : ''}`.trim(),
  }).eq('id', target.id);
  for (const src of sources) {
    await supabase.from('invoices').delete().eq('id', src.id);
  }
  const { data } = await supabase.from('invoices').select('*').eq('id', target.id).maybeSingle();
  await syncLinkedOrderBalances(data);
  await markOrdersEligibleForDelivery(data);
  return data;
}

async function applyCustomerReceipt(customer, body = {}, user) {
  const amount = num(body.amount);
  if (!(amount > 0)) throw new Error('Enter a valid payment amount');
  const ref = body.invoiceId || body.invoice_id || body.linkedInvoiceId
    || body.linkedOrderId || body.orderId || body.order_id || body.reference || '';
  const target = await findInvoiceForCustomerRef(customer, ref);
  const queue = [];
  if (target && invoiceRemaining(target) > 0.009) queue.push(target);
  else {
    const open = await listOpenInvoicesForCustomer(customer.id);
    queue.push(...open);
  }
  let left = amount;
  const applied = [];
  for (const inv of queue) {
    if (left <= 0.009) break;
    const due = invoiceRemaining(inv);
    const use = Math.min(left, due);
    if (!(use > 0)) continue;
    const result = await recordInvoicePayment(inv.id, { ...body, amount: use }, user);
    applied.push(result);
    left = Math.max(0, left - use);
  }
  if (left <= 0.009) {
    const { data: fresh } = await supabase.from('customers').select('*').eq('id', customer.id).maybeSingle();
    return {
      customer: attachCustomerLedger(fresh || customer, [], applied.map((a) => a.invoice).filter(Boolean), applied.map((a) => a.payment).filter(Boolean)),
      payment: applied[0]?.payment || null,
      invoice: applied[0]?.invoice || null,
      applied: amount,
      extra: 0,
      allocations: applied.map((a) => ({
        invoiceId: a.invoice?.id,
        invoiceNo: a.invoice?.invoiceNumber || a.invoice?.invoiceNo,
        allocated: a.applied,
      })),
    };
  }
  const { data: latest } = await supabase.from('customers').select('*').eq('id', customer.id).maybeSingle();
  const creditAfter = num(latest?.credit_balance) + left;
  await supabase.from('customers').update({ credit_balance: creditAfter }).eq('id', customer.id);
  const payRow = {
    id: id('pay'),
    date: body.date || today(),
    type: 'inflow',
    category: 'Customer Credit',
    ref_id: customer.id,
    customer_name: customer.name,
    customer_id: customer.id,
    party_phone: customer.phone,
    amount: left,
    method: body.method || 'Cash',
    notes: body.notes || 'Unallocated customer payment',
    balance_due: left,
    total_amount: left,
  };
  await supabase.from('payments').insert(payRow);
  return {
    customer: mapCustomer({ ...(latest || customer), credit_balance: creditAfter }),
    payment: applied[0]?.payment || mapPayment(payRow),
    invoice: applied[0]?.invoice || null,
    applied: amount - left,
    extra: left,
    unallocated: left > 0.009,
    allocations: applied.map((a) => ({
      invoiceId: a.invoice?.id,
      invoiceNo: a.invoice?.invoiceNumber || a.invoice?.invoiceNo,
      allocated: a.applied,
    })),
  };
}

async function recordInvoicePayment(invoiceId, body = {}, user) {
  const amount = num(body.amount);
  if (!(amount > 0)) throw new Error('Enter a valid payment amount');
  let { data: inv } = await supabase.from('invoices').select('*').eq('id', invoiceId).maybeSingle();
  if (!inv) {
    const { data: byNo } = await supabase.from('invoices').select('*').eq('invoice_no', invoiceId).maybeSingle();
    inv = byNo;
  }
  if (!inv) throw new Error('Invoice not found');
  const totalDue = num(inv.total);
  const paidBefore = num(inv.paid);
  const balanceBefore = Math.max(0, totalDue - paidBefore);
  const applied = Math.min(amount, balanceBefore);
  const extra = Math.max(0, amount - applied);
  const paidAfter = paidBefore + applied;
  const balanceAfter = Math.max(0, totalDue - paidAfter);
  const payDate = body.date || today();
  const history = Array.isArray(inv.payment_history) ? [...inv.payment_history] : [];
  const payId = id('pay');
  history.push({
    id: payId,
    date: payDate,
    amount,
    applied,
    extra,
    method: body.method || 'Cash',
    notes: body.notes || '',
    locked: true,
  });
  const status = invoiceStatusFromPaid(totalDue, paidAfter);
  await supabase.from('invoices').update({
    paid: paidAfter,
    status,
    payment_history: history,
  }).eq('id', inv.id);

  const paymentRow = {
    id: payId,
    date: payDate,
    type: 'inflow',
    category: 'Invoice Payment',
    ref_id: inv.invoice_no || inv.id,
    customer_name: inv.customer_name || '',
    customer_id: inv.customer_id || '',
    party_phone: inv.customer_phone || '',
    amount,
    method: body.method || 'Cash',
    notes: body.notes || (`Invoice payment — ${inv.invoice_no || inv.id}`),
    balance_due: balanceAfter,
    total_amount: totalDue,
  };
  await supabase.from('payments').insert(paymentRow);

  const { data: invPaid } = await supabase.from('invoices').select('*').eq('id', inv.id).maybeSingle();
  const linkedOrder = await syncLinkedOrderBalances(invPaid || { ...inv, paid: paidAfter });

  if (extra > 0 && inv.customer_id) {
    const cust = await loadCustomer(inv.customer_id);
    if (cust) {
      await supabase.from('customers').update({
        credit_balance: num(cust.credit_balance) + extra,
      }).eq('id', cust.id);
    }
  }

  const { data: invAfter } = await supabase.from('invoices').select('*').eq('id', inv.id).maybeSingle();
  return {
    invoice: mapInvoice(invAfter),
    payment: mapPayment(paymentRow),
    order: linkedOrder ? await withInvoiceMeta(mapOrder(linkedOrder)) : null,
    applied,
    extra,
    recordedBy: userLabel(user),
  };
}

async function nextOrderId(prefix = 'ORD') {
  return bumpDocumentSeq(`seq_${String(prefix).toLowerCase()}`, prefix, 4);
}

async function nextTrackingNumber() {
  return bumpDocumentSeq('seq_trk', 'TRK', 5);
}

async function bumpDocumentSeq(seqId, prefix, pad) {
  const { data: counter } = await supabase.from('counters').select('*').eq('id', seqId).maybeSingle();
  let last = num(counter && counter.last_number);
  if (!counter) {
    const col = prefix === 'TRK' ? 'tracking_number' : 'order_id';
    const { data: rows } = await supabase.from('orders').select(col).limit(2000);
    (rows || []).forEach((r) => {
      const m = String(r[col] || '').match(/(\d+)\s*$/);
      if (m) last = Math.max(last, Number(m[1]));
    });
    await supabase.from('counters').upsert({
      id: seqId,
      counter_name: seqId,
      prefix,
      last_number: last,
      status: 'Active',
    });
  }
  const next = last + 1;
  await supabase.from('counters').update({ last_number: next }).eq('id', seqId);
  return `${prefix}-${String(next).padStart(pad, '0')}`;
}

async function applyCustomerAdvance({ customerId, amount, orderId, invoiceId, invoiceNo, method, notes, date }) {
  const applied = num(amount);
  if (!(applied > 0) || !customerId) return { applied: 0, creditAfter: 0 };
  const cust = await loadCustomer(customerId);
  if (!cust) return { applied: 0, creditAfter: 0 };
  const available = num(cust.credit_balance);
  const use = Math.min(applied, available);
  if (!(use > 0)) return { applied: 0, creditAfter: available };
  const creditAfter = Math.max(0, available - use);
  await supabase.from('customers').update({ credit_balance: creditAfter }).eq('id', cust.id);
  const ref = invoiceId || orderId || cust.id;
  const { data: dup } = await supabase.from('payments')
    .select('id')
    .eq('ref_id', ref)
    .eq('category', 'Advance Applied')
    .eq('amount', use)
    .limit(1);
  if (dup && dup.length) {
    return { applied: use, creditAfter, payment: null, duplicate: true };
  }
  const payRow = {
    id: id('pay'),
    date: date || today(),
    type: 'adjustment',
    category: 'Advance Applied',
    ref_id: ref,
    customer_name: cust.name,
    customer_id: cust.id,
    party_phone: cust.phone,
    amount: use,
    method: method || 'Advance',
    notes: notes || `Advance applied${invoiceNo ? ` to ${invoiceNo}` : ''}${orderId ? ` / ${orderId}` : ''}`,
    balance_due: 0,
    total_amount: use,
  };
  await supabase.from('payments').insert(payRow);
  return { applied: use, creditAfter, payment: mapPayment(payRow) };
}

async function upsertCustomerFromOrder(body) {
  const phone = String(body.customerPhone || '').trim();
  const name = String(body.customerName || '').trim();
  if (!phone && !name) return null;
  const nameNorm = name.toLowerCase().replace(/[\s_-]+/g, '');
  if (nameNorm === 'walkin' || nameNorm === 'walking') return ensureWalkIn();

  if (phone) {
    const { data: found } = await supabase.from('customers').select('*').eq('phone', phone).limit(1);
    if (found && found[0]) {
      const updates = {
        name: name || found[0].name,
        email: body.customerEmail || found[0].email,
        address: body.customerAddress || found[0].address,
      };
      await supabase.from('customers').update(updates).eq('id', found[0].id);
      return mapCustomer({ ...found[0], ...updates });
    }
  }
  const row = {
    id: id('cust'),
    name: name || 'Customer',
    phone,
    email: body.customerEmail || '',
    address: body.customerAddress || '',
    in_crm: false,
    notify_whatsapp: true,
    notify_email: true,
  };
  await supabase.from('customers').insert(row);
  return mapCustomer(row);
}

const DEFAULT_COUNTERS = [
  { counter_name: 'Table 01', prefix: 'A', access_holder: 'Design / Print' },
  { counter_name: 'Table 02', prefix: 'B', access_holder: 'NADRA' },
  { counter_name: 'Table 03', prefix: 'C', access_holder: 'Photo Copy' },
  { counter_name: 'Executive Office', prefix: 'E', access_holder: 'Payments / PALS' },
];

function mapCounterRow(c) {
  if (!c) return null;
  return {
    id: c.id,
    counterName: c.counter_name,
    accessHolder: c.access_holder,
    prefix: c.prefix,
    lastNumber: c.last_number,
    status: c.status,
    recordType: 'Counter',
  };
}

async function ensureDefaultCounters() {
  const { data } = await supabase.from('counters').select('*').order('counter_name', { ascending: true });
  if (data && data.length) return data;
  const rows = DEFAULT_COUNTERS.map((c) => ({
    id: id('cnt'),
    counter_name: c.counter_name,
    access_holder: c.access_holder,
    prefix: c.prefix,
    last_number: 0,
    status: 'Active',
  }));
  await supabase.from('counters').insert(rows);
  return rows;
}

async function findTokenRow(tid) {
  const key = decodeURIComponent(String(tid || '').trim());
  if (!key) return null;
  const { data: byId } = await supabase.from('tokens').select('*').eq('id', key).maybeSingle();
  if (byId) return byId;
  const { data: byNo } = await supabase
    .from('tokens')
    .select('*')
    .eq('token_no', key)
    .order('created_at', { ascending: false })
    .limit(1);
  return (byNo && byNo[0]) || null;
}

function tokenMatchesDate(row, dateQ) {
  const filter = String(dateQ || '').trim();
  if (!filter || filter === 'all') return true;
  const day = filter === 'today' ? today() : dateKey(filter);
  if (!day) return true;
  const tokenDay = dateKey(row.date || row.created_at || '');
  return !tokenDay || tokenDay === day;
}

function tokenMatchesCounter(row, counterQ) {
  const filter = String(counterQ || '').trim();
  if (!filter || filter === 'all') return true;
  return String(row.counter_name || row.counterName || '').toLowerCase() === filter.toLowerCase();
}

async function dispatch(req, res) {
  try {
    const path = String(req.query.path || '/').trim() || '/';
    let method = String(req.query._method || req.method || 'GET').toUpperCase();
    const token = req.query.token || req.headers['x-auth-token'] || '';
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    // Health
    if (path === '/health' || path === '/') {
      return send(res, { ok: true, backend: 'supabase', service: 'amz-erp-api' });
    }

    // Auth login (public)
    if (method === 'POST' && path === '/auth/login') {
      const result = await handleLogin(body);
      if (result.error) return sendError(res, result.error, 401);
      return send(res, result);
    }

    // Public routes
    if (path.startsWith('/public/')) {
      if (method === 'GET' && (path === '/public/catalog.js' || path === '/catalog.js')) {
        if (typeof res.setHeader === 'function') {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.statusCode = 200;
        return res.end(websiteCatalogSyncScript());
      }
      if (method === 'GET' && path === '/public/branding') {
        const settings = await getSettingsObject();
        const company = settings.company || {};
        if (settings.companyLogo) company.logo = settings.companyLogo;
        if (settings.companyStamp) company.stamp = settings.companyStamp;
        if (settings.companySignature) company.signature = settings.companySignature;
        return send(res, {
          company,
          theme: settings.theme || {},
          invoice: settings.invoice || {},
          companyLogo: settings.companyLogo || company.logo || '',
          companyStamp: settings.companyStamp || company.stamp || '',
          companySignature: settings.companySignature || company.signature || '',
        });
      }
      if (method === 'GET' && path.startsWith('/public/invoice/')) {
        const share = decodeURIComponent(path.replace('/public/invoice/', ''));
        const { data, error } = await supabase.from('invoices').select('*').eq('share_token', share).maybeSingle();
        if (error || !data) return sendError(res, 'Invoice not found', 404);
        return send(res, mapInvoice(data));
      }
      if (method === 'POST' && /^\/public\/track\/.+\/deliver$/.test(path)) {
        const staffTok = token || String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
        const staff = await validateToken(staffTok);
        if (!staff) return sendError(res, 'Staff login required to confirm delivery', 401);
        const tracking = decodeURIComponent(path.replace('/public/track/', '').replace(/\/deliver$/i, '')).trim().toLowerCase();
        const { data: orders } = await supabase.from('orders').select('*');
        const order = (orders || []).find((o) => {
          if (String(o.doc_type || 'Order').toLowerCase() === 'quotation') return false;
          const keys = [o.tracking_number, o.order_id, o.id, o.token_no]
            .map((v) => String(v || '').trim().toLowerCase())
            .filter(Boolean);
          return keys.includes(tracking);
        });
        if (!order) return sendError(res, `Order not found for: ${tracking}`, 404);
        try {
          const delivered = await confirmManualDelivery(order, staff);
          const mapped = await withInvoiceMeta(mapOrder(delivered));
          return send(res, {
            ok: true,
            orderId: mapped.orderId,
            status: mapped.status,
            delivered: true,
            closed: true,
            invoiceNumber: mapped.invoiceNumber || '',
          });
        } catch (err) {
          return sendError(res, err.message || INVOICE_REQUIRED_MESSAGE, err.statusCode || 400);
        }
      }
      if (method === 'GET' && path.startsWith('/public/track/')) {
        const tracking = decodeURIComponent(path.replace('/public/track/', '')).trim().toLowerCase();
        const { data: orders } = await supabase.from('orders').select('*');
        const order = (orders || []).find((o) => {
          if (String(o.doc_type || 'Order').toLowerCase() === 'quotation') return false;
          const keys = [o.tracking_number, o.order_id, o.id, o.token_no]
            .map((v) => String(v || '').trim().toLowerCase())
            .filter(Boolean);
          return keys.includes(tracking);
        });
        if (!order) return sendError(res, `Order not found for: ${tracking}`, 404);
        const api = mapOrder(order);
        const holder = await findInvoiceHoldingOrder(order);
        const delivered = isDeliveredStatus(api.status);
        const pipeline = ['Order Received', 'Designing', 'Proof Approval', 'Printing', 'Finishing', 'Packing', 'Ready', 'Delivered'];
        const status = String(api.status || '');
        const cancelled = /cancel/i.test(status);
        let idx = cancelled ? -1 : pipeline.indexOf(status);
        if (idx < 0 && /ready/i.test(status)) idx = pipeline.indexOf('Ready');
        if (idx < 0 && delivered) idx = pipeline.indexOf('Delivered');
        const timeline = pipeline.map((s, i) => ({
          status: s,
          done: !cancelled && idx >= 0 && i <= idx,
          current: !cancelled && (s === status || (s === 'Ready' && /ready/i.test(status)) || (s === 'Delivered' && delivered && i === idx)),
        }));
        return send(res, {
          id: api.id,
          orderId: api.orderId,
          trackingNumber: api.trackingNumber || api.orderId,
          status: api.status,
          cancelled,
          customerName: api.customerName,
          products: (api.products || []).map((p) => ({ name: p.name || '' })).filter((p) => p.name),
          timeline,
          trackCode: api.trackingNumber || api.orderId || api.id,
          hasInvoice: !!holder,
          invoiceRequired: !holder && !cancelled && !delivered,
          invoiceRequiredMessage: INVOICE_REQUIRED_MESSAGE,
          canDeliver: !!holder && !cancelled && !delivered,
          companyNote: 'For questions, contact Amazon Printing Services with your Order ID.',
        });
      }
      if (method === 'GET' && path.startsWith('/public/verify/')) {
        const rawCode = decodeURIComponent(path.replace('/public/verify/', '')).trim();
        const key = rawCode.toLowerCase();
        if (!key) return sendError(res, 'Missing verification code', 400);

        const matches = (values) => values
          .map((v) => String(v || '').trim().toLowerCase())
          .filter(Boolean)
          .includes(key);

        const { data: invoices } = await supabase.from('invoices').select('*');
        const invoiceRow = (invoices || []).find((inv) => matches([inv.share_token, inv.invoice_number, inv.invoice_no, inv.id]));
        if (invoiceRow) {
          const inv = mapInvoice(invoiceRow);
          return send(res, {
            kind: 'invoice',
            verified: true,
            code: rawCode,
            invoiceNumber: inv.invoiceNumber || '',
            date: inv.date || '',
            customerName: inv.customerName || '',
            totalAmount: inv.totalAmount,
            paidAmount: inv.paidAmount,
            status: inv.status || '',
            shareToken: inv.shareToken || '',
          });
        }

        const { data: orders } = await supabase.from('orders').select('*');
        const orderRow = (orders || []).find((o) => {
          if (String(o.doc_type || 'Order').toLowerCase() === 'quotation') return false;
          return matches([o.tracking_number, o.order_id, o.id, o.token_no]);
        });
        if (orderRow) {
          const api = mapOrder(orderRow);
          return send(res, {
            kind: String(api.docType || '').toUpperCase() === 'POS' ? 'pos' : 'order',
            verified: true,
            code: rawCode,
            orderId: api.orderId || '',
            trackingNumber: api.trackingNumber || api.orderId || '',
            date: api.date || '',
            customerName: api.customerName || '',
            status: api.status || '',
            totalAmount: api.totalAmount,
            items: (api.products || []).map((p) => p.name).filter(Boolean),
          });
        }

        const { data: payments } = await supabase.from('payments').select('*');
        const paymentRow = (payments || []).find((p) => matches([p.id, p.ref_id]));
        if (paymentRow) {
          const pay = mapPayment(paymentRow);
          return send(res, {
            kind: 'payment',
            verified: true,
            code: rawCode,
            date: pay.date || '',
            type: pay.type || '',
            category: pay.category || '',
            party: pay.party || pay.customerName || '',
            amount: pay.amount,
            method: pay.method || '',
            reference: pay.refId || pay.id || rawCode,
          });
        }

        return sendError(res, `Document not found for: ${rawCode}`, 404);
      }
      if (method === 'GET' && path === '/public/products') {
        if (typeof res.setHeader === 'function') {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
        }
        const { data } = await supabase.from('products').select('*');
        await syncWebsiteCatalogFlags(data || []);
        const products = (data || []).map(mapProduct).filter((p) => isListedOnWebsite(p));
        products.sort((a, b) => Number(!!b.showOnTop) - Number(!!a.showOnTop) || String(a.name).localeCompare(String(b.name)));
        return send(res, { products, generatedAt: new Date().toISOString() });
      }
      if (method === 'GET' && path.startsWith('/public/products/')) {
        const pid = decodeURIComponent(path.replace('/public/products/', '')).trim();
        const { data } = await supabase.from('products').select('*').eq('id', pid).maybeSingle();
        if (!data) return sendError(res, 'Product not found', 404);
        const pub = mapProduct(data);
        if (!isListedOnWebsite(pub)) return sendError(res, 'Product not available', 404);
        return send(res, pub);
      }
      if (method === 'POST' && path === '/public/lead') {
        const notes = [body.product || body.service || '', body.quantity || '', body.details || body.message || '']
          .filter(Boolean).join(' | ');
        const cust = await upsertCustomerFromOrder({
          customerName: body.name,
          customerPhone: body.phone,
          customerEmail: body.email,
          customerAddress: body.address || '',
        });
        if (cust) {
          await supabase.from('customers').update({
            in_crm: true,
            stage: 'lead',
            stage_updated_at: new Date().toISOString(),
            notes: notes || undefined,
          }).eq('id', cust.id);
          if (notes) {
            await supabase.from('crm_notes').insert({
              id: id('note'),
              customer_id: cust.id,
              note: `Website lead: ${body.details || body.message || body.product || 'Inquiry'}`,
              created_at: new Date().toISOString(),
              created_by: 'website',
            });
          }
        }
        return send(res, { ok: true, customerId: cust && cust.id, stage: 'lead' });
      }
      if (method === 'POST' && path === '/public/customer/register') {
        const regName = String(body.name || '').trim();
        const regPhone = String(body.phone || '').trim();
        const regEmail = String(body.email || '').trim().toLowerCase();
        const regPass = String(body.password || '');
        if (!regName || !regPhone) return sendError(res, 'Name and phone are required', 400);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) return sendError(res, 'Valid email is required', 400);
        if (regPass.length < 6) return sendError(res, 'Password must be at least 6 characters', 400);
        const { data: allCust } = await supabase.from('customers').select('*');
        const existingEmail = (allCust || []).find((c) => String(c.email || '').trim().toLowerCase() === regEmail && portalPasswordFromRow(c));
        if (existingEmail) return sendError(res, 'An account with this email already exists — please login', 400);
        const existingPhone = (allCust || []).find((c) => String(c.phone || '').replace(/\D/g, '') === regPhone.replace(/\D/g, ''));
        const portal = makePortalPassword(regPass);
        let customer = existingPhone;
        if (existingPhone) {
          const notes = String(existingPhone.notes || '');
          const { error: upErr } = await supabase.from('customers').update({
            name: regName || existingPhone.name,
            email: regEmail || existingPhone.email,
            address: body.address || existingPhone.address || '',
            portal_password: portal,
            notes: /<!--portal:/.test(notes) ? notes : `${notes}\n<!--portal:${portal}-->`.trim(),
            notify_email: true,
            notify_whatsapp: true,
          }).eq('id', existingPhone.id);
          if (upErr) {
            await supabase.from('customers').update({
              notes: `${notes}\n<!--portal:${portal}-->`.trim(),
            }).eq('id', existingPhone.id);
          }
          customer = { ...existingPhone, name: regName || existingPhone.name, email: regEmail, portal_password: portal };
        } else {
          customer = {
            id: id('cust'),
            name: regName,
            phone: regPhone,
            email: regEmail,
            address: body.address || '',
            city: body.city || '',
            notes: `Website portal account\n<!--portal:${portal}-->`,
            in_crm: false,
            notify_whatsapp: true,
            notify_email: true,
            portal_password: portal,
          };
          await dbWrite('customers', customer, { mode: 'insert' });
          const { error: passErr } = await supabase.from('customers').update({ portal_password: portal }).eq('id', customer.id);
          if (passErr) {
            await supabase.from('customers').update({ notes: customer.notes }).eq('id', customer.id);
          }
        }
        const { data: savedCust } = await supabase.from('customers').select('*').eq('id', customer.id).maybeSingle();
        if (!portalPasswordFromRow(savedCust || customer)) {
          return sendError(res, 'Website password could not be saved. Add portal_password on customers, then retry.', 500);
        }
        return send(res, { ok: true, token: issueCustomerToken(customer), customer: sanitizePortalCustomer(savedCust || customer) });
      }
      if (method === 'POST' && path === '/public/customer/login') {
        const loginId = String(body.email || body.phone || body.username || '').trim().toLowerCase();
        const loginPass = String(body.password || '');
        if (!loginId || !loginPass) return sendError(res, 'Email/phone and password are required', 400);
        const { data: custRows } = await supabase.from('customers').select('*');
        const loginCust = (custRows || []).find((c) => {
          const email = String(c.email || '').trim().toLowerCase();
          const phone = String(c.phone || '').replace(/\D/g, '');
          const needlePhone = loginId.replace(/\D/g, '');
          return (email && email === loginId)
            || (phone && needlePhone && (phone === needlePhone || phone.slice(-10) === needlePhone.slice(-10)));
        });
        const storedPass = portalPasswordFromRow(loginCust);
        if (!loginCust || !storedPass) return sendError(res, 'Invalid login or account not registered online', 401);
        if (!checkPortalPassword(storedPass, loginPass)) {
          return sendError(res, 'Invalid email/phone or password', 401);
        }
        return send(res, { ok: true, token: issueCustomerToken(loginCust), customer: sanitizePortalCustomer(loginCust) });
      }
      if ((method === 'GET' || method === 'POST') && path === '/public/customer/me') {
        const headerTok = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
        const meTok = String(body.token || body.customerToken || req.query.token || headerTok || '').trim();
        const payload = parseCustomerToken(meTok);
        if (!payload) return sendError(res, 'Login required', 401);
        const me = await loadCustomer(payload.id);
        if (!me) return sendError(res, 'Unauthorized', 401);
        const wantCid = String(req.query.c || req.query.cid || body.customerId || '').trim();
        if (wantCid && wantCid !== String(me.id)) {
          return sendError(res, 'This QR belongs to a different customer account. Please login with the matching account.', 403);
        }
        const [orders, invoices, payments] = await Promise.all([
          dbSelectSafe('orders', LEAN_ORDER_COLS),
          dbSelectSafe('invoices', LEAN_INVOICE_COLS),
          dbSelectSafe('payments', LEAN_PAYMENT_COLS),
        ]);
        const led = computeCustomerLedger(me, orders || [], invoices || [], payments || []);
        const relatedOrders = (orders || []).filter((o) =>
          String(o.doc_type || 'Order').toLowerCase() !== 'quotation'
          && (String(o.customer_id) === String(me.id) || (me.phone && String(o.customer_phone || '').replace(/\D/g, '').slice(-10) === String(me.phone).replace(/\D/g, '').slice(-10)))
        );
        const relatedInvoices = (invoices || []).filter((inv) => String(inv.customer_id) === String(me.id));
        const relatedPayments = (payments || []).filter((p) => String(p.customer_id) === String(me.id));
        return send(res, {
          ok: true,
          customer: {
            ...sanitizePortalCustomer(me),
            customerCode: me.customer_code || me.id,
            outstanding: led.outstanding,
            creditBalance: led.creditBalance,
          },
          ledger: led,
          orders: relatedOrders.map((o) => {
            const api = mapOrder(o);
            const keys = [o.order_id, o.id].filter(Boolean).map(String);
            const inv = (relatedInvoices || []).find((row) => {
              const ids = collectOrderIds({}, row);
              return keys.some((k) => ids.includes(k) || String(row.order_id) === k);
            });
            api.hasInvoice = !!inv;
            api.invoiceId = inv ? (inv.id || '') : '';
            api.invoiceNumber = inv ? (inv.invoice_no || '') : '';
            api.invoiceRequired = !inv && !isDeliveredStatus(api.status) && !isCancelledStatus(api.status);
            return api;
          }),
          invoices: relatedInvoices.map(mapInvoice),
          payments: relatedPayments.map(mapPayment),
          portalUrl: `/portal?c=${encodeURIComponent(me.id)}`,
        });
      }
      if (method === 'POST' && (path === '/public/orders' || path === '/public/checkout')) {
        const orderTok = String(body.token || body.customerToken || req.query.token || '').trim();
        const payload = parseCustomerToken(orderTok);
        if (!payload) return sendError(res, 'Login required to place an order', 401);
        const orderCust = await loadCustomer(payload.id);
        if (!orderCust) return sendError(res, 'Login required to place an order', 401);
        assertCustomerNotBlocked(orderCust);
        if (!body.acceptPolicy && body.policyAccepted !== true) {
          return sendError(res, 'Please accept the Order Processing Policy before placing the order', 400);
        }
        const linesIn = Array.isArray(body.products) ? body.products : (Array.isArray(body.items) ? body.items : []);
        if (!linesIn.length) return sendError(res, 'Cart is empty', 400);
        const { data: catalog } = await supabase.from('products').select('*');
        const products = [];
        let subtotal = 0;
        for (const line of linesIn) {
          const pid = String(line.productId || line.id || '').trim();
          const qty = Math.max(1, num(line.quantity) || 1);
          let match = pid ? (catalog || []).find((p) => String(p.id) === pid) : null;
          if (!match && line.name) {
            match = (catalog || []).find((p) => String(p.name || '').trim().toLowerCase() === String(line.name).trim().toLowerCase());
          }
          if (!match) return sendError(res, `Product not found: ${line.name || pid || 'unknown'}`, 400);
          const api = mapProduct(match);
          if (!isListedOnWebsite(api)) return sendError(res, `Product not available: ${api.name}`, 400);
          const rate = num(api.effectivePrice);
          subtotal += rate * qty;
          products.push({
            productId: api.id,
            productType: api.productType,
            name: api.name,
            quantity: qty,
            rate,
            amount: rate * qty,
          });
        }
        const paymentMethodRaw = String(body.paymentMethod || body.payment_method || 'Cash on Delivery').trim();
        const isCod = /cod|cash\s*on\s*delivery/i.test(paymentMethodRaw);
        const row = orderFromBody({
          customerId: orderCust.id,
          customerName: orderCust.name,
          customerPhone: orderCust.phone,
          customerEmail: orderCust.email,
          customerAddress: body.deliveryAddress || orderCust.address,
          products,
          totalAmount: subtotal,
          advancePayment: 0,
          paymentMethod: isCod ? 'Cash on Delivery' : 'Online Payment',
          remarks: body.notes || '',
          status: 'Order Received',
        });
        row.order_id = await nextOrderId('WEB');
        row.tracking_number = await nextTrackingNumber();
        row.status_history = [{ status: row.status, at: `${today()} ${nowTime()}`, note: 'Website order' }];
        await persistOrderStock(row, { isPos: false });
        const { error: webOrdErr } = await supabase.from('orders').insert(row);
        if (webOrdErr) {
          try { await syncProductStock(row.products, []); } catch { /* ignore */ }
          throw webOrdErr;
        }
        return send(res, { ok: true, order: mapOrder(row) });
      }
      if (method === 'GET' && path.startsWith('/public/employee/')) {
        const code = decodeURIComponent(path.replace('/public/employee/', '')).trim().toLowerCase();
        if (!code) return sendError(res, 'Employee code required', 400);
        const { data: rows } = await supabase.from('employees').select('*');
        const row = (rows || []).find((e) => {
          const keys = [e.id, e.employee_code]
            .map((v) => String(v || '').trim().toLowerCase())
            .filter(Boolean);
          return keys.includes(code);
        });
        if (!row) return sendError(res, 'Employee not found', 404);
        const api = mapEmployee(row);
        const status = String(api.status || 'Active');
        let expired = false;
        if (api.validUntil) {
          const t = new Date(api.validUntil).getTime();
          if (!Number.isNaN(t)) expired = t < Date.now();
        }
        const active = status.toLowerCase() === 'active' && !expired;
        return send(res, {
          verified: true,
          employeeCode: api.employeeCode || api.id || '',
          name: api.name || '',
          designation: api.designation || api.role || '',
          department: api.department || '',
          joinDate: api.joinDate || '',
          endDate: api.endDate || '',
          validFrom: api.validFrom || '',
          validUntil: api.validUntil || '',
          status,
          active,
          expired,
          companyNote: 'Verified employment record — Amazon Printing / AMZ Prints.',
        });
      }
      return sendError(res, 'Not found', 404);
    }

    // Auth required
    const user = await validateToken(token);
    if (!user) return sendError(res, 'Unauthorized', 401);

    if (method === 'GET' && path === '/auth/me') return send(res, sanitizeUser(user));
    if (method === 'POST' && path === '/auth/logout') return send(res, { success: true });

    // Dashboard
    if (method === 'GET' && (path === '/dashboard/stats' || path === '/dashboard/bootstrap')) {
      const from = String(req.query?.from || '').slice(0, 10);
      const to = String(req.query?.to || '').slice(0, 10);
      const inRange = (raw) => {
        if (!from && !to) return true;
        const dk = dateKey(raw);
        if (!dk) return true;
        if (from && dk < from) return false;
        if (to && dk > to) return false;
        return true;
      };
      const [orders, customers, expenses, purchases, invoices, payments] = await Promise.all([
        dbSelectSafe('orders', LEAN_ORDER_COLS),
        dbSelectSafe('customers', 'id,phone,name,credit_balance'),
        dbSelectSafe('expenses', LEAN_EXPENSE_COLS),
        dbSelectSafe('purchases', LEAN_PURCHASE_COLS),
        dbSelectSafe('invoices', LEAN_INVOICE_COLS),
        dbSelectSafe('payments', LEAN_PAYMENT_COLS),
      ]);
      const quotations = (orders || []).filter((o) => isQuotation(o) && inRange(o.date));
      const realOrders = (orders || []).filter((o) => !isQuotation(o) && inRange(o.date) && !isCancelledStatus(o.status));
      const allDatedOrders = (orders || []).filter((o) => !isQuotation(o) && inRange(o.date));
      const expenseRows = (expenses || []).filter((e) => inRange(e.date) && expenseIsApproved(e));
      const purchaseRows = (purchases || []).filter((p) => inRange(p.date || p.purchase_date));
      const invoiceRows = (invoices || []).filter((inv) => inRange(inv.date) && !isCancelledStatus(inv.status));
      const paymentRows = (payments || []).filter((p) => inRange(p.date));
      const revenue = realOrders.reduce((s, o) => s + num(o.total_amount), 0);
      const expenseSum = expenseRows.reduce((s, e) => s + num(e.amount), 0);
      const payables = purchaseRows.reduce((s, p) => s + purchaseOutstanding(p), 0);
      const statusMap = {};
      realOrders.forEach((o) => {
        const key = o.status || 'Unknown';
        statusMap[key] = (statusMap[key] || 0) + 1;
      });
      const designingOrders = realOrders.filter((o) => /design|proof/i.test(String(o.status || ''))).length;
      const printingOrders = realOrders.filter((o) => /print|finish|pack/i.test(String(o.status || ''))).length;
      const readyOrders = realOrders.filter((o) => /^ready$/i.test(String(o.status || ''))).length;
      const completedOrders = realOrders.filter((o) => /deliver/i.test(String(o.status || ''))).length;
      const pendingOrders = allDatedOrders.filter((o) => !/deliver/i.test(String(o.status || '')) && !isCancelledStatus(o.status)).length;
      const cashIn = paymentRows.filter((p) => !/outflow|^out$/i.test(String(p.type || 'inflow'))).reduce((s, p) => s + num(p.amount), 0);
      const cashOut = paymentRows.filter((p) => /outflow|^out$/i.test(String(p.type || ''))).reduce((s, p) => s + num(p.amount), 0);
      const collected = cashIn;
      let receivables = 0;
      try {
        receivables = computeCompanyReceivables(orders || [], invoices || [], customers || [], payments || []);
      } catch (err) {
        console.error('dashboard receivables', dbErrorMessage(err));
        receivables = (customers || []).reduce((s, c) => s + Math.max(0, num(c.credit_balance) * -1), 0);
        receivables += realOrders.reduce((s, o) => s + num(o.balance_amount), 0);
      }
      const fulfillmentRate = realOrders.length ? Math.round((completedOrders / realOrders.length) * 100) : 0;
      const collectionRate = revenue > 0 ? Math.round((Math.min(collected, revenue) / revenue) * 100) : 0;
      const stats = {
        totalQuotations: quotations.length,
        totalOrders: realOrders.length,
        totalInvoices: invoiceRows.length,
        pendingOrders,
        completedOrders,
        readyOrders,
        designingOrders,
        printingOrders,
        revenue,
        expenses: expenseSum,
        receivables,
        collected,
        payables,
        vendorPayables: payables,
        cashIn,
        cashOut,
        cashNet: cashIn - cashOut,
        activeCustomers: (customers || []).length,
        fulfillmentRate,
        collectionRate,
        from: from || '',
        to: to || '',
      };
      const attention = realOrders
        .filter((o) => {
          const ready = /^ready$/i.test(String(o.status || ''));
          const overdue = o.delivery_date && String(o.delivery_date).slice(0, 10) < today() && !/deliver/i.test(String(o.status || ''));
          const unpaid = num(o.balance_amount) > 0.009;
          return ready || overdue || unpaid;
        })
        .sort((a, b) => num(b.balance_amount) - num(a.balance_amount))
        .slice(0, 12)
        .map(mapOrder)
        .filter(Boolean);
      if (path === '/dashboard/bootstrap') {
        return send(res, {
          stats,
          recentOrders: realOrders.slice(-8).reverse().map(mapOrder).filter(Boolean),
          recentExpenses: expenseRows.slice(-6).reverse().map(mapExpense).filter(Boolean),
          charts: {
            monthlySales: buildMonthlySales(orders || [], expenses || []),
            orderStatus: Object.keys(statusMap).map((name) => ({ name, value: statusMap[name] })),
          },
          attention,
        });
      }
      return send(res, stats);
    }
    if (method === 'GET' && path === '/dashboard/charts') {
      const [orders, expenses] = await Promise.all([
        dbSelectSafe('orders', 'date,doc_type,status,total_amount'),
        dbSelectSafe('expenses', 'id,date,amount,approved'),
      ]);
      const monthly = buildMonthlySales(orders || [], expenses || []);
      return send(res, { sales: monthly, expenses: monthly, monthlySales: monthly });
    }
    if (method === 'GET' && path === '/dashboard/recent-orders') {
      const rows = await dbSelectSafe('orders', LEAN_ORDER_COLS, (q) => {
        try { return q.order('date', { ascending: false }).limit(20); } catch { return q.limit(20); }
      });
      return send(res, (rows || []).filter((o) => String(o.doc_type || '').toLowerCase() !== 'quotation').map(mapOrder));
    }

    // Settings
    if (path === '/settings') {
      if (method === 'GET') return send(res, await getSettingsObject());
      if (method === 'PUT' || method === 'POST') return send(res, await saveSettingsObject(body));
    }

    if (path === '/pos/register' || path.startsWith('/pos/register/')) {
      const settings = await getSettingsObject();
      const store = (settings.posRegister && typeof settings.posRegister === 'object')
        ? settings.posRegister
        : { current: null, history: [] };
      if (!Array.isArray(store.history)) store.history = [];

      const shiftTotals = async (openedAt) => {
        const since = String(openedAt || '').slice(0, 19);
        const { data: orders } = await supabase.from('orders').select('id,order_id,date,created_at,doc_type,total_amount,advance_payment,payment_method,remarks,status');
        const rows = (orders || []).filter((o) => {
          const dt = String(o.doc_type || '').toLowerCase();
          const pos = dt === 'pos' || /pos\s*sale/i.test(String(o.remarks || ''));
          if (!pos || isCancelledStatus(o.status)) return false;
          const stamp = String(o.created_at || o.date || '');
          if (since && stamp < since.slice(0, 10)) return false;
          return true;
        });
        const byMethod = {};
        let sales = 0;
        let cashSales = 0;
        rows.forEach((o) => {
          const amt = num(o.total_amount);
          sales += amt;
          const method = String(o.payment_method || '').trim() || (/card/i.test(String(o.remarks || '')) ? 'Card' : 'Cash');
          byMethod[method] = (byMethod[method] || 0) + amt;
          if (/^cash$/i.test(method)) cashSales += amt;
        });
        return { count: rows.length, sales, cashSales, byMethod, tickets: rows.map((o) => o.order_id || o.id) };
      };

      if (method === 'GET' && path === '/pos/register') {
        const totals = store.current ? await shiftTotals(store.current.openedAt) : { count: 0, sales: 0, cashSales: 0, byMethod: {} };
        return send(res, { ...store, totals });
      }
      if (method === 'GET' && path === '/pos/register/x-report') {
        if (!store.current) return sendError(res, 'No open register — X-report requires an open shift', 400);
        const totals = await shiftTotals(store.current.openedAt);
        const openingFloat = num(store.current.openingFloat);
        return send(res, {
          type: 'X',
          generatedAt: new Date().toISOString(),
          register: store.current,
          totals,
          expectedCash: openingFloat + totals.cashSales,
          note: 'X-report is a mid-shift snapshot. The drawer stays open (IAS 2 / retail cash control).',
        });
      }
      if (method === 'POST' && path === '/pos/register/open') {
        if (store.current && store.current.status === 'open') {
          return sendError(res, 'Register already open. Close the current shift first.', 400);
        }
        const openingFloat = num(body.openingFloat);
        if (openingFloat < 0) return sendError(res, 'Opening float cannot be negative', 400);
        store.current = {
          id: id('posreg'),
          status: 'open',
          openedAt: new Date().toISOString(),
          openedBy: body.openedBy || userLabel(user),
          openingFloat,
          note: body.note || '',
        };
        await saveSettingsObject({ posRegister: store });
        return send(res, { ok: true, current: store.current, history: store.history });
      }
      if (method === 'POST' && path === '/pos/register/close') {
        if (!store.current || store.current.status !== 'open') {
          return sendError(res, 'No open register to close', 400);
        }
        const totals = await shiftTotals(store.current.openedAt);
        const countedCash = num(body.countedCash);
        const openingFloat = num(store.current.openingFloat);
        const expectedCash = openingFloat + totals.cashSales;
        const variance = Math.round((countedCash - expectedCash) * 100) / 100;
        const closed = {
          ...store.current,
          status: 'closed',
          closedAt: new Date().toISOString(),
          closedBy: body.closedBy || userLabel(user),
          countedCash,
          expectedCash,
          variance,
          totals,
          closeNote: body.note || '',
          confirmed: body.confirmed === true,
        };
        store.history = [closed, ...store.history].slice(0, 80);
        store.current = null;
        await saveSettingsObject({ posRegister: store });
        return send(res, { ok: true, closed, history: store.history, current: null });
      }
      return sendError(res, `Not found: ${path}`, 404);
    }

    // Users
    if (path === '/users' || path.startsWith('/users/')) {
      if (path === '/users' && method === 'GET') {
        const { data } = await supabase.from('users').select('*');
        return send(res, (data || []).map((u) => mapUser(u, true)));
      }
      if (path === '/users' && method === 'POST') {
        const row = {
          id: id('user'),
          username: body.username || body.email || '',
          password: body.password || '',
          name: body.name || '',
          role: body.role || 'Sales',
          status: body.status || 'Active',
          permissions: body.permissions || [],
          email: body.email || body.username || '',
          employee_id: body.employeeId || body.employee_id || '',
        };
        await supabase.from('users').insert(row);
        return send(res, mapUser(row, true));
      }
      const uid = path.split('/')[2];
      if (method === 'PUT') {
        const updates = {
          username: body.username,
          name: body.name,
          role: body.role,
          status: body.status,
          permissions: body.permissions,
          email: body.email,
          employee_id: body.employeeId != null ? body.employeeId : body.employee_id,
        };
        if (body.password) updates.password = body.password;
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await supabase.from('users').update(updates).eq('id', uid);
        const { data } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
        return send(res, mapUser(data, true));
      }
      if (method === 'DELETE') {
        await supabase.from('users').delete().eq('id', uid);
        return send(res, { success: true });
      }
    }

    // Customers + CRM
    if (path === '/customers' || path.startsWith('/customers/')) {
      if (path === '/customers' && method === 'GET') {
        const [data, orders, invoices, payments] = await Promise.all([
          dbSelectSafe('customers', '*', (q) => q.order('created_at', { ascending: false })),
          dbSelectSafe('orders', LEAN_ORDER_COLS),
          dbSelectSafe('invoices', LEAN_INVOICE_COLS),
          dbSelectSafe('payments', LEAN_PAYMENT_COLS),
        ]);
        return send(res, (data || []).map((c) => attachCustomerLedger(c, orders || [], invoices || [], payments || [])));
      }
      if (path === '/customers' && method === 'POST') {
        const nameNorm = String(body.name || '').toLowerCase().replace(/[\s_-]+/g, '');
        if (nameNorm === 'walkin' || nameNorm === 'walking') return send(res, await ensureWalkIn());
        let existing = null;
        if (body.phone) {
          const { data } = await supabase.from('customers').select('*').eq('phone', String(body.phone).trim()).limit(1);
          existing = data && data[0];
        }
        if (existing) {
          const updates = {
            name: body.name || existing.name,
            phone: body.phone || existing.phone,
            email: body.email || existing.email,
            address: body.address || existing.address,
            city: body.city || existing.city,
            notes: body.notes != null ? body.notes : existing.notes,
          };
          if (body.inCrm === true) {
            updates.in_crm = true;
            updates.stage = body.stage || existing.stage || 'lead';
            updates.stage_updated_at = new Date().toISOString();
          }
          Object.assign(updates, withCustomerPhoto(
            { notes: updates.notes },
            body.photo != null ? body.photo : customerPhoto(existing),
          ));
          await dbWrite('customers', updates, { mode: 'update', id: existing.id });
          const { data } = await supabase.from('customers').select('*').eq('id', existing.id).maybeSingle();
          return send(res, mapCustomer(data));
        }
        const row = withCustomerPhoto({
          id: id('cust'),
          name: body.name || '',
          phone: body.phone || '',
          email: body.email || '',
          address: body.address || '',
          city: body.city || '',
          notes: body.notes || '',
          in_crm: body.inCrm === true,
          stage: body.inCrm === true ? (body.stage || 'lead') : '',
          stage_updated_at: body.inCrm === true ? new Date().toISOString() : '',
          notify_whatsapp: truthy(body.notifyWhatsApp, true),
          notify_email: truthy(body.notifyEmail, true),
        }, body.photo || body.image || '');
        await dbWrite('customers', row, { mode: 'insert' });
        return send(res, mapCustomer(row));
      }

      const parts = path.split('/').filter(Boolean); // customers, id, ...
      const cid = parts[1];
      if (parts[2] === 'notes') {
        if (!parts[3] && method === 'GET') {
          const { data } = await supabase.from('crm_notes').select('*').eq('customer_id', cid).order('created_at', { ascending: false });
          return send(res, (data || []).map((n) => ({
            id: n.id, customerId: n.customer_id, note: n.note, createdAt: n.created_at, createdBy: n.created_by,
          })));
        }
        if (!parts[3] && method === 'POST') {
          const row = {
            id: id('note'),
            customer_id: cid,
            note: String(body.note || body.text || '').trim(),
            created_at: new Date().toISOString(),
            created_by: body.createdBy || 'staff',
          };
          if (!row.note) return sendError(res, 'Note text required', 400);
          await supabase.from('crm_notes').insert(row);
          return send(res, { id: row.id, customerId: cid, note: row.note, createdAt: row.created_at, createdBy: row.created_by });
        }
        if (parts[3] && method === 'DELETE') {
          await supabase.from('crm_notes').delete().eq('id', parts[3]).eq('customer_id', cid);
          return send(res, { success: true });
        }
      }
      if (parts[2] === 'crm' && (method === 'PUT' || method === 'POST')) {
        const enable = !(body.inCrm === false);
        const updates = {
          in_crm: enable,
          stage: enable ? (body.stage || 'lead') : '',
          stage_updated_at: enable ? new Date().toISOString() : '',
        };
        await supabase.from('customers').update(updates).eq('id', cid);
        const { data } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        return send(res, mapCustomer(data));
      }
      if (parts[2] === 'stage' && (method === 'PUT' || method === 'POST')) {
        await supabase.from('customers').update({
          stage: body.stage || 'lead',
          stage_updated_at: new Date().toISOString(),
          in_crm: true,
        }).eq('id', cid);
        const { data } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        return send(res, mapCustomer(data));
      }
      if (parts[2] === 'block' && method === 'POST') {
        const { data: prev } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        if (!prev) return sendError(res, 'Customer not found', 404);
        if (String(prev.id) === 'cust_walkin') return sendError(res, 'Walk-in customer cannot be blocked', 400);
        const reason = String(body.blockReason || body.reason || '').trim();
        if (!reason) return sendError(res, 'Block reason is required', 400);
        await supabase.from('customers').update({
          blocked: true,
          block_reason: reason,
          blocked_at: new Date().toISOString(),
          blocked_by: userLabel(user),
        }).eq('id', cid);
        const { data } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        return send(res, mapCustomer(data));
      }
      if (parts[2] === 'unblock' && method === 'POST') {
        if (!isAdminRole(user)) return sendError(res, 'Only Admin with Settings access can unblock customers', 403);
        await supabase.from('customers').update({
          blocked: false,
          block_reason: '',
          blocked_at: '',
          blocked_by: '',
        }).eq('id', cid);
        const { data } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        return send(res, mapCustomer(data));
      }
      if (parts[2] === 'payment' && method === 'POST') {
        const { data: customer } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        if (!customer) return sendError(res, 'Customer not found', 404);
        const amount = num(body.amount);
        if (!(amount > 0)) return sendError(res, 'Enter a valid payment amount', 400);
        const result = await applyCustomerReceipt(customer, { ...body, amount }, user);
        const [fresh, orders, invoices, payments] = await Promise.all([
          loadCustomer(cid),
          dbSelectSafe('orders', LEAN_ORDER_COLS),
          dbSelectSafe('invoices', LEAN_INVOICE_COLS),
          dbSelectSafe('payments', LEAN_PAYMENT_COLS),
        ]);
        return send(res, {
          ...result,
          customer: attachCustomerLedger(fresh || customer, orders || [], invoices || [], payments || []),
        });
      }
      if (parts[2] === 'allocate' && method === 'POST') {
        const { data: customer } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        if (!customer) return sendError(res, 'Customer not found', 404);
        const allocations = Array.isArray(body.allocations) ? body.allocations : [];
        if (!allocations.length) return sendError(res, 'Select at least one invoice to allocate', 400);
        let { data: payment } = body.paymentId
          ? await supabase.from('payments').select('*').eq('id', body.paymentId).maybeSingle()
          : { data: null };
        if (body.paymentId && !payment) return sendError(res, 'Payment not found', 404);
        const remainingStart = payment ? num(payment.balance_due != null ? payment.balance_due : payment.amount) : num(customer.credit_balance);
        const wanted = allocations.reduce((s, a) => s + num(a.amount), 0);
        if (wanted > remainingStart + 0.009) return sendError(res, 'Allocated amount exceeds available payment', 400);
        const results = [];
        let remaining = remainingStart;
        for (const item of allocations) {
          const amt = num(item.amount);
          if (!(amt > 0)) continue;
          const { data: inv } = await supabase.from('invoices').select('*').eq('id', item.invoiceId || item.invoice_id).maybeSingle();
          if (!inv || String(inv.customer_id) !== String(cid)) return sendError(res, 'Invoice does not belong to this customer', 400);
          const due = Math.max(0, num(inv.total) - num(inv.paid));
          const use = Math.min(amt, due, remaining);
          if (!(use > 0)) continue;
          const history = Array.isArray(inv.payment_history) ? [...inv.payment_history] : [];
          const payId = id('pay');
          history.push({
            id: payId,
            date: today(),
            amount: use,
            applied: use,
            extra: 0,
            method: (payment && payment.method) || 'Advance',
            notes: `Allocated from unallocated payment${payment ? ` ${payment.id}` : ''}`,
            locked: true,
          });
          const paidAfter = num(inv.paid) + use;
          await supabase.from('invoices').update({
            paid: paidAfter,
            status: invoiceStatusFromPaid(num(inv.total), paidAfter),
            payment_history: history,
          }).eq('id', inv.id);
          remaining -= use;
          results.push({ invoiceId: inv.id, invoiceNo: inv.invoice_no, allocated: use });
        }
        if (payment) {
          await supabase.from('payments').update({
            balance_due: remaining,
            notes: `${payment.notes || 'Unallocated customer payment'} · allocated ${Number(remainingStart - remaining).toFixed(0)}`,
          }).eq('id', payment.id);
        }
        const creditAfter = Math.max(0, num(customer.credit_balance) - (remainingStart - remaining));
        await supabase.from('customers').update({ credit_balance: creditAfter }).eq('id', cid);
        return send(res, {
          ok: true,
          allocations: results,
          remaining,
          creditBalance: creditAfter,
        });
      }
      if (parts[2] === 'ledger' && method === 'GET') {
        const { data: customer } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        if (!customer) return sendError(res, 'Customer not found', 404);
        const [orders, invoices, payments] = await Promise.all([
          dbSelectSafe('orders', LEAN_ORDER_COLS),
          dbSelectSafe('invoices', '*'),
          dbSelectSafe('payments', LEAN_PAYMENT_COLS),
        ]);
        const phone = String(customer.phone || '');
        const relatedOrders = (orders || []).filter((o) =>
          String(o.doc_type || 'Order').toLowerCase() !== 'quotation'
          && (String(o.customer_id) === String(cid) || (phone && String(o.customer_phone) === phone))
        );
        const relatedInvoices = (invoices || []).filter((inv) =>
          String(inv.customer_id) === String(cid) || (phone && String(inv.customer_phone) === phone)
        );
        const relatedPayments = (payments || []).filter((p) =>
          String(p.customer_id) === String(cid) || (phone && String(p.party_phone || p.customer_phone) === phone)
        );
        const led = computeCustomerLedger(customer, orders || [], invoices || [], payments || []);
        return send(res, {
          customer: attachCustomerLedger(customer, orders || [], invoices || [], payments || []),
          invoices: relatedInvoices.map(mapInvoice),
          orders: relatedOrders.map(mapOrder),
          payments: relatedPayments.map(mapPayment),
          ...led,
        });
      }
      if (method === 'GET') {
        const { data } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        if (!data) return sendError(res, 'Customer not found', 404);
        const [orders, invoices, payments] = await Promise.all([
          dbSelectSafe('orders', LEAN_ORDER_COLS),
          dbSelectSafe('invoices', LEAN_INVOICE_COLS),
          dbSelectSafe('payments', LEAN_PAYMENT_COLS),
        ]);
        return send(res, attachCustomerLedger(data, orders || [], invoices || [], payments || []));
      }
      if (method === 'PUT') {
        const { data: prev } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        if (!prev) return sendError(res, 'Customer not found', 404);
        const updates = {
          name: body.name,
          phone: body.phone,
          email: body.email,
          address: body.address,
          city: body.city,
          notes: body.notes,
          notify_whatsapp: body.notifyWhatsApp,
          notify_email: body.notifyEmail,
        };
        if (body.inCrm != null) updates.in_crm = !!body.inCrm;
        if (body.stage != null) updates.stage = body.stage;
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        const photoVal = body.photo != null ? body.photo : (body.image != null ? body.image : customerPhoto(prev));
        const packed = withCustomerPhoto(
          { notes: updates.notes != null ? updates.notes : prev.notes },
          photoVal,
        );
        updates.notes = packed.notes;
        updates.photo = packed.photo;
        updates.image = packed.image;
        await dbWrite('customers', updates, { mode: 'update', id: cid });
        const { data } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        return send(res, mapCustomer(data));
      }
      if (method === 'DELETE') {
        await supabase.from('customers').delete().eq('id', cid);
        return send(res, { success: true });
      }
    }

    // Generic collection helper
    async function handleCollection(table, base, mapper, toRow) {
      if (path === base && method === 'GET') {
        const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return send(res, (data || []).map(mapper));
      }
      if (path === base && method === 'POST') {
        const row = toRow(body);
        await dbWrite(table, row, { mode: 'insert' });
        return send(res, mapper(row));
      }
      const rid = path.split('/')[2];
      if (method === 'GET') {
        const { data } = await supabase.from(table).select('*').eq('id', rid).maybeSingle();
        if (!data) return sendError(res, 'Not found', 404);
        return send(res, mapper(data));
      }
      if (method === 'PUT') {
        const row = toRow(body, rid);
        delete row.id;
        await dbWrite(table, row, { mode: 'update', id: rid });
        const { data } = await supabase.from(table).select('*').eq('id', rid).maybeSingle();
        return send(res, mapper(data));
      }
      if (method === 'DELETE') {
        await supabase.from(table).delete().eq('id', rid);
        return send(res, { success: true });
      }
      return null;
    }

    if (path === '/employees' || path.startsWith('/employees/')) {
      const done = await handleCollection('employees', '/employees', mapEmployee, (b, rid) => ({
        id: rid || b.id || id('emp'),
        employee_code: b.employeeCode || b.employee_code || '',
        name: b.name || '',
        phone: b.phone || '',
        email: b.email || '',
        cnic: b.cnic || '',
        role: b.role || 'Staff',
        designation: b.designation || '',
        department: b.department || 'General',
        join_date: b.joinDate || b.join_date || '',
        end_date: b.endDate || b.end_date || '',
        valid_from: b.validFrom || b.valid_from || '',
        valid_until: b.validUntil || b.valid_until || '',
        salary: num(b.salary),
        status: b.status || 'Active',
        address: b.address || '',
        city: b.city || '',
        emergency_contact: b.emergencyContact || b.emergency_contact || '',
        emergency_phone: b.emergencyPhone || b.emergency_phone || '',
        notes: b.notes || '',
        photo: b.photo || b.image || '',
      }));
      if (done !== null) return done;
    }

    if (path === '/products' || path.startsWith('/products/')) {
      if (path === '/products' && method === 'GET') {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        await syncWebsiteCatalogFlags(data || []);
        return send(res, (data || []).map(mapProduct));
      }
      if (path === '/products/publish-website' && (method === 'POST' || method === 'PUT')) {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        const sync = await syncWebsiteCatalogFlags(data || []);
        const products = (data || []).map(mapProduct).filter((p) => isListedOnWebsite(p));
        return send(res, { ...sync, count: products.length, products });
      }
      if (path === '/products' && method === 'POST') {
        const row = productFromBody(body);
        if (!row.id) row.id = id('prod');
        await saveProductRow(row, { mode: 'insert' });
        const { data: created } = await supabase.from('products').select('*').eq('id', row.id).maybeSingle();
        await syncWebsiteCatalogFlags(created ? [created] : [row]);
        return send(res, mapProduct(created || row));
      }
      const rid = decodeURIComponent(String(path.split('/')[2] || '').trim());
      if (!rid) return sendError(res, 'Product id required', 400);
      if (path.split('/')[3] === 'variations' && (method === 'PUT' || method === 'PATCH' || method === 'POST')) {
        const variations = Array.isArray(body.variations) ? body.variations : [];
        const { data: existing } = await supabase.from('products').select('*').eq('id', rid).maybeSingle();
        if (!existing) return sendError(res, 'Not found', 404);
        await supabase.from('products').update({ variations }).eq('id', rid);
        const { data } = await supabase.from('products').select('*').eq('id', rid).maybeSingle();
        await syncWebsiteCatalogFlags(data ? [data] : [existing]);
        return send(res, mapProduct(data || { ...existing, variations }));
      }
      if (method === 'GET') {
        const { data } = await supabase.from('products').select('*').eq('id', rid).maybeSingle();
        if (!data) return sendError(res, 'Not found', 404);
        return send(res, mapProduct(data));
      }
      if (method === 'PUT' || method === 'PATCH') {
        const row = productFromBody(body, rid);
        delete row.id;
        await saveProductRow(row, { mode: 'update', id: rid });
        const { data } = await supabase.from('products').select('*').eq('id', rid).maybeSingle();
        await syncWebsiteCatalogFlags(data ? [data] : [{ ...row, id: rid }]);
        return send(res, mapProduct(data || row));
      }
      if (method === 'DELETE') {
        await supabase.from('products').delete().eq('id', rid);
        return send(res, { success: true });
      }
      return sendError(res, `Not found: ${path}`, 404);
    }

    if (path === '/vendors' || path.startsWith('/vendors/')) {
      if (method === 'GET' && path === '/vendors') {
        const [{ data }, { data: purchases }] = await Promise.all([
          supabase.from('vendors').select('*').order('created_at', { ascending: false }),
          supabase.from('purchases').select('*'),
        ]);
        return send(res, (data || []).map((v) => attachVendorPayables(v, purchases || [])));
      }
      if (method === 'GET' && /^\/vendors\/[^/]+$/.test(path)) {
        const vid = path.split('/')[2];
        const [{ data }, { data: purchases }] = await Promise.all([
          supabase.from('vendors').select('*').eq('id', vid).maybeSingle(),
          supabase.from('purchases').select('*'),
        ]);
        if (!data) return sendError(res, 'Not found', 404);
        return send(res, attachVendorPayables(data, purchases || []));
      }
      const done = await handleCollection('vendors', '/vendors', mapVendor, (b, rid) => ({
        id: rid || b.id || id('vend'),
        name: b.name || '',
        phone: b.phone || '',
        email: b.email || '',
        address: b.address || '',
        notes: b.notes || '',
        contact_person: b.contactPerson || '',
        category: b.category || '',
        payment_terms: b.paymentTerms || '',
        tax_id: b.taxId || '',
      }));
      if (done !== null) return done;
    }

    if (path === '/purchases' || path.startsWith('/purchases/')) {
      const payMatch = path.match(/^\/purchases\/([^/]+)\/pay$/);
      if (payMatch && method === 'POST') {
        const pid = decodeURIComponent(payMatch[1]);
        const { data: po } = await supabase.from('purchases').select('*').eq('id', pid).maybeSingle();
        if (!po) return sendError(res, 'Purchase not found', 404);
        const amount = num(body.amount);
        if (!(amount > 0)) return sendError(res, 'Enter a valid payment amount', 400);
        const paidAfter = num(po.paid_amount) + amount;
        const total = num(po.total);
        const status = paidAfter + 0.009 >= total ? 'Fully Paid' : 'Partial';
        await supabase.from('purchases').update({ paid_amount: paidAfter, status }).eq('id', po.id);
        const payRow = {
          id: id('pay'),
          date: body.date || today(),
          type: 'outflow',
          category: 'Vendor Payment',
          ref_id: po.purchase_no || po.id,
          customer_name: po.vendor_name || '',
          customer_id: po.vendor_id || '',
          amount,
          method: body.method || 'Cash',
          notes: body.notes || (`PO ${po.purchase_no || po.id}`),
          balance_due: Math.max(0, total - paidAfter),
          total_amount: total,
        };
        await supabase.from('payments').insert(payRow);
        const { data: refreshed } = await supabase.from('purchases').select('*').eq('id', po.id).maybeSingle();
        return send(res, { purchase: mapPurchase(refreshed), payment: mapPayment(payRow) });
      }
      const done = await handleCollection('purchases', '/purchases', mapPurchase, (b, rid) => {
        const items = Array.isArray(b.items) ? b.items : [];
        let total = num(b.total != null ? b.total : b.totalAmount);
        if (!(total > 0) && items.length) {
          total = items.reduce((s, it) => s + (num(it.quantity) * num(it.rate)), 0);
        }
        const year = new Date().getFullYear();
        const autoPo = `PO-${year}-${String(Date.now()).slice(-4)}`;
        return {
          id: rid || b.id || id('pur'),
          purchase_no: b.poNumber || b.purchaseNo || b.purchase_no || autoPo,
          date: b.purchaseDate || b.date || today(),
          vendor_id: b.vendorId || b.vendor_id || '',
          vendor_name: b.vendorName || b.vendor_name || '',
          vendor_invoice_number: b.vendorInvoiceNumber || '',
          expected_delivery_date: b.expectedDeliveryDate || '',
          actual_delivery_date: b.actualDeliveryDate || '',
          linked_order_id: b.linkedOrderId || '',
          items,
          total,
          paid_amount: num(b.paidAmount != null ? b.paidAmount : b.paid_amount),
          status: b.status || 'Draft',
          notes: b.notes || '',
        };
      });
      if (done !== null) return done;
    }

    if (path === '/expenses' || path.startsWith('/expenses/')) {
      const expParts = path.split('/').filter(Boolean);
      if (expParts[2] === 'approve' && method === 'POST') {
        if (!isAdminRole(user)) return sendError(res, 'Only Admin with Settings access can approve expenses', 403);
        const { data: prev } = await supabase.from('expenses').select('*').eq('id', expParts[1]).maybeSingle();
        if (!prev) return sendError(res, 'Expense not found', 404);
        const reject = body.approved === false || String(body.action || '').toLowerCase() === 'reject';
        await supabase.from('expenses').update({
          approved: !reject,
          approved_by: userLabel(user),
          approved_at: `${today()} ${nowTime()}`,
        }).eq('id', prev.id);
        const { data } = await supabase.from('expenses').select('*').eq('id', prev.id).maybeSingle();
        return send(res, mapExpense(data));
      }
      if (path === '/expenses' && method === 'POST') {
        const admin = isAdminRole(user);
        const row = {
          id: id('exp'),
          date: body.date || today(),
          category: body.category || '',
          amount: num(body.amount),
          description: body.description || '',
          payment_method: body.paymentMethod || body.method || '',
          paid_to: body.paidTo || '',
          notes: body.notes || '',
          approved: admin,
          approved_by: admin ? userLabel(user) : '',
          approved_at: admin ? `${today()} ${nowTime()}` : '',
        };
        await supabase.from('expenses').insert(row);
        return send(res, mapExpense(row));
      }
      const done = await handleCollection('expenses', '/expenses', mapExpense, (b, rid) => ({
        id: rid || b.id || id('exp'),
        date: b.date || today(),
        category: b.category || '',
        amount: num(b.amount),
        description: b.description || '',
        payment_method: b.paymentMethod || b.method || '',
        paid_to: b.paidTo || '',
        notes: b.notes || '',
      }));
      if (done !== null) return done;
    }

    if (path === '/payments' || path.startsWith('/payments/')) {
      const done = await handleCollection('payments', '/payments', mapPayment, (b, rid) => ({
        id: rid || b.id || id('pay'),
        date: b.date || today(),
        type: b.type || 'inflow',
        category: b.category || '',
        ref_id: b.refId || b.reference || '',
        customer_name: b.customerName || b.party || '',
        customer_id: b.customerId || '',
        party_phone: b.partyPhone || b.phone || b.customerPhone || '',
        amount: num(b.amount),
        method: b.method || '',
        notes: b.notes || '',
        balance_due: num(b.balanceDue),
        total_amount: num(b.totalAmount),
      }));
      if (done !== null) return done;
    }

    // Orders
    if (path === '/orders') {
      if (method === 'GET') {
        const [{ data }, { data: invoices }] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('invoices').select('*'),
        ]);
        const list = (data || []).filter((o) => String(o.doc_type || 'Order').toLowerCase() !== 'quotation');
        return send(res, list.map((o) => {
          const api = mapOrder(o);
          const keys = [api.orderId, api.id].filter(Boolean).map(String);
          const inv = (invoices || []).find((row) => {
            const ids = collectOrderIds({}, row);
            return keys.some((k) => ids.includes(k) || String(row.order_id) === k);
          });
          api.invoiceId = inv ? (inv.id || '') : '';
          api.invoiceNumber = inv ? (inv.invoice_no || '') : '';
          return api;
        }));
      }
      if (method === 'POST') {
        const docType = String(body.docType || body.doctype || 'Order').toLowerCase();
        if (docType === 'pos') {
          let posCust = null;
          if (body.customerId) {
            const { data } = await supabase.from('customers').select('*').eq('id', body.customerId).maybeSingle();
            if (data) posCust = mapCustomer(data);
          }
          if (!posCust) posCust = await ensureWalkIn();
          body.customerId = posCust.id;
          body.customerName = posCust.name || 'Walk-in';
          if (!body.customerPhone) body.customerPhone = posCust.phone || '';
        } else if (body.customerPhone || body.customerName) {
          const cust = await upsertCustomerFromOrder(body);
          if (cust) body.customerId = cust.id;
        }
        if (body.customerId) {
          const custRow = await loadCustomer(body.customerId);
          assertCustomerNotBlocked(custRow);
        }
        if (!body.trackingNumber) body.trackingNumber = await nextTrackingNumber();
        const row = orderFromBody(body);
        if (docType === 'pos') {
          const soldBy = String(body.soldBy || body.cashier || '').trim();
          if (soldBy && !/\bBy\s+/i.test(String(row.remarks || ''))) {
            row.remarks = `${row.remarks || 'POS Sale'} · By ${soldBy}`;
          }
        }
        if (!row.order_id) row.order_id = await nextOrderId(docType === 'pos' ? 'POS' : 'ORD');
        if (!row.status_history || !row.status_history.length) {
          row.status_history = [{ status: row.status, at: `${today()} ${nowTime()}`, note: 'Created' }];
        }
        const applyWanted = num(body.applyCredit != null ? body.applyCredit : body.creditApplied);
        if (applyWanted > 0 && row.customer_id && docType !== 'pos') {
          const due = Math.max(0, num(row.total_amount) - num(row.advance_payment));
          const adv = await applyCustomerAdvance({
            customerId: row.customer_id,
            amount: Math.min(applyWanted, due),
            orderId: row.order_id,
            notes: `Advance applied to order ${row.order_id}`,
            date: row.date,
          });
          if (adv.applied > 0) {
            row.advance_payment = num(row.advance_payment) + adv.applied;
            row.balance_amount = Math.max(0, num(row.total_amount) - num(row.advance_payment));
            row.remarks = `${row.remarks || ''}${row.remarks ? ' | ' : ''}Advance applied ${adv.applied}`.trim();
          }
        }
        if (docType !== 'pos' && isDeliveredStatus(row.status)) {
          return sendError(res, INVOICE_REQUIRED_MESSAGE, 400);
        }
        if (docType !== 'pos' && num(row.advance_payment) > 0) {
          return sendError(res, 'Create the invoice before recording an advance payment', 400);
        }
        await persistOrderStock(row, { isPos: docType === 'pos' });
        const { error } = await supabase.from('orders').insert(row);
        if (error) {
          try { await syncProductStock(row.products, []); } catch { /* keep original insert error */ }
          throw error;
        }
        const mapped = await withInvoiceMeta(mapOrder(row));
        mapped.creditApplied = num(body.applyCredit);
        if (row._invoiceError) mapped._invoiceError = row._invoiceError;
        if (row._invoiceNo) mapped.invoiceNumber = row._invoiceNo;
        if (row._invoiceId) mapped.invoiceId = row._invoiceId;
        return send(res, mapped);
      }
    }

    if (path === '/orders/restore-auto-deliveries' && method === 'POST') {
      if (!isAdminRole(user)) return sendError(res, 'Only an administrator can restore auto-delivered orders', 403);
      const result = await restoreIncorrectDeliveries(user);
      return send(res, { ok: true, ...result });
    }

    if (path.startsWith('/orders/')) {
      const oid = path.split('/')[2];
      const action = path.split('/')[3];
      const { data: existing } = await supabase.from('orders').select('*').eq('id', oid).maybeSingle();
      if (!existing && action !== 'duplicate') {
        // also try by order_id
        const { data: byCode } = await supabase.from('orders').select('*').eq('order_id', oid).maybeSingle();
        if (!byCode) return sendError(res, 'Order not found', 404);
        return await handleOrderByRow(byCode, action, method, body, res);
      }
      return await handleOrderByRow(existing, action, method, body, res);
    }

    async function handleOrderByRow(existing, action, method, body, res) {
      if (action === 'status' && (method === 'PATCH' || method === 'POST')) {
        const status = body.status || existing.status;
        if (isDeliveredStatus(status) || /^closed$/i.test(String(status))) {
          try {
            const delivered = await confirmManualDelivery(existing, user);
            return send(res, await withInvoiceMeta(mapOrder(delivered)));
          } catch (err) {
            return sendError(res, err.message, err.statusCode || 400);
          }
        }
        const hist = Array.isArray(existing.status_history) ? [...existing.status_history] : [];
        hist.push(buildHistoryEntry({
          status,
          at: `${today()} ${nowTime()}`,
          note: 'Status update',
          previousStatus: existing.status,
          by: userLabel(user),
          process: 'status-update',
        }));
        const wasCancelled = isCancelledStatus(existing.status);
        const nowCancelled = isCancelledStatus(status);
        const statusIsPos = String(existing.doc_type || '').toLowerCase() === 'pos';
        if (!wasCancelled && nowCancelled) await syncProductStock(existing.products, [], { allowShortage: true });
        if (wasCancelled && !nowCancelled) await persistOrderStock(existing, { isPos: statusIsPos, oldLines: [] });
        await supabase.from('orders').update({ status, status_history: hist }).eq('id', existing.id);
        const { data } = await supabase.from('orders').select('*').eq('id', existing.id).maybeSingle();
        return send(res, await withInvoiceMeta(mapOrder(data)));
      }
      if (action === 'deliver' && (method === 'PATCH' || method === 'POST')) {
        try {
          const delivered = await confirmManualDelivery(existing, user);
          return send(res, await withInvoiceMeta(mapOrder(delivered)));
        } catch (err) {
          return sendError(res, err.message, err.statusCode || 400);
        }
      }
      if (action === 'duplicate' && method === 'POST') {
        const copy = orderFromBody({ ...mapOrder(existing), id: undefined, orderId: undefined }, {});
        copy.id = id('order');
        copy.order_id = await nextOrderId();
        copy.tracking_number = await nextTrackingNumber();
        await supabase.from('orders').insert(copy);
        return send(res, mapOrder(copy));
      }
      if (action === 'invoice' && method === 'POST') {
        if (String(existing.doc_type || '').toLowerCase() === 'quotation') {
          return sendError(res, 'Quotations are estimates only. Convert to an order before creating an invoice.', 400);
        }
        const inv = await ensureOrderInvoice(existing);
        await markOrdersEligibleForDelivery(inv, user);
        const { data: refreshed } = await supabase.from('orders').select('*').eq('id', existing.id).maybeSingle();
        return send(res, await withInvoiceMeta(mapOrder(refreshed || existing)));
      }
      if (action === 'payment' && method === 'POST') {
        if (String(existing.doc_type || '').toLowerCase() === 'quotation') {
          return sendError(res, 'Quotations are estimates only. Convert to an order before recording payment.', 400);
        }
        const invoiceForPay = await findInvoiceHoldingOrder(existing);
        if (!invoiceForPay) {
          return sendError(res, 'Create the invoice before recording a payment. Payment is saved on the invoice.', 400);
        }
        const extra = num(body.amount);
        if (!(extra > 0)) {
          return send(res, { invoice: mapInvoice(invoiceForPay), order: await withInvoiceMeta(mapOrder(existing)) });
        }
        const invPayResult = await recordInvoicePayment(invoiceForPay.id, {
          ...body,
          orderId: existing.order_id || existing.id,
        }, user);
        return send(res, invPayResult);
      }
      if (method === 'GET') return send(res, await withInvoiceMeta(mapOrder(existing)));
      if (method === 'PUT') {
        const row = orderFromBody(body, existing);
        row.id = existing.id;
        if (!row.order_id) row.order_id = existing.order_id;
        if (isDeliveredStatus(row.status) || /^closed$/i.test(String(row.status))) {
          try {
            await assertOrderCanBeDelivered(existing);
            const delivered = await confirmManualDelivery({ ...existing, ...row, status: existing.status, status_history: existing.status_history }, user);
            row.status = delivered.status || 'Delivered';
            row.status_history = delivered.status_history || existing.status_history;
          } catch (err) {
            return sendError(res, err.message, err.statusCode || 400);
          }
        }
        if (num(row.advance_payment) > num(existing.advance_payment) && !(await findInvoiceHoldingOrder(existing))) {
          return sendError(res, 'Create the invoice before recording an advance payment', 400);
        }
        if (!isCancelledStatus(existing.status) && String(existing.doc_type || '').toLowerCase() !== 'quotation') {
          const putIsPos = String(row.doc_type || existing.doc_type || '').toLowerCase() === 'pos';
          if (isCancelledStatus(row.status)) {
            await syncProductStock(existing.products, [], { allowShortage: true });
          } else {
            await persistOrderStock(row, { isPos: putIsPos, oldLines: existing.products });
          }
        }
        await supabase.from('orders').update(row).eq('id', existing.id);
        return send(res, mapOrder(row));
      }
      if (method === 'DELETE') {
        if (!isCancelledStatus(existing.status) && String(existing.doc_type || '').toLowerCase() !== 'quotation') {
          await syncProductStock(existing.products, []);
        }
        await supabase.from('orders').delete().eq('id', existing.id);
        return send(res, { success: true });
      }
      return sendError(res, 'Method not allowed', 405);
    }

    // Quotations (subset of orders)
    if (path === '/quotations' || path.startsWith('/quotations/')) {
      if (path === '/quotations' && method === 'GET') {
        const { data } = await supabase.from('orders').select('*').eq('doc_type', 'Quotation').order('created_at', { ascending: false });
        return send(res, (data || []).map(mapOrder));
      }
      if (path === '/quotations' && method === 'POST') {
        body.docType = 'Quotation';
        if (!body.orderId) body.orderId = await nextOrderId('QTN');
        if (body.customerPhone || body.customerName) {
          const cust = await upsertCustomerFromOrder(body);
          if (cust) body.customerId = cust.id;
        }
        const row = orderFromBody(body);
        row.doc_type = 'Quotation';
        await supabase.from('orders').insert(row);
        return send(res, mapOrder(row));
      }
      const qid = path.split('/')[2];
      const { data: existing } = await supabase.from('orders').select('*').eq('id', qid).maybeSingle();
      if (!existing) return sendError(res, 'Not found', 404);
      if (method === 'GET') return send(res, mapOrder(existing));
      if (method === 'PUT') {
        const row = orderFromBody(body, existing);
        row.id = existing.id;
        row.doc_type = 'Quotation';
        await supabase.from('orders').update(row).eq('id', existing.id);
        return send(res, mapOrder(row));
      }
      if (method === 'DELETE') {
        await supabase.from('orders').delete().eq('id', existing.id);
        return send(res, { success: true });
      }
    }

    // Invoices
    if (path === '/invoices' || path.startsWith('/invoices/')) {
      if (path === '/invoices' && method === 'GET') {
        const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
        return send(res, (data || []).map(mapInvoice));
      }
      if (path === '/invoices' && method === 'POST') {
        if (body.customerId) {
          const custRow = await loadCustomer(body.customerId);
          assertCustomerNotBlocked(custRow);
        }
        const orderIds = collectOrderIds(body, {});
        const { data: allInv } = await supabase.from('invoices').select('id,order_id,order_ids');
        const clash = (allInv || []).find((inv) => {
          const ids = collectOrderIds({}, inv);
          return orderIds.some((oid) => ids.includes(oid));
        });
        if (clash) return sendError(res, `Order already on invoice ${clash.id}`, 400);
        const cashPaid = num(body.paidAmount != null ? body.paidAmount : body.paid);
        const row = {
          id: id('inv'),
          invoice_no: body.invoiceNumber || body.invoiceNo || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
          date: body.date || today(),
          due_date: body.dueDate || '',
          order_id: orderIds[0] || body.orderId || '',
          order_ids: orderIds,
          customer_id: body.customerId || '',
          customer_name: body.customerName || '',
          customer_phone: body.customerPhone || '',
          customer_email: body.customerEmail || '',
          customer_address: body.customerAddress || '',
          items: body.items || [],
          subtotal: num(body.subtotal),
          tax_rate: num(body.taxRate),
          tax: num(body.tax),
          discount: num(body.discount),
          previous_balance: num(body.previousBalance),
          total: num(body.totalAmount != null ? body.totalAmount : body.total),
          paid: 0,
          status: body.status || 'Unpaid',
          notes: body.notes || '',
          share_token: body.shareToken || `share_${Date.now().toString(36)}`,
          payment_history: [],
        };
        await supabase.from('invoices').insert(row);
        if (cashPaid > 0) {
          await recordInvoicePayment(row.id, {
            amount: cashPaid,
            method: body.method || 'Cash',
            notes: body.notes || `Payment recorded with invoice ${row.invoice_no}`,
            orderId: row.order_id,
            skipOrderSnapshot: true,
          }, user);
          row.paid = cashPaid;
          row.status = invoiceStatusFromPaid(num(row.total), cashPaid);
        }
        const applyWanted = num(body.applyCredit != null ? body.applyCredit : body.creditApplied);
        if (applyWanted > 0 && row.customer_id) {
          const due = Math.max(0, num(row.total) + num(row.previous_balance) - num(row.paid));
          const adv = await applyCustomerAdvance({
            customerId: row.customer_id,
            amount: Math.min(applyWanted, due),
            orderId: row.order_id,
            invoiceId: row.id,
            invoiceNo: row.invoice_no,
            date: row.date,
          });
          if (adv.applied > 0) {
            row.paid = num(row.paid) + adv.applied;
            row.status = invoiceStatusFromPaid(num(row.total) + num(row.previous_balance), row.paid);
            await supabase.from('invoices').update({ paid: row.paid, status: row.status }).eq('id', row.id);
          }
        }
        await markOrdersEligibleForDelivery(row, user);
        return send(res, mapInvoice(row));
      }
      if (path === '/invoices/combine' && method === 'POST') {
        const ids = Array.isArray(body.invoiceIds) ? body.invoiceIds : (Array.isArray(body.ids) ? body.ids : []);
        const merged = await combineOpenInvoices(ids);
        return send(res, mapInvoice(merged));
      }
      const iid = path.split('/')[2];
      const invAction = path.split('/')[3];
      if (invAction === 'add-order' && method === 'POST') {
        const { data: invoice } = await supabase.from('invoices').select('*').eq('id', decodeURIComponent(iid)).maybeSingle();
        if (!invoice) return sendError(res, 'Invoice not found', 404);
        if (!(invoiceRemaining(invoice) > 0.009) && /paid/i.test(String(invoice.status || ''))) {
          return sendError(res, 'Cannot add an order to a paid invoice', 400);
        }
        const order = await loadOrderByRef(body.orderId || body.order_id || body.id);
        if (!order) return sendError(res, 'Order not found', 404);
        if (String(order.doc_type || 'Order').toLowerCase() === 'quotation') {
          return sendError(res, 'Quotations cannot be added to an invoice', 400);
        }
        if (invoice.customer_id && order.customer_id && String(invoice.customer_id) !== String(order.customer_id)) {
          return sendError(res, 'Order belongs to a different customer', 400);
        }
        const holder = await findInvoiceHoldingOrder(order, invoice.id);
        if (holder) {
          return sendError(res, `Order already on invoice ${holder.invoice_no || holder.id}. Combine those invoices instead.`, 400);
        }
        const next = await addOrderOntoInvoice(invoice, order);
        return send(res, mapInvoice(next));
      }
      if (invAction === 'payment' && method === 'POST') {
        const result = await recordInvoicePayment(decodeURIComponent(iid), body, user);
        return send(res, result);
      }
      if (method === 'GET') {
        const { data } = await supabase.from('invoices').select('*').eq('id', iid).maybeSingle();
        if (!data) return sendError(res, 'Not found', 404);
        return send(res, mapInvoice(data));
      }
      if (method === 'PUT') {
        const updates = {
          invoice_no: body.invoiceNumber || body.invoiceNo,
          date: body.date,
          due_date: body.dueDate,
          order_id: body.orderId,
          order_ids: body.orderIds != null ? collectOrderIds(body, {}) : undefined,
          customer_id: body.customerId,
          customer_name: body.customerName,
          customer_phone: body.customerPhone,
          customer_email: body.customerEmail,
          customer_address: body.customerAddress,
          items: body.items,
          subtotal: body.subtotal != null ? num(body.subtotal) : undefined,
          tax_rate: body.taxRate != null ? num(body.taxRate) : undefined,
          tax: body.tax != null ? num(body.tax) : undefined,
          discount: body.discount != null ? num(body.discount) : undefined,
          previous_balance: body.previousBalance != null ? num(body.previousBalance) : undefined,
          total: body.totalAmount != null ? num(body.totalAmount) : (body.total != null ? num(body.total) : undefined),
          paid: body.paidAmount != null ? num(body.paidAmount) : (body.paid != null ? num(body.paid) : undefined),
          status: body.status,
          notes: body.notes,
        };
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await supabase.from('invoices').update(updates).eq('id', iid);
        const { data } = await supabase.from('invoices').select('*').eq('id', iid).maybeSingle();
        return send(res, mapInvoice(data));
      }
      if (method === 'DELETE') {
        await supabase.from('invoices').delete().eq('id', iid);
        return send(res, { success: true });
      }
    }

    if (path === '/designers' || path.startsWith('/designers/')) {
      const asDesigner = (e) => {
        const emp = mapEmployee(e);
        return {
          id: emp.id,
          name: emp.name,
          email: emp.email || '',
          phone: emp.phone || '',
          role: emp.role || 'Designer',
          designation: emp.designation || '',
          photo: emp.photo || '',
        };
      };
      const isDesignerEmp = (e) => {
        const status = String(e.status || 'Active').toLowerCase();
        if (status === 'inactive') return false;
        const blob = `${e.role || ''} ${e.designation || ''} ${e.department || ''}`.toLowerCase();
        return /design/.test(blob);
      };
      if (path === '/designers' && method === 'GET') {
        const { data } = await supabase.from('employees').select('*');
        let designers = (data || []).filter(isDesignerEmp);
        if (!designers.length) {
          designers = (data || []).filter((e) => String(e.status || 'Active').toLowerCase() !== 'inactive');
        }
        return send(res, designers.map(asDesigner));
      }
      if (path === '/designers' && method === 'POST') {
        const name = String(body.name || '').trim();
        if (!name) return sendError(res, 'Designer name is required', 400);
        const row = {
          id: id('emp'),
          employee_code: body.employeeCode || `DSG-${Date.now().toString().slice(-5)}`,
          name,
          phone: body.phone || '',
          email: body.email || '',
          role: 'Designer',
          designation: body.designation || 'Designer',
          department: body.department || 'Design',
          join_date: body.joinDate || today(),
          status: 'Active',
          notes: body.notes || 'Added from order form',
        };
        await supabase.from('employees').insert(row);
        return send(res, asDesigner(row));
      }
    }

    // Counters
    if (path === '/counters' && method === 'GET') {
      const counters = await ensureDefaultCounters();
      return send(res, (counters || []).map(mapCounterRow));
    }
    if (path === '/counters' && method === 'POST') {
      const row = {
        id: id('cnt'),
        counter_name: body.counterName || body.name || 'Counter',
        access_holder: body.accessHolder || '',
        prefix: body.prefix || 'T',
        last_number: num(body.lastNumber),
        status: body.status || 'Active',
      };
      await supabase.from('counters').insert(row);
      return send(res, row);
    }

    // Tokens meta + CRUD (simplified but functional)
    if (method === 'GET' && path === '/tokens/meta') {
      const [counters, { data: products }] = await Promise.all([
        ensureDefaultCounters(),
        supabase.from('products').select('*'),
      ]);
      return send(res, {
        counters: (counters || []).map(mapCounterRow),
        products: (products || []).map(mapProduct),
        services: [
          { name: 'Designing', counter: 'Table 01' },
          { name: 'Printing Services', counter: 'Table 01' },
          { name: 'NADRA Services', counter: 'Table 02' },
          { name: 'Photo Copy & Documents', counter: 'Table 03' },
          { name: 'PALS Fee & Information', counter: 'Executive Office' },
          { name: 'Payments', counter: 'Executive Office' },
          { name: 'Discussion', counter: 'Executive Office' },
          { name: 'Other Printing Services', counter: 'Executive Office' },
        ],
      });
    }

    if (path === '/tokens' && method === 'GET') {
      const { data } = await supabase.from('tokens').select('*').order('created_at', { ascending: false });
      const dateQ = req.query.date;
      const counterQ = req.query.counter;
      const list = (data || []).filter((row) => tokenMatchesDate(row, dateQ) && tokenMatchesCounter(row, counterQ));
      return send(res, list.map(mapToken));
    }

    if (path === '/tokens/call-next' && method === 'POST') {
      const counterName = String(body.counterName || body.counter || req.query.counter || '').trim();
      const { data } = await supabase.from('tokens').select('*').order('created_at', { ascending: true });
      const waiting = (data || []).filter((row) => {
        if (String(row.token_status || '').toLowerCase() !== 'waiting') return false;
        if (!tokenMatchesDate(row, 'today')) return false;
        return tokenMatchesCounter(row, counterName);
      });
      const tok = waiting[0];
      if (!tok) return sendError(res, 'No waiting token', 404);
      const updates = { token_status: 'Called', called_at: `${today()} ${nowTime()}` };
      await supabase.from('tokens').update(updates).eq('id', tok.id);
      const { data: updated } = await supabase.from('tokens').select('*').eq('id', tok.id).maybeSingle();
      return send(res, mapToken(updated || { ...tok, ...updates }));
    }

    if (path === '/tokens' && method === 'POST') {
      await ensureDefaultCounters();
      const counterName = body.counterName || body.counter || 'Table 01';
      let { data: counter } = await supabase.from('counters').select('*').eq('counter_name', counterName).maybeSingle();
      if (!counter) {
        counter = { id: id('cnt'), counter_name: counterName, prefix: 'T', last_number: 0, status: 'Active' };
        await supabase.from('counters').insert(counter);
      }
      const next = num(counter.last_number) + 1;
      await supabase.from('counters').update({ last_number: next }).eq('id', counter.id);
      const row = {
        id: id('tok'),
        token_no: `${counter.prefix || 'T'}${String(next).padStart(3, '0')}`,
        date: today(),
        time: nowTime(),
        customer_id: body.customerId || '',
        customer_name: body.customerName || '',
        customer_phone: body.customerPhone || '',
        service: body.service || '',
        service_note: body.serviceNote || '',
        token_status: 'Waiting',
        counter_name: counterName,
        notes: body.notes || '',
      };
      if (body.customerPhone || body.customerName) {
        const cust = await upsertCustomerFromOrder(body);
        if (cust) row.customer_id = cust.id;
      }
      await supabase.from('tokens').insert(row);
      return send(res, mapToken(row));
    }

    if (path.startsWith('/tokens/')) {
      const tid = path.split('/')[2];
      const action = path.split('/')[3];
      const tok = await findTokenRow(tid);
      if (!tok) return sendError(res, 'Token not found', 404);
      const statusMap = { call: 'Called', complete: 'Completed', skip: 'Skipped', progress: 'In Progress', cancel: 'Cancelled' };
      if (action === 'link-order' && method === 'POST') {
        await supabase.from('tokens').update({ order_id: body.orderId || '' }).eq('id', tok.id);
        const { data } = await supabase.from('tokens').select('*').eq('id', tok.id).maybeSingle();
        return send(res, mapToken(data || { ...tok, order_id: body.orderId || '' }));
      }
      if (action && statusMap[action] && method === 'POST') {
        const updates = { token_status: statusMap[action] };
        if (action === 'call') updates.called_at = `${today()} ${nowTime()}`;
        await supabase.from('tokens').update(updates).eq('id', tok.id);
        const { data } = await supabase.from('tokens').select('*').eq('id', tok.id).maybeSingle();
        return send(res, mapToken(data || { ...tok, ...updates }));
      }
      if (method === 'GET') {
        return send(res, mapToken(tok));
      }
    }

    if (path === '/reports' && method === 'GET') {
      const [orders, expenses, payments, invoices, customers] = await Promise.all([
        dbSelectSafe('orders', LEAN_ORDER_COLS),
        dbSelectSafe('expenses', LEAN_EXPENSE_COLS),
        dbSelectSafe('payments', 'id,date,type,amount,customer_id,party_phone'),
        dbSelectSafe('invoices', LEAN_INVOICE_COLS),
        dbSelectSafe('customers', 'id,phone,name,credit_balance'),
      ]);
      const realOrders = (orders || []).filter((o) => !isQuotation(o) && !isCancelledStatus(o.status));
      const revenue = realOrders.reduce((s, o) => s + num(o.total_amount), 0);
      const expenseSum = (expenses || []).filter(expenseIsApproved).reduce((s, e) => s + num(e.amount), 0);
      const receivables = computeCompanyReceivables(orders || [], invoices || [], customers || [], payments || []);
      return send(res, {
        period: req.query.period || 'month',
        summary: {
          totalOrders: realOrders.length,
          revenue,
          expenses: expenseSum,
          payments: (payments || []).reduce((s, p) => s + num(p.amount), 0),
          receivables,
          profit: revenue - expenseSum,
        },
      });
    }

    if (path.startsWith('/notifications/')) {
      return send(res, {
        ok: true,
        queued: false,
        sent: false,
        message: 'Open WhatsApp from the ERP buttons. SMTP email can be added later in environment settings.',
      });
    }

    if (path === '/tasks' || path.startsWith('/tasks/')) {
      const TASK_TABLE = 'internal_tasks';
      const TASK_KEY = 'internal_tasks';
      if (path === '/tasks' && method === 'GET') {
        const rows = await listRows(TASK_TABLE, TASK_KEY);
        return send(res, rows.map(mapTask).filter(Boolean));
      }
      if (path === '/tasks' && method === 'POST') {
        const title = String(body.title || '').trim();
        if (!title) return sendError(res, 'Task title is required', 400);
        const row = { ...taskFromBody(body, '', user), created_at: nowIso() };
        await insertRow(TASK_TABLE, TASK_KEY, row);
        return send(res, mapTask(row));
      }
      const tid = decodeURIComponent(String(path.split('/')[2] || '').trim());
      if (!tid) return sendError(res, 'Task id required', 400);
      if (path === `/tasks/${tid}/status` && (method === 'PATCH' || method === 'PUT' || method === 'POST')) {
        const status = String(body.status || '').trim();
        if (!status) return sendError(res, 'Status is required', 400);
        const updated = await updateRow(TASK_TABLE, TASK_KEY, tid, { status, updated_at: nowIso() });
        if (!updated) return sendError(res, 'Task not found', 404);
        return send(res, mapTask(updated));
      }
      if (method === 'GET') {
        const row = await getRow(TASK_TABLE, TASK_KEY, tid);
        if (!row) return sendError(res, 'Task not found', 404);
        return send(res, mapTask(row));
      }
      if (method === 'PUT' || method === 'PATCH') {
        const existing = await getRow(TASK_TABLE, TASK_KEY, tid);
        if (!existing) return sendError(res, 'Task not found', 404);
        const next = taskFromBody({
          title: body.title != null ? body.title : existing.title,
          description: body.description != null ? body.description : existing.description,
          assigneeId: body.assigneeId != null ? body.assigneeId : existing.assignee_id,
          assigneeName: body.assigneeName != null ? body.assigneeName : existing.assignee_name,
          priority: body.priority != null ? body.priority : existing.priority,
          status: body.status != null ? body.status : existing.status,
          deadline: body.deadline != null ? body.deadline : existing.deadline,
        }, tid, user);
        delete next.created_by;
        delete next.created_by_name;
        next.created_at = existing.created_at;
        const updated = await updateRow(TASK_TABLE, TASK_KEY, tid, next);
        return send(res, mapTask(updated || { ...existing, ...next }));
      }
      if (method === 'DELETE') {
        await deleteRow(TASK_TABLE, TASK_KEY, tid);
        return send(res, { success: true });
      }
    }

    if (path === '/broadcasts' || path.startsWith('/broadcasts/')) {
      const AD_TABLE = 'broadcasts';
      const AD_KEY = 'broadcasts';
      if (path === '/broadcasts' && method === 'GET') {
        const rows = await listRows(AD_TABLE, AD_KEY);
        const out = [];
        for (const row of rows) {
          const sends = await listSends(row.id);
          out.push(mapBroadcast(row, sends));
        }
        return send(res, out);
      }
      if (path === '/broadcasts' && method === 'POST') {
        const message = String(body.message || body.text || '').trim();
        if (!message) return sendError(res, 'Advertisement text is required', 400);
        const row = { ...broadcastFromBody(body, '', user), created_at: nowIso() };
        await insertRow(AD_TABLE, AD_KEY, row);
        return send(res, mapBroadcast(row, []));
      }
      const bid = decodeURIComponent(String(path.split('/')[2] || '').trim());
      if (!bid) return sendError(res, 'Broadcast id required', 400);
      const existingAd = await getRow(AD_TABLE, AD_KEY, bid);
      if (!existingAd && method !== 'DELETE') return sendError(res, 'Advertisement not found', 404);

      if (path === `/broadcasts/${bid}/sends` && method === 'GET') {
        const sends = await listSends(bid);
        return send(res, sends.map(mapBroadcastSend).filter(Boolean));
      }
      if (path === `/broadcasts/${bid}/send` && method === 'POST') {
        const sendRow = {
          id: opsId('adsend'),
          broadcast_id: bid,
          customer_id: String(body.customerId || body.customer_id || '').trim(),
          customer_name: String(body.customerName || body.customer_name || '').trim(),
          customer_phone: String(body.customerPhone || body.customer_phone || '').trim(),
          status: String(body.status || 'opened').trim() || 'opened',
          sent_at: nowIso(),
        };
        await insertSend(sendRow);
        return send(res, mapBroadcastSend(sendRow));
      }
      if (path === `/broadcasts/${bid}/whatsapp` && method === 'POST') {
        const phone = String(body.phone || body.customerPhone || '').trim();
        const result = await sendWhatsAppCloud({
          phone,
          text: existingAd.message || '',
          imageDataUrl: existingAd.image || '',
        });
        const sendRow = {
          id: opsId('adsend'),
          broadcast_id: bid,
          customer_id: String(body.customerId || '').trim(),
          customer_name: String(body.customerName || '').trim(),
          customer_phone: phone,
          status: result.ok ? (result.imageSent ? 'sent' : 'text_sent') : 'opened',
          sent_at: nowIso(),
        };
        await insertSend(sendRow);
        return send(res, {
          ...result,
          cloudConfigured: cloudConfigured(),
          send: mapBroadcastSend(sendRow),
        });
      }
      if (method === 'GET' && path === `/broadcasts/${bid}`) {
        const sends = await listSends(bid);
        return send(res, mapBroadcast(existingAd, sends));
      }
      if (method === 'PUT' || method === 'PATCH') {
        const next = broadcastFromBody({ ...existingAd, ...body }, bid, user);
        delete next.created_by;
        delete next.created_by_name;
        next.created_at = existingAd.created_at;
        const updated = await updateRow(AD_TABLE, AD_KEY, bid, next);
        const sends = await listSends(bid);
        return send(res, mapBroadcast(updated || { ...existingAd, ...next }, sends));
      }
      if (method === 'DELETE') {
        await deleteRow(AD_TABLE, AD_KEY, bid);
        return send(res, { success: true });
      }
    }

    if (path === '/debug/schema' && method === 'GET') {
      const tables = ['users', 'customers', 'crm_notes', 'employees', 'products', 'orders', 'invoices', 'vendors', 'purchases', 'expenses', 'payments', 'counters', 'tokens', 'settings', 'internal_tasks', 'broadcasts', 'broadcast_sends'];
      const counts = {};
      for (const t of tables) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        counts[t] = error ? { error: error.message } : count;
      }
      return send(res, { backend: 'supabase', counts });
    }

    if (path === '/files/upload' && method === 'POST') {
      return send(res, { ok: true, url: body.url || body.image || '', message: 'Store Drive URLs on the product/employee record. Binary upload is not used on Supabase.' });
    }

    if (path === '/debug/prepare' && method === 'POST') {
      await ensureWalkIn();
      return send(res, { ok: true, message: 'Supabase ready — schema assumed applied' });
    }

    return sendError(res, `Not found: ${path}`, 404);
  } catch (err) {
    console.error(err);
    return sendError(res, err.message || String(err), 500);
  }
}

module.exports = { dispatch };
