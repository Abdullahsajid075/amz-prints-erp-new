/**
 * AMZ Prints ERP — Google Apps Script API
 *
 * Sheets used (existing only):
 * Orders, Products, Customers, Invoices, Vendors, Users,
 * Purchases, Expenses, Payments, Counters, Settings
 *
 * Counters sheet stores BOTH:
 *   RecordType=Counter  → counter definitions (name, access holder, prefix, last #)
 *   RecordType=Token    → token bookings / live queue
 *
 * Deploy: New version after every change. Execute as Me | Anyone.
 */

var SHEET_NAMES = {
  USERS: 'Users',
  ORDERS: 'Orders',
  CUSTOMERS: 'Customers',
  PRODUCTS: 'Products',
  INVOICES: 'Invoices',
  VENDORS: 'Vendors',
  PURCHASES: 'Purchases',
  EXPENSES: 'Expenses',
  PAYMENTS: 'Payments',
  COUNTERS: 'Counters',
  SETTINGS: 'Settings',
};

var DEFAULT_HEADERS = {
  Users: ['Username', 'Password', 'Name', 'Role', 'Status', 'Permissions'],
  Customers: ['Id', 'Name', 'Phone', 'Email', 'Address', 'City', 'Notes'],
  Orders: [
    'Id', 'OrderId', 'Date', 'CustomerId', 'CustomerName', 'CustomerPhone',
    'CustomerEmail', 'CustomerAddress', 'Status', 'DeliveryDate', 'Products',
    'TotalAmount', 'AdvancePayment', 'BalanceAmount', 'Remarks', 'AssignedDesigner', 'TokenNo',
    'DocType', 'TrackingNumber', 'StatusHistory', 'DeliveryAddress', 'QuotationId'
  ],
  Products: ['Id', 'Name', 'Category', 'Rate', 'Unit', 'Description', 'Status', 'ProductType', 'Designer', 'Stock', 'Material', 'Size', 'MinQuantity'],
  Invoices: ['Id', 'InvoiceNo', 'Date', 'CustomerId', 'CustomerName', 'CustomerPhone', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Paid', 'Status', 'ShareToken'],
  Vendors: ['Id', 'Name', 'Phone', 'Email', 'Address', 'Notes'],
  Purchases: ['Id', 'PurchaseNo', 'Date', 'VendorId', 'VendorName', 'Items', 'Total', 'Status'],
  Expenses: ['Id', 'Date', 'Category', 'Amount', 'Description', 'PaymentMethod'],
  Payments: ['Id', 'Date', 'Type', 'RefId', 'CustomerName', 'Amount', 'Method', 'Notes'],
  Counters: [
    'RecordType', 'CounterName', 'AccessHolder', 'Prefix', 'LastNumber', 'Status',
    'TokenNo', 'Date', 'Time', 'CustomerId', 'CustomerName', 'CustomerPhone',
    'Service', 'TokenStatus', 'CalledAt', 'OrderId', 'Notes'
  ],
  Settings: ['Key', 'Value'],
};

function getSpreadsheetId_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Set SPREADSHEET_ID in Script properties');
  return id;
}

/** Reuse one Spreadsheet open per request (big speed win). */
var _ssCache = null;
function getSpreadsheet_() {
  if (!_ssCache) {
    _ssCache = SpreadsheetApp.openById(getSpreadsheetId_());
  }
  return _ssCache;
}

function getSheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

function cacheKey_(sheetName) {
  return 'sheet_' + sheetName;
}

function invalidateSheetCache_(sheetName) {
  try {
    CacheService.getScriptCache().remove(cacheKey_(sheetName));
  } catch (err) {}
}

/**
 * Cached sheet rows (30s). Avoids re-reading Sheets on every API call.
 */
function getSheetRows_(sheetName) {
  var cache = CacheService.getScriptCache();
  var key = cacheKey_(sheetName);
  try {
    var hit = cache.get(key);
    if (hit) return JSON.parse(hit);
  } catch (err) {}

  var rows = sheetToObjects_(getSheet_(sheetName), sheetName);
  try {
    // CacheService max ~100KB per entry; store what fits
    var payload = JSON.stringify(rows);
    if (payload.length < 90000) {
      cache.put(key, payload, 30);
    }
  } catch (err) {}
  return rows;
}

function jsonResponse_(payload, statusCode) {
  var body = payload;
  if (statusCode) {
    body = Object.assign({}, payload, { _status: statusCode });
  }
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseAuthToken_(e) {
  if (e.parameter && e.parameter.token) return String(e.parameter.token);
  var headers = e.headers || {};
  var auth = headers.Authorization || headers.authorization || '';
  var match = String(auth).match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : '';
}

function getPath_(e) {
  return (e.parameter && e.parameter.path) ? String(e.parameter.path) : '/';
}

function getMethod_(e) {
  if (e.parameter && e.parameter._method) return String(e.parameter._method).toUpperCase();
  return e.postData ? 'POST' : 'GET';
}

function parseBody_(e) {
  if (!e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return {};
  }
}

function normalizeHeader_(header) {
  var key = String(header || '').trim().toLowerCase().replace(/[\s_\-]+/g, '');
  var aliases = {
    username: 'username', user: 'username', userid: 'id', id: 'id',
    email: 'email', password: 'password', pass: 'password',
    name: 'name', fullname: 'name', customername: 'customername',
    phone: 'phone', mobile: 'phone', phoneno: 'phone', contact: 'phone', customerphone: 'customerphone',
    address: 'address', customeraddress: 'customeraddress', city: 'city', notes: 'notes', remarks: 'remarks',
    role: 'role', status: 'status', category: 'category', rate: 'rate',
    baseprice: 'rate', price: 'rate', producttype: 'producttype', designer: 'designer',
    stock: 'stock', material: 'material', size: 'size', minquantity: 'minquantity',
    doctype: 'doctype', trackingnumber: 'trackingnumber', statushistory: 'statushistory',
    deliveryaddress: 'deliveryaddress', quotationid: 'quotationid',
    unit: 'unit', description: 'description',
    orderid: 'orderid', date: 'date', time: 'time', deliverydate: 'deliverydate',
    products: 'products', items: 'items', totalamount: 'totalamount', total: 'total',
    advancepayment: 'advancepayment', balanceamount: 'balanceamount', assigneddesigner: 'assigneddesigner',
    customerid: 'customerid', customeremail: 'customeremail', tokenno: 'tokenno',
    recordtype: 'recordtype', type: 'recordtype', countername: 'countername', counter: 'countername',
    accessholder: 'accessholder', holder: 'accessholder', prefix: 'prefix', lastnumber: 'lastnumber',
    lasttoken: 'lastnumber', service: 'service', tokenstatus: 'tokenstatus', calledat: 'calledat',
    invoiceno: 'invoiceno', sharetoken: 'sharetoken', key: 'key', value: 'value',
    amount: 'amount', method: 'method', paymentmethod: 'paymentmethod', vendorname: 'vendorname',
    vendorid: 'vendorid', purchaseno: 'purchaseno', refid: 'refid',
  };
  return aliases[key] || key;
}

function serializeCell_(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function parseCell_(value) {
  if (typeof value !== 'string') return value;
  var trimmed = value.trim();
  if ((trimmed.charAt(0) === '[' || trimmed.charAt(0) === '{') && trimmed.length > 1) {
    try { return JSON.parse(trimmed); } catch (e) { return value; }
  }
  return value;
}

function readHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastRow < 1 || lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h || '').trim(); });
}

