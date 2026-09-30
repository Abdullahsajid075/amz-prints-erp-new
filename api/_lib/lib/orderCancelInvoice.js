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
  if (entry.reversal === true || entry.forfeit === true) return true;
  if (num(entry.applied) < 0) return true;
  return /revers|forfeit/i.test(String(entry.notes || entry.method || ''));
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

/** Paid amount on this invoice that belonged to the cancelled order. */
function amountToForfeit(invoice, order) {
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

function appendCancelNote(notes, orderId, deletedWhole) {
  const tag = deletedWhole
    ? `[ORDER_CANCELLED] Invoice deleted because order ${orderId} was cancelled. Advance was forfeited.`
    : `[ORDER_CANCELLED] Removed cancelled order ${orderId}. Advance was forfeited.`;
  const current = String(notes || '').trim();
  if (current.includes('[ORDER_CANCELLED]') && current.includes(String(orderId))) return current;
  return current ? `${current} ${tag}` : tag;
}

function appendForfeitOrderNote(notes, amount) {
  const n = num(amount);
  const tag = n > 0.009
    ? `[ADVANCE_FORFEITED] Advance of ${n} was forfeited when this order was cancelled.`
    : '[ORDER_CANCELLED] Linked invoice was deleted.';
  const current = String(notes || '').trim();
  if (current.includes('[ADVANCE_FORFEITED]') || current.includes('[ORDER_CANCELLED]')) return current || tag;
  return current ? `${current} ${tag}` : tag;
}

function remainingOrderIds(invoice, order) {
  const keys = orderKeys(order);
  return collectOrderIds({}, invoice).filter((id) => !keys.includes(String(id)));
}

function planInvoiceAfterOrderCancel(invoice, order) {
  if (!invoice || !order) {
    return { action: 'none', reversePaid: 0, forfeitPaid: 0, creditExtra: 0, deleteInvoice: false };
  }
  const orderId = order.order_id || order.orderId || order.id || '';
  const prevTotal = num(invoice.total != null ? invoice.total : invoice.total_amount);
  const prevSub = num(invoice.subtotal != null ? invoice.subtotal : prevTotal);
  const prevPaid = num(invoice.paid != null ? invoice.paid : invoice.paidAmount);
  const prevBal = num(invoice.previous_balance != null ? invoice.previous_balance : invoice.previousBalance);
  const orderTotal = num(order.total_amount != null ? order.total_amount : order.total);
  const nextIds = remainingOrderIds(invoice, order);
  const deleteInvoice = nextIds.length === 0;
  let forfeitPaid = amountToForfeit(invoice, order);
  const nextItems = deleteInvoice ? [] : stripCancelledOrderItems(asArray(invoice.items), order);
  const nextTotal = deleteInvoice ? 0 : Math.max(0, prevTotal - orderTotal);
  const nextSub = deleteInvoice ? 0 : Math.max(0, prevSub - orderTotal);
  let nextPaid = Math.max(0, prevPaid - forfeitPaid);
  const due = nextTotal + prevBal;
  if (deleteInvoice) {
    forfeitPaid = prevPaid;
    nextPaid = 0;
  } else if (nextPaid > due + 0.009) {
    forfeitPaid += nextPaid - due;
    nextPaid = due;
  }
  const status = deleteInvoice ? 'Cancelled' : invoiceStatusFromPaid(due, nextPaid);
  const action = deleteInvoice ? 'deleted-invoice' : 'removed-from-invoice';
  const invoiceNo = invoice.invoice_no || invoice.invoiceNo || invoice.id || '';
  const forfeitBit = forfeitPaid > 0.009 ? ' The advance payment was forfeited.' : '';
  const message = deleteInvoice
    ? `Invoice ${invoiceNo} was deleted.${forfeitBit}`
    : `Cancelled order ${orderId} was removed from invoice ${invoiceNo}.${forfeitBit}`;
  return {
    action,
    deleteInvoice,
    cancelInvoice: deleteInvoice,
    reversePaid: 0,
    forfeitPaid,
    creditExtra: 0,
    orderIds: nextIds,
    items: nextItems,
    subtotal: nextSub,
    total: nextTotal,
    paid: nextPaid,
    status,
    notes: appendCancelNote(invoice.notes, orderId, deleteInvoice),
    orderNotes: appendForfeitOrderNote(order.notes || order.remarks, forfeitPaid),
    message,
    invoiceNo,
  };
}

module.exports = {
  orderKeys,
  invoiceHoldsOrder,
  amountToForfeit,
  amountToReverse: amountToForfeit,
  stripCancelledOrderItems,
  remainingOrderIds,
  planInvoiceAfterOrderCancel,
  appendForfeitOrderNote,
};
