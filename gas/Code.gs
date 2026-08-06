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
  CRM_NOTES: 'CrmNotes',
  EMPLOYEES: 'Employees',
  PRODUCTS: 'Products',
  INVOICES: 'Invoices',
  VENDORS: 'Vendors',
  PURCHASES: 'Purchases',
  EXPENSES: 'Expenses',
  PAYMENTS: 'Payments',
  COUNTERS: 'Counters',
  SETTINGS: 'Settings',
};

var DEFAULT_CRM_STAGES = [
  { key: 'lead', label: 'Lead', color: '#3B82F6' },
  { key: 'contacted', label: 'Contacted', color: '#8B5CF6' },
  { key: 'qualified', label: 'Qualified', color: '#F59E0B' },
  { key: 'proposal', label: 'Proposal', color: '#F26522' },
  { key: 'negotiation', label: 'Negotiation', color: '#06B6D4' },
  { key: 'won', label: 'Won', color: '#10B981' },
  { key: 'lost', label: 'Lost', color: '#EF4444' },
];

var DEFAULT_HEADERS = {
  Users: ['Username', 'Password', 'Name', 'Role', 'Status', 'Permissions'],
  Customers: ['Id', 'Name', 'Phone', 'Email', 'Address', 'City', 'Notes', 'InCrm', 'Stage', 'StageUpdatedAt', 'NotifyWhatsApp', 'NotifyEmail'],
  CrmNotes: ['Id', 'CustomerId', 'Note', 'CreatedAt', 'CreatedBy'],
  Employees: ['Id', 'Name', 'Phone', 'Email', 'Role', 'Department', 'JoinDate', 'Salary', 'Status', 'Address', 'Notes'],
  Orders: [
    'Id', 'OrderId', 'Date', 'CustomerId', 'CustomerName', 'CustomerPhone',
    'CustomerEmail', 'CustomerAddress', 'Status', 'DeliveryDate', 'Products',
    'TotalAmount', 'AdvancePayment', 'BalanceAmount', 'Remarks', 'AssignedDesigner', 'TokenNo',
    'DocType', 'TrackingNumber', 'StatusHistory', 'DeliveryAddress', 'QuotationId'
  ],
  Products: ['Id', 'Name', 'Category', 'Rate', 'Unit', 'Description', 'Status', 'ProductType', 'Designer', 'Stock', 'Material', 'Size', 'MinQuantity'],
  Invoices: [
    'Id', 'InvoiceNo', 'Date', 'DueDate', 'OrderId', 'CustomerId', 'CustomerName', 'CustomerPhone',
    'CustomerEmail', 'CustomerAddress', 'Items', 'Subtotal', 'TaxRate', 'Tax', 'Discount',
    'PreviousBalance', 'Total', 'Paid', 'Status', 'Notes', 'ShareToken'
  ],
  Vendors: ['Id', 'Name', 'Phone', 'Email', 'Address', 'Notes'],
  Purchases: ['Id', 'PurchaseNo', 'Date', 'VendorId', 'VendorName', 'Items', 'Total', 'Status'],
  Expenses: ['Id', 'Date', 'Category', 'Amount', 'Description', 'PaymentMethod'],
  Payments: ['Id', 'Date', 'Type', 'Category', 'RefId', 'CustomerName', 'CustomerId', 'PartyPhone', 'Amount', 'Method', 'Notes', 'BalanceDue', 'TotalAmount'],
  Counters: [
    'RecordType', 'CounterName', 'AccessHolder', 'Prefix', 'LastNumber', 'Status',
    'TokenNo', 'Date', 'Time', 'CustomerId', 'CustomerName', 'CustomerPhone',
    'Service', 'ServiceNote', 'TokenStatus', 'CalledAt', 'OrderId', 'Notes'
  ],
  Settings: ['Key', 'Value'],
};

/** Token service → counter assignment (auto). */
var SERVICE_COUNTER_MAP = {
  'designing': 'Table 01',
  'printing services': 'Table 01',
  'nadra services': 'Table 02',
  'photo copy & documents': 'Table 03',
  'photo copy and documents': 'Table 03',
  'pals fee & information': 'Executive Office',
  'pals fee and information': 'Executive Office',
  'payments': 'Executive Office',
  'discussion': 'Executive Office',
  'other printing services': 'Executive Office',
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

/** Create sheet + headers if missing (used for optional sheets like CrmNotes). */
function getOrCreateSheet_(name) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var headers = DEFAULT_HEADERS[name];
    if (headers && headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      SpreadsheetApp.flush();
    }
  } else {
    ensureHeaders_(sheet, name);
  }
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
 * Counters (tokens queue) always reads live — booking must appear immediately.
 */
function getSheetRows_(sheetName) {
  if (sheetName === SHEET_NAMES.COUNTERS) {
    return sheetToObjects_(getSheet_(sheetName), sheetName);
  }

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
    recordtype: 'recordtype', countername: 'countername', counter: 'countername',
    accessholder: 'accessholder', holder: 'accessholder', prefix: 'prefix', lastnumber: 'lastnumber',
    lasttoken: 'lastnumber', service: 'service', tokenstatus: 'tokenstatus', calledat: 'calledat',
    invoiceno: 'invoiceno', invoicenumber: 'invoiceno', sharetoken: 'sharetoken',
    key: 'key', value: 'value',
    amount: 'amount', method: 'method', paymentmethod: 'paymentmethod', vendorname: 'vendorname',
    vendorid: 'vendorid', purchaseno: 'purchaseno', refid: 'refid',
    type: 'type',
    paidamount: 'paid', paid: 'paid', taxrate: 'taxrate',
    duedate: 'duedate', previousbalance: 'previousbalance', servicenote: 'servicenote',
    notifywhatsapp: 'notifywhatsapp', whatsappnotify: 'notifywhatsapp',
    notifyemail: 'notifyemail', emailnotify: 'notifyemail',
    balancedue: 'balancedue', totalamountfield: 'totalamount',
  };
  return aliases[key] || key;
}

