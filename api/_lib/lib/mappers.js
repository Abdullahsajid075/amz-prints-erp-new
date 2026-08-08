const { num, truthy } = require('./util');

function mapCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    city: row.city || '',
    notes: row.notes || '',
    inCrm: !!row.in_crm,
    stage: row.in_crm ? (row.stage || 'lead') : (row.stage || ''),
    stageUpdatedAt: row.stage_updated_at || '',
    notifyWhatsApp: truthy(row.notify_whatsapp, true),
    notifyEmail: truthy(row.notify_email, true),
  };
}

function mapOrder(row) {
  if (!row) return null;
  const total = num(row.total_amount);
  const advance = num(row.advance_payment);
  let products = row.products;
  if (typeof products === 'string') {
    try { products = JSON.parse(products); } catch { products = []; }
  }
  if (!Array.isArray(products)) products = [];
  return {
    id: row.id,
    orderId: row.order_id || '',
    date: row.date || '',
    customerId: row.customer_id || '',
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    customerEmail: row.customer_email || '',
    customerAddress: row.customer_address || '',
    status: row.status || '',
    deliveryDate: row.delivery_date || '',
    products,
    totalAmount: total,
    advancePayment: advance,
    balanceAmount: row.balance_amount != null && row.balance_amount !== ''
      ? num(row.balance_amount)
      : Math.max(0, total - advance),
    remarks: row.remarks || '',
    assignedDesigner: row.assigned_designer || '',
    tokenNo: row.token_no || '',
    docType: row.doc_type || 'Order',
    trackingNumber: row.tracking_number || '',
    statusHistory: Array.isArray(row.status_history) ? row.status_history : [],
    deliveryAddress: row.delivery_address || '',
    quotationId: row.quotation_id || '',
    paymentMethod: row.payment_method || '',
  };
}

function mapProduct(row) {
  if (!row) return null;
  const rate = num(row.rate);
  return {
    id: row.id,
    name: row.name || '',
    category: row.category || '',
    productType: row.product_type || 'Product',
    basePrice: rate,
    rate,
    unit: row.unit || '',
    description: row.description || '',
    status: row.status || 'Active',
    designer: row.designer || '',
    stock: num(row.stock),
    material: row.material || '',
    size: row.size || '',
    minQuantity: num(row.min_quantity),
    image: row.image || '',
    photo: row.image || '',
    active: String(row.status || 'Active').toLowerCase() !== 'inactive',
  };
}

function mapInvoice(row) {
  if (!row) return null;
  return {
    id: row.id,
    invoiceNumber: row.invoice_no || '',
    invoiceNo: row.invoice_no || '',
    date: row.date || '',
    dueDate: row.due_date || '',
    orderId: row.order_id || '',
    customerId: row.customer_id || '',
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    customerEmail: row.customer_email || '',
    customerAddress: row.customer_address || '',
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: num(row.subtotal),
    taxRate: num(row.tax_rate),
    tax: num(row.tax),
    discount: num(row.discount),
    previousBalance: num(row.previous_balance),
    totalAmount: num(row.total),
    total: num(row.total),
    paidAmount: num(row.paid),
    paid: num(row.paid),
    status: row.status || 'Unpaid',
    notes: row.notes || '',
    shareToken: row.share_token || '',
  };
}

function mapEmployee(row) {
  if (!row) return null;
  const photo = row.photo || row.image || '';
  return {
    id: row.id,
    employeeCode: row.employee_code || '',
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    cnic: row.cnic || '',
    role: row.role || 'Staff',
    designation: row.designation || '',
    department: row.department || 'General',
    joinDate: row.join_date || '',
    salary: num(row.salary),
    status: row.status || 'Active',
    address: row.address || '',
    city: row.city || '',
    emergencyContact: row.emergency_contact || '',
    emergencyPhone: row.emergency_phone || '',
    notes: row.notes || '',
    photo,
    image: photo,
  };
}

function mapVendor(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    notes: row.notes || '',
    contactPerson: row.contact_person || '',
    category: row.category || '',
    paymentTerms: row.payment_terms || '',
    taxId: row.tax_id || '',
  };
}

function mapPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    date: row.date || '',
    type: row.type || '',
    category: row.category || '',
    refId: row.ref_id || '',
    customerName: row.customer_name || '',
    party: row.customer_name || '',
    customerId: row.customer_id || '',
    partyPhone: row.party_phone || '',
    amount: num(row.amount),
    method: row.method || '',
    notes: row.notes || '',
    balanceDue: num(row.balance_due),
    totalAmount: num(row.total_amount),
  };
}

function mapExpense(row) {
  if (!row) return null;
  return {
    id: row.id,
    date: row.date || '',
    category: row.category || '',
    amount: num(row.amount),
    description: row.description || '',
    paymentMethod: row.payment_method || '',
  };
}

function mapPurchase(row) {
  if (!row) return null;
  const total = num(row.total);
  const paidAmount = num(row.paid_amount != null ? row.paid_amount : row.paid);
  return {
    id: row.id,
    purchaseNo: row.purchase_no || '',
    date: row.date || '',
    vendorId: row.vendor_id || '',
    vendorName: row.vendor_name || '',
    items: Array.isArray(row.items) ? row.items : [],
    total,
    totalAmount: total,
    paidAmount,
    paid: paidAmount,
    status: row.status || '',
    outstanding: Math.max(0, total - paidAmount),
  };
}

function mapUser(row, includePassword = false) {
  if (!row) return null;
  const base = {
    id: row.id,
    username: row.username || '',
    name: row.name || '',
    role: row.role || '',
    status: row.status || 'Active',
    email: row.email || row.username || '',
    employeeId: row.employee_id || '',
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  };
  if (includePassword) base.password = row.password || '';
  return base;
}

module.exports = {
  mapCustomer,
  mapOrder,
  mapProduct,
  mapInvoice,
  mapEmployee,
  mapVendor,
  mapPayment,
  mapExpense,
  mapPurchase,
  mapUser,
};
