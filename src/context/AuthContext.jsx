// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRESET_USERS } from '../data/mockData';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Default to Admin or loaded from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('qlts_auth_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      ...PRESET_USERS[0],
      lastLogin: new Date().toISOString(),
      status: 'Đang hoạt động'
    };
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem('qlts_is_logged_in');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('qlts_auth_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('qlts_is_logged_in', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  const loginWithGoogle = (email, name, picture) => {
    const newUser = {
      role: '👑 Quản trị viên', // Default role if new Google user
      name: name || 'Người dùng Google',
      email: email || 'user@truong.edu.vn',
      avatar: picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      department: 'Phòng Hành chính - Quản trị',
      description: 'Đăng nhập bảo mật qua tài khoản Google Workspace',
      lastLogin: new Date().toISOString(),
      status: 'Đang hoạt động'
    };
    setCurrentUser(newUser);
    setIsLoggedIn(true);
  };

  const switchRole = (roleName) => {
    const target = PRESET_USERS.find(u => u.role === roleName) || PRESET_USERS[0];
    const updated = {
      ...target,
      lastLogin: new Date().toISOString(),
      status: 'Đang hoạt động'
    };
    setCurrentUser(updated);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  // Helper check permissions
  const permissions = {
    isAdmin: currentUser?.role.includes('Quản trị viên'),
    isStorekeeper: currentUser?.role.includes('Thủ kho') || currentUser?.role.includes('Quản trị viên'),
    isDeptHead: currentUser?.role.includes('Trưởng phòng') || currentUser?.role.includes('Quản trị viên'),
    isUser: true,
    canManageAssets: currentUser?.role.includes('Quản trị viên') || currentUser?.role.includes('Thủ kho'),
    canApproveTransfer: currentUser?.role.includes('Quản trị viên') || currentUser?.role.includes('Trưởng phòng'),
    canApproveLiquidation: currentUser?.role.includes('Quản trị viên'),
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoggedIn,
      loginWithGoogle,
      switchRole,
      logout,
      permissions
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
