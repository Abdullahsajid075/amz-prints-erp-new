require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { dispatch } = require('./routes/dispatch');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const origins = String(process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: origins.includes('*') ? true : origins,
  credentials: true,
}));

// GAS client posts text/plain JSON — accept both
app.use(express.json({ type: ['application/json', 'text/plain'] }));
app.use(express.text({ type: 'text/plain' }));

app.use((req, _res, next) => {
  if (typeof req.body === 'string' && req.body.trim()) {
    try { req.body = JSON.parse(req.body); } catch { /* keep string */ }
  }
  if (!req.body || typeof req.body !== 'object') req.body = {};
  next();
});

/**
 * Compatible with frontend gasClient.js:
 *   GET/POST  {API_URL}?path=/orders&token=...
 *   POST with _method=PUT|PATCH|DELETE for updates
 */
app.all('/', dispatch);
app.all('/api', dispatch);
app.all('/exec', dispatch);

app.get('/health', (_req, res) => {
  res.json({ ok: true, backend: 'supabase', service: 'amz-erp-api' });
});

app.listen(PORT, () => {
  console.log(`AMZ ERP API listening on :${PORT}`);
  console.log(`Point REACT_APP_GAS_API_URL to this server URL (e.g. https://your-hostinger-domain/ or /exec)`);
});
