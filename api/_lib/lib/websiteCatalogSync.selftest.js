const { websiteCatalogSyncScript } = require('./websiteCatalogSync');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// The script must call back to the host it was actually served from, never a
// hardcoded domain — this was the root cause of the website catalog silently
// breaking when the old Vercel API host was paused.
const liveScript = websiteCatalogSyncScript('https://api.amzprints.com');
assert(liveScript.includes('"https://api.amzprints.com"'), 'embeds the given API base');
assert(!liveScript.includes('vercel.app'), 'never hardcodes the old Vercel host');

// A trailing slash on the base must not produce a double-slash before `?path=`.
const trimmed = websiteCatalogSyncScript('https://api.amzprints.com/');
assert(trimmed.includes('"https://api.amzprints.com"'), 'strips a trailing slash from the base');

// No base provided (defensive) still falls back to the real production host, not Vercel.
const fallback = websiteCatalogSyncScript();
assert(fallback.includes('"https://api.amzprints.com"'), 'falls back to the production host when no base is given');

console.log('websiteCatalogSync ok');
