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
  Menu
} from 'lucide-react';
import SyncStatusBadge from '../common/SyncStatusBadge';

export default function Navbar({ setActiveTab, onOpenMobileMenu }) {
  const { currentUser, switchRole, logout } = useAuth();
  const { alerts } = useAssets();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          color: '#ffffff',
          borderRadius: '10px',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 6px rgba(37,99,235,0.25)',
          flexShrink: 0
        }}>
          <Building2 size={20} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 className="navbar-title" style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            HỆ THỐNG QUẢN LÝ TÀI SẢN
          </h1>
          <div className="navbar-subtitle" style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
            Cơ sở dữ liệu tập trung 2026 • {currentUser?.department || 'Trường Đại học'}
          </div>
        </div>
      </div>

      {/* Action Center: Role Switcher, Alerts, User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Real-time Multi-Device Sync Indicator */}
        <SyncStatusBadge />

        {/* Quick Role Switcher (4 Roles) */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{ 
              background: '#eff6ff', 
              color: '#1e40af', 
              borderColor: '#bfdbfe',
              fontWeight: 600,
              fontSize: '0.8rem',
              padding: '6px 10px'
            }}
          >
            <Shield size={14} />
            <span className="navbar-role-text">{currentUser?.role}</span>
            <ChevronDown size={14} />
          </button>

          {showRoleMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '110%',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-light)',
              width: '260px',
              padding: '8px',
              zIndex: 200
            }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', padding: '6px 10px', textTransform: 'uppercase' }}>
                Chuyển nhanh 4 vai trò kiểm thử:
              </div>
              {PRESET_USERS.map((u) => (
                <div
                  key={u.role}
                  onClick={() => {
                    switchRole(u.role);
                    setShowRoleMenu(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                    background: currentUser?.role === u.role ? '#eff6ff' : 'transparent',
                    color: currentUser?.role === u.role ? '#1d4ed8' : '#334155',
                    fontWeight: currentUser?.role === u.role ? 600 : 400,
                    transition: 'background 150ms'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = currentUser?.role === u.role ? '#eff6ff' : 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{u.role}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                    {u.name}
                  </div>
                </div>
              ))}
            </div>
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
                  background: '#dcfce7', 
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  marginTop: '6px'
                }}>
                  ● {currentUser?.status} (Google Auth)
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} />
                  <span>Đăng nhập: {formatDateTime(currentUser?.lastLogin)}</span>
                </div>
                <div>Đơn vị: <strong>{currentUser?.department}</strong></div>
                <div>Vai trò: <strong>{currentUser?.role}</strong></div>
              </div>

              <button 
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="btn btn-secondary btn-sm" 
                style={{ width: '100%', marginTop: '14px', color: '#dc2626' }}
              >
                <LogOut size={14} />
                Đăng xuất tài khoản
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
