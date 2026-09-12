// server.js - Máy chủ độc lập cho môi trường Production (Node.js thuần, 0 dependencies)
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { handleSyncRequest } from './server/syncPlugin.js';

const PORT = process.env.PORT || 5173;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // 1. Chuyển cho sync middleware xử lý nếu là API
  handleSyncRequest(req, res, () => {
    // 2. Phục vụ file tĩnh từ thư mục dist/
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    let filePath = path.join(DIST_DIR, reqPath);

    // Ngăn directory traversal
    if (!filePath.startsWith(DIST_DIR)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
        fs.createReadStream(filePath).pipe(res);
      } else {
        // SPA Fallback: phục vụ index.html cho các route phía client
        const indexPath = path.join(DIST_DIR, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          fs.createReadStream(indexPath).pipe(res);
        } else {
          res.statusCode = 404;
          res.end('Chưa tạo bản build (dist/index.html). Hãy chạy "npm run build" trước.');
        }
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(` Máy chủ Quản lý Tài sản đang chạy tại:`);
  console.log(` - Local:   http://localhost:${PORT}/`);

  // Tìm IP mạng LAN
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(` - Mạng LAN (Điện thoại/Laptop): http://${net.address}:${PORT}/`);
      }
    }
  }
  console.log('========================================================');
});
