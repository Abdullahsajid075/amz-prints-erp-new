/** Default WhatsApp / email templates — Amazon Printing Services. */

const FOOTER = `*Amazon Printing Services*
📍 King Road, Mandi Bahauddin
🌐 amzprints.com`;

export const DEFAULT_WHATSAPP_TEMPLATES = {
  quotation: `Dear *{CustomerName}*,

Thank you for considering *Amazon Printing Services*.

Your quotation *#{OrderNo}* is ready.
Total: *{Amount}*

We look forward to your confirmation.

${FOOTER}`,

  created: `Dear *{CustomerName}*,

Thank you for choosing *Amazon Printing Services*.

Your order *#{OrderNo}* has been successfully received and is now being processed. We will keep you updated at every stage until completion.

Thank you for your trust!

📍 King Road, Mandi Bahauddin
🌐 amzprints.com`,

  'Order Received': `Dear *{CustomerName}*,

Thank you for choosing *Amazon Printing Services*.

Your order *#{OrderNo}* has been successfully received and is now being processed. We will keep you updated at every stage until completion.

Thank you for your trust!

📍 King Road, Mandi Bahauddin
🌐 amzprints.com`,

  Designing: `Dear *{CustomerName}*,

Your order *#{OrderNo}* is now in the *Designing* stage.

Our creative team is preparing your artwork with great care. We'll notify you once the design is ready for your review.

Thank you for your patience.

${FOOTER}`,

  'Proof Approval': `Dear *{CustomerName}*,

The design proof for your order *#{OrderNo}* is now ready.

Please review and approve the artwork so we can begin printing. Production will start after your confirmation.

Thank you!

${FOOTER}`,

  Printing: `Dear *{CustomerName}*,

Great news!

Your order *#{OrderNo}* has been approved and is now in the *Printing* stage.

We're producing your order with the highest quality standards.

Thank you for your patience.

${FOOTER}`,

  Finishing: `Dear *{CustomerName}*,

Your order *#{OrderNo}* has been successfully printed and is now in the *Finishing* stage.

Our team is completing the final touches and quality inspection to ensure the best results.

We'll update you again soon.

${FOOTER}`,

  Packing: `Dear *{CustomerName}*,

Your order *#{OrderNo}* has been completed and is now being carefully packed.

It will soon be ready for pickup or delivery.

Thank you for choosing us!

${FOOTER}`,

  Ready: `Dear {CustomerName},
Your order #{OrderNo} is ready for pickup/delivery.

Please visit our office to receive your Order

*( Paid Home Delivery Available )*

Thank you for choosing Amazon Printing Services.

📍 King Road, Mandi Bahauddin
🌐 amzprints.com

Track your order : {TrackUrl}`,

  Delivered: `Dear *{CustomerName}*,

Your order *#{OrderNo}* has been *successfully delivered*.

Thank you for trusting *Amazon Printing Services*. We hope you're delighted with your order.

We look forward to serving you again!

📍 King Road, Mandi Bahauddin
🌐 amzprints.com`,

  Cancelled: `Dear *{CustomerName}*,

Your order *#{OrderNo}* has been *cancelled*.

If you believe this was a mistake or need further assistance, please don't hesitate to contact us.

Thank you for considering *Amazon Printing Services*.

📍 King Road, Mandi Bahauddin
🌐 amzprints.com`,

  status: `Dear *{CustomerName}*,

Your order *#{OrderNo}* status is now: *{Status}*.

Tracking No: {Tracking Number}

${FOOTER}`,

  invoice: `Dear *{CustomerName}*,

Your invoice *{invoice_number}* dated {invoice_date} is ready.

📄 *Invoice link (open / save PDF):*
{invoice_url}

*Payment summary*
Total: *{Amount}*
Paid: *{payment_amount}*
*Pending / Balance due: {balance_due}*

Please clear the pending amount at your earliest. Thank you for choosing *Amazon Printing Services*.

📍 King Road, Mandi Bahauddin
🌐 amzprints.com`,

  invoice_generated: `Dear *{CustomerName}*,

Your invoice *{invoice_number}* dated {invoice_date} is ready.

📄 *Invoice link (open / save PDF):*
{invoice_url}

*Payment summary*
Total: *{Amount}*
Paid: *{payment_amount}*
*Pending / Balance due: {balance_due}*

Please clear the pending amount at your earliest. Thank you for choosing *Amazon Printing Services*.

📍 King Road, Mandi Bahauddin
🌐 amzprints.com`,

  payment_reminder: `Dear *{CustomerName}*,

*Payment reminder* for invoice *{invoice_number}*.

📄 Invoice: {invoice_url}

Total: *{Amount}*
Paid: *{payment_amount}*
*Pending balance: {balance_due}*

Kindly arrange payment soon. Thank you — *Amazon Printing Services*.

📍 King Road, Mandi Bahauddin
🌐 amzprints.com`,

  balance_reminder: `Dear *{CustomerName}*,

This is a friendly reminder regarding your outstanding balance with *Amazon Printing Services*.

*Total outstanding: {balance_due}*

Please arrange payment at your earliest convenience. If you have already paid, kindly share the payment reference.

Thank you.

📍 King Road, Mandi Bahauddin
🌐 amzprints.com`,

  payment_received: `Dear *{CustomerName}*,

We have received your payment of *{payment_amount}*.

Total: *{Amount}*
Received: *{payment_amount}*
Balance due: *{balance_due}*
Method: {payment_method}
Ref: {transaction_number}

Thank you for your prompt payment.

*Amazon Printing Services*
📍 King Road, Mandi Bahauddin
🌐 amzprints.com`,

  payment_sent: `Dear *{CustomerName}*,

Payment transfer of *{payment_amount}* has been sent to you.

Method: {payment_method}
Reference: {transaction_number}
{payment_type}

Thank you for your partnership with *Amazon Printing Services*.

📍 King Road, Mandi Bahauddin
🌐 amzprints.com`,

  token_booked: `Dear *{CustomerName}*,

Your token *{OrderNo}* has been booked at Amazon Printing Services.

Please wait for your token to be called.

${FOOTER}`,

  token_called: `Dear *{CustomerName}*,

Your token *{OrderNo}* is now being called.

Please proceed to the counter.

${FOOTER}`,
};

