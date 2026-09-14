// src/components/layout/Navbar.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAssets } from '../../context/AssetContext';
import { PRESET_USERS } from '../../data/mockData';
import { formatDateTime } from '../../utils/formatters';
import { 
  Bell, 
  ChevronDown, 
  Shield, 
  LogOut,
  Building2,
  Clock,
  Menu,
  Database,
  Users,
  KeyRound
} from 'lucide-react';
import SyncStatusBadge from '../common/SyncStatusBadge';
import SyncModal from '../common/SyncModal';
import ChangePasswordModal from '../common/ChangePasswordModal';

export default function Navbar({ setActiveTab, onOpenMobileMenu }) {
  const { currentUser, switchRole, logout } = useAuth();
  const { alerts } = useAssets();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const totalAlerts = 
    alerts.wrongLocation.length + 
    alerts.missing.length + 
    alerts.pendingLiquidation.length + 
    alerts.expiringSoon.length;

  return (
    <header className="navbar no-print" style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Title & Department context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          title="Mở danh mục chức năng"
          aria-label="Mở menu điều hướng"
        >
          <Menu size={20} />
        </button>

        <img 
          src="/logo.png" 
          alt="Logo Trường" 
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            objectFit: 'contain',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            flexShrink: 0
          }} 
        />
        <div style={{ minWidth: 0 }}>
          <h1 className="navbar-title" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            HỆ THỐNG QUẢN LÝ TÀI SẢN
          </h1>
        </div>
      </div>

      {/* Action Center: Role Switcher, Alerts, User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Real-time Multi-Device Sync Indicator (Auto-hidden when synced) */}
        <SyncStatusBadge onOpenModal={() => setShowSyncModal(true)} />

        {/* Role & Department Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {currentUser?.isSuperAdmin ? (
            <span style={{
              background: '#dcfce7',
              color: '#15803d',
              fontWeight: 700,
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid #bbf7d0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>👑 Super Admin</span>
            </span>
          ) : (
            <span style={{
              background: '#eff6ff',
              color: '#1e40af',
              fontWeight: 700,
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid #bfdbfe',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <Building2 size={13} />
              <span>{currentUser?.departmentName || 'Quản lý phòng'}</span>
            </span>
          )}
        </div>

        {/* Alerts Bell */}
        <button 
          className="btn-icon" 
          style={{ position: 'relative' }}
          onClick={() => setActiveTab('alerts')}
          title="Xem cảnh báo tài sản"
        >
          <Bell size={18} />
          {totalAlerts > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '10px',
              padding: '1px 6px',
              lineHeight: '16px'
            }}>
              {totalAlerts}
            </span>
          )}
        </button>

        {/* User Card */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10, 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '10px',
              transition: 'background 150ms'
            }}
          >
            <img 
              src={currentUser?.avatar} 
              alt={currentUser?.name}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} 
            />
            <div className="navbar-user-text" style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                {currentUser?.name}
              </div>
              <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                {currentUser?.email}
              </div>
            </div>
            <ChevronDown size={14} color="#64748b" />
          </div>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '115%',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-light)',
              width: '280px',
              padding: '14px',
              zIndex: 200
            }}>
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                  {currentUser?.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {currentUser?.email}
                </div>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 4, 
                  background: currentUser?.isSuperAdmin ? '#eff6ff' : '#dcfce7', 
                  color: currentUser?.isSuperAdmin ? '#1d4ed8' : '#15803d',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  marginTop: '6px'
                }}>
                  ● {currentUser?.isSuperAdmin ? 'Super Admin' : (currentUser?.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa')}
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} />
                  <span>Đăng nhập: {formatDateTime(currentUser?.lastLogin)}</span>
                </div>
                <div>Đơn vị: <strong>{currentUser?.departmentName || currentUser?.department || 'Toàn trường'}</strong></div>
                <div>Vai trò: <strong>{currentUser?.isSuperAdmin ? 'Super Admin (Toàn quyền)' : 'Quản lý phòng ban'}</strong></div>
              </div>

              {/* Dành cho Super Admin: Quản lý tài khoản */}
              {currentUser?.isSuperAdmin && (
                <button 
                  onClick={() => {
                    setActiveTab('users');
                    setShowUserMenu(false);
                  }}
                  className="btn btn-secondary btn-sm" 
                  style={{ width: '100%', marginTop: '12px', justifyContent: 'center', gap: 6, color: '#4338ca', background: '#f5f3ff', border: '1px solid #ddd6fe' }}
                  title="Cấp tài khoản và phân quyền cho các phòng ban"
                >
                  <Users size={14} color="#6366f1" />
                  Tài khoản & Phân quyền
                </button>
              )}

              {/* Đổi mật khẩu tài khoản */}
              <button 
                onClick={() => {
                  setShowChangePasswordModal(true);
                  setShowUserMenu(false);
                }}
                className="btn btn-secondary btn-sm" 
                style={{ width: '100%', marginTop: currentUser?.isSuperAdmin ? '6px' : '12px', justifyContent: 'center', gap: 6, color: '#334155', background: '#f8fafc' }}
                title="Thay đổi mật khẩu đăng nhập"
              >
                <KeyRound size={14} color="#64748b" />
                Đổi mật khẩu
              </button>

              {/* Truy cập nhanh Trung tâm sao lưu & quản lý CSDL */}
              <button 
                onClick={() => {
                  setShowSyncModal(true);
                  setShowUserMenu(false);
                }}
                className="btn btn-secondary btn-sm" 
                style={{ width: '100%', marginTop: '6px', justifyContent: 'center', gap: 6, color: '#1e40af', background: '#f8fafc' }}
                title="Sao lưu file JSON hoặc cấu hình CSDL Cloud"
              >
                <Database size={14} color="#2563eb" />
                Sao lưu & Quản lý CSDL
              </button>

              <button 
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="btn btn-secondary btn-sm" 
                style={{ width: '100%', marginTop: '8px', color: '#dc2626' }}
              >
                <LogOut size={14} />
                Đăng xuất tài khoản
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Quản lý đồng bộ & Sao lưu dữ liệu */}
      <SyncModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />

      {/* Modal Đổi mật khẩu tài khoản */}
      <ChangePasswordModal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} />
    </header>
  );
}
