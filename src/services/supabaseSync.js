// src/services/supabaseSync.js
import { getSupabaseClient, getSupabaseConfig } from './supabaseClient';

/**
 * Kiểm tra xem Supabase đã được cấu hình hay chưa
 */
export function isSupabaseEnabled() {
  return getSupabaseConfig().isConfigured;
}

/**
 * Tải toàn bộ dữ liệu từ bảng app_database trên Supabase
 */
export async function fetchDataFromSupabase() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase chưa được cấu hình');
  }

  const { data, error } = await client
    .from('app_database')
    .select('data, last_updated')
    .eq('id', 'main')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !data.data) {
    return null;
  }

  return {
    ...data.data,
    lastUpdated: data.last_updated || data.data.lastUpdated || Date.now()
  };
}

/**
 * Đẩy toàn bộ dữ liệu lên Supabase (Upsert vào bản ghi id='main')
 */
export async function pushDataToSupabase(payload) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase chưa được cấu hình');
  }

  const lastUpdated = payload.lastUpdated || Date.now();
  const dbRecord = {
    id: 'main',
    data: payload,
    last_updated: lastUpdated,
    updated_at: new Date().toISOString()
  };

  const { error } = await client
    .from('app_database')
    .upsert(dbRecord, { onConflict: 'id' });

  if (error) {
    throw new Error(`Lỗi cập nhật Supabase: ${error.message}`);
  }

  return {
    status: 'ok',
    lastUpdated
  };
}

/**
 * Đăng ký lắng nghe sự kiện đồng bộ thời gian thực (Realtime WebSocket)
 * Khi có bất kỳ thiết bị nào (điện thoại, máy tính khác) cập nhật dữ liệu,
 * hàm callback onDataReceived sẽ được gọi ngay lập tức (< 200ms)
 *
 * @param {Function} onDataReceived - Callback khi có dữ liệu mới
 * @param {Function} onStatusChange - Callback khi trạng thái kết nối realtime thay đổi
 * @returns {Function} Hàm hủy đăng ký (unsubscribe)
 */
export function subscribeToSupabaseRealtime(onDataReceived, onStatusChange) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channelName = `realtime_db_${Date.now()}`;
  const channel = client.channel(channelName);

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'app_database',
        filter: 'id=eq.main'
      },
      (payload) => {
        if (payload.new && payload.new.data) {
          const remoteData = {
            ...payload.new.data,
            lastUpdated: payload.new.last_updated || Date.now()
          };
          onDataReceived(remoteData);
        }
      }
    )
    .subscribe((status) => {
      if (onStatusChange) {
        onStatusChange(status);
      }
    });

  return () => {
    try {
      client.removeChannel(channel);
    } catch (err) {
      console.warn('[Supabase Realtime] Lỗi khi hủy channel:', err);
    }
  };
}
