/** Default order / invoice message templates (editable in Settings). */

export const DEFAULT_WHATSAPP_TEMPLATES = {
  created: `Dear {Customer Name},

Thank you for choosing {Company Name}.

Your order has been created successfully.

Order No: {Order Number}
Tracking No: {Tracking Number}

We will keep you updated.

Thank you.
{Company Name}`,

  Designing: `Dear {Customer Name},

Your order {Order Number} is now in Designing.

Tracking No: {Tracking Number}

{Company Name}`,

  'Proof Approval': `Dear {Customer Name},

Your design has been completed and is ready for approval.

Order No: {Order Number}
Tracking No: {Tracking Number}

{Company Name}`,

  Printing: `Dear {Customer Name},

Your order is now in production.

Order No: {Order Number}

{Company Name}`,

  Finishing: `Dear {Customer Name},

Your order {Order Number} is in Finishing.

{Company Name}`,

  Packing: `Dear {Customer Name},

Your order {Order Number} is being packed.

{Company Name}`,

  Ready: `Good news!

Your order is ready for collection.

Order No: {Order Number}
Tracking No: {Tracking Number}

{Company Name}`,

  Delivered: `Dear {Customer Name},

Your order has been delivered successfully.

Order No: {Order Number}

Thank you for choosing {Company Name}.`,

  Cancelled: `Dear {Customer Name},

Your order {Order Number} has been cancelled.

Please contact us if you have questions.

{Company Name}`,

  status: `Dear {Customer Name},

Your order {Order Number} status is now: {Status}.

Tracking No: {Tracking Number}

{Company Name}`,

  invoice: `Dear {Customer Name},

Your invoice {Invoice Number} has been generated.

Total: {Amount}
Order No: {Order Number}

Thank you.
{Company Name}`,
};

export const DEFAULT_EMAIL_SUBJECTS = {
  created: 'Order Confirmed — {Order Number} | {Company Name}',
  status: 'Order Update — {Order Number} is now {Status}',
  Ready: 'Ready for Collection — {Order Number}',
  Delivered: 'Delivered — {Order Number} | {Company Name}',
  invoice: 'Invoice {Invoice Number} | {Company Name}',
};

export function fillTemplate(template, vars = {}) {
  let out = String(template || '');
  Object.entries(vars).forEach(([key, value]) => {
    const re = new RegExp(`\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'gi');
    out = out.replace(re, value == null ? '' : String(value));
  });
  return out.trim();
}

export function buildTemplateVars(order = {}, company = {}, extras = {}) {
  return {
    'Customer Name': order.customerName || extras.customerName || 'Customer',
    'Order Number': order.orderId || order.id || '',
    'Tracking Number': order.trackingNumber || '',
    Status: order.status || extras.status || '',
    'Company Name': company.name || 'AMZ Prints',
    'Company Phone': company.phone || '',
    'Company Email': company.email || '',
    'Invoice Number': extras.invoiceNumber || '',
    Amount: extras.amount != null ? String(extras.amount) : '',
    ...extras,
  };
}

export function resolveWhatsAppTemplate(templates, event, status) {
  const t = templates || DEFAULT_WHATSAPP_TEMPLATES;
  if (event === 'created') return t.created || DEFAULT_WHATSAPP_TEMPLATES.created;
  if (event === 'invoice') return t.invoice || DEFAULT_WHATSAPP_TEMPLATES.invoice;
  if (status && t[status]) return t[status];
  return t.status || DEFAULT_WHATSAPP_TEMPLATES.status;
}
