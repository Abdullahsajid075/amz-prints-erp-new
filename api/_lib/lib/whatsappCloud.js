const GRAPH = 'https://graph.facebook.com/v21.0';

function digitsPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10) digits = `92${digits}`;
  else if (digits.startsWith('0') && digits.length === 11) digits = `92${digits.slice(1)}`;
  return digits;
}

function cloudConfigured() {
  return Boolean(
    (process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_CLOUD_TOKEN)
    && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

function parseDataUrl(dataUrl) {
  const raw = String(dataUrl || '').trim();
  const m = raw.match(/^data:(image\/(?:jpeg|jpg|png));base64,(.+)$/i);
  if (!m) return null;
  const mime = m[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : m[1].toLowerCase();
  return { mime, buffer: Buffer.from(m[2], 'base64') };
}

async function uploadMedia(token, phoneId, parsed) {
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', parsed.mime);
  form.append('file', new Blob([parsed.buffer], { type: parsed.mime }), parsed.mime === 'image/png' ? 'ad.png' : 'ad.jpg');
  const res = await fetch(`${GRAPH}/${phoneId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.id) {
    throw new Error(json.error?.message || 'WhatsApp media upload failed');
  }
  return json.id;
}

/**
 * Official Cloud API send. Only reports imageSent when Graph accepts the media.
 */
async function sendWhatsAppCloud({ phone, text, imageDataUrl }) {
  const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    return { ok: false, imageSent: false, reason: 'not_configured' };
  }
  const to = digitsPhone(phone);
  if (!to) return { ok: false, imageSent: false, reason: 'missing_phone' };

  try {
    const parsed = parseDataUrl(imageDataUrl);
    let payload;
    if (parsed) {
      const mediaId = await uploadMedia(token, phoneId, parsed);
      payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: { id: mediaId, caption: String(text || '').slice(0, 1024) },
      };
    } else {
      payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: String(text || '').slice(0, 4096) },
      };
    }
    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, imageSent: false, reason: json.error?.message || 'send_failed' };
    }
    return { ok: true, imageSent: Boolean(parsed), reason: '', messageId: json.messages?.[0]?.id || '' };
  } catch (err) {
    return { ok: false, imageSent: false, reason: err.message || 'send_failed' };
  }
}

module.exports = { sendWhatsAppCloud, cloudConfigured, digitsPhone };