/**
 * READ-ONLY: never mutates the sheet (safe for login / GET).
 */
function getRawHeaders_(sheet, sheetName) {
  var headers = readHeaders_(sheet).filter(function (h) { return h !== ''; });
  if (headers.length) return headers;
  return (DEFAULT_HEADERS[sheetName] || ['Id', 'Name']).slice();
}

/**
 * WRITE path only: add missing columns without wiping data.
 */
function ensureHeaders_(sheet, sheetName) {
  var defaults = DEFAULT_HEADERS[sheetName] || ['Id', 'Name'];
  var raw = readHeaders_(sheet);
  var existing = raw.filter(function (h) { return h !== ''; });

  if (!existing.length) {
    sheet.getRange(1, 1, 1, defaults.length).setValues([defaults]);
    SpreadsheetApp.flush();
    return defaults.slice();
  }

  var existingNorm = existing.map(normalizeHeader_);
  var nextCol = raw.length + 1; // append after physical last header slot
  // Prefer appending after last non-empty header index
  for (var i = raw.length - 1; i >= 0; i--) {
    if (raw[i]) {
      nextCol = i + 2;
      break;
    }
  }

  defaults.forEach(function (header) {
    var norm = normalizeHeader_(header);
    if (existingNorm.indexOf(norm) === -1) {
      sheet.getRange(1, nextCol).setValue(header);
      existing.push(header);
      existingNorm.push(norm);
      nextCol++;
    }
  });

  SpreadsheetApp.flush();
  return existing;
}

function sheetToObjects_(sheet, sheetName) {
  if (!sheet) return [];
  var headers = getRawHeaders_(sheet, sheetName || sheet.getName());
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow, headers.length).getValues();
  var normalized = headers.map(normalizeHeader_);

  return values
    .filter(function (row) {
      return row.some(function (cell) { return cell !== '' && cell !== null; });
    })
    .map(function (row, rowIndex) {
      var obj = { _row: rowIndex + 2 };
      normalized.forEach(function (header, i) {
        if (!header) return;
        obj[header] = parseCell_(row[i]);
      });
      if (!obj.id) {
        obj.id = obj.orderid || obj.tokenno || obj.username || obj.email || obj.phone || obj.name || ('row_' + obj._row);
      }
      if (!obj.email && obj.username) obj.email = obj.username;
      if (!obj.customername && obj.name) obj.customername = obj.name;
      if (!obj.phone && obj.customerphone) obj.phone = obj.customerphone;
      return obj;
    });
}

function valueForHeader_(obj, rawHeader) {
  var key = normalizeHeader_(rawHeader);
  if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
    return serializeCell_(obj[key]);
  }

  // Extra aliases so existing sheet labels still receive values
  var fallbacks = {
    countername: ['counter', 'countername', 'name'],
    name: ['name', 'customername', 'fullname'],
    phone: ['phone', 'customerphone', 'mobile'],
    customername: ['customername', 'name'],
    customerphone: ['customerphone', 'phone', 'mobile'],
    tokenstatus: ['tokenstatus', 'status'],
    status: ['status', 'tokenstatus'],
    service: ['service', 'product', 'products'],
  };

  var keys = fallbacks[key] || [key];
  for (var i = 0; i < keys.length; i++) {
    if (obj[keys[i]] !== undefined && obj[keys[i]] !== null && obj[keys[i]] !== '') {
      return serializeCell_(obj[keys[i]]);
    }
  }
  return '';
}

function appendObject_(sheet, sheetName, obj) {
  var headers = ensureHeaders_(sheet, sheetName);
  var row = headers.map(function (h) { return valueForHeader_(obj, h); });
  // Guard: refuse silent empty writes
  var hasValue = row.some(function (cell) { return cell !== '' && cell !== null; });
  if (!hasValue) {
    throw new Error('Nothing written to ' + sheetName + ' — check sheet column headers match API fields');
  }
  sheet.appendRow(row);
  SpreadsheetApp.flush();
  invalidateSheetCache_(sheetName);
  return obj;
}

function updateObjectProps_(sheet, sheetName, rowNumber, updates) {
  var headers = getRawHeaders_(sheet, sheetName);
  headers.forEach(function (rawHeader, i) {
    var key = normalizeHeader_(rawHeader);
    if (updates[key] !== undefined) {
      sheet.getRange(rowNumber, i + 1).setValue(serializeCell_(updates[key]));
    }
  });
  SpreadsheetApp.flush();
  invalidateSheetCache_(sheetName);
}

function deleteRow_(sheet, rowNumber, sheetName) {
  sheet.deleteRow(rowNumber);
  SpreadsheetApp.flush();
  if (sheetName) invalidateSheetCache_(sheetName);
}

function findById_(rows, id) {
  var needle = String(id);
  return rows.findIndex(function (r) {
    return String(r.id) === needle || String(r.orderid) === needle || String(r.tokenno) === needle;
  });
}

function nowDate_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Karachi', 'yyyy-MM-dd');
}

function nowTime_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Karachi', 'HH:mm:ss');
}

function pad_(n, width) {
  var s = String(n);
  while (s.length < width) s = '0' + s;
  return s;
}

/* ===================== AUTH ===================== */

function sanitizeUser_(user) {
  if (!user) return null;
  return {
    id: String(user.id || user.username || user.email || ''),
    name: user.name || user.username || '',
    email: user.email || user.username || '',
    role: user.role || 'Admin',
  };
}

function isActiveUser_(user) {
  var status = String(user.status || 'active').trim().toLowerCase();
  return !status || status === 'active' || status === 'enabled' || status === '1' || status === 'true';
}

function handleLogin_(body) {
  var email = String(body.email || body.username || '').trim();
  var password = String(body.password || '');
  var users = getSheetRows_(SHEET_NAMES.USERS);
  var loginId = email.toLowerCase();

  var user = users.find(function (u) {
    if (!isActiveUser_(u)) return false;
    var identifiers = [u.email, u.username, u.name, u.id]
      .map(function (v) { return String(v || '').trim().toLowerCase(); })
      .filter(Boolean);
    return identifiers.indexOf(loginId) !== -1 && String(u.password || '').trim() === password.trim();
  });

  if (!user) return { error: 'Invalid credentials' };

  var userId = String(user.id || user.username || user.email);
  var token = Utilities.base64EncodeWebSafe(JSON.stringify({
    id: userId,
    email: user.email || user.username,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  }));

  return { token: token, user: sanitizeUser_(user) };
}

