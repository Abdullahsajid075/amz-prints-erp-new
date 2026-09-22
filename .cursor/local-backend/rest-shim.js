/**
 * Supabase-compatible REST shim.
 *
 * The @supabase/supabase-js client issues requests against `${SUPABASE_URL}/rest/v1/...`.
 * PostgREST serves tables at its root (`/...`). This tiny dependency-free proxy strips the
 * `/rest/v1` prefix and forwards everything else to a local PostgREST instance, so the ERP
 * API can run fully offline against a local PostgreSQL database with no cloud Supabase project.
 */
const http = require('http');

const LISTEN_HOST = process.env.SHIM_HOST || '127.0.0.1';
const LISTEN_PORT = Number(process.env.SHIM_PORT || 3001);
const TARGET_HOST = process.env.POSTGREST_HOST || '127.0.0.1';
const TARGET_PORT = Number(process.env.POSTGREST_PORT || 3010);

const server = http.createServer((req, res) => {
  let path = req.url || '/';
  path = path.replace(/^\/rest\/v1/, '');
  if (path === '') path = '/';

  const options = {
    host: TARGET_HOST,
    port: TARGET_PORT,
    method: req.method,
    path,
    headers: { ...req.headers, host: `${TARGET_HOST}:${TARGET_PORT}` },
  };

  const upstream = http.request(options, (pRes) => {
    res.writeHead(pRes.statusCode || 502, pRes.headers);
    pRes.pipe(res);
  });

  upstream.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: `rest-shim upstream error: ${err.message}` }));
  });

  req.pipe(upstream);
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`rest-shim listening on http://${LISTEN_HOST}:${LISTEN_PORT} -> PostgREST ${TARGET_HOST}:${TARGET_PORT}`);
});
