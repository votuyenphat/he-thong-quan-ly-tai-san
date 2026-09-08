// src/pages/AuditLogsPage.jsx
import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';

export default function AuditLogsPage() {
  const { auditLogs } = useAssets();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    if (filterAction !== 'ALL' && !log.action.toLowerCase().includes(filterAction.toLowerCase())) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.detail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportLogs = () => {
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

        <button className="btn btn-secondary" onClick={handleExportLogs}>
          <FileSpreadsheet size={16} />
          Xuất Nhật Ký Ra Excel
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
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
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <h3 className="card-title">
          <span>Dữ Liệu Nhật Ký Sự Kiện ({filteredLogs.length} bản ghi)</span>
        </h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
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
              {filteredLogs.map((log) => (
                <tr key={log.id}>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
