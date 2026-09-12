// src/pages/AuditLogsPage.jsx
import React, { useState, useMemo } from 'react';
import { useAssets } from '../context/AssetContext';
import { exportToExcel } from '../utils/exportExcel';
import {
  History,
  Search,
  FileSpreadsheet,
  Shield,
  Clock,
  User,
  Activity,
  AlertCircle,
  RotateCcw,
  Filter
} from 'lucide-react';

export default function AuditLogsPage() {
  const { auditLogs } = useAssets();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  // Trạng thái đã lọc hay chưa (mặc định null -> không hiển thị bảng dữ liệu trước)
  const [appliedCriteria, setAppliedCriteria] = useState(null);

  const handleApplyFilter = (overrideCriteria = null) => {
    setAppliedCriteria(overrideCriteria || {
      search: searchTerm,
      action: filterAction
    });
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterAction('ALL');
    setAppliedCriteria(null);
  };

  const isFilterChanged = appliedCriteria !== null && (
    appliedCriteria.search !== searchTerm || appliedCriteria.action !== filterAction
  );

  const filteredLogs = useMemo(() => {
    if (!appliedCriteria) return [];
    return auditLogs.filter(log => {
      if (appliedCriteria.action !== 'ALL' && !log.action.toLowerCase().includes(appliedCriteria.action.toLowerCase())) {
        return false;
      }
      if (appliedCriteria.search.trim()) {
        const q = appliedCriteria.search.toLowerCase();
        return (
          log.user.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.target.toLowerCase().includes(q) ||
          log.detail.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditLogs, appliedCriteria]);

  const handleExportLogs = () => {
    if (!appliedCriteria || filteredLogs.length === 0) {
      alert('Vui lòng thực hiện lọc để hiển thị dữ liệu nhật ký trước khi xuất Excel!');
      return;
    }

    const data = filteredLogs.map((l, i) => ({
      'STT': i + 1,
      'Thời gian': l.timestamp,
      'Người thực hiện': l.user,
      'Email': l.userEmail,
      'Vai trò': l.role,
      'Hành vi': l.action,
      'Đối tượng / Tài sản': l.target,
      'Chi tiết thay đổi': l.detail,
      'Địa chỉ IP': l.ip
    }));
    exportToExcel(data, `Nhat_Ky_He_Thong_${new Date().getFullYear()}.xlsx`);
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <History size={26} color="#1e3a8a" />
            Nhật Ký Hoạt Động Hệ Thống (Audit Trail)
          </h2>
          <p className="page-subtitle">
            Ghi nhận tự động và bất biến mọi thao tác của người dùng: Ai – Làm gì – Lúc nào – Với tài sản nào
          </p>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={handleExportLogs}
          disabled={!appliedCriteria || filteredLogs.length === 0}
          style={{ opacity: !appliedCriteria || filteredLogs.length === 0 ? 0.5 : 1 }}
          title={!appliedCriteria ? 'Vui lòng thực hiện lọc trước khi xuất' : 'Xuất danh sách ra Excel'}
        >
          <FileSpreadsheet size={16} />
          Xuất Nhật Ký Ra Excel {appliedCriteria ? `(${filteredLogs.length})` : ''}
        </button>
      </div>

      {/* Security Banner Notice */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1e40af',
        borderRadius: '10px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: '0.85rem'
      }}>
        <Shield size={20} color="#2563eb" />
        <div>
          <strong>Chính sách bảo mật hệ thống:</strong> Nhật ký kiểm toán được lưu trữ theo thời gian thực và khóa chống chỉnh sửa hoặc xóa đối với mọi người dùng (kể cả tài khoản Quản trị viên).
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApplyFilter();
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'center' }}
        >
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Tìm kiếm theo người dùng, mã tài sản, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-select"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="ALL">-- Tất cả loại thao tác --</option>
              <option value="Kiểm kê">Kiểm kê tài sản</option>
              <option value="Nhập">Nhập tài sản mới</option>
              <option value="Điều chuyển">Điều chuyển vị trí</option>
              <option value="Thu hồi">Thu hồi về kho</option>
              <option value="Thanh lý">Thanh lý tài sản</option>
              <option value="Cập nhật">Cập nhật thông tin</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px 18px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Filter size={16} />
              Lọc & Xem nhật ký
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleReset}
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={16} />
              Đặt lại
            </button>
          </div>
        </form>

        {isFilterChanged && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #e2e8f0', fontSize: '0.8rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} />
            <span>Điều kiện tìm kiếm đã thay đổi. Vui lòng bấm <strong>"Lọc & Xem nhật ký"</strong> hoặc phím Enter để cập nhật kết quả.</span>
          </div>
        )}
      </div>

      {/* Conditional: Waiting placeholder vs Table */}
      {!appliedCriteria ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px', color: '#64748b' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#2563eb'
          }}>
            <Activity size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
            Nhật ký hệ thống đang ở chế độ chờ
          </h3>
          <p style={{ maxWidth: 520, margin: '0 auto 20px', fontSize: '0.875rem', lineHeight: 1.6, color: '#64748b' }}>
            Để tối ưu tốc độ và hiệu năng xử lý, hệ thống không tự động tải toàn bộ nhật ký trước.
            Vui lòng nhập từ khóa hoặc chọn loại thao tác và bấm nút <strong>"Lọc & Xem nhật ký"</strong>.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '10px 22px', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={() => handleApplyFilter()}
            >
              <Search size={16} />
              Lọc theo điều kiện trên
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={() => {
                setSearchTerm('');
                setFilterAction('ALL');
                handleApplyFilter({ search: '', action: 'ALL' });
              }}
            >
              Xem tất cả nhật ký ({auditLogs.length})
            </button>
          </div>
        </div>
      ) : (
        /* Audit Log Table */
        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Dữ Liệu Nhật Ký Sự Kiện ({filteredLogs.length} bản ghi)</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
              {appliedCriteria.action !== 'ALL' && <span>Thao tác: <strong>{appliedCriteria.action}</strong> • </span>}
              {appliedCriteria.search && <span>Từ khóa: <strong>"{appliedCriteria.search}"</strong></span>}
              {!appliedCriteria.search && appliedCriteria.action === 'ALL' && <span>Tất cả sự kiện</span>}
            </span>
          </h3>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                  <th>Thời gian</th>
                  <th>Người thực hiện</th>
                  <th>Vai trò</th>
                  <th>Thao tác</th>
                  <th>Đối tượng / Tài sản</th>
                  <th>Nội dung chi tiết</th>
                  <th>Địa chỉ IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <AlertCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.4, color: '#f59e0b', display: 'block' }} />
                      <div style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                        Không tìm thấy nhật ký phù hợp
                      </div>
                      <div style={{ fontSize: '0.825rem' }}>
                        Không có sự kiện nào khớp với điều kiện lọc hiện tại. Hãy thử tìm kiếm với từ khóa khác hoặc bấm "Đặt lại".
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr key={log.id}>
                      <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                        {index + 1}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={13} />
                          {log.timestamp}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.user}</div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{log.userEmail}</div>
                      </td>
                      <td>
                        <span className="badge badge-secondary" style={{ fontSize: '0.725rem' }}>
                          {log.role}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1e3a8a' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{log.target}</strong>
                      </td>
                      <td style={{ fontSize: '0.825rem', color: '#334155' }}>
                        {log.detail}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                        {log.ip}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