function validateToken_(token) {
  if (!token) return null;
  try {
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(token)).getDataAsString());
    if (payload.exp && Date.now() > payload.exp) return null;
    var users = getSheetRows_(SHEET_NAMES.USERS);
    var payloadId = String(payload.id || '').toLowerCase();
    return users.find(function (u) {
      if (!isActiveUser_(u)) return false;
      var ids = [u.id, u.username, u.email]
        .map(function (v) { return String(v || '').trim().toLowerCase(); })
        .filter(Boolean);
      return ids.indexOf(payloadId) !== -1;
    }) || null;
  } catch (err) {
    return null;
  }
}

/* ===================== CUSTOMERS ===================== */

function normalizeCustomer_(body) {
  return {
    id: body.id || '',
    name: body.name || body.customername || '',
    phone: String(body.phone || body.customerphone || '').trim(),
    email: body.email || body.customeremail || '',
    address: body.address || body.customeraddress || '',
    city: body.city || '',
    notes: body.notes || '',
  };
}

function findCustomerByPhone_(phone) {
  var cleaned = String(phone || '').replace(/\D/g, '');
  if (!cleaned) return null;
  var customers = getSheetRows_(SHEET_NAMES.CUSTOMERS);
  return customers.find(function (c) {
    var p = String(c.phone || '').replace(/\D/g, '');
    return p && (p === cleaned || p.slice(-10) === cleaned.slice(-10));
  }) || null;
}

function upsertCustomer_(body) {
  var data = normalizeCustomer_(body);
  if (!data.name && !data.phone) throw new Error('Customer name or phone required');

  var sheet = getSheet_(SHEET_NAMES.CUSTOMERS);
  var existing = data.phone ? findCustomerByPhone_(data.phone) : null;

  if (existing) {
    var updates = {
      name: data.name || existing.name,
      phone: data.phone || existing.phone,
      email: data.email || existing.email,
      address: data.address || existing.address,
      city: data.city || existing.city,
      notes: data.notes || existing.notes,
    };
    updateObjectProps_(sheet, SHEET_NAMES.CUSTOMERS, existing._row, updates);
    return Object.assign({}, existing, updates, { id: existing.id });
  }

  data.id = data.id || ('cust_' + Date.now());
  appendObject_(sheet, SHEET_NAMES.CUSTOMERS, data);
  return data;
}

function handleCustomers_(path, method, body) {
  var sheet = getSheet_(SHEET_NAMES.CUSTOMERS);
  var customers = getSheetRows_(SHEET_NAMES.CUSTOMERS);

  if (path.endsWith('/ledger')) {
    var ledgerId = path.split('/')[2];
    var customer = customers.find(function (c) { return String(c.id) === String(ledgerId); });
    if (!customer) throw new Error('Customer not found');
    var orders = getSheetRows_(SHEET_NAMES.ORDERS).filter(function (o) {
      return String(o.customerid) === String(customer.id) || String(o.customerphone) === String(customer.phone);
    });
    return {
      customer: customer,
      invoices: [],
      orders: orders,
      payments: [],
      totalBilled: orders.reduce(function (s, o) { return s + Number(o.totalamount || 0); }, 0),
      totalPaid: orders.reduce(function (s, o) { return s + Number(o.advancepayment || 0); }, 0),
      outstanding: orders.reduce(function (s, o) { return s + Number(o.balanceamount || 0); }, 0),
    };
  }

  if (path === '/customers') {
    if (method === 'GET') {
      return customers.map(function (c) {
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          city: c.city,
          notes: c.notes,
        };
      });
    }
    if (method === 'POST') return upsertCustomer_(body);
  }

  var id = path.split('/')[2];
  var index = findById_(customers, id);
  if (index < 0) throw new Error('Customer not found');

  if (method === 'GET') return customers[index];
  if (method === 'PUT') {
    var updates = normalizeCustomer_(Object.assign({}, customers[index], body));
    updates.id = customers[index].id;
    updateObjectProps_(sheet, SHEET_NAMES.CUSTOMERS, customers[index]._row, updates);
    return updates;
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, customers[index]._row, SHEET_NAMES.CUSTOMERS);
    return { success: true };
  }
  throw new Error('Method not allowed');
}

/* ===================== ORDERS ===================== */

