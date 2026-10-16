/**
 * Minimal local "Supabase" gateway for development.
 *
 * @supabase/supabase-js sends REST calls to `${SUPABASE_URL}/rest/v1/<table>`.
 * A real Supabase project routes those through Kong to PostgREST. Locally we
 * emulate that single hop: strip the `/rest/v1` prefix and forward everything
 * else straight to a local PostgREST instance (which speaks the same protocol).
 */
const http = require('http');

const PORT = Number(process.env.SUPABASE_PROXY_PORT || 3005);
const TARGET_HOST = process.env.PGRST_HOST || '127.0.0.1';
const TARGET_PORT = Number(process.env.PGRST_PORT || 3001);

const server = http.createServer((req, res) => {
  let path = req.url || '/';

  // Health probe used by start scripts.
  if (path === '/__proxy_health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, target: `${TARGET_HOST}:${TARGET_PORT}` }));
    return;
  }

  // Map Supabase REST path onto PostgREST's root path.
  if (path.startsWith('/rest/v1')) {
    path = path.slice('/rest/v1'.length) || '/';
    if (!path.startsWith('/')) path = `/${path}`;
  }

  const headers = { ...req.headers, host: `${TARGET_HOST}:${TARGET_PORT}` };
  // PostgREST (no jwt-secret) uses the anon role; drop the Supabase bearer so
  // it is never mistaken for a JWT it must validate.
  delete headers.authorization;

  const upstream = http.request(
    { host: TARGET_HOST, port: TARGET_PORT, method: req.method, path, headers },
    (upRes) => {
      res.writeHead(upRes.statusCode || 502, upRes.headers);
      upRes.pipe(res);
    }
  );

  upstream.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Local Supabase proxy error: ${err.message}` }));
  });

  req.pipe(upstream);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Local Supabase proxy on http://127.0.0.1:${PORT} -> PostgREST ${TARGET_HOST}:${TARGET_PORT}`);
});
