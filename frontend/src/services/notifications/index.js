/**
 * Order / invoice notification orchestrator.
 * Channels: whatsapp (client app), email (GAS). Ready for sms / push later.
 */

import './whatsappChannel';
import './emailChannel';
import { sendViaChannels, listChannels } from './channels';
import {
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_EMAIL_SUBJECTS,
  fillTemplate,
  buildTemplateVars,
  resolveWhatsAppTemplate,
} from './templates';
import { openWhatsAppChat } from './whatsappChannel';
import { settingsAPI } from '../api';

export {
  listChannels,
  fillTemplate,
  buildTemplateVars,
  resolveWhatsAppTemplate,
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_EMAIL_SUBJECTS,
};
export { openWhatsAppChat, buildWhatsAppAppUrl, normalizeWhatsAppPhone } from './whatsappChannel';
export { sendTestEmail } from './emailChannel';
export { printPaymentSlip } from './paymentSlip';

function truthy(v, fallback = true) {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (['0', 'false', 'no', 'off', 'n'].includes(s)) return false;
  return true;
}

/** ERP outbound mailbox — Apps Script must be deployed as this Google account. */
export const NOTIFY_FROM_EMAIL = 'amazonprinting@gmail.com';

function mergeNotificationSettings(raw = {}) {
  return {
    whatsappEnabled: truthy(raw.whatsappEnabled, true),
    emailNewOrder: truthy(raw.emailNewOrder, true),
    emailOrderStatus: truthy(raw.emailOrderStatus, true),
    emailInvoice: truthy(raw.emailInvoice, true),
    emailReady: truthy(raw.emailReady, true),
    emailDelivered: truthy(raw.emailDelivered, true),
    emailPayment: truthy(raw.emailPayment, true),
    emailToken: truthy(raw.emailToken, true),
    dailyRemindersEnabled: truthy(raw.dailyRemindersEnabled, true),
    emailPaymentReminder: truthy(raw.emailPaymentReminder, true),
    emailOrderStatusReminder: truthy(raw.emailOrderStatusReminder, true),
    dailyReminderHour: Number(raw.dailyReminderHour) || 9,
    smsEnabled: truthy(raw.smsEnabled, false),
    autoOpenWhatsApp: truthy(raw.autoOpenWhatsApp, true),
    whatsappTemplates: raw.whatsappTemplates && typeof raw.whatsappTemplates === 'object' ? raw.whatsappTemplates : {},
    emailSubjects: raw.emailSubjects && typeof raw.emailSubjects === 'object' ? raw.emailSubjects : {},
  };
}

export function isValidNotifyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

async function loadNotificationSettings() {
  try {
    const res = await settingsAPI.get();
    const data = res.data || {};
    const company = typeof data.company === 'object' ? data.company : {};
    if (data.companyLogo && !company.logo) company.logo = data.companyLogo;
    return {
      company,
      notifications: mergeNotificationSettings(
        typeof data.notifications === 'object' ? data.notifications : {}
      ),
    };
  } catch {
    return {
      company: { name: 'AMZ Prints' },
      notifications: mergeNotificationSettings({}),
    };
  }
}

function customerAllows(customer, channel) {
  if (!customer) return true;
  if (channel === 'whatsapp') return truthy(customer.notifyWhatsApp ?? customer.notifywhatsapp, true);
  if (channel === 'email') return truthy(customer.notifyEmail ?? customer.notifyemail, true);
  return true;
}

function shouldSendEmail(notifications, event, status) {
  if (event === 'quotation') return true;
  if (event === 'created') return notifications.emailNewOrder;
  if (event === 'invoice' || event === 'invoice_generated') return notifications.emailInvoice;
  if (event === 'payment_received' || event === 'payment_sent' || event === 'payment') {
    return notifications.emailPayment !== false;
  }
  if (event === 'payment_reminder' || event === 'balance_reminder') {
    return notifications.emailPaymentReminder !== false && notifications.emailPayment !== false;
  }
  if (event === 'token_booked' || event === 'token_called' || event === 'token') {
    return notifications.emailToken !== false;
  }
  if (event === 'status') {
    if (status === 'Ready') return notifications.emailReady !== false && notifications.emailOrderStatus;
    if (status === 'Delivered') return notifications.emailDelivered !== false && notifications.emailOrderStatus;
    return notifications.emailOrderStatus;
  }
  return notifications.emailOrderStatus;
}

/**
 * After order create/update — open WhatsApp app + request email via GAS.
 * @param {'created'|'status'|'updated'|'invoice'|'invoice_generated'|'quotation'|'payment_received'|'payment_sent'} event
 */
