const { supabase } = require('../db');
const { handleLogin, validateToken, sanitizeUser } = require('../lib/auth');
const { id, today, nowTime, num, truthy, send, sendError } = require('../lib/util');
const {
  mapCustomer, mapOrder, mapProduct, mapInvoice, mapEmployee,
  mapVendor, mapPayment, mapExpense, mapPurchase, mapUser,
} = require('../lib/mappers');

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
      return sendError(res, 'Not found', 404);
    }

    // Auth required
    const user = await validateToken(token);
    if (!user) return sendError(res, 'Unauthorized', 401);

    if (method === 'GET' && path === '/auth/me') return send(res, sanitizeUser(user));
    if (method === 'POST' && path === '/auth/logout') return send(res, { success: true });

    // Dashboard
    if (method === 'GET' && (path === '/dashboard/stats' || path === '/dashboard/bootstrap')) {
      const [{ data: orders }, { data: customers }, { data: expenses }, { data: purchases }] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('customers').select('id'),
        supabase.from('expenses').select('amount'),
        supabase.from('purchases').select('total,paid_amount,status'),
      ]);
      const realOrders = (orders || []).filter((o) => String(o.doc_type || 'Order').toLowerCase() !== 'quotation');
      const revenue = realOrders.reduce((s, o) => s + num(o.total_amount), 0);
      const expenseSum = (expenses || []).reduce((s, e) => s + num(e.amount), 0);
      const payables = (purchases || []).reduce((s, p) => {
        const status = String(p.status || '').toLowerCase();
        if (status.includes('cancel')) return s;
        if (status.includes('fully paid') || status === 'paid') return s;
        return s + Math.max(0, num(p.total) - num(p.paid_amount));
      }, 0);
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
      };
      if (path === '/dashboard/bootstrap') {
        return send(res, {
          stats,
          recentOrders: realOrders.slice(-8).reverse().map(mapOrder),
          charts: { sales: [], expenses: [] },
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
        name: b.name || '',
        phone: b.phone || '',
        email: b.email || '',
        role: b.role || 'Staff',
        department: b.department || 'General',
        join_date: b.joinDate || b.join_date || '',
        salary: num(b.salary),
        status: b.status || 'Active',
        address: b.address || '',
        notes: b.notes || '',
      }));
      if (done !== null) return done;
    }

    if (path === '/products' || path.startsWith('/products/')) {
      const done = await handleCollection('products', '/products', mapProduct, (b, rid) => ({
        id: rid || b.id || id('prod'),
        name: b.name || '',
        category: b.category || '',
        rate: num(b.rate != null ? b.rate : b.basePrice),
        unit: b.unit || '',
        description: b.description || '',
        status: b.status || 'Active',
        product_type: b.productType || b.product_type || 'Product',
        designer: b.designer || '',
        stock: num(b.stock),
        material: b.material || '',
        size: b.size || '',
        min_quantity: num(b.minQuantity),
      }));
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
      const done = await handleCollection('purchases', '/purchases', mapPurchase, (b, rid) => ({
        id: rid || b.id || id('pur'),
        purchase_no: b.purchaseNo || b.purchase_no || '',
        date: b.date || today(),
        vendor_id: b.vendorId || '',
        vendor_name: b.vendorName || '',
        items: b.items || [],
        total: num(b.total != null ? b.total : b.totalAmount),
        paid_amount: num(b.paidAmount != null ? b.paidAmount : b.paid_amount),
        status: b.status || 'Pending',
      }));
      if (done !== null) return done;
    }

    if (path === '/expenses' || path.startsWith('/expenses/')) {
      const done = await handleCollection('expenses', '/expenses', mapExpense, (b, rid) => ({
        id: rid || b.id || id('exp'),
        date: b.date || today(),
        category: b.category || '',
        amount: num(b.amount),
        description: b.description || '',
        payment_method: b.paymentMethod || b.method || '',
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
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        return send(res, (data || [])
          .filter((o) => String(o.doc_type || 'Order').toLowerCase() !== 'quotation')
          .map(mapOrder));
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
        if (!body.trackingNumber) body.trackingNumber = `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
        const row = orderFromBody(body);
        if (!row.order_id) row.order_id = await nextOrderId(docType === 'pos' ? 'POS' : 'ORD');
        if (!row.status_history || !row.status_history.length) {
          row.status_history = [{ status: row.status, at: `${today()} ${nowTime()}`, note: 'Created' }];
        }
        const { error } = await supabase.from('orders').insert(row);
        if (error) throw error;
        return send(res, mapOrder(row));
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
      if (method === 'GET') return send(res, mapOrder(existing));
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
        const row = {
          id: id('inv'),
          invoice_no: body.invoiceNumber || body.invoiceNo || `INV-${Date.now().toString().slice(-6)}`,
          date: body.date || today(),
          due_date: body.dueDate || '',
          order_id: body.orderId || '',
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
        };
        await supabase.from('invoices').insert(row);
        return send(res, mapInvoice(row));
      }
      const iid = path.split('/')[2];
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

    // Designers (from users)
    if (path === '/designers' && method === 'GET') {
      const { data } = await supabase.from('users').select('*');
      let designers = (data || []).filter((u) => String(u.role || '').toLowerCase().includes('designer') && isActive(u));
      if (!designers.length) designers = (data || []).filter(isActive);
      return send(res, designers.map((u) => ({
        id: u.id || u.username,
        name: u.name || u.username,
        email: u.email || '',
        role: u.role || '',
      })));
    }

    function isActive(u) {
      const s = String(u.status || 'Active').toLowerCase();
      return s !== 'inactive';
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
      return send(res, (data || []).map((t) => ({
        id: t.id,
        tokenNo: t.token_no,
        date: t.date,
        time: t.time,
        customerId: t.customer_id,
        customerName: t.customer_name,
        customerPhone: t.customer_phone,
        service: t.service,
        serviceNote: t.service_note,
        tokenStatus: t.token_status,
        calledAt: t.called_at,
        orderId: t.order_id,
        notes: t.notes,
        counterName: t.counter_name,
        recordType: 'Token',
      })));
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
      return send(res, { ok: true, message: 'Notification queued (configure email on Hostinger if needed)' });
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
