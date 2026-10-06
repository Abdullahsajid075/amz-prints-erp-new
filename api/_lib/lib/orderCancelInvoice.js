const { num } = require('./util');
const { asArray, uniqueStrings, collectOrderIds, invoiceStatusFromPaid } = require('./helpers');

function orderKeys(order) {
  return uniqueStrings([
    order?.order_id,
    order?.orderId,
    order?.id,
  ]);
}

function invoiceHoldsOrder(invoice, order) {
  if (!invoice || !order) return false;
  const keys = orderKeys(order);
  if (!keys.length) return false;
  const ids = collectOrderIds({}, invoice).map(String);
  return keys.some((k) => ids.includes(k) || String(invoice.order_id || invoice.orderId || '') === k);
}

function historyIsReversal(entry) {
  if (!entry) return false;
  if (entry.reversal === true) return true;
  if (num(entry.applied) < 0) return true;
  return /revers/i.test(String(entry.notes || entry.method || ''));
}

function paymentAttributedToOrder(entry, keys) {
  if (!entry || historyIsReversal(entry)) return false;
  const oid = String(entry.orderId || entry.order_id || entry.orderid || '').trim();
  if (oid && keys.includes(oid)) return true;
  const notes = String(entry.notes || '');
  return keys.some((k) => k && notes.includes(k));
}

function attributedPaidForOrder(invoice, order) {
  const keys = orderKeys(order);
  const history = asArray(invoice?.payment_history || invoice?.paymentHistory);
  let sum = 0;
  history.forEach((h) => {
    if (!paymentAttributedToOrder(h, keys)) return;
    const applied = h.applied != null ? num(h.applied) : num(h.amount);
    if (applied > 0) sum += applied;
  });
  return sum;
}

function amountToReverse(invoice, order) {
  const paid = num(invoice?.paid != null ? invoice.paid : invoice?.paidAmount);
  if (!(paid > 0.009)) return 0;
  const attributed = attributedPaidForOrder(invoice, order);
  if (attributed > 0.009) return Math.min(attributed, paid);
  const ids = collectOrderIds({}, invoice);
  const keys = orderKeys(order);
  const onlyThis = !ids.length || ids.every((id) => keys.includes(String(id)));
  if (onlyThis) return paid;
  const advance = num(order?.advance_payment != null ? order.advance_payment : order?.advancePayment);
  if (advance > 0.009) return Math.min(advance, paid);
  return 0;
}

function itemSourceKeys(item) {
  return uniqueStrings([
    item?.sourceOrderId,
    item?.source_order_id,
    item?.orderId,
    item?.order_id,
  ]);
}

function stripCancelledOrderItems(items, order) {
  const list = Array.isArray(items) ? items : [];
  const keys = orderKeys(order);
  const tagged = list.some((it) => itemSourceKeys(it).length);
  if (tagged) {
    return list.filter((it) => {
      const src = itemSourceKeys(it);
      if (!src.length) return true;
      return !src.some((k) => keys.includes(k));
    });
  }
  const products = Array.isArray(order?.products)
    ? order.products.map((p) => ({ ...p }))
    : (Array.isArray(order?.items) ? order.items.map((p) => ({ ...p })) : []);
  return list.filter((it) => {
    const idx = products.findIndex((p) => (
      String(p.name || '').trim().toLowerCase() === String(it.name || '').trim().toLowerCase()
      && Math.abs(num(p.quantity) - num(it.quantity)) < 0.0001
    ));
    if (idx >= 0) {
      products.splice(idx, 1);
      return false;
    }
    return true;
  });
}

function appendCancelNote(notes, orderId, cancelledWhole) {
  const tag = cancelledWhole
    ? `[ORDER_CANCELLED] Invoice cancelled because order ${orderId} was cancelled.`
    : `[ORDER_CANCELLED] Removed cancelled order ${orderId}.`;
  const current = String(notes || '').trim();
  if (current.includes(`[ORDER_CANCELLED]`) && current.includes(String(orderId))) return current;
  return current ? `${current} ${tag}` : tag;
}

function remainingOrderIds(invoice, order) {
  const keys = orderKeys(order);
  return collectOrderIds({}, invoice).filter((id) => !keys.includes(String(id)));
}

function planInvoiceAfterOrderCancel(invoice, order) {
  if (!invoice || !order) {
    return { action: 'none', reversePaid: 0, creditExtra: 0 };
  }
  const orderId = order.order_id || order.orderId || order.id || '';
  const prevTotal = num(invoice.total != null ? invoice.total : invoice.total_amount);
  const prevSub = num(invoice.subtotal != null ? invoice.subtotal : prevTotal);
  const prevPaid = num(invoice.paid != null ? invoice.paid : invoice.paidAmount);
  const prevBal = num(invoice.previous_balance != null ? invoice.previous_balance : invoice.previousBalance);
  const orderTotal = num(order.total_amount != null ? order.total_amount : order.total);
  const nextIds = remainingOrderIds(invoice, order);
  const reversePaid = amountToReverse(invoice, order);
  const cancelInvoice = nextIds.length === 0;
  const nextItems = cancelInvoice ? [] : stripCancelledOrderItems(asArray(invoice.items), order);
  const nextTotal = cancelInvoice ? 0 : Math.max(0, prevTotal - orderTotal);
  const nextSub = cancelInvoice ? 0 : Math.max(0, prevSub - orderTotal);
  let nextPaid = Math.max(0, prevPaid - reversePaid);
  const due = nextTotal + prevBal;
  let creditExtra = 0;
  if (!cancelInvoice && nextPaid > due + 0.009) {
    creditExtra = nextPaid - due;
    nextPaid = due;
  }
  if (cancelInvoice) {
    creditExtra = 0;
    nextPaid = 0;
  }
  const status = cancelInvoice ? 'Cancelled' : invoiceStatusFromPaid(due, nextPaid);
  const action = cancelInvoice ? 'cancelled-invoice' : 'removed-from-invoice';
  const message = cancelInvoice
    ? `Invoice ${invoice.invoice_no || invoice.invoiceNo || invoice.id} cancelled. Paid amount for this order was reversed.`
    : `Cancelled order ${orderId} removed from invoice ${invoice.invoice_no || invoice.invoiceNo || invoice.id}. Paid amount for this order was reversed.`;
  return {
    action,
    cancelInvoice,
    reversePaid: cancelInvoice ? prevPaid : reversePaid,
    creditExtra,
    orderIds: nextIds,
    items: nextItems,
    subtotal: nextSub,
    total: nextTotal,
    paid: nextPaid,
    status,
    notes: appendCancelNote(invoice.notes, orderId, cancelInvoice),
    message,
    invoiceNo: invoice.invoice_no || invoice.invoiceNo || invoice.id || '',
  };
}

module.exports = {
  orderKeys,
  invoiceHoldsOrder,
  amountToReverse,
  stripCancelledOrderItems,
  remainingOrderIds,
  planInvoiceAfterOrderCancel,
};