/** Accept camelCase API bodies against lowercase sheet keys. */
function coerceKeys_(obj) {
  var out = {};
  if (!obj || typeof obj !== 'object') return out;
  Object.keys(obj).forEach(function (k) {
    if (k === '_row') {
      out._row = obj._row;
      return;
    }
    var nk = normalizeHeader_(k);
    if (out[nk] === undefined || out[nk] === null || out[nk] === '') {
      out[nk] = obj[k];
    }
  });
  return out;
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

/**
 * Users sheet may have duplicate "Name" headers (e.g. Name + mislabeled Permissions).
 * Collect every Name column; prefer the last non-empty, non-JSON value for Welcome display.
 */
function pickUserDisplayName_(headers, row) {
  var candidates = [];
  for (var i = 0; i < headers.length; i++) {
    if (normalizeHeader_(headers[i]) !== 'name') continue;
    var v = String(row[i] != null ? row[i] : '').trim();
    if (!v) continue;
    // Skip permission arrays accidentally placed under a Name header
    if (v.charAt(0) === '[' || v.charAt(0) === '{') continue;
    candidates.push(v);
  }
  if (!candidates.length) return '';
  return candidates[candidates.length - 1];
}

function sheetToObjects_(sheet, sheetName) {
  if (!sheet) return [];
  // Keep blank header slots so column indexes stay aligned with row cells
  var headers = readHeaders_(sheet);
  if (!headers.some(function (h) { return h; })) {
    headers = (DEFAULT_HEADERS[sheetName || sheet.getName()] || ['Id', 'Name']).slice();
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow, Math.max(headers.length, 1)).getValues();
  var normalized = headers.map(normalizeHeader_);
  var isUsers = String(sheetName || sheet.getName()) === SHEET_NAMES.USERS;

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
      if (isUsers) {
        var displayName = pickUserDisplayName_(headers, row);
        if (displayName) obj.name = displayName;
        // 6th column is Permissions even if the header was typed as "Name"
        if (obj.permissions == null || obj.permissions === '') {
          var permIdx = -1;
          for (var p = 0; p < headers.length; p++) {
            if (normalizeHeader_(headers[p]) === 'permissions') { permIdx = p; break; }
          }
          if (permIdx < 0 && headers.length >= 6) {
            var sixth = String(row[5] != null ? row[5] : '').trim();
            if (sixth.charAt(0) === '[') obj.permissions = parseCell_(sixth);
          }
        }
      }
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
  var flat = coerceKeys_(obj);
  if (flat[key] !== undefined && flat[key] !== null && flat[key] !== '') {
    return serializeCell_(flat[key]);
  }
  // Allow explicit empty string / 0 writes for numeric fields
  if (flat[key] === 0 || flat[key] === false) {
    return serializeCell_(flat[key]);
  }

  // Extra aliases so existing sheet labels still receive values
  var fallbacks = {
    countername: ['counter', 'countername', 'name'],
    name: ['name', 'customername', 'fullname'],
    phone: ['phone', 'customerphone', 'mobile', 'partyphone'],
    customername: ['customername', 'name', 'party'],
    customerphone: ['customerphone', 'phone', 'mobile', 'partyphone'],
    partyphone: ['partyphone', 'phone', 'customerphone', 'mobile'],
    refid: ['refid', 'reference'],
    tokenstatus: ['tokenstatus'],
    status: ['status'],
    service: ['service', 'product', 'products'],
    total: ['total', 'totalamount'],
    paid: ['paid', 'paidamount'],
    tax: ['tax'],
  };

  var keys = fallbacks[key] || [key];
  for (var i = 0; i < keys.length; i++) {
    if (flat[keys[i]] !== undefined && flat[keys[i]] !== null && flat[keys[i]] !== '') {
      return serializeCell_(flat[keys[i]]);
    }
    if (flat[keys[i]] === 0 || flat[keys[i]] === false) {
      return serializeCell_(flat[keys[i]]);
    }
  }
  return '';
}

function appendObject_(sheet, sheetName, obj) {
  var headers = ensureHeaders_(sheet, sheetName);
  var flat = coerceKeys_(obj);
  var row = headers.map(function (h) { return valueForHeader_(flat, h); });
  // Guard: refuse silent empty writes
  var hasValue = row.some(function (cell) { return cell !== '' && cell !== null; });
  if (!hasValue) {
    throw new Error('Nothing written to ' + sheetName + ' — check sheet column headers match API fields');
  }
  sheet.appendRow(row);
  SpreadsheetApp.flush();
  invalidateSheetCache_(sheetName);
  return flat;
}

function updateObjectProps_(sheet, sheetName, rowNumber, updates) {
  var headers = getRawHeaders_(sheet, sheetName);
  var flat = coerceKeys_(updates);
  headers.forEach(function (rawHeader, i) {
    var key = normalizeHeader_(rawHeader);
    if (flat[key] !== undefined) {
      sheet.getRange(rowNumber, i + 1).setValue(serializeCell_(flat[key]));
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
    return String(r.id) === needle
      || String(r.orderid) === needle
      || String(r.tokenno) === needle
      || String(r.invoiceno) === needle;
  });
}

function slicePage_(rows, params) {
  if (!params) return rows;
  var offset = Number(params.offset || 0);
  var limit = Number(params.limit || 0);
  if (!limit || limit <= 0) return rows;
  return rows.slice(offset, offset + limit);
}

function spreadsheetTz_() {
  try {
    return getSpreadsheet_().getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'Asia/Karachi';
  } catch (err) {
    return Session.getScriptTimeZone() || 'Asia/Karachi';
  }
}

function nowDate_() {
  return Utilities.formatDate(new Date(), spreadsheetTz_(), 'yyyy-MM-dd');
}

function nowTime_() {
  return Utilities.formatDate(new Date(), spreadsheetTz_(), 'HH:mm:ss');
}

/** Force yyyy-MM-dd as plain text so Sheets does not coerce to Date (breaks Today filter). */
function sheetDateText_(value) {
  var key = dateKey_(value) || String(value || '').trim();
  if (!key) return '';
  return "'" + key;
}

function pad_(n, width) {
  var s = String(n);
  while (s.length < width) s = '0' + s;
  return s;
}

/* ===================== AUTH ===================== */

function sanitizeUser_(user) {
  if (!user) return null;
  var username = String(user.username || user.email || user.id || '').trim();
  // Always expose Users sheet Name column for "Welcome Back, {Name}"
  var name = String(user.name || '').trim();
  return {
    id: String(user.id || username || ''),
    username: username,
    name: name,
    email: String(user.email || username || '').trim(),
    role: String(user.role || 'Admin').trim(),
  };
}

function isActiveUser_(user) {
  var status = String(user.status || 'active').trim().toLowerCase();
  return !status || status === 'active' || status === 'enabled' || status === '1' || status === 'true';
}

/** Ensure an admin login always exists (create or repair blank password). */
function ensureDefaultAdmin_() {
  var sheet = getSheet_(SHEET_NAMES.USERS);
  ensureHeaders_(sheet, SHEET_NAMES.USERS);
  var users = getSheetRows_(SHEET_NAMES.USERS);

  var admin = null;
  for (var i = 0; i < users.length; i++) {
    var ids = [users[i].username, users[i].email, users[i].name]
      .map(function (v) { return String(v || '').trim().toLowerCase(); });
    if (ids.indexOf('admin') !== -1) {
      admin = users[i];
      break;
    }
  }

  if (admin) {
    var pass = String(admin.password != null ? admin.password : '').trim();
    var status = String(admin.status || '').trim();
    var needsFix = !pass || !isActiveUser_(admin);
    if (needsFix) {
      updateObjectProps_(sheet, SHEET_NAMES.USERS, admin._row, {
        password: pass || 'admin123',
        status: 'Active',
        username: admin.username || 'admin',
        name: admin.name || 'Admin',
        role: admin.role || 'Super Admin',
      });
      invalidateSheetCache_(SHEET_NAMES.USERS);
      return getSheetRows_(SHEET_NAMES.USERS);
    }
    return users;
  }

  appendObject_(sheet, SHEET_NAMES.USERS, {
    username: 'admin',
    password: 'admin123',
    name: 'Admin',
    role: 'Super Admin',
    status: 'Active',
    permissions: '[]',
    id: 'user_admin',
  });
  invalidateSheetCache_(SHEET_NAMES.USERS);
  return getSheetRows_(SHEET_NAMES.USERS);
}

/**
 * Called from prepareDatabase / Sync Sheets — resets admin password to admin123
 * so the ERP can always be opened after a bad Users sheet.
 */
function resetAdminLogin_() {
  var sheet = getSheet_(SHEET_NAMES.USERS);
  ensureHeaders_(sheet, SHEET_NAMES.USERS);
  invalidateSheetCache_(SHEET_NAMES.USERS);
  var users = getSheetRows_(SHEET_NAMES.USERS);
  var admin = null;
  for (var i = 0; i < users.length; i++) {
    var ids = [users[i].username, users[i].email]
      .map(function (v) { return String(v || '').trim().toLowerCase(); });
    if (ids.indexOf('admin') !== -1) {
      admin = users[i];
      break;
    }
  }
  if (admin) {
    updateObjectProps_(sheet, SHEET_NAMES.USERS, admin._row, {
      username: admin.username || 'admin',
      password: 'admin123',
      name: admin.name || 'Admin',
      role: admin.role || 'Super Admin',
      status: 'Active',
    });
  } else {
    appendObject_(sheet, SHEET_NAMES.USERS, {
      username: 'admin',
      password: 'admin123',
      name: 'Admin',
      role: 'Super Admin',
      status: 'Active',
      permissions: '[]',
      id: 'user_admin',
    });
  }
  invalidateSheetCache_(SHEET_NAMES.USERS);
  return { username: 'admin', password: 'admin123' };
}

function handleLogin_(body) {
  var email = String(body.email || body.username || '').trim();
  var password = String(body.password || '');
  // Fast path: read Users only. Repair admin only if login fails / sheet empty.
  var users = getSheetRows_(SHEET_NAMES.USERS);
  var loginId = email.toLowerCase();

  var user = users.find(function (u) {
    if (!isActiveUser_(u)) return false;
    var identifiers = [u.email, u.username, u.name, u.id]
      .map(function (v) { return String(v || '').trim().toLowerCase(); })
      .filter(Boolean);
    var sheetPass = String(u.password != null ? u.password : '').trim();
    return identifiers.indexOf(loginId) !== -1 && sheetPass === password.trim();
  });

  if (!user) {
    users = ensureDefaultAdmin_();
    user = users.find(function (u) {
      if (!isActiveUser_(u)) return false;
      var identifiers = [u.email, u.username, u.name, u.id]
        .map(function (v) { return String(v || '').trim().toLowerCase(); })
        .filter(Boolean);
      var sheetPass = String(u.password != null ? u.password : '').trim();
      return identifiers.indexOf(loginId) !== -1 && sheetPass === password.trim();
    });
  }

  if (!user) {
    var hint = users.length
      ? 'Use Users sheet Username/Password, or click Sync Sheets to reset admin/admin123.'
      : 'Users sheet empty — click Sync Sheets.';
    return { error: 'Invalid credentials. ' + hint };
  }

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

/* ===================== CUSTOMERS + CRM ===================== */

function normalizeCrmStage_(value) {
  var s = String(value || '').trim().toLowerCase();
  if (!s) return '';
  return s.replace(/\s+/g, '_');
}

function isInCrm_(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === undefined || value === null || value === '') return false;
  var s = String(value).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y' || s === 'on';
}

function normalizeCustomer_(body) {
  var stageRaw = body.stage != null ? body.stage : body.crmStage;
  var hasInCrm = body.inCrm != null || body.incrm != null;
  return {
    id: body.id || '',
    name: body.name || body.customerName || body.customername || '',
    phone: String(body.phone || body.customerPhone || body.customerphone || '').trim(),
    email: body.email || body.customerEmail || body.customeremail || '',
    address: body.address || body.customerAddress || body.customeraddress || '',
    city: body.city || '',
    notes: body.notes || '',
    incrm: hasInCrm ? isInCrm_(body.inCrm != null ? body.inCrm : body.incrm) : undefined,
    stage: stageRaw != null && stageRaw !== '' ? normalizeCrmStage_(stageRaw) : undefined,
    stageupdatedat: body.stageUpdatedAt || body.stageupdatedat || '',
    notifywhatsapp: body.notifyWhatsApp != null ? body.notifyWhatsApp : (body.notifywhatsapp != null ? body.notifywhatsapp : true),
    notifyemail: body.notifyEmail != null ? body.notifyEmail : (body.notifyemail != null ? body.notifyemail : true),
  };
}

function toApiCustomer_(c) {
  var inCrm = isInCrm_(c.incrm);
  return {
    id: c.id,
    name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    city: c.city || '',
    notes: c.notes || '',
    inCrm: inCrm,
    stage: inCrm ? (normalizeCrmStage_(c.stage) || 'lead') : (normalizeCrmStage_(c.stage) || ''),
    stageUpdatedAt: c.stageupdatedat || '',
    notifyWhatsApp: isNotifyOn_(c.notifywhatsapp),
    notifyEmail: isNotifyOn_(c.notifyemail),
  };
}

function toApiCrmNote_(n) {
  return {
    id: n.id || '',
    customerId: n.customerid || '',
    note: n.note || '',
    createdAt: n.createdat || '',
    createdBy: n.createdby || '',
  };
}

function listCrmNotes_(customerId) {
  var sheet = getOrCreateSheet_(SHEET_NAMES.CRM_NOTES);
  ensureHeaders_(sheet, SHEET_NAMES.CRM_NOTES);
  var rows = getSheetRows_(SHEET_NAMES.CRM_NOTES);
  return rows
    .filter(function (n) { return String(n.customerid) === String(customerId); })
    .map(toApiCrmNote_)
    .sort(function (a, b) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
}

function addCrmNote_(customerId, body) {
  var text = String((body && (body.note || body.text || body.notes)) || '').trim();
  if (!text) throw new Error('Note text required');
  var sheet = getOrCreateSheet_(SHEET_NAMES.CRM_NOTES);
  ensureHeaders_(sheet, SHEET_NAMES.CRM_NOTES);
  var record = {
    id: 'note_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    customerid: String(customerId),
    note: text,
    createdat: new Date().toISOString(),
    createdby: String((body && (body.createdBy || body.createdby)) || 'staff'),
  };
  appendObject_(sheet, SHEET_NAMES.CRM_NOTES, record);
  invalidateSheetCache_(SHEET_NAMES.CRM_NOTES);
  return toApiCrmNote_(record);
}

function deleteCrmNote_(customerId, noteId) {
  var sheet = getOrCreateSheet_(SHEET_NAMES.CRM_NOTES);
  var rows = getSheetRows_(SHEET_NAMES.CRM_NOTES);
  var idx = -1;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(noteId) && String(rows[i].customerid) === String(customerId)) {
      idx = i;
      break;
    }
  }
  if (idx < 0) throw new Error('Note not found');
  deleteRow_(sheet, rows[idx]._row, SHEET_NAMES.CRM_NOTES);
  return { success: true };
}

function isNotifyOn_(value) {
  if (value === undefined || value === null || value === '') return true;
  if (value === true || value === false) return value;
  var s = String(value).trim().toLowerCase();
  if (s === '0' || s === 'false' || s === 'no' || s === 'off' || s === 'n') return false;
  return true;
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
    // Only touch CRM fields when explicitly requested (never auto-add to CRM)
    if (data.incrm !== undefined) {
      updates.incrm = data.incrm;
      if (data.incrm) {
        updates.stage = data.stage || existing.stage || 'lead';
        updates.stageupdatedat = new Date().toISOString();
      }
    } else if (data.stage && isInCrm_(existing.incrm)) {
      updates.stage = data.stage;
      updates.stageupdatedat = new Date().toISOString();
    }
    if (body.notifyWhatsApp != null || body.notifywhatsapp != null) {
      updates.notifywhatsapp = data.notifywhatsapp;
    }
    if (body.notifyEmail != null || body.notifyemail != null) {
      updates.notifyemail = data.notifyemail;
    }
    updateObjectProps_(sheet, SHEET_NAMES.CUSTOMERS, existing._row, updates);
    return toApiCustomer_(Object.assign({}, existing, updates, { id: existing.id }));
  }

  data.id = data.id || ('cust_' + Date.now());
  // Regular customers stay out of CRM unless inCrm is explicitly true
  data.incrm = data.incrm === true;
  if (data.incrm) {
    data.stage = data.stage || 'lead';
    data.stageupdatedat = data.stageupdatedat || new Date().toISOString();
  } else {
    data.stage = data.stage || '';
    data.stageupdatedat = '';
  }
  if (data.notifywhatsapp === undefined || data.notifywhatsapp === '') data.notifywhatsapp = true;
  if (data.notifyemail === undefined || data.notifyemail === '') data.notifyemail = true;
  ensureHeaders_(sheet, SHEET_NAMES.CUSTOMERS);
  appendObject_(sheet, SHEET_NAMES.CUSTOMERS, data);
  return toApiCustomer_(data);
}

