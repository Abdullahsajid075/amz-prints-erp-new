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
  if (event === 'created') return notifications.emailNewOrder;
  if (event === 'invoice') return notifications.emailInvoice;
  if (event === 'status') {
    if (status === 'Ready') return notifications.emailReady !== false && notifications.emailOrderStatus;
    if (status === 'Delivered') return notifications.emailDelivered !== false && notifications.emailOrderStatus;
    return notifications.emailOrderStatus;
  }
  return notifications.emailOrderStatus;
}

/**
 * After order create/update — open WhatsApp app + request email via GAS.
 * @param {'created'|'status'|'updated'|'invoice'} event
 */
export async function notifyOrderEvent({
  event = 'status',
  order,
  previousStatus,
  customer,
  invoice,
  company: companyOverride,
  notifications: notifOverride,
  openWhatsApp = true,
} = {}) {
  if (!order && !invoice) return { ok: false, reason: 'no_payload' };

  const loaded = (!companyOverride || !notifOverride)
    ? await loadNotificationSettings()
    : { company: companyOverride, notifications: mergeNotificationSettings(notifOverride) };

  const company = companyOverride || loaded.company || {};
  const notifications = notifOverride
    ? mergeNotificationSettings(notifOverride)
    : loaded.notifications;

  const status = order?.status || '';
  const vars = buildTemplateVars(order || {}, company, {
    status,
    invoiceNumber: invoice?.invoiceNumber || invoice?.invoiceNo || '',
    amount: invoice?.totalAmount ?? invoice?.total ?? order?.totalAmount,
  });

  const channelIds = [];
  const payloadBase = { event, order, invoice, company, customer, vars };

  // WhatsApp (client opens Desktop/Mobile app)
  let whatsappResult = null;
  if (
    openWhatsApp
    && notifications.whatsappEnabled
    && notifications.autoOpenWhatsApp
    && customerAllows(customer, 'whatsapp')
    && (order?.customerPhone || customer?.phone)
  ) {
    const template = resolveWhatsAppTemplate(notifications.whatsappTemplates, event, status);
    const text = fillTemplate(template, vars);
    whatsappResult = openWhatsAppChat(order?.customerPhone || customer?.phone, text);
    channelIds.push('whatsapp');
    payloadBase.text = text;
  }

  // Email (GAS)
  const emailTo = order?.customerEmail || customer?.email || invoice?.customerEmail;
  if (
    emailTo
    && customerAllows(customer, 'email')
    && shouldSendEmail(notifications, event, status)
  ) {
    const subjectKey = event === 'created'
      ? 'created'
      : event === 'invoice'
        ? 'invoice'
        : (status === 'Ready' || status === 'Delivered' ? status : 'status');
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

  return { ok: true, results, event, status };
}

/**
 * Use payload returned from GAS order APIs (_notifications.whatsapp).
 */
export function applyServerNotificationHint(data) {
  const hint = data?._notifications || data?.notifications;
  if (!hint?.whatsapp?.phone || !hint?.whatsapp?.text) return null;
  return openWhatsAppChat(hint.whatsapp.phone, hint.whatsapp.text);
}
