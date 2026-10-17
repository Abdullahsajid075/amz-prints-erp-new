/**
 * Tiny in-process TTL cache for expensive, identical-for-everyone reads.
 *
 * This process (server.js / local-server.js) is a long-running Node server
 * on Hostinger, not a per-request serverless function, so an in-memory
 * cache here actually persists across requests from different users and is
 * shared by the whole server instance — unlike the frontend's per-tab
 * cache in gasClient.js, which only helps a single browser session.
 *
 * Deliberately simple: time-based expiry only, no manual invalidation.
 * Keeping it TTL-only (instead of trying to invalidate on every write path)
 * avoids the real risk of missing one of several scattered write sites and
 * silently serving stale data forever. A short TTL bounds staleness to a
 * small, predictable window — already well within what callers tolerate
 * today (the frontend keeps its own 120s per-tab cache for these same
 * endpoints, and the public catalog feed uses a 30s CDN cache).
 */

const store = new Map(); // key -> { expiresAt, promise }

/**
 * Returns a cached resolved value for `key` if still fresh, otherwise calls
 * `loader()` once, caches the resolved result for `ttlMs`, and returns it.
 * Concurrent calls for the same key while a load is in flight share the
 * same in-flight promise instead of firing duplicate underlying queries.
 */
async function cachedRead(key, loader, ttlMs) {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.promise;
  }
  const promise = Promise.resolve().then(loader);
  store.set(key, { expiresAt: now + ttlMs, promise });
  try {
    return await promise;
  } catch (err) {
    // Don't poison the cache with a rejected promise — let the next call retry.
    if (store.get(key)?.promise === promise) store.delete(key);
    throw err;
  }
}

function clearCache(key) {
  if (key == null) {
    store.clear();
  } else {
    store.delete(key);
  }
}

module.exports = { cachedRead, clearCache };
