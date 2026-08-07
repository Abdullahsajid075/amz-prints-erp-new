/**
 * Import a Google Sheets CSV export into a Supabase table.
 *
 * 1. In Google Sheets: File → Download → CSV (each sheet separately)
 * 2. Place CSVs in api/scripts/csv/  (Customers.csv, Orders.csv, …)
 * 3. Set SUPABASE_URL + SUPABASE_API_KEY in api/.env
 * 4. node scripts/import-csv.js Customers.csv customers
 *
 * Header names are normalized (spaces removed, lowercased) then mapped.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const { supabase } = require('../db');

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] != null ? cells[i] : ''; });
    return obj;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (c === ',' && !q) {
      out.push(cur); cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function normKey(h) {
  return String(h || '').trim().toLowerCase().replace(/[\s_\-]+/g, '');
}

function parseMaybeJson(v) {
  const s = String(v || '').trim();
  if ((s.startsWith('[') || s.startsWith('{')) && s.length > 1) {
    try { return JSON.parse(s); } catch { return v; }
  }
  return v;
}

const TABLE_MAPS = {
  customers: (row) => ({
    id: row.id || row.Id || `cust_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: row.name || row.Name || '',
    phone: row.phone || row.Phone || '',
    email: row.email || row.Email || '',
    address: row.address || row.Address || '',
    city: row.city || row.City || '',
    notes: row.notes || row.Notes || '',
    in_crm: String(row.incrm || row.InCrm || '').toLowerCase() === 'true' || row.InCrm === true,
    stage: row.stage || row.Stage || '',
    stage_updated_at: row.stageupdatedat || row.StageUpdatedAt || '',
    notify_whatsapp: row.notifywhatsapp !== 'false' && row.NotifyWhatsApp !== false,
    notify_email: row.notifyemail !== 'false' && row.NotifyEmail !== false,
  }),
  users: (row) => ({
    id: row.id || row.Id || `user_${(row.username || row.Username || Date.now())}`,
    username: row.username || row.Username || '',
    password: row.password || row.Password || '',
    name: row.name || row.Name || '',
    role: row.role || row.Role || 'Admin',
    status: row.status || row.Status || 'Active',
    permissions: parseMaybeJson(row.permissions || row.Permissions || '[]'),
    email: row.email || row.Email || row.username || row.Username || '',
  }),
  products: (row) => ({
    id: row.id || row.Id || `prod_${Date.now()}`,
    name: row.name || row.Name || '',
    category: row.category || row.Category || '',
    rate: Number(row.rate || row.Rate || 0),
    unit: row.unit || row.Unit || '',
    description: row.description || row.Description || '',
    status: row.status || row.Status || 'Active',
    product_type: row.producttype || row.ProductType || 'Product',
    designer: row.designer || row.Designer || '',
    stock: Number(row.stock || row.Stock || 0),
    material: row.material || row.Material || '',
    size: row.size || row.Size || '',
    min_quantity: Number(row.minquantity || row.MinQuantity || 0),
  }),
  orders: (row) => ({
    id: row.id || row.Id || `order_${Date.now()}`,
    order_id: row.orderid || row.OrderId || '',
    date: row.date || row.Date || '',
    customer_id: row.customerid || row.CustomerId || '',
    customer_name: row.customername || row.CustomerName || '',
    customer_phone: row.customerphone || row.CustomerPhone || '',
    customer_email: row.customeremail || row.CustomerEmail || '',
    customer_address: row.customeraddress || row.CustomerAddress || '',
    status: row.status || row.Status || '',
    delivery_date: row.deliverydate || row.DeliveryDate || '',
    products: parseMaybeJson(row.products || row.Products || '[]'),
    total_amount: Number(row.totalamount || row.TotalAmount || 0),
    advance_payment: Number(row.advancepayment || row.AdvancePayment || 0),
    balance_amount: Number(row.balanceamount || row.BalanceAmount || 0),
    remarks: row.remarks || row.Remarks || '',
    assigned_designer: row.assigneddesigner || row.AssignedDesigner || '',
    token_no: row.tokenno || row.TokenNo || '',
    doc_type: row.doctype || row.DocType || 'Order',
    tracking_number: row.trackingnumber || row.TrackingNumber || '',
    status_history: parseMaybeJson(row.statushistory || row.StatusHistory || '[]'),
    delivery_address: row.deliveryaddress || row.DeliveryAddress || '',
    quotation_id: row.quotationid || row.QuotationId || '',
  }),
  invoices: (row) => ({
    id: row.id || row.Id || `inv_${Date.now()}`,
    invoice_no: row.invoiceno || row.InvoiceNo || '',
    date: row.date || row.Date || '',
    due_date: row.duedate || row.DueDate || '',
    order_id: row.orderid || row.OrderId || '',
    customer_id: row.customerid || row.CustomerId || '',
    customer_name: row.customername || row.CustomerName || '',
    customer_phone: row.customerphone || row.CustomerPhone || '',
    customer_email: row.customeremail || row.CustomerEmail || '',
    customer_address: row.customeraddress || row.CustomerAddress || '',
    items: parseMaybeJson(row.items || row.Items || '[]'),
    subtotal: Number(row.subtotal || row.Subtotal || 0),
    tax_rate: Number(row.taxrate || row.TaxRate || 0),
    tax: Number(row.tax || row.Tax || 0),
    discount: Number(row.discount || row.Discount || 0),
    previous_balance: Number(row.previousbalance || row.PreviousBalance || 0),
    total: Number(row.total || row.Total || 0),
    paid: Number(row.paid || row.Paid || 0),
    status: row.status || row.Status || '',
    notes: row.notes || row.Notes || '',
    share_token: row.sharetoken || row.ShareToken || '',
  }),
  employees: (row) => ({
    id: row.id || row.Id || `emp_${Date.now()}`,
    name: row.name || row.Name || '',
    phone: row.phone || row.Phone || '',
    email: row.email || row.Email || '',
    role: row.role || row.Role || 'Staff',
    department: row.department || row.Department || '',
    join_date: row.joindate || row.JoinDate || '',
    salary: Number(row.salary || row.Salary || 0),
    status: row.status || row.Status || 'Active',
    address: row.address || row.Address || '',
    notes: row.notes || row.Notes || '',
  }),
  vendors: (row) => ({
    id: row.id || row.Id || `vend_${Date.now()}`,
    name: row.name || row.Name || '',
    phone: row.phone || row.Phone || '',
    email: row.email || row.Email || '',
    address: row.address || row.Address || '',
    notes: row.notes || row.Notes || '',
  }),
  expenses: (row) => ({
    id: row.id || row.Id || `exp_${Date.now()}`,
    date: row.date || row.Date || '',
    category: row.category || row.Category || '',
    amount: Number(row.amount || row.Amount || 0),
    description: row.description || row.Description || '',
    payment_method: row.paymentmethod || row.PaymentMethod || '',
  }),
  payments: (row) => ({
    id: row.id || row.Id || `pay_${Date.now()}`,
    date: row.date || row.Date || '',
    type: row.type || row.Type || '',
    category: row.category || row.Category || '',
    ref_id: row.refid || row.RefId || '',
    customer_name: row.customername || row.CustomerName || '',
    customer_id: row.customerid || row.CustomerId || '',
    party_phone: row.partyphone || row.PartyPhone || '',
    amount: Number(row.amount || row.Amount || 0),
    method: row.method || row.Method || '',
    notes: row.notes || row.Notes || '',
    balance_due: Number(row.balancedue || row.BalanceDue || 0),
    total_amount: Number(row.totalamount || row.TotalAmount || 0),
  }),
};

async function main() {
  const file = process.argv[2];
  const table = process.argv[3];
  if (!file || !table || !TABLE_MAPS[table]) {
    console.log('Usage: node scripts/import-csv.js <File.csv> <table>');
    console.log('Tables:', Object.keys(TABLE_MAPS).join(', '));
    process.exit(1);
  }
  const full = path.isAbsolute(file) ? file : path.join(__dirname, 'csv', file);
  const text = fs.readFileSync(full, 'utf8');
  const rawRows = parseCsv(text);
  // also support normalized keys
  const mapped = rawRows.map((r) => {
    const flat = {};
    Object.keys(r).forEach((k) => { flat[normKey(k)] = r[k]; flat[k] = r[k]; });
    return TABLE_MAPS[table](flat);
  }).filter((r) => r.id || r.name || r.username);

  console.log(`Importing ${mapped.length} rows → ${table}`);
  const chunk = 50;
  for (let i = 0; i < mapped.length; i += chunk) {
    const slice = mapped.slice(i, i + chunk);
    const { error } = await supabase.from(table).upsert(slice);
    if (error) {
      console.error('Chunk failed', i, error.message);
      process.exit(1);
    }
    console.log(`  upserted ${Math.min(i + chunk, mapped.length)}/${mapped.length}`);
  }
  console.log('Done');
}

main();
