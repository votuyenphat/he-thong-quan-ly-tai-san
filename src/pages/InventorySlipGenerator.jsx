// src/pages/InventorySlipGenerator.jsx
// Trang Tạo Phiếu Kiểm Kê Tự Động: Chọn "Vị trí cơ sở - Phòng/Khoa" & "Năm kiểm kê", kèm Mã QR bên phải phiếu

import React, { useState, useMemo } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { generateAssetCardImageDataUrl } from '../utils/assetCardImage';
import { cleanText, canonicalStatus, removeVietnameseDiacritics } from '../utils/normalize';
import {
  SCHOOL_HEADER_TITLE,
  SLIP_SUBTITLE,
  extractCampusFromLocation,
  formatShortLocation,
  buildCampusDepartmentOptions,
  parseScopeSelection,
  generateInventorySlips,
  chunkSlipsIntoRows,
  printInventorySlips,
  exportSlipsToExcel,
  exportSlipsToWord,
  exportSlipsToPdf
} from '../utils/inventorySlipHelper';
import {
  Tags,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  Building2,
  Calendar,
  Sparkles,
  Boxes,
  CopyCheck,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  QrCode
} from 'lucide-react';

const SLIPS_PER_A4_PAGE = 18; // 6 hàng x 3 cột mỗi trang A4 xem trước

