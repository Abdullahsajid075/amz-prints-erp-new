/**
 * Hostinger Node.js — serve Vite production build (frontend/dist).
 * Settings: Root = frontend | Build = npm run build | Start = node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
};

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Cache-Control': status === 200 && type && !type.includes('html')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath);

  if (!filePath.startsWith(DIST)) {
    return send(res, 403, 'Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA: unknown routes → index.html
      filePath = path.join(DIST, 'index.html');
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        return send(res, 500, 'Build missing. Run npm run build first.');
      }
      const ext = path.extname(filePath).toLowerCase();
      send(res, 200, data, MIME[ext] || 'application/octet-stream');
    });
  });
});

server.listen(PORT, () => {
  console.log(`AMZ ERP frontend serving dist/ on :${PORT}`);
});
