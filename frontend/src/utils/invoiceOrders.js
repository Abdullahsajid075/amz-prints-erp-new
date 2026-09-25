import { invoiceBalanceDue, invoiceLineItems, invoiceOrderIds } from '@/utils/helpers';

export function orderRef(order) {
  return String(order?.orderId || order?.id || '').trim();
}

export function linesFromOrder(order) {
  const products = Array.isArray(order?.products) ? order.products : [];
  const oid = orderRef(order);
  return products.map((p) => {
    const service = String(p.productType || '').toLowerCase() === 'service';
    const lineNote = p.description || p.notes || '';
    return {
      productId: p.productId || '',
      name: p.name || '',
      quantity: service ? 1 : (Number(p.quantity) || 1),
      rate: Number(p.rate) || 0,
      size: service ? '' : (p.size || ''),
      material: service ? '' : (p.material || ''),
      description: lineNote,
      notes: lineNote,
      productType: service ? 'Service' : 'Product',
      sourceOrderId: oid,
    };
  });
}

export function isOpenInvoice(invoice) {
  return invoiceBalanceDue(invoice) > 0.009;
}

export function openInvoicesForCustomer(invoices, customer) {
  const cid = String(customer?.customerId || customer?.id || '');
  const phone = String(customer?.customerPhone || customer?.phone || '').replace(/\D/g, '').slice(-10);
  return (Array.isArray(invoices) ? invoices : []).filter((inv) => {
    if (!isOpenInvoice(inv)) return false;
    if (cid && String(inv.customerId || '') === cid) return true;
    const invPhone = String(inv.customerPhone || '').replace(/\D/g, '').slice(-10);
    return !!(phone && invPhone && phone === invPhone);
  });
}

export function mergeInvoicePayload(target, extras = []) {
  const rows = [target, ...extras].filter(Boolean);
  const orderIds = [];
  const items = [];
  rows.forEach((inv) => {
    invoiceOrderIds(inv).forEach((id) => {
      if (id && !orderIds.includes(id)) orderIds.push(id);
    });
    invoiceLineItems(inv).forEach((line) => items.push({ ...line }));
  });
  const subtotal = rows.reduce((s, inv) => s + (Number(inv.subtotal ?? inv.totalAmount ?? inv.total) || 0), 0);
  const totalAmount = rows.reduce((s, inv) => s + (Number(inv.totalAmount ?? inv.total) || 0), 0);
  const paidAmount = rows.reduce((s, inv) => s + (Number(inv.paidAmount ?? inv.paid) || 0), 0);
  const previousBalance = Number(target?.previousBalance ?? target?.previousbalance ?? 0) || 0;
  const sourceNos = extras.map((inv) => inv.invoiceNumber || inv.invoiceNo || inv.id).filter(Boolean);
  return {
    ...target,
    orderId: orderIds[0] || target.orderId || '',
    orderIds,
    items,
    subtotal,
    totalAmount,
    paidAmount,
    previousBalance,
    notes: `${target.notes || ''}${sourceNos.length ? ` | Combined ${sourceNos.join(', ')}` : ''}`.trim(),
  };
}

export function appendOrderToInvoicePayload(invoice, order) {
  const oid = orderRef(order);
  const orderIds = invoiceOrderIds(invoice);
  if (oid && !orderIds.includes(oid) && !orderIds.includes(String(order.id || ''))) {
    orderIds.push(oid);
  }
  const existing = invoiceLineItems(invoice);
  const incoming = linesFromOrder(order);
  const items = existing.length && incoming.length ? [...existing, ...incoming] : (incoming.length ? incoming : existing);
  const add = Number(order.totalAmount ?? order.total ?? 0) || incoming.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.rate) || 0), 0);
  return {
    ...invoice,
    orderId: orderIds[0] || invoice.orderId || oid,
    orderIds,
    items,
    subtotal: (Number(invoice.subtotal) || 0) + add,
    totalAmount: (Number(invoice.totalAmount ?? invoice.total) || 0) + add,
    paidAmount: Number(invoice.paidAmount ?? invoice.paid) || 0,
  };
}
