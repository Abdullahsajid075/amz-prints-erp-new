/**
 * AMZ Prints ERP — Google Apps Script API
 *
 * Setup:
 * 1. Create a Google Sheet with tabs: Users, Orders, Customers, Products, Invoices,
 *    Vendors, Purchases, Expenses, Payments, Settings
 * 2. File → Project properties → Script properties:
 *    SPREADSHEET_ID = your sheet ID
 * 3. Paste this file into Apps Script editor
 * 4. Deploy → New deployment → Web app
 *    Execute as: Me | Who has access: Anyone
 * 5. Set REACT_APP_GAS_API_URL in Vercel to the /exec URL
 */

const SHEET_NAMES = {
  USERS: 'Users',
  ORDERS: 'Orders',
  CUSTOMERS: 'Customers',
  PRODUCTS: 'Products',
  INVOICES: 'Invoices',
  VENDORS: 'Vendors',
  PURCHASES: 'Purchases',
  EXPENSES: 'Expenses',
  PAYMENTS: 'Payments',
  SETTINGS: 'Settings',
};

function getSpreadsheetId_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error('Set SPREADSHEET_ID in Script properties');
  }
  return id;
}

function getSheet_(name) {
  return SpreadsheetApp.openById(getSpreadsheetId_()).getSheetByName(name);
}

function jsonResponse_(payload, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  if (statusCode) {
    // GAS web apps don't support custom HTTP status codes; include in body when needed
    output.setContent(JSON.stringify({ ...payload, _status: statusCode }));
  }
  return output;
}

function parseAuthToken_(e) {
  if (e.parameter && e.parameter.token) {
    return String(e.parameter.token);
  }
  const headers = e.headers || {};
  const auth = headers.Authorization || headers.authorization || '';
  const match = String(auth).match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : '';
}

function getPath_(e) {
  return (e.parameter && e.parameter.path) ? String(e.parameter.path) : '/';
}

function getMethod_(e) {
  if (e.parameter && e.parameter._method) {
    return String(e.parameter._method).toUpperCase();
  }
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

function sheetToObjects_(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map((header) => String(header).trim().toLowerCase());
  return values.slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });
}

function handleRequest_(e) {
  const path = getPath_(e);
  const method = getMethod_(e);
  const body = parseBody_(e);
  const token = parseAuthToken_(e);

  try {
    if (method === 'POST' && path === '/auth/login') {
      const result = handleLogin_(body);
      if (result.error) {
        return jsonResponse_({ message: result.error }, 401);
      }
      return jsonResponse_(result);
    }

    if (path.startsWith('/public/')) {
      return jsonResponse_(handlePublic_(path, method, body));
    }

    const user = validateToken_(token);
    if (!user && path !== '/auth/login') {
      return jsonResponse_({ message: 'Unauthorized' }, 401);
    }

    if (method === 'GET' && path === '/auth/me') {
      return jsonResponse_(sanitizeUser_(user));
    }
    if (method === 'POST' && path === '/auth/logout') {
      return jsonResponse_({ success: true });
    }
    if (method === 'GET' && path === '/dashboard/stats') {
      return jsonResponse_(getDashboardStats_());
    }
    if (method === 'GET' && path === '/dashboard/charts') {
      return jsonResponse_(getDashboardCharts_());
    }
    if (method === 'GET' && path === '/dashboard/recent-orders') {
      return jsonResponse_(getRecentOrders_());
    }
    if (path === '/orders') {
      return jsonResponse_(handleOrders_(method, body, e.parameter));
    }
    if (path.startsWith('/orders/')) {
      return jsonResponse_(handleOrderById_(path, method, body));
    }
    if (path === '/customers' || path.startsWith('/customers/')) {
      return jsonResponse_(handleCustomers_(path, method, body));
    }
    if (path === '/products' || path.startsWith('/products/')) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.PRODUCTS, path, method, body, '/products'));
    }
    if (path === '/invoices' || path.startsWith('/invoices/')) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.INVOICES, path, method, body, '/invoices'));
    }
    if (path === '/vendors' || path.startsWith('/vendors/')) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.VENDORS, path, method, body, '/vendors'));
    }
    if (path === '/purchases' || path.startsWith('/purchases/')) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.PURCHASES, path, method, body, '/purchases'));
    }
    if (path === '/expenses' || path.startsWith('/expenses/')) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.EXPENSES, path, method, body, '/expenses'));
    }
    if (path === '/payments' || path.startsWith('/payments/')) {
      return jsonResponse_(handleCollection_(SHEET_NAMES.PAYMENTS, path, method, body, '/payments'));
    }
    if (path === '/settings') {
      if (method === 'GET') return jsonResponse_(getSettings_());
      if (method === 'PUT' || method === 'POST') return jsonResponse_(updateSettings_(body));
    }
    if (path === '/reports') {
      return jsonResponse_(getReports_(e.parameter));
    }

    return jsonResponse_({ message: 'Not found: ' + path }, 404);
  } catch (err) {
    return jsonResponse_({ message: err.message || String(err) }, 500);
  }
}