export async function notifyOrderEvent({
  event = 'status',
  order,
  previousStatus,
  customer,
  invoice,
  payment,
  company: companyOverride,
  notifications: notifOverride,
  openWhatsApp = true,
  pendingWindow = null,
  sendEmail = true,
} = {}) {
  if (!order && !invoice && !payment) return { ok: false, reason: 'no_payload' };

  const loaded = (!companyOverride || !notifOverride)
    ? await loadNotificationSettings()
    : { company: companyOverride, notifications: mergeNotificationSettings(notifOverride) };

  const company = companyOverride || loaded.company || {};
  if (!company.name) company.name = 'Amazon Printing Services';
  if (!company.address) company.address = 'King Road, Mandi Bahauddin';
  if (!company.website) company.website = 'amzprints.com';

  const notifications = notifOverride
    ? mergeNotificationSettings(notifOverride)
    : loaded.notifications;

  const status = order?.status || '';
  const phone = order?.customerPhone
    || customer?.phone
    || invoice?.customerPhone
    || payment?.partyPhone
    || payment?.phone
    || '';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://erp.amzprints.com';
  const trackingNumber = order?.trackingNumber || '';
  const trackUrl = trackingNumber ? `${origin}/track/${encodeURIComponent(trackingNumber)}` : '';
  const vars = buildTemplateVars(order || {}, company, {
    status,
    customerName: order?.customerName || customer?.name || invoice?.customerName || payment?.party,
    trackUrl,
    TrackUrl: trackUrl,
    trackingNumber,
    invoice_number: invoice?.invoiceNumber || invoice?.invoiceNo || payment?.reference || '',
    invoice_date: invoice?.date || invoice?.invoiceDate || '',
    invoice_url: invoice?.shareToken
      ? `${origin}/invoice/${invoice.shareToken}`
      : (invoice?.invoiceUrl || ''),
    amount: invoice?.totalAmount ?? invoice?.total ?? order?.totalAmount ?? payment?.amount,
    paidAmount: invoice?.paidAmount ?? payment?.amount ?? 0,
    payment_amount: payment?.amount != null ? payment.amount : (invoice?.paidAmount ?? 0),
    balance_due: invoice?.balanceAmount ?? invoice?.balance
      ?? (invoice?.totalAmount != null
        ? Math.max(0, Number(invoice.totalAmount || 0) + Number(invoice.previousBalance || 0) - Number(invoice.paidAmount || 0))
        : null)
      ?? order?.balanceAmount ?? payment?.balanceDue ?? 0,
    payment_method: payment?.method || '',
    payment_type: payment?.type === 'outflow' ? 'Cash Out' : (payment?.type === 'inflow' ? 'Cash In' : (payment?.category || '')),
    transaction_number: payment?.reference || payment?.id || '',
  });

  // Ensure invoice link appears for invoice / reminder messages
  if (
    (event === 'invoice' || event === 'invoice_generated' || event === 'payment_reminder' || event === 'balance_reminder' || event === 'reminder')
    && vars.invoice_url
    && !String(vars.invoice_url).includes('undefined')
  ) {
    /* vars already set */
  }

  const channelIds = [];
  const payloadBase = { event, order, invoice, payment, company, customer, vars };

  let whatsappResult = null;
  if (
    openWhatsApp
    && notifications.whatsappEnabled
    && notifications.autoOpenWhatsApp
    && customerAllows(customer, 'whatsapp')
    && phone
  ) {
    const template = resolveWhatsAppTemplate(notifications.whatsappTemplates, event, status);
    const text = String(template || '').trim() ? fillTemplate(template, vars) : '';
    if (text) {
      whatsappResult = openWhatsAppChat(phone, text, { pendingWindow });
      channelIds.push('whatsapp');
      payloadBase.text = text;
    } else if (pendingWindow && !pendingWindow.closed) {
      try { pendingWindow.close(); } catch { /* ignore */ }
    }
  } else if (pendingWindow && !pendingWindow.closed) {
    try { pendingWindow.close(); } catch { /* ignore */ }
  }

  const emailTo = order?.customerEmail
    || customer?.email
    || invoice?.customerEmail
    || payment?.partyEmail
    || payment?.email
    || '';
  let emailSkipped = null;
  if (sendEmail && customerAllows(customer, 'email') && shouldSendEmail(notifications, event, status)) {
    if (!isValidNotifyEmail(emailTo)) {
      emailSkipped = { ok: false, reason: 'missing_email', error: 'Customer email is required for email notifications' };
    } else {
      const subjectKey = event === 'created'
        ? 'created'
        : (event === 'invoice' || event === 'invoice_generated')
          ? 'invoice_generated'
          : event === 'payment_reminder' || event === 'balance_reminder'
            ? event
          : event === 'quotation'
            ? 'quotation'
            : (event === 'payment_received' || event === 'payment_sent'
              ? event
              : (event === 'token_booked' || event === 'token_called'
                ? event
                : (status === 'Ready' || status === 'Delivered' || status === 'Order Received' ? status : 'status')));
      const subjectTpl = notifications.emailSubjects[subjectKey]
        || DEFAULT_EMAIL_SUBJECTS[subjectKey]
        || DEFAULT_EMAIL_SUBJECTS.status;
      payloadBase.subject = fillTemplate(subjectTpl, vars);
      payloadBase.to = String(emailTo).trim();
      const bodyTpl = resolveWhatsAppTemplate(notifications.whatsappTemplates, event, status);
      payloadBase.message = String(bodyTpl || '').trim()
        ? fillTemplate(bodyTpl, vars)
        : fillTemplate(`Dear {CustomerName},\n\nUpdate for order #{OrderNo}.`, vars);
      payloadBase.replyTo = NOTIFY_FROM_EMAIL;
      channelIds.push('email');
    }
  }

  const results = await sendViaChannels(
    channelIds.filter((id) => id !== 'whatsapp'),
    payloadBase
  );
  if (whatsappResult) results.whatsapp = whatsappResult;
  if (emailSkipped) results.email = emailSkipped;

  const rawEmailErr = results.email?.ok === false
    ? (results.email.error || results.email.reason || '')
    : '';
  const emailError = rawEmailErr
    ? (/permission|authorization|required permissions|oauth/i.test(rawEmailErr)
      ? 'Email not authorized. Open Apps Script as amazonprinting@gmail.com → Allow Mail → Deploy → New version.'
      : (rawEmailErr.length > 160 ? `${rawEmailErr.slice(0, 160)}…` : rawEmailErr))
    : null;

  return {
    ok: true,
    results,
    event,
    status,
    whatsappOpened: !!whatsappResult?.ok,
    emailSent: !!(results.email?.ok),
    emailError,
  };
}

