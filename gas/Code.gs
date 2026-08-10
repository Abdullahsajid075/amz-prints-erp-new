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
  Users: ['Username', 'Password', 'Name', 'Role', 'Status', 'Permissions', 'EmployeeId'],
  Customers: [
    'Id', 'Name', 'Phone', 'Email', 'Address', 'City', 'Notes',
    'InCrm', 'Stage', 'StageUpdatedAt', 'NotifyWhatsApp', 'NotifyEmail', 'PortalPassword'
  ],
  CrmNotes: ['Id', 'CustomerId', 'Note', 'CreatedAt', 'CreatedBy'],
  Employees: [
    'Id', 'EmployeeCode', 'Name', 'Phone', 'Email', 'Cnic', 'Role', 'Designation', 'Department',
    'JoinDate', 'EndDate', 'ValidFrom', 'ValidUntil', 'Salary', 'Status', 'Address', 'City',
    'EmergencyContact', 'EmergencyPhone', 'Notes', 'Photo'
  ],
  Orders: [
    'Id', 'OrderId', 'Date', 'CustomerId', 'CustomerName', 'CustomerPhone',
    'CustomerEmail', 'CustomerAddress', 'Status', 'DeliveryDate', 'Products',
    'TotalAmount', 'AdvancePayment', 'BalanceAmount', 'Remarks', 'AssignedDesigner', 'TokenNo',
    'DocType', 'TrackingNumber', 'StatusHistory', 'DeliveryAddress', 'QuotationId',
    'PaymentMethod', 'PaymentStatus', 'Discount', 'DeliveryCharges', 'OrderSource', 'PaymentHistory'
  ],
  Products: [
    'Id', 'Name', 'Category', 'Rate', 'SalePrice', 'Unit', 'Description', 'FullDescription', 'Status', 'ProductType',
    'Designer', 'Stock', 'Material', 'Size', 'MinQuantity', 'Image', 'ShowOnWebsite', 'ShowOnTop', 'Variations'
  ],
  Invoices: [
    'Id', 'InvoiceNo', 'Date', 'DueDate', 'OrderId', 'CustomerId', 'CustomerName', 'CustomerPhone',
    'CustomerEmail', 'CustomerAddress', 'Items', 'Subtotal', 'TaxRate', 'Tax', 'Discount',
    'PreviousBalance', 'Total', 'Paid', 'Status', 'Notes', 'ShareToken'
  ],
  Vendors: ['Id', 'Name', 'Phone', 'Email', 'Address', 'Notes'],
  Purchases: [
    'Id', 'PurchaseNo', 'Date', 'VendorId', 'VendorName', 'Items', 'Total', 'Paid', 'Status',
    'VendorInvoiceNumber', 'ExpectedDeliveryDate', 'ActualDeliveryDate', 'LinkedOrderId', 'Notes'
  ],
  Expenses: ['Id', 'Date', 'Category', 'Amount', 'Description', 'PaymentMethod'],
  Payments: [
    'Id', 'Date', 'Type', 'Category', 'RefId', 'CustomerName', 'CustomerId',
    'PartyPhone', 'PartyEmail', 'Amount', 'Method', 'Notes', 'BalanceDue', 'TotalAmount'
  ],
  Counters: [
    'RecordType', 'CounterName', 'AccessHolder', 'Prefix', 'LastNumber', 'Status',
    'TokenNo', 'Date', 'Time', 'CustomerId', 'CustomerName', 'CustomerPhone', 'CustomerEmail',
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
    image: 'image', productimage: 'image', img: 'image', picture: 'photo',
    photo: 'photo', employeecode: 'employeecode', cnic: 'cnic', designation: 'designation',
    validfrom: 'validfrom', validuntil: 'validuntil', enddate: 'enddate',
    emergencycontact: 'emergencycontact', emergencyphone: 'emergencyphone', employeeid: 'employeeid',
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
    vendorid: 'vendorid', purchaseno: 'purchaseno', ponumber: 'purchaseno',
    purchasedate: 'date', totalamount: 'total',
    vendorinvoicenumber: 'vendorinvoicenumber', expecteddeliverydate: 'expecteddeliverydate',
    actualdeliverydate: 'actualdeliverydate', linkedorderid: 'linkedorderid',
    refid: 'refid',
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
    partyemail: ['partyemail', 'email', 'customeremail'],
    customeremail: ['customeremail', 'email', 'partyemail'],
    refid: ['refid', 'reference'],
    tokenstatus: ['tokenstatus'],
    status: ['status'],
    service: ['service', 'product', 'products'],
    total: ['total', 'totalamount'],
    paid: ['paid', 'paidamount'],
    tax: ['tax'],
    image: ['image', 'photo'],
    photo: ['photo', 'image'],
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
  // Ensure missing columns (e.g. VendorId / VendorName) exist before writing
  var headers = ensureHeaders_(sheet, sheetName);
  var flat = coerceKeys_(updates);
  headers.forEach(function (rawHeader, i) {
    var key = normalizeHeader_(rawHeader);
    if (!key) return;
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
    permissions: parsePermissions_(user.permissions),
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

/** One shared Walk-in customer for POS — created once, never duplicated. */
function ensureWalkInCustomer_() {
  var sheet = getSheet_(SHEET_NAMES.CUSTOMERS);
  ensureHeaders_(sheet, SHEET_NAMES.CUSTOMERS);
  var customers = getSheetRows_(SHEET_NAMES.CUSTOMERS);
  var walk = customers.find(function (c) {
    if (String(c.id) === 'cust_walkin') return true;
    var n = String(c.name || '').trim().toLowerCase().replace(/[\s_\-]+/g, '');
    return n === 'walkin' || n === 'walking';
  });
  if (walk) return toApiCustomer_(walk);

  var data = {
    id: 'cust_walkin',
    name: 'Walk-in',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: 'Default POS walk-in customer (do not duplicate)',
    incrm: false,
    stage: '',
    stageupdatedat: '',
    notifywhatsapp: false,
    notifyemail: false,
  };
  appendObject_(sheet, SHEET_NAMES.CUSTOMERS, data);
  invalidateSheetCache_(SHEET_NAMES.CUSTOMERS);
  return toApiCustomer_(data);
}

function upsertCustomer_(body) {
  var data = normalizeCustomer_(body);
  if (!data.name && !data.phone) throw new Error('Customer name or phone required');

  var sheet = getSheet_(SHEET_NAMES.CUSTOMERS);
  // Never spawn another Walk-in — always reuse the single shared record
  var nameNorm = String(data.name || '').trim().toLowerCase().replace(/[\s_\-]+/g, '');
  if (nameNorm === 'walkin' || nameNorm === 'walking' || String(data.id) === 'cust_walkin') {
    return ensureWalkInCustomer_();
  }
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
    var payRows = [];
    try {
      payRows = getSheetRows_(SHEET_NAMES.PAYMENTS).filter(function (p) {
        var t = String(p.type || 'inflow').toLowerCase();
        if (t === 'outflow' || t === 'out') return false;
        return String(p.customerid) === String(customer.id)
          || String(p.partyphone || p.phone || '') === String(customer.phone || '')
          || String(p.customername || p.party || '').toLowerCase() === String(customer.name || '').toLowerCase();
      });
    } catch (eLed) { payRows = []; }
    var invRows = [];
    try {
      invRows = getSheetRows_(SHEET_NAMES.INVOICES).filter(function (inv) {
        return String(inv.customerid) === String(customer.id)
          || String(inv.customerphone) === String(customer.phone);
      });
    } catch (eInv) { invRows = []; }
    var orderPaid = orders.reduce(function (s, o) { return s + Number(o.advancepayment || 0); }, 0);
    var paymentPaid = payRows.reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
    var billed = orders.reduce(function (s, o) { return s + Number(o.totalamount || o.total || 0); }, 0);
    // Prefer order balances for outstanding; payments already reflected when applied to orders
    var outstanding = orders.reduce(function (s, o) { return s + Number(o.balanceamount || 0); }, 0);
    return {
      customer: toApiCustomer_(customer),
      invoices: invRows.map(toApiInvoice_),
      orders: orders.map(toApiOrder_),
      payments: payRows.map(function (p) {
        return {
          id: p.id,
          date: p.date || '',
          type: p.type || 'inflow',
          amount: Number(p.amount || 0),
          method: p.method || '',
          reference: p.refid || p.reference || '',
          party: p.customername || p.party || '',
          notes: p.notes || '',
        };
      }),
      totalBilled: billed,
      totalPaid: Math.max(orderPaid, paymentPaid),
      outstanding: outstanding,
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

/** All ERP emails should appear from this mailbox (deploy Apps Script as this Google account). */
var NOTIFY_FROM_EMAIL_ = 'amazonprinting@gmail.com';
var NOTIFY_FROM_NAME_ = 'Amazon Printing Services';

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
    emailPayment: isNotifyOn_(n.emailPayment != null ? n.emailPayment : true),
    emailToken: isNotifyOn_(n.emailToken != null ? n.emailToken : true),
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
  if (!company.name) company.name = NOTIFY_FROM_NAME_;
  if (!String(company.email || '').trim()) company.email = NOTIFY_FROM_EMAIL_;
  return company;
}

function isValidEmail_(value) {
  var s = String(value || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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
    return 'Dear {Customer Name},\nYour order #{Order Number} is ready for pickup/delivery.\n\nPlease visit our office to receive your Order\n\n*( Paid Home Delivery Available )*\n\nThank you for choosing Amazon Printing Services.\n\n📍 King Road, Mandi Bahauddin\n🌐 amzprints.com\n\nTrack your order : {Track Url}';
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
  var trackNo = orderApi.trackingNumber || extras.trackingNumber || '';
  var trackUrl = extras.trackUrl || '';
  if (!trackUrl && trackNo) {
    trackUrl = 'https://erp.amzprints.com/track/' + encodeURIComponent(trackNo);
  }
  return {
    'Customer Name': orderApi.customerName || extras.customerName || 'Customer',
    'Order Number': orderApi.orderId || orderApi.id || '',
    'Tracking Number': trackNo,
    'Track Url': trackUrl,
    TrackUrl: trackUrl,
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

function isMailAuthError_(msg) {
  var s = String(msg || '').toLowerCase();
  return s.indexOf('permission') >= 0
    || s.indexOf('authorization') >= 0
    || s.indexOf('required permissions') >= 0
    || s.indexOf('access not granted') >= 0
    || s.indexOf('oauth') >= 0
    || s.indexOf('not been authorized') >= 0;
}

/** Short user-facing mail error (never dump Google OAuth scope URLs into ERP toasts). */
function friendlyMailError_(err) {
  var raw = String(err && err.message ? err.message : (err || ''));
  if (isMailAuthError_(raw)) {
    return 'Email not authorized. Open Apps Script as ' + NOTIFY_FROM_EMAIL_
      + ' → Review permissions / Run a function → Allow Mail → Deploy → New version.';
  }
  if (raw.length > 140) return raw.slice(0, 140) + '…';
  return raw || 'Email send failed';
}

/**
 * Send email as Amazon Printing.
 * From address = Google account that deployed/runs this web app (must be amazonprinting@gmail.com).
 * Reply-To always amazonprinting@gmail.com (or company email).
 * Prefers MailApp (script.send_mail). GmailApp is only a non-auth fallback.
 */
function sendMailSafe_(to, subject, htmlBody, textBody) {
  to = String(to || '').trim();
  if (!isValidEmail_(to)) return { ok: false, reason: 'missing_email', error: 'Valid customer email is required' };

  var company = getCompanyForNotify_();
  var fromName = company.name || NOTIFY_FROM_NAME_;
  var replyTo = isValidEmail_(company.email) ? String(company.email).trim() : NOTIFY_FROM_EMAIL_;
  var plain = textBody || String(htmlBody || '').replace(/<[^>]+>/g, ' ');
  var mailAppError = '';

  try {
    MailApp.sendEmail({
      to: to,
      subject: subject || 'Notification',
      htmlBody: htmlBody || '',
      body: plain,
      name: fromName,
      replyTo: replyTo,
    });
    return { ok: true, to: to, replyTo: replyTo, via: 'mailapp', fromHint: NOTIFY_FROM_EMAIL_ };
  } catch (err) {
    mailAppError = String(err && err.message ? err.message : err);
    // Auth/scope problems — do not fall through to GmailApp (longer scary OAuth error)
    if (isMailAuthError_(mailAppError)) {
      return {
        ok: false,
        reason: 'auth',
        error: friendlyMailError_(err),
        hint: 'Authorize Mail as ' + NOTIFY_FROM_EMAIL_ + ', then Deploy → New version',
      };
    }
  }

  // Non-auth MailApp failure (quota / transient) — optional GmailApp retry
  try {
    var opts = {
      htmlBody: htmlBody || '',
      name: fromName,
      replyTo: replyTo,
    };
    GmailApp.sendEmail(to, subject || 'Notification', plain, opts);
    return {
      ok: true,
      to: to,
      replyTo: replyTo,
      via: 'gmail',
      note: 'Deploy Apps Script as ' + NOTIFY_FROM_EMAIL_ + ' so the From address matches',
    };
  } catch (err2) {
    return {
      ok: false,
      reason: isMailAuthError_(err2) || isMailAuthError_(mailAppError) ? 'auth' : 'send_failed',
      error: friendlyMailError_(err2) || friendlyMailError_(mailAppError),
      hint: 'Authorize Mail as ' + NOTIFY_FROM_EMAIL_ + ' (appsscript.json mail scopes), then Deploy → New version',
    };
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
  else if (event === 'payment_received' || event === 'payment_sent' || event === 'payment') wantEmail = notif.emailPayment;
  else if (event === 'token_booked' || event === 'token_called' || event === 'token') wantEmail = notif.emailToken;
  else if (status === 'Ready') wantEmail = notif.emailReady && notif.emailOrderStatus;
  else if (status === 'Delivered') wantEmail = notif.emailDelivered && notif.emailOrderStatus;
  else wantEmail = notif.emailOrderStatus;

  var emailTo = orderApi.customerEmail || prefs.email || extras.email;
  if (wantEmail && prefs.notifyEmail && emailTo) {
    if (!isValidEmail_(emailTo)) {
      out.email = { ok: false, reason: 'missing_email', error: 'Valid customer email is required' };
    } else {
      var subjects = notif.emailSubjects || {};
      var subjectKey = event === 'created' ? 'created'
        : (event === 'invoice' ? 'invoice'
          : (event === 'payment_received' ? 'payment_received'
            : (event === 'payment_sent' ? 'payment_sent'
              : (event === 'token_booked' ? 'token_booked'
                : (event === 'token_called' ? 'token_called'
                  : (status === 'Ready' || status === 'Delivered' ? status : 'status'))))));
      var subjectTpl = subjects[subjectKey]
        || (subjectKey === 'created' ? 'Order Confirmed — {Order Number} | {Company Name}'
          : subjectKey === 'invoice' ? 'Invoice {Invoice Number} | {Company Name}'
            : subjectKey === 'payment_received' ? 'Payment Received | {Company Name}'
              : subjectKey === 'payment_sent' ? 'Payment Sent | {Company Name}'
                : subjectKey === 'token_booked' ? 'Token Booked — {Order Number} | {Company Name}'
                  : subjectKey === 'token_called' ? 'Token Called — {Order Number} | {Company Name}'
                    : 'Order Update — {Order Number} is now {Status}');
      var subject = fillNotifyTemplate_(subjectTpl, vars);
      var html = buildOrderEmailHtml_(orderApi, company, text);
      out.email = sendMailSafe_(emailTo, subject, html, text);
    }
  } else if (wantEmail && prefs.notifyEmail && !emailTo) {
    out.email = { ok: false, reason: 'missing_email', error: 'Customer email is required for email notifications' };
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
      var to = body.to || company.email || NOTIFY_FROM_EMAIL_;
      if (!isValidEmail_(to)) throw new Error('Provide a valid test email address (or set company email in Settings)');
      var html = buildOrderEmailHtml_({
        customerName: 'Test Customer',
        orderId: 'ORD-TEST',
        trackingNumber: 'TRK-TEST',
        status: 'Order Received',
        totalAmount: 0,
      }, company, 'This is a test notification from Amazon Printing Services.\n\nSent via Apps Script as ' + NOTIFY_FROM_EMAIL_ + '.\n\nIf you received this, email notifications are working.');
      var testResult = sendMailSafe_(to, 'Test Notification | ' + (company.name || NOTIFY_FROM_NAME_), html, 'Test notification from Amazon Printing Services');
      testResult.fromAccountHint = NOTIFY_FROM_EMAIL_;
      return testResult;
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
    var toAddr = body.to || order.customerEmail || (body.invoice && body.invoice.customerEmail) || '';
    if (!isValidEmail_(toAddr)) {
      return { ok: false, reason: 'missing_email', error: 'Customer email is required for email notifications' };
    }
    return sendMailSafe_(toAddr, body.subject || 'Notification', html2, text);
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
  var products = body.products != null ? body.products : (body.items != null ? body.items : existing.products);
  if (typeof products === 'string') {
    try { products = JSON.parse(products); } catch (e) { products = existing.products || []; }
  }
  if (!Array.isArray(products)) products = [];
  // Strip UI-only keys; keep catalog fields that matter for reprints / slips
  products = products.map(function (p) {
    p = p || {};
    return {
      productId: p.productId || p.id || '',
      name: p.name || '',
      quantity: Number(p.quantity) || 0,
      rate: Number(p.rate) || 0,
      size: p.size || '',
      material: p.material || '',
      notes: p.notes || '',
    };
  });
  function pick(keyCamel, keyLower, fallback) {
    if (body[keyCamel] !== undefined && body[keyCamel] !== null) return body[keyCamel];
    if (body[keyLower] !== undefined && body[keyLower] !== null) return body[keyLower];
    return fallback;
  }
  return {
    id: body.id || existing.id || ('order_' + Date.now()),
    orderid: body.orderId || body.orderid || existing.orderid || nextOrderId_(),
    date: pick('date', 'date', existing.date || nowDate_()) || nowDate_(),
    customerid: pick('customerId', 'customerid', existing.customerid || '') || '',
    customername: pick('customerName', 'customername', existing.customername || '') || '',
    customerphone: pick('customerPhone', 'customerphone', existing.customerphone || '') || '',
    customeremail: pick('customerEmail', 'customeremail', existing.customeremail || '') || '',
    customeraddress: pick('customerAddress', 'customeraddress', existing.customeraddress || '') || '',
    status: pick('status', 'status', existing.status || 'Order Received') || 'Order Received',
    deliverydate: pick('deliveryDate', 'deliverydate', existing.deliverydate || '') || '',
    products: products,
    totalamount: Number(body.totalAmount != null ? body.totalAmount : (body.totalamount != null ? body.totalamount : existing.totalamount || 0)),
    advancepayment: Number(body.advancePayment != null ? body.advancePayment : (body.advancepayment != null ? body.advancepayment : existing.advancepayment || 0)),
    balanceamount: Number(body.balanceAmount != null ? body.balanceAmount : (body.balanceamount != null ? body.balanceamount : existing.balanceamount || 0)),
    remarks: pick('remarks', 'remarks', existing.remarks || '') || '',
    assigneddesigner: pick('assignedDesigner', 'assigneddesigner', existing.assigneddesigner || '') || '',
    tokenno: pick('tokenNo', 'tokenno', existing.tokenno || '') || '',
    doctype: pick('docType', 'doctype', existing.doctype || 'Order') || 'Order',
    trackingnumber: pick('trackingNumber', 'trackingnumber', existing.trackingnumber || '') || '',
    statushistory: body.statusHistory != null ? body.statusHistory : (body.statushistory != null ? body.statushistory : (existing.statushistory || [])),
    deliveryaddress: pick('deliveryAddress', 'deliveryaddress', existing.deliveryaddress || '') || '',
    quotationid: pick('quotationId', 'quotationid', existing.quotationid || '') || '',
    paymentmethod: pick('paymentMethod', 'paymentmethod', existing.paymentmethod || '') || '',
    paymentstatus: pick('paymentStatus', 'paymentstatus', existing.paymentstatus || '') || '',
    discount: Number(body.discount != null ? body.discount : (body.Discount != null ? body.Discount : (existing.discount || 0))),
    deliverycharges: Number(body.deliveryCharges != null ? body.deliveryCharges : (body.deliverycharges != null ? body.deliverycharges : (existing.deliverycharges || 0))),
    ordersource: pick('orderSource', 'ordersource', existing.ordersource || '') || '',
    paymenthistory: body.paymentHistory != null ? body.paymentHistory : (body.paymenthistory != null ? body.paymenthistory : (existing.paymenthistory || [])),
  };
}

function toApiOrder_(o) {
  var products = o.products;
  if (typeof products === 'string') {
    try { products = JSON.parse(products); } catch (e) { products = []; }
  }
  if (!Array.isArray(products)) products = [];
  var statusHistory = o.statushistory;
  if (typeof statusHistory === 'string') {
    try { statusHistory = JSON.parse(statusHistory); } catch (e2) { statusHistory = []; }
  }
  if (!Array.isArray(statusHistory)) statusHistory = statusHistory ? [statusHistory] : [];
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
    products: products,
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
    statusHistory: statusHistory,
    deliveryAddress: o.deliveryaddress || '',
    quotationId: o.quotationid || '',
    paymentMethod: o.paymentmethod || '',
    paymentStatus: o.paymentstatus || '',
    discount: Number(o.discount || 0),
    deliveryCharges: Number(o.deliverycharges || 0),
    orderSource: o.ordersource || '',
    paymentHistory: (function () {
      var ph = o.paymenthistory;
      if (typeof ph === 'string') {
        try { ph = JSON.parse(ph); } catch (ePh) { ph = []; }
      }
      return Array.isArray(ph) ? ph : (ph ? [ph] : []);
    })(),
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
    employeeId: u.employeeid || '',
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
        employeeid: body.employeeId || body.employeeid || '',
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
      employeeid: body.employeeId != null ? body.employeeId : (body.employeeid != null ? body.employeeid : (users[index].employeeid || '')),
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
    // POS: never create new customers — reuse single Walk-in, or an existing customerId
    var docTypeIn = String(body.docType || body.doctype || 'Order').toLowerCase();
    if (docTypeIn === 'pos') {
      var posCust = null;
      if (body.customerId) {
        var allCust = getSheetRows_(SHEET_NAMES.CUSTOMERS);
        var posIdx = findById_(allCust, body.customerId);
        if (posIdx >= 0) posCust = toApiCustomer_(allCust[posIdx]);
      }
      if (!posCust) posCust = ensureWalkInCustomer_();
      body.customerId = posCust.id;
      body.customerName = posCust.name || 'Walk-in';
      // Keep optional phone on the order/receipt only — do not create a customer from it
      if (!body.customerPhone) body.customerPhone = posCust.phone || '';
    } else if (body.customerPhone || body.customerName) {
      // Regular orders: upsert customer from order fields
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

/* ===================== PURCHASES ===================== */

function parsePurchaseItems_(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }
  return [];
}

function nextPurchaseNo_() {
  var rows = getSheetRows_(SHEET_NAMES.PURCHASES);
  var year = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Karachi', 'yyyy');
  var max = 0;
  rows.forEach(function (r) {
    var no = String(r.purchaseno || '');
    var m = no.match(/PO-?\d{4}-?(\d+)/i) || no.match(/(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]) || 0);
  });
  var next = String(max + 1);
  while (next.length < 4) next = '0' + next;
  return 'PO-' + year + '-' + next;
}

function toApiPurchase_(p) {
  var items = parsePurchaseItems_(p.items);
  var total = Number(p.total != null ? p.total : (p.totalamount || 0));
  var paid = Number(p.paid != null ? p.paid : (p.paidamount || 0));
  var po = p.purchaseno || p.ponumber || '';
  var date = p.date || p.purchasedate || '';
  return {
    id: p.id,
    poNumber: po,
    purchaseNo: po,
    purchaseDate: date,
    date: date,
    vendorId: p.vendorid || '',
    vendorName: p.vendorname || '',
    vendorInvoiceNumber: p.vendorinvoicenumber || '',
    expectedDeliveryDate: p.expecteddeliverydate || '',
    actualDeliveryDate: p.actualdeliverydate || '',
    linkedOrderId: p.linkedorderid || '',
    items: items,
    totalAmount: total,
    total: total,
    paidAmount: paid,
    paid: paid,
    status: p.status || 'Draft',
    notes: p.notes || '',
    outstanding: Math.max(0, total - paid),
  };
}

function normalizePurchase_(body, existing) {
  existing = existing || {};
  var id = body.id || existing.id || ('purchase_' + Date.now());
  var items = body.items != null ? body.items : (existing.items || []);
  if (typeof items === 'string') items = parsePurchaseItems_(items);
  if (!Array.isArray(items)) items = [];

  var total = body.totalAmount != null ? body.totalAmount
    : (body.total != null ? body.total : (existing.total != null ? existing.total : 0));
  if (!(Number(total) > 0) && items.length) {
    total = items.reduce(function (s, it) {
      return s + (Number(it.quantity || 0) * Number(it.rate || 0));
    }, 0);
  }

  var paid = body.paidAmount != null ? body.paidAmount
    : (body.paid != null ? body.paid : (existing.paid != null ? existing.paid : 0));

  var po = body.poNumber || body.purchaseNo || body.purchaseno
    || existing.purchaseno || existing.ponumber || '';
  if (!po) po = nextPurchaseNo_();

  var date = body.purchaseDate || body.date || existing.date
    || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Karachi', 'yyyy-MM-dd');

  // Always prefer incoming vendor fields on update (do not keep stale vendorName)
  var hasVendorId = body.vendorId != null && String(body.vendorId) !== '';
  var hasVendorName = body.vendorName != null && String(body.vendorName).trim() !== '';
  var vendorId = hasVendorId ? String(body.vendorId) : String(existing.vendorid || '');
  var vendorName = hasVendorName ? String(body.vendorName).trim() : String(existing.vendorname || '');

  return {
    id: id,
    purchaseno: po,
    date: date,
    vendorid: vendorId,
    vendorname: vendorName,
    items: items,
    total: Number(total || 0),
    paid: Number(paid || 0),
    status: body.status || existing.status || 'Draft',
    vendorinvoicenumber: body.vendorInvoiceNumber != null ? body.vendorInvoiceNumber : (existing.vendorinvoicenumber || ''),
    expecteddeliverydate: body.expectedDeliveryDate != null ? body.expectedDeliveryDate : (existing.expecteddeliverydate || ''),
    actualdeliverydate: body.actualDeliveryDate != null ? body.actualDeliveryDate : (existing.actualdeliverydate || ''),
    linkedorderid: body.linkedOrderId != null ? body.linkedOrderId : (existing.linkedorderid || ''),
    notes: body.notes != null ? body.notes : (existing.notes || ''),
  };
}

function handlePurchases_(path, method, body) {
  var sheet = getSheet_(SHEET_NAMES.PURCHASES);
  ensureHeaders_(sheet, SHEET_NAMES.PURCHASES);
  var rows = getSheetRows_(SHEET_NAMES.PURCHASES);

  if (path === '/purchases') {
    if (method === 'GET') return rows.map(toApiPurchase_);
    if (method === 'POST') {
      var created = normalizePurchase_(body || {});
      appendObject_(sheet, SHEET_NAMES.PURCHASES, created);
      return toApiPurchase_(created);
    }
  }

  var id = path.split('/')[2];
  var index = findById_(rows, id);
  if (index < 0) throw new Error('Purchase not found');

  if (method === 'GET') return toApiPurchase_(rows[index]);
  if (method === 'PUT') {
    var updated = normalizePurchase_(body || {}, rows[index]);
    updated.id = rows[index].id;
    if (!updated.purchaseno) updated.purchaseno = rows[index].purchaseno || nextPurchaseNo_();
    updateObjectProps_(sheet, SHEET_NAMES.PURCHASES, rows[index]._row, updated);
    return toApiPurchase_(updated);
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, rows[index]._row, SHEET_NAMES.PURCHASES);
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
  var items = inv.items;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch (eItems) { items = []; }
  }
  if (!Array.isArray(items)) items = [];
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
    items: items,
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
  if (index < 0) {
    index = rows.findIndex(function (r) {
      return String(r.invoiceno || '').toLowerCase() === String(id || '').toLowerCase()
        || String(r.sharetoken || '') === String(id || '');
    });
  }
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

/** Inclusive yyyy-MM-dd range. Empty from/to = no bound. Missing row date excluded when any bound set. */
function inDateRange_(rowDate, from, to) {
  var f = from ? String(from).slice(0, 10) : '';
  var t = to ? String(to).slice(0, 10) : '';
  if (!f && !t) return true;
  var dk = dateKey_(rowDate);
  if (!dk) return false;
  if (f && dk < f) return false;
  if (t && dk > t) return false;
  return true;
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
    customerEmail: t.customeremail || '',
    service: t.service,
    serviceNote: t.servicenote || '',
    status: t.tokenstatus || t.status || 'Waiting',
    calledAt: t.calledat || '',
    orderId: t.orderid || '',
    notes: t.notes || '',
  };
}

function notifyTokenEmail_(tokenApi, event) {
  var notif = getNotificationSettings_();
  if (!notif.emailToken) return { ok: false, reason: 'disabled' };
  var emailTo = tokenApi.customerEmail || '';
  if (!isValidEmail_(emailTo)) return { ok: false, reason: 'missing_email' };
  var company = getCompanyForNotify_();
  var tokenNo = tokenApi.tokenNo || tokenApi.tokenno || '';
  var text = event === 'token_called'
    ? ('Dear ' + (tokenApi.customerName || 'Customer') + ',\n\nYour token *' + tokenNo + '* is now being called at ' + (tokenApi.counterName || 'the counter') + '.\n\nPlease proceed to the counter.\n\n' + (company.name || NOTIFY_FROM_NAME_))
    : ('Dear ' + (tokenApi.customerName || 'Customer') + ',\n\nYour token *' + tokenNo + '* has been booked.\n\nCounter: ' + (tokenApi.counterName || '') + '\nService: ' + (tokenApi.service || '') + '\n\nPlease wait for your token to be called.\n\n' + (company.name || NOTIFY_FROM_NAME_));
  var subject = (event === 'token_called' ? 'Token Called — ' : 'Token Booked — ') + tokenNo + ' | ' + (company.name || NOTIFY_FROM_NAME_);
  var html = buildOrderEmailHtml_({
    customerName: tokenApi.customerName,
    orderId: tokenNo,
    status: tokenApi.status || (event === 'token_called' ? 'Called' : 'Waiting'),
    totalAmount: 0,
  }, company, text);
  return sendMailSafe_(emailTo, subject, html, text.replace(/\*/g, ''));
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
    var customerEmail = String(body.customerEmail || body.email || '').trim();
    if (!customerName || !customerPhone) {
      throw new Error('Customer name and phone are required');
    }

    var customer;
    try {
      customer = upsertCustomer_({
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: body.address,
      });
    } catch (custErr) {
      // Don't block token booking if Customers sheet has a temporary issue
      customer = { id: 'cust_temp_' + Date.now(), name: customerName, phone: customerPhone, email: customerEmail };
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
      customeremail: customer.email || customerEmail || '',
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
    var apiToken = toApiToken_(token);
    try {
      apiToken._notifications = { email: notifyTokenEmail_(apiToken, 'token_booked') };
    } catch (tokMailErr) {
      apiToken._notifications = { email: { ok: false, error: String(tokMailErr) } };
    }
    return apiToken;
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
    var calledApi = toApiToken_(tokenRow);
    try {
      calledApi._notifications = { email: notifyTokenEmail_(calledApi, 'token_called') };
    } catch (callMailErr) {
      calledApi._notifications = { email: { ok: false, error: String(callMailErr) } };
    }
    return calledApi;
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

function getDashboardBootstrap_(params) {
  params = params || {};
  var from = params.from ? String(params.from).slice(0, 10) : '';
  var to = params.to ? String(params.to).slice(0, 10) : '';

  // One Orders + Customers + Invoices read for the whole dashboard
  var ordersAll = getSheetRows_(SHEET_NAMES.ORDERS);
  var invoicesAll = getSheetRows_(SHEET_NAMES.INVOICES);
  var customers = getSheetRows_(SHEET_NAMES.CUSTOMERS);
  var expensesAll = [];
  try { expensesAll = getSheetRows_(SHEET_NAMES.EXPENSES); } catch (e1) { expensesAll = []; }
  var purchasesAll = [];
  try { purchasesAll = getSheetRows_(SHEET_NAMES.PURCHASES); } catch (e2) { purchasesAll = []; }

  var quotations = ordersAll.filter(function (o) {
    return String(o.doctype || '').toLowerCase() === 'quotation'
      && inDateRange_(o.date, from, to);
  });
  var orders = ordersAll.filter(function (o) {
    return String(o.doctype || 'Order').toLowerCase() !== 'quotation'
      && inDateRange_(o.date, from, to);
  });
  var invoices = invoicesAll.filter(function (inv) {
    return inDateRange_(inv.date, from, to);
  });
  var expenses = expensesAll.filter(function (ex) {
    return inDateRange_(ex.date, from, to);
  });
  var purchases = purchasesAll.filter(function (p) {
    return inDateRange_(p.date || p.purchasedate, from, to);
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
  var expenseTotal = expenses.reduce(function (s, ex) {
    return s + Number(ex.amount || 0);
  }, 0);

  // Payments cash position (Cash In / Cash Out) — drives Net cash on dashboard
  var paymentsAll = [];
  try { paymentsAll = getSheetRows_(SHEET_NAMES.PAYMENTS); } catch (ePay) { paymentsAll = []; }
  var paymentsInRange = paymentsAll.filter(function (p) {
    return inDateRange_(p.date, from, to);
  });
  var cashIn = paymentsInRange.reduce(function (s, p) {
    var t = String(p.type || 'inflow').toLowerCase();
    if (t === 'outflow' || t === 'out') return s;
    return s + Number(p.amount || 0);
  }, 0);
  var cashOut = paymentsInRange.reduce(function (s, p) {
    var t = String(p.type || '').toLowerCase();
    if (t === 'outflow' || t === 'out') return s + Number(p.amount || 0);
    return s;
  }, 0);
  // Net cash = Payments Cash In − Cash Out only (never substitute Expenses sheet)
  var cashNet = cashIn - cashOut;
  // Collected = order advances + cash-in payments (cash position visibility)
  collected = collected + cashIn;

  // Vendor payables from Purchases (Total − PaidAmount) in range
  var payables = purchases.reduce(function (s, p) {
    var status = String(p.status || '').toLowerCase();
    if (status.indexOf('cancel') !== -1) return s;
    var total = Number(p.total || 0);
    var paid = Number(p.paidamount || p.paid || 0);
    if (status.indexOf('fully paid') !== -1 || status === 'paid') return s;
    return s + Math.max(0, total - paid);
  }, 0);

  // Chart months: last 6 months, or months covering the selected range
  var monthMap = {};
  var tz = Session.getScriptTimeZone() || 'Asia/Karachi';
  var now = new Date();
  var startM;
  var endM;
  if (from || to) {
    var fDate = from ? new Date(from + 'T12:00:00') : now;
    var tDate = to ? new Date(to + 'T12:00:00') : now;
    startM = new Date(fDate.getFullYear(), fDate.getMonth(), 1);
    endM = new Date(tDate.getFullYear(), tDate.getMonth(), 1);
  } else {
    startM = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    endM = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  var cursor = new Date(startM.getFullYear(), startM.getMonth(), 1);
  var guard = 0;
  while (cursor.getTime() <= endM.getTime() && guard < 36) {
    var key = Utilities.formatDate(cursor, tz, 'yyyy-MM');
    var label = Utilities.formatDate(cursor, tz, 'MMM');
    monthMap[key] = { month: label, sales: 0, orders: 0, key: key };
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    guard++;
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

  // Needs attention: Ready + high balance (within filtered orders)
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
      expenses: expenseTotal,
      receivables: receivables,
      collected: collected,
      cashIn: cashIn,
      cashOut: cashOut,
      cashNet: cashNet,
      payables: payables,
      vendorPayables: payables,
      activeCustomers: customers.length,
      fulfillmentRate: orders.length ? Math.round((completed / orders.length) * 100) : 0,
      collectionRate: revenue > 0 ? Math.round((collected / revenue) * 100) : 0,
      from: from || '',
      to: to || '',
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

function getDashboardStats_(params) {
  var boot = getDashboardBootstrap_(params);
  return boot.stats;
}

function getDashboardCharts_(params) {
  var boot = getDashboardBootstrap_(params);
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

function hashPortalPassword_(password, salt) {
  var raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(salt || '') + '|' + String(password || ''),
    Utilities.Charset.UTF_8
  );
  return raw.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function issueCustomerPortalToken_(customer) {
  var token = Utilities.base64EncodeWebSafe(JSON.stringify({
    typ: 'customer',
    id: String(customer.id || ''),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }));
  return token;
}

function validateCustomerPortalToken_(token) {
  if (!token) return null;
  try {
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(token)).getDataAsString());
    if (payload.typ !== 'customer') return null;
    if (payload.exp && Date.now() > payload.exp) return null;
    var customers = getSheetRows_(SHEET_NAMES.CUSTOMERS);
    var match = customers.find(function (c) { return String(c.id) === String(payload.id); });
    return match || null;
  } catch (err) {
    return null;
  }
}

function sanitizePortalCustomer_(c) {
  return {
    id: c.id,
    name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    city: c.city || '',
  };
}

function parseProductVariations_(raw) {
  var list = raw;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch (eVar) { list = []; }
  }
  if (!Array.isArray(list)) return [];
  return list.map(function (v, idx) {
    v = v || {};
    return {
      id: String(v.id || ('var_' + (idx + 1))),
      name: String(v.name || v.label || '').trim(),
      price: v.price != null && v.price !== '' ? Number(v.price) : null,
      sku: String(v.sku || '').trim(),
    };
  }).filter(function (v) { return !!v.name; });
}

function isShowOnWebsite_(p) {
  if (!p) return false;
  if (p.showonwebsite === undefined || p.showonwebsite === null || p.showonwebsite === '') {
    // Legacy rows without the column: keep visible if Active
    return String(p.status || 'Active').toLowerCase() !== 'inactive';
  }
  return isNotifyOn_(p.showonwebsite);
}

function isShowOnTop_(p) {
  if (!p) return false;
  if (p.showontop === undefined || p.showontop === null || p.showontop === '') return false;
  return isNotifyOn_(p.showontop);
}

function productSalePrice_(p) {
  var sale = Number(p.saleprice != null ? p.saleprice : (p.salePrice != null ? p.salePrice : 0));
  return sale > 0 ? sale : 0;
}

function productEffectivePrice_(p) {
  var regular = Number(p.rate || p.baseprice || 0);
  var sale = productSalePrice_(p);
  return sale > 0 ? sale : regular;
}

function toPublicProduct_(p) {
  var api = toApiProduct_(p);
  if (!api.active) return null;
  if (!api.showOnWebsite) return null;
  var images = [];
  if (api.image) images.push(api.image);
  var extra = p.images || p.gallery;
  if (typeof extra === 'string') {
    try { extra = JSON.parse(extra); } catch (eImg) { extra = []; }
  }
  if (Array.isArray(extra)) {
    extra.forEach(function (img) {
      var s = sanitizeCatalogImage_(img);
      if (s && images.indexOf(s) === -1) images.push(s);
    });
  }
  api.images = images;
  return api;
}

function handlePublicWebsiteOrder_(body, customer) {
  body = body || {};
  if (!customer) throw new Error('Login required to place an order');
  if (!body.acceptPolicy && body.policyAccepted !== true) {
    throw new Error('Please accept the Order Processing Policy before placing the order');
  }

  var paymentMethodRaw = String(body.paymentMethod || body.payment_method || 'Cash on Delivery').trim();
  var isCod = /cod|cash\s*on\s*delivery/i.test(paymentMethodRaw);
  var paymentMethod = isCod ? 'Cash on Delivery' : 'Online Payment';
  var paymentStatus = isCod ? 'Unpaid' : 'Payment Pending';

  var catalog = getSheetRows_(SHEET_NAMES.PRODUCTS);
  var linesIn = Array.isArray(body.products) ? body.products : (Array.isArray(body.items) ? body.items : []);
  if (!linesIn.length) throw new Error('Cart is empty');

  var products = [];
  var subtotal = 0;
  linesIn.forEach(function (line) {
    line = line || {};
    var pid = String(line.productId || line.id || '').trim();
    var qty = Math.max(1, Number(line.quantity) || 1);
    var match = pid ? catalog.find(function (p) { return String(p.id) === pid; }) : null;
    if (!match && line.name) {
      match = catalog.find(function (p) {
        return String(p.name || '').trim().toLowerCase() === String(line.name).trim().toLowerCase();
      });
    }
    if (!match) throw new Error('Product not found: ' + (line.name || pid || 'unknown'));
    if (String(match.status || 'Active').toLowerCase() === 'inactive') {
      throw new Error('Product unavailable: ' + (match.name || pid));
    }
    if (!isShowOnWebsite_(match)) {
      throw new Error('Product not available on website: ' + (match.name || pid));
    }
    var rate = productEffectivePrice_(match);
    var lineName = match.name;
    var variations = parseProductVariations_(match.variations);
    var variationId = String(line.variationId || line.variation_id || '').trim();
    var variationName = String(line.variationName || line.variation || '').trim();
    if (variationId || variationName) {
      var picked = variations.find(function (v) {
        return (variationId && String(v.id) === variationId)
          || (variationName && String(v.name).toLowerCase() === variationName.toLowerCase());
      });
      if (picked) {
        if (picked.price != null && !isNaN(picked.price)) rate = Number(picked.price);
        lineName = match.name + ' — ' + picked.name;
      }
    }
    var minQ = Number(match.minquantity || 1) || 1;
    if (qty < minQ) qty = minQ;
    products.push({
      productId: match.id,
      name: lineName,
      quantity: qty,
      rate: rate,
      size: match.size || '',
      material: match.material || '',
      notes: line.notes || '',
      variationId: variationId || '',
      variationName: variationName || '',
    });
    subtotal += qty * rate;
  });

  var discount = Math.max(0, Number(body.discount) || 0);
  var deliveryCharges = Math.max(0, Number(body.deliveryCharges != null ? body.deliveryCharges : body.delivery_charges) || 0);
  if (discount > subtotal) discount = subtotal;
  var totalAmount = Math.max(0, subtotal - discount + deliveryCharges);

  var paymentHistory = [{
    at: new Date().toISOString(),
    status: paymentStatus,
    method: paymentMethod,
    amount: 0,
    note: isCod
      ? 'Order placed under Cash on Delivery terms'
      : 'Online payment selected — order created; processing starts after payment confirmation',
  }];

  var orderBody = {
    customerId: customer.id,
    customerName: customer.name || body.customerName || '',
    customerPhone: customer.phone || body.customerPhone || '',
    customerEmail: customer.email || body.customerEmail || '',
    customerAddress: body.customerAddress || customer.address || '',
    deliveryAddress: body.deliveryAddress || body.customerAddress || customer.address || '',
    products: products,
    totalAmount: totalAmount,
    advancePayment: 0,
    balanceAmount: totalAmount,
    discount: discount,
    deliveryCharges: deliveryCharges,
    paymentMethod: paymentMethod,
    paymentStatus: paymentStatus,
    orderSource: 'website',
    paymentHistory: paymentHistory,
    status: 'Order Received',
    docType: 'Order',
    remarks: [
      'Website order',
      paymentMethod,
      'Payment: ' + paymentStatus,
      body.notes ? String(body.notes) : '',
    ].filter(Boolean).join(' · '),
    trackingNumber: 'TRK-' + String(Math.floor(1000 + Math.random() * 9000)),
    statusHistory: [{ status: 'Order Received', at: new Date().toISOString(), by: 'website' }],
  };

  var sheet = getSheet_(SHEET_NAMES.ORDERS);
  ensureHeaders_(sheet, SHEET_NAMES.ORDERS);
  var record = normalizeOrder_(orderBody);
  appendObject_(sheet, SHEET_NAMES.ORDERS, record);
  invalidateSheetCache_(SHEET_NAMES.ORDERS);

  // Payment history stub in Payments sheet (amount 0 until confirmed)
  try {
    var paySheet = getSheet_(SHEET_NAMES.PAYMENTS);
    ensureHeaders_(paySheet, SHEET_NAMES.PAYMENTS);
    appendObject_(paySheet, SHEET_NAMES.PAYMENTS, {
      id: 'pay_web_' + Date.now(),
      date: nowDate_(),
      type: 'inflow',
      category: isCod ? 'COD Order' : 'Online Order',
      refid: record.orderid,
      customername: record.customername,
      customerid: record.customerid,
      partyphone: record.customerphone,
      partyemail: record.customeremail,
      amount: 0,
      method: paymentMethod,
      notes: 'Website order ' + record.orderid + ' · status ' + paymentStatus,
      balancedue: totalAmount,
      totalamount: totalAmount,
    });
    invalidateSheetCache_(SHEET_NAMES.PAYMENTS);
  } catch (payErr) { /* non-blocking */ }

  var api = toApiOrder_(record);
  api.subtotal = subtotal;
  return api;
}

function handlePublic_(path, method, body) {
  body = body || {};
  var authHeader = '';
  try {
    // token may arrive as body.token for public customer calls
    authHeader = String(body.token || body.customerToken || '').trim();
  } catch (eTok) { authHeader = ''; }

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

  if (method === 'GET' && path === '/public/products') {
    ensureHeaders_(getSheet_(SHEET_NAMES.PRODUCTS), SHEET_NAMES.PRODUCTS);
    var products = getSheetRows_(SHEET_NAMES.PRODUCTS)
      .map(toPublicProduct_)
      .filter(function (p) { return !!p; });
    products.sort(function (a, b) {
      var at = a.showOnTop ? 1 : 0;
      var bt = b.showOnTop ? 1 : 0;
      if (bt !== at) return bt - at;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    return { products: products };
  }

  if (method === 'GET' && path.indexOf('/public/products/') === 0) {
    var productId = decodeURIComponent(path.replace('/public/products/', '')).trim();
    var productRows = getSheetRows_(SHEET_NAMES.PRODUCTS);
    var productRow = productRows.find(function (p) { return String(p.id) === productId; });
    if (!productRow) throw new Error('Product not found');
    var pub = toPublicProduct_(productRow);
    if (!pub) throw new Error('Product not available');
    return pub;
  }

  if (method === 'POST' && path === '/public/lead') {
    var lead = upsertCustomer_({
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address || '',
      notes: [body.product || body.service || '', body.quantity || '', body.details || body.message || '']
        .filter(Boolean).join(' | '),
      inCrm: true,
      stage: 'lead',
      source: body.source || 'website',
    });
    try {
      addCrmNote_(lead.id, {
        note: 'Website lead: ' + (body.details || body.message || body.product || 'Inquiry'),
        createdBy: 'website',
      });
    } catch (noteErr) { /* ignore */ }
    return { ok: true, customerId: lead.id, stage: lead.stage || 'lead' };
  }

  if (method === 'POST' && path === '/public/customer/register') {
    var regName = String(body.name || '').trim();
    var regPhone = String(body.phone || '').trim();
    var regEmail = String(body.email || '').trim().toLowerCase();
    var regPass = String(body.password || '');
    if (!regName || !regPhone) throw new Error('Name and phone are required');
    if (!isValidEmail_(regEmail)) throw new Error('Valid email is required');
    if (regPass.length < 6) throw new Error('Password must be at least 6 characters');

    var sheetC = getSheet_(SHEET_NAMES.CUSTOMERS);
    ensureHeaders_(sheetC, SHEET_NAMES.CUSTOMERS);
    var existingPhone = findCustomerByPhone_(regPhone);
    var existingEmail = getSheetRows_(SHEET_NAMES.CUSTOMERS).find(function (c) {
      return String(c.email || '').trim().toLowerCase() === regEmail;
    });
    if (existingEmail && existingEmail.portalpassword) {
      throw new Error('An account with this email already exists — please login');
    }
    var salt = Utilities.getUuid();
    var hash = hashPortalPassword_(regPass, salt);
    var portalPass = salt + ':' + hash;
    var customer;
    if (existingPhone) {
      updateObjectProps_(sheetC, SHEET_NAMES.CUSTOMERS, existingPhone._row, {
        name: regName || existingPhone.name,
        email: regEmail || existingPhone.email,
        address: body.address || existingPhone.address || '',
        portalpassword: portalPass,
        notifyemail: true,
        notifywhatsapp: true,
      });
      invalidateSheetCache_(SHEET_NAMES.CUSTOMERS);
      customer = Object.assign({}, existingPhone, {
        name: regName || existingPhone.name,
        email: regEmail || existingPhone.email,
        address: body.address || existingPhone.address || '',
        portalpassword: portalPass,
      });
    } else {
      customer = {
        id: 'cust_' + Date.now(),
        name: regName,
        phone: regPhone,
        email: regEmail,
        address: body.address || '',
        city: body.city || '',
        notes: 'Website portal account',
        incrm: false,
        stage: '',
        notifywhatsapp: true,
        notifyemail: true,
        portalpassword: portalPass,
      };
      appendObject_(sheetC, SHEET_NAMES.CUSTOMERS, customer);
      invalidateSheetCache_(SHEET_NAMES.CUSTOMERS);
    }
    var tokenReg = issueCustomerPortalToken_(customer);
    return { ok: true, token: tokenReg, customer: sanitizePortalCustomer_(customer) };
  }

  if (method === 'POST' && path === '/public/customer/login') {
    var loginId = String(body.email || body.phone || body.username || '').trim().toLowerCase();
    var loginPass = String(body.password || '');
    if (!loginId || !loginPass) throw new Error('Email/phone and password are required');
    var custRows = getSheetRows_(SHEET_NAMES.CUSTOMERS);
    var loginCust = custRows.find(function (c) {
      var email = String(c.email || '').trim().toLowerCase();
      var phone = String(c.phone || '').replace(/\D/g, '');
      var needlePhone = loginId.replace(/\D/g, '');
      return (email && email === loginId)
        || (phone && needlePhone && (phone === needlePhone || phone.slice(-10) === needlePhone.slice(-10)));
    });
    if (!loginCust || !loginCust.portalpassword) throw new Error('Invalid login or account not registered online');
    var parts = String(loginCust.portalpassword).split(':');
    if (parts.length !== 2) throw new Error('Invalid login — reset password via shop staff');
    if (hashPortalPassword_(loginPass, parts[0]) !== parts[1]) throw new Error('Invalid email/phone or password');
    return {
      ok: true,
      token: issueCustomerPortalToken_(loginCust),
      customer: sanitizePortalCustomer_(loginCust),
    };
  }

  if ((method === 'GET' || method === 'POST') && path === '/public/customer/me') {
    var meTok = authHeader || String(body.token || '').trim();
    var me = validateCustomerPortalToken_(meTok);
    if (!me) throw new Error('Unauthorized');
    return { ok: true, customer: sanitizePortalCustomer_(me) };
  }

  if (method === 'POST' && (path === '/public/orders' || path === '/public/checkout')) {
    var orderTok = authHeader || String(body.token || body.customerToken || '').trim();
    var orderCust = validateCustomerPortalToken_(orderTok);
    if (!orderCust) throw new Error('Login required to place an order');
    var createdOrder = handlePublicWebsiteOrder_(body, orderCust);
    return { ok: true, order: createdOrder };
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
  if (method === 'GET' && path.indexOf('/public/employee/') === 0) {
    var empCode = decodeURIComponent(path.replace('/public/employee/', '')).trim();
    return toPublicEmployeeVerify_(empCode);
  }
  throw new Error('Not found');
}

/** Public employee / experience-letter verification (no sensitive fields). */
function toPublicEmployeeVerify_(code) {
  var needle = String(code || '').trim().toLowerCase();
  if (!needle) throw new Error('Employee code required');
  getOrCreateSheet_(SHEET_NAMES.EMPLOYEES);
  var rows = getSheetRows_(SHEET_NAMES.EMPLOYEES);
  var row = rows.find(function (e) {
    var keys = [e.id, e.employeecode]
      .map(function (v) { return String(v || '').trim().toLowerCase(); })
      .filter(Boolean);
    return keys.indexOf(needle) !== -1;
  });
  if (!row) throw new Error('Employee not found');
  var api = toApiEmployee_(row);
  var status = String(api.status || 'Active');
  var active = status.toLowerCase() === 'active';
  var validUntil = api.validUntil || '';
  var expired = false;
  if (validUntil) {
    try {
      expired = new Date(validUntil).getTime() < Date.now();
    } catch (e) { /* ignore */ }
  }
  return {
    verified: true,
    employeeCode: api.employeeCode || api.id || '',
    name: api.name || '',
    designation: api.designation || api.role || '',
    department: api.department || '',
    joinDate: api.joinDate || '',
    endDate: api.endDate || '',
    validFrom: api.validFrom || '',
    validUntil: validUntil,
    status: status,
    active: active && !expired,
    expired: expired,
    companyNote: 'Verified employment record — Amazon Printing / AMZ Prints.',
  };
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
  // Public view: customer name + status + item names only (no prices / balance / specs)
  var products = (api.products || []).map(function (p) {
    return { name: p.name || '' };
  }).filter(function (p) { return p.name; });
  return {
    orderId: api.orderId || '',
    trackingNumber: api.trackingNumber || api.orderId || '',
    status: api.status || '',
    cancelled: cancelled,
    customerName: api.customerName || '',
    products: products,
    timeline: timeline,
    trackCode: api.trackingNumber || api.orderId || api.id || '',
    companyNote: 'For questions, contact Amazon Printing Services with your Order ID.',
  };
}

/**
 * Photos are stored IN Google Sheets (compressed data-URL).
 * No Google Drive / DriveApp — works when Workspace blocks Drive OAuth.
 * Sheets cell limit ~50k chars; frontend compresses before upload.
 */
var MAX_SHEET_IMAGE_CHARS_ = 45000;

/** Optional helper — Drive is NOT required. Safe to ignore. */
function authorizeDriveAccess() {
  Logger.log('Drive is optional. Employee/product photos save directly into Sheets.');
  return {
    ok: true,
    message: 'No Drive permission needed. Deploy a New version of the web app, then save photos from ERP.',
    driveRequired: false,
  };
}

/** Normalize image for Sheets cell — never calls DriveApp. */
function saveImageToSheetCell_(dataUrl, fileId) {
  var raw = String(dataUrl || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.indexOf('data:image') === 0) {
    if (raw.length > MAX_SHEET_IMAGE_CHARS_) {
      throw new Error(
        'Photo too large for Sheets (' + raw.length + ' chars). Pick a smaller / clearer photo — max ~' + MAX_SHEET_IMAGE_CHARS_ + ' after compress.'
      );
    }
    return raw;
  }
  if (raw.length > 2000) {
    throw new Error('Invalid image data. Choose a photo again.');
  }
  return raw;
}

/** @deprecated name kept for callers — does not use Drive */
function saveDataUrlImageToDrive_(dataUrl, fileId, folderName) {
  return saveImageToSheetCell_(dataUrl, fileId);
}

function saveProductImageToDrive_(dataUrl, productId) {
  return saveImageToSheetCell_(dataUrl, productId);
}

function saveEmployeePhotoToDrive_(dataUrl, employeeId) {
  return saveImageToSheetCell_(dataUrl, employeeId);
}

function toApiEmployee_(e) {
  var photo = e.photo || e.image || '';
  return {
    id: e.id,
    employeeCode: e.employeecode || '',
    name: e.name || '',
    phone: e.phone || '',
    email: e.email || '',
    cnic: e.cnic || '',
    role: e.role || 'Staff',
    designation: e.designation || '',
    department: e.department || 'General',
    joinDate: e.joindate || '',
    endDate: e.enddate || '',
    validFrom: e.validfrom || '',
    validUntil: e.validuntil || '',
    salary: Number(e.salary || 0),
    status: e.status || 'Active',
    address: e.address || '',
    city: e.city || '',
    emergencyContact: e.emergencycontact || '',
    emergencyPhone: e.emergencyphone || '',
    notes: e.notes || '',
    photo: photo,
    image: photo,
  };
}

function normalizeEmployee_(body, existing) {
  existing = existing || {};
  var id = body.id || existing.id || ('emp_' + Date.now());
  var incomingPhoto = body.photo != null ? body.photo : (body.image != null ? body.image : null);
  var photoVal = incomingPhoto != null
    ? saveEmployeePhotoToDrive_(incomingPhoto, id)
    : (existing.photo || existing.image || '');
  return {
    id: id,
    employeecode: body.employeeCode != null ? body.employeeCode : (body.employeecode != null ? body.employeecode : (existing.employeecode || '')),
    name: body.name || existing.name || '',
    phone: body.phone != null ? body.phone : (existing.phone || ''),
    email: body.email != null ? body.email : (existing.email || ''),
    cnic: body.cnic != null ? body.cnic : (existing.cnic || ''),
    role: body.role || existing.role || 'Staff',
    designation: body.designation != null ? body.designation : (existing.designation || ''),
    department: body.department || existing.department || 'General',
    joindate: body.joinDate != null ? body.joinDate : (body.joindate != null ? body.joindate : (existing.joindate || '')),
    enddate: body.endDate != null ? body.endDate : (body.enddate != null ? body.enddate : (existing.enddate || '')),
    validfrom: body.validFrom != null ? body.validFrom : (body.validfrom != null ? body.validfrom : (existing.validfrom || '')),
    validuntil: body.validUntil != null ? body.validUntil : (body.validuntil != null ? body.validuntil : (existing.validuntil || '')),
    salary: Number(body.salary != null ? body.salary : (existing.salary || 0)),
    status: body.status || existing.status || 'Active',
    address: body.address != null ? body.address : (existing.address || ''),
    city: body.city != null ? body.city : (existing.city || ''),
    emergencycontact: body.emergencyContact != null ? body.emergencyContact : (existing.emergencycontact || ''),
    emergencyphone: body.emergencyPhone != null ? body.emergencyPhone : (existing.emergencyphone || ''),
    notes: body.notes != null ? body.notes : (existing.notes || ''),
    photo: photoVal,
  };
}

function handleEmployees_(path, method, body) {
  var sheet = getOrCreateSheet_(SHEET_NAMES.EMPLOYEES);
  ensureHeaders_(sheet, SHEET_NAMES.EMPLOYEES);
  var rows = getSheetRows_(SHEET_NAMES.EMPLOYEES);

  if (path === '/employees') {
    if (method === 'GET') return rows.map(toApiEmployee_);
    if (method === 'POST') {
      var created = normalizeEmployee_(body);
      appendObject_(sheet, SHEET_NAMES.EMPLOYEES, created);
      return toApiEmployee_(created);
    }
  }

  var id = path.split('/')[2];
  var index = findById_(rows, id);
  if (index < 0) throw new Error('Employee not found');

  if (method === 'GET') return toApiEmployee_(rows[index]);
  if (method === 'PUT') {
    var updated = normalizeEmployee_(body, rows[index]);
    updated.id = rows[index].id;
    updateObjectProps_(sheet, SHEET_NAMES.EMPLOYEES, rows[index]._row, updated);
    return toApiEmployee_(updated);
  }
  if (method === 'DELETE') {
    deleteRow_(sheet, rows[index]._row, SHEET_NAMES.EMPLOYEES);
    return { success: true };
  }
  throw new Error('Method not allowed');
}

function sanitizeCatalogImage_(img) {
  var s = String(img || '').trim();
  if (!s) return '';
  // Sheets cell ~50k; photos stored as compressed data-URLs (no Drive)
  if (/^https?:\/\//i.test(s)) return s;
  if (s.indexOf('data:image') === 0) {
    return s.length <= MAX_SHEET_IMAGE_CHARS_ ? s : '';
  }
  return s.length <= 2000 ? s : '';
}

function toApiProduct_(p) {
  var rate = Number(p.rate || p.baseprice || 0);
  var salePrice = productSalePrice_(p);
  var img = sanitizeCatalogImage_(p.image || p.photo || '');
  var variations = parseProductVariations_(p.variations);
  return {
    id: p.id,
    name: p.name,
    category: p.category || '',
    productType: p.producttype || (String(p.category || '').toLowerCase().indexOf('service') >= 0 ? 'Service' : 'Product'),
    basePrice: rate,
    rate: rate,
    salePrice: salePrice,
    effectivePrice: salePrice > 0 ? salePrice : rate,
    unit: p.unit || 'per piece',
    description: p.description || '',
    fullDescription: p.fulldescription || p.fullDescription || '',
    material: p.material || '',
    size: p.size || '',
    minQuantity: Number(p.minquantity || 1),
    stock: Number(p.stock || 0),
    designer: p.designer || '',
    image: img,
    photo: img,
    active: String(p.status || 'Active').toLowerCase() !== 'inactive',
    status: p.status || 'Active',
    showOnWebsite: isShowOnWebsite_(p),
    showOnTop: isShowOnTop_(p),
    variations: variations,
  };
}

function normalizeProduct_(body, existing) {
  existing = existing || {};
  var rate = body.basePrice != null ? body.basePrice : (body.rate != null ? body.rate : (existing.rate || 0));
  var saleRaw = body.salePrice != null ? body.salePrice
    : (body.saleprice != null ? body.saleprice : (existing.saleprice != null ? existing.saleprice : 0));
  var salePrice = Number(saleRaw) > 0 ? Number(saleRaw) : 0;
  var ptype = body.productType || body.producttype || existing.producttype || 'Product';
  var isService = String(ptype).toLowerCase() === 'service';
  var id = body.id || existing.id || ('product_' + Date.now());
  var incomingImage = body.image != null ? body.image : (body.photo != null ? body.photo : null);
  var imageVal = incomingImage != null
    ? saveProductImageToDrive_(incomingImage, id)
    : (existing.image || existing.photo || '');
  var variationsRaw = body.variations != null ? body.variations : existing.variations;
  var variations = parseProductVariations_(variationsRaw);
  var showWeb = true;
  if (body.showOnWebsite != null) showWeb = isNotifyOn_(body.showOnWebsite);
  else if (body.showonwebsite != null) showWeb = isNotifyOn_(body.showonwebsite);
  else if (existing.showonwebsite != null && existing.showonwebsite !== '') showWeb = isNotifyOn_(existing.showonwebsite);
  var showTop = false;
  if (body.showOnTop != null) showTop = isNotifyOn_(body.showOnTop);
  else if (body.showontop != null) showTop = isNotifyOn_(body.showontop);
  else if (existing.showontop != null && existing.showontop !== '') showTop = isNotifyOn_(existing.showontop);
  return {
    id: id,
    name: body.name || existing.name || '',
    category: isService ? (body.category || existing.category || 'Services') : (body.category || existing.category || ''),
    producttype: ptype,
    rate: Number(rate || 0),
    saleprice: salePrice,
    unit: isService ? 'service' : (body.unit || existing.unit || 'per piece'),
    description: body.description != null ? body.description : (existing.description || ''),
    fulldescription: body.fullDescription != null ? body.fullDescription
      : (body.fulldescription != null ? body.fulldescription : (existing.fulldescription || '')),
    material: isService ? '' : (body.material || existing.material || ''),
    size: isService ? '' : (body.size || existing.size || ''),
    minquantity: isService ? 1 : Number(body.minQuantity != null ? body.minQuantity : (existing.minquantity || 1)),
    stock: Number(body.stock != null ? body.stock : (existing.stock || 0)),
    designer: isService ? '' : (body.designer || existing.designer || ''),
    image: imageVal,
    status: body.active === false ? 'Inactive' : (body.status || existing.status || 'Active'),
    showonwebsite: showWeb,
    showontop: showTop,
    variations: variations,
  };
}

function handleProducts_(path, method, body) {
  var sheet = getSheet_(SHEET_NAMES.PRODUCTS);
  ensureHeaders_(sheet, SHEET_NAMES.PRODUCTS);
  var rows = getSheetRows_(SHEET_NAMES.PRODUCTS);

  if (path === '/products') {
    if (method === 'GET') return rows.map(toApiProduct_);
    if (method === 'POST') {
      var created = normalizeProduct_(body || {});
      appendObject_(sheet, SHEET_NAMES.PRODUCTS, created);
      var apiCreated = toApiProduct_(created);
      if ((body && (body.image || body.photo)) && !apiCreated.image) {
        throw new Error('Photo was not stored. Use a smaller image (compressed under ~45KB).');
      }
      return apiCreated;
    }
  }

  var id = path.split('/')[2];
  var index = findById_(rows, id);
  if (index < 0) throw new Error('Product not found');

  if (method === 'GET') return toApiProduct_(rows[index]);
  if (method === 'PUT') {
    var updated = normalizeProduct_(body || {}, rows[index]);
    updated.id = rows[index].id;
    updateObjectProps_(sheet, SHEET_NAMES.PRODUCTS, rows[index]._row, updated);
    var apiUpdated = toApiProduct_(updated);
    if ((body && (body.image || body.photo)) && !apiUpdated.image) {
      throw new Error('Photo was not stored. Use a smaller image (compressed under ~45KB).');
    }
    return apiUpdated;
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

    if (method === 'GET' && path === '/dashboard/bootstrap') {
      return jsonResponse_(getDashboardBootstrap_(e.parameter || {}));
    }
    if (method === 'GET' && path === '/dashboard/stats') {
      return jsonResponse_(getDashboardStats_(e.parameter || {}));
    }
    if (method === 'GET' && path === '/dashboard/charts') {
      return jsonResponse_(getDashboardCharts_(e.parameter || {}));
    }
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
      return jsonResponse_(handleEmployees_(path, method, body));
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
      return jsonResponse_(handlePurchases_(path, method, body));
    }
    if (path === '/expenses' || path.indexOf('/expenses/') === 0) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.EXPENSES, path, method, body, '/expenses'));
    }
    if (path === '/payments' || path.indexOf('/payments/') === 0) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.PAYMENTS, path, method, body, '/payments'));
    }

    if (path === '/designers' && method === 'GET') {
      // Designer selection comes from HR Employees (role Designer), not a separate module
      getOrCreateSheet_(SHEET_NAMES.EMPLOYEES);
      var empRows = getSheetRows_(SHEET_NAMES.EMPLOYEES);
      var designers = empRows.filter(function (e) {
        var role = String(e.role || '').toLowerCase();
        var status = String(e.status || 'Active').toLowerCase();
        if (status === 'inactive') return false;
        return role.indexOf('designer') !== -1;
      });
      return jsonResponse_(designers.map(function (e) {
        var api = toApiEmployee_(e);
        return {
          id: api.id || '',
          name: api.name || '',
          email: api.email || '',
          phone: api.phone || '',
          role: api.role || 'Designer',
          photo: api.photo || '',
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
