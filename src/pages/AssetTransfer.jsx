// src/pages/AssetTransfer.jsx
import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { generateTransferCode, formatDate } from '../utils/formatters';
import { printElement } from '../utils/printHelpers';
import Modal from '../components/common/Modal';
import {
  ArrowLeftRight,
  Plus,
  CheckCircle,
  Clock,
  Printer,
  FileText,
  MapPin,
  Building,
  User,
  ShieldCheck,
  XCircle
} from 'lucide-react';

export default function AssetTransfer() {
  const { assets, departments, transfers, createTransfer, approveTransfer } = useAssets();
  const { permissions, currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrintTransfer, setSelectedPrintTransfer] = useState(null);

  // Transfer Form State
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [toDeptId, setToDeptId] = useState(departments[1]?.id || '');
  const [toLocation, setToLocation] = useState('Cơ sở 1 > Khu A > Tầng 2 > Phòng A2.01');
  const [receiver, setReceiver] = useState('');
  const [reason, setReason] = useState('');

  const targetAsset = assets.find(a => a.id === selectedAssetId);
  const targetToDept = departments.find(d => d.id === toDeptId);

  const handleOpenCreateModal = () => {
    if (assets.length > 0) {
      setSelectedAssetId(assets[0].id);
      setReceiver(departments[1]?.manager || '');
    }
    setIsModalOpen(true);
  };

  const handleCreateTransferSubmit = (e) => {
    e.preventDefault();
    if (!targetAsset) return;

    const code = generateTransferCode(transfers);
    const newTransfer = {
      code,
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      fromDepartmentId: targetAsset.departmentId,
      fromDepartmentName: targetAsset.departmentName,
      fromLocation: targetAsset.locationPath,
      toDepartmentId: targetToDept?.id || '',
      toDepartmentName: targetToDept?.name || '',
      toLocation,
      sender: targetAsset.currentUser || targetAsset.responsiblePerson || currentUser?.name,
      receiver: receiver || 'Cán bộ tiếp nhận',
      reason: reason.trim() || 'Điều chuyển vị trí công tác phục vụ đào tạo'
    };

    createTransfer(newTransfer);
    setIsModalOpen(false);
    setReason('');
  };

  const handleApprove = (tId) => {
    if (window.confirm('Xác nhận phê duyệt phiếu điều chuyển này? Hệ thống sẽ tự động cập nhật vị trí mới cho tài sản.')) {
      approveTransfer(tId);
    }
  };

  const handlePrintSlip = (transfer) => {
    setSelectedPrintTransfer(transfer);
    setTimeout(() => {
      printElement('printable-transfer-slip');
    }, 150);
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <ArrowLeftRight size={26} color="#1e3a8a" />
            Điều Chuyển Vị Trí Tài Sản
          </h2>
          <p className="page-subtitle">
            Quy trình điều chuyển nghiêm ngặt: Lập phiếu ➔ Phê duyệt ➔ Tự động cập nhật vị trí & ghi lịch sử
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={16} />
          Tạo Phiếu Điều Chuyển Mới
        </button>
      </div>

      {/* Transfers List Table */}
      <div className="card">
        <h3 className="card-title">
          <span>Danh Sách Các Phiếu Điều Chuyển</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            Tổng số: {transfers.length} phiếu
          </span>
        </h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Số phiếu</th>
                <th>Tài sản điều chuyển</th>
                <th>Từ địa điểm (Hiện tại)</th>
                <th>Đến địa điểm (Mới)</th>
                <th>Người giao / Người nhận</th>
                <th>Ngày lập</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'center', width: '150px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Chưa có phiếu điều chuyển nào được lập.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                        {t.code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.assetName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                        Mã TS: {t.assetCode}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.825rem', color: '#475569' }}>
                        {t.fromDepartmentName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {t.fromLocation}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#2563eb' }}>
                        {t.toDepartmentName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>
                        {t.toLocation}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.825rem' }}>
                        Giao: <strong>{t.sender}</strong>
                      </div>
                      <div style={{ fontSize: '0.825rem', color: '#059669' }}>
                        Nhận: <strong>{t.receiver}</strong>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.825rem' }}>
                      {formatDate(t.date)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {t.status === 'Đã duyệt' ? (
                        <span className="badge badge-success">
                          <CheckCircle size={13} /> Đã duyệt
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <Clock size={13} /> Chờ duyệt
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {t.status === 'Chờ duyệt' && permissions.canApproveTransfer && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(t.id)}
                            title="Phê duyệt điều chuyển"
                          >
                            <ShieldCheck size={14} /> Duyệt
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handlePrintSlip(t)}
                          title="In phiếu điều chuyển A4"
                        >
                          <Printer size={14} /> In phiếu
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tạo Phiếu Điều Chuyển */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lập Phiếu Điều Chuyển Tài Sản Mới"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleCreateTransferSubmit}>
              <ArrowLeftRight size={16} />
              Gửi Phiếu Chờ Phê Duyệt
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTransferSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {/* Chọn tài sản */}
            <div className="form-group">
              <label className="form-label">Chọn tài sản cần điều chuyển (*)</label>
              <select
                className="form-select"
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
              >
                {assets.filter(a => a.status !== 'Đã thanh lý').map(a => (
                  <option key={a.id} value={a.id}>
                    [{a.code}] {a.name} - ({a.departmentName} - {a.currentUser})
                  </option>
                ))}
              </select>
            </div>

            {targetAsset && (
              <div style={{
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: 4 }}>VỊ TRÍ HIỆN TẠI:</div>
                <div>Đơn vị: <strong>{targetAsset.departmentName}</strong></div>
                <div>Vị trí: <strong>{targetAsset.locationPath}</strong></div>
                <div>Người bàn giao: <strong>{targetAsset.currentUser || targetAsset.responsiblePerson}</strong></div>
              </div>
            )}

            {/* Đến đơn vị mới */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Đến Phòng/Ban mới (*)</label>
                <select
                  className="form-select"
                  value={toDeptId}
                  onChange={(e) => {
                    setToDeptId(e.target.value);
                    const d = departments.find(x => x.id === e.target.value);
                    if (d) setReceiver(d.manager || '');
                  }}
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Người tiếp nhận bàn giao (*)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: TS. Phạm Minh Tuấn..."
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Vị trí phòng ốc mới chi tiết (*)</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Cơ sở 1 > Khu B > Tầng 2 > Giảng đường B2.01"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lý do điều chuyển (*)</label>
              <textarea
                className="form-textarea"
                placeholder="Nêu rõ mục đích điều chuyển, số công văn chỉ đạo (nếu có)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Hidden Printable Transfer Slip Template */}
      {selectedPrintTransfer && (
        <div style={{ display: 'none' }}>
          <div id="printable-transfer-slip">
            <div className="header">
              <div className="header-left">
                <strong>BỘ GIÁO DỤC VÀ ĐÀO TẠO</strong><br />
                <strong>TRƯỜNG ĐẠI HỌC</strong><br />
                Số: {selectedPrintTransfer.code}
              </div>
              <div className="header-right">
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
                Độc lập - Tự do - Hạnh phúc<br />
                <em>Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</em>
              </div>
            </div>

            <div className="title">BIÊN BẢN ĐIỀU CHUYỂN TÀI SẢN NỘI BỘ</div>

            <p>Hôm nay, đại diện các bên tiến hành bàn giao và tiếp nhận tài sản cố định như sau:</p>

            <table style={{ marginTop: '16px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '30%', fontWeight: 'bold' }}>Tên tài sản:</td>
                  <td><strong>{selectedPrintTransfer.assetName}</strong></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Mã định danh tài sản:</td>
                  <td>{selectedPrintTransfer.assetCode}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Bên giao (Đơn vị cũ):</td>
                  <td>{selectedPrintTransfer.fromDepartmentName} ({selectedPrintTransfer.fromLocation})</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Đại diện bên giao:</td>
                  <td>{selectedPrintTransfer.sender}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Bên nhận (Đơn vị mới):</td>
                  <td>{selectedPrintTransfer.toDepartmentName} ({selectedPrintTransfer.toLocation})</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Đại diện bên nhận:</td>
                  <td>{selectedPrintTransfer.receiver}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Lý do điều chuyển:</td>
                  <td>{selectedPrintTransfer.reason}</td>
                </tr>
              </tbody>
            </table>

            <div className="signatures">
              <div className="sig-block">
                <strong>ĐẠI DIỆN BÊN GIAO</strong><br />
                <em>(Ký, ghi rõ họ tên)</em>
                <div className="sig-space"></div>
                <strong>{selectedPrintTransfer.sender}</strong>
              </div>
              <div className="sig-block">
                <strong>ĐẠI DIỆN BÊN NHẬN</strong><br />
                <em>(Ký, ghi rõ họ tên)</em>
                <div className="sig-space"></div>
                <strong>{selectedPrintTransfer.receiver}</strong>
              </div>
              <div className="sig-block">
                <strong>BAN GIÁM HIỆU PHÊ DUYỆT</strong><br />
                <em>(Ký, đóng dấu)</em>
                <div className="sig-space"></div>
                <strong>{selectedPrintTransfer.approvedBy || 'Hiệu trưởng'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
