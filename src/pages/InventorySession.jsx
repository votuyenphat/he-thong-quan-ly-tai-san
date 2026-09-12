// src/pages/InventorySession.jsx
import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import { ConditionBadge, StatusBadge } from '../components/common/Badge';
import CameraScanner from '../components/common/CameraScanner';
import Modal from '../components/common/Modal';
import {
  ClipboardCheck,
  Camera,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  PlusCircle,
  Calendar,
  Search,
  Check,
  Building,
  User
} from 'lucide-react';

export default function InventorySession() {
  const { assets, inventorySessions, createInventorySession, recordInventoryItem } = useAssets();
  const { permissions, currentUser } = useAuth();

  // Selected Year Session
  const [selectedSessionId, setSelectedSessionId] = useState(
    inventorySessions.find(s => s.status === 'Đang diễn ra')?.id || inventorySessions[0]?.id || ''
  );

  const activeSession = inventorySessions.find(s => s.id === selectedSessionId) || inventorySessions[0];

  // Camera Scanner Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Record Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [targetAsset, setTargetAsset] = useState(null);
  const [recordCondition, setRecordCondition] = useState('Tốt');
  const [recordStatusResult, setRecordStatusResult] = useState('Có thực tế'); // 'Có thực tế' | 'Hỏng' | 'Sai vị trí' | 'Không tìm thấy' | 'Thừa ngoài sổ'
  const [recordNote, setRecordNote] = useState('');

  // New Session Creation Modal
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newScope, setNewScope] = useState('Toàn trường');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));

  // Search filter inside table
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenRecord = (asset) => {
    setTargetAsset(asset);
    const existingRecord = activeSession?.records?.[asset.id];
    if (existingRecord) {
      setRecordCondition(existingRecord.condition || asset.condition);
      setRecordStatusResult(existingRecord.statusResult || 'Có thực tế');
      setRecordNote(existingRecord.note || '');
    } else {
      setRecordCondition(asset.condition || 'Tốt');
      setRecordStatusResult('Có thực tế');
      setRecordNote('');
    }
    setIsRecordModalOpen(true);
  };

  const handleScanSuccess = (scannedAsset) => {
    handleOpenRecord(scannedAsset);
  };

  const handleSaveRecord = (e) => {
    e.preventDefault();
    if (!activeSession || !targetAsset) return;

    recordInventoryItem(activeSession.id, targetAsset.id, {
      condition: recordCondition,
      statusResult: recordStatusResult,
      note: recordNote.trim()
    });

    setIsRecordModalOpen(false);
  };

  const handleCreateSessionSubmit = (e) => {
    e.preventDefault();
    const newSession = createInventorySession({
      name: `Kiểm kê tài sản định kỳ năm ${newYear} (${newScope})`,
      year: Number(newYear),
      startDate,
      endDate,
      scope: newScope
    });
    setSelectedSessionId(newSession.id);
    setIsNewSessionOpen(false);
  };

  // Filter session asset records
  const sessionAssetList = assets.filter(a => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.departmentName.toLowerCase().includes(q) ||
        a.currentUser?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <ClipboardCheck size={26} color="#1e3a8a" />
            Kiểm Kê Tài Sản Hằng Năm & Quét Mã QR
          </h2>
          <p className="page-subtitle">
            Ghi nhận hiện trạng thực tế bằng camera quét mã QR, snapshot dữ liệu theo từng năm
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {permissions.canAudit && (
            <button className="btn btn-secondary" onClick={() => setIsNewSessionOpen(true)}>
              <PlusCircle size={16} />
              Mở Kỳ Kiểm Kê Mới
            </button>
          )}

          <button className="btn btn-primary" onClick={() => setIsCameraOpen(true)}>
            <Camera size={16} />
            Bật Camera Quét Mã QR
          </button>
        </div>
      </div>

      {/* Select Active Inventory Year */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Calendar size={20} color="#1e3a8a" />
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CHỌN KỲ KIỂM KÊ THEO NĂM:</span>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                {activeSession?.name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              className="form-select"
              style={{ minWidth: '220px', fontWeight: 600 }}
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
            >
              {inventorySessions.map(s => (
                <option key={s.id} value={s.id}>
                  Năm {s.year} - {s.status} ({s.scope})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Session Stats Progress */}
        {activeSession && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Tiến độ kiểm kê</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>
                {activeSession.checkedCount} / {activeSession.totalCount} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>tài sản</span>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.7rem', color: '#166534' }}>✅ Có thực tế</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>
                {activeSession.matchedCount}
              </div>
            </div>

            <div style={{ background: '#fffbeb', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.7rem', color: '#92400e' }}>⚠️ Hỏng hóc</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>
                {activeSession.damagedCount}
              </div>
            </div>

            <div style={{ background: '#fff7ed', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
              <div style={{ fontSize: '0.7rem', color: '#9a3412' }}>🔄 Sai vị trí</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c2410c' }}>
                {activeSession.wrongLocationCount}
              </div>
            </div>

            <div style={{ background: '#fef2f2', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '0.7rem', color: '#991b1b' }}>❌ Không tìm thấy</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>
                {activeSession.missingCount}
              </div>
            </div>

            <div style={{ background: '#eff6ff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.7rem', color: '#1e40af' }}>➕ Thừa ngoài sổ</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
                {activeSession.extraCount}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inventory Item Check Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            Danh Sách Kiểm Đếm Thực Tế Tại Kỳ Kiểm Kê
          </h3>

          <div style={{ position: 'relative', minWidth: '280px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 34 }}
              placeholder="Tìm nhanh tài sản trong đợt kiểm kê..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã tài sản</th>
                <th>Tên tài sản</th>
                <th>Vị trí theo sổ sách</th>
                <th>Người sử dụng</th>
                <th style={{ textAlign: 'center' }}>Kết quả kiểm kê thực tế</th>
                <th style={{ textAlign: 'center' }}>Tình trạng đánh giá</th>
                <th>Ghi chú / Người kiểm</th>
                <th style={{ textAlign: 'center', width: '130px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sessionAssetList.map((asset) => {
                const record = activeSession?.records?.[asset.id];
                const isChecked = !!record;

                return (
                  <tr key={asset.id} style={{ background: isChecked ? '#ffffff' : '#fffbeb' }}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                        {asset.code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{asset.name}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{asset.brand ? `${asset.brand} • ` : ''}{asset.type}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}>{asset.locationPath}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{asset.currentUser}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {record ? (
                        <span className={`badge ${
                          record.statusResult === 'Có thực tế' ? 'badge-success' :
                          record.statusResult === 'Hỏng' ? 'badge-warning' :
                          record.statusResult === 'Sai vị trí' ? 'badge-warning' :
                          record.statusResult === 'Không tìm thấy' ? 'badge-danger' : 'badge-info'
                        }`}>
                          {record.statusResult}
                        </span>
                      ) : (
                        <span className="badge badge-secondary" style={{ background: '#fef3c7', color: '#92400e' }}>
                          Chưa kiểm kê
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <ConditionBadge condition={record?.condition || asset.condition} />
                    </td>
                    <td>
                      {record ? (
                        <div style={{ fontSize: '0.775rem' }}>
                          <div>{record.note || 'Không có ghi chú'}</div>
                          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                            {record.checkedBy} ({record.checkedAt})
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>---</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`btn btn-sm ${isChecked ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleOpenRecord(asset)}
                      >
                        {isChecked ? 'Đổi kết quả' : 'Kiểm kê'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ghi Nhận Kết Quả Kiểm Kê 1 Tài Sản */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title={`Ghi Nhận Kiểm Kê Thực Tế: ${targetAsset?.code}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsRecordModalOpen(false)}>Hủy</button>
            <button className="btn btn-success" onClick={handleSaveRecord}>
              <Check size={16} />
              Lưu Kết Quả Kiểm Kê
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveRecord}>
          {targetAsset && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Asset Snapshot info */}
              <div style={{
                background: '#f8fafc',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{targetAsset.name}</div>
                <div style={{ color: '#64748b', marginTop: 4 }}>
                  Mã: <strong>{targetAsset.code}</strong> • Đơn vị sổ sách: <strong>{targetAsset.departmentName}</strong>
                </div>
                <div style={{ color: '#64748b' }}>
                  Vị trí đăng ký: <strong>{targetAsset.locationPath}</strong>
                </div>
                <div style={{ color: '#64748b' }}>
                  Người chịu trách nhiệm: <strong>{targetAsset.currentUser || targetAsset.responsiblePerson}</strong>
                </div>
              </div>

              {/* 5 lựa chọn nghiệp vụ kiểm kê yêu cầu */}
              <div>
                <label className="form-label">
                  Kết quả hiện diện thực tế tại thời điểm kiểm tra (*):
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 10
                }}>
                  {[
                    { val: 'Có thực tế', label: '✅ Có thực tế', color: '#15803d', bg: '#dcfce7' },
                    { val: 'Hỏng', label: '⚠️ Hỏng', color: '#b45309', bg: '#fef3c7' },
                    { val: 'Sai vị trí', label: '🔄 Sai vị trí', color: '#c2410c', bg: '#ffedd5' },
                    { val: 'Không tìm thấy', label: '❌ Không tìm thấy', color: '#dc2626', bg: '#fee2e2' },
                    { val: 'Thừa ngoài sổ', label: '➕ Thừa ngoài sổ', color: '#2563eb', bg: '#eff6ff' },
                  ].map(opt => {
                    const isSelected = recordStatusResult === opt.val;
                    return (
                      <div
                        key={opt.val}
                        onClick={() => setRecordStatusResult(opt.val)}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          background: isSelected ? opt.color : '#f8fafc',
                          color: isSelected ? '#ffffff' : '#334155',
                          border: isSelected ? `2px solid ${opt.color}` : '1px solid #cbd5e1',
                          transition: 'all 150ms'
                        }}
                      >
                        {opt.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Đánh giá tình trạng */}
              <div className="form-group">
                <label className="form-label">Tình trạng vật lý thực tế (*)</label>
                <select
                  className="form-select"
                  value={recordCondition}
                  onChange={(e) => setRecordCondition(e.target.value)}
                >
                  <option value="Tốt">Tốt (Hoạt động tốt, nguyên vẹn)</option>
                  <option value="Khá">Khá (Có hao mòn nhẹ nhưng dùng tốt)</option>
                  <option value="Hỏng nhẹ">Hỏng nhẹ (Cần bảo dưỡng/sửa chữa)</option>
                  <option value="Hỏng nặng">Hỏng nặng (Không hoạt động được)</option>
                  <option value="Không sử dụng được">Không sử dụng được (Chờ thanh lý)</option>
                </select>
              </div>

              {/* Ghi chú */}
              <div className="form-group">
                <label className="form-label">Ghi chú kiểm kê tại hiện trường</label>
                <textarea
                  className="form-textarea"
                  placeholder="Ghi chú chi tiết nếu phát hiện sai vị trí phòng ốc, thiếu phụ kiện, người sử dụng thực tế..."
                  value={recordNote}
                  onChange={(e) => setRecordNote(e.target.value)}
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Modal: Mở Kỳ Kiểm Kê Mới */}
      <Modal
        isOpen={isNewSessionOpen}
        onClose={() => setIsNewSessionOpen(false)}
        title="Thiết Lập Mở Kỳ Kiểm Kê Hằng Năm Mới"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsNewSessionOpen(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleCreateSessionSubmit}>
              <PlusCircle size={16} />
              Khởi Tạo Kỳ Kiểm Kê
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSessionSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Năm kiểm kê (*)</label>
              <input
                type="number"
                className="form-input"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                min="2020"
                max="2035"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phạm vi kiểm kê</label>
              <select
                className="form-select"
                value={newScope}
                onChange={(e) => setNewScope(e.target.value)}
              >
                <option value="Toàn trường">Toàn trường (Tất cả đơn vị & cơ sở)</option>
                <option value="Khối Hiệu bộ & Hành chính">Khối Hiệu bộ & Hành chính</option>
                <option value="Khối Các Khoa & Viện Đào tạo">Khối Các Khoa & Viện Đào tạo</option>
                <option value="Cơ sở 1">Chỉ Cơ sở 1</option>
                <option value="Cơ sở 2">Chỉ Cơ sở 2</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Ngày bắt đầu</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ngày kết thúc</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              * Hệ thống sẽ chụp snapshot danh sách toàn bộ tài sản tại thời điểm này để phục vụ đối chiếu thực tế và so sánh biến động.
            </p>
          </div>
        </form>
      </Modal>

      {/* Camera Scanner Modal */}
      {isCameraOpen && (
        <CameraScanner
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  );
}
