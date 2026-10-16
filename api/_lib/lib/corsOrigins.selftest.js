const { isAllowedOrigin, parseOrigins } = require('./corsOrigins');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const prodOrigins = parseOrigins(
  'https://erp.amzprints.com,https://amzprints.com,https://amz-prints-erp-new.vercel.app,http://localhost:5173'
);

assert(isAllowedOrigin(undefined, prodOrigins), 'no-origin requests (server-to-server) allowed');
assert(isAllowedOrigin('https://erp.amzprints.com', prodOrigins), 'exact env match allowed');
assert(isAllowedOrigin('http://localhost:5173', prodOrigins), 'exact localhost match allowed');
assert(isAllowedOrigin('http://localhost:5999', prodOrigins), 'any localhost port allowed');
assert(isAllowedOrigin('http://127.0.0.1:3000', prodOrigins), '127.0.0.1 allowed');
assert(isAllowedOrigin('https://preview-123.vercel.app', prodOrigins), 'any vercel.app preview allowed');
assert(isAllowedOrigin('https://amz-erp.netlify.app', prodOrigins), 'netlify emergency host allowed');
assert(isAllowedOrigin('https://amz-erp.pages.dev', prodOrigins), 'cloudflare pages emergency host allowed');
assert(isAllowedOrigin('https://amz-erp-api.onrender.com', prodOrigins), 'render emergency host allowed');
assert(isAllowedOrigin('https://something.hostingersite.com', prodOrigins), 'hostinger emergency host allowed');
assert(isAllowedOrigin('https://portal.amzprints.com', prodOrigins), 'any amzprints.com subdomain allowed');
assert(!isAllowedOrigin('https://evil-example.com', prodOrigins), 'unrelated origin rejected');
assert(!isAllowedOrigin('https://amzprints.com.evil.com', prodOrigins), 'lookalike suffix rejected');

const wildcard = parseOrigins('*');
assert(isAllowedOrigin('https://anything.example.com', wildcard), 'wildcard env allows all');

console.log('corsOrigins ok');
