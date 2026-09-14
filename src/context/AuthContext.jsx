// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { 
  fetchUserAccountsFromSupabase, 
  pushUserAccountsToSupabase, 
  subscribeToUserAccountsRealtime 
} from '../services/supabaseSync';
import { cleanText } from '../utils/normalize';

const AuthContext = createContext();

export const SUPER_ADMIN_EMAIL = 'vphat772@gmail.com';

export const DEFAULT_PERMISSIONS = {
  asset_create: true,
  asset_edit: true,
  asset_delete: false,
  asset_print_qr: true,
  asset_export: true,
  transfer_propose: true,
  recall_propose: true,
  liquidation_propose: false,
  inventory_scan: true
};

export const SUPER_ADMIN_PERMISSIONS = {
  asset_create: true,
  asset_edit: true,
  asset_delete: true,
  asset_print_qr: true,
  asset_export: true,
  transfer_propose: true,
  transfer_approve: true,
  recall_propose: true,
  recall_approve: true,
  liquidation_propose: true,
  liquidation_approve: true,
  inventory_scan: true,
  manage_users: true,
  manage_locations: true
};

export const DEFAULT_SUPER_ADMIN = {
  id: 'usr-super-admin',
  email: SUPER_ADMIN_EMAIL,
  name: 'Võ Tuyền Phát (Super Admin)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'SUPER_ADMIN',
  isSuperAdmin: true,
  departmentId: 'ALL',
  departmentName: 'Toàn trường',
  permissions: { ...SUPER_ADMIN_PERMISSIONS },
  status: 'active',
  forcePasswordChange: false,
  lastLogin: new Date().toISOString()
};