function nextOrderId_() {
  var orders = getSheetRows_(SHEET_NAMES.ORDERS);
  var max = 0;
  orders.forEach(function (o) {
    var m = String(o.orderid || '').match(/(\d+)/);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return 'ORD-' + pad_(max + 1, 4);
}

function normalizeOrder_(body, existing) {
  existing = existing || {};
  var products = body.products || body.items || existing.products || [];
  return {
    id: body.id || existing.id || ('order_' + Date.now()),
    orderid: body.orderId || body.orderid || existing.orderid || nextOrderId_(),
    date: body.date || existing.date || nowDate_(),
    customerid: body.customerId || body.customerid || existing.customerid || '',
    customername: body.customerName || body.customername || existing.customername || '',
    customerphone: body.customerPhone || body.customerphone || existing.customerphone || '',
    customeremail: body.customerEmail || body.customeremail || existing.customeremail || '',
    customeraddress: body.customerAddress || body.customeraddress || existing.customeraddress || '',
    status: body.status || existing.status || 'Order Received',
    deliverydate: body.deliveryDate || body.deliverydate || existing.deliverydate || '',
    products: products,
    totalamount: Number(body.totalAmount != null ? body.totalAmount : (body.totalamount != null ? body.totalamount : existing.totalamount || 0)),
    advancepayment: Number(body.advancePayment != null ? body.advancePayment : (body.advancepayment != null ? body.advancepayment : existing.advancepayment || 0)),
    balanceamount: Number(body.balanceAmount != null ? body.balanceAmount : (body.balanceamount != null ? body.balanceamount : existing.balanceamount || 0)),
    remarks: body.remarks || existing.remarks || '',
    assigneddesigner: body.assignedDesigner || body.assigneddesigner || existing.assigneddesigner || '',
    tokenno: body.tokenNo || body.tokenno || existing.tokenno || '',
    doctype: body.docType || body.doctype || existing.doctype || 'Order',
    trackingnumber: body.trackingNumber || body.trackingnumber || existing.trackingnumber || '',
    statushistory: body.statusHistory || body.statushistory || existing.statushistory || [],
    deliveryaddress: body.deliveryAddress || body.deliveryaddress || existing.deliveryaddress || '',
    quotationid: body.quotationId || body.quotationid || existing.quotationid || '',
  };
}

function toApiOrder_(o) {
  return {
    id: o.id,
    orderId: o.orderid,
    date: o.date,
    customerId: o.customerid,
    customerName: o.customername,
    customerPhone: o.customerphone,
    customerEmail: o.customeremail,
    customerAddress: o.customeraddress,
    status: o.status,
    deliveryDate: o.deliverydate,
    products: Array.isArray(o.products) ? o.products : [],
    totalAmount: Number(o.totalamount || 0),
    advancePayment: Number(o.advancepayment || 0),
    balanceAmount: Number(o.balanceamount || 0),
    remarks: o.remarks || '',
    assignedDesigner: o.assigneddesigner || '',
    tokenNo: o.tokenno || '',
    docType: o.doctype || 'Order',
    trackingNumber: o.trackingnumber || '',
    statusHistory: Array.isArray(o.statushistory) ? o.statushistory : (o.statushistory ? o.statushistory : []),
    deliveryAddress: o.deliveryaddress || '',
    quotationId: o.quotationid || '',
  };
}


function handleQuotations_(path, method, body) {
  var sheet = getSheet_(SHEET_NAMES.ORDERS);
  var orders = getSheetRows_(SHEET_NAMES.ORDERS);
  var quotations = orders.filter(function (o) {
    return String(o.doctype || '').toLowerCase() === 'quotation';
  });

  if (path === '/quotations') {
    if (method === 'GET') return quotations.map(toApiOrder_);

    if (method === 'POST') {
      if (body.customerPhone || body.customerName) {
        var cust = upsertCustomer_({
          name: body.customerName,
          phone: body.customerPhone,
          email: body.customerEmail,
          address: body.customerAddress,
        });
        body.customerId = cust.id;
      }
      body.docType = 'Quotation';
      body.doctype = 'Quotation';
      if (!body.status) body.status = 'Draft';
      if (!body.trackingNumber && !body.trackingnumber) {
        body.trackingNumber = 'TRK-' + String(Math.floor(1000 + Math.random() * 9000));
      }
      var record = normalizeOrder_(body);
      record.doctype = 'Quotation';
      var hist = record.statushistory;
      if (!hist || (Array.isArray(hist) && hist.length === 0) || hist === '') {
        record.statushistory = [{
          status: record.status || 'Draft',
          at: nowDate_() + ' ' + nowTime_(),
          note: 'Quotation created',
        }];
      }
      appendObject_(sheet, SHEET_NAMES.ORDERS, record);
      return toApiOrder_(record);
    }
    throw new Error('Method not allowed');
  }

  // /quotations/:id
  var id = path.split('/')[2];
  var index = findById_(orders, id);
  if (index < 0) throw new Error('Quotation not found');
  if (String(orders[index].doctype || '').toLowerCase() !== 'quotation') {
    throw new Error('Not a quotation');
  }

  if (method === 'GET') return toApiOrder_(orders[index]);
  if (method === 'PUT') {
    var updated = normalizeOrder_(body, orders[index]);
    updated.id = orders[index].id;
    updated.orderid = orders[index].orderid;
    updated.doctype = 'Quotation';
    updateObjectProps_(sheet, SHEET_NAMES.ORDERS, orders[index]._row, updated);
    return toApiOrder_(updated);
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, orders[index]._row, SHEET_NAMES.ORDERS);
    return { success: true };
  }
  throw new Error('Method not allowed');
}

/* ===================== USERS ===================== */

function parsePermissions_(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw;
  try {
    var parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function toApiUser_(u, includePassword) {
  var out = {
    id: String(u.id || u.username || ''),
    username: u.username || u.email || '',
    name: u.name || '',
    role: u.role || 'Sales',
    status: u.status || 'Active',
    permissions: parsePermissions_(u.permissions),
  };
  if (includePassword) out.password = u.password || '';
  return out;
}

function handleUsers_(path, method, body) {
  var sheet = getSheet_(SHEET_NAMES.USERS);
  ensureHeaders_(sheet, SHEET_NAMES.USERS);
  var users = getSheetRows_(SHEET_NAMES.USERS);

  if (path === '/users') {
    if (method === 'GET') {
      return users.map(function (u) { return toApiUser_(u, true); });
    }
    if (method === 'POST') {
      var username = String(body.username || body.email || '').trim();
      if (!username) throw new Error('Username required');
      var exists = users.some(function (u) {
        return String(u.username || u.email || '').toLowerCase() === username.toLowerCase();
      });
      if (exists) throw new Error('Username already exists');
      var record = {
        username: username,
        password: String(body.password || ''),
        name: body.name || username,
        role: body.role || 'Sales',
        status: body.status || 'Active',
        permissions: Array.isArray(body.permissions) || Array.isArray(body.menus)
          ? JSON.stringify(body.permissions || body.menus || [])
          : (body.permissions || '[]'),
        id: body.id || ('user_' + Date.now()),
      };
      appendObject_(sheet, SHEET_NAMES.USERS, record);
      return toApiUser_(record, true);
    }
    throw new Error('Method not allowed');
  }

  var id = path.split('/')[2];
  var index = users.findIndex(function (u) {
    return String(u.id || '') === String(id)
      || String(u.username || '').toLowerCase() === String(id).toLowerCase()
      || String(u.email || '').toLowerCase() === String(id).toLowerCase();
  });
  if (index < 0) throw new Error('User not found');

  if (method === 'GET') return toApiUser_(users[index], true);
  if (method === 'PUT') {
    var updates = {
      username: body.username != null ? body.username : users[index].username,
      password: body.password != null && body.password !== '' ? body.password : users[index].password,
      name: body.name != null ? body.name : users[index].name,
      role: body.role != null ? body.role : users[index].role,
      status: body.status != null ? body.status : users[index].status,
      permissions: body.permissions != null || body.menus != null
        ? JSON.stringify(body.permissions || body.menus || [])
        : users[index].permissions,
    };
    updateObjectProps_(sheet, SHEET_NAMES.USERS, users[index]._row, updates);
    return toApiUser_(Object.assign({}, users[index], updates), true);
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, users[index]._row, SHEET_NAMES.USERS);
    return { success: true };
  }
  throw new Error('Method not allowed');
}

function handleOrders_(method, body) {
  var sheet = getSheet_(SHEET_NAMES.ORDERS);
  var orders = getSheetRows_(SHEET_NAMES.ORDERS);

  if (method === 'GET') {
    return orders.filter(function (o) {
      var dt = String(o.doctype || 'Order').toLowerCase();
      return dt !== 'quotation';
    }).map(toApiOrder_);
  }

  if (method === 'POST') {
    // Auto upsert customer from order fields
    if (body.customerPhone || body.customerName) {
      var cust = upsertCustomer_({
        name: body.customerName,
        phone: body.customerPhone,
        email: body.customerEmail,
        address: body.customerAddress,
      });
      body.customerId = cust.id;
    }
    if (!body.trackingNumber && !body.trackingnumber) {
      body.trackingNumber = 'TRK-' + String(Math.floor(1000 + Math.random() * 9000));
    }
    var record = normalizeOrder_(body);
    if (!record.doctype) record.doctype = 'Order';
    var hist = record.statushistory;
    if (!hist || (Array.isArray(hist) && hist.length === 0) || hist === '') {
      record.statushistory = [{
        status: record.status || 'Order Received',
        at: nowDate_() + ' ' + nowTime_(),
        note: 'Created',
      }];
    }
    appendObject_(sheet, SHEET_NAMES.ORDERS, record);
    return toApiOrder_(record);
  }
  throw new Error('Method not allowed');
}

function handleOrderById_(path, method, body) {
  var sheet = getSheet_(SHEET_NAMES.ORDERS);
  var orders = getSheetRows_(SHEET_NAMES.ORDERS);
  var id = path.split('/')[2];
  var index = findById_(orders, id);

  if (path.indexOf('/duplicate') !== -1 && method === 'POST') {
    if (index < 0) throw new Error('Order not found');
    var copy = normalizeOrder_(Object.assign({}, toApiOrder_(orders[index]), {
      id: 'order_' + Date.now(),
      orderId: nextOrderId_(),
    }));
    appendObject_(sheet, SHEET_NAMES.ORDERS, copy);
    return toApiOrder_(copy);
  }

  if (path.indexOf('/status') !== -1 && (method === 'PATCH' || method === 'POST')) {
    if (index < 0) throw new Error('Order not found');
    updateObjectProps_(sheet, SHEET_NAMES.ORDERS, orders[index]._row, { status: body.status });
    orders[index].status = body.status;
    return toApiOrder_(orders[index]);
  }

  if (index < 0) throw new Error('Order not found');

  if (method === 'GET') return toApiOrder_(orders[index]);
  if (method === 'PUT') {
    var updated = normalizeOrder_(body, orders[index]);
    updated.id = orders[index].id;
    updated.orderid = orders[index].orderid;
    updateObjectProps_(sheet, SHEET_NAMES.ORDERS, orders[index]._row, updated);
    return toApiOrder_(updated);
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, orders[index]._row, SHEET_NAMES.ORDERS);
    return { success: true };
  }
  throw new Error('Method not allowed');
}

/* ===================== GENERIC COLLECTION ===================== */

function handleCollection_(sheetName, path, method, body, basePath) {
  var sheet = getSheet_(sheetName);
  var rows = getSheetRows_(sheetName);

  if (path === basePath) {
    if (method === 'GET') return rows;
    if (method === 'POST') {
      var record = Object.assign({ id: sheetName.toLowerCase().slice(0, -1) + '_' + Date.now() }, body);
      // flatten common camelCase
      if (body.name) record.name = body.name;
      appendObject_(sheet, sheetName, record);
      return record;
    }
  }

  var id = path.split('/')[2];
  var index = findById_(rows, id);
  if (index < 0) throw new Error('Not found');

  if (method === 'GET') return rows[index];
  if (method === 'PUT') {
    var updates = Object.assign({}, rows[index], body);
    updateObjectProps_(sheet, sheetName, rows[index]._row, updates);
    return updates;
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, rows[index]._row, sheetName);
    return { success: true };
  }
  throw new Error('Method not allowed');
}