export default function InventorySlipGenerator() {
  const { assets = [], departments = [], inventorySessions = [] } = useAssets();
  const { currentUser, permissions } = useAuth();

  // Tổng hợp danh sách lựa chọn "Vị trí cơ sở - Phòng/Khoa" từ dữ liệu hệ thống
  const { options: allScopeOptions, campusGroups: allCampusGroups } = useMemo(() => {
    return buildCampusDepartmentOptions(assets, departments);
  }, [assets, departments]);

  // Nếu là tài khoản Quản lý phòng cụ thể -> lọc các cơ sở có phòng đó (nhưng nếu không khớp thì vẫn mở toàn bộ để không bị khóa trống)
  const { visibleOptions, visibleCampusGroups, allowAllSchool } = useMemo(() => {
    if (permissions?.isSuperAdmin) {
      return {
        visibleOptions: allScopeOptions,
        visibleCampusGroups: allCampusGroups,
        allowAllSchool: true
      };
    }

    const userDeptId = cleanText(currentUser?.departmentId).toLowerCase();
    const userDeptName = cleanText(currentUser?.departmentName || currentUser?.department).toLowerCase();

    if (!userDeptId && !userDeptName) {
      return {
        visibleOptions: allScopeOptions,
        visibleCampusGroups: allCampusGroups,
        allowAllSchool: true
      };
    }

    const filtered = allScopeOptions.filter(
      opt =>
        (userDeptId && cleanText(opt.deptId).toLowerCase() === userDeptId) ||
        (userDeptName && cleanText(opt.deptName).toLowerCase() === userDeptName)
    );

    if (filtered.length === 0) {
      return {
        visibleOptions: allScopeOptions,
        visibleCampusGroups: allCampusGroups,
        allowAllSchool: true
      };
    }

    const groupMap = new Map();
    filtered.forEach(opt => {
      if (!groupMap.has(opt.campus)) groupMap.set(opt.campus, []);
      groupMap.get(opt.campus).push(opt);
    });

    const groups = Array.from(groupMap.entries()).map(([campus, items]) => ({
      campus,
      totalSlips: items.reduce((s, i) => s + i.slipCount, 0),
      items
    }));

    return {
      visibleOptions: filtered,
      visibleCampusGroups: groups,
      allowAllSchool: false
    };
  }, [permissions?.isSuperAdmin, currentUser, allScopeOptions, allCampusGroups]);

  // Danh sách Năm kiểm kê để CHỌN (không cần gõ tay)
  const yearOptions = useMemo(() => {
    const baseYear = new Date().getFullYear();
    const set = new Set();
    for (let y = baseYear - 3; y <= baseYear + 4; y++) {
      set.add(y);
    }
    (inventorySessions || []).forEach(s => {
      if (s?.year && !isNaN(Number(s.year))) set.add(Number(s.year));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [inventorySessions]);

  // Giá trị khởi tạo từ URL (nếu có)
  const initialParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const qScope = params.get('scope') || params.get('dept') || '';
    const qYear = params.get('year');
    return {
      scope: cleanText(qScope),
      year: qYear && !isNaN(Number(qYear)) ? Number(qYear) : new Date().getFullYear()
    };
  }, []);

  const [userSelectedScope, setUserSelectedScope] = useState(initialParams.scope);
  const [inventoryYear, setInventoryYear] = useState(initialParams.year);
  const [selectedLocationPath, setSelectedLocationPath] = useState('ALL');
  const [viewMode, setViewMode] = useState('paged'); // 'paged' | 'all'
  const [currentPage, setCurrentPage] = useState(1);

  // Tự động xác định lựa chọn "Vị trí cơ sở - Phòng/Khoa" hiệu lực (kể cả ngay khi dữ liệu Cloud vừa tải về)
  const selectedScope = useMemo(() => {
    if (userSelectedScope) {
      if (userSelectedScope === 'ALL' && allowAllSchool) return 'ALL';
      if (userSelectedScope.startsWith('CAMPUS|||') && allowAllSchool) return userSelectedScope;

      const exact = visibleOptions.find(o => o.value === userSelectedScope);
      if (exact) return exact.value;

      const normInput = cleanText(userSelectedScope).toLowerCase();
      const byDeptOrLabel = visibleOptions.find(
        o =>
          cleanText(o.label).toLowerCase() === normInput ||
          cleanText(o.deptName).toLowerCase() === normInput
      );
      if (byDeptOrLabel) return byDeptOrLabel.value;
    }

    if (visibleOptions.length > 0) {
      // Mặc định chọn "Cơ sở chính - PHÒNG TỔ CHỨC HÀNH CHÍNH" (nếu có) hoặc đơn vị đầu tiên có tài sản
      const tchc = visibleOptions.find(
        o =>
          removeVietnameseDiacritics(o.campus).toLowerCase().includes('co so chinh') &&
          removeVietnameseDiacritics(o.deptName).toLowerCase().includes('to chuc hanh chinh')
      );
      const firstWithSlips = visibleOptions.find(o => o.slipCount > 0);
      const chosen = tchc || firstWithSlips || visibleOptions[0];
      return chosen ? chosen.value : '';
    }

    return '';
  }, [userSelectedScope, visibleOptions, allowAllSchool]);

  const parsedScope = useMemo(() => parseScopeSelection(selectedScope), [selectedScope]);

  const activeScopeOption = useMemo(() => {
    return visibleOptions.find(o => o.value === selectedScope) || null;
  }, [visibleOptions, selectedScope]);

  const handleScopeChange = (e) => {
    setUserSelectedScope(e.target.value);
    setSelectedLocationPath('ALL');
    setCurrentPage(1);
  };

  const handleYearChange = (e) => {
    setInventoryYear(Number(e.target.value));
    setCurrentPage(1);
  };

  // Danh sách các vị trí phòng cụ thể thuộc (Cơ sở - Phòng/Khoa) đang chọn (để chọn lọc nhanh nếu cần)
  const scopeLocations = useMemo(() => {
    const normCampus = cleanText(parsedScope.campus).toLowerCase();
    const normDept = cleanText(parsedScope.deptName).toLowerCase();
    const locMap = new Map();

    assets.forEach(a => {
      if (!a) return;
      const st = canonicalStatus(a.status);
      if (st === 'Đã thanh lý' || st === 'Mất') return;

      if (normCampus && normCampus !== 'all') {
        if (extractCampusFromLocation(a.locationPath).toLowerCase() !== normCampus) return;
      }

      if (normDept && normDept !== 'all') {
        const matchName = cleanText(a.departmentName).toLowerCase() === normDept;
        const matchId = cleanText(a.departmentId).toLowerCase() === normDept;
        if (!matchName && !matchId) return;
      }

      const fullLoc = cleanText(a.locationPath);
      if (fullLoc) {
        const key = fullLoc.toLowerCase();
        if (!locMap.has(key)) {
          locMap.set(key, {
            fullPath: fullLoc,
            shortLabel: formatShortLocation(fullLoc),
            slipCount: 0
          });
        }
        locMap.get(key).slipCount += Math.max(1, Math.round(Number(a.quantity) || 1));
      }
    });

    return Array.from(locMap.values());
  }, [assets, parsedScope]);

  // Tự động sinh toàn bộ danh sách phiếu kiểm kê + mã QR bên phải
  const { slips, matchedAssets, timeText } = useMemo(() => {
    if (!selectedScope) {
      return { slips: [], matchedAssets: [], timeText: `00 giờ, ngày 01/01/${inventoryYear}` };
    }
    return generateInventorySlips({
      assets,
      departments,
      selectedScope,
      inventoryYear,
      selectedLocationPath
    });
  }, [assets, departments, selectedScope, inventoryYear, selectedLocationPath]);

  const totalPages = Math.max(1, Math.ceil(slips.length / SLIPS_PER_A4_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedSlips = useMemo(() => {
    if (viewMode === 'all') return slips;
    const start = (safePage - 1) * SLIPS_PER_A4_PAGE;
    return slips.slice(start, start + SLIPS_PER_A4_PAGE);
  }, [slips, viewMode, safePage]);

  const activePreviewCols = Math.min(3, Math.max(1, displayedSlips.length));

  const previewRows = useMemo(() => {
    return chunkSlipsIntoRows(displayedSlips, activePreviewCols);
  }, [displayedSlips, activePreviewCols]);

  const currentSelectionDisplay = useMemo(() => {
    if (activeScopeOption) return activeScopeOption.label;
    if (parsedScope.mode === 'CAMPUS') return `Tất cả phòng/khoa tại ${parsedScope.campus}`;
    if (parsedScope.mode === 'ALL') return 'Toàn bộ các Cơ sở - Phòng/Khoa';
    return selectedScope;
  }, [activeScopeOption, parsedScope, selectedScope]);

  const getSafeFileBaseName = () => {
    const slug = removeVietnameseDiacritics(currentSelectionDisplay || 'Toan_Truong')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `Phieu_Kiem_Ke_${slug}_Nam_${inventoryYear}`;
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [previewCardImgUrl, setPreviewCardImgUrl] = useState('');
  const [previewCardCode, setPreviewCardCode] = useState('');

  const handlePreviewQrImage = async (asset) => {
    if (!asset) return;
    setPreviewCardCode(asset.code || '');
    const pngUrl = await generateAssetCardImageDataUrl(asset);
    setPreviewCardImgUrl(pngUrl);
  };

  const handleDownloadPdf = async () => {
    if (slips.length === 0 || isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      await exportSlipsToPdf(slips, `${getSafeFileBaseName()}.pdf`);
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      alert('Không thể tạo file PDF. Vui lòng thử lại!');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintAll = () => {
    const title = `Phiếu kiểm kê - ${currentSelectionDisplay} - Năm ${inventoryYear}`;
    printInventorySlips(slips, title);
  };

  const handleExportExcel = () => {
    exportSlipsToExcel(slips, `${getSafeFileBaseName()}.xls`);
  };

  const handleExportWord = () => {
    exportSlipsToWord(slips, `${getSafeFileBaseName()}.doc`);
  };

  return (
    <div className="page-body">
      {/* Page Header */}
      <div className="page-header no-print">
        <div>
          <h2 className="page-title">
            <Tags size={26} color="#1e3a8a" />
            Tạo Phiếu Kiểm Kê
          </h2>
          <p className="page-subtitle">
            Chọn Vị trí cơ sở - Phòng/Khoa và Năm kiểm kê — tự động sinh đủ số phiếu kèm Mã QR bên phải và tải về PDF ngay
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => slips[0]?.asset && handlePreviewQrImage(slips[0].asset)}
            disabled={slips.length === 0}
            title="Xem trước ngay tấm hình ảnh thông tin tài sản hiện ra khi quét Mã QR"
            style={{ borderColor: '#93c5fd', color: '#1e3a8a', background: '#eff6ff' }}
          >
            <Eye size={16} color="#1e3a8a" />
            Xem Ảnh Khi Quét QR
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportWord}
            disabled={slips.length === 0}
            title="Tải về file Microsoft Word (.doc) kèm mã QR bên phải từng phiếu"
          >
            <FileText size={16} color="#2563eb" />
            Word (.doc)
          </button>

          <button
            type="button"
            className="btn btn-success"
            onClick={handleExportExcel}
            disabled={slips.length === 0}
            title="Tải về file Excel (.xls) giữ nguyên khung viền 3 cột và mã QR bên phải"
          >
            <FileSpreadsheet size={16} />
            Excel (.xls)
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrintAll}
            disabled={slips.length === 0}
            title="Mở cửa sổ in trực tiếp ra máy in khổ A4"
          >
            <Printer size={16} color="#334155" />
            In A4
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadPdf}
            disabled={slips.length === 0 || isExportingPdf}
            title="Tải trực tiếp file định dạng PDF (.pdf) chuẩn khổ A4 về máy"
          >
            <Download size={16} />
            {isExportingPdf ? 'Đang tạo file PDF...' : `Tải File PDF (${slips.length} Phiếu)`}
          </button>
        </div>
      </div>

      {/* Khung chọn 100% bằng danh sách thả xuống (Chọn chứ không điền) */}
      <div
        className="card no-print"
        style={{
          marginBottom: 20,
          border: '1px solid #bfdbfe',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              scopeLocations.length > 1
                ? 'minmax(min(100%, 340px), 2.2fr) minmax(min(100%, 190px), 1fr) minmax(min(100%, 220px), 1.2fr)'
                : 'minmax(min(100%, 340px), 2.2fr) minmax(min(100%, 200px), 1fr)',
            gap: 18,
            alignItems: 'end'
          }}
        >
          {/* Chọn 1: Vị trí cơ sở - Phòng / Khoa */}
          <div>
            <label
              className="form-label"
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1e3a8a', fontSize: '0.9rem' }}
            >
              <Building2 size={16} color="#1e3a8a" />
              1. Chọn Vị trí cơ sở - Phòng / Khoa (*)
            </label>
            <select
              className="form-select"
              style={{
                fontWeight: 600,
                height: '44px',
                borderColor: '#60a5fa',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
              value={selectedScope}
              onChange={handleScopeChange}
            >
              {visibleCampusGroups.map(group => (
                <optgroup key={group.campus} label={`📍 ${group.campus.toUpperCase()}`}>
                  {group.items.map(item => (
                    <option key={item.value} value={item.value}>
                      {item.campus} - {item.deptName} ({item.slipCount} phiếu)
                    </option>
                  ))}
                </optgroup>
              ))}

              {allowAllSchool && visibleCampusGroups.length > 0 && (
                <optgroup label="── CHỌN NHANH THEO CƠ SỞ / TOÀN TRƯỜNG ──">
                  {visibleCampusGroups.map(group => (
                    <option key={`campus-${group.campus}`} value={`CAMPUS|||${group.campus}`}>
                      {group.campus} - Tất cả Phòng / Khoa ({group.totalSlips} phiếu)
                    </option>
                  ))}
                  <option value="ALL">Toàn bộ các Cơ sở - Phòng / Khoa</option>
                </optgroup>
              )}
            </select>
          </div>

          {/* Chọn 2: Năm kiểm kê */}
          <div>
            <label
              className="form-label"
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1e3a8a', fontSize: '0.9rem' }}
            >
              <Calendar size={16} color="#1e3a8a" />
              2. Chọn Năm kiểm kê (*)
            </label>
            <select
              className="form-select"
              style={{
                fontWeight: 700,
                height: '44px',
                borderColor: '#60a5fa',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
              value={inventoryYear}
              onChange={handleYearChange}
            >
              {yearOptions.map(yr => (
                <option key={yr} value={yr}>
                  Năm kiểm kê {yr} (01/01/{yr})
                </option>
              ))}
            </select>
          </div>

          {/* Chọn 3 (Tự động xuất hiện khi đơn vị có từ 2 phòng trở lên): Chọn phòng cụ thể nếu muốn */}
          {scopeLocations.length > 1 && (
            <div>
              <label
                className="form-label"
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155', fontSize: '0.88rem' }}
              >
                <MapPin size={15} color="#0f766e" />
                Lọc phòng cụ thể (Tùy chọn)
              </label>
              <select
                className="form-select"
                style={{
                  fontWeight: 600,
                  height: '44px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer'
                }}
                value={selectedLocationPath}
                onChange={(e) => {
                  setSelectedLocationPath(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Tất cả phòng của đơn vị ({scopeLocations.length} phòng)</option>
                {scopeLocations.map((loc, idx) => (
                  <option key={idx} value={loc.fullPath}>
                    Phòng / Vị trí: {loc.shortLabel} ({loc.slipCount} phiếu)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Thanh xác nhận thông tin tự động sinh trên phiếu */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px dashed #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            fontSize: '0.84rem',
            color: '#334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#dbeafe',
                color: '#1e40af',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.78rem'
              }}
            >
              <Sparkles size={13} />
              Tự động hoàn tất
            </span>

            <span>
              Mốc thời gian: <strong>{timeText}</strong>
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span>
              Bộ phận trên phiếu:{' '}
              <strong style={{ color: '#1e3a8a' }}>
                {activeScopeOption ? activeScopeOption.deptShort : 'Tự động theo từng đơn vị'}
              </strong>{' '}
              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>(ẩn tên cơ sở)</span>
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#0f766e', fontWeight: 600 }}>
              <QrCode size={14} />
              Mã QR bên phải: Quét hiện 1 hình ảnh thông tin tài sản độc lập (bấm vào QR để xem thử hình ảnh)
            </span>
          </div>
        </div>
      </div>

      {/* KPI Quick Summary Cards */}
      <div className="dashboard-grid-kpi no-print" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Boxes size={20} color="#1e3a8a" />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Số đầu mục tài sản</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
              {matchedAssets.length}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>danh mục</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <CopyCheck size={20} color="#15803d" />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Tổng số phiếu tạo tự động</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#15803d' }}>
              {slips.length}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>phiếu (= tổng SL)</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <MapPin size={20} color="#b45309" />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Số phòng / vị trí</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#b45309' }}>
              {selectedLocationPath === 'ALL' ? scopeLocations.length : 1}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>vị trí</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <FileText size={20} color="#334155" />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Số trang in A4 ước tính</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#334155' }}>
              {slips.length === 0 ? 0 : totalPages}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>trang (3 cột)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bản xem trước trang giấy A4 */}
      <div className="card" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={18} color="#1e3a8a" />
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.98rem' }}>
              Bản Xem Trước Mẫu Phiếu Kiểm Kê (Chuẩn Khổ A4 - 3 Cột - Có Mã QR Bên Phải)
            </span>
          </div>

          {slips.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: 3,
                  border: '1px solid #cbd5e1'
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('paged')}
                  style={{
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: viewMode === 'paged' ? '#1e3a8a' : 'transparent',
                    color: viewMode === 'paged' ? '#ffffff' : '#475569'
                  }}
                >
                  Xem theo trang A4 ({SLIPS_PER_A4_PAGE} phiếu/trang)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  style={{
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: viewMode === 'all' ? '#1e3a8a' : 'transparent',
                    color: viewMode === 'all' ? '#ffffff' : '#475569'
                  }}
                >
                  Xem toàn bộ ({slips.length} phiếu)
                </button>
              </div>

              {viewMode === 'paged' && totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={15} />
                    Trang trước
                  </button>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', padding: '0 6px' }}>
                    Trang {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Trang sau
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {slips.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
              color: '#64748b',
              border: '1px dashed #cbd5e1'
            }}
          >
            <Tags size={40} color="#94a3b8" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#334155', marginBottom: 4 }}>
              Chưa có tài sản nào thuộc đơn vị đang chọn
            </div>
            <div style={{ fontSize: '0.86rem' }}>
              Vui lòng chọn Vị trí cơ sở - Phòng/Khoa khác trong danh sách phía trên.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div
              id="inventory-slips-preview-sheet"
              style={{
                background: '#ffffff',
                maxWidth: activePreviewCols === 1 ? '330px' : activePreviewCols === 2 ? '660px' : '980px',
                minWidth: activePreviewCols === 1 ? '280px' : activePreviewCols === 2 ? '530px' : '780px',
                margin: '0 auto',
                padding: '20px 18px',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)',
                border: '1px solid #cbd5e1'
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  tableLayout: 'fixed',
                  fontFamily: "'Times New Roman', Times, serif",
                  color: '#000000',
                  background: '#ffffff'
                }}
              >
                {activePreviewCols === 1 && (
                  <colgroup>
                    <col style={{ width: '100%' }} />
                  </colgroup>
                )}
                {activePreviewCols === 2 && (
                  <colgroup>
                    <col style={{ width: '49%' }} />
                    <col style={{ width: '2%' }} />
                    <col style={{ width: '49%' }} />
                  </colgroup>
                )}
                {activePreviewCols === 3 && (
                  <colgroup>
                    <col style={{ width: '32.5%' }} />
                    <col style={{ width: '1.25%' }} />
                    <col style={{ width: '32.5%' }} />
                    <col style={{ width: '1.25%' }} />
                    <col style={{ width: '32.5%' }} />
                  </colgroup>
                )}
                <tbody>
                  {previewRows.map((row, rIdx) => {
                    const nextRow = previewRows[rIdx + 1] || [];
                    const colIndices = Array.from({ length: activePreviewCols }, (_, i) => i);

                    return (
                      <React.Fragment key={rIdx}>
                        <tr style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                          {colIndices.map((colIdx) => {
                            const slip = row[colIdx];
                            const hasSpacerBorder = Boolean(row[colIdx] && row[colIdx + 1]);

                            return (
                              <React.Fragment key={colIdx}>
                                <td
                                  style={{
                                    border: slip ? '1px solid #000000' : 'none',
                                    verticalAlign: 'middle',
                                    padding: slip ? '5px 6px 6px 8px' : 0,
                                    fontSize: '12.5px',
                                    lineHeight: 1.38,
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word'
                                  }}
                                >
                                  {slip ? (
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 6
                                      }}
                                    >
                                      {/* Bên trái: Nội dung 5 dòng chuẩn mẫu (không hiện cơ sở) */}
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                          style={{
                                            textAlign: 'center',
                                            fontWeight: 700,
                                            fontSize: '12.5px',
                                            lineHeight: 1.2,
                                            textTransform: 'uppercase'
                                          }}
                                        >
                                          {SCHOOL_HEADER_TITLE}
                                        </div>
                                        <div
                                          style={{
                                            textAlign: 'center',
                                            fontWeight: 400,
                                            fontSize: '12.5px',
                                            lineHeight: 1.22,
                                            textTransform: 'uppercase',
                                            marginBottom: '4px'
                                          }}
                                        >
                                          {SLIP_SUBTITLE}
                                        </div>
                                        <div style={{ textAlign: 'left', fontWeight: 400, lineHeight: 1.4 }}>
                                          Thời gian: {slip.timeText}
                                        </div>
                                        <div style={{ textAlign: 'left', fontWeight: 400, lineHeight: 1.4 }}>
                                          Bộ phận: {slip.deptLabel} ; Vị trí: {slip.locLabel}
                                        </div>
                                        <div style={{ textAlign: 'left', fontWeight: 400, lineHeight: 1.4 }}>
                                          Tên TS: <strong style={{ fontWeight: 700 }}>{slip.assetName}</strong> ; SL:{' '}
                                          {slip.totalQuantity}
                                        </div>
                                      </div>

                                      {/* Bên phải: Mã QR quét hiển thị 1 hình ảnh thông tin tài sản */}
                                      {slip.qrDataUrl && (
                                        <div
                                          onClick={() => slip.asset && handlePreviewQrImage(slip.asset)}
                                          style={{
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                          }}
                                          title={`Bấm để xem thử hình ảnh thông tin tài sản (${slip.assetCode}) hiển thị khi quét QR`}
                                        >
                                          <img
                                            src={slip.qrDataUrl}
                                            alt={`QR ${slip.assetName}`}
                                            style={{
                                              width: 62,
                                              height: 62,
                                              display: 'block',
                                              imageRendering: 'pixelated'
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                </td>

                                {colIdx < activePreviewCols - 1 && (
                                  <td
                                    style={{
                                      border: hasSpacerBorder ? '1px solid #000000' : 'none',
                                      padding: 0,
                                      fontSize: '1px',
                                      lineHeight: '1px'
                                    }}
                                  >
                                    &nbsp;
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tr>

                        {rIdx < previewRows.length - 1 && (
                          <tr style={{ height: '6px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                            {colIndices.map((colIdx) => {
                              const hasVertBoth = Boolean(row[colIdx] && nextRow[colIdx]);
                              const hasCornerAll = Boolean(
                                row[colIdx] && row[colIdx + 1] && nextRow[colIdx] && nextRow[colIdx + 1]
                              );
                              return (
                                <React.Fragment key={`gap-${colIdx}`}>
                                  <td
                                    style={{
                                      border: hasVertBoth ? '1px solid #000000' : 'none',
                                      height: '6px',
                                      padding: 0,
                                      fontSize: '1px',
                                      lineHeight: '1px'
                                    }}
                                  />
                                  {colIdx < activePreviewCols - 1 && (
                                    <td
                                      style={{
                                        border: hasCornerAll ? '1px solid #000000' : 'none',
                                        height: '6px',
                                        padding: 0,
                                        fontSize: '1px',
                                        lineHeight: '1px'
                                      }}
                                    />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Hộp xem thử đúng bức ảnh PNG độc lập sẽ hiện ra trên điện thoại khi quét Mã QR */}
      {previewCardImgUrl && (
        <div
          onClick={() => {
            setPreviewCardImgUrl('');
            setPreviewCardCode('');
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'zoom-out'
          }}
        >
          <div style={{ color: '#e2e8f0', fontSize: '0.85rem', marginBottom: 10, fontWeight: 600 }}>
            Hình ảnh hiển thị khi quét Mã QR ({previewCardCode}) — Nhấn bất kỳ đâu để đóng
          </div>
          <img
            src={previewCardImgUrl}
            alt={`Hình ảnh tài sản ${previewCardCode}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '86vh',
              maxWidth: '94vw',
              width: 'auto',
              height: 'auto',
              borderRadius: '8px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          />
        </div>
      )}
    </div>
  );
}
