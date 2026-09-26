/** Queue helpers + spoken call: "{TOKEN} PLEASE PROCEED TO THE {COUNTER}" */

export function tokenStatusOf(token) {
  return String(token?.status || token?.tokenStatus || 'Waiting').trim() || 'Waiting';
}

export function normalizeToken(token) {
  if (!token) return null;
  const status = tokenStatusOf(token);
  return { ...token, status, tokenStatus: token.tokenStatus || status };
}

export function isWaitingToken(token) {
  return tokenStatusOf(token).toLowerCase() === 'waiting';
}

export function isActiveToken(token) {
  return ['called', 'in progress'].includes(tokenStatusOf(token).toLowerCase());
}

export function sortTokensFifo(list = []) {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) => {
    const ta = `${a.date || ''} ${a.time || ''} ${a.created_at || ''}`;
    const tb = `${b.date || ''} ${b.time || ''} ${b.created_at || ''}`;
    if (ta !== tb) return ta.localeCompare(tb);
    return String(a.tokenNo || '').localeCompare(String(b.tokenNo || ''));
  });
}

export function tokenAnnouncePhrase(tokenNo, counterName) {
  const token = String(tokenNo || '').trim() || 'TOKEN';
  const counter = String(counterName || '').trim() || 'COUNTER';
  return `${token} PLEASE PROCEED TO THE ${counter}`;
}

export function announceTokenCall(tokenNo, counterName) {
  const text = tokenAnnouncePhrase(tokenNo, counterName);
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { ok: false, text, reason: 'no_speech' };
  }
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.85;
    utter.pitch = 1;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
    return { ok: true, text };
  } catch {
    return { ok: false, text, reason: 'speak_failed' };
  }
}

export function counterStatusBoard(tokens = [], counters = []) {
  const names = [];
  (Array.isArray(counters) ? counters : []).forEach((c) => {
    const name = c.counterName || c.counter_name || c.name;
    if (name && !names.includes(name)) names.push(name);
  });
  (Array.isArray(tokens) ? tokens : []).forEach((t) => {
    const name = t.counterName;
    if (name && !names.includes(name)) names.push(name);
  });
  return names.map((counterName) => {
    const rows = (Array.isArray(tokens) ? tokens : []).filter(
      (t) => String(t.counterName || '') === counterName
    );
    const waiting = sortTokensFifo(rows.filter(isWaitingToken));
    const active = sortTokensFifo(rows.filter(isActiveToken));
    return {
      counterName,
      nowServing: active[0] || null,
      nextWaiting: waiting[0] || null,
      waitingCount: waiting.length,
      activeCount: active.length,
      total: rows.length,
    };
  });
}
