/**
 * Express app — used by local server.js and Vercel serverless (api/index.js).
 * Frontend gasClient: GET/POST {API_URL}?path=/orders&token=...
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { dispatch } = require('./routes/dispatch');

const app = express();
const origins = String(process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: origins.includes('*') ? true : origins,
  credentials: true,
}));

app.use(express.json({ type: ['application/json', 'text/plain'] }));
app.use(express.text({ type: 'text/plain' }));

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
  return dispatch(req, res);
});

module.exports = app;
