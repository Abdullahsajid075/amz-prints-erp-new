/** Local: npm start → node _lib/local-server.js */
const app = require('./app');
const PORT = Number(process.env.PORT || 3000);

// This process stays up for every request until Hostinger restarts it, so a
// single uncaught error anywhere (a bug, a bad third-party dependency, a
// stray unhandled rejection app.js's own safety net didn't anticipate) would
// otherwise silently kill the whole API for every user until something
// notices and respawns it — which is exactly the kind of "site works, then
// goes dead for several minutes" symptom this is meant to prevent. Log and
// keep serving instead of crashing; this is a stateless REST API with no
// shared in-request state, so surviving one bad request is safe.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection — API kept running', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception — API kept running', err);
});

// Hostinger proxies to 0.0.0.0 — localhost-only bind causes connection timeouts
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AMZ ERP API listening on 0.0.0.0:${PORT}`);
  console.log('Point Vercel REACT_APP_GAS_API_URL to this Hostinger URL');
});
