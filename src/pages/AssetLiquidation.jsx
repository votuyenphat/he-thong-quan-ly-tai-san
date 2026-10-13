// src/pages/AssetLiquidation.jsx
import React, { useState, useMemo } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { generateLiquidationCode, formatVND, formatDate } from '../utils/formatters';
import { printElement } from '../utils/printHelpers';
import Modal from '../components/common/Modal';
import {
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  Printer,
  AlertTriangle,
  DollarSign,
  ShieldCheck,
  FileCheck,
  Search,
  X
} from 'lucide-react';
import { canonicalStatus, cleanText } from '../utils/normalize';

export default function AssetLiquidation() {
  const { assets, liquidations, proposeLiquidation, approveLiquidation, completeLiquidation } = useAssets();
  const { permissions, currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedLq, setSelectedLq] = useState(null);
  const [selectedPrintLq, setSelectedPrintLq] = useState(null);

  // Eligible assets for liquidation proposal (scoped by department for QL phòng)
  const eligibleAssets = useMemo(() => {
    let list = assets.filter(a => 
      canonicalStatus(a.status) !== 'Đã thanh lý' && canonicalStatus(a.status) !== 'Chờ thanh lý'
    );
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

  // Lọc danh sách hồ sơ thanh lý: Super Admin thấy toàn bộ, QL phòng chỉ thấy hồ sơ thuộc phòng mình
  const visibleLiquidations = useMemo(() => {
    if (permissions?.isSuperAdmin) return liquidations;
    const userDeptId = currentUser?.departmentId;
    const userDeptName = currentUser?.departmentName || currentUser?.department;
    return liquidations.filter(lq => {
      const asset = assets.find(a => a.id === lq.assetId || a.code === lq.assetCode);
      if (!asset) return true;
      const matchDeptId = userDeptId && asset.departmentId && cleanText(asset.departmentId).toLowerCase() === cleanText(userDeptId).toLowerCase();
      const matchDeptName = userDeptName && asset.departmentName && cleanText(asset.departmentName).toLowerCase() === cleanText(userDeptName).toLowerCase();
      return matchDeptId || matchDeptName;
    });
  }, [liquidations, assets, permissions?.isSuperAdmin, currentUser]);

  // Selected assets state for batch liquidation
  const [selectedItems, setSelectedItems] = useState([]);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Form inputs (không để chữ gợi ý sẵn)
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState('Bán phế liệu thu hồi nộp ngân sách');
  const [estPrice, setEstPrice] = useState('');

  // For completing liquidation
  const [finalPrice, setFinalPrice] = useState('');
  const [finalMethod, setFinalMethod] = useState('Bán đấu giá phế liệu');

  // Gợi ý thông minh tìm kiếm tài sản thanh lý
  const filteredAssetSuggestions = useMemo(() => {
    if (!assetSearchTerm.trim()) {
      return eligibleAssets.slice(0, 8);
    }
    const q = cleanText(assetSearchTerm).toLowerCase();
    return eligibleAssets.filter(a =>
      cleanText(a.code).toLowerCase().includes(q) ||
      cleanText(a.name).toLowerCase().includes(q) ||
      cleanText(a.departmentName).toLowerCase().includes(q) ||
      cleanText(a.currentUser).toLowerCase().includes(q) ||
      cleanText(a.locationPath).toLowerCase().includes(q) ||
      cleanText(a.brand).toLowerCase().includes(q) ||
      cleanText(a.condition).toLowerCase().includes(q)
    ).slice(0, 10);
  }, [eligibleAssets, assetSearchTerm]);

  // Thêm tài sản vào danh sách đề nghị thanh lý
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
          cost: Number(asset.cost) || 0,
          departmentId: asset.departmentId,
          departmentName: asset.departmentName,
          fromLocation: asset.locationPath || 'Chưa phân vị trí',
          fromUser: asset.currentUser || asset.responsiblePerson || '',
          condition: asset.condition || 'Hỏng / Hết nhu cầu',
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
    setMethod('Bán phế liệu thu hồi nộp ngân sách');
    setEstPrice('');
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Vui lòng tìm kiếm và chọn ít nhất 1 tài sản cần đề nghị thanh lý!');
      return;
    }

    const code = generateLiquidationCode(liquidations);
    const primary = selectedItems[0];
    const totalQty = selectedItems.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
    const totalOriginalCost = selectedItems.reduce((sum, i) => sum + (Number(i.cost) || 0), 0);
    const assetNameDisplay = selectedItems.length === 1 
      ? primary.assetName 
      : `${primary.assetName} (+${selectedItems.length - 1} tài sản khác)`;
    const assetCodeDisplay = selectedItems.length === 1 
      ? primary.assetCode 
      : `${primary.assetCode} (+${selectedItems.length - 1})`;

    const newLq = {
      code,
      assetId: primary.assetId,
      assetCode: assetCodeDisplay,
      assetName: assetNameDisplay,
      quantity: totalQty,
      unit: primary.unit || 'cái',
      items: selectedItems.map(i => ({ ...i })),
      originalCost: totalOriginalCost,
      remainingValue: Math.max(0, Math.floor(totalOriginalCost * 0.05)),
      reason: reason.trim() || 'Đề nghị thanh lý theo quy định',
      method,
      liquidationPrice: Number(estPrice) || 0,
      reportNumber: code,
      requester: currentUser?.name || 'Cán bộ quản trị tài sản'
    };

    proposeLiquidation(newLq);
    setIsModalOpen(false);
    setSelectedItems([]);
    setAssetSearchTerm('');
  };

  const handleApprove = (lqId) => {
    if (window.confirm('Phê duyệt cho phép tiến hành quy trình thanh lý đối với tài sản này?')) {
      approveLiquidation(lqId);
    }
  };

  const handleOpenComplete = (lq) => {
    setSelectedLq(lq);
    setFinalPrice(lq.liquidationPrice || '500000');
    setFinalMethod(lq.method || 'Bán phế liệu');
    setIsCompleteModalOpen(true);
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    if (!selectedLq) return;

    completeLiquidation(selectedLq.id, {
      liquidationPrice: Number(finalPrice) || 0,
      method: finalMethod
    });

    setIsCompleteModalOpen(false);
  };

  const handlePrintSlip = (lq) => {
    setSelectedPrintLq(lq);
    setTimeout(() => {
      printElement('printable-liquidation-slip');
    }, 150);
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Trash2 size={26} color="#1e3a8a" />
            Hội Đồng Thanh Lý Tài Sản
          </h2>
          <p className="page-subtitle">
            Quy trình thanh lý khép kín: Đang SD ➔ Hỏng / hết nhu cầu ➔ Đề nghị ➔ Phê duyệt ➔ Thanh lý ➔ Đã thanh lý
          </p>
        </div>

        {permissions?.canProposeLiquidation && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} />
            Lập Tờ Trình Đề Nghị Thanh Lý
          </button>
        )}
      </div>

      {/* Visual Workflow Stepper */}
      <div className="card" style={{ marginBottom: 24, padding: '20px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: 14 }}>
          QUY TRÌNH THANH LÝ CHUẨN DOANH NGHIỆP / TRƯỜNG HỌC:
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
          textAlign: 'center'
        }}>
          {[
            { step: '1', name: 'Đang sử dụng', desc: 'Thiết bị tại đơn vị' },
            { step: '2', name: 'Hỏng / Hết nhu cầu', desc: 'Giám định kỹ thuật' },
            { step: '3', name: 'Đề nghị thanh lý', desc: 'Lập tờ trình hội đồng' },
            { step: '4', name: 'Phê duyệt BGH', desc: 'Ra quyết định thanh lý' },
            { step: '5', name: 'Đã thanh lý', desc: 'Nộp quỹ & lưu hồ sơ' }
          ].map((s, idx) => (
            <div key={idx} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 8px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#1e3a8a',
                color: '#fff',
                margin: '0 auto 6px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {s.step}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Liquidation Table */}
      <div className="card">
        <h3 className="card-title">
          <span>Danh Sách Hồ Sơ & Phiếu Thanh Lý</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Tổng số: {visibleLiquidations.length} hồ sơ</span>
        </h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Số hồ sơ</th>
                <th>Tài sản đề nghị</th>
                <th style={{ textAlign: 'right' }}>Nguyên giá</th>
                <th style={{ textAlign: 'right' }}>Giá trị thu hồi</th>
                <th>Phương thức</th>
                <th>Người đề nghị / Duyệt</th>
                <th style={{ textAlign: 'center' }}>Trạng thái quy trình</th>
                <th style={{ textAlign: 'center', width: '170px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {visibleLiquidations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Chưa có hồ sơ thanh lý nào.
                  </td>
                </tr>
              ) : (
                visibleLiquidations.map((lq) => (
                <tr key={lq.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                      {lq.code}
                    </span>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                      Số BB: {lq.reportNumber}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{lq.assetName}</span>
                      {lq.items && lq.items.length > 1 && (
                        <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                          {lq.items.length} tài sản
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                        Mã: {lq.assetCode}
                      </span>
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                        Tổng SL: {lq.quantity || 1} {lq.unit || 'cái'}
                      </span>
                    </div>
                    {lq.items && lq.items.length > 1 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {lq.items.map((it, idx) => (
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
                    <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 2 }}>
                      Lý do: {lq.reason}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {formatVND(lq.originalCost)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                    {formatVND(lq.liquidationPrice)}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem' }}>{lq.method}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>Đề nghị: <strong>{lq.requester}</strong></div>
                    <div style={{ fontSize: '0.75rem', color: '#1e3a8a' }}>Duyệt: {lq.approver}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {lq.status === 'Đã hoàn tất' ? (
                      <span className="badge badge-secondary">
                        <CheckCircle size={13} /> Đã thanh lý
                      </span>
                    ) : lq.status === 'Đã duyệt' ? (
                      <span className="badge badge-success">
                        <ShieldCheck size={13} /> Đã duyệt
                      </span>
                    ) : (
                      <span className="badge badge-warning">
                        <Clock size={13} /> Chờ duyệt
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {lq.status === 'Đề nghị' && permissions.canApproveLiquidation && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApprove(lq.id)}
                          title="BGH phê duyệt thanh lý"
                        >
                          Duyệt
                        </button>
                      )}

                      {lq.status === 'Đã duyệt' && permissions.canApproveLiquidation && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleOpenComplete(lq)}
                          title="Thực hiện bán/thanh lý và hoàn tất"
                        >
                          Hoàn tất
                        </button>
                      )}

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handlePrintSlip(lq)}
                        title="In biên bản thanh lý A4"
                      >
                        <Printer size={14} /> In BB
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

      {/* Modal: Lập Tờ Trình Thanh Lý */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lập Tờ Trình Đề Nghị Thanh Lý Tài Sản"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleCreateSubmit}>
              <Trash2 size={16} />
              Gửi Đề Nghị Lên Hội Đồng
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {/* Bộ tìm kiếm & thêm tài sản vào danh sách thanh lý */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">
                Tìm kiếm & Chọn tài sản đề nghị thanh lý (*)
              </label>

              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search
                    size={17}
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
                    placeholder="Gõ mã tài sản, tên, đơn vị quản lý, tình trạng để thêm vào danh sách..."
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
                      <span>GỢI Ý TÀI SẢN CÓ THỂ THANH LÝ ({filteredAssetSuggestions.length})</span>
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
                                <span>🏢 {a.departmentName || 'Chưa gán'}</span>
                                <span>💰 {formatVND(a.cost)}</span>
                                <span>📍 {a.locationPath || 'Chưa xếp'}</span>
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

            {/* Bảng danh sách các tài sản đã chọn */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                  Danh sách tài sản đề nghị thanh lý ({selectedItems.length})
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
                    Đã chọn: {selectedItems.length} tài sản • Tổng SL: {selectedItems.reduce((s, i) => s + i.quantity, 0)} cái • Tổng nguyên giá: {formatVND(selectedItems.reduce((s, i) => s + i.cost, 0))}
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
                    Chưa có tài sản nào trong danh sách đề nghị. Vui lòng tìm kiếm và bấm <strong>+ Chọn</strong> ở trên.
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.775rem', color: '#94a3b8' }}>
                    (Có thể chọn cùng lúc nhiều tài sản và điều chỉnh số lượng thanh lý riêng cho từng tài sản)
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
                        <th>Đơn vị quản lý</th>
                        <th style={{ textAlign: 'right' }}>Nguyên giá</th>
                        <th style={{ textAlign: 'center', width: '190px' }}>Số lượng thanh lý</th>
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
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatVND(item.cost)}
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
                              title="Xóa khỏi danh sách thanh lý"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Phương thức thanh lý dự kiến (*)</label>
                <select
                  className="form-select"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="Bán phế liệu thu hồi nộp ngân sách">Bán phế liệu thu hồi nộp ngân sách</option>
                  <option value="Bán đấu giá công khai">Bán đấu giá công khai</option>
                  <option value="Hủy bỏ / Tiêu hủy">Hủy bỏ / Tiêu hủy</option>
                  <option value="Chuyển nhượng điều chuyển đơn vị ngoài">Chuyển nhượng điều chuyển đơn vị ngoài</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Giá thanh lý dự kiến thu hồi (VNĐ)</label>
                <input
                  type="number"
                  className="form-input"
                  value={estPrice}
                  onChange={(e) => setEstPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lý do thanh lý cụ thể (*)</label>
              <textarea
                className="form-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nêu rõ tình trạng hỏng hóc, giám định kỹ thuật hoặc hết niên hạn sử dụng..."
                rows={3}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Hoàn Tất Thanh Lý */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title={`Hoàn Tất Thanh Lý: ${selectedLq?.assetName}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCompleteModalOpen(false)}>Hủy</button>
            <button className="btn btn-success" onClick={handleCompleteSubmit}>
              <CheckCircle size={16} />
              Xác Nhận Đã Bán / Tiêu Hủy
            </button>
          </>
        }
      >
        <form onSubmit={handleCompleteSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: '0.875rem', color: '#475569' }}>
              Xác nhận tài sản đã được xử lý thực tế và số tiền thanh lý đã nộp vào tài khoản đơn vị:
            </p>

            <div className="form-group">
              <label className="form-label">Số tiền thực tế thu hồi (VNĐ) (*)</label>
              <input
                type="number"
                className="form-input"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phương thức thực tế đã xử lý</label>
              <input
                type="text"
                className="form-input"
                value={finalMethod}
                onChange={(e) => setFinalMethod(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Printable Liquidation Slip */}
      {selectedPrintLq && (
        <div style={{ display: 'none' }}>
          <div id="printable-liquidation-slip">
            <div className="header">
              <div className="header-left">
                <strong>BỘ GIÁO DỤC VÀ ĐÀO TẠO</strong><br />
                <strong>TRƯỜNG ĐẠI HỌC</strong><br />
                Số: {selectedPrintLq.reportNumber}
              </div>
              <div className="header-right">
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
                Độc lập - Tự do - Hạnh phúc<br />
                <em>Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</em>
              </div>
            </div>

            <div className="title">BIÊN BẢN HỘI ĐỒNG THANH LÝ TÀI SẢN</div>

            <p>Căn cứ Quyết định thành lập Hội đồng thanh lý tài sản của Hiệu trưởng Nhà trường.</p>
            <p>Hội đồng thanh lý tiến hành họp và thống nhất kết luận xử lý tài sản cố định như sau:</p>

            {selectedPrintLq.items && selectedPrintLq.items.length > 1 ? (
              <>
                <table style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '25%', fontWeight: 'bold' }}>Lý do thanh lý:</td>
                      <td colSpan="3">{selectedPrintLq.reason}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Hình thức thanh lý:</td>
                      <td>{selectedPrintLq.method}</td>
                      <td style={{ width: '20%', fontWeight: 'bold' }}>Giá thu hồi dự kiến:</td>
                      <td><strong>{formatVND(selectedPrintLq.liquidationPrice)}</strong></td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Người đề nghị:</td>
                      <td>{selectedPrintLq.requester}</td>
                      <td style={{ fontWeight: 'bold' }}>Cấp phê duyệt:</td>
                      <td>{selectedPrintLq.approver}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ fontWeight: 'bold', margin: '14px 0 8px', fontSize: '13px', textTransform: 'uppercase' }}>
                  DANH MỤC CHI TIẾT TÀI SẢN ĐỀ NGHỊ THANH LÝ ({selectedPrintLq.items.length} TÀI SẢN):
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '35px' }}>STT</th>
                      <th style={{ border: '1px solid #333', padding: '6px', width: '90px' }}>Mã TS</th>
                      <th style={{ border: '1px solid #333', padding: '6px' }}>Tên tài sản</th>
                      <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '50px' }}>ĐVT</th>
                      <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', width: '60px' }}>Số lượng</th>
                      <th style={{ border: '1px solid #333', padding: '6px', textAlign: 'right', width: '100px' }}>Nguyên giá</th>
                      <th style={{ border: '1px solid #333', padding: '6px' }}>Đơn vị / Vị trí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrintLq.items.map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #333', padding: '6px', fontFamily: 'monospace' }}>{it.assetCode}</td>
                        <td style={{ border: '1px solid #333', padding: '6px', fontWeight: 'bold' }}>{it.assetName}</td>
                        <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>{it.unit || 'cái'}</td>
                        <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{it.quantity}</td>
                        <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'right' }}>{formatVND(it.cost)}</td>
                        <td style={{ border: '1px solid #333', padding: '6px', fontSize: '11px' }}>
                          {it.departmentName} {it.fromLocation ? `(${it.fromLocation})` : ''}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                      <td colSpan="4" style={{ border: '1px solid #333', padding: '6px', textAlign: 'right' }}>TỔNG CỘNG:</td>
                      <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>
                        {selectedPrintLq.items.reduce((s, i) => s + (Number(i.quantity) || 1), 0)}
                      </td>
                      <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'right' }}>
                        {formatVND(selectedPrintLq.originalCost)}
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
                    <td style={{ width: '30%', fontWeight: 'bold' }}>Tên tài sản thanh lý:</td>
                    <td><strong>{selectedPrintLq.assetName}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Mã định danh tài sản:</td>
                    <td>{selectedPrintLq.assetCode}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Số lượng đề nghị thanh lý:</td>
                    <td><strong>{selectedPrintLq.quantity || 1} {selectedPrintLq.unit || 'cái/thiết bị'}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Nguyên giá:</td>
                    <td>{formatVND(selectedPrintLq.originalCost)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Giá trị còn lại theo sổ sách:</td>
                    <td>{formatVND(selectedPrintLq.remainingValue)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Lý do thanh lý:</td>
                    <td>{selectedPrintLq.reason}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Hình thức thanh lý:</td>
                    <td>{selectedPrintLq.method}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Giá thanh lý thu hồi:</td>
                    <td><strong>{formatVND(selectedPrintLq.liquidationPrice)}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Người đề nghị:</td>
                    <td>{selectedPrintLq.requester}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Cấp phê duyệt:</td>
                    <td>{selectedPrintLq.approver}</td>
                  </tr>
                </tbody>
              </table>
            )}

            <div className="signatures">
              <div className="sig-block">
                <strong>THƯ KÝ HỘI ĐỒNG</strong><br />
                <em>(Ký, ghi rõ họ tên)</em>
                <div className="sig-space"></div>
                <strong>{selectedPrintLq.requester}</strong>
              </div>
              <div className="sig-block">
                <strong>KẾ TOÁN TRƯỞNG</strong><br />
                <em>(Ký, ghi rõ họ tên)</em>
                <div className="sig-space"></div>
                <strong>ThS. Võ Thị Thanh</strong>
              </div>
              <div className="sig-block">
                <strong>CHỦ TỊCH HỘI ĐỒNG (HIỆU TRƯỞNG)</strong><br />
                <em>(Ký, đóng dấu)</em>
                <div className="sig-space"></div>
                <strong>GS.TS Nguyễn Văn An</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
