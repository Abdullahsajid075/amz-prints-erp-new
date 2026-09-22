function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function dateKey(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const iso = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const dmy = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dmy) {
    const a = Number(dmy[1]);
    const b = Number(dmy[2]);
    const y = dmy[3];
    if (a > 12) return `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
    if (b > 12) return `${y}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
    return `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return '';
}

export function inDateRange(raw, from, to) {
  if (!from && !to) return true;
  const dk = dateKey(raw);
  if (!dk) return true;
  if (from && dk < from) return false;
  if (to && dk > to) return false;
  return true;
}

function isQuotation(row) {
  return String(row?.docType || row?.doc_type || '').toLowerCase() === 'quotation';
}

function isCancelled(status) {
  return /cancel|void/i.test(String(status || ''));
}

function expenseApproved(row) {
  if (!row) return false;
  if (row.approved === false) return false;
  const s = String(row.approved ?? row.status ?? '').trim().toLowerCase();
  if (s === 'false' || s === '0' || s === 'no' || s === 'pending' || s === 'rejected') return false;
  return true;
}

function purchaseOutstanding(p) {
  if (!p || isCancelled(p.status)) return 0;
  const status = String(p.status || '').toLowerCase();
  if (status.includes('fully paid') || status === 'paid') return 0;
  const total = num(p.total != null ? p.total : p.totalAmount);
  const paid = num(p.paidAmount != null ? p.paidAmount : p.paid_amount);
  return Math.max(0, total - paid);
}

function invoiceDue(inv) {
  if (isCancelled(inv?.status)) return 0;
  return num(inv.totalAmount ?? inv.total) + num(inv.previousBalance ?? inv.previous_balance);
}

function invoiceBalance(inv) {
  return Math.max(0, invoiceDue(inv) - num(inv.paidAmount ?? inv.paid));
}

function orderTotal(o) {
  const direct = num(o.totalAmount ?? o.total_amount);
  if (direct > 0) return direct;
  return (Array.isArray(o.products) ? o.products : []).reduce(
    (s, p) => s + num(p.quantity) * num(p.rate),
    0,
  );
}

function orderBalance(o) {
  const stored = o.balanceAmount ?? o.balance_amount;
  if (stored != null && stored !== '') return Math.max(0, num(stored));
  return Math.max(0, orderTotal(o) - num(o.advancePayment ?? o.advance_payment));
}

export function asApiList(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.orders)) return d.orders;
  if (Array.isArray(d?.invoices)) return d.invoices;
  if (Array.isArray(d?.customers)) return d.customers;
  if (Array.isArray(d?.payments)) return d.payments;
  if (Array.isArray(d?.expenses)) return d.expenses;
  if (Array.isArray(d?.purchases)) return d.purchases;
  return [];
}

export function buildDashboardFromLists({
  orders = [],
  invoices = [],
  expenses = [],
  payments = [],
  customers = [],
  purchases = [],
  from = '',
  to = '',
} = {}) {
  const quotations = orders.filter((o) => isQuotation(o) && inDateRange(o.date, from, to));
  const realOrders = orders.filter((o) => !isQuotation(o) && inDateRange(o.date, from, to) && !isCancelled(o.status));
  const allDatedOrders = orders.filter((o) => !isQuotation(o) && inDateRange(o.date, from, to));
  const expenseRows = expenses.filter((e) => inDateRange(e.date, from, to) && expenseApproved(e));
  const purchaseRows = purchases.filter((p) => inDateRange(p.date || p.purchaseDate || p.purchase_date, from, to));
  const invoiceRows = invoices.filter((inv) => inDateRange(inv.date, from, to) && !isCancelled(inv.status));
  const paymentRows = payments.filter((p) => inDateRange(p.date, from, to));

  const revenue = realOrders.reduce((s, o) => s + orderTotal(o), 0);
  const expenseSum = expenseRows.reduce((s, e) => s + num(e.amount), 0);
  const payables = purchaseRows.reduce((s, p) => s + purchaseOutstanding(p), 0);

  const statusMap = {};
  realOrders.forEach((o) => {
    const key = o.status || 'Unknown';
    statusMap[key] = (statusMap[key] || 0) + 1;
  });

  const designingOrders = realOrders.filter((o) => /design|proof/i.test(String(o.status || ''))).length;
  const printingOrders = realOrders.filter((o) => /print|finish|pack/i.test(String(o.status || ''))).length;
  const readyOrders = realOrders.filter((o) => /^ready$/i.test(String(o.status || ''))).length;
  const completedOrders = realOrders.filter((o) => /deliver/i.test(String(o.status || ''))).length;
  const pendingOrders = allDatedOrders.filter((o) => !/deliver/i.test(String(o.status || '')) && !isCancelled(o.status)).length;

  const cashIn = paymentRows
    .filter((p) => !/outflow|^out$/i.test(String(p.type || 'inflow')))
    .reduce((s, p) => s + num(p.amount), 0);
  const cashOut = paymentRows
    .filter((p) => /outflow|^out$/i.test(String(p.type || '')))
    .reduce((s, p) => s + num(p.amount), 0);

  const fromCustomers = customers.reduce((s, c) => s + Math.max(0, num(c.outstanding)), 0);
  const fromInvoices = invoiceRows.reduce((s, inv) => s + invoiceBalance(inv), 0);
  const fromOrders = realOrders.reduce((s, o) => s + orderBalance(o), 0);
  const receivables = fromCustomers > 0.009 ? fromCustomers : Math.max(fromInvoices, fromOrders);

  const fulfillmentRate = realOrders.length ? Math.round((completedOrders / realOrders.length) * 100) : 0;
  const collectionRate = revenue > 0 ? Math.round((Math.min(cashIn, revenue) / revenue) * 100) : 0;

  const attention = realOrders
    .filter((o) => {
      const ready = /^ready$/i.test(String(o.status || ''));
      const due = dateKey(o.deliveryDate || o.delivery_date);
      const overdue = due && due < dateKey(new Date().toISOString()) && !/deliver/i.test(String(o.status || ''));
      const unpaid = orderBalance(o) > 0.009;
      return ready || overdue || unpaid;
    })
    .sort((a, b) => orderBalance(b) - orderBalance(a))
    .slice(0, 12);

  const recentOrders = [...realOrders]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, 8);

  const recentExpenses = [...expenseRows]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, 6);

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      key,
      month: d.toLocaleString('en-US', { month: 'short' }),
      sales: 0,
      orders: 0,
      expenses: 0,
    });
  }
  const index = Object.fromEntries(months.map((m) => [m.key, m]));
  realOrders.forEach((o) => {
    const key = dateKey(o.date).slice(0, 7);
    if (!index[key]) return;
    index[key].sales += orderTotal(o);
    index[key].orders += 1;
  });
  expenseRows.forEach((e) => {
    const key = dateKey(e.date).slice(0, 7);
    if (!index[key]) return;
    index[key].expenses += num(e.amount);
  });

  return {
    stats: {
      totalQuotations: quotations.length,
      totalOrders: realOrders.length,
      totalInvoices: invoiceRows.length,
      pendingOrders,
      completedOrders,
      readyOrders,
      designingOrders,
      printingOrders,
      revenue,
      expenses: expenseSum,
      receivables,
      collected: cashIn,
      payables,
      vendorPayables: payables,
      cashIn,
      cashOut,
      cashNet: cashIn - cashOut,
      activeCustomers: customers.length,
      fulfillmentRate,
      collectionRate,
      from: from || '',
      to: to || '',
    },
    recentOrders,
    recentExpenses,
    attention,
    charts: {
      monthlySales: months,
      orderStatus: Object.keys(statusMap).map((name) => ({ name, value: statusMap[name] })),
    },
  };
}

export function dashboardLooksEmpty(stats, recentOrders) {
  if (!stats || typeof stats !== 'object') return true;
  const orders = Number(stats.totalOrders || 0);
  const invoices = Number(stats.totalInvoices || 0);
  const customers = Number(stats.activeCustomers || 0);
  const revenue = Number(stats.revenue || 0);
  const rec = Number(stats.receivables || 0);
  return orders <= 0 && invoices <= 0 && customers <= 0 && revenue <= 0 && rec <= 0 && !(recentOrders || []).length;
}
