/**
 * Centralized token storage wrapper.
 *
 * Security notes:
 * - The app talks directly to a Google Apps Script (GAS) backend from the browser,
 *   which cannot set httpOnly cookies. localStorage is therefore the pragmatic choice.
 * - We centralize all reads/writes here, apply a short expiry (24h) and light
 *   base64 obfuscation to raise the bar against trivial script inspection.
 * - Callers MUST use this wrapper instead of touching localStorage directly.
 */

const TOKEN_KEY = 'auth_v1';
const USER_KEY = 'user_v1';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h

const encode = (value) => {
  try { return btoa(unescape(encodeURIComponent(value))); }
  catch { return value; }
};

const decode = (value) => {
  try { return decodeURIComponent(escape(atob(value))); }
  catch { return value; }
};

const readEnvelope = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const envelope = JSON.parse(decode(raw));
    if (!envelope?.expiresAt || Date.now() > envelope.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return envelope.data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const writeEnvelope = (key, data) => {
  const envelope = { data, expiresAt: Date.now() + EXPIRY_MS };
  localStorage.setItem(key, encode(JSON.stringify(envelope)));
};

export const tokenStorage = {
  getToken: () => readEnvelope(TOKEN_KEY),
  setToken: (token) => writeEnvelope(TOKEN_KEY, token),
  getUser: () => readEnvelope(USER_KEY),
  setUser: (user) => writeEnvelope(USER_KEY, user),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};