/* ===================== COUNTERS + TOKENS ===================== */

function isCounterRow_(row) {
  var type = String(row.recordtype || '').toLowerCase();
  if (type === 'token') return false;
  if (type === 'counter') return true;
  // Heuristic: no token number ⇒ counter master
  if (row.tokenno) return false;
  // Must have a counter name somehow
  return !!(row.countername || row.name);
}

function isTokenRow_(row) {
  var type = String(row.recordtype || '').toLowerCase();
  if (type === 'token') return true;
  if (type === 'counter') return false;
  return !!row.tokenno;
}

function getCounterMasters_() {
  var rows = getSheetRows_(SHEET_NAMES.COUNTERS);
  return rows.filter(isCounterRow_).map(function (c) {
    var name = c.countername || c.name || '';
    return {
      id: c.id || name,
      counterName: name,
      accessHolder: c.accessholder || '',
      prefix: c.prefix || 'T',
      lastNumber: Number(c.lastnumber || 0),
      status: c.status || 'Active',
      _row: c._row,
    };
  }).filter(function (c) { return !!c.counterName; });
}

function ensureDefaultCounters_() {
  var sheet = getSheet_(SHEET_NAMES.COUNTERS);
  ensureHeaders_(sheet, SHEET_NAMES.COUNTERS);
  var counters = getCounterMasters_();
  if (counters.length) return counters;

  var defaults = [
    { recordtype: 'Counter', countername: 'Counter 1', accessholder: 'Reception', prefix: 'A', lastnumber: 0, status: 'Active' },
    { recordtype: 'Counter', countername: 'Counter 2', accessholder: 'Design Desk', prefix: 'B', lastnumber: 0, status: 'Active' },
  ];
  defaults.forEach(function (c) { appendObject_(sheet, SHEET_NAMES.COUNTERS, c); });
  return getCounterMasters_();
}

function nextTokenNo_(counter) {
  var sheet = getSheet_(SHEET_NAMES.COUNTERS);
  var next = Number(counter.lastNumber || 0) + 1;
  updateObjectProps_(sheet, SHEET_NAMES.COUNTERS, counter._row, { lastnumber: next });
  return String(counter.prefix || 'T') + '-' + pad_(next, 3);
}

function toApiToken_(t) {
  return {
    id: t.id || t.tokenno,
    tokenNo: t.tokenno,
    date: t.date,
    time: t.time,
    counterName: t.countername,
    customerId: t.customerid,
    customerName: t.customername,
    customerPhone: t.customerphone,
    service: t.service,
    status: t.tokenstatus || t.status || 'Waiting',
    calledAt: t.calledat || '',
    orderId: t.orderid || '',
    notes: t.notes || '',
  };
}

