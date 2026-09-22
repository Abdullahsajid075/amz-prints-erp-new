/**
 * Vercel serverless entry (project Root Directory = api).
 * All GAS-style requests: GET/POST /?path=/orders&token=...
 */
const app = require('./_lib/app');

module.exports = app;
