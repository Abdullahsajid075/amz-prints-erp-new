/**
 * Email channel — sends via Google Apps Script (MailApp / GmailApp).
 * Modular: SMS/Push can mirror this pattern later.
 */

import { registerChannel } from './channels';
import { gasRequest, withToken } from '../gasClient';

const emailChannel = {
  id: 'email',
  label: 'Email',
  async send(payload) {
    const res = await gasRequest('POST', '/notifications/email', withToken({
      data: {
        to: payload.to || payload.order?.customerEmail,
        subject: payload.subject,
        html: payload.html,
        text: payload.text || payload.message,
        event: payload.event,
        order: payload.order,
        invoice: payload.invoice,
      },
    }));
    return { ok: true, ...(res.data || {}) };
  },
};

registerChannel(emailChannel);

export async function sendTestEmail(to) {
  return gasRequest('POST', '/notifications/test', withToken({
    data: { channel: 'email', to },
  }));
}

export default emailChannel;
