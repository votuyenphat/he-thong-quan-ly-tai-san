// src/pages/AlertsPage.jsx
import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import { formatVND, formatDate } from '../utils/formatters';
import { ConditionBadge, StatusBadge } from '../components/common/Badge';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  HelpCircle,
  Calendar,
  ArrowRight,
  Boxes,
  GraduationCap,
  Wrench,
  FileSpreadsheet,
  Trash2,
  Cpu
} from 'lucide-react';

export default function AlertsPage({ setActiveTab }) {
  const { alerts } = useAssets();
  const [selectedAlertTab, setSelectedAlertTab] = useState('obsoleteTraining');

  const alertTabs = [
    {
      id: 'obsoleteTraining',
      title: 'Lạc hậu / Không phù hợp đào tạo',
      count: alerts.obsoleteTraining?.length || 0,
      icon: GraduationCap,
      color: '#dc2626',
      bg: '#fef2f2',
      list: alerts.obsoleteTraining || [],
      desc: 'Trang thiết bị cũ, công nghệ lạc hậu, cấu hình không đáp ứng chuẩn chương trình đào tạo của Nhà trường cần thay thế/nâng cấp'
    },
    {
      id: 'damagedNeedsRepair',
      title: 'Hỏng cần sửa / bảo trì',
      count: alerts.damagedNeedsRepair?.length || 0,
      icon: Wrench,
      color: '#ea580c',
      bg: '#fff7ed',
      list: alerts.damagedNeedsRepair || [],
      desc: 'Thiết bị tại giảng đường, phòng Lab, xưởng thực hành báo hỏng cần kiểm tra kỹ thuật hoặc sửa chữa linh kiện'
    },
    {
      id: 'expiringSoon',
      title: 'Sắp hết hạn sử dụng',
      count: alerts.expiringSoon?.length || 0,
      icon: Calendar,
      color: '#7c3aed',
      bg: '#f5f3ff',
      list: alerts.expiringSoon || [],
      desc: 'Tài sản đã khấu hao gần hết (thời hạn sử dụng còn dưới 1 năm) cần lập kế hoạch đầu tư thay thế'
    },
    {
      id: 'pendingLiquidation',
      title: 'Đề nghị thanh lý',
      count: alerts.pendingLiquidation?.length || 0,
      icon: AlertTriangle,
      color: '#d97706',
      bg: '#fef3c7',
      list: alerts.pendingLiquidation || [],
      desc: 'Hồ sơ tài sản hỏng nặng đã lập tờ trình đang chờ Ban Giám Hiệu phê duyệt thanh lý'
    },
    {
      id: 'wrongLocation',
      title: 'Sai vị trí thực tế',
      count: alerts.wrongLocation?.length || 0,
      icon: AlertTriangle,
      color: '#0284c7',
      bg: '#f0f9ff',
      list: alerts.wrongLocation || [],
      desc: 'Phát hiện tài sản đang nằm ở phòng ban/địa điểm khác với hồ sơ sổ sách đăng ký'
    },
    {
      id: 'missing',
      title: 'Không tìm thấy (Mất)',
      count: alerts.missing?.length || 0,
      icon: HelpCircle,
      color: '#991b1b',
      bg: '#fee2e2',
      list: alerts.missing || [],
      desc: 'Tài sản được ghi nhận mất dấu hoặc không tìm thấy tại vị trí được giao'
    }
  ];

  const currentTabInfo = alertTabs.find(t => t.id === selectedAlertTab) || alertTabs[0];

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <ShieldAlert size={26} color="#dc2626" />
            Trung Tâm Giám Sát & Cảnh Báo Thiết Bị Đào Tạo
          </h2>
          <p className="page-subtitle">
            Hệ thống tự động phát hiện thiết bị lạc hậu, không đáp ứng chuẩn giảng dạy, hư hỏng gián đoạn thực hành và hết hạn khấu hao
          </p>
        </div>
      </div>

      {/* Alert Tabs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                  {tab.title}
                </span>
                <Icon size={18} color={tab.color} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: tab.color, marginTop: 4 }}>
                {tab.count} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>thiết bị</span>
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
            <h3 className="card-title" style={{ margin: 0, color: currentTabInfo.color, display: 'flex', alignItems: 'center', gap: 8 }}>
              <currentTabInfo.icon size={20} />
              {currentTabInfo.title} ({currentTabInfo.count} thiết bị)
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: 3 }}>
              {currentTabInfo.desc}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {currentTabInfo.id === 'obsoleteTraining' && (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('reports')}>
                  <FileSpreadsheet size={14} />
                  Xuất Báo cáo Mua sắm Bổ sung
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setActiveTab('liquidation')}>
                  <Trash2 size={14} />
                  Lập Hội đồng Thanh lý
                </button>
              </>
            )}
            {currentTabInfo.id === 'damagedNeedsRepair' && (
              <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('transfer')}>
                <ArrowRight size={14} />
                Lập phiếu điều chuyển về Xưởng bảo trì
              </button>
            )}
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
                <th>Mã thiết bị</th>
                <th>Tên thiết bị</th>
                <th>Khoa / Phòng Lab</th>
                <th>Vị trí chi tiết</th>
                {currentTabInfo.id === 'obsoleteTraining' ? (
                  <>
                    <th>Cấu hình / Thông số KT</th>
                    <th>Đánh giá đào tạo</th>
                    <th>Lý do không phù hợp</th>
                  </>
                ) : (
                  <>
                    <th>Người phụ trách</th>
                    <th style={{ textAlign: 'center' }}>Tình trạng</th>
                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                  </>
                )}
                <th style={{ textAlign: 'right' }}>Nguyên giá</th>
              </tr>
            </thead>
            <tbody>
              {currentTabInfo.list.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#10b981', fontWeight: 600 }}>
                    ✓ Tuyệt vời! Hiện tại không có thiết bị nào thuộc diện cảnh báo này.
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
                        {asset.brand ? `${asset.brand} • ` : ''}{asset.type}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{asset.departmentName}</td>
                    <td style={{ fontSize: '0.8rem', color: '#475569' }}>{asset.locationPath}</td>

                    {currentTabInfo.id === 'obsoleteTraining' ? (
                      <>
                        <td style={{ fontSize: '0.75rem', color: '#0f172a', maxWidth: '220px' }}>
                          {asset.technicalSpecs ? (
                            <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                              <Cpu size={12} style={{ display: 'inline', marginRight: 4 }} />
                              {asset.technicalSpecs}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật thông số</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <GraduationCap size={13} />
                            {asset.trainingSuitability || 'Lạc hậu đào tạo'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 500, maxWidth: '240px' }}>
                          {asset.obsoleteReason || (asset.condition === 'Không sử dụng được' ? 'Hỏng nặng không thể vận hành giảng dạy' : 'Không đáp ứng chuẩn khung chương trình đào tạo')}
                        </td>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}

                    <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
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