function handleCustomers_(path, method, body) {
  var sheet = getSheet_(SHEET_NAMES.CUSTOMERS);
  ensureHeaders_(sheet, SHEET_NAMES.CUSTOMERS);
  var customers = getSheetRows_(SHEET_NAMES.CUSTOMERS);

  if (path.endsWith('/ledger')) {
    var ledgerId = path.split('/')[2];
    var customer = customers.find(function (c) { return String(c.id) === String(ledgerId); });
    if (!customer) throw new Error('Customer not found');
    var orders = getSheetRows_(SHEET_NAMES.ORDERS).filter(function (o) {
      return String(o.customerid) === String(customer.id) || String(o.customerphone) === String(customer.phone);
    });
    return {
      customer: toApiCustomer_(customer),
      invoices: [],
      orders: orders,
      payments: [],
      totalBilled: orders.reduce(function (s, o) { return s + Number(o.totalamount || o.total || 0); }, 0),
      totalPaid: orders.reduce(function (s, o) { return s + Number(o.advancepayment || 0); }, 0),
      outstanding: orders.reduce(function (s, o) { return s + Number(o.balanceamount || 0); }, 0),
    };
  }

  // /customers/:id/notes  or  /customers/:id/notes/:noteId
  var notesMatch = path.match(/^\/customers\/([^/]+)\/notes(?:\/([^/]+))?$/);
  if (notesMatch) {
    var noteCustomerId = decodeURIComponent(notesMatch[1]);
    var noteId = notesMatch[2] ? decodeURIComponent(notesMatch[2]) : '';
    var noteCustIdx = findById_(customers, noteCustomerId);
    if (noteCustIdx < 0) throw new Error('Customer not found');
    if (!noteId && method === 'GET') return listCrmNotes_(noteCustomerId);
    if (!noteId && method === 'POST') return addCrmNote_(noteCustomerId, body || {});
    if (noteId && method === 'DELETE') return deleteCrmNote_(noteCustomerId, noteId);
    throw new Error('Method not allowed');
  }

  // /customers/:id/crm — add/remove from CRM pipeline (manual only)
  var crmMatch = path.match(/^\/customers\/([^/]+)\/crm$/);
  if (crmMatch && (method === 'PUT' || method === 'POST')) {
    var crmCustId = decodeURIComponent(crmMatch[1]);
    var crmIdx = findById_(customers, crmCustId);
    if (crmIdx < 0) throw new Error('Customer not found');
    var enableCrm = body && body.inCrm === false ? false : true;
    if (body && (body.inCrm === false || body.incrm === false)) enableCrm = false;
    var crmUpdates = {
      incrm: enableCrm,
      stage: enableCrm ? (normalizeCrmStage_((body && (body.stage || body.crmStage)) || customers[crmIdx].stage || 'lead') || 'lead') : '',
      stageupdatedat: enableCrm ? new Date().toISOString() : '',
    };
    updateObjectProps_(sheet, SHEET_NAMES.CUSTOMERS, customers[crmIdx]._row, crmUpdates);
    return toApiCustomer_(Object.assign({}, customers[crmIdx], crmUpdates));
  }

  // /customers/:id/stage — quick CRM stage move (only for CRM members)
  var stageMatch = path.match(/^\/customers\/([^/]+)\/stage$/);
  if (stageMatch && (method === 'PUT' || method === 'POST')) {
    var stageCustId = decodeURIComponent(stageMatch[1]);
    var stageIdx = findById_(customers, stageCustId);
    if (stageIdx < 0) throw new Error('Customer not found');
    if (!isInCrm_(customers[stageIdx].incrm)) throw new Error('Customer is not in CRM — add them first');
    var nextStage = normalizeCrmStage_((body && (body.stage || body.crmStage)) || 'lead') || 'lead';
    var stageUpdates = {
      stage: nextStage,
      stageupdatedat: new Date().toISOString(),
      incrm: true,
    };
    updateObjectProps_(sheet, SHEET_NAMES.CUSTOMERS, customers[stageIdx]._row, stageUpdates);
    return toApiCustomer_(Object.assign({}, customers[stageIdx], stageUpdates));
  }

  if (path === '/customers') {
    if (method === 'GET') {
      return customers.map(toApiCustomer_);
    }
    if (method === 'POST') return upsertCustomer_(body);
  }

  var id = path.split('/')[2];
  var index = findById_(customers, id);
  if (index < 0) throw new Error('Customer not found');

  if (method === 'GET') return toApiCustomer_(customers[index]);
  if (method === 'PUT') {
    var prev = customers[index];
    var updates = normalizeCustomer_(Object.assign({}, prev, body));
    updates.id = prev.id;
    if (updates.incrm === undefined) updates.incrm = isInCrm_(prev.incrm);
    if (updates.stage === undefined) {
      updates.stage = updates.incrm ? (normalizeCrmStage_(prev.stage) || 'lead') : (normalizeCrmStage_(prev.stage) || '');
    }
    if (body.stage != null || body.crmStage != null || body.inCrm != null || body.incrm != null) {
      updates.stageupdatedat = new Date().toISOString();
    } else {
      updates.stageupdatedat = prev.stageupdatedat || '';
    }
    updateObjectProps_(sheet, SHEET_NAMES.CUSTOMERS, prev._row, updates);
    return toApiCustomer_(updates);
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, customers[index]._row, SHEET_NAMES.CUSTOMERS);
    return { success: true };
  }
  throw new Error('Method not allowed');
}

