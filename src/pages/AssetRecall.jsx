// src/pages/AssetRecall.jsx
import React, { useState, useMemo } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { generateRecallCode, formatDate } from '../utils/formatters';
import { printElement } from '../utils/printHelpers';
import { cleanText, canonicalStatus } from '../utils/normalize';
import Modal from '../components/common/Modal';
import {
  RotateCcw,
  Plus,
  Printer,
  Search,
  X,
  Trash2,
  CheckCircle,
  Package,
  MapPin,
  Building,
  User
} from 'lucide-react';

export default function AssetRecall() {
  const { assets, recalls, createRecall, deleteRecall } = useAssets();
  const { currentUser, permissions } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrintRecall, setSelectedPrintRecall] = useState(null);

  // Search & smart suggestions state
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Form inputs
  const [reason, setReason] = useState('');
  const [condition, setCondition] = useState('Tốt');

  const targetAsset = assets.find(a => a.id === selectedAssetId);

  // Danh sách tài sản có thể thu hồi (đang sử dụng hoặc đang điều chuyển, không tính đã thanh lý hoặc đã trong kho; giới hạn theo phòng cho QL phòng)
  const recallableAssets = useMemo(() => {
    let list = assets.filter(a => {
      const st = canonicalStatus(a.status);
      return st !== 'Đã thanh lý' && st !== 'Trong kho' && st !== 'Đã thu hồi';
    });
    if (!permissions?.isSuperAdmin) {
      const userDeptId = currentUser?.departmentId;
      const userDeptName = currentUser?.departmentName || currentUser?.department;
      list = list.filter(a => {
        const matchDeptId = userDeptId && a.departmentId && cleanText(a.departmentId).toLowerCase() === cleanText(userDeptId).toLowerCase();
        const matchDeptName = userDeptName && a.departmentName && cleanText(a.departmentName).toLowerCase() === cleanText(userDeptName).toLowerCase();
        return matchDeptId || matchDeptName;
      });
    }
    return list;
  }, [assets, permissions?.isSuperAdmin, currentUser]);

  // Lọc danh sách biên bản thu hồi: Super Admin thấy toàn bộ, QL phòng chỉ thấy phiếu của phòng mình
  const visibleRecalls = useMemo(() => {
    if (permissions?.isSuperAdmin) return recalls;
    const userDeptId = currentUser?.departmentId;
    const userDeptName = currentUser?.departmentName || currentUser?.department;
    return recalls.filter(r => {
      const matchDeptId = userDeptId && (r.departmentId || r.fromDepartmentId) && cleanText(r.departmentId || r.fromDepartmentId).toLowerCase() === cleanText(userDeptId).toLowerCase();
      const matchDeptName = userDeptName && (r.departmentName || r.fromDepartmentName) && cleanText(r.departmentName || r.fromDepartmentName).toLowerCase() === cleanText(userDeptName).toLowerCase();
      return matchDeptId || matchDeptName;
    });
  }, [recalls, permissions?.isSuperAdmin, currentUser]);

  // Gợi ý thông minh tìm kiếm tài sản thu hồi
  const filteredAssetSuggestions = useMemo(() => {
    if (!assetSearchTerm.trim()) {
      return recallableAssets.slice(0, 8);
    }
    const q = cleanText(assetSearchTerm).toLowerCase();
    return recallableAssets.filter(a =>
      cleanText(a.code).toLowerCase().includes(q) ||
      cleanText(a.name).toLowerCase().includes(q) ||
      cleanText(a.departmentName).toLowerCase().includes(q) ||
      cleanText(a.currentUser).toLowerCase().includes(q) ||
      cleanText(a.locationPath).toLowerCase().includes(q) ||
      cleanText(a.brand).toLowerCase().includes(q)
    ).slice(0, 10);
  }, [recallableAssets, assetSearchTerm]);

  const handleOpenCreateModal = () => {
    setSelectedAssetId('');
    setAssetSearchTerm('');
    setIsSearchFocused(false);
    setReason('');
    setCondition('Tốt');
    setIsModalOpen(true);
  };

  const handleCreateRecallSubmit = (e) => {
    e.preventDefault();
    if (!targetAsset) {
      alert('Vui lòng tìm kiếm và chọn 1 tài sản cần thu hồi!');
      return;
    }

    const code = generateRecallCode(recalls);
    const newRecall = {
      code,
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      departmentId: targetAsset.departmentId,
      departmentName: targetAsset.departmentName,
      fromLocation: targetAsset.locationPath || 'Chưa phân vị trí',
      fromDepartmentId: targetAsset.departmentId,
      fromDepartmentName: targetAsset.departmentName,
      fromUser: targetAsset.currentUser || targetAsset.responsiblePerson || '',
      fromStatus: targetAsset.status || 'Đang sử dụng',
      fromCondition: targetAsset.condition || 'Tốt',
      sender: targetAsset.currentUser || targetAsset.responsiblePerson || 'Cán bộ bàn giao',
      receiver: currentUser?.name || 'Thủ kho tiếp nhận',
      reason: reason.trim() || 'Thu hồi nhập kho theo kế hoạch',
      condition,
      date: new Date().toISOString().slice(0, 10)
    };

    createRecall(newRecall);
    setIsModalOpen(false);
    setSelectedAssetId('');
    setAssetSearchTerm('');
  };

  const handleDeleteRecall = (recall) => {
    const msg = `Xác nhận xóa biên bản thu hồi "${recall.code}"?\n\n⚠️ LƯU Ý QUAN TRỌNG: Khi xóa biên bản này, tài sản "${recall.assetName}" (${recall.assetCode}) sẽ TỰ ĐỘNG QUAY VỀ VỊ TRÍ VÀ TRẠNG THÁI CŨ:\n• Vị trí cũ: [${recall.fromLocation || 'Vị trí ban đầu'}]\n• Đơn vị quản lý: [${recall.departmentName || 'Chưa rõ'}]\n• Người bàn giao/giữ: [${recall.sender || 'Chưa rõ'}]\n• Trạng thái: Đang sử dụng`;
    if (window.confirm(msg)) {
      deleteRecall(recall.id);
    }
  };

  const handlePrintSlip = (recall) => {
    setSelectedPrintRecall(recall);
    setTimeout(() => {
      printElement('printable-recall-slip');
    }, 150);
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <RotateCcw size={26} color="#1e3a8a" />
            Thu Hồi Tài Sản Về Kho
          </h2>
          <p className="page-subtitle">
            Lập biên bản bàn giao thu hồi tài sản nhập kho, tự động lưu vết vị trí cũ và hỗ trợ hoàn trả khi xóa biên bản
          </p>
        </div>

        {permissions?.canProposeRecall && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} />
            Lập Phiếu Thu Hồi
          </button>
        )}
      </div>

      {/* Recalls List Table */}
      <div className="card">
        <h3 className="card-title">
          <span>Danh Sách Các Biên Bản Thu Hồi Tài Sản</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            Tổng số: {visibleRecalls.length} phiếu
          </span>
        </h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Số biên bản</th>
                <th>Tài sản thu hồi</th>
                <th>Đơn vị bàn giao</th>
                <th>Người bàn giao</th>
                <th>Tình trạng thu hồi</th>
                <th>Lý do / Mục đích</th>
                <th>Ngày thu hồi</th>
                <th style={{ textAlign: 'center', width: '170px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecalls.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Chưa có phiếu thu hồi nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                visibleRecalls.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                        {r.code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.assetName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                        Mã TS: {r.assetCode}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{r.departmentName}</span>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        📍 Vị trí cũ: {r.fromLocation || 'Chưa lưu'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.sender}</span>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Thu bởi: {r.receiver}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success">
                        {r.condition}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.825rem', maxWidth: '220px' }}>
                      <span title={r.reason}>{r.reason}</span>
                    </td>
                    <td style={{ fontSize: '0.825rem' }}>
                      {formatDate(r.date)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handlePrintSlip(r)}
                          title="In biên bản thu hồi A4"
                        >
                          <Printer size={14} /> In
                        </button>
                        {permissions?.canDeleteAsset && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteRecall(r)}
                            title="Xóa biên bản thu hồi (hoàn trả tài sản về vị trí cũ)"
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              borderColor: '#fecdd3'
                            }}
                          >
                            <Trash2 size={13} /> Xóa
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
      </div>

      {/* Modal: Tạo Phiếu Thu Hồi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Biên Bản Bàn Giao Thu Hồi Tài Sản Về Kho"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleCreateRecallSubmit}>
              <RotateCcw size={16} />
              Xác Nhận Thu Hồi Vào Kho
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateRecallSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {/* Tìm kiếm & Gợi ý thông minh tài sản */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Tìm kiếm & chọn tài sản cần thu hồi (*)</span>
                {targetAsset && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAssetId('');
                      setAssetSearchTerm('');
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#2563eb',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 500
                    }}
                  >
                    <RotateCcw size={12} /> Đổi tài sản khác
                  </button>
                )}
              </label>

              {!targetAsset ? (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={16}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#64748b'
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: 36, paddingRight: assetSearchTerm ? 36 : 12 }}
                      placeholder="Nhập mã tài sản, tên, phòng ban, người đang giữ để tìm nhanh..."
                      value={assetSearchTerm}
                      onChange={(e) => {
                        setAssetSearchTerm(e.target.value);
                        setIsSearchFocused(true);
                      }}
                      onFocus={() => setIsSearchFocused(true)}
                    />
                    {assetSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setAssetSearchTerm('')}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'transparent',
                          color: '#94a3b8',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Gợi ý thông minh */}
                  {isSearchFocused && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        marginTop: 4,
                        background: '#ffffff',
                        borderRadius: 8,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #cbd5e1',
                        maxHeight: 280,
                        overflowY: 'auto'
                      }}
                    >
                      <div style={{
                        padding: '6px 12px',
                        background: '#f1f5f9',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#475569',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>GỢI Ý TÀI SẢN CÓ THỂ THU HỒI ({filteredAssetSuggestions.length})</span>
                        <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setIsSearchFocused(false)}>Đóng</span>
                      </div>
                      {filteredAssetSuggestions.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                          Không tìm thấy tài sản nào phù hợp với từ khóa "{assetSearchTerm}"
                        </div>
                      ) : (
                        filteredAssetSuggestions.map((a) => (
                          <div
                            key={a.id}
                            onClick={() => {
                              setSelectedAssetId(a.id);
                              setAssetSearchTerm(`[${a.code}] ${a.name}`);
                              setIsSearchFocused(false);
                            }}
                            style={{
                              padding: '10px 14px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2,
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                                <span style={{ color: '#2563eb' }}>[{a.code}]</span> {a.name}
                              </span>
                              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                {a.departmentName || 'Chưa gán đơn vị'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 12, fontSize: '0.775rem', color: '#64748b' }}>
                              <span>📍 Vị trí: <strong>{a.locationPath || 'Chưa xếp'}</strong></span>
                              <span>👤 Người giữ: <strong>{a.currentUser || a.responsiblePerson || 'N/A'}</strong></span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Card thông tin chi tiết tài sản đã chọn */
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem' }}>
                      <span style={{ color: '#047857', background: '#d1fae5', padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>
                        {targetAsset.code}
                      </span>
                      {targetAsset.name}
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Đã chọn</span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '6px 12px',
                    fontSize: '0.825rem',
                    color: '#374151',
                    marginTop: 4,
                    paddingTop: 6,
                    borderTop: '1px dashed #86efac'
                  }}>
                    <div><strong>🏢 Đơn vị hiện tại:</strong> {targetAsset.departmentName}</div>
                    <div><strong>📍 Vị trí hiện tại:</strong> {targetAsset.locationPath || 'Chưa cập nhật'}</div>
                    <div><strong>👤 Người bàn giao:</strong> {targetAsset.currentUser || targetAsset.responsiblePerson || 'Chưa có'}</div>
                    <div><strong>🏷️ Nhãn hiệu:</strong> {targetAsset.brand || 'N/A'}</div>
                  </div>
                  <div style={{ color: '#059669', fontSize: '0.8rem', marginTop: 4, fontWeight: 600 }}>
                    ➔ Sau khi xác nhận, tài sản sẽ tự động chuyển vị trí về: Kho Tổng CS1 (Tầng trệt) & Trạng thái: Trong kho. Hệ thống tự động lưu vị trí cũ để hoàn trả khi xóa biên bản.
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tình trạng thực tế khi thu hồi</label>
                <select
                  className="form-select"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="Tốt">Tốt (Hoạt động bình thường)</option>
                  <option value="Khá">Khá (Có trầy xước nhẹ)</option>
                  <option value="Hỏng nhẹ">Hỏng nhẹ (Cần bảo dưỡng trước khi cấp tiếp)</option>
                  <option value="Hỏng nặng">Hỏng nặng (Không hoạt động)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mục đích / Lý do thu hồi (*)</label>
                <input
                  type="text"
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder=""
                  required
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Printable Recall Slip */}
      {selectedPrintRecall && (
        <div style={{ display: 'none' }}>
          <div id="printable-recall-slip">
            <div className="header">
              <div className="header-left">
                <strong>BỘ GIÁO DỤC VÀ ĐÀO TẠO</strong><br />
                <strong>TRƯỜNG ĐẠI HỌC</strong><br />
                Số: {selectedPrintRecall.code}
              </div>
              <div className="header-right">
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
                Độc lập - Tự do - Hạnh phúc<br />
                <em>Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</em>
              </div>
            </div>

            <div className="title">BIÊN BẢN THU HỒI TÀI SẢN VỀ KHO</div>

            <table style={{ marginTop: '16px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '30%', fontWeight: 'bold' }}>Tên tài sản thu hồi:</td>
                  <td><strong>{selectedPrintRecall.assetName}</strong></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Mã tài sản:</td>
                  <td>{selectedPrintRecall.assetCode}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Đơn vị bàn giao:</td>
                  <td>{selectedPrintRecall.departmentName}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Vị trí ban đầu:</td>
                  <td>{selectedPrintRecall.fromLocation || 'Chưa phân vị trí'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Người bàn giao:</td>
                  <td>{selectedPrintRecall.sender}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Người tiếp nhận (Thủ kho):</td>
                  <td>{selectedPrintRecall.receiver}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Tình trạng khi thu hồi:</td>
                  <td>{selectedPrintRecall.condition}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Lý do / Mục đích:</td>
                  <td>{selectedPrintRecall.reason}</td>
                </tr>
              </tbody>
            </table>

            <div className="signatures">
              <div className="sig-block">
                <strong>NGƯỜI BÀN GIAO</strong><br />
                <em>(Ký, ghi rõ họ tên)</em>
                <div className="sig-space"></div>
                <strong>{selectedPrintRecall.sender}</strong>
              </div>
              <div className="sig-block">
                <strong>THỦ KHO TIẾP NHẬN</strong><br />
                <em>(Ký, ghi rõ họ tên)</em>
                <div className="sig-space"></div>
                <strong>{selectedPrintRecall.receiver}</strong>
              </div>
              <div className="sig-block">
                <strong>TRƯỞNG PHÒNG HÀNH CHÍNH - QUẢN TRỊ</strong><br />
                <em>(Ký duyệt)</em>
                <div className="sig-space"></div>
                <strong>ThS. Lê Hoàng Long</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
