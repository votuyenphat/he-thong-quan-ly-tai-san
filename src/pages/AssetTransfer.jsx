// src/pages/AssetTransfer.jsx
import React, { useState, useMemo } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { generateTransferCode, formatDate } from '../utils/formatters';
import { printElement } from '../utils/printHelpers';
import { cleanText, canonicalStatus } from '../utils/normalize';
import Modal from '../components/common/Modal';
import LocationTreeSelector from '../components/common/LocationTreeSelector';
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
  XCircle,
  Search,
  X,
  Trash2,
  RotateCcw
} from 'lucide-react';

export default function AssetTransfer() {
  const { assets, departments, transfers, createTransfer, approveTransfer, deleteTransfer } = useAssets();
  const { permissions, currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrintTransfer, setSelectedPrintTransfer] = useState(null);

  // Transfer Form State - Multi asset support
  const [selectedItems, setSelectedItems] = useState([]);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [toDeptId, setToDeptId] = useState(departments[0]?.id || '');
  const [toLocation, setToLocation] = useState(''); // Để trống không gợi ý theo yêu cầu
  const [receiver, setReceiver] = useState('');
  const [reason, setReason] = useState('');

  const targetToDept = departments.find(d => d.id === toDeptId);

  // Gợi ý thông minh danh sách tài sản (loại trừ tài sản đã thanh lý và giới hạn theo phòng nếu là QL phòng)
  const filteredAssetSuggestions = useMemo(() => {
    let available = assets.filter(a => canonicalStatus(a.status) !== 'Đã thanh lý');
    if (!permissions?.isSuperAdmin) {
      const userDeptId = currentUser?.departmentId;
      const userDeptName = currentUser?.departmentName || currentUser?.department;
      available = available.filter(a => {
        const matchDeptId = userDeptId && a.departmentId && cleanText(a.departmentId).toLowerCase() === cleanText(userDeptId).toLowerCase();
        const matchDeptName = userDeptName && a.departmentName && cleanText(a.departmentName).toLowerCase() === cleanText(userDeptName).toLowerCase();
        return matchDeptId || matchDeptName;
      });
    }

    if (!assetSearchTerm.trim()) {
      return available.slice(0, 8);
    }
    const q = cleanText(assetSearchTerm).toLowerCase();
    return available.filter(a =>
      cleanText(a.code).toLowerCase().includes(q) ||
      cleanText(a.name).toLowerCase().includes(q) ||
      cleanText(a.departmentName).toLowerCase().includes(q) ||
      cleanText(a.currentUser).toLowerCase().includes(q) ||
      cleanText(a.locationPath).toLowerCase().includes(q) ||
      cleanText(a.brand).toLowerCase().includes(q)
    ).slice(0, 10);
  }, [assets, assetSearchTerm, permissions?.isSuperAdmin, currentUser]);

  // Thêm tài sản vào danh sách điều chuyển
  const handleAddItem = (asset) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.assetId === asset.id);
      if (existing) {
        const maxQty = Number(asset.quantity) || 1;
        return prev.map(i => i.assetId === asset.id ? { ...i, quantity: Math.min(maxQty, i.quantity + 1) } : i);
      }
      return [
        ...prev,
        {
          assetId: asset.id,
          assetCode: asset.code,
          assetName: asset.name,
          quantity: 1,
          maxQuantity: Number(asset.quantity) || 1,
          unit: asset.unit || 'cái',
          departmentId: asset.departmentId,
          departmentName: asset.departmentName,
          fromLocation: asset.locationPath || 'Chưa phân vị trí',
          fromUser: asset.currentUser || asset.responsiblePerson || '',
          condition: asset.condition || 'Tốt',
          brand: asset.brand || ''
        }
      ];
    });
    setAssetSearchTerm('');
    setIsSearchFocused(false);
  };

  // Xóa tài sản khỏi danh sách chọn
  const handleRemoveItem = (assetId) => {
    setSelectedItems(prev => prev.filter(i => i.assetId !== assetId));
  };

  // Cập nhật số lượng của tài sản được chọn
  const handleUpdateItemQuantity = (assetId, deltaOrValue, isDirect = false) => {
    setSelectedItems(prev => prev.map(i => {
      if (i.assetId === assetId) {
        let newQty = isDirect ? Number(deltaOrValue) : i.quantity + deltaOrValue;
        if (isNaN(newQty) || newQty < 1) newQty = 1;
        if (newQty > i.maxQuantity) newQty = i.maxQuantity;
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  // Lọc danh sách phiếu: Super Admin thấy tất cả; Quản lý phòng thấy phiếu gửi đi VÀ gửi đến phòng mình
  const visibleTransfers = useMemo(() => {
    if (permissions?.isSuperAdmin) return transfers;
    const userDeptId = currentUser?.departmentId;
    const userDeptName = currentUser?.departmentName || currentUser?.department;
    return transfers.filter(t => {
      const matchFromId = userDeptId && t.fromDepartmentId && cleanText(t.fromDepartmentId).toLowerCase() === cleanText(userDeptId).toLowerCase();
      const matchToId = userDeptId && t.toDepartmentId && cleanText(t.toDepartmentId).toLowerCase() === cleanText(userDeptId).toLowerCase();
      const matchFromName = userDeptName && t.fromDepartmentName && cleanText(t.fromDepartmentName).toLowerCase() === cleanText(userDeptName).toLowerCase();
      const matchToName = userDeptName && t.toDepartmentName && cleanText(t.toDepartmentName).toLowerCase() === cleanText(userDeptName).toLowerCase();
      return matchFromId || matchToId || matchFromName || matchToName;
    });
  }, [transfers, permissions?.isSuperAdmin, currentUser]);

  const handleOpenCreateModal = () => {
    setSelectedItems([]);
    setAssetSearchTerm('');
    setIsSearchFocused(false);
    setToDeptId(departments[0]?.id || '');
    setToLocation(''); // Vị trí phòng ốc mới chi tiết để trống không gợi ý
    setReceiver(departments[0]?.manager || '');
    setReason('');
    setIsModalOpen(true);
  };

  const handleCreateTransferSubmit = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Vui lòng tìm kiếm và chọn ít nhất 1 tài sản cần điều chuyển!');
      return;
    }
    if (!toLocation.trim()) {
      alert('Vui lòng chọn hoặc nhập vị trí phòng ốc mới chi tiết!');
      return;
    }

    const code = generateTransferCode(transfers);
    const primary = selectedItems[0];
    const totalQty = selectedItems.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
    const assetNameDisplay = selectedItems.length === 1 
      ? primary.assetName 
      : `${primary.assetName} (+${selectedItems.length - 1} tài sản khác)`;
    const assetCodeDisplay = selectedItems.length === 1 
      ? primary.assetCode 
      : `${primary.assetCode} (+${selectedItems.length - 1})`;

    const newTransfer = {
      code,
      assetId: primary.assetId,
      assetCode: assetCodeDisplay,
      assetName: assetNameDisplay,
      quantity: totalQty,
      unit: primary.unit || 'cái',
      items: selectedItems.map(i => ({ ...i })),
      fromDepartmentId: primary.departmentId,
      fromDepartmentName: primary.departmentName,
      fromLocation: primary.fromLocation,
      toDepartmentId: targetToDept?.id || '',
      toDepartmentName: targetToDept?.name || '',
      toLocation: cleanText(toLocation),
      sender: primary.fromUser || currentUser?.name || 'Cán bộ bàn giao',
      receiver: receiver.trim() || 'Cán bộ tiếp nhận',
      reason: reason.trim() || 'Điều chuyển vị trí công tác phục vụ đào tạo',
      date: new Date().toISOString().slice(0, 10)
    };

    createTransfer(newTransfer);
    setIsModalOpen(false);
    setReason('');
    setSelectedItems([]);
    setAssetSearchTerm('');
    setToLocation('');
  };

  const handleApprove = (tId) => {
    if (window.confirm('Xác nhận phê duyệt phiếu điều chuyển này? Hệ thống sẽ tự động cập nhật vị trí mới cho toàn bộ tài sản trong phiếu.')) {
      approveTransfer(tId);
    }
  };

  const handleDeleteTransfer = (transfer) => {
    const isApproved = transfer.status === 'Đã duyệt';
    const hasMultiple = transfer.items && transfer.items.length > 1;
    const itemsCountText = hasMultiple ? `${transfer.items.length} tài sản` : `tài sản "${transfer.assetName}" (${transfer.assetCode})`;
    const msg = isApproved
      ? `Xác nhận xóa phiếu điều chuyển "${transfer.code}"?\n\n⚠️ LƯU Ý QUAN TRỌNG: Phiếu này đã được duyệt. Khi xóa, ${itemsCountText} sẽ TỰ ĐỘNG QUAY VỀ VỊ TRÍ BAN ĐẦU:\n• Vị trí cũ: [${transfer.fromLocation || 'Chưa rõ'}]\n• Đơn vị quản lý: [${transfer.fromDepartmentName || 'Chưa rõ'}]`
      : `Xác nhận xóa phiếu điều chuyển "${transfer.code}"?`;

    if (window.confirm(msg)) {
      deleteTransfer(transfer.id);
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

        {permissions?.canProposeTransfer && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} />
            Tạo Phiếu Điều Chuyển Mới
          </button>
        )}
      </div>

      {/* Transfers List Table */}
      <div className="card">
        <h3 className="card-title">
          <span>Danh Sách Các Phiếu Điều Chuyển</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            Tổng số: {visibleTransfers.length} phiếu
          </span>
        </h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Số phiếu</th>
                <th>Tài sản điều chuyển</th>
                <th>Từ địa điểm (Ban đầu)</th>
                <th>Đến địa điểm (Mới)</th>
                <th>Người giao / Người nhận</th>
                <th>Ngày lập</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'center', width: '190px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {visibleTransfers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Chưa có phiếu điều chuyển nào phù hợp.
                  </td>
                </tr>
              ) : (
                visibleTransfers.map((t) => {
                  const isIncoming = !permissions?.isSuperAdmin && (
                    (currentUser?.departmentId && t.toDepartmentId && cleanText(t.toDepartmentId).toLowerCase() === cleanText(currentUser.departmentId).toLowerCase()) ||
                    (cleanText(t.toDepartmentName).toLowerCase() === cleanText(currentUser?.departmentName || currentUser?.department).toLowerCase())
                  );
                  return (
                    <tr key={t.id} style={{ background: isIncoming ? '#f0fdf4' : 'transparent' }}>
                      <td>
                        <span style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                          {t.code}
                        </span>
                        {isIncoming && (
                          <span style={{
                            display: 'block',
                            background: '#dbeafe',
                            color: '#1e40af',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 4,
                            marginTop: 4,
                            width: 'fit-content'
                          }}>
                            📥 Chuyển đến phòng
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{t.assetName}</span>
                          {t.items && t.items.length > 1 && (
                            <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                              {t.items.length} tài sản
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                            Mã TS: {t.assetCode}
                          </span>
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                            Tổng SL: {t.quantity || 1} {t.unit || 'cái'}
                          </span>
                        </div>
                        {t.items && t.items.length > 1 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                            {t.items.map((it, idx) => (
                              <span key={idx} style={{
                                background: '#f1f5f9',
                                color: '#475569',
                                fontSize: '0.7rem',
                                padding: '1px 5px',
                                borderRadius: 3,
                                border: '1px solid #e2e8f0'
                              }}>
                                {it.assetCode} ({it.quantity})
                              </span>
                            ))}
                          </div>
                        )}
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
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
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
                        {permissions.canManageAssets && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteTransfer(t)}
                            title="Xóa phiếu điều chuyển (hoàn trả tài sản về vị trí ban đầu)"
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
                );
              })
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
            {/* Bộ tìm kiếm & thêm tài sản vào danh sách điều chuyển */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">
                Tìm kiếm & chọn tài sản cần điều chuyển (*)
              </label>

              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      color: '#64748b',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 36, paddingRight: assetSearchTerm ? 36 : 12 }}
                    placeholder="Nhập mã tài sản, tên, đơn vị, người sử dụng để tìm kiếm và thêm vào danh sách..."
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
                      <span>GỢI Ý TÀI SẢN PHÙ HỢP ({filteredAssetSuggestions.length})</span>
                      <span style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setIsSearchFocused(false)}>Đóng [X]</span>
                    </div>
                    {filteredAssetSuggestions.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                        Không tìm thấy tài sản nào phù hợp với từ khóa "{assetSearchTerm}"
                      </div>
                    ) : (
                      filteredAssetSuggestions.map((a) => {
                        const isAlreadySelected = selectedItems.some(i => i.assetId === a.id);
                        return (
                          <div
                            key={a.id}
                            onClick={() => handleAddItem(a)}
                            style={{
                              padding: '10px 14px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: isAlreadySelected ? '#f0fdf4' : '#ffffff',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = isAlreadySelected ? '#dcfce7' : '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = isAlreadySelected ? '#f0fdf4' : '#ffffff'}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                                <span style={{ color: '#2563eb' }}>[{a.code}]</span> {a.name}
                              </span>
                              <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#64748b' }}>
                                <span>🏢 {a.departmentName || 'Chưa gán đơn vị'}</span>
                                <span>📍 {a.locationPath || 'Chưa xếp'}</span>
                                <span>👤 {a.currentUser || a.responsiblePerson || 'N/A'}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                background: '#fef3c7',
                                color: '#b45309',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontWeight: 600
                              }}>
                                Có: {a.quantity || 1} {a.unit || 'cái'}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{
                                  background: isAlreadySelected ? '#16a34a' : '#2563eb',
                                  color: '#fff',
                                  padding: '4px 8px',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {isAlreadySelected ? '✓ Đã thêm (+1)' : '+ Chọn'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bảng danh sách tài sản điều chuyển đã chọn */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                  Danh sách tài sản cần điều chuyển ({selectedItems.length})
                </label>
                {selectedItems.length > 0 && (
                  <div style={{
                    background: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    borderRadius: 20,
                    padding: '3px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    Đã chọn: {selectedItems.length} tài sản • Tổng SL điều chuyển: {selectedItems.reduce((s, i) => s + i.quantity, 0)} cái
                  </div>
                )}
              </div>

              {selectedItems.length === 0 ? (
                <div style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: 8,
                  padding: '24px',
                  textAlign: 'center',
                  color: '#64748b',
                  background: '#f8fafc'
                }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    Chưa có tài sản nào được chọn điều chuyển. Vui lòng tìm kiếm và bấm <strong>+ Chọn</strong> ở trên.
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.775rem', color: '#94a3b8' }}>
                    (Có thể điều chuyển cùng lúc nhiều tài sản và điều chỉnh số lượng cho từng tài sản)
                  </p>
                </div>
              ) : (
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  overflow: 'hidden',
                  maxHeight: 280,
                  overflowY: 'auto'
                }}>
                  <table className="table" style={{ margin: 0, fontSize: '0.825rem' }}>
                    <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                        <th>Mã & Tên tài sản</th>
                        <th>Vị trí hiện tại</th>
                        <th>Người bàn giao</th>
                        <th style={{ textAlign: 'center', width: '190px' }}>Số lượng chuyển</th>
                        <th style={{ width: '50px', textAlign: 'center' }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item, index) => (
                        <tr key={item.assetId}>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.assetName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#2563eb', fontFamily: 'monospace' }}>
                              {item.assetCode}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.775rem', color: '#475569' }}>{item.departmentName}</div>
                            <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{item.fromLocation}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', color: '#334155' }}>{item.fromUser || 'Chưa gán'}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 8px', fontWeight: 700, height: 26 }}
                                onClick={() => handleUpdateItemQuantity(item.assetId, -1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                className="form-input"
                                style={{
                                  width: '55px',
                                  textAlign: 'center',
                                  padding: '2px 4px',
                                  fontWeight: 700,
                                  height: 26
                                }}
                                min={1}
                                max={item.maxQuantity}
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(item.assetId, e.target.value, true)}
                              />
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 8px', fontWeight: 700, height: 26 }}
                                onClick={() => handleUpdateItemQuantity(item.assetId, 1)}
                                disabled={item.quantity >= item.maxQuantity}
                              >
                                +
                              </button>
                              {item.maxQuantity > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', height: 26, whiteSpace: 'nowrap' }}
                                  onClick={() => handleUpdateItemQuantity(item.assetId, item.maxQuantity, true)}
                                  title={`Chọn tối đa ${item.maxQuantity}`}
                                >
                                  Tất cả ({item.maxQuantity})
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.assetId)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: 4
                              }}
                              title="Xóa khỏi danh sách"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

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

            <LocationTreeSelector
              value={toLocation}
              onChange={setToLocation}
              required
              label="Vị trí phòng ốc mới chi tiết (*)"
              placeholder="VD: Cơ sở 1 > Khu B > Tầng 2 > Giảng đường B2.01"
            />

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

            {selectedPrintTransfer.items && selectedPrintTransfer.items.length > 1 ? (
              <>
                <table style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '25%', fontWeight: 'bold' }}>Bên giao (Đơn vị cũ):</td>
                      <td>{selectedPrintTransfer.fromDepartmentName} ({selectedPrintTransfer.fromLocation})</td>
                      <td style={{ width: '20%', fontWeight: 'bold' }}>Đại diện bên giao:</td>
                      <td>{selectedPrintTransfer.sender}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Bên nhận (Đơn vị mới):</td>
                      <td>{selectedPrintTransfer.toDepartmentName} ({selectedPrintTransfer.toLocation})</td>
                      <td style={{ fontWeight: 'bold' }}>Đại diện bên nhận:</td>
                      <td>{selectedPrintTransfer.receiver}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Lý do điều chuyển:</td>
                      <td colSpan="3">{selectedPrintTransfer.reason}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ fontWeight: 'bold', margin: '14px 0 8px', fontSize: '13px', textTransform: 'uppercase' }}>
                  DANH MỤC CHI TIẾT TÀI SẢN ĐIỀU CHUYỂN ({selectedPrintTransfer.items.length} TÀI SẢN):
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '35px' }}>STT</th>
                      <th style={{ border: '1px solid #333', padding: '6px', width: '100px' }}>Mã TS</th>
                      <th style={{ border: '1px solid #333', padding: '6px' }}>Tên tài sản</th>
                      <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '60px' }}>ĐVT</th>
                      <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '70px' }}>Số lượng</th>
                      <th style={{ border: '1px solid #333', padding: '6px' }}>Vị trí / Đơn vị ban đầu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrintTransfer.items.map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #333', padding: '6px', fontFamily: 'monospace' }}>{it.assetCode}</td>
                        <td style={{ border: '1px solid #333', padding: '6px', fontWeight: 'bold' }}>{it.assetName}</td>
                        <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>{it.unit || 'cái'}</td>
                        <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{it.quantity}</td>
                        <td style={{ border: '1px solid #333', padding: '6px', fontSize: '11px' }}>
                          {it.departmentName} {it.fromLocation ? `(${it.fromLocation})` : ''}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                      <td colSpan="4" style={{ border: '1px solid #333', padding: '6px', textAlign: 'right' }}>TỔNG CỘNG:</td>
                      <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>
                        {selectedPrintTransfer.items.reduce((s, i) => s + (Number(i.quantity) || 1), 0)}
                      </td>
                      <td style={{ border: '1px solid #333', padding: '6px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </>
            ) : (
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
                    <td style={{ fontWeight: 'bold' }}>Số lượng điều chuyển:</td>
                    <td><strong>{selectedPrintTransfer.quantity || 1} {selectedPrintTransfer.unit || 'cái'}</strong></td>
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
            )}

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
