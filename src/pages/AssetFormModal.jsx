// src/pages/AssetFormModal.jsx
// Modal chỉnh sửa thông tin tài sản
import React, { useState } from 'react';
import Modal from '../components/common/Modal';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { Save, Edit2 } from 'lucide-react';

const ASSET_TYPES = [
  'Thiết bị CNTT',
  'Thiết bị văn phòng',
  'Thiết bị y tế',
  'Máy móc thiết bị',
  'Nội thất',
  'Phương tiện vận tải',
  'Thiết bị điện',
  'Thiết bị thực hành',
  'Khác'
];

const CONDITIONS = ['Tốt', 'Khá', 'Hỏng nhẹ', 'Hỏng nặng', 'Không sử dụng được'];
const STATUSES = ['Đang sử dụng', 'Trong kho', 'Đang sửa chữa', 'Điều chuyển', 'Chờ thanh lý'];

export default function AssetFormModal({ isOpen, onClose, asset, mode = 'edit' }) {
  const { updateAsset, departments } = useAssets();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: asset?.name || '',
    type: asset?.type || 'Thiết bị CNTT',
    category: asset?.category || '',
    brand: asset?.brand || '',
    model: asset?.model || '',
    serial: asset?.serial || '',
    purchaseDate: asset?.purchaseDate || '',
    supplier: asset?.supplier || '',
    invoiceNumber: asset?.invoiceNumber || '',
    cost: asset?.cost || '',
    lifespanYears: asset?.lifespanYears || 5,
    departmentId: asset?.departmentId || '',
    departmentName: asset?.departmentName || '',
    locationPath: asset?.locationPath || '',
    responsiblePerson: asset?.responsiblePerson || '',
    currentUser: asset?.currentUser || '',
    condition: asset?.condition || 'Tốt',
    status: asset?.status || 'Đang sử dụng',
    notes: asset?.notes || '',
    fundingSource: asset?.fundingSource || ''
  });

  const [saved, setSaved] = useState(false);

  const handleDeptChange = (e) => {
    const deptId = e.target.value;
    const dept = departments.find(d => d.id === deptId);
    setFormData(prev => ({
      ...prev,
      departmentId: deptId,
      departmentName: dept ? dept.name : ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    updateAsset(asset.id, {
      ...formData,
      cost: Number(formData.cost) || 0,
      lifespanYears: Number(formData.lifespanYears) || 5
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chỉnh Sửa Tài Sản: ${asset?.code}`}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saved}
            style={saved ? { background: '#059669' } : {}}
          >
            <Save size={16} />
            {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {/* Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label className="form-label">Tên tài sản *</label>
            <input
              className="form-input"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="form-label">Loại tài sản</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
            >
              {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label className="form-label">Nhãn hiệu</label>
            <input className="form-input" value={formData.brand} onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Model</label>
            <input className="form-input" value={formData.model} onChange={e => setFormData(p => ({ ...p, model: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Serial Number</label>
            <input className="form-input" value={formData.serial} onChange={e => setFormData(p => ({ ...p, serial: e.target.value }))} />
          </div>
        </div>

        {/* Row 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label className="form-label">Nguyên giá (VNĐ)</label>
            <input
              className="form-input"
              type="number"
              value={formData.cost}
              onChange={e => setFormData(p => ({ ...p, cost: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Ngày mua</label>
            <input
              className="form-input"
              type="date"
              value={formData.purchaseDate}
              onChange={e => setFormData(p => ({ ...p, purchaseDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Hạn sử dụng (năm)</label>
            <input
              className="form-input"
              type="number"
              min={1}
              value={formData.lifespanYears}
              onChange={e => setFormData(p => ({ ...p, lifespanYears: e.target.value }))}
            />
          </div>
        </div>

        {/* Row 4 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label className="form-label">Phòng/Ban quản lý</label>
            <select
              className="form-select"
              value={formData.departmentId}
              onChange={handleDeptChange}
            >
              <option value="">-- Chọn phòng ban --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Vị trí cụ thể</label>
            <input
              className="form-input"
              value={formData.locationPath}
              onChange={e => setFormData(p => ({ ...p, locationPath: e.target.value }))}
              placeholder="VD: Cơ sở 1 > Khu A > Tầng 1 > Phòng 101"
            />
          </div>
        </div>

        {/* Row 5 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label className="form-label">Người chịu trách nhiệm</label>
            <input
              className="form-input"
              value={formData.responsiblePerson}
              onChange={e => setFormData(p => ({ ...p, responsiblePerson: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Người sử dụng</label>
            <input
              className="form-input"
              value={formData.currentUser}
              onChange={e => setFormData(p => ({ ...p, currentUser: e.target.value }))}
            />
          </div>
        </div>

        {/* Row 6 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label className="form-label">Tình trạng hiện tại</label>
            <select
              className="form-select"
              value={formData.condition}
              onChange={e => setFormData(p => ({ ...p, condition: e.target.value }))}
            >
              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Trạng thái sử dụng</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
            >
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 4 }}>
          <label className="form-label">Ghi chú</label>
          <textarea
            className="form-input"
            rows={2}
            value={formData.notes}
            onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
            style={{ resize: 'vertical' }}
          />
        </div>
      </form>
    </Modal>
  );
}
