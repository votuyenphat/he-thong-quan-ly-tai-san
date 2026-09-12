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

  // Eligible assets for liquidation proposal
  const eligibleAssets = useMemo(() => {
    return assets.filter(a => 
      canonicalStatus(a.status) !== 'Đã thanh lý' && canonicalStatus(a.status) !== 'Chờ thanh lý'
    );
  }, [assets]);

  // Search & smart suggestions state for selecting asset
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Form inputs (không để chữ gợi ý sẵn)
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState('Bán phế liệu thu hồi nộp ngân sách');
  const [estPrice, setEstPrice] = useState('');

  // For completing liquidation
  const [finalPrice, setFinalPrice] = useState('');
  const [finalMethod, setFinalMethod] = useState('Bán đấu giá phế liệu');

  const targetAsset = assets.find(a => a.id === selectedAssetId);

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

  const handleOpenCreateModal = () => {
    setSelectedAssetId('');
    setAssetSearchTerm('');
    setIsSearchFocused(false);
    setReason('');
    setMethod('Bán phế liệu thu hồi nộp ngân sách');
    setEstPrice('');
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!targetAsset) {
      alert('Vui lòng tìm kiếm và chọn tài sản cần đề nghị thanh lý!');
      return;
    }

    const code = generateLiquidationCode(liquidations);
    const newLq = {
      code,
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      originalCost: targetAsset.cost,
      remainingValue: Math.max(0, Math.floor((targetAsset.cost || 0) * 0.05)),
      reason: reason.trim() || 'Đề nghị thanh lý theo quy định',
      method,
      liquidationPrice: Number(estPrice) || 0,
      reportNumber: code,
      requester: currentUser?.name || 'Cán bộ quản trị tài sản'
    };

    proposeLiquidation(newLq);
    setIsModalOpen(false);
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

        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={16} />
          Lập Tờ Trình Đề Nghị Thanh Lý
        </button>
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
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Tổng số: {liquidations.length} hồ sơ</span>
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
              {liquidations.map((lq) => (
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
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{lq.assetName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                      Mã: {lq.assetCode}
                    </div>
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

                      {lq.status === 'Đã duyệt' && permissions.canManageAssets && (
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
              ))}
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
            {/* Bộ tìm kiếm tài sản thông minh */}
            <div className="form-group" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Tìm kiếm & Chọn tài sản đề nghị thanh lý (*)
                </label>
                {selectedAssetId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAssetId('');
                      setAssetSearchTerm('');
                      setIsSearchFocused(true);
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#2563eb',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    🔄 Đổi tài sản khác
                  </button>
                )}
              </div>

              {!selectedAssetId ? (
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
                      placeholder="Nhập mã tài sản, tên, đơn vị quản lý, tình trạng để tìm nhanh..."
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
                            <div style={{ display: 'flex', gap: 14, fontSize: '0.775rem', color: '#64748b', flexWrap: 'wrap' }}>
                              <span>💰 Nguyên giá: <strong>{formatVND(a.cost)}</strong></span>
                              <span>⚙️ Tình trạng: <strong>{a.condition || 'N/A'}</strong></span>
                              <span>📍 Vị trí: <strong>{a.locationPath || 'Chưa xếp'}</strong></span>
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
                    <div><strong>🏢 Đơn vị quản lý:</strong> {targetAsset.departmentName}</div>
                    <div><strong>💰 Nguyên giá ban đầu:</strong> {formatVND(targetAsset.cost)}</div>
                    <div><strong>⚙️ Tình trạng hiện tại:</strong> {targetAsset.condition || 'N/A'}</div>
                    <div><strong>📍 Vị trí:</strong> {targetAsset.locationPath || 'Chưa cập nhật'}</div>
                    <div><strong>👤 Người sử dụng:</strong> {targetAsset.currentUser || targetAsset.responsiblePerson || 'N/A'}</div>
                    <div><strong>🏷️ Nhãn hiệu / Loại:</strong> {targetAsset.brand || targetAsset.type || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Phương thức thanh lý dự kiến</label>
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
                  placeholder=""
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lý do thanh lý cụ thể (*)</label>
              <textarea
                className="form-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder=""
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