function handleTokens_(path, method, body, params) {
  var sheet = getSheet_(SHEET_NAMES.COUNTERS);
  var rows = getSheetRows_(SHEET_NAMES.COUNTERS);
  var tokens = rows.filter(isTokenRow_);

  // GET /tokens?counter=Counter%201&status=Waiting
  if (path === '/tokens' && method === 'GET') {
    var filtered = tokens;
    if (params && params.counter) {
      filtered = filtered.filter(function (t) {
        return String(t.countername).toLowerCase() === String(params.counter).toLowerCase();
      });
    }
    if (params && params.status) {
      filtered = filtered.filter(function (t) {
        return String(t.tokenstatus || t.status).toLowerCase() === String(params.status).toLowerCase();
      });
    }
    if (params && params.date) {
      filtered = filtered.filter(function (t) { return String(t.date) === String(params.date); });
    } else {
      // default: today's tokens
      var today = nowDate_();
      filtered = filtered.filter(function (t) { return String(t.date) === today; });
    }
    return filtered.map(toApiToken_);
  }

  // POST /tokens — book token
  if (path === '/tokens' && method === 'POST') {
    var counters = ensureDefaultCounters_();
    var counterName = body.counterName || body.counter || '';
    var counter = counters.find(function (c) {
      return String(c.counterName).toLowerCase() === String(counterName).toLowerCase();
    });
    if (!counter) throw new Error('Counter not found: ' + counterName);
    if (String(counter.status).toLowerCase() !== 'active') throw new Error('Counter is not active');

    var customer = upsertCustomer_({
      name: body.customerName || body.name,
      phone: body.customerPhone || body.phone,
      email: body.email,
      address: body.address,
    });

    var tokenNo = nextTokenNo_(counter);
    var token = {
      recordtype: 'Token',
      countername: counter.counterName,
      tokenno: tokenNo,
      date: nowDate_(),
      time: nowTime_(),
      customerid: customer.id,
      customername: customer.name,
      customerphone: customer.phone,
      service: body.service || body.serviceName || '',
      tokenstatus: 'Waiting',
      calledat: '',
      orderid: '',
      notes: body.notes || '',
      id: 'token_' + Date.now(),
    };
    appendObject_(sheet, SHEET_NAMES.COUNTERS, token);
    return toApiToken_(token);
  }

  // /tokens/:id/...
  var id = path.split('/')[2];
  var index = tokens.findIndex(function (t) {
    return String(t.tokenno) === String(id) || String(t.id) === String(id);
  });
  if (index < 0) throw new Error('Token not found');
  var tokenRow = tokens[index];

  if (path.indexOf('/call') !== -1 && method === 'POST') {
    updateObjectProps_(sheet, SHEET_NAMES.COUNTERS, tokenRow._row, {
      tokenstatus: 'Called',
      calledat: nowTime_(),
    });
    tokenRow.tokenstatus = 'Called';
    tokenRow.calledat = nowTime_();
    return toApiToken_(tokenRow);
  }

  if (path.indexOf('/complete') !== -1 && method === 'POST') {
    updateObjectProps_(sheet, SHEET_NAMES.COUNTERS, tokenRow._row, { tokenstatus: 'Completed' });
    tokenRow.tokenstatus = 'Completed';
    return toApiToken_(tokenRow);
  }

  if (path.indexOf('/skip') !== -1 && method === 'POST') {
    updateObjectProps_(sheet, SHEET_NAMES.COUNTERS, tokenRow._row, { tokenstatus: 'Skipped' });
    tokenRow.tokenstatus = 'Skipped';
    return toApiToken_(tokenRow);
  }

  if (path.indexOf('/progress') !== -1 && method === 'POST') {
    updateObjectProps_(sheet, SHEET_NAMES.COUNTERS, tokenRow._row, { tokenstatus: 'In Progress' });
    tokenRow.tokenstatus = 'In Progress';
    return toApiToken_(tokenRow);
  }

  if (path.indexOf('/cancel') !== -1 && method === 'POST') {
    updateObjectProps_(sheet, SHEET_NAMES.COUNTERS, tokenRow._row, { tokenstatus: 'Cancelled' });
    tokenRow.tokenstatus = 'Cancelled';
    return toApiToken_(tokenRow);
  }

  if (path.indexOf('/link-order') !== -1 && method === 'POST') {
    updateObjectProps_(sheet, SHEET_NAMES.COUNTERS, tokenRow._row, {
      orderid: body.orderId || body.orderid || '',
      tokenstatus: 'Ordered',
    });
    tokenRow.orderid = body.orderId || body.orderid || '';
    tokenRow.tokenstatus = 'Ordered';
    return toApiToken_(tokenRow);
  }

  if (method === 'GET') return toApiToken_(tokenRow);
  if (method === 'PUT') {
    var upd = {
      tokenstatus: body.status || body.tokenStatus || tokenRow.tokenstatus,
      notes: body.notes != null ? body.notes : tokenRow.notes,
      service: body.service != null ? body.service : tokenRow.service,
    };
    updateObjectProps_(sheet, SHEET_NAMES.COUNTERS, tokenRow._row, upd);
    return toApiToken_(Object.assign({}, tokenRow, upd));
  }
  throw new Error('Method not allowed');
}

function handleCounters_(path, method, body) {
  ensureDefaultCounters_();
  if (path === '/counters' && method === 'GET') {
    return getCounterMasters_().map(function (c) {
      return {
        id: c.id,
        counterName: c.counterName,
        accessHolder: c.accessHolder,
        prefix: c.prefix,
        lastNumber: c.lastNumber,
        status: c.status,
      };
    });
  }
  if (path === '/counters' && method === 'POST') {
    var sheet = getSheet_(SHEET_NAMES.COUNTERS);
    var record = {
      recordtype: 'Counter',
      countername: body.counterName || body.name,
      accessholder: body.accessHolder || '',
      prefix: body.prefix || 'T',
      lastnumber: Number(body.lastNumber || 0),
      status: body.status || 'Active',
    };
    appendObject_(sheet, SHEET_NAMES.COUNTERS, record);
    return {
      counterName: record.countername,
      accessHolder: record.accessholder,
      prefix: record.prefix,
      lastNumber: record.lastnumber,
      status: record.status,
    };
  }
  throw new Error('Method not allowed');
}

/* ===================== DASHBOARD / SETTINGS ===================== */

function getDashboardBootstrap_() {
  // One Orders read + one Customers read for the whole dashboard
  var orders = getSheetRows_(SHEET_NAMES.ORDERS);
  var customers = getSheetRows_(SHEET_NAMES.CUSTOMERS);
  var completed = orders.filter(function (o) {
    return String(o.status).toLowerCase().indexOf('deliver') !== -1;
  }).length;
  var statusMap = {};
  orders.forEach(function (o) {
    var key = o.status || 'Unknown';
    statusMap[key] = (statusMap[key] || 0) + 1;
  });
  return {
    stats: {
      totalOrders: orders.length,
      pendingOrders: orders.length - completed,
      completedOrders: completed,
      revenue: orders.reduce(function (s, o) { return s + Number(o.totalamount || 0); }, 0),
      expenses: 0,
      receivables: orders.reduce(function (s, o) { return s + Number(o.balanceamount || 0); }, 0),
      payables: 0,
      activeCustomers: customers.length,
    },
    charts: {
      monthlySales: [],
      orderStatus: Object.keys(statusMap).map(function (name) {
        return { name: name, value: statusMap[name] };
      }),
    },
    recentOrders: orders.slice(-5).reverse().map(toApiOrder_),
  };
}

