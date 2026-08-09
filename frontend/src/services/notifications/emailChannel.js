/**
 * Email channel — sends via Google Apps Script (MailApp / GmailApp).
 * Outbound mailbox: amazonprinting@gmail.com (script must be deployed as that account).
 */

import { registerChannel } from './channels';
import { gasRequest, withToken } from '../gasClient';

const FROM_HINT = 'amazonprinting@gmail.com';

const emailChannel = {
  id: 'email',
  label: 'Email',
  async send(payload) {
    const to = payload.to
      || payload.order?.customerEmail
      || payload.invoice?.customerEmail
      || payload.payment?.partyEmail;
    if (!to) return { ok: false, reason: 'missing_email', error: 'Customer email is required for email notifications' };
    try {
      const res = await gasRequest('POST', '/notifications/email', withToken({
        data: {
          to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text || payload.message,
          event: payload.event,
          order: payload.order,
          invoice: payload.invoice,
          payment: payload.payment,
          replyTo: payload.replyTo || FROM_HINT,
        },
      }));
      const data = res.data || {};
      if (data.ok === false || data.error) {
        const raw = String(data.error || data.hint || data.reason || 'Email send failed');
        const error = /permission|authorization|required permissions|oauth/i.test(raw)
          ? `Email not authorized. Open Apps Script as ${FROM_HINT} → Allow Mail → Deploy → New version.`
          : (raw.length > 160 ? `${raw.slice(0, 160)}…` : raw);
        return {
          ok: false,
          error,
          reason: data.reason,
          hint: data.hint,
        };
      }
      // Hostinger stub returns "queued" without sending — surface clearly
      if (data.message && /queued/i.test(String(data.message)) && data.ok !== true && !data.to) {
        return { ok: false, reason: 'backend_stub', message: data.message };
      }
      return { ok: true, from: FROM_HINT, ...(data) };
    } catch (err) {
      const raw = String(err?.response?.data?.message || err?.message || 'Email request failed');
      return {
        ok: false,
        error: /permission|authorization|required permissions|oauth/i.test(raw)
          ? `Email not authorized. Open Apps Script as ${FROM_HINT} → Allow Mail → Deploy → New version.`
          : (raw.length > 160 ? `${raw.slice(0, 160)}…` : raw),
      };
    }
  },
};

registerChannel(emailChannel);

export async function sendTestEmail(to) {
  return gasRequest('POST', '/notifications/test', withToken({
    data: { channel: 'email', to },
  }));
}

export default emailChannel;
