// src/services/syncService.js

/**
 * Lấy URL gốc cho API đồng bộ
 * Mặc định dùng relative path '' (trỏ thẳng vào server đang phục vụ trang web)
 * Có thể ghi đè bằng qlts_custom_sync_url nếu cấu hình máy chủ từ xa
 */
export function getSyncApiUrl() {
  const custom = localStorage.getItem('qlts_custom_sync_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  return '';
}

/**
 * Kiểm tra phiên bản mới nhất từ máy chủ (siêu nhẹ, < 100 bytes)
 */
export async function fetchServerVersion() {
  const base = getSyncApiUrl();
  const url = `${base}/api/sync/version?_t=${Date.now()}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Tải toàn bộ dữ liệu từ máy chủ trung tâm
 */
export async function fetchServerData() {
  const base = getSyncApiUrl();
  const url = `${base}/api/sync?_t=${Date.now()}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Đẩy dữ liệu từ thiết bị hiện tại lên máy chủ trung tâm
 */
export async function pushServerData(payload) {
  const base = getSyncApiUrl();
  const url = `${base}/api/sync`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Xuất dữ liệu ra file JSON để sao lưu dự phòng
 */
export function exportBackupToFile(data) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const filename = `sao-luu-qlts-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.json`;
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Nhập dữ liệu từ file sao lưu JSON
 */
export function readBackupFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== 'object') {
          return reject(new Error('Tệp JSON không hợp lệ'));
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error('Không thể phân tích nội dung tệp JSON: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc tệp'));
    reader.readAsText(file);
  });
}
