/** Local: npm start → node _lib/local-server.js */
const app = require('./app');
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`AMZ ERP API listening on :${PORT}`);
  console.log('Point Vercel REACT_APP_GAS_API_URL to this Hostinger URL');
});
