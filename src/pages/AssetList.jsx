// src/pages/AssetList.jsx
import React, { useState, useMemo } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { formatVND, formatDate } from '../utils/formatters';
import { ConditionBadge, StatusBadge } from '../components/common/Badge';
import AssetDetailModal from './AssetDetailModal';
import QRModal from '../components/common/QRModal';
import AssetFormModal from './AssetFormModal';
import LiquidationQuickModal from './LiquidationQuickModal';
import { exportToExcel } from '../utils/exportExcel';
import {
  Search,
  Plus,
  QrCode,
  Eye,
  FileSpreadsheet,
  Boxes,
  MapPin,
  Building,
  Edit2,
  Trash2,
  AlertTriangle,
  FileX
} from 'lucide-react';

export default function AssetList({ setActiveTab }) {
  const { assets, departments, deleteAsset } = useAssets();
  const { currentUser, permissions } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [qrAsset, setQrAsset] = useState(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  // Quick Liquidation modal state
  const [isLiquidationOpen, setIsLiquidationOpen] = useState(false);
  const [liquidationAsset, setLiquidationAsset] = useState(null);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null); // null or asset object

  // Filter based on User Role & Filters
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (currentUser?.role.includes('Trưởng phòng') && a.departmentName !== currentUser.department) {
        return false;
      }
      if (currentUser?.role.includes('Người dùng') && !a.currentUser?.includes(currentUser.name) && !a.responsiblePerson?.includes(currentUser.name)) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCode = a.code?.toLowerCase().includes(query);
        const matchName = a.name?.toLowerCase().includes(query);
        const matchSerial = a.serial?.toLowerCase().includes(query);
        const matchUser = a.currentUser?.toLowerCase().includes(query) || a.responsiblePerson?.toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchSerial && !matchUser) return false;
      }
      if (selectedDept !== 'ALL' && a.departmentId !== selectedDept && a.departmentName !== selectedDept) return false;
      if (selectedCondition !== 'ALL' && a.condition !== selectedCondition) return false;
      if (selectedStatus !== 'ALL' && a.status !== selectedStatus) return false;
      if (selectedType !== 'ALL' && a.type !== selectedType) return false;
      return true;
    });
  }, [assets, currentUser, searchTerm, selectedDept, selectedCondition, selectedStatus, selectedType]);

  const handleExportExcel = () => {
    const exportData = filteredAssets.map((a, idx) => ({
      'STT': idx + 1,
      'Mã tài sản': a.code,
      'Tên tài sản': a.name,
      'Loại': a.type,
      'Nhóm': a.category,
      'Model': a.model,
      'Serial Number': a.serial,
      'Đơn vị quản lý': a.departmentName,
      'Vị trí cụ thể': a.locationPath,
      'Người chịu trách nhiệm': a.responsiblePerson,
      'Người sử dụng': a.currentUser,
      'Nguyên giá (VNĐ)': a.cost,
      'Ngày mua': a.purchaseDate,
      'Hạn SD (Năm)': a.lifespanYears,
      'Tình trạng': a.condition,
      'Trạng thái': a.status,
      'Ghi chú': a.notes
    }));
    exportToExcel(exportData, `Danh_Muc_Tai_San_${new Date().getFullYear()}.xlsx`);
  };

  const handleOpenDetail = (asset) => {
    setSelectedAsset(asset);
    setIsDetailOpen(true);
  };

  const handleOpenQR = (asset) => {
    setQrAsset(asset);
    setIsQROpen(true);
  };

  const handleOpenEdit = (asset) => {
    setEditAsset(asset);
    setIsEditOpen(true);
  };

  const handleOpenLiquidation = (asset) => {
    setLiquidationAsset(asset);
    setIsLiquidationOpen(true);
  };

  const handleDeleteConfirm = (asset) => {
    setDeleteConfirm(asset);
  };

  const handleDeleteExecute = () => {
    if (deleteConfirm) {
      deleteAsset(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const assetTypes = [...new Set(assets.map(a => a.type).filter(Boolean))];

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Boxes size={26} color="#1e3a8a" />
            Danh Mục Tài Sản Toàn Đơn Vị
          </h2>
          <p className="page-subtitle">
            Hệ thống quản lý định danh số, tra cứu vị trí, người sử dụng và in tem mã QR
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} />
            Xuất Excel ({filteredAssets.length})
          </button>
          {permissions.canManageAssets && (
            <button className="btn btn-primary" onClick={() => setActiveTab('inbound')}>
              <Plus size={16} />
              Nhập tài sản mới
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: 20, padding: '18px 20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          alignItems: 'center'
        }}>
          {/* Search box */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Tìm theo mã, tên tài sản, serial number, người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Dept Filter */}
          <div>
            <select
              className="form-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              disabled={currentUser?.role.includes('Trưởng phòng')}
            >
              <option value="ALL">-- Tất cả Phòng/Ban --</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <select
              className="form-select"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
            >
              <option value="ALL">-- Tình trạng (Tất cả) --</option>
              <option value="Tốt">Tốt</option>
              <option value="Khá">Khá</option>
              <option value="Hỏng nhẹ">Hỏng nhẹ</option>
              <option value="Hỏng nặng">Hỏng nặng</option>
              <option value="Không sử dụng được">Không sử dụng được</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">-- Trạng thái (Tất cả) --</option>
              <option value="Đang sử dụng">Đang sử dụng</option>
              <option value="Trong kho">Trong kho</option>
              <option value="Đang sửa chữa">Đang sửa chữa</option>
              <option value="Điều chuyển">Điều chuyển</option>
              <option value="Chờ thanh lý">Chờ thanh lý</option>
              <option value="Đã thanh lý">Đã thanh lý</option>
              <option value="Đã thu hồi">Đã thu hồi</option>
              <option value="Mất">Mất</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">-- Loại tài sản --</option>
              {assetTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
              <th>Mã tài sản</th>
              <th>Tên tài sản & Nhãn hiệu</th>
              <th>Phòng ban & Vị trí</th>
              <th>Người sử dụng</th>
              <th style={{ textAlign: 'right' }}>Nguyên giá</th>
              <th style={{ textAlign: 'center' }}>Tình trạng</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th style={{ textAlign: 'center', width: '180px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  {assets.length === 0
                    ? 'Chưa có tài sản nào. Hãy nhập tài sản mới để bắt đầu.'
                    : 'Không tìm thấy tài sản nào phù hợp với điều kiện tìm kiếm.'}
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset, index) => (
                <tr key={asset.id}>
                  <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                    {index + 1}
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        color: '#1e3a8a',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                      onClick={() => handleOpenDetail(asset)}
                    >
                      {asset.code}
                    </span>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                      SN: {asset.serial || 'Chưa có'}
                    </div>
                  </td>
                  <td>
                    <div
                      style={{ fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
                      onClick={() => handleOpenDetail(asset)}
                    >
                      {asset.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {asset.brand} • {asset.model} • {asset.type}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building size={13} />
                      {asset.departmentName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <MapPin size={12} />
                      {asset.locationPath}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{asset.currentUser}</div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                      Chịu TN: {asset.responsiblePerson}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatVND(asset.cost)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <ConditionBadge condition={asset.condition} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <StatusBadge status={asset.status} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {/* View detail */}
                      <button
                        className="btn-icon"
                        title="Xem chi tiết hồ sơ & lịch sử"
                        onClick={() => handleOpenDetail(asset)}
                      >
                        <Eye size={15} />
                      </button>

                      {/* In tem QR */}
                      <button
                        className="btn-icon"
                        title="In tem mã QR"
                        onClick={() => handleOpenQR(asset)}
                      >
                        <QrCode size={15} color="#2563eb" />
                      </button>

                      {/* Edit */}
                      {permissions.canManageAssets && (
                        <button
                          className="btn-icon"
                          title="Chỉnh sửa thông tin tài sản"
                          onClick={() => handleOpenEdit(asset)}
                          style={{ color: '#d97706' }}
                        >
                          <Edit2 size={15} />
                        </button>
                      )}

                      {/* Liquidation quick action */}
                      {permissions.canManageAssets && asset.status !== 'Đã thanh lý' && asset.status !== 'Chờ thanh lý' && (
                        <button
                          className="btn-icon"
                          title="Lập đề nghị thanh lý"
                          onClick={() => handleOpenLiquidation(asset)}
                          style={{ color: '#ea580c' }}
                        >
                          <FileX size={15} />
                        </button>
                      )}

                      {/* Delete */}
                      {permissions.isAdmin && (
                        <button
                          className="btn-icon"
                          title="Xóa tài sản"
                          onClick={() => handleDeleteConfirm(asset)}
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {isDetailOpen && selectedAsset && (
        <AssetDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          asset={selectedAsset}
          onOpenQR={(a) => handleOpenQR(a)}
          onEdit={(a) => { setIsDetailOpen(false); handleOpenEdit(a); }}
        />
      )}

      {isQROpen && qrAsset && (
        <QRModal
          isOpen={isQROpen}
          onClose={() => setIsQROpen(false)}
          asset={qrAsset}
        />
      )}

      {/* Edit Asset Modal */}
      {isEditOpen && editAsset && (
        <AssetFormModal
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); setEditAsset(null); }}
          asset={editAsset}
          mode="edit"
        />
      )}

      {/* Quick Liquidation Modal */}
      {isLiquidationOpen && liquidationAsset && (
        <LiquidationQuickModal
          isOpen={isLiquidationOpen}
          onClose={() => { setIsLiquidationOpen(false); setLiquidationAsset(null); }}
          asset={liquidationAsset}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '90%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: '#fef2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <AlertTriangle size={22} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0 }}>
                  Xác nhận xóa tài sản
                </h3>
                <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '2px 0 0' }}>
                  Hành động này không thể hoàn tác!
                </p>
              </div>
            </div>
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
              padding: '14px 16px', marginBottom: 20, fontSize: '0.875rem'
            }}>
              <strong>{deleteConfirm.code}</strong> — {deleteConfirm.name}<br />
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                Toàn bộ lịch sử và hồ sơ của tài sản này sẽ bị xóa vĩnh viễn.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Hủy
              </button>
              <button
                className="btn"
                style={{ background: '#dc2626', color: '#fff' }}
                onClick={handleDeleteExecute}
              >
                <Trash2 size={15} />
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
