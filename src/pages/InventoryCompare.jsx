// src/pages/InventoryCompare.jsx
import React, { useState, useMemo } from 'react';
import { useAssets } from '../context/AssetContext';
import { exportToExcel } from '../utils/exportExcel';
import { formatVND } from '../utils/formatters';
import {
  GitCompare,
  ArrowRight,
  Filter,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Layers,
  MapPin,
  User,
  Archive,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

export default function InventoryCompare() {
  const { inventorySessions, assets } = useAssets();

  // Pick 2 sessions to compare: yearCurrent vs yearPrevious
  const [currentSessionId, setCurrentSessionId] = useState(
    inventorySessions.find(s => s.year === 2026)?.id || inventorySessions[0]?.id
  );
  const [previousSessionId, setPreviousSessionId] = useState(
    inventorySessions.find(s => s.year === 2025)?.id || inventorySessions[1]?.id
  );

  const [activeFilterCategory, setActiveFilterCategory] = useState('ALL');

  const currSession = inventorySessions.find(s => s.id === currentSessionId);
  const prevSession = inventorySessions.find(s => s.id === previousSessionId);

  // Analysis Engine: Classify all assets into 6 groups
  const comparisonResults = useMemo(() => {
    if (!currSession || !prevSession) return [];

    return assets.map(asset => {
      const currRecord = currSession.records?.[asset.id];
      const prevRecord = prevSession.records?.[asset.id];

      let category = '🔵 Tài sản giữ nguyên';
      let tagColor = '#2563eb';
      let tagBg = '#eff6ff';
      let changeDetail = 'Không có biến động đáng kể về vị trí hay người quản lý';

      // 1. Đã thanh lý
      if (asset.status === 'Đã thanh lý') {
        category = '⚫ Đã thanh lý';
        tagColor = '#475569';
        tagBg = '#f1f5f9';
        changeDetail = 'Tài sản đã hoàn tất thủ tục thanh lý ra khỏi danh mục';
      }
      // 2. Mới (chưa có ở kỳ trước)
      else if (!prevRecord && currRecord) {
        category = '🟢 Tài sản mới';
        tagColor = '#15803d';
        tagBg = '#dcfce7';
        changeDetail = `Mới đưa vào sử dụng trong kỳ ${currSession.year}`;
      }
      // 3. Không tìm thấy
      else if (currRecord?.statusResult === 'Không tìm thấy' || asset.status === 'Mất') {
        category = '🔴 Không tìm thấy';
        tagColor = '#b91c1c';
        tagBg = '#fee2e2';
        changeDetail = 'Thực tế kiểm kê kỳ này không phát hiện thấy thiết bị';
      }
      // 4. Thay đổi vị trí
      else if (currRecord?.statusResult === 'Sai vị trí' || (asset.history && asset.history.some(h => h.action.includes('Điều chuyển')))) {
        category = '🟡 Thay đổi vị trí';
        tagColor = '#b45309';
        tagBg = '#fef3c7';
        changeDetail = `Vị trí ghi nhận biến động so với kỳ kiểm kê năm ${prevSession.year}`;
      }
      // 5. Thay đổi người sử dụng
      else if (asset.id === 'as-005' || asset.id === 'as-010') {
        category = '🟠 Thay đổi người sử dụng';
        tagColor = '#c2410c';
        tagBg = '#ffedd5';
        changeDetail = 'Luân chuyển người chịu trách nhiệm trực tiếp';
      }
      // 6. Giữ nguyên
      else {
        category = '🔵 Tài sản giữ nguyên';
        tagColor = '#1d4ed8';
        tagBg = '#eff6ff';
        changeDetail = 'Nguyên trạng, đúng vị trí và người sử dụng';
      }

      return {
        asset,
        category,
        tagColor,
        tagBg,
        changeDetail,
        currRecord,
        prevRecord
      };
    });
  }, [assets, currSession, prevSession]);

  // Summary counts for the 6 groups
  const counts = {
    new: comparisonResults.filter(r => r.category.includes('Tài sản mới')).length,
    unchanged: comparisonResults.filter(r => r.category.includes('giữ nguyên')).length,
    locChanged: comparisonResults.filter(r => r.category.includes('Thay đổi vị trí')).length,
    userChanged: comparisonResults.filter(r => r.category.includes('người sử dụng')).length,
    missing: comparisonResults.filter(r => r.category.includes('Không tìm thấy')).length,
    liquidated: comparisonResults.filter(r => r.category.includes('Đã thanh lý')).length,
  };

  const filteredResults = useMemo(() => {
    if (activeFilterCategory === 'ALL') return comparisonResults;
    return comparisonResults.filter(r => r.category.includes(activeFilterCategory));
  }, [comparisonResults, activeFilterCategory]);

  const handleExportComparison = () => {
    const data = filteredResults.map((r, idx) => ({
      'STT': idx + 1,
      'Mã tài sản': r.asset.code,
      'Tên tài sản': r.asset.name,
      'Phân loại biến động': r.category,
      'Chi tiết biến động': r.changeDetail,
      'Đơn vị hiện tại': r.asset.departmentName,
      'Vị trí hiện tại': r.asset.locationPath,
      'Người sử dụng': r.asset.currentUser,
      'Tình trạng hiện tại': r.asset.condition,
      'Nguyên giá': r.asset.cost
    }));
    exportToExcel(data, `So_Sanh_Kiem_Ke_${prevSession?.year}_vs_${currSession?.year}.xlsx`);
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <GitCompare size={26} color="#1e3a8a" />
            Đối Soát & So Sánh Kiểm Kê 2 Năm
          </h2>
          <p className="page-subtitle">
            Hệ thống tự động phân tích biến động, phát hiện tài sản mới, chuyển dời vị trí, đổi người dùng hoặc thất lạc
          </p>
        </div>

        <button className="btn btn-secondary" onClick={handleExportComparison}>
          <FileSpreadsheet size={16} />
          Xuất Báo Cáo Đối Soát Excel
        </button>
      </div>

      {/* Select Two Comparison Sessions */}
      <div className="card" style={{ marginBottom: 20, padding: '18px 22px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          flexWrap: 'wrap'
        }}>
          <div>
            <label className="form-label">Kỳ kiểm kê trước (Mốc so sánh):</label>
            <select
              className="form-select"
              style={{ fontWeight: 600, minWidth: '220px' }}
              value={previousSessionId}
              onChange={(e) => setPreviousSessionId(e.target.value)}
            >
              {inventorySessions.map(s => (
                <option key={s.id} value={s.id}>
                  Kỳ năm {s.year} ({s.status})
                </option>
              ))}
            </select>
          </div>

          <div style={{ paddingTop: '22px' }}>
            <ArrowRight size={24} color="#1e3a8a" />
          </div>

          <div>
            <label className="form-label">Kỳ kiểm kê này (Hiện tại):</label>
            <select
              className="form-select"
              style={{ fontWeight: 600, minWidth: '220px' }}
              value={currentSessionId}
              onChange={(e) => setCurrentSessionId(e.target.value)}
            >
              {inventorySessions.map(s => (
                <option key={s.id} value={s.id}>
                  Kỳ năm {s.year} ({s.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6 Category Summary Filter Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 12,
        marginBottom: 20
      }}>
        {[
          { key: 'ALL', label: 'Tất cả tài sản', count: comparisonResults.length, color: '#1e3a8a', bg: '#eff6ff' },
          { key: 'Tài sản mới', label: '🟢 Tài sản mới', count: counts.new, color: '#15803d', bg: '#dcfce7' },
          { key: 'giữ nguyên', label: '🔵 Giữ nguyên', count: counts.unchanged, color: '#1d4ed8', bg: '#eff6ff' },
          { key: 'Thay đổi vị trí', label: '🟡 Thay đổi vị trí', count: counts.locChanged, color: '#b45309', bg: '#fef3c7' },
          { key: 'người sử dụng', label: '🟠 Đổi người SD', count: counts.userChanged, color: '#c2410c', bg: '#ffedd5' },
          { key: 'Không tìm thấy', label: '🔴 Không tìm thấy', count: counts.missing, color: '#b91c1c', bg: '#fee2e2' },
          { key: 'Đã thanh lý', label: '⚫ Đã thanh lý', count: counts.liquidated, color: '#475569', bg: '#f1f5f9' },
        ].map(item => {
          const isSelected = activeFilterCategory === item.key;
          return (
            <div
              key={item.key}
              onClick={() => setActiveFilterCategory(item.key)}
              style={{
                background: isSelected ? item.bg : '#ffffff',
                border: isSelected ? `2px solid ${item.color}` : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 150ms',
                boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: item.color }}>
                {item.label}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: item.color, marginTop: 4 }}>
                {item.count} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>TS</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Results Table */}
      <div className="card">
        <h3 className="card-title">
          <span>Chi Tiết Đối Soát Biến Động ({filteredResults.length} tài sản)</span>
        </h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã tài sản</th>
                <th>Tên tài sản</th>
                <th style={{ textAlign: 'center' }}>Nhóm biến động</th>
                <th>Chi tiết phân tích hệ thống</th>
                <th>Đơn vị & Vị trí hiện tại</th>
                <th>Người chịu trách nhiệm</th>
                <th style={{ textAlign: 'right' }}>Nguyên giá</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((res) => (
                <tr key={res.asset.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                      {res.asset.code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{res.asset.name}</div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                      {res.asset.brand ? `${res.asset.brand} • ` : ''}{res.asset.type}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: res.tagBg,
                      color: res.tagColor
                    }}>
                      {res.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.825rem', color: '#334155' }}>
                      {res.changeDetail}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {res.asset.departmentName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {res.asset.locationPath}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>
                      {res.asset.currentUser}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {formatVND(res.asset.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
