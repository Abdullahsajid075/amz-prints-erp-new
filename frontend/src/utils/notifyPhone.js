import { customersAPI } from '@/services/api';

/** First non-empty phone-like value. */
export function firstPhone(...values) {
  for (const v of values) {
    const s = String(v || '').trim();
    if (s) return s;
  }
  return '';
}

export function phoneFromRecord(record = {}) {
  return firstPhone(
    record.customerPhone,
    record.partyPhone,
    record.phone,
    record.mobile,
    record.whatsapp,
    record.whatsApp,
    record.customer_phone,
    record.party_phone,
  );
}

const phoneCache = new Map();

/**
 * Resolve a WhatsApp number from the record, then the customer card.
 * Invoice / payment rows often store an empty phone even when the customer has one.
 */
export async function lookupCustomerPhone({
  phone,
  customerPhone,
  partyPhone,
  customerId,
  customerName,
} = {}) {
  const existing = firstPhone(phone, customerPhone, partyPhone);
  if (existing) return existing;

  const id = String(customerId || '').trim();
  if (id && phoneCache.has(`id:${id}`)) return phoneCache.get(`id:${id}`) || '';

  try {
    if (id) {
      const res = await customersAPI.getById(id);
      const found = phoneFromRecord(res.data || {});
      phoneCache.set(`id:${id}`, found);
      if (found) return found;
    }
    const name = String(customerName || '').trim().toLowerCase();
    if (name) {
      const res = await customersAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      const match = (id && list.find((c) => String(c.id) === id))
        || list.find((c) => String(c.name || '').trim().toLowerCase() === name);
      const found = phoneFromRecord(match || {});
      if (id) phoneCache.set(`id:${id}`, found);
      return found;
    }
  } catch {
    /* keep going without a number */
  }
  return '';
}
