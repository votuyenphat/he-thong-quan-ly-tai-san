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

/**
 * Tải danh sách user_accounts từ bảng app_database trên Supabase (id='user_accounts')
 */
export async function fetchUserAccountsFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('app_database')
      .select('data, last_updated')
      .eq('id', 'user_accounts')
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Lỗi tải user_accounts:', error);
      return null;
    }

    if (!data || !data.data || !Array.isArray(data.data.accounts)) {
      return null;
    }

    return {
      accounts: data.data.accounts,
      lastUpdated: data.last_updated || data.data.lastUpdated || Date.now()
    };
  } catch (err) {
    console.warn('[Supabase] fetchUserAccountsFromSupabase ngoại lệ:', err);
    return null;
  }
}

/**
 * Đẩy danh sách user_accounts lên Supabase (Upsert vào bản ghi id='user_accounts')
 */
export async function pushUserAccountsToSupabase(accounts) {
  const client = getSupabaseClient();
  if (!client) return { status: 'skipped', reason: 'Supabase client not ready' };

  try {
    const now = Date.now();
    const dbRecord = {
      id: 'user_accounts',
      data: {
        accounts: accounts,
        lastUpdated: now
      },
      last_updated: now,
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from('app_database')
      .upsert(dbRecord, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Lỗi lưu user_accounts:', error);
      throw new Error(`Lỗi cập nhật user_accounts Supabase: ${error.message}`);
    }

    return { status: 'ok', lastUpdated: now };
  } catch (err) {
    console.error('[Supabase] pushUserAccountsToSupabase ngoại lệ:', err);
    throw err;
  }
}

/**
 * Đăng ký lắng nghe sự kiện Realtime thay đổi tài khoản người dùng
 */
export function subscribeToUserAccountsRealtime(onAccountsReceived, onStatusChange) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channelName = `realtime_user_accounts_${Date.now()}`;
  const channel = client.channel(channelName);

  channel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'app_database',
        filter: 'id=eq.user_accounts'
      },
      (payload) => {
        if (payload.new && payload.new.data && Array.isArray(payload.new.data.accounts)) {
          onAccountsReceived(payload.new.data.accounts);
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
      console.warn('[Supabase Realtime] Lỗi hủy channel user_accounts:', err);
    }
  };
}

