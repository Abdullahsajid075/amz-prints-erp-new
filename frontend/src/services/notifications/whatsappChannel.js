/**
 * WhatsApp channel — opens Desktop / Mobile app chat (not web.whatsapp.com).
 * Opens ONCE only (duplicate open was pasting the message twice).
 */

import { registerChannel } from './channels';

export function normalizeWhatsAppPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10) digits = `92${digits}`;
  else if (digits.startsWith('0') && digits.length === 11) digits = `92${digits.slice(1)}`;
  else if (digits.startsWith('920') && digits.length === 13) digits = `92${digits.slice(3)}`;
  return digits;
}

function clipWhatsAppText(text) {
  const raw = String(text || '');
  if (raw.length <= 1800) return raw;
  return `${raw.slice(0, 1750)}\n\n…(baqi ledger ERP mein dekhein)`;
}

/** Prefer native app; never send users to web.whatsapp.com */
export function buildWhatsAppAppUrl(phone, text) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  const q = encodeURIComponent(clipWhatsAppText(text));
  return {
    app: `whatsapp://send?phone=${normalized}&text=${q}`,
    deepLink: `https://api.whatsapp.com/send?phone=${normalized}&text=${q}`,
    waMe: `https://wa.me/${normalized}?text=${q}`,
    phone: normalized,
  };
}

/** Call synchronously inside a click handler so the tab survives later awaits. */
export function openBlankWhatsAppTab() {
  if (typeof window === 'undefined') return null;
  try {
    const w = window.open('about:blank', '_blank');
    if (w && !w.closed) return w;
  } catch {
    /* ignore */
  }
  return null;
}

function copyText(text) {
  try {
    if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(clipWhatsAppText(text));
  } catch {
    /* ignore */
  }
}

function navigateWindow(win, href) {
  if (!win || win.closed) return false;
  try {
    win.location.replace(href);
    try { win.focus(); } catch { /* ignore */ }
    return true;
  } catch {
    try {
      win.location.href = href;
      try { win.focus(); } catch { /* ignore */ }
      return true;
    } catch {
      return false;
    }
  }
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

  copyText(text);

  if (opts.pendingWindow && !opts.pendingWindow.closed) {
    if (navigateWindow(opts.pendingWindow, urls.deepLink) || navigateWindow(opts.pendingWindow, urls.waMe)) {
      return { ok: true, phone: urls.phone, channel: 'whatsapp' };
    }
  }

  try {
    const opened = window.open(urls.deepLink, '_blank');
    if (opened) {
      return { ok: true, phone: urls.phone, channel: 'whatsapp' };
    }
  } catch {
    /* ignore */
  }

  try {
    const opened = window.open(urls.waMe, '_blank');
    if (opened) {
      return { ok: true, phone: urls.phone, channel: 'whatsapp' };
    }
  } catch {
    /* ignore */
  }

  try {
    window.location.href = urls.deepLink;
    return { ok: true, phone: urls.phone, channel: 'whatsapp', weak: true };
  } catch {
    /* ignore */
  }

  return { ok: false, reason: 'popup_blocked', phone: urls.phone };
}

const whatsappChannel = {
  id: 'whatsapp',
  label: 'WhatsApp',
  async send(payload) {
    const phone = payload.phone || payload.order?.customerPhone;
    const text = payload.text || payload.message || '';
    if (!phone) return { ok: false, reason: 'missing_phone' };
    if (!text) return { ok: false, reason: 'missing_text' };
    return openWhatsAppChat(phone, text, { pendingWindow: payload.pendingWindow || null });
  },
};

registerChannel(whatsappChannel);

export default whatsappChannel;
