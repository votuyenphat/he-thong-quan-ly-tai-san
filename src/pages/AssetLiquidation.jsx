// src/pages/AssetLiquidation.jsx
import React, { useState } from 'react';
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
  FileCheck
} from 'lucide-react';

export default function AssetLiquidation() {
  const { assets, liquidations, proposeLiquidation, approveLiquidation, completeLiquidation } = useAssets();
  const { permissions, currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedLq, setSelectedLq] = useState(null);
  const [selectedPrintLq, setSelectedPrintLq] = useState(null);

  // Eligible assets for liquidation proposal
  const eligibleAssets = assets.filter(a => 
    a.status !== 'Đã thanh lý' && a.status !== 'Chờ thanh lý'
  );

  const [selectedAssetId, setSelectedAssetId] = useState(eligibleAssets[0]?.id || '');
  const [reason, setReason] = useState('Hỏng mạch điện tử chính, chi phí sửa chữa vượt quá 70% giá trị máy mới');
  const [method, setMethod] = useState('Bán phế liệu thu hồi nộp ngân sách');
  const [estPrice, setEstPrice] = useState('500000');
  const [reportNumber, setReportNumber] = useState('15/TTr-HĐTL');

  // For completing liquidation
  const [finalPrice, setFinalPrice] = useState('');
  const [finalMethod, setFinalMethod] = useState('Bán đấu giá phế liệu');

  const targetAsset = assets.find(a => a.id === selectedAssetId);

  const handleOpenCreateModal = () => {
    if (eligibleAssets.length > 0) {
      setSelectedAssetId(eligibleAssets[0].id);
    }
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!targetAsset) return;

    const code = generateLiquidationCode(liquidations);
    const newLq = {
      code,
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      originalCost: targetAsset.cost,
      remainingValue: Math.max(0, Math.floor(targetAsset.cost * 0.05)),
      reason,
      method,
      liquidationPrice: Number(estPrice) || 0,
      reportNumber,
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
            <div className="form-group">
              <label className="form-label">Chọn tài sản đề nghị thanh lý (*)</label>
              <select
                className="form-select"
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
              >
                {eligibleAssets.map(a => (
                  <option key={a.id} value={a.id}>
                    [{a.code}] {a.name} - (Nguyên giá: {formatVND(a.cost)} - {a.departmentName})
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
                <div>Nguyên giá ban đầu: <strong>{formatVND(targetAsset.cost)}</strong></div>
                <div>Đơn vị quản lý: <strong>{targetAsset.departmentName}</strong></div>
                <div>Tình trạng hiện tại: <strong>{targetAsset.condition}</strong></div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Số tờ trình / Biên bản giám định kỹ thuật</label>
                <input
                  type="text"
                  className="form-input"
                  value={reportNumber}
                  onChange={(e) => setReportNumber(e.target.value)}
                  required
                />
              </div>

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
            </div>

            <div className="form-group">
              <label className="form-label">Giá thanh lý dự kiến thu hồi (VNĐ)</label>
              <input
                type="number"
                className="form-input"
                value={estPrice}
                onChange={(e) => setEstPrice(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lý do thanh lý cụ thể (*)</label>
              <textarea
                className="form-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
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