/* ===================== NOTIFICATIONS (Email + WhatsApp hints) ===================== */

function getNotificationSettings_() {
  var settings = getSettings_() || {};
  var n = settings.notifications;
  if (typeof n === 'string') {
    try { n = JSON.parse(n); } catch (e) { n = {}; }
  }
  if (!n || typeof n !== 'object') n = {};
  return {
    whatsappEnabled: isNotifyOn_(n.whatsappEnabled != null ? n.whatsappEnabled : true),
    emailNewOrder: isNotifyOn_(n.emailNewOrder != null ? n.emailNewOrder : true),
    emailOrderStatus: isNotifyOn_(n.emailOrderStatus != null ? n.emailOrderStatus : true),
    emailInvoice: isNotifyOn_(n.emailInvoice != null ? n.emailInvoice : true),
    emailReady: isNotifyOn_(n.emailReady != null ? n.emailReady : true),
    emailDelivered: isNotifyOn_(n.emailDelivered != null ? n.emailDelivered : true),
    whatsappTemplates: (n.whatsappTemplates && typeof n.whatsappTemplates === 'object') ? n.whatsappTemplates : {},
    emailSubjects: (n.emailSubjects && typeof n.emailSubjects === 'object') ? n.emailSubjects : {},
  };
}

function getCompanyForNotify_() {
  var settings = getSettings_() || {};
  var company = settings.company;
  if (typeof company === 'string') {
    try { company = JSON.parse(company); } catch (e) { company = {}; }
  }
  if (!company || typeof company !== 'object') company = {};
  if (settings.companyLogo && !company.logo) company.logo = settings.companyLogo;
  return company;
}

function findCustomerPrefs_(orderApi) {
  var phone = String(orderApi.customerPhone || '').replace(/\D/g, '');
  var email = String(orderApi.customerEmail || '').trim().toLowerCase();
  var id = String(orderApi.customerId || '');
  var customers = getSheetRows_(SHEET_NAMES.CUSTOMERS);
  var match = customers.find(function (c) {
    if (id && String(c.id) === id) return true;
    var p = String(c.phone || '').replace(/\D/g, '');
    if (phone && p && (p === phone || p.slice(-10) === phone.slice(-10))) return true;
    if (email && String(c.email || '').trim().toLowerCase() === email) return true;
    return false;
  });
  if (!match) return { notifyWhatsApp: true, notifyEmail: true };
  return {
    notifyWhatsApp: isNotifyOn_(match.notifywhatsapp),
    notifyEmail: isNotifyOn_(match.notifyemail),
    phone: match.phone,
    email: match.email,
    name: match.name,
  };
}

function defaultWhatsAppTemplate_(event, status) {
  if (event === 'created') {
    return 'Dear {Customer Name},\n\nThank you for choosing {Company Name}.\n\nYour order has been created successfully.\n\nOrder No: {Order Number}\nTracking No: {Tracking Number}\n\nWe will keep you updated.\n\nThank you.\n{Company Name}';
  }
  if (event === 'invoice') {
    return 'Dear {Customer Name},\n\nYour invoice {Invoice Number} has been generated.\n\nTotal: {Amount}\nOrder No: {Order Number}\n\nThank you.\n{Company Name}';
  }
  if (status === 'Proof Approval') {
    return 'Dear {Customer Name},\n\nYour design has been completed and is ready for approval.\n\nOrder No: {Order Number}\n\n{Company Name}';
  }
  if (status === 'Printing') {
    return 'Dear {Customer Name},\n\nYour order is now in production.\n\nOrder No: {Order Number}\n\n{Company Name}';
  }
  if (status === 'Ready') {
    return 'Good news!\n\nYour order is ready for collection.\n\nOrder No: {Order Number}\nTracking No: {Tracking Number}\n\n{Company Name}';
  }
  if (status === 'Delivered') {
    return 'Dear {Customer Name},\n\nYour order has been delivered successfully.\n\nOrder No: {Order Number}\n\nThank you for choosing {Company Name}.';
  }
  return 'Dear {Customer Name},\n\nYour order {Order Number} status is now: {Status}.\n\nTracking No: {Tracking Number}\n\n{Company Name}';
}

function fillNotifyTemplate_(template, vars) {
  var out = String(template || '');
  Object.keys(vars).forEach(function (key) {
    var re = new RegExp('\\{' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\}', 'gi');
    out = out.replace(re, vars[key] != null ? String(vars[key]) : '');
  });
  return out.trim();
}

function buildNotifyVars_(orderApi, company, extras) {
  extras = extras || {};
  return {
    'Customer Name': orderApi.customerName || extras.customerName || 'Customer',
    'Order Number': orderApi.orderId || orderApi.id || '',
    'Tracking Number': orderApi.trackingNumber || '',
    Status: orderApi.status || extras.status || '',
    'Company Name': company.name || 'AMZ Prints',
    'Company Phone': company.phone || '',
    'Company Email': company.email || '',
    'Invoice Number': extras.invoiceNumber || '',
    Amount: extras.amount != null ? String(extras.amount) : String(orderApi.totalAmount || ''),
  };
}

function buildOrderEmailHtml_(orderApi, company, bodyText) {
  var logo = company.logo
    ? '<img src="' + company.logo + '" alt="logo" style="max-height:64px;max-width:180px;margin-bottom:12px" />'
    : '';
  var primary = '#F26522';
  return ''
    + '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1F2937">'
    + '<div style="background:linear-gradient(135deg,' + primary + ',#FF8A50);padding:20px;border-radius:12px 12px 0 0;color:#fff">'
    + '<h2 style="margin:0">' + (company.name || 'AMZ Prints') + '</h2>'
    + '<p style="margin:6px 0 0;opacity:.9">' + (company.tagline || 'Professional Printing Services') + '</p>'
    + '</div>'
    + '<div style="border:1px solid #E5E7EB;border-top:0;padding:20px;border-radius:0 0 12px 12px">'
    + logo
    + '<div style="white-space:pre-wrap;line-height:1.5;font-size:14px">' + String(bodyText || '').replace(/</g, '&lt;') + '</div>'
    + '<hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0" />'
    + '<p style="font-size:12px;color:#6B7280;margin:0">'
    + (company.phone ? ('Phone: ' + company.phone + '<br/>') : '')
    + (company.email ? ('Email: ' + company.email + '<br/>') : '')
    + (company.address ? ('Address: ' + company.address) : '')
    + '</p>'
    + '</div></div>';
}

function sendMailSafe_(to, subject, htmlBody, textBody) {
  if (!to) return { ok: false, reason: 'missing_email' };
  try {
    MailApp.sendEmail({
      to: String(to).trim(),
      subject: subject || 'Notification',
      htmlBody: htmlBody || '',
      body: textBody || String(htmlBody || '').replace(/<[^>]+>/g, ' '),
      name: (getCompanyForNotify_().name || 'AMZ Prints'),
    });
    return { ok: true, to: to };
  } catch (err) {
    try {
      GmailApp.sendEmail(String(to).trim(), subject || 'Notification', textBody || '', {
        htmlBody: htmlBody || '',
        name: (getCompanyForNotify_().name || 'AMZ Prints'),
      });
      return { ok: true, to: to, via: 'gmail' };
    } catch (err2) {
      return { ok: false, error: String(err2 && err2.message ? err2.message : err2) };
    }
  }
}

/**
 * Server-side email + WhatsApp payload for the client to open the app.
 * event: created | status | invoice
 */