export const DEFAULT_EMAIL_SUBJECTS = {
  quotation: 'Quotation {OrderNo} | Amazon Printing Services',
  created: 'Order Received — {OrderNo} | Amazon Printing Services',
  'Order Received': 'Order Received — {OrderNo} | Amazon Printing Services',
  status: 'Order Update — {OrderNo} is now {Status}',
  Ready: 'Ready for Collection — {OrderNo}',
  Delivered: 'Delivered — {OrderNo} | Amazon Printing Services',
  invoice: 'Invoice {invoice_number} | Amazon Printing Services',
  invoice_generated: 'Invoice {invoice_number} | Amazon Printing Services',
  payment_reminder: 'Payment Reminder — {invoice_number}',
  balance_reminder: 'Outstanding Balance — {CustomerName}',
  payment_received: 'Payment Received — {payment_amount} | Amazon Printing Services',
  payment_sent: 'Payment Sent — {payment_amount} | Amazon Printing Services',
  token_booked: 'Token Booked — {OrderNo} | Amazon Printing Services',
  token_called: 'Token Called — {OrderNo} | Amazon Printing Services',
};

export function fillTemplate(template, vars = {}) {
  let out = String(template || '');
  Object.entries(vars).forEach(([key, value]) => {
    const re = new RegExp(`\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'gi');
    out = out.replace(re, value == null ? '' : String(value));
  });
  return out.trim();
}

function money(v) {
  if (v == null || v === '') return '';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return `Rs ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function buildTemplateVars(order = {}, company = {}, extras = {}) {
  const customerName = order.customerName || extras.customerName || extras.CustomerName || 'Customer';
  const orderNo = order.orderId || order.id || extras.orderNo || extras.OrderNo || '';
  const companyName = company.name || 'Amazon Printing Services';
  const companyAddress = company.address || 'King Road, Mandi Bahauddin';
  const companyWebsite = company.website || 'amzprints.com';
  const invoiceNumber = extras.invoice_number || extras.invoiceNumber || extras['Invoice Number'] || '';
  const invoiceDate = extras.invoice_date || extras.invoiceDate || '';
  const invoiceUrl = extras.invoice_url || extras.invoiceUrl || extras['Invoice Link'] || '';
  const trackingNumber = order.trackingNumber || extras.trackingNumber || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://erp.amzprints.com';
  const trackUrl = extras.trackUrl
    || extras.TrackUrl
    || (trackingNumber ? `${origin}/track/${encodeURIComponent(trackingNumber)}` : '');
  const paymentAmount = extras.payment_amount != null
    ? extras.payment_amount
    : (extras.paidAmount != null ? extras.paidAmount
      : (extras.amount != null ? extras.amount : order.totalAmount));
  const balanceDue = extras.balance_due != null
    ? extras.balance_due
    : (extras.balanceDue != null ? extras.balanceDue : order.balanceAmount);
  const amountStr = money(extras.amount != null ? extras.amount : (order.totalAmount ?? paymentAmount));
  const paymentAmountStr = money(paymentAmount);
  const balanceDueStr = money(balanceDue);

  return {
    'Customer Name': customerName,
    CustomerName: customerName,
    'Order Number': orderNo,
    OrderNo: orderNo,
    'Tracking Number': trackingNumber,
    TrackUrl: trackUrl,
    'Track Url': trackUrl,
    trackUrl,
    Status: order.status || extras.status || '',
    'Company Name': companyName,
    CompanyName: companyName,
    'Company Address': companyAddress,
    'Company Website': companyWebsite,
    'Invoice Number': invoiceNumber,
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    invoice_url: invoiceUrl,
    'Invoice Link': invoiceUrl,
    Amount: amountStr,
    payment_amount: paymentAmountStr,
    payment_method: extras.payment_method || extras.paymentMethod || '',
    payment_type: extras.payment_type || extras.paymentType || '',
    balance_due: balanceDueStr,
    transaction_number: extras.transaction_number || extras.transactionNumber || extras.reference || '',
    ...extras,
    // Keep formatted money / track after extras spread
    Amount: amountStr,
    payment_amount: paymentAmountStr,
    balance_due: balanceDueStr,
    invoice_url: invoiceUrl || extras.invoice_url || '',
    'Invoice Link': invoiceUrl || extras.invoice_url || '',
    'Customer Name': customerName,
    CustomerName: customerName,
    'Order Number': orderNo,
    OrderNo: orderNo,
    'Company Name': companyName,
    TrackUrl: trackUrl || extras.TrackUrl || '',
    'Track Url': trackUrl || extras.TrackUrl || '',
    trackUrl: trackUrl || extras.trackUrl || '',
    'Tracking Number': trackingNumber,
  };
}

export function resolveWhatsAppTemplate(templates, event, status) {
  const t = templates || DEFAULT_WHATSAPP_TEMPLATES;
  if (event === 'quotation') return t.quotation || DEFAULT_WHATSAPP_TEMPLATES.quotation;
  if (event === 'created') {
    return t.created || t['Order Received'] || DEFAULT_WHATSAPP_TEMPLATES.created;
  }
  if (event === 'invoice' || event === 'invoice_generated') {
    return t.invoice_generated || t.invoice || DEFAULT_WHATSAPP_TEMPLATES.invoice_generated;
  }
  if (event === 'payment_reminder' || event === 'reminder') {
    return t.payment_reminder || DEFAULT_WHATSAPP_TEMPLATES.payment_reminder;
  }
  if (event === 'balance_reminder') {
    return t.balance_reminder || DEFAULT_WHATSAPP_TEMPLATES.balance_reminder;
  }
  if (event === 'payment_received') {
    return t.payment_received || DEFAULT_WHATSAPP_TEMPLATES.payment_received;
  }
  if (event === 'payment_sent') {
    return t.payment_sent || DEFAULT_WHATSAPP_TEMPLATES.payment_sent;
  }
  if (event === 'token_booked') {
    return t.token_booked || DEFAULT_WHATSAPP_TEMPLATES.token_booked;
  }
  if (event === 'token_called') {
    return t.token_called || DEFAULT_WHATSAPP_TEMPLATES.token_called;
  }
  // Prefer Settings templates (including Ready); fall back to defaults
  if (status && t[status]) return t[status];
  if (status === 'Ready') return DEFAULT_WHATSAPP_TEMPLATES.Ready;
  if (status === 'Order Received') {
    return t['Order Received'] || t.created || DEFAULT_WHATSAPP_TEMPLATES['Order Received'] || DEFAULT_WHATSAPP_TEMPLATES.created;
  }
  return t.status || DEFAULT_WHATSAPP_TEMPLATES.status;
}
