const { num, truthy } = require('./util');
const { asArray, uniqueStrings, parseImages, isBlocked, invoiceStatusFromPaid, customerPhoto, stripPhotoFromNotes, isWebsiteCatalogReady } = require('./helpers');

function mapCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerCode: row.customer_code || row.id || '',
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    city: row.city || '',
    notes: stripPhotoFromNotes(row.notes),
    inCrm: !!row.in_crm,
    stage: row.in_crm ? (row.stage || 'lead') : (row.stage || ''),
    stageUpdatedAt: row.stage_updated_at || '',
    notifyWhatsApp: truthy(row.notify_whatsapp, true),
    notifyEmail: truthy(row.notify_email, true),
    blocked: isBlocked(row),
    blockReason: row.block_reason || '',
    blockedAt: row.blocked_at || '',
    blockedBy: row.blocked_by || '',
    creditBalance: num(row.credit_balance),
    outstanding: num(row.outstanding),
    photo: customerPhoto(row),
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
    statusHistory: Array.isArray(row.status_history) ? row.status_history : asArray(row.status_history),
    deliveryAddress: row.delivery_address || '',
    quotationId: row.quotation_id || '',
    paymentMethod: row.payment_method || '',
  };
}

function mapProduct(row) {
  if (!row) return null;
  const rate = num(row.rate);
  const salePrice = num(row.sale_price);
  const images = parseImages(row.images, row.image || '');
  const img = images[0] || row.image || '';
  const catalogReady = isWebsiteCatalogReady({ images, description: row.description, fullDescription: row.full_description, image: img });
  const showOnWebsite = catalogReady && (row.show_on_website == null ? true : truthy(row.show_on_website, true));
  const productType = row.product_type || 'Product';
  const isService = String(productType).toLowerCase() === 'service';
  const trackInventory = isService ? false : (row.track_inventory == null ? true : truthy(row.track_inventory, true));
  return {
    id: row.id,
    name: row.name || '',
    category: row.category || '',
    productType,
    basePrice: rate,
    rate,
    salePrice,
    effectivePrice: salePrice > 0 ? salePrice : rate,
    unit: row.unit || '',
    description: row.description || '',
    fullDescription: row.full_description || '',
    status: row.status || 'Active',
    designer: row.designer || '',
    stock: isService ? 0 : num(row.stock),
    trackInventory,
    material: row.material || '',
    size: row.size || '',
    minQuantity: num(row.min_quantity),
    image: img,
    photo: img,
    images,
    variations: Array.isArray(row.variations) ? row.variations : asArray(row.variations),
    active: String(row.status || 'Active').toLowerCase() !== 'inactive',
    showOnWebsite,
    showOnTop: showOnWebsite && !!row.show_on_top,
    catalogReady,
  };
}

function mapInvoice(row) {
  if (!row) return null;
  const orderIds = uniqueStrings([
    ...asArray(row.order_ids),
    row.order_id || '',
  ]);
  const total = num(row.total);
  const paid = num(row.paid);
  let history = row.payment_history;
  if (typeof history === 'string') {
    try { history = JSON.parse(history); } catch { history = []; }
  }
  if (!Array.isArray(history)) history = [];
  return {
    id: row.id,
    invoiceNumber: row.invoice_no || '',
    invoiceNo: row.invoice_no || '',
    date: row.date || '',
    dueDate: row.due_date || '',
    orderId: orderIds[0] || row.order_id || '',
    orderIds,
    customerId: row.customer_id || '',
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    customerEmail: row.customer_email || '',
    customerAddress: row.customer_address || '',
    items: Array.isArray(row.items) ? row.items : asArray(row.items),
    subtotal: num(row.subtotal),
    taxRate: num(row.tax_rate),
    tax: num(row.tax),
    discount: num(row.discount),
    previousBalance: num(row.previous_balance),
    totalAmount: total,
    total,
    paidAmount: paid,
    paid,
    balanceAmount: Math.max(0, total + num(row.previous_balance) - paid),
    paymentHistory: history,
    status: row.status || invoiceStatusFromPaid(total, paid),
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
    endDate: row.end_date || '',
    validFrom: row.valid_from || '',
    validUntil: row.valid_until || '',
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
    outstandingBalance: num(row.outstanding_balance),
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
    partyPhone: row.party_phone || row.customer_phone || '',
    customerPhone: row.party_phone || row.customer_phone || '',
    amount: num(row.amount),
    method: row.method || '',
    notes: row.notes || '',
    balanceDue: num(row.balance_due),
    totalAmount: num(row.total_amount),
  };
}

function mapExpense(row) {
  if (!row) return null;
  const approved = row.approved === true || String(row.approved).toLowerCase() === 'true';
  return {
    id: row.id,
    date: row.date || '',
    category: row.category || '',
    amount: num(row.amount),
    description: row.description || '',
    paymentMethod: row.payment_method || '',
    paidTo: row.paid_to || '',
    notes: row.notes || '',
    approved,
    approvedBy: row.approved_by || '',
    approvedAt: row.approved_at || '',
    status: approved ? 'Approved' : 'Pending',
  };
}

function mapPurchase(row) {
  if (!row) return null;
  const total = num(row.total != null ? row.total : row.total_amount);
  const paidAmount = num(row.paid_amount != null ? row.paid_amount : row.paid);
  const po = row.purchase_no || row.po_number || '';
  const date = row.date || row.purchase_date || '';
  return {
    id: row.id,
    poNumber: po,
    purchaseNo: po,
    purchaseDate: date,
    date,
    vendorId: row.vendor_id || '',
    vendorName: row.vendor_name || '',
    vendorInvoiceNumber: row.vendor_invoice_number || '',
    expectedDeliveryDate: row.expected_delivery_date || '',
    actualDeliveryDate: row.actual_delivery_date || '',
    linkedOrderId: row.linked_order_id || '',
    items: Array.isArray(row.items) ? row.items : asArray(row.items),
    total,
    totalAmount: total,
    paidAmount,
    paid: paidAmount,
    status: row.status || 'Draft',
    notes: row.notes || '',
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
    permissions: Array.isArray(row.permissions) ? row.permissions : asArray(row.permissions),
  };
  if (includePassword) base.password = row.password || '';
  return base;
}

function mapToken(t) {
  if (!t) return null;
  return {
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
  };
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
  mapToken,
};