function dispatchOrderNotifications_(orderApi, event, extras) {
  extras = extras || {};
  var notif = getNotificationSettings_();
  var company = getCompanyForNotify_();
  var prefs = findCustomerPrefs_(orderApi);
  var status = orderApi.status || extras.status || '';
  var vars = buildNotifyVars_(orderApi, company, extras);
  var templates = notif.whatsappTemplates || {};
  var template = templates[event === 'created' ? 'created' : (templates[status] ? status : 'status')]
    || (event === 'created' ? templates.created : (templates[status] || templates.status))
    || defaultWhatsAppTemplate_(event, status);
  var text = fillNotifyTemplate_(template, vars);

  var out = { email: null, whatsapp: null };

  // WhatsApp: return payload for frontend (cannot open Desktop app from GAS)
  if (notif.whatsappEnabled && prefs.notifyWhatsApp && (orderApi.customerPhone || prefs.phone)) {
    out.whatsapp = {
      phone: orderApi.customerPhone || prefs.phone,
      text: text,
    };
  }

  var wantEmail = false;
  if (event === 'created') wantEmail = notif.emailNewOrder;
  else if (event === 'invoice') wantEmail = notif.emailInvoice;
  else if (status === 'Ready') wantEmail = notif.emailReady && notif.emailOrderStatus;
  else if (status === 'Delivered') wantEmail = notif.emailDelivered && notif.emailOrderStatus;
  else wantEmail = notif.emailOrderStatus;

  var emailTo = orderApi.customerEmail || prefs.email || extras.email;
  if (wantEmail && prefs.notifyEmail && emailTo) {
    var subjects = notif.emailSubjects || {};
    var subjectKey = event === 'created' ? 'created' : (event === 'invoice' ? 'invoice' : (status === 'Ready' || status === 'Delivered' ? status : 'status'));
    var subjectTpl = subjects[subjectKey]
      || (subjectKey === 'created' ? 'Order Confirmed — {Order Number} | {Company Name}'
        : subjectKey === 'invoice' ? 'Invoice {Invoice Number} | {Company Name}'
          : 'Order Update — {Order Number} is now {Status}');
    var subject = fillNotifyTemplate_(subjectTpl, vars);
    var html = buildOrderEmailHtml_(orderApi, company, text);
    out.email = sendMailSafe_(emailTo, subject, html, text);
  }

  return out;
}

function withNotifications_(apiOrder, event, extras) {
  var result = Object.assign({}, apiOrder);
  try {
    result._notifications = dispatchOrderNotifications_(apiOrder, event, extras);
  } catch (err) {
    result._notifications = { error: String(err && err.message ? err.message : err) };
  }
  return result;
}

function handleNotifications_(path, method, body) {
  if (method === 'POST' && path === '/notifications/test') {
    var channel = String(body.channel || 'email').toLowerCase();
    if (channel === 'email') {
      var company = getCompanyForNotify_();
      var to = body.to || company.email;
      if (!to) throw new Error('Provide a test email address (or set company email in Settings)');
      var html = buildOrderEmailHtml_({
        customerName: 'Test Customer',
        orderId: 'ORD-TEST',
        trackingNumber: 'TRK-TEST',
        status: 'Order Received',
        totalAmount: 0,
      }, company, 'This is a test notification from AMZ Prints ERP.\n\nIf you received this, email notifications are working.');
      return sendMailSafe_(to, 'Test Notification | ' + (company.name || 'AMZ Prints'), html, 'Test notification from AMZ Prints ERP');
    }
    if (channel === 'whatsapp') {
      return {
        ok: true,
        whatsapp: {
          phone: body.phone || '',
          text: 'Test WhatsApp notification from AMZ Prints ERP.',
        },
        hint: 'Frontend should open WhatsApp Desktop/Mobile with this payload.',
      };
    }
    throw new Error('Unsupported channel: ' + channel);
  }

  if (method === 'POST' && path === '/notifications/email') {
    var order = body.order || {};
    var company2 = getCompanyForNotify_();
    var text = body.text || body.message || '';
    var html2 = body.html || buildOrderEmailHtml_(order, company2, text);
    return sendMailSafe_(body.to || order.customerEmail, body.subject || 'Notification', html2, text);
  }

  throw new Error('Not found');
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
    totalAmount: Number(o.totalamount != null && o.totalamount !== '' ? o.totalamount : (o.total != null ? o.total : 0)),
    advancePayment: Number(o.advancepayment || 0),
    balanceAmount: Number(
      o.balanceamount != null && o.balanceamount !== ''
        ? o.balanceamount
        : Math.max(0, Number(o.totalamount || o.total || 0) - Number(o.advancepayment || 0))
    ),
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
      var existingQ = body.id || body.orderId || body.orderid;
      if (existingQ) {
        var qIdx = findById_(orders, existingQ);
        if (qIdx >= 0 && String(orders[qIdx].doctype || '').toLowerCase() === 'quotation') {
          var qUpd = normalizeOrder_(body, orders[qIdx]);
          qUpd.id = orders[qIdx].id;
          qUpd.orderid = orders[qIdx].orderid;
          qUpd.doctype = 'Quotation';
          updateObjectProps_(sheet, SHEET_NAMES.ORDERS, orders[qIdx]._row, qUpd);
          return toApiOrder_(qUpd);
        }
      }
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
    // Never create a duplicate if an existing id/orderId is sent (edit mis-routed as create)
    var existingId = body.id || body.orderId || body.orderid;
    if (existingId) {
      var dupIdx = findById_(orders, existingId);
      if (dupIdx >= 0) {
        var prevDup = toApiOrder_(orders[dupIdx]);
        var updatedDup = normalizeOrder_(body, orders[dupIdx]);
        updatedDup.id = orders[dupIdx].id;
        updatedDup.orderid = orders[dupIdx].orderid;
        updateObjectProps_(sheet, SHEET_NAMES.ORDERS, orders[dupIdx]._row, updatedDup);
        var apiDup = toApiOrder_(updatedDup);
        if (String(prevDup.status || '') !== String(apiDup.status || '')) {
          return withNotifications_(apiDup, 'status');
        }
        return apiDup;
      }
    }
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
    return withNotifications_(toApiOrder_(record), 'created');
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
    var prevStatus = orders[index].status;
    updateObjectProps_(sheet, SHEET_NAMES.ORDERS, orders[index]._row, { status: body.status });
    orders[index].status = body.status;
    var apiStatus = toApiOrder_(orders[index]);
    if (String(prevStatus) !== String(body.status)) {
      return withNotifications_(apiStatus, 'status');
    }
    return apiStatus;
  }

  if (index < 0) throw new Error('Order not found');

  if (method === 'GET') return toApiOrder_(orders[index]);
  if (method === 'PUT') {
    var prev = toApiOrder_(orders[index]);
    var updated = normalizeOrder_(body, orders[index]);
    updated.id = orders[index].id;
    updated.orderid = orders[index].orderid;
    updateObjectProps_(sheet, SHEET_NAMES.ORDERS, orders[index]._row, updated);
    var apiUpdated = toApiOrder_(updated);
    if (String(prev.status || '') !== String(apiUpdated.status || '')) {
      return withNotifications_(apiUpdated, 'status');
    }
    return apiUpdated;
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, orders[index]._row, SHEET_NAMES.ORDERS);
    return { success: true };
  }
  throw new Error('Method not allowed');
}

/* ===================== GENERIC COLLECTION ===================== */

function handleCollection_(sheetName, path, method, body, basePath) {
  var sheet = (sheetName === SHEET_NAMES.EMPLOYEES || sheetName === SHEET_NAMES.CRM_NOTES)
    ? getOrCreateSheet_(sheetName)
    : getSheet_(sheetName);
  ensureHeaders_(sheet, sheetName);
  var rows = getSheetRows_(sheetName);

  if (path === basePath) {
    if (method === 'GET') return rows;
    if (method === 'POST') {
      var record = coerceKeys_(Object.assign({ id: sheetName.toLowerCase().slice(0, -1) + '_' + Date.now() }, body));
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
    var updates = coerceKeys_(Object.assign({}, rows[index], body));
    updateObjectProps_(sheet, sheetName, rows[index]._row, updates);
    return updates;
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, rows[index]._row, sheetName);
    return { success: true };
  }
  throw new Error('Method not allowed');
}

/* ===================== INVOICES ===================== */

function normalizeInvoice_(body, existing) {
  existing = existing || {};
  var items = body.items || body.Items || existing.items || [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch (e) { items = []; }
  }
  var taxRate = Number(
    body.taxRate != null ? body.taxRate : (body.taxrate != null ? body.taxrate : existing.taxrate || 0)
  );
  var subtotal = Number(
    body.subtotal != null ? body.subtotal : (existing.subtotal != null ? existing.subtotal : 0)
  );
  if (!subtotal && Array.isArray(items)) {
    subtotal = items.reduce(function (s, it) {
      return s + (Number(it.quantity || 0) * Number(it.rate || 0));
    }, 0);
  }
  var taxAmount = Number(
    body.tax != null && body.taxRate == null && body.taxrate == null
      ? body.tax
      : (subtotal * taxRate) / 100
  );
  if (body.tax != null && (body.taxRate != null || body.taxrate != null)) {
    taxAmount = Number(body.tax);
  }
  var discount = Number(body.discount != null ? body.discount : (existing.discount || 0));
  var total = Number(
    body.totalAmount != null ? body.totalAmount
      : (body.total != null ? body.total
        : (subtotal + taxAmount - discount))
  );
  return {
    id: body.id || existing.id || ('invoice_' + Date.now()),
    invoiceno: body.invoiceNumber || body.invoiceno || existing.invoiceno || '',
    date: body.date || existing.date || nowDate_(),
    duedate: body.dueDate || body.duedate || existing.duedate || '',
    orderid: body.orderId || body.orderid || existing.orderid || '',
    customerid: body.customerId || body.customerid || existing.customerid || '',
    customername: body.customerName || body.customername || existing.customername || '',
    customerphone: body.customerPhone || body.customerphone || existing.customerphone || '',
    customeremail: body.customerEmail || body.customeremail || existing.customeremail || '',
    customeraddress: body.customerAddress || body.customeraddress || existing.customeraddress || '',
    items: items,
    subtotal: subtotal,
    taxrate: taxRate,
    tax: taxAmount,
    discount: discount,
    previousbalance: Number(
      body.previousBalance != null ? body.previousBalance
        : (body.previousbalance != null ? body.previousbalance : existing.previousbalance || 0)
    ),
    total: total,
    paid: Number(
      body.paidAmount != null ? body.paidAmount
        : (body.paid != null ? body.paid : existing.paid || 0)
    ),
    status: body.status || existing.status || 'Unpaid',
    notes: body.notes || existing.notes || '',
    sharetoken: body.shareToken || body.sharetoken || existing.sharetoken
      || ('shr_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12)),
  };
}

function toApiInvoice_(inv) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceno || '',
    date: inv.date || '',
    dueDate: inv.duedate || '',
    orderId: inv.orderid || '',
    customerId: inv.customerid || '',
    customerName: inv.customername || '',
    customerPhone: inv.customerphone || '',
    customerEmail: inv.customeremail || '',
    customerAddress: inv.customeraddress || '',
    items: Array.isArray(inv.items) ? inv.items : [],
    subtotal: Number(inv.subtotal || 0),
    taxRate: Number(inv.taxrate || 0),
    tax: Number(inv.tax || 0),
    discount: Number(inv.discount || 0),
    previousBalance: Number(inv.previousbalance || 0),
    totalAmount: Number(inv.total || inv.totalamount || 0),
    paidAmount: Number(inv.paid || inv.paidamount || 0),
    status: inv.status || 'Unpaid',
    notes: inv.notes || '',
    shareToken: inv.sharetoken || '',
  };
}

