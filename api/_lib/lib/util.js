function id(prefix = 'row') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dateKey(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const iso = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const dmy = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dmy) {
    const a = Number(dmy[1]);
    const b = Number(dmy[2]);
    const y = dmy[3];
    if (a > 12) return `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
    if (b > 12) return `${y}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
    return `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return '';
}

function nowTime() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function truthy(v, fallback = true) {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (['0', 'false', 'no', 'off', 'n'].includes(s)) return false;
  return true;
}

function jsonOk(payload, status = 200) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return { ...payload, _status: status };
  }
  // Arrays / primitives — wrap for GAS-compatible status channel
  return { data: payload, _status: status, _array: Array.isArray(payload) };
}

/** Match GAS jsonResponse_ behavior: frontend stripStatus expects _status on object */
function send(res, payload, status = 200) {
  if (Array.isArray(payload)) {
    // Frontend expects array as data root — gasClient uses stripStatus on object only
    // GAS returns raw JSON array. Mirror that.
    return res.status(200).json(payload);
  }
  if (payload && typeof payload === 'object') {
    return res.status(200).json({ ...payload, ...(status >= 400 ? { _status: status } : { _status: status }) });
  }
  return res.status(200).json(payload);
}

function sendError(res, message, status = 500) {
  return res.status(200).json({ message, _status: status });
}

module.exports = { id, today, nowTime, dateKey, num, truthy, send, sendError };