export async function notifyBalanceReminder(customer, ledger, options = {}) {
  if (!customer || !(Number(ledger?.outstanding) > 0)) {
    return { ok: false, reason: 'no_balance' };
  }
  const openInvoice = (ledger.invoices || []).find((inv) => {
    const bal = Math.max(0, Number(inv.totalAmount || 0) + Number(inv.previousBalance || 0) - Number(inv.paidAmount || 0));
    return bal > 0;
  });
  const linkedOrder = ledger.orders?.[0];
  return notifyOrderEvent({
    event: 'balance_reminder',
    customer,
    order: {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      orderId: openInvoice?.orderId || linkedOrder?.orderId || linkedOrder?.id || '',
      totalAmount: ledger.outstanding,
      balanceAmount: ledger.outstanding,
    },
    invoice: openInvoice ? {
      ...openInvoice,
      balanceAmount: ledger.outstanding,
      balance: ledger.outstanding,
    } : {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      totalAmount: ledger.outstanding,
      balanceAmount: ledger.outstanding,
      balance: ledger.outstanding,
    },
    openWhatsApp: options.openWhatsApp !== false,
    sendEmail: options.sendEmail !== false,
  });
}

/** Notify + helpers for Cash In / Cash Out. */
export async function notifyPaymentEvent(payment, options = {}) {
  const event = String(payment?.type || '').toLowerCase() === 'outflow'
    ? 'payment_sent'
    : 'payment_received';
  const total = Number(payment?.totalAmount || payment?.total || 0);
  const received = Number(payment?.amount || 0);
  const balance = payment?.balanceDue != null
    ? Number(payment.balanceDue)
    : (total > 0 ? Math.max(0, total - received) : 0);

  return notifyOrderEvent({
    event,
    payment: {
      ...payment,
      amount: received,
      balanceDue: balance,
    },
    order: {
      customerName: payment?.party || payment?.customerName,
      customerPhone: payment?.partyPhone || payment?.phone,
      customerEmail: payment?.partyEmail || payment?.email || payment?.customerEmail || '',
      totalAmount: total || received,
      balanceAmount: balance,
    },
    openWhatsApp: options.openWhatsApp !== false,
    pendingWindow: options.pendingWindow || null,
    sendEmail: options.sendEmail !== false,
  });
}

/** Token booked / called email (+ optional WhatsApp). */
export async function notifyTokenEvent(token, options = {}) {
  const event = options.event || 'token_booked';
  const tokenNo = token?.tokenNo || token?.tokenno || '';
  return notifyOrderEvent({
    event,
    order: {
      customerName: token?.customerName,
      customerPhone: token?.customerPhone,
      customerEmail: token?.customerEmail || token?.email || '',
      orderId: tokenNo,
      status: token?.status || (event === 'token_called' ? 'Called' : 'Waiting'),
      totalAmount: 0,
    },
    openWhatsApp: options.openWhatsApp === true,
    pendingWindow: options.pendingWindow || null,
    sendEmail: options.sendEmail !== false,
  });
}

/**
 * Use payload returned from GAS order APIs (_notifications.whatsapp).
 */
export function applyServerNotificationHint(data) {
  const hint = data?._notifications || data?.notifications;
  if (!hint?.whatsapp?.phone || !hint?.whatsapp?.text) return null;
  return openWhatsAppChat(hint.whatsapp.phone, hint.whatsapp.text);
}