function handleInvoices_(path, method, body) {
  var sheet = getSheet_(SHEET_NAMES.INVOICES);
  if (method === 'POST' || method === 'PUT') {
    ensureHeaders_(sheet, SHEET_NAMES.INVOICES);
  }
  var rows = getSheetRows_(SHEET_NAMES.INVOICES);

  if (path === '/invoices') {
    if (method === 'GET') return rows.map(toApiInvoice_);
    if (method === 'POST') {
      var existingInvId = body.id || body.invoiceNumber || body.invoiceno || body.invoiceNo;
      if (existingInvId) {
        var invDupIdx = findById_(rows, existingInvId);
        if (invDupIdx < 0) {
          invDupIdx = rows.findIndex(function (r) {
            return String(r.invoiceno || '') === String(body.invoiceNumber || body.invoiceno || '');
          });
        }
        if (invDupIdx >= 0) {
          var updInv = normalizeInvoice_(body, rows[invDupIdx]);
          updInv.id = rows[invDupIdx].id;
          if (!updInv.sharetoken) updInv.sharetoken = rows[invDupIdx].sharetoken;
          updateObjectProps_(sheet, SHEET_NAMES.INVOICES, rows[invDupIdx]._row, updInv);
          return toApiInvoice_(updInv);
        }
      }
      if (body.customerPhone || body.customerName) {
        var cust = upsertCustomer_({
          name: body.customerName,
          phone: body.customerPhone,
          email: body.customerEmail,
          address: body.customerAddress,
        });
        body.customerId = cust.id;
      }
      var created = normalizeInvoice_(body);
      appendObject_(sheet, SHEET_NAMES.INVOICES, created);
      var apiInv = toApiInvoice_(created);
      try {
        apiInv._notifications = dispatchOrderNotifications_({
          customerName: apiInv.customerName,
          customerPhone: apiInv.customerPhone,
          customerEmail: apiInv.customerEmail,
          customerId: apiInv.customerId,
          orderId: apiInv.orderId,
          trackingNumber: '',
          status: 'Invoice',
          totalAmount: apiInv.totalAmount,
        }, 'invoice', {
          invoiceNumber: apiInv.invoiceNumber || apiInv.invoiceNo,
          amount: apiInv.totalAmount,
          email: apiInv.customerEmail,
        });
      } catch (notifyErr) {
        apiInv._notifications = { error: String(notifyErr) };
      }
      return apiInv;
    }
    throw new Error('Method not allowed');
  }

  var id = path.split('/')[2];
  var index = findById_(rows, id);
  if (index < 0) throw new Error('Invoice not found');

  if (method === 'GET') return toApiInvoice_(rows[index]);
  if (method === 'PUT') {
    var updated = normalizeInvoice_(body, rows[index]);
    updated.id = rows[index].id;
    if (!updated.sharetoken) updated.sharetoken = rows[index].sharetoken;
    updateObjectProps_(sheet, SHEET_NAMES.INVOICES, rows[index]._row, updated);
    return toApiInvoice_(updated);
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, rows[index]._row, SHEET_NAMES.INVOICES);
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

/** Normalize sheet dates (Date objects / ISO) to yyyy-MM-dd for reliable filtering. */
function dateKey_(value) {
  if (value === null || value === undefined || value === '') return '';
  var tz = spreadsheetTz_();
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, tz, 'yyyy-MM-dd');
  }
  var s = String(value).trim();
  // Strip Sheets text-prefix apostrophe if present
  if (s.charAt(0) === "'") s = s.slice(1).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  var parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, tz, 'yyyy-MM-dd');
  }
  return s;
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
  var defaults = [
    { recordtype: 'Counter', countername: 'Table 01', accessholder: 'Design / Printing', prefix: 'A', lastnumber: 0, status: 'Active' },
    { recordtype: 'Counter', countername: 'Table 02', accessholder: 'NADRA', prefix: 'B', lastnumber: 0, status: 'Active' },
    { recordtype: 'Counter', countername: 'Table 03', accessholder: 'Documents', prefix: 'C', lastnumber: 0, status: 'Active' },
    { recordtype: 'Counter', countername: 'Executive Office', accessholder: 'Front Desk', prefix: 'E', lastnumber: 0, status: 'Active' },
  ];
  var existingNames = {};
  counters.forEach(function (c) {
    existingNames[String(c.counterName).toLowerCase()] = true;
  });
  defaults.forEach(function (c) {
    if (!existingNames[String(c.countername).toLowerCase()]) {
      appendObject_(sheet, SHEET_NAMES.COUNTERS, c);
    }
  });
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
    date: dateKey_(t.date) || t.date,
    time: t.time,
    counterName: t.countername,
    customerId: t.customerid,
    customerName: t.customername,
    customerPhone: t.customerphone,
    service: t.service,
    serviceNote: t.servicenote || '',
    status: t.tokenstatus || t.status || 'Waiting',
    calledAt: t.calledat || '',
    orderId: t.orderid || '',
    notes: t.notes || '',
  };
}

function resolveCounterForService_(serviceName, explicitCounter) {
  if (explicitCounter) return String(explicitCounter).trim();
  var key = String(serviceName || '').trim().toLowerCase();
  return SERVICE_COUNTER_MAP[key] || '';
}

