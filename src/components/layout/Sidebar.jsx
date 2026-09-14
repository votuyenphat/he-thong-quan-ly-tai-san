// src/components/layout/Sidebar.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAssets } from '../../context/AssetContext';
import {
  LayoutDashboard,
  Boxes,
  PlusCircle,
  ArrowLeftRight,
  RotateCcw,
  Trash2,
  FolderTree,
  MapPin,
  FileSpreadsheet,
  History,
  ShieldAlert,
  Users,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, onClose }) {
  const { permissions, currentUser } = useAuth();
  const { alerts } = useAssets();

  const totalAlerts = 
    alerts.wrongLocation.length + 
    alerts.missing.length + 
    alerts.pendingLiquidation.length + 
    alerts.expiringSoon.length;

  const menuSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        { id: 'dashboard', label: 'Dashboard Tổng quan', icon: LayoutDashboard, visible: true },
        { 
          id: 'alerts', 
          label: 'Trung tâm Cảnh báo', 
          icon: ShieldAlert, 
          visible: true,
          badge: totalAlerts > 0 ? totalAlerts : null
        }
      ]
    },
    {
      title: 'QUẢN LÝ TÀI SẢN',
      items: [
        { id: 'assets', label: 'Danh mục Tài sản', icon: Boxes, visible: true },
        { id: 'inbound', label: 'Nhập tài sản mới', icon: PlusCircle, visible: permissions.canCreateAsset },
        { id: 'transfer', label: 'Điều chuyển tài sản', icon: ArrowLeftRight, visible: true },
        { id: 'recall', label: 'Thu hồi tài sản', icon: RotateCcw, visible: permissions.isSuperAdmin || permissions.canProposeRecall },
        { id: 'liquidation', label: 'Thanh lý tài sản', icon: Trash2, visible: permissions.isSuperAdmin || permissions.canProposeLiquidation }
      ]
    },
    {
      title: 'CƠ CẤU & ĐỊA ĐIỂM',
      items: [
        { id: 'departments', label: 'Cây Phòng/Ban', icon: FolderTree, visible: true },
        { id: 'locations', label: 'Vị trí (4 Cấp)', icon: MapPin, visible: true }
      ]
    },
    {
      title: 'BÁO CÁO & HỆ THỐNG',
      items: [
        { id: 'reports', label: 'Báo cáo (Excel / PDF)', icon: FileSpreadsheet, visible: true },
        { id: 'users', label: 'Tài khoản & Phân quyền', icon: Users, visible: permissions.isSuperAdmin },
        { id: 'audit', label: 'Nhật ký Hệ thống', icon: History, visible: permissions.isSuperAdmin }
      ]
    }
  ];

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onClose} />
      )}
      <aside className={`sidebar no-print ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand area */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '15px'
            }}>
              TS
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', letterSpacing: '0.02em', color: '#ffffff' }}>
                QUẢN LÝ TÀI SẢN
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Phiên bản 2026 Pro
              </div>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {menuSections.map((section, sIdx) => {
            const visibleItems = section.items.filter(item => item.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  color: '#64748b',
                  padding: '0 12px 6px',
                  letterSpacing: '0.06em'
                }}>
                  {section.title}
                </div>

                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (onClose) onClose();
                      }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isActive ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : 'transparent',
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      fontWeight: isActive ? 600 : 500,
                      marginBottom: '3px',
                      textAlign: 'left',
                      transition: 'all 180ms ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = '#1e293b';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={17} color={isActive ? '#ffffff' : '#94a3b8'} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span style={{
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Role Footer Notice */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #1e293b',
        background: '#0b1120',
        fontSize: '0.75rem',
        color: '#94a3b8'
      }}>
        <div style={{ color: '#ffffff', fontWeight: '600' }}>
          {currentUser?.role}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
          {currentUser?.description}
        </div>
      </div>
    </aside>
    </>
  );
}