function getDashboardStats_() {
  var orders = getSheetRows_(SHEET_NAMES.ORDERS);
  var customers = getSheetRows_(SHEET_NAMES.CUSTOMERS);
  var completed = orders.filter(function (o) {
    return String(o.status).toLowerCase().indexOf('deliver') !== -1;
  }).length;
  return {
    totalOrders: orders.length,
    pendingOrders: orders.length - completed,
    completedOrders: completed,
    revenue: orders.reduce(function (s, o) { return s + Number(o.totalamount || 0); }, 0),
    expenses: 0,
    receivables: orders.reduce(function (s, o) { return s + Number(o.balanceamount || 0); }, 0),
    payables: 0,
    activeCustomers: customers.length,
  };
}

function getDashboardCharts_() {
  var orders = getSheetRows_(SHEET_NAMES.ORDERS);
  var statusMap = {};
  orders.forEach(function (o) {
    var key = o.status || 'Unknown';
    statusMap[key] = (statusMap[key] || 0) + 1;
  });
  return {
    monthlySales: [],
    orderStatus: Object.keys(statusMap).map(function (name) {
      return { name: name, value: statusMap[name] };
    }),
  };
}

function getRecentOrders_() {
  return getSheetRows_(SHEET_NAMES.ORDERS)
    .slice(-5)
    .reverse()
    .map(toApiOrder_);
}

function getSettings_() {
  var rows = getSheetRows_(SHEET_NAMES.SETTINGS);
  if (!rows.length) return {};
  // Key/Value sheet → object, or single-row settings
  if (rows[0].key !== undefined) {
    var obj = {};
    rows.forEach(function (r) { obj[r.key] = r.value; });
    return obj;
  }
  return rows[0];
}

function updateSettings_(body) {
  var sheet = getSheet_(SHEET_NAMES.SETTINGS);
  ensureHeaders_(sheet, SHEET_NAMES.SETTINGS);
  var headers = getRawHeaders_(sheet, SHEET_NAMES.SETTINGS);
  var normalized = headers.map(normalizeHeader_);
  if (normalized.indexOf('key') !== -1 && normalized.indexOf('value') !== -1) {
    sheet.clearContents();
    sheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]);
    var keys = Object.keys(body);
    keys.forEach(function (k, i) {
      sheet.getRange(i + 2, 1, 1, 2).setValues([[k, serializeCell_(body[k])]]);
    });
    return body;
  }
  // single row style — overwrite row 2
  if (sheet.getLastRow() < 2) {
    appendObject_(sheet, SHEET_NAMES.SETTINGS, body);
  } else {
    updateObjectProps_(sheet, SHEET_NAMES.SETTINGS, 2, body);
  }
  return body;
}

function getReports_(params) {
  var stats = getDashboardStats_();
  return { period: (params && params.period) || 'month', summary: stats };
}

function handlePublic_(path, method) {
  if (method === 'GET' && path === '/public/branding') {
    var settings = getSettings_();
    return {
      company: settings.company || {},
      theme: settings.theme || {},
      invoice: settings.invoice || {},
    };
  }
  if (method === 'GET' && path.indexOf('/public/invoice/') === 0) {
    var token = path.replace('/public/invoice/', '');
    var invoices = getSheetRows_(SHEET_NAMES.INVOICES);
    var invoice = invoices.find(function (i) { return String(i.sharetoken) === token; });
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }
  if (method === 'GET' && path.indexOf('/public/track/') === 0) {
    var tracking = path.replace('/public/track/', '');
    var orders = getSheetRows_(SHEET_NAMES.ORDERS);
    var order = orders.find(function (o) {
      return String(o.trackingnumber) === String(tracking) || String(o.orderid) === String(tracking) || String(o.id) === String(tracking);
    });
    if (!order) throw new Error('Order not found');
    return toApiOrder_(order);
  }
  throw new Error('Not found');
}

function toApiProduct_(p) {
  var rate = Number(p.rate || p.baseprice || 0);
  return {
    id: p.id,
    name: p.name,
    category: p.category || '',
    productType: p.producttype || (String(p.category || '').toLowerCase().indexOf('service') >= 0 ? 'Service' : 'Product'),
    basePrice: rate,
    rate: rate,
    unit: p.unit || 'per piece',
    description: p.description || '',
    material: p.material || '',
    size: p.size || '',
    minQuantity: Number(p.minquantity || 1),
    stock: Number(p.stock || 0),
    designer: p.designer || '',
    active: String(p.status || 'Active').toLowerCase() !== 'inactive',
    status: p.status || 'Active',
  };
}

function normalizeProduct_(body, existing) {
  existing = existing || {};
  var rate = body.basePrice != null ? body.basePrice : (body.rate != null ? body.rate : (existing.rate || 0));
  return {
    id: body.id || existing.id || ('product_' + Date.now()),
    name: body.name || existing.name || '',
    category: body.category || existing.category || '',
    producttype: body.productType || body.producttype || existing.producttype || 'Product',
    rate: Number(rate || 0),
    unit: body.unit || existing.unit || 'per piece',
    description: body.description || existing.description || '',
    material: body.material || existing.material || '',
    size: body.size || existing.size || '',
    minquantity: Number(body.minQuantity != null ? body.minQuantity : (existing.minquantity || 1)),
    stock: Number(body.stock != null ? body.stock : (existing.stock || 0)),
    designer: body.designer || existing.designer || '',
    status: body.active === false ? 'Inactive' : (body.status || existing.status || 'Active'),
  };
}

function handleProducts_(path, method, body) {
  var sheet = getSheet_(SHEET_NAMES.PRODUCTS);
  var rows = getSheetRows_(SHEET_NAMES.PRODUCTS);

  if (path === '/products') {
    if (method === 'GET') return rows.map(toApiProduct_);
    if (method === 'POST') {
      var created = normalizeProduct_(body);
      appendObject_(sheet, SHEET_NAMES.PRODUCTS, created);
      return toApiProduct_(created);
    }
  }

  var id = path.split('/')[2];
  var index = findById_(rows, id);
  if (index < 0) throw new Error('Product not found');

  if (method === 'GET') return toApiProduct_(rows[index]);
  if (method === 'PUT') {
    var updated = normalizeProduct_(body, rows[index]);
    updated.id = rows[index].id;
    updateObjectProps_(sheet, SHEET_NAMES.PRODUCTS, rows[index]._row, updated);
    return toApiProduct_(updated);
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, rows[index]._row, SHEET_NAMES.PRODUCTS);
    return { success: true };
  }
  throw new Error('Method not allowed');
}

/* ===================== ROUTER ===================== */

