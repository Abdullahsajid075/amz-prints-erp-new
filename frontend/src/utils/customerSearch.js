/** Normalize phone for search: digits only (handles +92 / 03xx / spaces / dashes). */
export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

/** Match customer by name, phone (flexible), email, city, address, id. */
export function customerMatchesQuery(customer, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const c = customer || {};
  const name = String(c.name || '').toLowerCase();
  const email = String(c.email || '').toLowerCase();
  const city = String(c.city || '').toLowerCase();
  const address = String(c.address || '').toLowerCase();
  const id = String(c.id || '').toLowerCase();
  const code = String(c.customerCode || c.customer_code || '').toLowerCase();
  const phone = String(c.phone || c.customerPhone || '');
  const phoneDigits = digitsOnly(phone);
  const qDigits = digitsOnly(q);

  if (name.includes(q)) return true;
  if (email.includes(q)) return true;
  if (city.includes(q)) return true;
  if (address.includes(q)) return true;
  if (id.includes(q)) return true;
  if (code.includes(q)) return true;
  if (phone.toLowerCase().includes(q)) return true;
  // Phone digit match: "300" finds "0300-1234567" / "+92300..."
  if (qDigits.length >= 3 && phoneDigits.includes(qDigits)) return true;
  // Local vs +92: query 03… vs stored 923…
  if (qDigits.length >= 4) {
    const qLocal = qDigits.startsWith('92') ? `0${qDigits.slice(2)}` : qDigits;
    const pLocal = phoneDigits.startsWith('92') ? `0${phoneDigits.slice(2)}` : phoneDigits;
    if (pLocal.includes(qLocal) || phoneDigits.includes(qDigits)) return true;
  }
  return false;
}
