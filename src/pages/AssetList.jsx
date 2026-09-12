// src/pages/AssetList.jsx
import React, { useState, useMemo } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/formatters';
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
  FileX,
  X,
  RotateCcw,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

import {
  cleanText,
  canonicalStatus,
  canonicalCondition,
  isEqualNormalized
} from '../utils/normalize';

export default function AssetList({ setActiveTab }) {
  const {
    assets,
    departments,
    deleteAsset,
    assetTypeOptions,
    conditionOptions,
    statusOptions
  } = useAssets();
  const { currentUser, permissions } = useAuth();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState('ALL');
  const [quickFilter, setQuickFilter] = useState('ALL'); // 'ALL' | 'inUse' | 'inStock' | 'damaged' | 'infinite' | 'liquidated'

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
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Extract list of all unique years available from assets
  const availableYears = useMemo(() => {
    const years = new Set();
    assets.forEach(a => {
      const y = a.importYear || a.purchaseYear || (a.purchaseDate ? String(a.purchaseDate).slice(0, 4) : null);
      if (y) years.add(String(y));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [assets]);

  // Combine options from context and actual asset values so nothing is missed (Normalized & Deduplicated)
  const availableTypes = useMemo(() => {
    const rawList = [...assetTypeOptions, ...assets.map(a => a.type).filter(Boolean)].map(cleanText).filter(Boolean);
    return Array.from(new Set(rawList));
  }, [assetTypeOptions, assets]);

  const availableConditions = useMemo(() => {
    const rawList = [...conditionOptions, ...assets.map(a => a.condition).filter(Boolean)].map(canonicalCondition).filter(Boolean);
    return Array.from(new Set(rawList));
  }, [conditionOptions, assets]);

  const availableStatuses = useMemo(() => {
    const rawList = [...statusOptions, ...assets.map(a => a.status).filter(Boolean)].map(canonicalStatus).filter(Boolean);
    return Array.from(new Set(rawList));
  }, [statusOptions, assets]);

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedDept !== 'ALL' ||
    selectedCondition !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedType !== 'ALL' ||
    selectedYear !== 'ALL' ||
    selectedPriceRange !== 'ALL' ||
    quickFilter !== 'ALL';

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedDept('ALL');
    setSelectedCondition('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
    setSelectedYear('ALL');
    setSelectedPriceRange('ALL');
    setQuickFilter('ALL');
  };

  // Smart Multi-criteria Filtering
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      // Role-based restrictions
      if (currentUser?.role.includes('Trưởng phòng') && a.departmentName !== currentUser.department) {
        return false;
      }
      if (currentUser?.role.includes('Người dùng') && !a.currentUser?.includes(currentUser.name) && !a.responsiblePerson?.includes(currentUser.name)) {
        return false;
      }

      // Quick filter chips — chuẩn hóa trạng thái & tình trạng
      if (quickFilter === 'inUse' && canonicalStatus(a.status) !== 'Đang sử dụng') return false;
      if (quickFilter === 'inStock' && canonicalStatus(a.status) !== 'Trong kho') return false;
      if (quickFilter === 'damaged' && !['Hỏng nhẹ', 'Hỏng nặng', 'Không sử dụng được'].includes(canonicalCondition(a.condition))) return false;
      if (quickFilter === 'infinite' && (a.lifespanYears && Number(a.lifespanYears) > 0)) return false;
      if (quickFilter === 'liquidated' && !['Chờ thanh lý', 'Đã thanh lý'].includes(canonicalStatus(a.status))) return false;

      // Smart Multi-token Search across multiple fields (NFC normalized)
      if (searchTerm.trim()) {
        const tokens = cleanText(searchTerm).toLowerCase().split(/\s+/);
        const assetSearchString = [
          a.code,
          a.name,
          a.brand,
          a.type,
          a.departmentName,
          a.locationPath,
          a.currentUser,
          a.responsiblePerson,
          a.notes,
          a.importYear,
          a.purchaseYear
        ].filter(Boolean).map(cleanText).join(' ').toLowerCase();

        const allTokensMatch = tokens.every(token => assetSearchString.includes(token));
        if (!allTokensMatch) return false;
      }

      // Department Filter — so sánh chuẩn hóa (NFC, case-insensitive)
      if (selectedDept !== 'ALL') {
        const normSelected = cleanText(selectedDept).toLowerCase();
        const matchId = cleanText(a.departmentId).toLowerCase() === normSelected;
        const matchName = cleanText(a.departmentName).toLowerCase() === normSelected;
        if (!matchId && !matchName) return false;
      }

      // Condition Filter — canonicalCondition so sánh không phân biệt hoa thường / NFC
      if (selectedCondition !== 'ALL') {
        if (canonicalCondition(a.condition).toLowerCase() !== cleanText(selectedCondition).toLowerCase()) return false;
      }

      // Status Filter — canonicalStatus so sánh không phân biệt hoa thường / NFC / NFD
      if (selectedStatus !== 'ALL') {
        if (canonicalStatus(a.status).toLowerCase() !== cleanText(selectedStatus).toLowerCase()) return false;
      }

      // Asset Type Filter
      if (selectedType !== 'ALL') {
        if (cleanText(a.type).toLowerCase() !== cleanText(selectedType).toLowerCase()) return false;
      }

      // Import Year Filter
      if (selectedYear !== 'ALL') {
        const aYear = String(a.importYear || a.purchaseYear || (a.purchaseDate ? String(a.purchaseDate).slice(0, 4) : ''));
        if (aYear !== selectedYear) return false;
      }

      // Price Range Filter
      if (selectedPriceRange !== 'ALL') {
        const cost = Number(a.cost) || 0;
        if (selectedPriceRange === 'under5m' && cost >= 5000000) return false;
        if (selectedPriceRange === '5to20m' && (cost < 5000000 || cost >= 20000000)) return false;
        if (selectedPriceRange === '20to50m' && (cost < 20000000 || cost >= 50000000)) return false;
        if (selectedPriceRange === 'over50m' && cost < 50000000) return false;
      }

      return true;
    });
  }, [assets, currentUser, searchTerm, selectedDept, selectedCondition, selectedStatus, selectedType, selectedYear, selectedPriceRange, quickFilter]);


  const totalFilteredQuantity = useMemo(() => {
    return filteredAssets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0);
  }, [filteredAssets]);

  const totalFilteredValue = useMemo(() => {
    return filteredAssets.reduce((sum, a) => sum + ((Number(a.cost) || 0) * (Number(a.quantity) || 1)), 0);
  }, [filteredAssets]);

  // Phân trang (mặc định 50, tối đa 50 tài sản/trang)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Tự động reset về trang 1 khi thay đổi bộ lọc hoặc kích thước trang
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedDept,
    selectedCondition,
    selectedStatus,
    selectedType,
    selectedYear,
    selectedPriceRange,
    quickFilter,
    pageSize
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredAssets.length);

  const paginatedAssets = useMemo(() => {
    return filteredAssets.slice(startIndex, endIndex);
  }, [filteredAssets, startIndex, endIndex]);

  // Export to Excel (cleaned of model, serial, supplier, invoice, etc.)
  const handleExportExcel = () => {
    const exportData = filteredAssets.map((a, idx) => ({
      'STT': idx + 1,
      'Mã tài sản': a.code,
      'Tên tài sản': a.name,
      'Loại tài sản': a.type,
      'Nhãn hiệu': a.brand,
      'Năm nhập': a.importYear || a.purchaseYear || (a.purchaseDate ? String(a.purchaseDate).slice(0, 4) : ''),
      'Năm xuất': a.exportYear || '',
      'Số lượng': a.quantity || 1,
      'Đơn vị tính': a.unit || 'Cái',
      'Đơn vị quản lý': a.departmentName,
      'Vị trí cụ thể': a.locationPath,
      'Người chịu trách nhiệm': a.responsiblePerson,
      'Người sử dụng': a.currentUser,
      'Đơn giá (VNĐ)': a.cost,
      'Tổng giá trị (VNĐ)': (Number(a.cost) || 0) * (Number(a.quantity) || 1),
      'Hạn SD (Năm)': a.lifespanYears ? a.lifespanYears : 'Vô hạn',
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

  const quickFilterChips = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'inUse', label: 'Đang sử dụng' },
    { id: 'inStock', label: 'Trong kho' },
    { id: 'damaged', label: 'Hỏng hóc' },
    { id: 'infinite', label: 'Hạn SD vô hạn' },
    { id: 'liquidated', label: 'Chờ / Đã thanh lý' }
  ];

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
            Xuất Excel ({filteredAssets.length} mã)
          </button>
          {permissions.canManageAssets && (
            <button className="btn btn-primary" onClick={() => setActiveTab('inbound')}>
              <Plus size={16} />
              Nhập tài sản mới
            </button>
          )}
        </div>
      </div>

      {/* Smart Filters Bar */}
      <div className="card" style={{ marginBottom: 20, padding: '18px 20px' }}>
        {/* Quick Filter Chips */}
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: '1px solid #f1f5f9'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={13} />
            Lọc nhanh:
          </span>
          {quickFilterChips.map(chip => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setQuickFilter(chip.id)}
              style={{
                border: 'none',
                borderRadius: '16px',
                padding: '4px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: quickFilter === chip.id ? '#1e40af' : '#f1f5f9',
                color: quickFilter === chip.id ? '#ffffff' : '#475569'
              }}
            >
              {chip.label}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                border: 'none',
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '14px',
                padding: '4px 10px',
                fontSize: '0.775rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Xóa tất cả các điều kiện lọc hiện tại"
            >
              <RotateCcw size={12} />
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Dropdowns & Search Input Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
          alignItems: 'center'
        }}>
          {/* Smart Search Box */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36, paddingRight: searchTerm ? 32 : 12 }}
              placeholder="Tìm thông minh theo tên, nhãn hiệu, phòng ban, vị trí, người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 10,
                  border: 'none',
                  background: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            )}
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

          {/* Type Filter */}
          <div>
            <select
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">-- Loại tài sản (Tất cả) --</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{t}</option>
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
              {availableConditions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
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
              {availableStatuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              className="form-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="ALL">-- Năm nhập (Tất cả) --</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>Năm {yr}</option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <select
              className="form-select"
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
            >
              <option value="ALL">-- Mức giá (Tất cả) --</option>
              <option value="under5m">Dưới 5 triệu</option>
              <option value="5to20m">5 - 20 triệu</option>
              <option value="20to50m">20 - 50 triệu</option>
              <option value="over50m">Trên 50 triệu</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Results Counter */}
        <div style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px dashed #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.825rem',
          color: '#64748b'
        }}>
          <div>
            Tìm thấy: <strong style={{ color: '#1e40af' }}>{filteredAssets.length}</strong> / {assets.length} mã tài sản
            {' '}(<strong style={{ color: '#0f172a' }}>{totalFilteredQuantity}</strong> hiện vật)
            {filteredAssets.length > 0 && (
              <span style={{ marginLeft: 8, color: '#64748b' }}>
                • Trang <strong style={{ color: '#1e3a8a' }}>{validCurrentPage}</strong> / {totalPages} (Tối đa {pageSize} tài sản/trang)
              </span>
            )}
          </div>
          <div>
            Tổng giá trị: <strong style={{ color: '#059669', fontSize: '0.9rem' }}>{formatVND(totalFilteredValue)}</strong>
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
              <th>Tên tài sản & Phân loại</th>
              <th style={{ textAlign: 'center', width: '90px' }}>Năm nhập</th>
              <th style={{ textAlign: 'center', width: '95px' }}>Số lượng</th>
              <th>Phòng ban & Vị trí</th>
              <th>Người sử dụng</th>
              <th style={{ textAlign: 'right' }}>Tổng giá trị</th>
              <th style={{ textAlign: 'center' }}>Tình trạng</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th style={{ textAlign: 'center', width: '170px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  {assets.length === 0
                    ? 'Chưa có tài sản nào. Hãy nhập tài sản mới để bắt đầu.'
                    : 'Không tìm thấy tài sản nào phù hợp với điều kiện tìm kiếm hiện tại.'}
                </td>
              </tr>
            ) : (
              paginatedAssets.map((asset, index) => {
                const displayYear = asset.importYear || asset.purchaseYear || (asset.purchaseDate ? String(asset.purchaseDate).slice(0, 4) : '---');

                return (
                  <tr key={asset.id}>
                    <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                      {startIndex + index + 1}
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
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
                        onClick={() => handleOpenDetail(asset)}
                      >
                        {asset.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {asset.brand ? `${asset.brand} • ` : ''}{asset.type}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                        {displayYear}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        background: (asset.quantity || 1) > 1 ? '#dbeafe' : '#f1f5f9',
                        color: (asset.quantity || 1) > 1 ? '#1d4ed8' : '#475569',
                        border: (asset.quantity || 1) > 1 ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                      }}>
                        {asset.quantity || 1} {asset.unit || 'Cái'}
                      </span>
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
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {formatVND((Number(asset.cost) || 0) * (Number(asset.quantity) || 1))}
                      </div>
                      {(asset.quantity || 1) > 1 && (
                        <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                          {formatVND(asset.cost)} / {asset.unit || 'cái'}
                        </div>
                      )}
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
                        {permissions.canManageAssets && canonicalStatus(asset.status) !== 'Đã thanh lý' && canonicalStatus(asset.status) !== 'Chờ thanh lý' && (
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {filteredAssets.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginTop: 16,
          padding: '12px 18px',
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {/* Left: Info & Page size selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.85rem', color: '#475569', flexWrap: 'wrap' }}>
            <span>
              Hiển thị <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> trên <strong>{filteredAssets.length}</strong> tài sản
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#64748b' }}>Số lượng/trang:</span>
              <select
                className="form-select"
                style={{ padding: '4px 8px', fontSize: '0.825rem', width: 'auto', height: 'auto' }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10 / trang</option>
                <option value={25}>25 / trang</option>
                <option value={50}>50 / trang (Tối đa)</option>
              </select>
            </div>
          </div>

          {/* Right: Pagination buttons */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* First page */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', opacity: validCurrentPage === 1 ? 0.4 : 1, cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
                title="Trang đầu"
              >
                <ChevronsLeft size={16} />
              </button>

              {/* Prev page */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', opacity: validCurrentPage === 1 ? 0.4 : 1, cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers */}
              {getPageNumbers(validCurrentPage, totalPages).map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} style={{ padding: '0 6px', color: '#94a3b8' }}>
                      ...
                    </span>
                  );
                }
                const isActive = p === validCurrentPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    style={{
                      minWidth: 32,
                      height: 32,
                      padding: '0 8px',
                      borderRadius: 6,
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? '#1e3a8a' : '#f8fafc',
                      color: isActive ? '#ffffff' : '#334155',
                      border: isActive ? '1px solid #1e3a8a' : '1px solid #cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              {/* Next page */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', opacity: validCurrentPage === totalPages ? 0.4 : 1, cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                title="Trang sau"
              >
                <ChevronRight size={16} />
              </button>

              {/* Last page */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', opacity: validCurrentPage === totalPages ? 0.4 : 1, cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Trang cuối"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

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
