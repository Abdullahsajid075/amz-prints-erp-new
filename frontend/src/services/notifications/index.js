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

function mergeNotificationSettings(raw = {}) {
  return {
    whatsappEnabled: truthy(raw.whatsappEnabled, true),
    emailNewOrder: truthy(raw.emailNewOrder, true),
    emailOrderStatus: truthy(raw.emailOrderStatus, true),
    emailInvoice: truthy(raw.emailInvoice, true),
    emailReady: truthy(raw.emailReady, true),
    emailDelivered: truthy(raw.emailDelivered, true),
    smsEnabled: truthy(raw.smsEnabled, false),
    autoOpenWhatsApp: truthy(raw.autoOpenWhatsApp, true),
    whatsappTemplates: { ...DEFAULT_WHATSAPP_TEMPLATES, ...(raw.whatsappTemplates || {}) },
    emailSubjects: { ...DEFAULT_EMAIL_SUBJECTS, ...(raw.emailSubjects || {}) },
  };
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
  if (event === 'payment_received' || event === 'payment_sent') return false;
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

  const vars = buildTemplateVars(order || {}, company, {
    status,
    customerName: order?.customerName || customer?.name || invoice?.customerName || payment?.party,
    invoice_number: invoice?.invoiceNumber || invoice?.invoiceNo || payment?.reference || '',
    invoice_date: invoice?.date || invoice?.invoiceDate || '',
    invoice_url: invoice?.shareToken
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invoice/${invoice.shareToken}`
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
    (event === 'invoice' || event === 'invoice_generated' || event === 'payment_reminder' || event === 'reminder')
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
    const text = fillTemplate(template, vars);
    whatsappResult = openWhatsAppChat(phone, text);
    channelIds.push('whatsapp');
    payloadBase.text = text;
  }

  const emailTo = order?.customerEmail || customer?.email || invoice?.customerEmail || payment?.partyEmail;
  if (
    emailTo
    && customerAllows(customer, 'email')
    && shouldSendEmail(notifications, event, status)
  ) {
    const subjectKey = event === 'created'
      ? 'created'
      : (event === 'invoice' || event === 'invoice_generated')
        ? 'invoice_generated'
        : event === 'quotation'
          ? 'quotation'
          : (status === 'Ready' || status === 'Delivered' || status === 'Order Received' ? status : 'status');
    const subjectTpl = notifications.emailSubjects[subjectKey]
      || DEFAULT_EMAIL_SUBJECTS[subjectKey]
      || DEFAULT_EMAIL_SUBJECTS.status;
    payloadBase.subject = fillTemplate(subjectTpl, vars);
    payloadBase.to = emailTo;
    payloadBase.message = fillTemplate(
      resolveWhatsAppTemplate(notifications.whatsappTemplates, event, status),
      vars
    );
    channelIds.push('email');
  }

  const results = await sendViaChannels(
    channelIds.filter((id) => id !== 'whatsapp'),
    payloadBase
  );
  if (whatsappResult) results.whatsapp = whatsappResult;

  return { ok: true, results, event, status, whatsappOpened: !!whatsappResult?.ok };
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
      totalAmount: total || received,
      balanceAmount: balance,
    },
    openWhatsApp: options.openWhatsApp !== false,
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
