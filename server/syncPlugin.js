// server/syncPlugin.js
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

const DEFAULT_DB = {
  lastUpdated: 0,
  assets: [],
  departments: [],
  locations: [],
  transfers: [],
  recalls: [],
  liquidations: [],
  inventorySessions: [],
  auditLogs: [],
  assetTypeOptions: [],
  conditionOptions: [],
  statusOptions: []
};

// Đảm bảo thư mục lưu trữ dữ liệu tồn tại
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Đọc CSDL từ file
function readDb() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
    return { ...DEFAULT_DB };
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Sync Server] Lỗi đọc database.json:', err);
    return { ...DEFAULT_DB };
  }
}

// Lưu CSDL vào file (ghi tạm rồi đổi tên để tránh hỏng file)
function writeDb(data) {
  ensureDataDir();
  const tmpFile = `${DB_FILE}.tmp`;
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('[Sync Server] Lỗi ghi database.json:', err);
    return false;
  }
}

// Middleware xử lý request API /api/sync
export function handleSyncRequest(req, res, next) {
  const url = req.url || '';
  if (!url.startsWith('/api/sync')) {
    return next();
  }

  // Headers CORS & JSON
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Client-Version');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 1. Endpoint kiểm tra phiên bản nhẹ: /api/sync/version
  if (url === '/api/sync/version' || url.startsWith('/api/sync/version?')) {
    if (req.method === 'GET') {
      const db = readDb();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'ok',
        lastUpdated: db.lastUpdated || 0,
        assetCount: (db.assets || []).length,
        departmentCount: (db.departments || []).length,
        serverTime: Date.now()
      }));
      return;
    }
  }

  // 2. Endpoint đặt lại CSDL: /api/sync/reset
  if (url === '/api/sync/reset' || url.startsWith('/api/sync/reset?')) {
    if (req.method === 'POST') {
      const fresh = { ...DEFAULT_DB, lastUpdated: Date.now() };
      writeDb(fresh);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'ok', message: 'Database reset successfully', lastUpdated: fresh.lastUpdated }));
      return;
    }
  }

  // 3. Endpoint chính: /api/sync (GET: đọc dữ liệu, POST: ghi dữ liệu)
  if (url === '/api/sync' || url.startsWith('/api/sync?')) {
    if (req.method === 'GET') {
      const db = readDb();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 200;
      res.end(JSON.stringify(db));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const current = readDb();

          // Cập nhật các danh mục dữ liệu nếu có trong payload
          const updated = {
            ...current,
            assets: Array.isArray(payload.assets) ? payload.assets : current.assets,
            departments: Array.isArray(payload.departments) ? payload.departments : current.departments,
            locations: Array.isArray(payload.locations) ? payload.locations : current.locations,
            transfers: Array.isArray(payload.transfers) ? payload.transfers : current.transfers,
            recalls: Array.isArray(payload.recalls) ? payload.recalls : current.recalls,
            liquidations: Array.isArray(payload.liquidations) ? payload.liquidations : current.liquidations,
            inventorySessions: Array.isArray(payload.inventorySessions) ? payload.inventorySessions : current.inventorySessions,
            auditLogs: Array.isArray(payload.auditLogs) ? payload.auditLogs : current.auditLogs,
            assetTypeOptions: Array.isArray(payload.assetTypeOptions) ? payload.assetTypeOptions : current.assetTypeOptions,
            conditionOptions: Array.isArray(payload.conditionOptions) ? payload.conditionOptions : current.conditionOptions,
            statusOptions: Array.isArray(payload.statusOptions) ? payload.statusOptions : current.statusOptions,
            lastUpdated: payload.lastUpdated || Date.now()
          };

          const success = writeDb(updated);
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          if (success) {
            res.statusCode = 200;
            res.end(JSON.stringify({
              status: 'ok',
              message: 'Synchronized successfully',
              lastUpdated: updated.lastUpdated
            }));
          } else {
            res.statusCode = 500;
            res.end(JSON.stringify({ status: 'error', message: 'Failed to write database file' }));
          }
        } catch (err) {
          console.error('[Sync Server] Lỗi parse JSON payload:', err);
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.statusCode = 400;
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON payload' }));
        }
      });
      return;
    }
  }

  next();
}

// Vite plugin export
export default function syncPlugin() {
  return {
    name: 'vite-plugin-sync-server',
    configureServer(server) {
      server.middlewares.use(handleSyncRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleSyncRequest);
    }
  };
}
