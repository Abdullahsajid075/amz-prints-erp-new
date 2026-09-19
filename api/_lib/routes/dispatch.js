const { supabase } = require('../db');
const { handleLogin, validateToken, sanitizeUser } = require('../lib/auth');
const { id, today, nowTime, num, truthy, send, sendError } = require('../lib/util');
const {
  mapCustomer, mapOrder, mapProduct, mapInvoice, mapEmployee,
  mapVendor, mapPayment, mapExpense, mapPurchase, mapUser, mapToken,
} = require('../lib/mappers');
const {
  isAdminRole, userLabel, collectOrderIds, invoiceStatusFromPaid,
  makePortalPassword, checkPortalPassword, issueCustomerToken, parseCustomerToken,
  sanitizePortalCustomer, isBlocked, productFromBody,
} = require('../lib/helpers');

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
  } else {
    apiOrder.invoiceId = '';
    apiOrder.invoiceNumber = '';
  }
  return apiOrder;
}

async function findOrCreateInvoiceForOrder(order) {
  const { data: invoices } = await supabase.from('invoices').select('*');
  const keys = [order.order_id, order.id].filter(Boolean).map(String);
  const existing = (invoices || []).find((row) => {
    const ids = collectOrderIds({}, row);
    return keys.some((k) => ids.includes(k) || String(row.order_id) === k);
  });
  if (existing) return existing;
  const unpaid = (invoices || []).find((row) =>
    String(row.customer_id) === String(order.customer_id)
    && num(row.paid) === 0
    && String(order.customer_id || '') !== 'cust_walkin'
  );
  if (unpaid && String(order.doc_type || '').toLowerCase() !== 'pos') {
    const ids = collectOrderIds({ orderId: order.order_id || order.id }, unpaid);
    await supabase.from('invoices').update({
      order_id: ids[0] || unpaid.order_id,
      order_ids: ids,
    }).eq('id', unpaid.id);
    return { ...unpaid, order_ids: ids, order_id: ids[0] || unpaid.order_id };
  }
  const total = num(order.total_amount);
  const paid = num(order.advance_payment);
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
    paid,
    status: invoiceStatusFromPaid(total, paid),
    notes: '',
    share_token: `share_${Date.now().toString(36)}`,
    payment_history: [],
  };
  await supabase.from('invoices').insert(row);
  return row;
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

  let linkedOrder = null;
  const snapRef = body.orderId || body.linkedOrderId;
  const ids = collectOrderIds({ orderId: snapRef }, inv);
  const orderKey = snapRef || (ids.length === 1 ? ids[0] : '');
  if (orderKey && !body.skipOrderSnapshot) {
    let { data: order } = await supabase.from('orders').select('*').eq('id', orderKey).maybeSingle();
    if (!order) {
      const { data: byCode } = await supabase.from('orders').select('*').eq('order_id', orderKey).maybeSingle();
      order = byCode;
    }
    if (order) {
      const advance = num(order.advance_payment) + applied;
      const total = num(order.total_amount);
      await supabase.from('orders').update({
        advance_payment: advance,
        balance_amount: Math.max(0, total - advance),
      }).eq('id', order.id);
      const { data: refreshed } = await supabase.from('orders').select('*').eq('id', order.id).maybeSingle();
      linkedOrder = refreshed;
    }
  }

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
  const { data } = await supabase.from('orders').select('order_id').order('created_at', { ascending: false }).limit(200);
  let max = 0;
  (data || []).forEach((r) => {
    const m = String(r.order_id || '').match(/(\d+)\s*$/);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
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
        const pipeline = ['Order Received', 'Designing', 'Proof Approval', 'Printing', 'Finishing', 'Packing', 'Ready', 'Delivered'];
        const status = String(api.status || '');
        const cancelled = status.toLowerCase() === 'cancelled';
        let idx = cancelled ? -1 : pipeline.indexOf(status);
        const timeline = pipeline.map((s, i) => ({
          status: s,
          done: !cancelled && idx >= 0 && i <= idx,
          current: !cancelled && s === status,
        }));
        return send(res, {
          orderId: api.orderId,
          trackingNumber: api.trackingNumber || api.orderId,
          status: api.status,
          cancelled,
          customerName: api.customerName,
          products: (api.products || []).map((p) => ({ name: p.name || '' })).filter((p) => p.name),
          timeline,
          trackCode: api.trackingNumber || api.orderId || api.id,
          companyNote: 'For questions, contact Amazon Printing Services with your Order ID.',
        });
      }
      if (method === 'GET' && path === '/public/products') {
        const { data } = await supabase.from('products').select('*');
        const products = (data || []).map(mapProduct).filter((p) => p && p.active && p.showOnWebsite);
        products.sort((a, b) => Number(!!b.showOnTop) - Number(!!a.showOnTop) || String(a.name).localeCompare(String(b.name)));
        return send(res, { products });
      }
      if (method === 'GET' && path.startsWith('/public/products/')) {
        const pid = decodeURIComponent(path.replace('/public/products/', '')).trim();
        const { data } = await supabase.from('products').select('*').eq('id', pid).maybeSingle();
        if (!data) return sendError(res, 'Product not found', 404);
        const pub = mapProduct(data);
        if (!pub || !pub.active || !pub.showOnWebsite) return sendError(res, 'Product not available', 404);
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
        const existingEmail = (allCust || []).find((c) => String(c.email || '').trim().toLowerCase() === regEmail && c.portal_password);
        if (existingEmail) return sendError(res, 'An account with this email already exists — please login', 400);
        const existingPhone = (allCust || []).find((c) => String(c.phone || '').replace(/\D/g, '') === regPhone.replace(/\D/g, ''));
        const portal = makePortalPassword(regPass);
        let customer = existingPhone;
        if (existingPhone) {
          await supabase.from('customers').update({
            name: regName || existingPhone.name,
            email: regEmail || existingPhone.email,
            address: body.address || existingPhone.address || '',
            portal_password: portal,
            notify_email: true,
            notify_whatsapp: true,
          }).eq('id', existingPhone.id);
          customer = { ...existingPhone, name: regName || existingPhone.name, email: regEmail, portal_password: portal };
        } else {
          customer = {
            id: id('cust'),
            name: regName,
            phone: regPhone,
            email: regEmail,
            address: body.address || '',
            city: body.city || '',
            notes: 'Website portal account',
            in_crm: false,
            notify_whatsapp: true,
            notify_email: true,
            portal_password: portal,
          };
          await supabase.from('customers').insert(customer);
        }
        return send(res, { ok: true, token: issueCustomerToken(customer), customer: sanitizePortalCustomer(customer) });
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
        if (!loginCust || !loginCust.portal_password) return sendError(res, 'Invalid login or account not registered online', 401);
        if (!checkPortalPassword(loginCust.portal_password, loginPass)) {
          return sendError(res, 'Invalid email/phone or password', 401);
        }
        return send(res, { ok: true, token: issueCustomerToken(loginCust), customer: sanitizePortalCustomer(loginCust) });
      }
      if ((method === 'GET' || method === 'POST') && path === '/public/customer/me') {
        const meTok = String(body.token || body.customerToken || req.query.token || '').trim();
        const payload = parseCustomerToken(meTok);
        if (!payload) return sendError(res, 'Unauthorized', 401);
        const me = await loadCustomer(payload.id);
        if (!me) return sendError(res, 'Unauthorized', 401);
        return send(res, { ok: true, customer: sanitizePortalCustomer(me) });
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
          if (!api.active || !api.showOnWebsite) return sendError(res, `Product not available: ${api.name}`, 400);
          const rate = num(api.effectivePrice);
          subtotal += rate * qty;
          products.push({
            productId: api.id,
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
        row.tracking_number = `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
        row.status_history = [{ status: row.status, at: `${today()} ${nowTime()}`, note: 'Website order' }];
        await supabase.from('orders').insert(row);
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
        const dk = String(raw || '').trim().slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dk)) return false;
        if (from && dk < from) return false;
        if (to && dk > to) return false;
        return true;
      };
      const [{ data: orders }, { data: customers }, { data: expenses }, { data: purchases }] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('customers').select('id'),
        supabase.from('expenses').select('*'),
        supabase.from('purchases').select('*'),
      ]);
      const realOrders = (orders || []).filter((o) => (
        String(o.doc_type || 'Order').toLowerCase() !== 'quotation' && inRange(o.date)
      ));
      const expenseRows = (expenses || []).filter((e) => inRange(e.date));
      const purchaseRows = (purchases || []).filter((p) => inRange(p.date));
      const revenue = realOrders.reduce((s, o) => s + num(o.total_amount), 0);
      const expenseSum = expenseRows.reduce((s, e) => s + num(e.amount), 0);
      const payables = purchaseRows.reduce((s, p) => {
        const status = String(p.status || '').toLowerCase();
        if (status.includes('cancel')) return s;
        if (status.includes('fully paid') || status === 'paid') return s;
        return s + Math.max(0, num(p.total) - num(p.paid_amount));
      }, 0);
      const statusMap = {};
      realOrders.forEach((o) => {
        const key = o.status || 'Unknown';
        statusMap[key] = (statusMap[key] || 0) + 1;
      });
      const stats = {
        totalOrders: realOrders.length,
        pendingOrders: realOrders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length,
        completedOrders: realOrders.filter((o) => o.status === 'Delivered').length,
        revenue,
        expenses: expenseSum,
        receivables: realOrders.reduce((s, o) => s + num(o.balance_amount), 0),
        payables,
        vendorPayables: payables,
        activeCustomers: (customers || []).length,
        from: from || '',
        to: to || '',
      };
      if (path === '/dashboard/bootstrap') {
        return send(res, {
          stats,
          recentOrders: realOrders.slice(-8).reverse().map(mapOrder),
          charts: {
            monthlySales: [],
            orderStatus: Object.keys(statusMap).map((name) => ({ name, value: statusMap[name] })),
          },
          attention: [],
        });
      }
      return send(res, stats);
    }
    if (method === 'GET' && path === '/dashboard/charts') return send(res, { sales: [], expenses: [] });
    if (method === 'GET' && path === '/dashboard/recent-orders') {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20);
      return send(res, (data || []).filter((o) => String(o.doc_type || '').toLowerCase() !== 'quotation').map(mapOrder));
    }

    // Settings
    if (path === '/settings') {
      if (method === 'GET') return send(res, await getSettingsObject());
      if (method === 'PUT' || method === 'POST') return send(res, await saveSettingsObject(body));
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
        const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        return send(res, (data || []).map(mapCustomer));
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
            notes: body.notes || existing.notes,
          };
          if (body.inCrm === true) {
            updates.in_crm = true;
            updates.stage = body.stage || existing.stage || 'lead';
            updates.stage_updated_at = new Date().toISOString();
          }
          await supabase.from('customers').update(updates).eq('id', existing.id);
          const { data } = await supabase.from('customers').select('*').eq('id', existing.id).maybeSingle();
          return send(res, mapCustomer(data));
        }
        const row = {
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
        };
        await supabase.from('customers').insert(row);
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
        const { data: invoices } = await supabase.from('invoices').select('*').eq('customer_id', cid);
        const open = (invoices || [])
          .filter((inv) => num(inv.total) - num(inv.paid) > 0.009)
          .sort((a, b) => String(a.date).localeCompare(String(b.date)));
        if (!open.length) {
          await supabase.from('customers').update({
            credit_balance: num(customer.credit_balance) + amount,
          }).eq('id', cid);
          const payRow = {
            id: id('pay'),
            date: body.date || today(),
            type: 'inflow',
            category: 'Customer Credit',
            ref_id: customer.id,
            customer_name: customer.name,
            customer_id: customer.id,
            party_phone: customer.phone,
            amount,
            method: body.method || 'Cash',
            notes: body.notes || 'Unallocated customer payment',
            balance_due: 0,
            total_amount: amount,
          };
          await supabase.from('payments').insert(payRow);
          return send(res, { customer: mapCustomer({ ...customer, credit_balance: num(customer.credit_balance) + amount }), payment: mapPayment(payRow) });
        }
        const result = await recordInvoicePayment(open[0].id, { ...body, amount }, user);
        return send(res, result);
      }
      if (parts[2] === 'ledger' && method === 'GET') {
        const { data: customer } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        if (!customer) return sendError(res, 'Customer not found', 404);
        const phone = String(customer.phone || '');
        const [{ data: orders }, { data: invoices }, { data: payments }] = await Promise.all([
          supabase.from('orders').select('*'),
          supabase.from('invoices').select('*'),
          supabase.from('payments').select('*'),
        ]);
        const relatedOrders = (orders || []).filter((o) =>
          String(o.customer_id) === String(cid) || (phone && String(o.customer_phone) === phone)
        );
        const relatedInvoices = (invoices || []).filter((inv) =>
          String(inv.customer_id) === String(cid) || (phone && String(inv.customer_phone) === phone)
        );
        const relatedPayments = (payments || []).filter((p) =>
          String(p.customer_id) === String(cid) || (phone && String(p.customer_phone) === phone)
        );
        return send(res, {
          customer: mapCustomer(customer),
          invoices: relatedInvoices.map(mapInvoice),
          orders: relatedOrders.map(mapOrder),
          payments: relatedPayments.map(mapPayment),
          totalBilled: relatedOrders.reduce((s, o) => s + num(o.total_amount), 0),
          totalPaid: relatedOrders.reduce((s, o) => s + num(o.advance_payment), 0)
            + relatedPayments.reduce((s, p) => s + num(p.amount), 0),
          outstanding: relatedOrders.reduce((s, o) => s + num(o.balance_amount), 0),
        });
      }
      if (method === 'GET') {
        const { data } = await supabase.from('customers').select('*').eq('id', cid).maybeSingle();
        if (!data) return sendError(res, 'Customer not found', 404);
        return send(res, mapCustomer(data));
      }
      if (method === 'PUT') {
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
        await supabase.from('customers').update(updates).eq('id', cid);
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
        const { error } = await supabase.from(table).insert(row);
        if (error) throw error;
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
        await supabase.from(table).update(row).eq('id', rid);
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
      const done = await handleCollection('products', '/products', mapProduct, (b, rid) => {
        const row = productFromBody(b, rid);
        if (!row.id) row.id = id('prod');
        return row;
      });
      if (done !== null) return done;
    }

    if (path === '/vendors' || path.startsWith('/vendors/')) {
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
        party_phone: b.partyPhone || '',
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
        if (!body.trackingNumber) body.trackingNumber = `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
        const row = orderFromBody(body);
        if (!row.order_id) row.order_id = await nextOrderId(docType === 'pos' ? 'POS' : 'ORD');
        if (!row.status_history || !row.status_history.length) {
          row.status_history = [{ status: row.status, at: `${today()} ${nowTime()}`, note: 'Created' }];
        }
        const { error } = await supabase.from('orders').insert(row);
        if (error) throw error;
        return send(res, await withInvoiceMeta(mapOrder(row)));
      }
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
        const hist = Array.isArray(existing.status_history) ? [...existing.status_history] : [];
        hist.push({ status, at: `${today()} ${nowTime()}`, note: 'Status update' });
        await supabase.from('orders').update({ status, status_history: hist }).eq('id', existing.id);
        const { data } = await supabase.from('orders').select('*').eq('id', existing.id).maybeSingle();
        return send(res, mapOrder(data));
      }
      if (action === 'duplicate' && method === 'POST') {
        const copy = orderFromBody({ ...mapOrder(existing), id: undefined, orderId: undefined }, {});
        copy.id = id('order');
        copy.order_id = await nextOrderId();
        copy.tracking_number = `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
        await supabase.from('orders').insert(copy);
        return send(res, mapOrder(copy));
      }
      if (action === 'payment' && method === 'POST') {
        if (String(existing.doc_type || '').toLowerCase() === 'quotation') {
          return sendError(res, 'Quotations are estimates only. Convert to an order before recording payment.', 400);
        }
        const invoiceForPay = await findOrCreateInvoiceForOrder(existing);
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
        await supabase.from('orders').update(row).eq('id', existing.id);
        return send(res, mapOrder(row));
      }
      if (method === 'DELETE') {
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
          paid: num(body.paidAmount != null ? body.paidAmount : body.paid),
          status: body.status || 'Unpaid',
          notes: body.notes || '',
          share_token: body.shareToken || `share_${Date.now().toString(36)}`,
          payment_history: [],
        };
        await supabase.from('invoices').insert(row);
        return send(res, mapInvoice(row));
      }
      const iid = path.split('/')[2];
      const invAction = path.split('/')[3];
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

    // Designers from HR employees (role Designer)
    if (path === '/designers' && method === 'GET') {
      const { data } = await supabase.from('employees').select('*');
      const designers = (data || []).filter((e) => {
        const role = String(e.role || '').toLowerCase();
        const status = String(e.status || 'Active').toLowerCase();
        return status !== 'inactive' && role.includes('designer');
      });
      return send(res, designers.map((e) => {
        const emp = mapEmployee(e);
        return {
          id: emp.id,
          name: emp.name,
          email: emp.email || '',
          phone: emp.phone || '',
          role: emp.role || 'Designer',
          photo: emp.photo || '',
        };
      }));
    }

    // Counters
    if (path === '/counters' && method === 'GET') {
      const { data } = await supabase.from('counters').select('*');
      return send(res, (data || []).map((c) => ({
        id: c.id,
        counterName: c.counter_name,
        accessHolder: c.access_holder,
        prefix: c.prefix,
        lastNumber: c.last_number,
        status: c.status,
        recordType: 'Counter',
      })));
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
      const [{ data: counters }, { data: products }] = await Promise.all([
        supabase.from('counters').select('*'),
        supabase.from('products').select('*'),
      ]);
      return send(res, {
        counters: (counters || []).map((c) => ({
          id: c.id, counterName: c.counter_name, accessHolder: c.access_holder, prefix: c.prefix, lastNumber: c.last_number, status: c.status, recordType: 'Counter',
        })),
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
      return send(res, (data || []).map(mapToken));
    }

    if (path === '/tokens' && method === 'POST') {
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
      return send(res, {
        id: row.id, tokenNo: row.token_no, date: row.date, time: row.time,
        customerName: row.customer_name, customerPhone: row.customer_phone,
        service: row.service, tokenStatus: row.token_status, counterName: row.counter_name, recordType: 'Token',
      });
    }

    if (path.startsWith('/tokens/')) {
      const tid = path.split('/')[2];
      const action = path.split('/')[3];
      const { data: tok } = await supabase.from('tokens').select('*').eq('id', tid).maybeSingle();
      if (!tok) return sendError(res, 'Token not found', 404);
      const statusMap = { call: 'Called', complete: 'Completed', skip: 'Skipped', progress: 'In Progress', cancel: 'Cancelled' };
      if (action === 'link-order' && method === 'POST') {
        await supabase.from('tokens').update({ order_id: body.orderId || '' }).eq('id', tid);
        const { data } = await supabase.from('tokens').select('*').eq('id', tid).maybeSingle();
        return send(res, { id: data.id, tokenNo: data.token_no, tokenStatus: data.token_status, orderId: data.order_id });
      }
      if (action && statusMap[action] && method === 'POST') {
        const updates = { token_status: statusMap[action] };
        if (action === 'call') updates.called_at = `${today()} ${nowTime()}`;
        await supabase.from('tokens').update(updates).eq('id', tid);
        const { data } = await supabase.from('tokens').select('*').eq('id', tid).maybeSingle();
        return send(res, { id: data.id, tokenNo: data.token_no, tokenStatus: data.token_status, orderId: data.order_id });
      }
      if (method === 'GET') {
        return send(res, {
          id: tok.id, tokenNo: tok.token_no, tokenStatus: tok.token_status,
          customerName: tok.customer_name, service: tok.service, counterName: tok.counter_name,
        });
      }
    }

    if (path === '/reports' && method === 'GET') {
      const [{ data: orders }, { data: expenses }, { data: payments }] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('payments').select('*'),
      ]);
      const realOrders = (orders || []).filter((o) => String(o.doc_type || 'Order').toLowerCase() !== 'quotation');
      const revenue = realOrders.reduce((s, o) => s + num(o.total_amount), 0);
      const expenseSum = (expenses || []).reduce((s, e) => s + num(e.amount), 0);
      return send(res, {
        period: req.query.period || 'month',
        summary: {
          totalOrders: realOrders.length,
          revenue,
          expenses: expenseSum,
          payments: (payments || []).reduce((s, p) => s + num(p.amount), 0),
          receivables: realOrders.reduce((s, o) => s + num(o.balance_amount), 0),
          profit: revenue - expenseSum,
        },
      });
    }

    if (path.startsWith('/notifications/')) {
      return send(res, {
        ok: true,
        queued: true,
        message: 'Email/WhatsApp from Node is not wired; configure SMTP later. GAS reminders stay on the old backend until cutover.',
      });
    }

    if (path === '/debug/schema' && method === 'GET') {
      const tables = ['users', 'customers', 'crm_notes', 'employees', 'products', 'orders', 'invoices', 'vendors', 'purchases', 'expenses', 'payments', 'counters', 'tokens', 'settings'];
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
