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

  // Multi-asset selection state
  const [selectedItems, setSelectedItems] = useState([]);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Form inputs
  const [reason, setReason] = useState('');
  const [condition, setCondition] = useState('Tốt');

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
      return recallableAssets.slice(0, 10);
    }
    const q = cleanText(assetSearchTerm).toLowerCase();
    return recallableAssets.filter(a =>
      cleanText(a.code).toLowerCase().includes(q) ||
      cleanText(a.name).toLowerCase().includes(q) ||
      cleanText(a.departmentName).toLowerCase().includes(q) ||
      cleanText(a.currentUser).toLowerCase().includes(q) ||
      cleanText(a.locationPath).toLowerCase().includes(q) ||
      cleanText(a.brand).toLowerCase().includes(q)
    ).slice(0, 12);
  }, [recallableAssets, assetSearchTerm]);

  // Thêm tài sản vào danh sách chọn
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

  const handleOpenCreateModal = () => {
    setSelectedItems([]);
    setAssetSearchTerm('');
    setIsSearchFocused(false);
    setReason('');
    setCondition('Tốt');
    setIsModalOpen(true);
  };

  const handleCreateRecallSubmit = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Vui lòng tìm kiếm và chọn ít nhất 1 tài sản cần thu hồi!');
      return;
    }

    const code = generateRecallCode(recalls);
    const primary = selectedItems[0];
    const totalQty = selectedItems.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
    const assetNameDisplay = selectedItems.length === 1 
      ? primary.assetName 
      : `${primary.assetName} (+${selectedItems.length - 1} tài sản khác)`;
    const assetCodeDisplay = selectedItems.length === 1 
      ? primary.assetCode 
      : `${primary.assetCode} (+${selectedItems.length - 1})`;

    const newRecall = {
      code,
      assetId: primary.assetId,
      assetCode: assetCodeDisplay,
      assetName: assetNameDisplay,
      quantity: totalQty,
      unit: primary.unit || 'cái',
      items: selectedItems.map(i => ({ ...i })),
      departmentId: primary.departmentId,
      departmentName: primary.departmentName,
      fromLocation: primary.fromLocation,
      fromDepartmentId: primary.departmentId,
      fromDepartmentName: primary.departmentName,
      fromUser: primary.fromUser,
      fromStatus: 'Đang sử dụng',
      fromCondition: primary.condition || 'Tốt',
      sender: primary.fromUser || 'Cán bộ bàn giao',
      receiver: currentUser?.name || 'Thủ kho tiếp nhận',
      reason: reason.trim() || 'Thu hồi nhập kho theo kế hoạch',
      condition,
      date: new Date().toISOString().slice(0, 10)
    };

    createRecall(newRecall);
    setIsModalOpen(false);
    setSelectedItems([]);
    setAssetSearchTerm('');
  };

  const handleDeleteRecall = (recall) => {
    const itemCount = recall.items && recall.items.length > 0 ? recall.items.length : 1;
    const msg = `Xác nhận xóa biên bản thu hồi "${recall.code}"?\n\n⚠️ LƯU Ý QUAN TRỌNG: Khi xóa biên bản này, ${itemCount} tài sản sẽ TỰ ĐỘNG QUAY VỀ VỊ TRÍ VÀ TRẠNG THÁI CŨ trước khi thu hồi.\n• Trạng thái: Đang sử dụng`;
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
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                          📦 {r.items?.length || 1} tài sản (Tổng: {r.quantity || 1} {r.unit || 'cái'})
                        </span>
                      </div>
                      {r.items && r.items.length > 1 && (
                        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: 3 }}>
                          {r.items.map(i => `[${i.assetCode}] ${i.assetName} (SL: ${i.quantity})`).join(', ')}
                        </div>
                      )}
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

      {/* Modal: Tạo Phiếu Thu Hồi (Hỗ trợ chọn nhiều tài sản cùng 1 lần) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Biên Bản Bàn Giao Thu Hồi Tài Sản Về Kho (Nhiều Tài Sản)"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleCreateRecallSubmit} disabled={selectedItems.length === 0}>
              <RotateCcw size={16} />
              Xác Nhận Thu Hồi {selectedItems.length > 0 ? `(${selectedItems.length} tài sản)` : 'Vào Kho'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateRecallSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            {/* Tìm kiếm & Thêm nhanh tài sản */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Tìm kiếm & Thêm tài sản vào danh sách thu hồi (*)</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Có thể chọn nhiều tài sản trên cùng 1 biên bản
                </span>
              </label>

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
                  placeholder="Nhập mã tài sản, tên, phòng ban để tìm và bấm thêm..."
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
                      filteredAssetSuggestions.map((a) => {
                        const isAlready = selectedItems.some(i => i.assetId === a.id);
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
                              background: isAlready ? '#f0fdf4' : '#ffffff',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => !isAlready && (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={(e) => !isAlready && (e.currentTarget.style.background = '#ffffff')}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                                <span style={{ color: '#2563eb', marginRight: 4 }}>[{a.code}]</span> {a.name}
                              </div>
                              <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                <span>🏢 {a.departmentName || 'Chưa gán'}</span>
                                <span>📍 {a.locationPath || 'Chưa xếp'}</span>
                                <span>👤 {a.currentUser || a.responsiblePerson || 'N/A'}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                fontSize: '0.725rem',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontWeight: 700
                              }}>
                                Có sẵn: {a.quantity || 1} {a.unit || 'cái'}
                              </span>
                              {isAlready ? (
                                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>✓ Đã thêm</span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddItem(a);
                                  }}
                                >
                                  + Chọn
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* BẢNG TÀI SẢN ĐÃ CHỌN (HỖ TRỢ NHIỀU TÀI SẢN & SỐ LƯỢNG) */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>DANH SÁCH TÀI SẢN THU HỒI</span>
                  <span style={{
                    background: selectedItems.length > 0 ? '#dcfce7' : '#f1f5f9',
                    color: selectedItems.length > 0 ? '#15803d' : '#64748b',
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontWeight: 700,
                    border: selectedItems.length > 0 ? '1px solid #86efac' : 'none'
                  }}>
                    {selectedItems.length} tài sản • Tổng SL: {selectedItems.reduce((s, i) => s + (Number(i.quantity) || 1), 0)} cái
                  </span>
                </div>
                {selectedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedItems([])}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#dc2626',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {selectedItems.length === 0 ? (
                <div style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.85rem',
                  background: '#ffffff',
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1'
                }}>
                  Chưa có tài sản nào trong danh sách. Vui lòng tìm kiếm ở trên và bấm <strong>"+ Chọn"</strong> để thêm một hoặc nhiều tài sản.
                </div>
              ) : (
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
                  <table className="table" style={{ margin: 0, fontSize: '0.825rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ width: '36px', textAlign: 'center' }}>STT</th>
                        <th>Mã & Tên tài sản</th>
                        <th>Vị trí hiện tại</th>
                        <th style={{ textAlign: 'center', width: '80px' }}>Hiện có</th>
                        <th style={{ textAlign: 'center', width: '160px' }}>SL thu hồi</th>
                        <th style={{ width: '40px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item, idx) => (
                        <tr key={item.assetId}>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              <span style={{ color: '#2563eb', marginRight: 4 }}>[{item.assetCode}]</span>
                              {item.assetName}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                              {item.departmentName || 'Chưa gán đơn vị'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.75rem', color: '#475569' }}>{item.fromLocation}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>👤 {item.fromUser || 'N/A'}</div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#059669' }}>
                            {item.maxQuantity} {item.unit}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 8px', height: '26px', fontWeight: 700 }}
                                onClick={() => handleUpdateItemQuantity(item.assetId, -1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                className="form-input"
                                style={{ width: '48px', height: '26px', padding: '2px', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}
                                min={1}
                                max={item.maxQuantity}
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(item.assetId, e.target.value, true)}
                              />
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 8px', height: '26px', fontWeight: 700 }}
                                onClick={() => handleUpdateItemQuantity(item.assetId, 1)}
                                disabled={item.quantity >= item.maxQuantity}
                              >
                                +
                              </button>
                              {item.maxQuantity > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '2px 6px', height: '26px', fontSize: '0.7rem' }}
                                  onClick={() => handleUpdateItemQuantity(item.assetId, item.maxQuantity, true)}
                                  title="Chọn toàn bộ số lượng"
                                >
                                  Tất cả
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
                                color: '#dc2626',
                                cursor: 'pointer',
                                padding: 2
                              }}
                              title="Bỏ chọn tài sản này"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tình trạng thực tế chung khi thu hồi</label>
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
                  placeholder="Nhập lý do thu hồi nhập kho..."
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

            <p style={{ marginTop: '12px' }}>
              <strong>Lý do thu hồi:</strong> {selectedPrintRecall.reason} &nbsp;|&nbsp; <strong>Tình trạng:</strong> {selectedPrintRecall.condition}
            </p>

            {selectedPrintRecall.items && selectedPrintRecall.items.length > 0 ? (
              <table style={{ marginTop: '14px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ width: '40px', textAlign: 'center', border: '1px solid #333' }}>STT</th>
                    <th style={{ border: '1px solid #333' }}>Mã tài sản</th>
                    <th style={{ border: '1px solid #333' }}>Tên tài sản thu hồi</th>
                    <th style={{ textAlign: 'center', width: '60px', border: '1px solid #333' }}>ĐVT</th>
                    <th style={{ textAlign: 'center', width: '70px', border: '1px solid #333' }}>Số lượng</th>
                    <th style={{ border: '1px solid #333' }}>Đơn vị / Vị trí bàn giao</th>
                    <th style={{ border: '1px solid #333' }}>Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPrintRecall.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', border: '1px solid #333' }}>{idx + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, border: '1px solid #333' }}>{item.assetCode}</td>
                      <td style={{ border: '1px solid #333' }}><strong>{item.assetName}</strong></td>
                      <td style={{ textAlign: 'center', border: '1px solid #333' }}>{item.unit || 'cái'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, border: '1px solid #333' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #333' }}>{item.departmentName} - {item.fromLocation}</td>
                      <td style={{ border: '1px solid #333' }}>{item.condition || selectedPrintRecall.condition}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                    <td colSpan="4" style={{ textAlign: 'right', border: '1px solid #333' }}>Tổng cộng:</td>
                    <td style={{ textAlign: 'center', border: '1px solid #333' }}>
                      {selectedPrintRecall.quantity || selectedPrintRecall.items.reduce((s, i) => s + (Number(i.quantity) || 1), 0)}
                    </td>
                    <td colSpan="2" style={{ border: '1px solid #333' }}>
                      {selectedPrintRecall.items.length} danh mục tài sản
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
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
                    <td style={{ fontWeight: 'bold' }}>Số lượng thu hồi:</td>
                    <td><strong>{selectedPrintRecall.quantity || 1} {selectedPrintRecall.unit || 'cái/thiết bị'}</strong></td>
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
            )}

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
