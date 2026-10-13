// src/pages/LiquidationQuickModal.jsx
// Modal lập đề nghị thanh lý nhanh từ danh mục tài sản
import React, { useState } from 'react';
import Modal from '../components/common/Modal';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/formatters';
import { FileX, CheckCircle } from 'lucide-react';

const LIQUIDATION_REASONS = [
  'Hết thời hạn sử dụng',
  'Hỏng nặng không sửa được',
  'Lạc hậu công nghệ, không đáp ứng yêu cầu',
  'Mất mát, không tìm lại được',
  'Nguyên nhân khác'
];

const LIQUIDATION_METHODS = [
  'Bán đấu giá',
  'Bán thanh lý trực tiếp',
  'Tiêu hủy',
  'Chuyển giao đơn vị khác',
  'Chuyển mục đích sử dụng'
];

let lqCounter = 1;

function generateLQCode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `LQ-${y}${m}-${String(lqCounter++).padStart(3, '0')}`;
}

export default function LiquidationQuickModal({ isOpen, onClose, asset }) {
  const { proposeLiquidation } = useAssets();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    quantity: 1,
    reason: LIQUIDATION_REASONS[0],
    method: LIQUIDATION_METHODS[0],
    proposedPrice: '',
    notes: ''
  });

  const [done, setDone] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!asset) return;

    const code = generateLQCode();
    const maxQty = Number(asset.quantity) || 1;
    const finalQty = Math.max(1, Math.min(Number(formData.quantity) || 1, maxQty));

    proposeLiquidation({
      code,
      assetId: asset.id,
      assetCode: asset.code,
      assetName: asset.name,
      quantity: finalQty,
      unit: asset.unit || 'cái',
      assetType: asset.type,
      departmentId: asset.departmentId,
      departmentName: asset.departmentName,
      purchaseDate: asset.purchaseDate,
      cost: asset.cost,
      condition: asset.condition,
      reason: formData.reason,
      method: formData.method,
      proposedPrice: Number(formData.proposedPrice) || 0,
      notes: formData.notes,
      requester: currentUser?.name || 'Người dùng'
    });

    setDone(true);
    setTimeout(() => {
      setDone(false);
      onClose();
    }, 1500);
  };

  if (!asset) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lập Đề Nghị Thanh Lý Tài Sản"
      size="default"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button
            className="btn"
            style={done ? { background: '#059669', color: '#fff' } : { background: '#dc2626', color: '#fff' }}
            onClick={handleSubmit}
            disabled={done}
          >
            <FileX size={16} />
            {done ? '✓ Đã gửi đề nghị!' : 'Gửi đề nghị thanh lý'}
          </button>
        </>
      }
    >
      {/* Asset Info */}
      <div style={{
        background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '10px',
        padding: '14px 16px', marginBottom: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700 }}>
            TÀI SẢN ĐỀ NGHỊ THANH LÝ
          </div>
          <span className="badge badge-warning" style={{ fontSize: '0.725rem' }}>
            Đang chọn: {formData.quantity || 1} / {asset.quantity || 1} {asset.unit || 'cái'}
          </span>
        </div>
        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{asset.name}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
          Mã: <strong style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>{asset.code}</strong> &nbsp;|&nbsp;
          Số lượng hiện có: <strong style={{ color: '#b45309' }}>{asset.quantity || 1} {asset.unit || 'cái'}</strong> &nbsp;|&nbsp;
          Nguyên giá: <strong style={{ color: '#059669' }}>{formatVND(asset.cost)}</strong>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
          Phòng ban: {asset.departmentName} &nbsp;|&nbsp; Tình trạng: <strong>{asset.condition}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Số lượng đề nghị thanh lý *</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Tối đa: <strong>{asset.quantity || 1}</strong> {asset.unit || 'cái'}
            </span>
          </label>
          <input
            className="form-input"
            type="number"
            min={1}
            max={Number(asset.quantity) || 1}
            value={formData.quantity}
            onChange={e => {
              const max = Number(asset.quantity) || 1;
              const val = Number(e.target.value);
              setFormData(p => ({ ...p, quantity: val > max ? max : val < 1 ? 1 : val }));
            }}
            required
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Lý do đề nghị thanh lý *</label>
          <select
            className="form-select"
            value={formData.reason}
            onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
            required
          >
            {LIQUIDATION_REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Hình thức thanh lý đề xuất</label>
          <select
            className="form-select"
            value={formData.method}
            onChange={e => setFormData(p => ({ ...p, method: e.target.value }))}
          >
            {LIQUIDATION_METHODS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Giá đề xuất thanh lý (VNĐ)</label>
          <input
            className="form-input"
            type="number"
            min={0}
            value={formData.proposedPrice}
            onChange={e => setFormData(p => ({ ...p, proposedPrice: e.target.value }))}
            placeholder="0 = Tiêu hủy / Không thu hồi"
          />
        </div>

        <div style={{ marginBottom: 4 }}>
          <label className="form-label">Ghi chú thêm</label>
          <textarea
            className="form-input"
            rows={2}
            value={formData.notes}
            onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
            placeholder="Mô tả thêm về tình trạng, lý do cụ thể..."
            style={{ resize: 'vertical' }}
          />
        </div>
      </form>

      <div style={{
        marginTop: 16, padding: '10px 14px', background: '#f0fdf4',
        border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.8rem', color: '#166534'
      }}>
        Sau khi gửi, phiếu đề nghị sẽ được chuyển đến mục <strong>Thanh Lý</strong> để Ban lãnh đạo xem xét và phê duyệt.
      </div>
    </Modal>
  );
}
