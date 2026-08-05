/**
 * Notification channel registry — WhatsApp / Email now; SMS & Push later.
 * Each channel: { id, label, send(payload) => Promise<result> }
 */

const channels = new Map();

export function registerChannel(channel) {
  if (!channel?.id || typeof channel.send !== 'function') {
    throw new Error('Invalid notification channel');
  }
  channels.set(channel.id, channel);
}

export function getChannel(id) {
  return channels.get(id) || null;
}

export function listChannels() {
  return Array.from(channels.values());
}

export async function sendViaChannels(channelIds, payload) {
  const results = {};
  for (const id of channelIds) {
    const ch = channels.get(id);
    if (!ch) {
      results[id] = { ok: false, skipped: true, reason: 'channel_not_registered' };
      continue;
    }
    try {
      results[id] = await ch.send(payload);
    } catch (err) {
      results[id] = { ok: false, error: err?.message || String(err) };
    }
  }
  return results;
}