export function AuthProvider({ children }) {
  // Danh sách tài khoản người dùng (Super Admin + Quản lý phòng ban)
  const [userAccounts, setUserAccounts] = useState(() => {
    const saved = localStorage.getItem('qlts_user_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Luôn đảm bảo có tài khoản Super Admin vphat772@gmail.com
          const hasAdmin = parsed.some(u => u.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
          if (!hasAdmin) return [DEFAULT_SUPER_ADMIN, ...parsed];
          return parsed;
        }
      } catch (e) {
        console.error('Lỗi đọc qlts_user_accounts:', e);
      }
    }
    return [DEFAULT_SUPER_ADMIN];
  });

  // Trạng thái đồng bộ đám mây
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);
  const [lastUserSyncTime, setLastUserSyncTime] = useState(null);

  // Người dùng hiện tại
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('qlts_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Lỗi đọc qlts_auth_user:', e);
      }
    }
    return DEFAULT_SUPER_ADMIN;
  });

  // Trạng thái đăng nhập (mặc định true nếu có session trước đó)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem('qlts_is_logged_in');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Đồng bộ lưu localStorage khi state thay đổi
  useEffect(() => {
    localStorage.setItem('qlts_user_accounts', JSON.stringify(userAccounts));
  }, [userAccounts]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('qlts_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('qlts_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('qlts_is_logged_in', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  // Đồng bộ tài khoản người dùng và phân quyền từ Supabase Cloud (app_database: id='user_accounts')
  const syncUserAccountsWithCloud = useCallback(async () => {
    setIsSyncingUsers(true);
    try {
      const remote = await fetchUserAccountsFromSupabase();
      
      // Đọc tài khoản hiện có trong localStorage để hợp nhất (tránh mất tài khoản vừa tạo ở máy này)
      let localAccounts = [];
      const savedLocal = localStorage.getItem('qlts_user_accounts');
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed)) localAccounts = parsed;
        } catch (e) {}
      }

      if (remote && Array.isArray(remote.accounts) && remote.accounts.length > 0) {
        const cloudAccounts = remote.accounts;
        
        // Kiểm tra xem có tài khoản cục bộ nào chưa có trên đám mây không (ví dụ tài khoản mới tạo trên máy này)
        const missingOnCloud = localAccounts.filter(localAcc => 
          localAcc.email && !cloudAccounts.some(ca => ca.email?.toLowerCase() === localAcc.email?.toLowerCase())
        );

        let mergedAccounts = [...cloudAccounts];
        let needsPushToCloud = false;

        if (missingOnCloud.length > 0) {
          console.log('[Cloud Sync] Phát hiện tài khoản cục bộ chưa có trên mây, đang tải lên:', missingOnCloud.map(u => u.email));
          mergedAccounts = [...cloudAccounts, ...missingOnCloud];
          needsPushToCloud = true;
        }

        // Đảm bảo Super Admin luôn có mặt
        const hasAdmin = mergedAccounts.some(u => u.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
        if (!hasAdmin) {
          mergedAccounts = [DEFAULT_SUPER_ADMIN, ...mergedAccounts];
          needsPushToCloud = true;
        }

        setUserAccounts(mergedAccounts);
        localStorage.setItem('qlts_user_accounts', JSON.stringify(mergedAccounts));

        if (needsPushToCloud) {
          await pushUserAccountsToSupabase(mergedAccounts);
        }
      } else {
        // Chưa có dữ liệu trên cloud: nếu local đã có tài khoản, đẩy toàn bộ local lên cloud
        if (localAccounts.length > 0) {
          const hasAdmin = localAccounts.some(u => u.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
          const toUpload = hasAdmin ? localAccounts : [DEFAULT_SUPER_ADMIN, ...localAccounts];
          await pushUserAccountsToSupabase(toUpload);
          setUserAccounts(toUpload);
        }
      }

      setLastUserSyncTime(Date.now());
    } catch (err) {
      console.warn('[Cloud Sync] Lỗi đồng bộ tài khoản từ Supabase:', err);
    } finally {
      setIsSyncingUsers(false);
    }
  }, []);

  // Lắng nghe Supabase Realtime & tải dữ liệu đám mây khi khởi động
  useEffect(() => {
    // 1. Tải dữ liệu ban đầu
    syncUserAccountsWithCloud();

    // 2. Lắng nghe thay đổi tức thì từ Supabase Realtime (khi máy khác thêm/sửa/xóa tài khoản)
    const unsubscribeRealtime = subscribeToUserAccountsRealtime((remoteAccounts) => {
      if (Array.isArray(remoteAccounts) && remoteAccounts.length > 0) {
        console.log('[Realtime] Nhận cập nhật danh sách tài khoản từ máy khác:', remoteAccounts.length, 'người dùng');
        const hasAdmin = remoteAccounts.some(u => u.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
        const finalized = hasAdmin ? remoteAccounts : [DEFAULT_SUPER_ADMIN, ...remoteAccounts];
        
        setUserAccounts(finalized);
        localStorage.setItem('qlts_user_accounts', JSON.stringify(finalized));
        setLastUserSyncTime(Date.now());

        // Cập nhật người dùng hiện tại nếu thông tin hoặc quyền hạn bị thay đổi từ máy khác
        setCurrentUser(curr => {
          if (!curr) return curr;
          const updated = finalized.find(u => u.email?.toLowerCase() === curr.email?.toLowerCase());
          if (updated) {
            return {
              ...curr,
              ...updated,
              // Giữ lại session hiện tại
              lastLogin: curr.lastLogin
            };
          }
          return curr;
        });
      }
    });

    // 3. Lắng nghe session Supabase Auth nếu có
    const supabase = getSupabaseClient();
    let authListener = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const email = session.user.email?.toLowerCase();
          const isSA = email === SUPER_ADMIN_EMAIL.toLowerCase();

          setUserAccounts(currentList => {
            const existing = currentList.find(u => u.email?.toLowerCase() === email);
            const profile = existing || {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Người dùng',
              avatar: session.user.user_metadata?.avatar_url || null,
              role: isSA ? 'SUPER_ADMIN' : 'QUAN_LY_PHONG',
              isSuperAdmin: isSA,
              departmentId: isSA ? 'ALL' : '',
              departmentName: isSA ? 'Toàn trường' : 'Chưa gán phòng ban',
              permissions: isSA ? { ...SUPER_ADMIN_PERMISSIONS } : { ...DEFAULT_PERMISSIONS },
              status: 'active',
              forcePasswordChange: false,
              lastLogin: new Date().toISOString()
            };

            setCurrentUser(profile);
            setIsLoggedIn(true);

            if (!existing) {
              const nextList = [...currentList, profile];
              pushUserAccountsToSupabase(nextList).catch(console.warn);
              return nextList;
            }
            return currentList;
          });
        }
      });
      authListener = data;
    }

    return () => {
      unsubscribeRealtime();
      authListener?.subscription?.unsubscribe();
    };
  }, [syncUserAccountsWithCloud]);


  // ================= ĐĂNG NHẬP BẰNG EMAIL & MẬT KHẨU =================
  const loginWithPassword = async (email, password) => {
    const cleanEmail = cleanText(email).toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      throw new Error('Vui lòng nhập đầy đủ Email và Mật khẩu.');
    }

    const supabase = getSupabaseClient();
    let supabaseLoggedIn = false;

    // 1. Thử đăng nhập qua Supabase Auth nếu có client
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass
        });

        if (!error && data?.user) {
          supabaseLoggedIn = true;
        }
      } catch (e) {
        console.warn('[Supabase Auth] Đăng nhập online không thành công, thử cơ chế nội bộ:', e);
      }
    }

    // 2. Tìm tài khoản trong danh mục người dùng hệ thống (Hoạt động cả khi offline)
    const isSA = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
    let currentAccounts = userAccounts;
    let matchedAccount = currentAccounts.find(u => u.email?.toLowerCase() === cleanEmail);

    // Nếu không tìm thấy cục bộ và không phải Super Admin, thử kéo dữ liệu mới nhất từ Supabase Cloud
    if (!matchedAccount && !isSA) {
      try {
        const remote = await fetchUserAccountsFromSupabase();
        if (remote?.accounts && Array.isArray(remote.accounts) && remote.accounts.length > 0) {
          currentAccounts = remote.accounts;
          setUserAccounts(currentAccounts);
          localStorage.setItem('qlts_user_accounts', JSON.stringify(currentAccounts));
          matchedAccount = currentAccounts.find(u => u.email?.toLowerCase() === cleanEmail);
        }
      } catch (err) {
        console.warn('[Auth] Lỗi fetch tài khoản từ cloud khi login:', err);
      }
    }

    // Xác thực tài khoản Super Admin mặc định
    if (isSA) {
      // Mật khẩu mặc định hoặc mật khẩu đã lưu
      const storedPass = localStorage.getItem('qlts_admin_password') || 'Admin@123456';
      if (!supabaseLoggedIn && cleanPass !== storedPass && cleanPass !== 'Admin@123456') {
        throw new Error('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
      }

      const adminUser = {
        ...(matchedAccount || DEFAULT_SUPER_ADMIN),
        isSuperAdmin: true,
        role: 'SUPER_ADMIN',
        departmentId: 'ALL',
        departmentName: 'Toàn trường',
        permissions: { ...SUPER_ADMIN_PERMISSIONS },
        lastLogin: new Date().toISOString()
      };

      setCurrentUser(adminUser);
      setIsLoggedIn(true);
      return adminUser;
    }

    // Xác thực tài khoản Quản lý phòng ban
    if (!matchedAccount) {
      if (!supabaseLoggedIn) {
        throw new Error('Tài khoản chưa được Super Admin cấp phép vào hệ thống.');
      }
    }

    // Kiểm tra trạng thái khóa tài khoản
    if (matchedAccount && matchedAccount.status === 'locked') {
      throw new Error('Tài khoản này đã bị Super Admin tạm khóa. Vui lòng liên hệ quản trị viên!');
    }

    // Kiểm tra mật khẩu tài khoản Quản lý phòng nếu chưa qua Supabase
    if (!supabaseLoggedIn && matchedAccount) {
      const validPass = matchedAccount.password || matchedAccount.initialPassword || '123456';
      if (cleanPass !== validPass) {
        throw new Error('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
      }
    }

    const loggedUser = {
      ...matchedAccount,
      lastLogin: new Date().toISOString()
    };

    setCurrentUser(loggedUser);
    setIsLoggedIn(true);
    return loggedUser;
  };

  // ================= ĐỔI MẬT KHẨU (BẮT BUỘC HOẶC TÙY CHỌN) =================
  const changePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
    }

    // 1. Nếu có Supabase Auth, cập nhật lên server
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch (e) {
        console.warn('[Supabase Auth] Lỗi cập nhật mật khẩu online:', e);
      }
    }

    // 2. Cập nhật mật khẩu trong local state
    if (currentUser?.isSuperAdmin) {
      localStorage.setItem('qlts_admin_password', newPassword);
    }

    const updatedUser = {
      ...currentUser,
      password: newPassword,
      forcePasswordChange: false
    };

    setCurrentUser(updatedUser);

    const updatedAccounts = userAccounts.map(u => 
      u.email?.toLowerCase() === currentUser?.email?.toLowerCase()
        ? { ...u, password: newPassword, forcePasswordChange: false, updatedAt: new Date().toISOString() }
        : u
    );

    setUserAccounts(updatedAccounts);
    localStorage.setItem('qlts_user_accounts', JSON.stringify(updatedAccounts));

    // Đẩy đồng bộ lên Supabase Cloud
    try {
      await pushUserAccountsToSupabase(updatedAccounts);
    } catch (e) {
      console.warn('[Supabase] Lỗi đồng bộ mật khẩu lên cloud:', e);
    }

    // Cập nhật bảng user_profiles trên Supabase nếu có
    if (supabase && currentUser?.id) {
      try {
        await supabase
          .from('user_profiles')
          .update({ force_password_change: false, updated_at: new Date().toISOString() })
          .eq('email', currentUser.email);
      } catch (e) {
        console.warn('[Supabase] Không thể update user_profiles force_password_change:', e);
      }
    }

    return true;
  };

  // ================= ĐĂNG XUẤT =================
  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Lỗi đăng xuất Supabase:', e);
      }
    }
    setIsLoggedIn(false);
  };

  // ================= DÀNH CHO SUPER ADMIN: QUẢN LÝ TÀI KHOẢN PHÒNG BAN =================
  
  // 1. Tạo tài khoản mới cho Quản lý phòng ban
  const createUserAccount = async ({
    email,
    name,
    phone,
    departmentId,
    departmentName,
    initialPassword = 'Truong@2026',
    permissions = DEFAULT_PERMISSIONS
  }) => {
    const cleanEmail = cleanText(email).toLowerCase();
    if (!cleanEmail) throw new Error('Vui lòng nhập địa chỉ Email.');
    if (!departmentId || !departmentName) throw new Error('Vui lòng chọn Phòng / Ban phụ trách.');

    // Kiểm tra email trùng
    if (userAccounts.some(u => u.email?.toLowerCase() === cleanEmail)) {
      throw new Error(`Email "${cleanEmail}" đã tồn tại trong danh sách người dùng.`);
    }

    const newAccount = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanText(name) || `Quản lý ${departmentName}`,
      phone: cleanText(phone),
      departmentId,
      departmentName,
      role: 'QUAN_LY_PHONG',
      isSuperAdmin: false,
      permissions: { ...permissions },
      password: initialPassword,
      initialPassword,
      status: 'active',
      forcePasswordChange: true, // Bắt buộc đổi mật khẩu lần đầu
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextAccounts = [newAccount, ...userAccounts];
    setUserAccounts(nextAccounts);
    localStorage.setItem('qlts_user_accounts', JSON.stringify(nextAccounts));

    // Đẩy ngay lập tức lên Supabase Cloud app_database (id='user_accounts')
    try {
      await pushUserAccountsToSupabase(nextAccounts);
      console.log('[Supabase Cloud] Đã đồng bộ tài khoản mới lên đám mây thành công:', cleanEmail);
    } catch (cloudErr) {
      console.error('[Supabase Cloud] Lỗi đồng bộ tài khoản mới lên đám mây:', cloudErr);
    }

    // Đăng ký tài khoản trên Supabase Auth và user_profiles nếu online
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: authData } = await supabase.auth.signUp({
          email: cleanEmail,
          password: initialPassword,
          options: {
            data: { full_name: newAccount.name, department_id: departmentId }
          }
        });

        const authId = authData?.user?.id;

        // Lưu vào bảng public.user_profiles nếu bảng này tồn tại
        await supabase.from('user_profiles').upsert({
          auth_id: authId,
          email: cleanEmail,
          full_name: newAccount.name,
          phone: newAccount.phone,
          department_id: departmentId,
          department_name: departmentName,
          role: 'QUAN_LY_PHONG',
          is_super_admin: false,
          permissions: newAccount.permissions,
          is_active: true,
          force_password_change: true
        });
      } catch (err) {
        console.warn('[Supabase] Dự phòng user_profiles (tiếp tục qua app_database):', err.message);
      }
    }

    return newAccount;
  };

  // 2. Cập nhật quyền hạn cho tài khoản
  const updateUserPermissions = async (userId, newPermissions) => {
    let affectedEmail = null;
    const nextAccounts = userAccounts.map(u => {
      if (u.id === userId || u.email === userId) {
        affectedEmail = u.email;
        return { 
          ...u, 
          permissions: { ...newPermissions },
          updatedAt: new Date().toISOString()
        };
      }
      return u;
    });

    setUserAccounts(nextAccounts);
    localStorage.setItem('qlts_user_accounts', JSON.stringify(nextAccounts));

    // Nếu là tài khoản đang đăng nhập, cập nhật ngay lập tức
    if (currentUser && (currentUser.id === userId || currentUser.email === userId || currentUser.email === affectedEmail)) {
      setCurrentUser(curr => ({ ...curr, permissions: { ...newPermissions } }));
    }

    // Đồng bộ tức thì lên Supabase Cloud
    try {
      await pushUserAccountsToSupabase(nextAccounts);
    } catch (e) {
      console.warn('[Supabase Cloud] Lỗi cập nhật quyền lên cloud:', e);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('user_profiles')
          .update({ permissions: newPermissions, updated_at: new Date().toISOString() })
          .or(`id.eq.${userId},email.eq.${userId}`);
      } catch (e) {
        console.warn('[Supabase] Không thể cập nhật quyền user_profiles online:', e.message);
      }
    }
  };

  // 3. Đặt lại mật khẩu tài khoản
  const resetUserPassword = async (userId, newPassword = 'Truong@2026') => {
    const nextAccounts = userAccounts.map(u => {
      if (u.id === userId || u.email === userId) {
        return {
          ...u,
          password: newPassword,
          initialPassword: newPassword,
          forcePasswordChange: true,
          updatedAt: new Date().toISOString()
        };
      }
      return u;
    });

    setUserAccounts(nextAccounts);
    localStorage.setItem('qlts_user_accounts', JSON.stringify(nextAccounts));

    // Đồng bộ tức thì lên Supabase Cloud
    try {
      await pushUserAccountsToSupabase(nextAccounts);
    } catch (e) {
      console.warn('[Supabase Cloud] Lỗi reset mật khẩu lên cloud:', e);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('user_profiles')
          .update({ force_password_change: true, updated_at: new Date().toISOString() })
          .or(`id.eq.${userId},email.eq.${userId}`);
      } catch (e) {
        console.warn('[Supabase] Không thể reset mật khẩu user_profiles online:', e.message);
      }
    }
  };

  // 4. Khóa / Mở khóa tài khoản
  const toggleUserStatus = async (userId) => {
    let newStatus = 'active';
    const nextAccounts = userAccounts.map(u => {
      if (u.id === userId || u.email === userId) {
        if (u.isSuperAdmin || u.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          throw new Error('Không thể khóa tài khoản Super Admin tối cao!');
        }
        newStatus = u.status === 'active' ? 'locked' : 'active';
        return { ...u, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return u;
    });

    setUserAccounts(nextAccounts);
    localStorage.setItem('qlts_user_accounts', JSON.stringify(nextAccounts));

    // Đồng bộ tức thì lên Supabase Cloud
    try {
      await pushUserAccountsToSupabase(nextAccounts);
    } catch (e) {
      console.warn('[Supabase Cloud] Lỗi cập nhật trạng thái user lên cloud:', e);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('user_profiles')
          .update({ is_active: newStatus === 'active', updated_at: new Date().toISOString() })
          .or(`id.eq.${userId},email.eq.${userId}`);
      } catch (e) {
        console.warn('[Supabase] Không thể cập nhật trạng thái user_profiles online:', e.message);
      }
    }
  };

  // 5. Xóa tài khoản
  const deleteUserAccount = async (userId) => {
    const target = userAccounts.find(u => u.id === userId || u.email === userId);
    if (target?.isSuperAdmin || target?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Không thể xóa tài khoản Super Admin tối cao!');
    }

    const nextAccounts = userAccounts.filter(u => u.id !== userId && u.email !== userId);
    setUserAccounts(nextAccounts);
    localStorage.setItem('qlts_user_accounts', JSON.stringify(nextAccounts));

    // Đồng bộ tức thì lên Supabase Cloud
    try {
      await pushUserAccountsToSupabase(nextAccounts);
    } catch (e) {
      console.warn('[Supabase Cloud] Lỗi xóa user khỏi cloud:', e);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('user_profiles')
          .delete()
          .or(`id.eq.${userId},email.eq.${userId}`);
      } catch (e) {
        console.warn('[Supabase] Không thể xóa user_profiles online:', e.message);
      }
    }
  };

  // ================= TÍNH TOÁN BỘ QUYỀN HẠN THỐNG NHẤT =================
  const isSuperAdmin = useMemo(() => {
    return Boolean(
      currentUser?.isSuperAdmin || 
      currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
      currentUser?.role === 'SUPER_ADMIN'
    );
  }, [currentUser]);

  const permissions = useMemo(() => {
    const userPerms = currentUser?.permissions || {};

    return {
      isAdmin: isSuperAdmin,
      isSuperAdmin,
      isDepartmentManager: !isSuperAdmin,
      departmentId: isSuperAdmin ? 'ALL' : (currentUser?.departmentId || ''),
      departmentName: isSuperAdmin ? 'Toàn trường' : (currentUser?.departmentName || ''),

      // Thao tác với tài sản phòng ban
      canManageAssets: isSuperAdmin || Boolean(userPerms.asset_create || userPerms.asset_edit),
      canCreateAsset: isSuperAdmin || Boolean(userPerms.asset_create),
      canEditAsset: isSuperAdmin || Boolean(userPerms.asset_edit),
      canDeleteAsset: isSuperAdmin || Boolean(userPerms.asset_delete),
      canPrintQR: isSuperAdmin || Boolean(userPerms.asset_print_qr !== false),
      canExportExcel: isSuperAdmin || Boolean(userPerms.asset_export !== false),

      // DUYỆT BIẾN ĐỘNG: DUY NHẤT SUPER ADMIN MỚI ĐƯỢC PHÊ DUYỆT
      canApproveTransfer: isSuperAdmin,
      canApproveLiquidation: isSuperAdmin,
      canApproveRecall: isSuperAdmin,

      // ĐỀ XUẤT BIẾN ĐỘNG TỪ CÁC PHÒNG BAN
      canProposeTransfer: isSuperAdmin || Boolean(userPerms.transfer_propose !== false),
      canProposeLiquidation: isSuperAdmin || Boolean(userPerms.liquidation_propose),
      canProposeRecall: isSuperAdmin || Boolean(userPerms.recall_propose),

      // KIỂM KÊ
      canAudit: isSuperAdmin || Boolean(userPerms.inventory_scan !== false),

      // QUẢN TRỊ HỆ THỐNG
      canManageUsers: isSuperAdmin,
      canManageLocations: isSuperAdmin
    };
  }, [isSuperAdmin, currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoggedIn,
      isSuperAdmin,
      permissions,
      userAccounts,
      isSyncingUsers,
      lastUserSyncTime,
      // Synchronization Actions
      syncUserAccountsNow: syncUserAccountsWithCloud,
      // Authentication Actions
      loginWithPassword,
      changePassword,
      logout,
      // Super Admin User Management Actions
      createUserAccount,
      updateUserPermissions,
      resetUserPassword,
      toggleUserStatus,
      deleteUserAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
