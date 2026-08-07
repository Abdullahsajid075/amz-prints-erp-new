function id(prefix = 'row') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
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

module.exports = { id, today, nowTime, num, truthy, send, sendError };
