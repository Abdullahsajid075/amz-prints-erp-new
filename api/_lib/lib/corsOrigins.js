/**
 * CORS origin allowlist — pure so it can be unit tested without booting Express.
 * Free/temporary hosts are allowed so the frontend can move off Vercel in an
 * emergency (e.g. a Vercel bandwidth pause) without an env var change first.
 */

const EMERGENCY_HOST_SUFFIXES = [
  '.vercel.app',
  '.amzprints.com',
  '.netlify.app',
  '.pages.dev',
  '.onrender.com',
  '.hostingersite.com',
  '.000webhostapp.com',
];

function parseOrigins(raw) {
  return String(raw || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin, envOrigins) {
  if (!origin) return true;
  const list = Array.isArray(envOrigins) ? envOrigins : parseOrigins(envOrigins);
  if (list.includes('*') || list.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host === 'amzprints.com') return true;
    if (EMERGENCY_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  } catch {
    return false;
  }
  return false;
}

module.exports = { isAllowedOrigin, parseOrigins, EMERGENCY_HOST_SUFFIXES };