function handleRequest_(e) {
  var path = getPath_(e);
  var method = getMethod_(e);
  var body = parseBody_(e);
  var token = parseAuthToken_(e);

  try {
    if (method === 'POST' && path === '/auth/login') {
      var loginResult = handleLogin_(body);
      if (loginResult.error) return jsonResponse_({ message: loginResult.error }, 401);
      return jsonResponse_(loginResult);
    }

    if (path.indexOf('/public/') === 0) {
      return jsonResponse_(handlePublic_(path, method, body));
    }

    var user = validateToken_(token);
    if (!user) return jsonResponse_({ message: 'Unauthorized' }, 401);

    if (method === 'GET' && path === '/auth/me') return jsonResponse_(sanitizeUser_(user));
    if (method === 'POST' && path === '/auth/logout') return jsonResponse_({ success: true });

    if (method === 'GET' && path === '/dashboard/bootstrap') return jsonResponse_(getDashboardBootstrap_());
    if (method === 'GET' && path === '/dashboard/stats') return jsonResponse_(getDashboardStats_());
    if (method === 'GET' && path === '/dashboard/charts') return jsonResponse_(getDashboardCharts_());
    if (method === 'GET' && path === '/dashboard/recent-orders') return jsonResponse_(getRecentOrders_());

    // Token booking page: one round-trip instead of counters + products
    if (method === 'GET' && path === '/tokens/meta') {
      return jsonResponse_({
        counters: handleCounters_('/counters', 'GET', {}),
        products: handleProducts_('/products', 'GET', {}),
      });
    }

    if (path === '/orders') return jsonResponse_(handleOrders_(method, body));
    if (path.indexOf('/orders/') === 0) return jsonResponse_(handleOrderById_(path, method, body));

    if (path === '/quotations' || path.indexOf('/quotations/') === 0) {
      return jsonResponse_(handleQuotations_(path, method, body));
    }

    if (path === '/users' || path.indexOf('/users/') === 0) {
      return jsonResponse_(handleUsers_(path, method, body));
    }

    if (path === '/customers' || path.indexOf('/customers/') === 0) {
      return jsonResponse_(handleCustomers_(path, method, body));
    }

    if (path === '/products' || path.indexOf('/products/') === 0) {
      return jsonResponse_(handleProducts_(path, method, body));
    }

    if (path === '/invoices' || path.indexOf('/invoices/') === 0) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.INVOICES, path, method, body, '/invoices'));
    }
    if (path === '/vendors' || path.indexOf('/vendors/') === 0) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.VENDORS, path, method, body, '/vendors'));
    }
    if (path === '/purchases' || path.indexOf('/purchases/') === 0) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.PURCHASES, path, method, body, '/purchases'));
    }
    if (path === '/expenses' || path.indexOf('/expenses/') === 0) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.EXPENSES, path, method, body, '/expenses'));
    }
    if (path === '/payments' || path.indexOf('/payments/') === 0) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.PAYMENTS, path, method, body, '/payments'));
    }

    if (path === '/designers' && method === 'GET') {
      var users = getSheetRows_(SHEET_NAMES.USERS);
      var designers = users.filter(function (u) {
        var role = String(u.role || '');
        var status = String(u.status || 'Active').toLowerCase();
        if (status === 'inactive') return false;
        return role.toLowerCase().indexOf('designer') !== -1;
      });
      if (!designers.length) {
        designers = users.filter(function (u) {
          return String(u.status || 'Active').toLowerCase() !== 'inactive';
        });
      }
      return jsonResponse_(designers.map(function (u) {
        return {
          id: u.id || u.username || '',
          name: u.name || u.username || '',
          email: u.email || '',
          role: u.role || '',
        };
      }));
    }
    if (path.indexOf('/designers/') === 0) return jsonResponse_({ message: 'Not found' }, 404);

    if (path === '/counters' || path.indexOf('/counters/') === 0) {
      return jsonResponse_(handleCounters_(path, method, body));
    }
    if (path === '/tokens' || path.indexOf('/tokens/') === 0) {
      return jsonResponse_(handleTokens_(path, method, body, e.parameter || {}));
    }

    if (path === '/settings') {
      if (method === 'GET') return jsonResponse_(getSettings_());
      if (method === 'PUT' || method === 'POST') return jsonResponse_(updateSettings_(body));
    }
    if (path === '/reports') return jsonResponse_(getReports_(e.parameter));

    if (method === 'GET' && path === '/debug/schema') {
      return jsonResponse_(getSchema_());
    }
    if (method === 'POST' && path === '/debug/prepare') {
      return jsonResponse_({ ok: true, report: prepareDatabase() });
    }

    return jsonResponse_({ message: 'Not found: ' + path }, 404);
  } catch (err) {
    return jsonResponse_({ message: err.message || String(err) }, 500);
  }
}

function doGet(e) {
  return handleRequest_(e || { parameter: {} });
}

function doPost(e) {
  return handleRequest_(e || { parameter: {}, postData: { contents: '{}' } });
}

/**
 * One-time: ensure Counters has headers + default counters (does not wipe data).
 */
function setupCounters() {
  ensureDefaultCounters_();
}

/**
 * Run once after deploy: ensure all ERP sheets have required columns.
 * Does NOT delete existing data — only adds missing header columns.
 */
function prepareDatabase() {
  var names = [
    SHEET_NAMES.USERS,
    SHEET_NAMES.CUSTOMERS,
    SHEET_NAMES.ORDERS,
    SHEET_NAMES.PRODUCTS,
    SHEET_NAMES.INVOICES,
    SHEET_NAMES.VENDORS,
    SHEET_NAMES.PURCHASES,
    SHEET_NAMES.EXPENSES,
    SHEET_NAMES.PAYMENTS,
    SHEET_NAMES.COUNTERS,
    SHEET_NAMES.SETTINGS,
  ];
  var report = [];
  names.forEach(function (name) {
    try {
      var sheet = getSheet_(name);
      var headers = ensureHeaders_(sheet, name);
      report.push({ sheet: name, ok: true, columns: headers.length, headers: headers });
    } catch (err) {
      report.push({ sheet: name, ok: false, error: err.message });
    }
  });
  ensureDefaultCounters_();
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function getSchema_() {
  var names = Object.keys(SHEET_NAMES).map(function (k) { return SHEET_NAMES[k]; });
  var out = { spreadsheetId: getSpreadsheetId_(), sheets: {} };
  names.forEach(function (name) {
    try {
      var sheet = getSheet_(name);
      var headers = getRawHeaders_(sheet, name);
      out.sheets[name] = {
        rows: Math.max(sheet.getLastRow() - 1, 0),
        headers: headers,
      };
    } catch (err) {
      out.sheets[name] = { error: err.message };
    }
  });
  out.counters = getCounterMasters_();
  return out;
}
