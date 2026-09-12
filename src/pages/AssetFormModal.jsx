// src/pages/AssetFormModal.jsx
// Modal chỉnh sửa thông tin tài sản
import React, { useState } from 'react';
import Modal from '../components/common/Modal';
import ManageOptionsModal from '../components/common/ManageOptionsModal';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { Save } from 'lucide-react';
import { formatVND } from '../utils/formatters';
import { canonicalStatus, canonicalCondition, cleanText } from '../utils/normalize';

export default function AssetFormModal({ isOpen, onClose, asset, mode = 'edit' }) {
  const { updateAsset, departments, assetTypeOptions, conditionOptions, statusOptions, assets, locations } = useAssets();
  const { currentUser } = useAuth();

  const locationSuggestions = React.useMemo(() => {
    const set = new Set();
    (assets || []).forEach(a => {
      if (a.locationPath && a.locationPath.trim()) set.add(a.locationPath.trim());
    });
    const collectPaths = (nodes, parentPath = '') => {
      nodes.forEach(n => {
        const p = parentPath ? `${parentPath} > ${n.name}` : n.name;
        set.add(p);
        if (n.children && n.children.length > 0) collectPaths(n.children, p);
      });
    };
    collectPaths(locations || []);
    return Array.from(set);
  }, [assets, locations]);

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [optionsTab, setOptionsTab] = useState('types');

  const openOptions = (tab) => {
    setOptionsTab(tab);
    setOptionsOpen(true);
  };

  const [formData, setFormData] = useState({
    name: asset?.name || '',
    type: asset?.type || assetTypeOptions[0] || 'Thiết bị CNTT',
    brand: asset?.brand || '',
    quantity: asset?.quantity !== undefined ? asset.quantity : 1,
    unit: asset?.unit || 'Cái',
    importYear: asset?.importYear || asset?.purchaseYear || (asset?.purchaseDate ? String(asset.purchaseDate).slice(0, 4) : new Date().getFullYear()),
    exportYear: asset?.exportYear ?? '',
    cost: asset?.cost || '',
    lifespanYears: asset?.lifespanYears ?? '',   // null/undefined → '' = vô hạn
    departmentId: asset?.departmentId || '',
    departmentName: asset?.departmentName || '',
    locationPath: asset?.locationPath || '',
    responsiblePerson: asset?.responsiblePerson || '',
    currentUser: asset?.currentUser || '',
    condition: canonicalCondition(asset?.condition) || conditionOptions[0] || 'Tốt',
    status: canonicalStatus(asset?.status) || statusOptions[0] || 'Đang sử dụng',
    notes: asset?.notes || '',
    fundingSource: asset?.fundingSource || ''
  });

  React.useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        type: asset.type || assetTypeOptions[0] || 'Thiết bị CNTT',
        brand: asset.brand || '',
        quantity: asset.quantity !== undefined ? asset.quantity : 1,
        unit: asset.unit || 'Cái',
        importYear: asset.importYear || asset.purchaseYear || (asset.purchaseDate ? String(asset.purchaseDate).slice(0, 4) : new Date().getFullYear()),
        exportYear: asset.exportYear ?? '',
        cost: asset.cost || '',
        lifespanYears: asset.lifespanYears ?? '',
        departmentId: asset.departmentId || '',
        departmentName: asset.departmentName || '',
        locationPath: asset.locationPath || '',
        responsiblePerson: asset.responsiblePerson || '',
        currentUser: asset.currentUser || '',
        condition: canonicalCondition(asset.condition) || conditionOptions[0] || 'Tốt',
        status: canonicalStatus(asset.status) || statusOptions[0] || 'Đang sử dụng',
        notes: asset.notes || '',
        fundingSource: asset.fundingSource || ''
      });
    }
  }, [asset, assetTypeOptions, conditionOptions, statusOptions]);

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

    const lifespanVal = formData.lifespanYears === '' ? null : Number(formData.lifespanYears);
    const impYear = Number(formData.importYear) || new Date().getFullYear();
    const expYear = formData.exportYear ? Number(formData.exportYear) : null;

    updateAsset(asset.id, {
      ...formData,
      quantity: Math.max(1, Number(formData.quantity) || 1),
      unit: formData.unit?.trim() || 'Cái',
      cost: Number(formData.cost) || 0,
      lifespanYears: lifespanVal,
      importYear: impYear,
      purchaseYear: impYear,
      exportYear: expYear,
      purchaseDate: `${impYear}-01-01`,
      importDate: `${impYear}-01-01`
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Loại tài sản</label>
              <button
                type="button"
                onClick={() => openOptions('types')}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#2563eb',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                + Tùy biến
              </button>
            </div>
            <select
              className="form-select"
              value={formData.type}
              onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
            >
              {assetTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Nhãn hiệu */}
        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Nhãn hiệu</label>
          <input className="form-input" value={formData.brand} onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))} />
        </div>

        {/* Row 3: Số lượng & Đơn vị & Giá trị */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1.4fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label className="form-label">Số lượng *</label>
            <input
              className="form-input"
              type="number"
              min={1}
              value={formData.quantity}
              onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="form-label">Đơn vị tính</label>
            <input
              className="form-input"
              value={formData.unit}
              placeholder="Cái, Chiếc, Bộ..."
              onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Đơn giá (VNĐ)</label>
            <input
              className="form-input"
              type="number"
              value={formData.cost}
              onChange={e => setFormData(p => ({ ...p, cost: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Thành tiền (Tổng giá trị)</label>
            <div style={{
              height: 38,
              padding: '8px 12px',
              borderRadius: 6,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontWeight: 700,
              color: '#059669',
              display: 'flex',
              alignItems: 'center'
            }}>
              {formatVND((Number(formData.cost) || 0) * Math.max(1, Number(formData.quantity) || 1))}
            </div>
          </div>
        </div>

        {/* Row 3b: Năm nhập, Năm xuất & Thời hạn sử dụng */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label className="form-label">Năm nhập kho</label>
            <input
              className="form-input"
              type="number"
              min={1990}
              max={2100}
              placeholder="VD: 2026"
              value={formData.importYear}
              onChange={e => setFormData(p => ({ ...p, importYear: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Năm xuất kho</label>
            <input
              className="form-input"
              type="number"
              min={1990}
              max={2100}
              placeholder="Để trống nếu chưa xuất"
              value={formData.exportYear}
              onChange={e => setFormData(p => ({ ...p, exportYear: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Thời hạn SD (năm)
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>— trống = vô hạn</span>
            </label>
            <input
              className="form-input"
              type="number"
              min={1}
              placeholder="Để trống nếu không giới hạn"
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
              list="edit-location-list"
            />
            <datalist id="edit-location-list">
              {locationSuggestions.map(loc => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Tình trạng hiện tại</label>
              <button
                type="button"
                onClick={() => openOptions('conditions')}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#2563eb',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                + Tùy biến
              </button>
            </div>
            <select
              className="form-select"
              value={formData.condition}
              onChange={e => setFormData(p => ({ ...p, condition: e.target.value }))}
            >
              {conditionOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Trạng thái sử dụng</label>
              <button
                type="button"
                onClick={() => openOptions('statuses')}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#2563eb',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                + Tùy biến
              </button>
            </div>
            <select
              className="form-select"
              value={formData.status}
              onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
            >
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
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

      <ManageOptionsModal
        isOpen={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        initialTab={optionsTab}
      />
    </Modal>
  );
}