function handleTokens_(path, method, body, params) {
  var sheet = getSheet_(SHEET_NAMES.COUNTERS);
  ensureHeaders_(sheet, SHEET_NAMES.COUNTERS);
  var rows = getSheetRows_(SHEET_NAMES.COUNTERS);
  var tokens = rows.filter(isTokenRow_);

  // GET /tokens?counter=Table%2001&status=Waiting&date=all
  if (path === '/tokens' && method === 'GET') {
    var filtered = tokens;
    if (params && params.counter && String(params.counter).toLowerCase() !== 'all') {
      filtered = filtered.filter(function (t) {
        return String(t.countername || '').toLowerCase() === String(params.counter).toLowerCase();
      });
    }
    if (params && params.status) {
      filtered = filtered.filter(function (t) {
        return String(t.tokenstatus || t.status || '').toLowerCase() === String(params.status).toLowerCase();
      });
    }
    var dateParam = params && params.date ? String(params.date) : 'today';
    if (dateParam && dateParam.toLowerCase() !== 'all') {
      var want = dateParam.toLowerCase() === 'today' ? nowDate_() : dateKey_(dateParam);
      filtered = filtered.filter(function (t) {
        var dk = dateKey_(t.date);
        // Include rows with blank date so new/legacy tokens still show in Today
        return !dk || dk === want;
      });
    }
    // Newest first
    filtered = filtered.slice().reverse();
    return filtered.map(toApiToken_);
  }

  // POST /tokens — book token
  if (path === '/tokens' && method === 'POST') {
    ensureHeaders_(sheet, SHEET_NAMES.COUNTERS);
    invalidateSheetCache_(SHEET_NAMES.COUNTERS);
    var counters = ensureDefaultCounters_();
    var serviceName = String(body.service || body.serviceName || '').trim();
    var counterName = resolveCounterForService_(serviceName, body.counterName || body.counter || '');
    if (!counterName && serviceName) {
      // Fuzzy: match map keys contained in service text
      var mapKeys = Object.keys(SERVICE_COUNTER_MAP);
      for (var mi = 0; mi < mapKeys.length; mi++) {
        if (serviceName.toLowerCase().indexOf(mapKeys[mi]) !== -1) {
          counterName = SERVICE_COUNTER_MAP[mapKeys[mi]];
          break;
        }
      }
    }
    if (!counterName) throw new Error('Select a service (or counter). Got service="' + serviceName + '"');
    var counter = counters.find(function (c) {
      return String(c.counterName).toLowerCase() === String(counterName).toLowerCase();
    });
    // Auto-create mapped counter if Sync Sheets was never run
    if (!counter) {
      var prefixes = { 'table 01': 'A', 'table 02': 'B', 'table 03': 'C', 'executive office': 'E' };
      var prefix = prefixes[String(counterName).toLowerCase()] || 'T';
      appendObject_(sheet, SHEET_NAMES.COUNTERS, {
        recordtype: 'Counter',
        countername: counterName,
        accessholder: 'Front Desk',
        prefix: prefix,
        lastnumber: 0,
        status: 'Active',
      });
      invalidateSheetCache_(SHEET_NAMES.COUNTERS);
      counters = getCounterMasters_();
      counter = counters.find(function (c) {
        return String(c.counterName).toLowerCase() === String(counterName).toLowerCase();
      });
    }
    if (!counter) throw new Error('Counter not found: ' + counterName + '. Click Sync Sheets.');
    if (String(counter.status || 'Active').toLowerCase() !== 'active') {
      throw new Error('Counter is not active: ' + counterName);
    }

    var customerName = String(body.customerName || body.name || '').trim();
    var customerPhone = String(body.customerPhone || body.phone || '').trim();
    if (!customerName || !customerPhone) {
      throw new Error('Customer name and phone are required');
    }

    var customer;
    try {
      customer = upsertCustomer_({
        name: customerName,
        phone: customerPhone,
        email: body.email,
        address: body.address,
      });
    } catch (custErr) {
      // Don't block token booking if Customers sheet has a temporary issue
      customer = { id: 'cust_temp_' + Date.now(), name: customerName, phone: customerPhone };
    }

    // Re-read counter row after possible cache changes
    invalidateSheetCache_(SHEET_NAMES.COUNTERS);
    counters = getCounterMasters_();
    counter = counters.find(function (c) {
      return String(c.counterName).toLowerCase() === String(counterName).toLowerCase();
    }) || counter;

    var tokenNo = nextTokenNo_(counter);
    var today = nowDate_();
    var token = {
      recordtype: 'Token',
      countername: counter.counterName,
      tokenno: tokenNo,
      date: sheetDateText_(today),
      time: nowTime_(),
      customerid: customer.id || '',
      customername: customer.name || customerName,
      customerphone: customer.phone || customerPhone,
      service: serviceName,
      servicenote: body.serviceNote || body.servicenote || '',
      tokenstatus: 'Waiting',
      calledat: '',
      orderid: '',
      notes: body.notes || '',
      id: 'token_' + Date.now(),
    };
    appendObject_(sheet, SHEET_NAMES.COUNTERS, token);
    // Return clean date (without Sheets apostrophe) to the client
    token.date = today;
    invalidateSheetCache_(SHEET_NAMES.COUNTERS);
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
  // One Orders + Customers + Invoices read for the whole dashboard
  var ordersAll = getSheetRows_(SHEET_NAMES.ORDERS);
  var invoices = getSheetRows_(SHEET_NAMES.INVOICES);
  var customers = getSheetRows_(SHEET_NAMES.CUSTOMERS);

  var quotations = ordersAll.filter(function (o) {
    return String(o.doctype || '').toLowerCase() === 'quotation';
  });
  var orders = ordersAll.filter(function (o) {
    return String(o.doctype || 'Order').toLowerCase() !== 'quotation';
  });

  var completed = orders.filter(function (o) {
    return String(o.status).toLowerCase().indexOf('deliver') !== -1;
  }).length;
  var readyCount = orders.filter(function (o) {
    return String(o.status || '').toLowerCase() === 'ready';
  }).length;
  var designingCount = orders.filter(function (o) {
    var s = String(o.status || '').toLowerCase();
    return s.indexOf('design') !== -1 || s.indexOf('proof') !== -1;
  }).length;
  var printingCount = orders.filter(function (o) {
    var s = String(o.status || '').toLowerCase();
    return s.indexOf('print') !== -1 || s.indexOf('finish') !== -1 || s.indexOf('pack') !== -1;
  }).length;

  var statusMap = {};
  orders.forEach(function (o) {
    var key = o.status || 'Unknown';
    statusMap[key] = (statusMap[key] || 0) + 1;
  });

  var invoiceRevenue = invoices.reduce(function (s, inv) {
    return s + Number(inv.total || inv.totalamount || 0);
  }, 0);
  var orderRevenue = orders.reduce(function (s, o) {
    return s + Number(o.totalamount || o.total || 0);
  }, 0);
  var revenue = invoiceRevenue || orderRevenue;
  var receivables = orders.reduce(function (s, o) { return s + Number(o.balanceamount || 0); }, 0);
  var collected = orders.reduce(function (s, o) { return s + Number(o.advancepayment || 0); }, 0);

  // Last 6 months sales from orders
  var monthMap = {};
  var now = new Date();
  for (var m = 5; m >= 0; m--) {
    var d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    var key = Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Karachi', 'yyyy-MM');
    var label = Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Karachi', 'MMM');
    monthMap[key] = { month: label, sales: 0, orders: 0, key: key };
  }
  orders.forEach(function (o) {
    var dk = dateKey_(o.date);
    if (!dk || dk.length < 7) return;
    var mk = dk.slice(0, 7);
    if (monthMap[mk]) {
      monthMap[mk].sales += Number(o.totalamount || o.total || 0);
      monthMap[mk].orders += 1;
    }
  });
  var monthlySales = Object.keys(monthMap).sort().map(function (k) {
    return { month: monthMap[k].month, sales: monthMap[k].sales, orders: monthMap[k].orders };
  });

  // Needs attention: Ready + high balance
  var attention = orders
    .filter(function (o) {
      var s = String(o.status || '').toLowerCase();
      var bal = Number(o.balanceamount || 0);
      return s === 'ready' || bal > 0;
    })
    .sort(function (a, b) {
      return Number(b.balanceamount || 0) - Number(a.balanceamount || 0);
    })
    .slice(0, 6)
    .map(toApiOrder_);

  return {
    stats: {
      totalQuotations: quotations.length,
      totalOrders: orders.length,
      totalInvoices: invoices.length,
      pendingOrders: Math.max(0, orders.length - completed),
      completedOrders: completed,
      readyOrders: readyCount,
      designingOrders: designingCount,
      printingOrders: printingCount,
      revenue: revenue,
      expenses: 0,
      receivables: receivables,
      collected: collected,
      payables: 0,
      activeCustomers: customers.length,
      fulfillmentRate: orders.length ? Math.round((completed / orders.length) * 100) : 0,
      collectionRate: revenue > 0 ? Math.round((collected / revenue) * 100) : 0,
    },
    charts: {
      monthlySales: monthlySales,
      orderStatus: Object.keys(statusMap).map(function (name) {
        return { name: name, value: statusMap[name] };
      }),
    },
    recentOrders: orders.slice(-8).reverse().map(toApiOrder_),
    attention: attention,
  };
}

function getDashboardStats_() {
  var boot = getDashboardBootstrap_();
  return boot.stats;
}

function getDashboardCharts_() {
  var boot = getDashboardBootstrap_();
  return boot.charts;
}

function getRecentOrders_() {
  return getSheetRows_(SHEET_NAMES.ORDERS)
    .slice(-5)
    .reverse()
    .map(toApiOrder_);
}

function parseSettingsValue_(value) {
  if (value === null || value === undefined || value === '') return value;
  if (typeof value === 'object') return value;
  if (typeof value === 'boolean' || typeof value === 'number') return value;
  var s = String(value).trim();
  if (!s) return '';
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if ((s.charAt(0) === '{' || s.charAt(0) === '[') && s.length > 1) {
    try { return JSON.parse(s); } catch (e) { return value; }
  }
  return value;
}

function getSettings_() {
  var sheet = getSheet_(SHEET_NAMES.SETTINGS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return {};

  var values = sheet.getRange(1, 1, lastRow, Math.max(lastCol, 2)).getValues();
  var header0 = String(values[0][0] || '').trim().toLowerCase();
  var header1 = String(values[0][1] || '').trim().toLowerCase();
  var obj = {};

  if (header0 === 'key' && (header1 === 'value' || header1 === '')) {
    for (var i = 1; i < values.length; i++) {
      var k = String(values[i][0] || '').trim();
      if (!k) continue;
      obj[k] = parseSettingsValue_(values[i][1]);
    }
  } else {
    var headers = values[0];
    var row = values[1] || [];
    headers.forEach(function (h, i) {
      var key = String(h || '').trim();
      if (!key) return;
      obj[key] = parseSettingsValue_(row[i]);
    });
  }

  if (typeof obj.company === 'string') {
    obj.company = parseSettingsValue_(obj.company) || {};
  }
  if (!obj.company || typeof obj.company !== 'object') obj.company = {};
  // Prefer dedicated image keys — even empty string clears nested stale stamp/signature
  if (Object.prototype.hasOwnProperty.call(obj, 'companyLogo')) obj.company.logo = obj.companyLogo || '';
  if (Object.prototype.hasOwnProperty.call(obj, 'companyStamp')) obj.company.stamp = obj.companyStamp || '';
  if (Object.prototype.hasOwnProperty.call(obj, 'companySignature')) obj.company.signature = obj.companySignature || '';

  ['invoice', 'theme', 'orders', 'customers', 'crm', 'products', 'payments', 'users', 'notifications', 'system', 'designers', 'employees'].forEach(function (sec) {
    if (typeof obj[sec] === 'string') obj[sec] = parseSettingsValue_(obj[sec]);
  });

  return obj;
}

function updateSettings_(body) {
  var sheet = getSheet_(SHEET_NAMES.SETTINGS);

  // Read existing FIRST (before any format conversion)
  var existing = {};
  try { existing = getSettings_() || {}; } catch (e) { existing = {}; }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var isKeyValue = false;
  if (lastRow >= 1 && lastCol >= 1) {
    var h = sheet.getRange(1, 1, 1, Math.min(lastCol, 2)).getValues()[0];
    isKeyValue = String(h[0] || '').trim().toLowerCase() === 'key';
  }
  if (!isKeyValue) {
    sheet.clear();
    sheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]);
  } else if (lastRow < 1) {
    sheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]);
  }

  var incoming = body && typeof body === 'object' ? body : {};
  var payload = Object.assign({}, existing, incoming);

  ['company', 'invoice', 'theme', 'orders', 'customers', 'crm', 'products', 'payments', 'users', 'notifications', 'system', 'designers', 'employees'].forEach(function (sec) {
    var base = (existing[sec] && typeof existing[sec] === 'object') ? existing[sec] : {};
    var next = (incoming[sec] && typeof incoming[sec] === 'object') ? incoming[sec] : null;
    if (next) payload[sec] = Object.assign({}, base, next);
  });

  if (payload.company && typeof payload.company === 'object') {
    var company = Object.assign({}, payload.company);
    if (company.logo) {
      payload.companyLogo = company.logo;
      company.logo = '';
    }
    if (company.stamp) {
      payload.companyStamp = company.stamp;
      company.stamp = '';
    }
    if (company.signature) {
      payload.companySignature = company.signature;
      company.signature = '';
    }
    // Allow explicit clear / replace from top-level keys
    if (Object.prototype.hasOwnProperty.call(incoming, 'companyLogo')) {
      payload.companyLogo = incoming.companyLogo || '';
    }
    if (Object.prototype.hasOwnProperty.call(incoming, 'companyStamp')) {
      payload.companyStamp = incoming.companyStamp || '';
    }
    if (Object.prototype.hasOwnProperty.call(incoming, 'companySignature')) {
      payload.companySignature = incoming.companySignature || '';
    }
    payload.company = company;
  }

  var dataLast = sheet.getLastRow();
  var keyToRow = {};
  if (dataLast >= 2) {
    var keyCol = sheet.getRange(2, 1, dataLast, 1).getValues();
    for (var r = 0; r < keyCol.length; r++) {
      var rk = String(keyCol[r][0] || '').trim();
      if (rk) keyToRow[rk] = r + 2;
    }
  }

  var keys = Object.keys(payload);
  var skipped = [];
  keys.forEach(function (k) {
    if (k === '_row' || k === '_status' || k === '_warnings') return;
    var cell = serializeCell_(payload[k]);
    if (typeof cell === 'string' && cell.length > 49000) {
      if (k === 'companyLogo' || k === 'companyStamp' || k === 'companySignature') {
        skipped.push(k + ' (too large for Sheets cell)');
        return;
      }
      cell = cell.slice(0, 49000);
      skipped.push(k + ' (truncated)');
    }
    try {
      if (keyToRow[k]) {
        sheet.getRange(keyToRow[k], 1, 1, 2).setValues([[k, cell]]);
      } else {
        sheet.appendRow([k, cell]);
      }
    } catch (writeErr) {
      skipped.push(k + ': ' + (writeErr.message || writeErr));
    }
  });

  SpreadsheetApp.flush();
  invalidateSheetCache_(SHEET_NAMES.SETTINGS);
  var saved = getSettings_();
  if (skipped.length) saved._warnings = skipped;
  return saved;
}

