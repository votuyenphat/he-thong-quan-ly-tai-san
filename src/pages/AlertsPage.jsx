// src/pages/AlertsPage.jsx
import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import { formatVND, formatDate } from '../utils/formatters';
import { ConditionBadge, StatusBadge } from '../components/common/Badge';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  Wrench,
  HelpCircle,
  Calendar,
  ArrowRight,
  Boxes
} from 'lucide-react';

export default function AlertsPage({ setActiveTab }) {
  const { alerts } = useAssets();
  const [selectedAlertTab, setSelectedAlertTab] = useState('wrongLocation');

  const alertTabs = [
    {
      id: 'wrongLocation',
      title: 'Sai vị trí thực tế',
      count: alerts.wrongLocation.length,
      icon: AlertTriangle,
      color: '#ea580c',
      bg: '#ffedd5',
      list: alerts.wrongLocation,
      desc: 'Phát hiện tài sản đang nằm ở phòng ban/địa điểm khác với hồ sơ sổ sách đăng ký'
    },
    {
      id: 'missing',
      title: 'Không tìm thấy (Mất)',
      count: alerts.missing.length,
      icon: HelpCircle,
      color: '#dc2626',
      bg: '#fee2e2',
      list: alerts.missing,
      desc: 'Tài sản được ghi nhận mất dấu hoặc không tìm thấy tại vị trí được giao'
    },
    {
      id: 'overdueRepair',
      title: 'Đang sửa chữa quá hạn',
      count: alerts.overdueRepair.length,
      icon: Wrench,
      color: '#2563eb',
      bg: '#eff6ff',
      list: alerts.overdueRepair,
      desc: 'Thiết bị gửi đi bảo hành, sửa chữa quá thời hạn dự kiến chưa bàn giao lại kho'
    },
    {
      id: 'pendingLiquidation',
      title: 'Đề nghị thanh lý',
      count: alerts.pendingLiquidation.length,
      icon: AlertTriangle,
      color: '#d97706',
      bg: '#fef3c7',
      list: alerts.pendingLiquidation,
      desc: 'Hồ sơ tài sản hỏng nặng đã lập tờ trình đang chờ Ban Giám Hiệu phê duyệt thanh lý'
    },
    {
      id: 'expiringSoon',
      title: 'Sắp hết hạn sử dụng',
      count: alerts.expiringSoon.length,
      icon: Calendar,
      color: '#7c3aed',
      bg: '#f5f3ff',
      list: alerts.expiringSoon,
      desc: 'Tài sản đã khấu hao gần hết (thời hạn sử dụng còn dưới 1 năm) cần lập kế hoạch đầu tư thay thế'
    }
  ];

  const currentTabInfo = alertTabs.find(t => t.id === selectedAlertTab) || alertTabs[0];

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <ShieldAlert size={26} color="#dc2626" />
            Trung Tâm Giám Sát & Cảnh Báo Tài Sản
          </h2>
          <p className="page-subtitle">
            Hệ thống tự động rà soát sai lệch vị trí, chậm kiểm kê, hỏng hóc kéo dài và tài sản sắp hết khấu hao
          </p>
        </div>
      </div>

      {/* 6 Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}>
        {alertTabs.map((tab) => {
          const isSelected = selectedAlertTab === tab.id;
          const Icon = tab.icon;

          return (
            <div
              key={tab.id}
              onClick={() => setSelectedAlertTab(tab.id)}
              style={{
                background: isSelected ? tab.bg : '#ffffff',
                border: isSelected ? `2px solid ${tab.color}` : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 150ms',
                boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                  {tab.title}
                </span>
                <Icon size={16} color={tab.color} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: tab.color, marginTop: 4 }}>
                {tab.count} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>TS</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Tab Details Card */}
      <div className="card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div>
            <h3 className="card-title" style={{ margin: 0, color: currentTabInfo.color }}>
              {currentTabInfo.title} ({currentTabInfo.count} tài sản)
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: 2 }}>
              {currentTabInfo.desc}
            </p>
          </div>

          <div>
            {currentTabInfo.id === 'wrongLocation' && (
              <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('transfer')}>
                Lập phiếu điều chuyển <ArrowRight size={14} />
              </button>
            )}
            {currentTabInfo.id === 'pendingLiquidation' && (
              <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('liquidation')}>
                Xem hội đồng thanh lý <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã tài sản</th>
                <th>Tên tài sản</th>
                <th>Đơn vị quản lý</th>
                <th>Vị trí ghi nhận</th>
                <th>Người chịu trách nhiệm</th>
                <th style={{ textAlign: 'center' }}>Tình trạng</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Nguyên giá</th>
              </tr>
            </thead>
            <tbody>
              {currentTabInfo.list.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#10b981', fontWeight: 600 }}>
                    ✓ Hiện tại không có tài sản nào thuộc diện cảnh báo này!
                  </td>
                </tr>
              ) : (
                currentTabInfo.list.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                        {asset.code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{asset.name}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                        {asset.brand} - {asset.model}
                      </div>
                    </td>
                    <td>{asset.departmentName}</td>
                    <td style={{ fontSize: '0.8rem', color: '#475569' }}>{asset.locationPath}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{asset.currentUser}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{asset.responsiblePerson}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <ConditionBadge condition={asset.condition} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <StatusBadge status={asset.status} />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatVND(asset.cost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
