// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
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

  // Lấy hồ sơ từ Supabase user_profiles khi kết nối online
  const fetchProfilesFromSupabase = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        // Hợp nhất dữ liệu hồ sơ từ Supabase vào userAccounts
        setUserAccounts(prev => {
          const map = new Map();
          // Nạp dữ liệu hiện tại
          prev.forEach(u => map.set(u.email?.toLowerCase(), u));
          // Nạp dữ liệu từ server Supabase
          data.forEach(p => {
            const emailKey = p.email?.toLowerCase();
            const isSA = emailKey === SUPER_ADMIN_EMAIL.toLowerCase() || p.is_super_admin;
            map.set(emailKey, {
              id: p.id || `usr-${Date.now()}`,
              email: p.email,
              name: p.full_name || p.email,
              phone: p.phone || '',
              departmentId: isSA ? 'ALL' : p.department_id,
              departmentName: isSA ? 'Toàn trường' : p.department_name,
              role: isSA ? 'SUPER_ADMIN' : 'QUAN_LY_PHONG',
              isSuperAdmin: isSA,
              permissions: isSA ? { ...SUPER_ADMIN_PERMISSIONS } : (p.permissions || { ...DEFAULT_PERMISSIONS }),
              status: p.is_active ? 'active' : 'locked',
              forcePasswordChange: Boolean(p.force_password_change),
              updatedAt: p.updated_at
            });
          });

          // Đảm bảo Super Admin luôn có mặt
          if (!map.has(SUPER_ADMIN_EMAIL.toLowerCase())) {
            map.set(SUPER_ADMIN_EMAIL.toLowerCase(), DEFAULT_SUPER_ADMIN);
          }

          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('[Auth] Không thể tải danh sách profiles từ Supabase:', err);
    }
  }, []);

  // Lắng nghe sự kiện xác thực từ Supabase Auth Realtime
  useEffect(() => {
    fetchProfilesFromSupabase();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const email = session.user.email?.toLowerCase();
        const isSA = email === SUPER_ADMIN_EMAIL.toLowerCase();

        // Tìm hồ sơ tương ứng
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
            return [...currentList, profile];
          }
          return currentList;
        });
      } else if (event === 'SIGNED_OUT') {
        // Không tự động đăng xuất nếu đang dùng session offline
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfilesFromSupabase]);

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
    const matchedAccount = userAccounts.find(u => u.email?.toLowerCase() === cleanEmail);

    // Xác thực tài khoản Super Admin mặc định
    if (isSA) {
      // Mật khẩu mặc định hoặc mật khẩu đã lưu
      const storedPass = localStorage.getItem('qlts_admin_password') || 'Admin@123456';
      if (!supabaseLoggedIn && cleanPass !== storedPass && cleanPass !== 'Admin@123456') {
        throw new Error('Mật khẩu Super Admin không chính xác. Mật khẩu khởi tạo là Admin@123456');
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

  // ================= ĐĂNG NHẬP BẰNG GOOGLE OAUTH =================
  const loginWithGoogleOAuth = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Chưa cấu hình Supabase Client để đăng nhập Google.');
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true
      }
    });

    if (error) {
      throw new Error(`Lỗi đăng nhập Google: ${error.message}`);
    }

    if (data?.url) {
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(
        data.url,
        'GoogleSignIn',
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
      );
      return { popup, url: data.url };
    }
  };

  // ================= ĐĂNG NHẬP NHANH GOOGLE WORKSPACE =================
  const loginWithGoogleDemo = (email = SUPER_ADMIN_EMAIL, name = 'Võ Tuyền Phát (Super Admin)', avatar = null) => {
    const cleanEmail = cleanText(email).toLowerCase();
    const isSA = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
    const matchedAccount = userAccounts.find(u => u.email?.toLowerCase() === cleanEmail);

    const userObj = {
      ...(matchedAccount || DEFAULT_SUPER_ADMIN),
      id: matchedAccount?.id || `usr-google-${Date.now()}`,
      email: cleanEmail,
      name: name || matchedAccount?.name || (isSA ? 'Võ Tuyền Phát (Super Admin)' : cleanEmail),
      avatar: avatar || matchedAccount?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: isSA ? 'SUPER_ADMIN' : (matchedAccount?.role || 'QUAN_LY_PHONG'),
      isSuperAdmin: isSA,
      departmentId: isSA ? 'ALL' : (matchedAccount?.departmentId || ''),
      departmentName: isSA ? 'Toàn trường' : (matchedAccount?.departmentName || ''),
      permissions: isSA ? { ...SUPER_ADMIN_PERMISSIONS } : (matchedAccount?.permissions || { ...DEFAULT_PERMISSIONS }),
      status: 'active',
      forcePasswordChange: false,
      authProvider: 'google',
      lastLogin: new Date().toISOString()
    };

    setCurrentUser(userObj);
    setIsLoggedIn(true);
    return userObj;
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

    setUserAccounts(prev => prev.map(u => 
      u.email?.toLowerCase() === currentUser?.email?.toLowerCase()
        ? { ...u, password: newPassword, forcePasswordChange: false }
        : u
    ));

    // Cập nhật bảng user_profiles trên Supabase nếu có
    if (supabase && currentUser?.id) {
      try {
        await supabase
          .from('user_profiles')
          .update({ force_password_change: false, updated_at: new Date().toISOString() })
          .eq('email', currentUser.email);
      } catch (e) {
        console.warn('[Supabase] Không thể update force_password_change:', e);
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
      createdAt: new Date().toISOString()
    };

    // Đăng ký tài khoản trên Supabase Auth nếu online
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: initialPassword,
          options: {
            data: { full_name: newAccount.name, department_id: departmentId }
          }
        });

        const authId = authData?.user?.id;

        // Lưu vào bảng public.user_profiles
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
        console.warn('[Supabase] Không thể tạo tài khoản Supabase Auth (tiếp tục lưu cục bộ):', err);
      }
    }

    setUserAccounts(prev => [newAccount, ...prev]);
    return newAccount;
  };

  // 2. Cập nhật quyền hạn cho tài khoản
  const updateUserPermissions = async (userId, newPermissions) => {
    setUserAccounts(prev => prev.map(u => {
      if (u.id === userId || u.email === userId) {
        const updated = { ...u, permissions: { ...newPermissions } };
        // Nếu là tài khoản đang đăng nhập, cập nhật ngay lập tức
        if (currentUser?.email === u.email) {
          setCurrentUser(curr => ({ ...curr, permissions: { ...newPermissions } }));
        }
        return updated;
      }
      return u;
    }));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('user_profiles')
          .update({ permissions: newPermissions, updated_at: new Date().toISOString() })
          .or(`id.eq.${userId},email.eq.${userId}`);
      } catch (e) {
        console.warn('[Supabase] Không thể cập nhật quyền online:', e);
      }
    }
  };

  // 3. Đặt lại mật khẩu tài khoản
  const resetUserPassword = async (userId, newPassword = 'Truong@2026') => {
    setUserAccounts(prev => prev.map(u => {
      if (u.id === userId || u.email === userId) {
        return {
          ...u,
          password: newPassword,
          initialPassword: newPassword,
          forcePasswordChange: true
        };
      }
      return u;
    }));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('user_profiles')
          .update({ force_password_change: true, updated_at: new Date().toISOString() })
          .or(`id.eq.${userId},email.eq.${userId}`);
      } catch (e) {
        console.warn('[Supabase] Không thể reset mật khẩu online:', e);
      }
    }
  };

  // 4. Khóa / Mở khóa tài khoản
  const toggleUserStatus = async (userId) => {
    let newStatus = 'active';
    setUserAccounts(prev => prev.map(u => {
      if (u.id === userId || u.email === userId) {
        if (u.isSuperAdmin || u.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          throw new Error('Không thể khóa tài khoản Super Admin tối cao!');
        }
        newStatus = u.status === 'active' ? 'locked' : 'active';
        return { ...u, status: newStatus };
      }
      return u;
    }));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('user_profiles')
          .update({ is_active: newStatus === 'active', updated_at: new Date().toISOString() })
          .or(`id.eq.${userId},email.eq.${userId}`);
      } catch (e) {
        console.warn('[Supabase] Không thể cập nhật trạng thái online:', e);
      }
    }
  };

  // 5. Xóa tài khoản
  const deleteUserAccount = async (userId) => {
    const target = userAccounts.find(u => u.id === userId || u.email === userId);
    if (target?.isSuperAdmin || target?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Không thể xóa tài khoản Super Admin tối cao!');
    }

    setUserAccounts(prev => prev.filter(u => u.id !== userId && u.email !== userId));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('user_profiles')
          .delete()
          .or(`id.eq.${userId},email.eq.${userId}`);
      } catch (e) {
        console.warn('[Supabase] Không thể xóa user profile online:', e);
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
      // Authentication Actions
      loginWithPassword,
      loginWithGoogleOAuth,
      loginWithGoogleDemo,
      changePassword,
      logout,
      // Super Admin User Management Actions
      createUserAccount,
      updateUserPermissions,
      resetUserPassword,
      toggleUserStatus,
      deleteUserAccount,
      fetchProfilesFromSupabase
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