function sanitizeUser_(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email || user.username,
    role: user.role || 'Admin',
  };
}

function handleLogin_(body) {
  const email = String(body.email || body.username || '').trim();
  const password = String(body.password || '');
  const sheet = getSheet_(SHEET_NAMES.USERS);
  const users = sheetToObjects_(sheet);
  const loginId = email.toLowerCase();

  const user = users.find((u) => {
    const identifiers = [u.email, u.username, u.name]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
    return identifiers.includes(loginId) && String(u.password || '').trim() === password.trim();
  });

  if (!user) {
    return { error: 'Invalid credentials' };
  }

  const token = Utilities.base64EncodeWebSafe(JSON.stringify({
    id: user.id,
    email: user.email || user.username,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  }));

  return {
    token,
    user: sanitizeUser_(user),
  };
}

function validateToken_(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(token)).getDataAsString());
    if (payload.exp && Date.now() > payload.exp) return null;
    const sheet = getSheet_(SHEET_NAMES.USERS);
    const users = sheetToObjects_(sheet);
    return users.find(u => u.id === payload.id) || null;
  } catch (err) {
    return null;
  }
}

function handlePublic_(path, method, body) {
  if (method === 'GET' && path.startsWith('/public/invoice/')) {
    const token = path.replace('/public/invoice/', '');
    const invoices = sheetToObjects_(getSheet_(SHEET_NAMES.INVOICES));
    const invoice = invoices.find(i => String(i.shareToken) === token);
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }
  throw new Error('Not found');
}

function getDashboardStats_() {
  const orders = sheetToObjects_(getSheet_(SHEET_NAMES.ORDERS));
  const customers = sheetToObjects_(getSheet_(SHEET_NAMES.CUSTOMERS));
  const completed = orders.filter(o => String(o.status).toLowerCase() === 'delivered').length;
  const pending = orders.length - completed;
  const revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  return {
    totalOrders: orders.length,
    pendingOrders: pending,
    completedOrders: completed,
    revenue,
    expenses: 0,
    receivables: 0,
    payables: 0,
    activeCustomers: customers.length,
  };
}

function getDashboardCharts_() {
  return {
    monthlySales: [],
    orderStatus: [],
  };
}

function getRecentOrders_() {
  return sheetToObjects_(getSheet_(SHEET_NAMES.ORDERS)).slice(0, 5);
}

function handleOrders_(method, body, params) {
  const sheet = getSheet_(SHEET_NAMES.ORDERS);
  const orders = sheetToObjects_(sheet);

  if (method === 'GET') return orders;
  if (method === 'POST') {
    const id = 'order_' + Date.now();
    appendRow_(sheet, { id, ...body });
    return { id, ...body };
  }
  throw new Error('Method not allowed');
}

