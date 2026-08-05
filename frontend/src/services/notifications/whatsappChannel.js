/**
 * WhatsApp channel — opens Desktop / Mobile app chat (not web.whatsapp.com).
 * Uses whatsapp:// protocol first, then api.whatsapp.com/send deep-link.
 */

import { registerChannel } from './channels';

export function normalizeWhatsAppPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) digits = `92${digits}`;
  else if (digits.startsWith('0') && digits.length === 11) digits = `92${digits.slice(1)}`;
  return digits;
}

/** Prefer native app; never send users to web.whatsapp.com */
export function buildWhatsAppAppUrl(phone, text) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  const q = encodeURIComponent(text || '');
  return {
    app: `whatsapp://send?phone=${normalized}&text=${q}`,
    deepLink: `https://api.whatsapp.com/send?phone=${normalized}&text=${q}`,
    phone: normalized,
  };
}

/**
 * Open customer chat in WhatsApp Desktop (if installed) or Mobile app.
 * User only needs to tap Send.
 */
export function openWhatsAppChat(phone, text) {
  const urls = buildWhatsAppAppUrl(phone, text);
  if (!urls) {
    return { ok: false, reason: 'missing_phone' };
  }

  // Native protocol — WhatsApp Desktop / Mobile
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = urls.app;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch { /* ignore */ }
    }, 1500);
  } catch {
    /* ignore */
  }

  // Deep-link fallback (opens app when installed; not web.whatsapp.com)
  setTimeout(() => {
    const a = document.createElement('a');
    a.href = urls.deepLink;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, 400);

  return { ok: true, phone: urls.phone, channel: 'whatsapp' };
}

const whatsappChannel = {
  id: 'whatsapp',
  label: 'WhatsApp',
  async send(payload) {
    const phone = payload.phone || payload.order?.customerPhone;
    const text = payload.text || payload.message || '';
    if (!phone) return { ok: false, reason: 'missing_phone' };
    if (!text) return { ok: false, reason: 'missing_text' };
    return openWhatsAppChat(phone, text);
  },
};

registerChannel(whatsappChannel);

export default whatsappChannel;
