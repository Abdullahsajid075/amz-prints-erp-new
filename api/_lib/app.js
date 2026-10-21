/**
 * Express app — used by local server.js and Vercel serverless (api/index.js).
 * Frontend gasClient: GET/POST {API_URL}?path=/orders&token=...
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { dispatch } = require('./routes/dispatch');
const { isAllowedOrigin, parseOrigins } = require('./lib/corsOrigins');

const app = express();
const origins = parseOrigins(process.env.CORS_ORIGINS);

app.use(cors({
  origin: (origin, cb) => cb(null, isAllowedOrigin(origin, origins) ? origin || true : false),
  credentials: true,
}));

app.use(express.json({ limit: '4mb', type: ['application/json', 'text/plain'] }));
app.use(express.text({ limit: '4mb', type: 'text/plain' }));

app.use((req, _res, next) => {
  if (typeof req.body === 'string' && req.body.trim()) {
    try { req.body = JSON.parse(req.body); } catch { /* keep string */ }
  }
  if (!req.body || typeof req.body !== 'object') req.body = {};
  next();
});

function sendHealth(_req, res) {
  res.json({ ok: true, backend: 'supabase', service: 'amz-erp-api' });
}

// Vercel may mount this app at /, /api, or /api/index
app.all('*', (req, res) => {
  const p = String(req.path || '/').replace(/\/+$/, '') || '/';
  const gasPath = String(req.query.path || '').trim();
  const isHealth = p === '/health' || p === '/api/health' || p.endsWith('/health');
  if (isHealth || (!gasPath && (p === '/' || p === '/api' || p === '/api/index'))) {
    return sendHealth(req, res);
  }
  // `dispatch` is async and Express never awaits or catches what a route
  // handler returns, so a rejection here — even one dispatch's own
  // try/catch didn't anticipate — would otherwise become an unhandled
  // promise rejection. On the long-running Hostinger process that crashes
  // the whole Node process (every tenant's request, not just this one)
  // instead of just failing this single request.
  return Promise.resolve(dispatch(req, res)).catch((err) => {
    console.error('Unhandled dispatch error', err);
    if (!res.headersSent) {
      res.status(200).json({ message: err && err.message ? err.message : String(err), _status: 500 });
    }
  });
});

module.exports = app;
