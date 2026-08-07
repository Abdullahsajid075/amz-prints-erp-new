/** Local: npm start → node _lib/local-server.js */
const app = require('./app');
const PORT = Number(process.env.PORT || 3000);

// Hostinger proxies to 0.0.0.0 — localhost-only bind causes connection timeouts
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AMZ ERP API listening on 0.0.0.0:${PORT}`);
  console.log('Point Vercel REACT_APP_GAS_API_URL to this Hostinger URL');
});
