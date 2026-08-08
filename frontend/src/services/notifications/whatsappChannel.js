/**
 * WhatsApp channel — opens Desktop / Mobile app chat (not web.whatsapp.com).
 * Opens ONCE only (duplicate open was pasting the message twice).
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
 * @param {string} phone
 * @param {string} text
 * @param {{ pendingWindow?: Window|null }} [opts] — window opened during user click (survives async)
 */
export function openWhatsAppChat(phone, text, opts = {}) {
  const urls = buildWhatsAppAppUrl(phone, text);
  if (!urls) {
    if (opts.pendingWindow && !opts.pendingWindow.closed) {
      try { opts.pendingWindow.close(); } catch { /* ignore */ }
    }
    return { ok: false, reason: 'missing_phone' };
  }

  // Prefer pre-opened window (avoids popup blocker after await) — single navigation
  if (opts.pendingWindow && !opts.pendingWindow.closed) {
    try {
      opts.pendingWindow.location.href = urls.deepLink;
      return { ok: true, phone: urls.phone, channel: 'whatsapp' };
    } catch {
      /* fall through */
    }
  }

  // Single open only — do NOT also fire delayed second click (that duplicated message text)
  try {
    const opened = window.open(urls.deepLink, '_blank', 'noopener,noreferrer');
    if (opened) {
      return { ok: true, phone: urls.phone, channel: 'whatsapp' };
    }
  } catch {
    /* ignore */
  }

  // Fallback: one anchor click (same tab gesture path)
  try {
    const a = document.createElement('a');
    a.href = urls.deepLink;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    /* ignore */
  }

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