function getReports_(params) {
  var stats = getDashboardStats_();
  return { period: (params && params.period) || 'month', summary: stats };
}

function handlePublic_(path, method) {
  if (method === 'GET' && path === '/public/branding') {
    var settings = getSettings_();
    var company = settings.company || {};
    if (typeof company !== 'object') company = {};
    if (Object.prototype.hasOwnProperty.call(settings, 'companyLogo')) company.logo = settings.companyLogo || '';
    else company.logo = company.logo || '';
    if (Object.prototype.hasOwnProperty.call(settings, 'companyStamp')) company.stamp = settings.companyStamp || '';
    else company.stamp = company.stamp || '';
    if (Object.prototype.hasOwnProperty.call(settings, 'companySignature')) company.signature = settings.companySignature || '';
    else company.signature = company.signature || '';
    return {
      company: company,
      theme: settings.theme || {},
      invoice: settings.invoice || {},
      companyLogo: company.logo || '',
      companyStamp: company.stamp || '',
      companySignature: company.signature || '',
    };
  }
  if (method === 'GET' && path.indexOf('/public/invoice/') === 0) {
    var token = path.replace('/public/invoice/', '');
    var invoices = getSheetRows_(SHEET_NAMES.INVOICES);
    var invoice = invoices.find(function (i) { return String(i.sharetoken) === token; });
    if (!invoice) throw new Error('Invoice not found');
    return toApiInvoice_(invoice);
  }
  if (method === 'GET' && path.indexOf('/public/track/') === 0) {
    var tracking = decodeURIComponent(path.replace('/public/track/', '')).trim();
    var needle = tracking.toLowerCase();
    var orders = getSheetRows_(SHEET_NAMES.ORDERS);
    var order = orders.find(function (o) {
      if (String(o.doctype || 'Order').toLowerCase() === 'quotation') return false;
      var keys = [o.trackingnumber, o.orderid, o.id, o.tokenno]
        .map(function (v) { return String(v || '').trim().toLowerCase(); })
        .filter(Boolean);
      return keys.indexOf(needle) !== -1;
    });
    if (!order) throw new Error('Order not found for: ' + tracking);
    return toPublicTrackOrder_(order);
  }
  throw new Error('Not found');
}

/** Customer-safe tracking payload (no login). */
function toPublicTrackOrder_(o) {
  var api = toApiOrder_(o);
  var pipeline = [
    'Order Received', 'Designing', 'Proof Approval', 'Printing',
    'Finishing', 'Packing', 'Ready', 'Delivered'
  ];
  var status = String(api.status || '');
  var cancelled = status.toLowerCase() === 'cancelled';
  var idx = cancelled ? -1 : pipeline.indexOf(status);
  if (idx < 0 && !cancelled) {
    for (var i = 0; i < pipeline.length; i++) {
      if (pipeline[i].toLowerCase() === status.toLowerCase()) { idx = i; break; }
    }
  }
  var timeline = pipeline.map(function (s, i) {
    return {
      status: s,
      done: !cancelled && idx >= 0 && i <= idx,
      current: !cancelled && s === status,
    };
  });
  var products = (api.products || []).map(function (p) {
    return {
      name: p.name || '',
      quantity: Number(p.quantity) || 0,
      size: p.size || '',
      material: p.material || '',
    };
  });
  return {
    orderId: api.orderId || '',
    trackingNumber: api.trackingNumber || api.orderId || '',
    tokenNo: api.tokenNo || '',
    status: api.status || '',
    cancelled: cancelled,
    date: api.date || '',
    deliveryDate: api.deliveryDate || '',
    customerName: api.customerName || '',
    products: products,
    totalAmount: Number(api.totalAmount) || 0,
    advancePayment: Number(api.advancePayment) || 0,
    balanceAmount: Number(api.balanceAmount) || 0,
    timeline: timeline,
    trackCode: api.trackingNumber || api.orderId || api.id || '',
    companyNote: 'For questions, contact Amazon Printing Services with your Order ID.',
  };
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

    if (path === '/employees' || path.indexOf('/employees/') === 0) {
      getOrCreateSheet_(SHEET_NAMES.EMPLOYEES);
      return jsonResponse_(handleCollection_(SHEET_NAMES.EMPLOYEES, path, method, body, '/employees'));
    }

    if (path === '/products' || path.indexOf('/products/') === 0) {
      return jsonResponse_(handleProducts_(path, method, body));
    }

    if (path === '/invoices' || path.indexOf('/invoices/') === 0) {
      return jsonResponse_(handleInvoices_(path, method, body));
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
    if (path.indexOf('/notifications/') === 0) {
      return jsonResponse_(handleNotifications_(path, method, body));
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
    SHEET_NAMES.CRM_NOTES,
    SHEET_NAMES.EMPLOYEES,
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
      var needsCreate = name === SHEET_NAMES.CRM_NOTES || name === SHEET_NAMES.EMPLOYEES;
      var sheet = needsCreate ? getOrCreateSheet_(name) : getSheet_(name);
      var headers = ensureHeaders_(sheet, name);
      report.push({ sheet: name, ok: true, columns: headers.length, headers: headers });
    } catch (err) {
      report.push({ sheet: name, ok: false, error: err.message });
    }
  });
  ensureDefaultCounters_();
  var adminCreds = resetAdminLogin_();
  Logger.log(JSON.stringify(report, null, 2));
  return { sheets: report, admin: adminCreds };
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
