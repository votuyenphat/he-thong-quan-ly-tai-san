// src/pages/AssetRecall.jsx
import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { generateRecallCode, formatDate } from '../utils/formatters';
import { printElement } from '../utils/printHelpers';
import Modal from '../components/common/Modal';
import {
  RotateCcw,
  Plus,
  Package,
  CheckCircle,
  Printer,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { canonicalStatus } from '../utils/normalize';

export default function AssetRecall() {
  const { assets, recalls, createRecall } = useAssets();
  const { currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrintRecall, setSelectedPrintRecall] = useState(null);

  // Available assets currently in use
  const inUseAssets = assets.filter(a => canonicalStatus(a.status) === 'Đang sử dụng');

  const [selectedAssetId, setSelectedAssetId] = useState(inUseAssets[0]?.id || '');
  const [reason, setReason] = useState('Thu hồi nhập kho sau khi kết thúc dự án / luân chuyển');
  const [condition, setCondition] = useState('Tốt');
  const [accessories, setAccessories] = useState(['Cáp nguồn / Dây sạc', 'Chuột máy tính', 'Túi đựng bảo vệ']);
  const [newAccessory, setNewAccessory] = useState('');

  const targetAsset = assets.find(a => a.id === selectedAssetId);

  const handleOpenCreateModal = () => {
    if (inUseAssets.length > 0) {
      setSelectedAssetId(inUseAssets[0].id);
    }
    setIsModalOpen(true);
  };

  const handleToggleAccessory = (item) => {
    if (accessories.includes(item)) {
      setAccessories(accessories.filter(x => x !== item));
    } else {
      setAccessories([...accessories, item]);
    }
  };

  const handleAddCustomAccessory = (e) => {
    e.preventDefault();
    if (!newAccessory.trim()) return;
    if (!accessories.includes(newAccessory.trim())) {
      setAccessories([...accessories, newAccessory.trim()]);
    }
    setNewAccessory('');
  };

  const handleCreateRecallSubmit = (e) => {
    e.preventDefault();
    if (!targetAsset) return;

    const code = generateRecallCode(recalls);
    const newRecall = {
      code,
      assetId: targetAsset.id,
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      departmentId: targetAsset.departmentId,
      departmentName: targetAsset.departmentName,
      sender: targetAsset.currentUser || targetAsset.responsiblePerson,
      receiver: currentUser?.name || 'Vũ Tuyên Phát (Thủ kho)',
      reason,
      condition,
      accessories,
      date: new Date().toISOString().slice(0, 10)
    };

    createRecall(newRecall);
    setIsModalOpen(false);
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
            Lập biên bản bàn giao thu hồi tài sản, kiểm đếm phụ kiện kèm theo và tự động chuyển trạng thái vào kho
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={16} />
          Lập Phiếu Thu Hồi
        </button>
      </div>

      {/* Recalls List Table */}
      <div className="card">
        <h3 className="card-title">
          <span>Danh Sách Các Biên Bản Thu Hồi Tài Sản</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            Tổng số: {recalls.length} phiếu
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
                <th>Phụ kiện kèm theo</th>
                <th>Tình trạng thu hồi</th>
                <th>Ngày thu hồi</th>
                <th style={{ textAlign: 'center', width: '130px' }}>In ấn</th>
              </tr>
            </thead>
            <tbody>
              {recalls.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Chưa có phiếu thu hồi nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                recalls.map((r) => (
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
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.sender}</span>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Thu bởi: {r.receiver}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(r.accessories || []).map((acc, idx) => (
                          <span key={idx} className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                            ✓ {acc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success">
                        {r.condition}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.825rem' }}>
                      {formatDate(r.date)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handlePrintSlip(r)}
                        title="In biên bản thu hồi A4"
                      >
                        <Printer size={14} /> In biên bản
                      </button>
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
            <div className="form-group">
              <label className="form-label">Chọn tài sản thu hồi (*)</label>
              <select
                className="form-select"
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
              >
                {inUseAssets.map(a => (
                  <option key={a.id} value={a.id}>
                    [{a.code}] {a.name} - ({a.departmentName} - Đang dùng: {a.currentUser})
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
                <div>Đơn vị hiện tại: <strong>{targetAsset.departmentName}</strong></div>
                <div>Người bàn giao: <strong>{targetAsset.currentUser || targetAsset.responsiblePerson}</strong></div>
                <div>Vị trí cũ: <strong>{targetAsset.locationPath}</strong></div>
                <div style={{ color: '#059669', marginTop: 4, fontWeight: 600 }}>
                  ➔ Sau khi xác nhận, tài sản sẽ tự động chuyển vị trí về: Kho Tổng CS1 (Tầng trệt) & Trạng thái: Trong kho
                </div>
              </div>
            )}

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
                <label className="form-label">Mục đích thu hồi (*)</label>
                <input
                  type="text"
                  className="form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phụ kiện bàn giao */}
            <div className="form-group">
              <label className="form-label">Kiểm tra phụ kiện đi kèm theo máy (*)</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10,
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                {['Cáp nguồn / Dây sạc', 'Chuột máy tính', 'Túi đựng bảo vệ', 'Pin dự phòng', 'Sách hướng dẫn / Đĩa driver', 'Dây HDMI / DisplayPort'].map(item => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={accessories.includes(item)}
                      onChange={() => handleToggleAccessory(item)}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Thêm phụ kiện khác (nếu có)..."
                  value={newAccessory}
                  onChange={(e) => setNewAccessory(e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddCustomAccessory}
                >
                  + Thêm
                </button>
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
                  <td style={{ fontWeight: 'bold' }}>Phụ kiện kèm theo:</td>
                  <td>{(selectedPrintRecall.accessories || []).join(', ')}</td>
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
