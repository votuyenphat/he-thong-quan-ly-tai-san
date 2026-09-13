// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'qlts_supabase_url';
const STORAGE_KEY_KEY = 'qlts_supabase_anon_key';

const DEFAULT_SUPABASE_URL = 'https://dszzfrpqblrlsjxrjzup.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_dl-1aq6tPNUGifchfQFdjw_tDlEfTp_';

let cachedClient = null;
let currentClientUrl = '';
let currentClientKey = '';

/**
 * Lấy thông tin cấu hình Supabase từ localStorage hoặc biến môi trường .env hoặc mặc định dự án
 */
export function getSupabaseConfig() {
  const localUrl = localStorage.getItem(STORAGE_KEY_URL);
  const localKey = localStorage.getItem(STORAGE_KEY_KEY);

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const url = (localUrl && localUrl.trim()) || (envUrl && envUrl.trim()) || DEFAULT_SUPABASE_URL;
  const anonKey = (localKey && localKey.trim()) || (envKey && envKey.trim()) || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey)
  };
}

/**
 * Lưu cấu hình Supabase vào localStorage
 */
export function saveSupabaseConfig(url, anonKey) {
  const cleanUrl = (url || '').trim().replace(/\/+$/, '');
  const cleanKey = (anonKey || '').trim();

  if (cleanUrl) {
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
  }

  if (cleanKey) {
    localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
  } else {
    localStorage.removeItem(STORAGE_KEY_KEY);
  }

  // Reset client cache
  cachedClient = null;
  currentClientUrl = '';
  currentClientKey = '';
}

/**
 * Xóa cấu hình Supabase
 */
export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  cachedClient = null;
  currentClientUrl = '';
  currentClientKey = '';
}

/**
 * Lấy hoặc khởi tạo instance Supabase Client
 */
export function getSupabaseClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedClient && currentClientUrl === url && currentClientKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    currentClientUrl = url;
    currentClientKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('[Supabase] Khởi tạo client thất bại:', err);
    return null;
  }
}

/**
 * Kiểm tra kết nối tới Supabase và bảng app_database
 */
export async function testSupabaseConnection(customUrl, customKey) {
  let client;
  if (customUrl && customKey) {
    try {
      client = createClient(customUrl.trim().replace(/\/+$/, ''), customKey.trim());
    } catch (e) {
      return { success: false, message: 'URL hoặc Key không đúng định dạng: ' + e.message };
    }
  } else {
    client = getSupabaseClient();
  }

  if (!client) {
    return { success: false, message: 'Chưa cấu hình Supabase URL và Anon Key' };
  }

  try {
    const { data, error } = await client
      .from('app_database')
      .select('id, last_updated')
      .eq('id', 'main')
      .maybeSingle();

    if (error) {
      // Nếu bảng chưa được tạo
      if (error.code === '42P01') {
        return {
          success: false,
          needsMigration: true,
          message: 'Kết nối Supabase thành công nhưng bảng "app_database" chưa được tạo. Hãy chạy script SQL khởi tạo!'
        };
      }
      return { success: false, message: `Lỗi Supabase (${error.code}): ${error.message}` };
    }

    return {
      success: true,
      dataExists: Boolean(data),
      lastUpdated: data?.last_updated || 0,
      message: 'Kết nối Supabase thành công!'
    };
  } catch (err) {
    return { success: false, message: 'Không thể kết nối tới Supabase: ' + err.message };
  }
}
