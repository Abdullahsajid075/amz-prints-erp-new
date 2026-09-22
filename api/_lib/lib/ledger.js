const { num } = require('./util');
const { collectOrderIds } = require('./helpers');

function isQuotation(row) {
  return String(row?.doc_type || row?.docType || '').toLowerCase() === 'quotation';
}

function isCancelledStatus(status) {
  return /cancel|void|voided/i.test(String(status || ''));
}

function phoneKey(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function invoiceTotalDue(inv) {
  if (isCancelledStatus(inv?.status)) return 0;
  return num(inv.total != null ? inv.total : inv.total_amount) + num(inv.previous_balance);
}

function belongsToCustomer(row, customer) {
  if (!row || !customer) return false;
  const cid = String(customer.id || '');
  if (cid && String(row.customer_id || '') === cid) return true;
  const custPhone = phoneKey(customer.phone);
  const rowPhone = phoneKey(row.customer_phone || row.party_phone || row.customerPhone);
  if (custPhone && rowPhone && custPhone === rowPhone) return true;
  const cName = String(customer.name || '').trim().toLowerCase();
  const rName = String(row.customer_name || row.customerName || '').trim().toLowerCase();
  if (cName && rName && cName === rName && cName !== 'walk-in' && cName !== 'walkin') return true;
  return false;
}

function invoiceOrderRefs(inv) {
  return collectOrderIds({}, inv);
}

function computeCustomerLedger(customer, orders, invoices, payments, opts = {}) {
  const realOrders = (orders || []).filter((o) =>
    !isQuotation(o) && !isCancelledStatus(o.status) && belongsToCustomer(o, customer)
  );
  const invs = (invoices || []).filter((inv) =>
    !isCancelledStatus(inv.status) && belongsToCustomer(inv, customer)
  );
  const pays = (payments || []).filter((p) => belongsToCustomer(p, customer)
    || String(p.customer_id || '') === String(customer.id || ''));

  const invoiced = {};
  invs.forEach((inv) => {
    invoiceOrderRefs(inv).forEach((ref) => { if (ref) invoiced[String(ref)] = true; });
  });
  const orphanOrders = realOrders.filter((o) =>
    !invoiced[String(o.order_id || '')] && !invoiced[String(o.id || '')]
  );

  const invoiceBilled = invs.reduce((s, inv) => s + invoiceTotalDue(inv), 0);
  const orphanBilled = orphanOrders.reduce((s, o) => s + num(o.total_amount), 0);
  const invoiceOutstanding = invs.reduce((s, inv) => s + Math.max(0, invoiceTotalDue(inv) - num(inv.paid)), 0);
  const orphanOutstanding = orphanOrders.reduce((s, o) => s + num(o.balance_amount), 0);
  const orderBalanceSum = realOrders.reduce((s, o) => s + num(o.balance_amount), 0);
  const paymentPaid = pays.reduce((s, p) => {
    const t = String(p.type || 'inflow').toLowerCase();
    const cat = String(p.category || '').toLowerCase();
    if (t === 'adjustment' || t === 'credit_applied' || cat.includes('advance applied') || cat.includes('credit applied')) {
      return s;
    }
    if (t === 'outflow' || t === 'out') return s - num(p.amount);
    return s + num(p.amount);
  }, 0);
  const credit = num(customer.credit_balance);
  // Prefer the larger of invoice-centric AR and legacy order balances so cutover
  // never hides the old Sheets outstanding when invoices were marked paid early.
  const composed = invoiceOutstanding + orphanOutstanding;
  const outstanding = Math.max(0, Math.max(composed, orderBalanceSum) - credit);

  if (opts && opts.statement === false) {
    return {
      totalBilled: invoiceBilled + orphanBilled,
      totalPaid: Math.max(0, paymentPaid),
      orderOutstanding: Math.max(orphanOutstanding, orderBalanceSum),
      invoiceOutstanding,
      outstanding,
      creditBalance: credit,
      payable: outstanding,
      statement: [],
    };
  }

  const statement = [];
  invs.forEach((inv) => {
    const due = invoiceTotalDue(inv);
    if (!(due > 0)) return;
    statement.push({
      date: inv.date || '',
      type: 'debit',
      particular: `Invoice ${inv.invoice_no || inv.id || ''}`,
      reference: inv.invoice_no || '',
      invoiceNumber: inv.invoice_no || '',
      orderId: inv.order_id || '',
      debit: due,
      credit: 0,
      method: '',
      notes: inv.notes || '',
    });
  });
  orphanOrders.forEach((o) => {
    const amt = num(o.total_amount);
    if (!(amt > 0)) return;
    statement.push({
      date: o.date || '',
      type: 'debit',
      particular: `Order ${o.order_id || o.id || ''} (no invoice)`,
      reference: o.order_id || '',
      invoiceNumber: '',
      orderId: o.order_id || '',
      debit: amt,
      credit: 0,
      method: '',
      notes: '',
    });
  });
  pays.forEach((p) => {
    const amt = num(p.amount);
    if (!(amt > 0)) return;
    const t = String(p.type || 'inflow').toLowerCase();
    const outflow = t === 'outflow' || t === 'out';
    const adjustment = t === 'adjustment' || t === 'credit_applied';
    statement.push({
      date: p.date || '',
      type: outflow ? 'debit' : 'credit',
      particular: p.notes || p.category || (adjustment ? 'Advance applied' : (outflow ? 'Payment out' : 'Payment received')),
      reference: p.ref_id || p.id || '',
      invoiceNumber: '',
      orderId: '',
      debit: outflow ? amt : 0,
      credit: outflow ? 0 : amt,
      method: p.method || '',
      notes: p.notes || '',
    });
  });
  statement.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  let running = 0;
  statement.forEach((line) => {
    running += num(line.debit) - num(line.credit);
    line.balance = running;
  });

  return {
    totalBilled: invoiceBilled + orphanBilled,
    totalPaid: Math.max(0, paymentPaid),
    orderOutstanding: Math.max(orphanOutstanding, orderBalanceSum),
    invoiceOutstanding,
    outstanding,
    creditBalance: credit,
    payable: outstanding,
    statement,
  };
}

function computeCompanyReceivables(orders, invoices, customers, payments) {
  const pay = payments || [];
  return (customers || []).reduce(
    (sum, c) => sum + computeCustomerLedger(c, orders, invoices, pay, { statement: false }).outstanding,
    0
  );
}

function purchaseOutstanding(p) {
  if (!p || isCancelledStatus(p.status)) return 0;
  const status = String(p.status || '').toLowerCase();
  if (status.includes('fully paid') || status === 'paid') return 0;
  const total = num(p.total != null ? p.total : p.total_amount);
  const paid = num(p.paid_amount != null ? p.paid_amount : p.paid);
  return Math.max(0, total - paid);
}

function computeVendorOutstanding(vendor, purchases) {
  return (purchases || []).reduce((sum, p) => {
    const sameId = vendor.id && String(p.vendor_id || '') === String(vendor.id);
    const sameName = vendor.name && String(p.vendor_name || '').trim().toLowerCase() === String(vendor.name).trim().toLowerCase();
    if (!sameId && !sameName) return sum;
    return sum + purchaseOutstanding(p);
  }, 0);
}

module.exports = {
  isQuotation,
  isCancelledStatus,
  invoiceTotalDue,
  belongsToCustomer,
  computeCustomerLedger,
  computeCompanyReceivables,
  purchaseOutstanding,
  computeVendorOutstanding,
};