function handleOrderById_(path, method, body) {
  const id = path.split('/')[2];
  const sheet = getSheet_(SHEET_NAMES.ORDERS);
  let orders = sheetToObjects_(sheet);
  const index = orders.findIndex(o => String(o.id) === id);

  if (path.endsWith('/duplicate') && method === 'POST') {
    const source = orders[index];
    if (!source) throw new Error('Order not found');
    const copy = { ...source, id: 'order_' + Date.now(), orderId: source.orderId + '-COPY' };
    appendRow_(sheet, copy);
    return copy;
  }

  if (path.endsWith('/status') && (method === 'PATCH' || method === 'POST')) {
    if (index < 0) throw new Error('Order not found');
    orders[index].status = body.status;
    rewriteSheet_(sheet, orders);
    return orders[index];
  }

  if (method === 'GET') {
    if (index < 0) throw new Error('Order not found');
    return orders[index];
  }
  if (method === 'PUT') {
    if (index < 0) throw new Error('Order not found');
    orders[index] = { ...orders[index], ...body };
    rewriteSheet_(sheet, orders);
    return orders[index];
  }
  if (method === 'DELETE') {
    if (index < 0) throw new Error('Order not found');
    orders.splice(index, 1);
    rewriteSheet_(sheet, orders);
    return { success: true };
  }
  throw new Error('Method not allowed');
}

function handleCustomers_(path, method, body) {
  const sheet = getSheet_(SHEET_NAMES.CUSTOMERS);
  const customers = sheetToObjects_(sheet);

  if (path.endsWith('/ledger')) {
    const id = path.split('/')[2];
    const customer = customers.find(c => String(c.id) === id);
    if (!customer) throw new Error('Customer not found');
    return {
      customer,
      invoices: [],
      orders: [],
      payments: [],
      totalBilled: 0,
      totalPaid: 0,
      outstanding: 0,
    };
  }

  return handleCollection_(SHEET_NAMES.CUSTOMERS, path, method, body, '/customers');
}

function handleCollection_(sheetName, path, method, body, basePath) {
  const sheet = getSheet_(sheetName);
  let rows = sheetToObjects_(sheet);

  if (path === basePath) {
    if (method === 'GET') return rows;
    if (method === 'POST') {
      const id = sheetName.toLowerCase().slice(0, -1) + '_' + Date.now();
      const record = { id, ...body };
      appendRow_(sheet, record);
      return record;
    }
  }

  const id = path.split('/')[2];
  const index = rows.findIndex(r => String(r.id) === id);

  if (method === 'GET') {
    if (index < 0) throw new Error('Not found');
    return rows[index];
  }
  if (method === 'PUT') {
    if (index < 0) throw new Error('Not found');
    rows[index] = { ...rows[index], ...body };
    rewriteSheet_(sheet, rows);
    return rows[index];
  }
  if (method === 'DELETE') {
    if (index < 0) throw new Error('Not found');
    rows.splice(index, 1);
    rewriteSheet_(sheet, rows);
    return { success: true };
  }

  throw new Error('Method not allowed');
}

function getSettings_() {
  const rows = sheetToObjects_(getSheet_(SHEET_NAMES.SETTINGS));
  return rows[0] || {};
}

function updateSettings_(body) {
  const sheet = getSheet_(SHEET_NAMES.SETTINGS);
  rewriteSheet_(sheet, [body]);
  return body;
}

function getReports_(params) {
  return { period: params.period || 'month', summary: {} };
}

function appendRow_(sheet, obj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (!headers.length || !headers[0]) {
    const keys = Object.keys(obj);
    sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
    sheet.getRange(2, 1, 1, keys.length).setValues([keys.map(k => obj[k])]);
    return;
  }
  sheet.appendRow(headers.map(h => obj[h] !== undefined ? obj[h] : ''));
}

function rewriteSheet_(sheet, rows) {
  if (!rows.length) {
    sheet.clearContents();
    return;
  }
  const headers = Object.keys(rows[0]);
  const data = [headers].concat(rows.map(r => headers.map(h => r[h] !== undefined ? r[h] : '')));
  sheet.clearContents();
  sheet.getRange(1, 1, data.length, headers.length).setValues(data);
}

function doGet(e) {
  return handleRequest_(e || { parameter: {} });
}

function doPost(e) {
  return handleRequest_(e || { parameter: {}, postData: { contents: '{}' } });
}

function setupSheets() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  Object.values(SHEET_NAMES).forEach(name => {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });

  const users = getSheet_(SHEET_NAMES.USERS);
  if (users.getLastRow() < 2) {
    users.getRange(1, 1, 1, 5).setValues([['id', 'name', 'email', 'password', 'role']]);
    users.getRange(2, 1, 1, 5).setValues([['user_1', 'Admin User', 'admin', 'admin123', 'Super Admin']]);
  }
}
