// src/pages/CategoryConfig.jsx
import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCcw,
  CheckCircle,
  Tag,
  Activity,
  HeartPulse
} from 'lucide-react';
import { cleanText, canonicalStatus, canonicalCondition } from '../utils/normalize';


export default function CategoryConfig() {
  const {
    assets,
    assetTypeOptions, addAssetType, deleteAssetType, updateAssetType,
    conditionOptions, addCondition, deleteCondition, updateCondition,
    statusOptions, addStatus, deleteStatus, updateStatus,
    resetOptionsToDefault
  } = useAssets();

  const [notification, setNotification] = useState(null);

  // New item inputs for each category
  const [newType, setNewType] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newCondition, setNewCondition] = useState('');

  // Editing state: { type: 'type'|'status'|'condition', oldName: '', value: '' }
  const [editing, setEditing] = useState(null);

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Handlers for Asset Types
  const handleAddType = (e) => {
    e.preventDefault();
    if (!newType.trim()) return;
    addAssetType(newType.trim());
    showNotify(`Đã thêm loại tài sản: "${newType.trim()}"`);
    setNewType('');
  };

  const handleDeleteType = (item) => {
    if (assetTypeOptions.length <= 1) {
      alert('Danh mục phải giữ lại ít nhất 1 loại tài sản.');
      return;
    }
    const count = assets.filter(a => cleanText(a.type).toLowerCase() === cleanText(item).toLowerCase()).length;
    const msg = count > 0
      ? `Có ${count} tài sản đang thuộc loại "${item}". Bạn có chắc chắn muốn xóa?`
      : `Xác nhận xóa loại tài sản "${item}"?`;
    if (window.confirm(msg)) {
      deleteAssetType(item);
      showNotify(`Đã xóa loại tài sản: "${item}"`);
    }
  };

  // Handlers for Statuses
  const handleAddStatus = (e) => {
    e.preventDefault();
    if (!newStatus.trim()) return;
    addStatus(newStatus.trim());
    showNotify(`Đã thêm trạng thái: "${newStatus.trim()}"`);
    setNewStatus('');
  };

  const handleDeleteStatus = (item) => {
    if (statusOptions.length <= 1) {
      alert('Danh mục phải giữ lại ít nhất 1 trạng thái.');
      return;
    }
    const count = assets.filter(a => canonicalStatus(a.status).toLowerCase() === cleanText(item).toLowerCase()).length;
    const msg = count > 0
      ? `Có ${count} tài sản đang ở trạng thái "${item}". Bạn có chắc chắn muốn xóa?`
      : `Xác nhận xóa trạng thái "${item}"?`;
    if (window.confirm(msg)) {
      deleteStatus(item);
      showNotify(`Đã xóa trạng thái: "${item}"`);
    }
  };

  // Handlers for Conditions
  const handleAddCondition = (e) => {
    e.preventDefault();
    if (!newCondition.trim()) return;
    addCondition(newCondition.trim());
    showNotify(`Đã thêm tình trạng: "${newCondition.trim()}"`);
    setNewCondition('');
  };

  const handleDeleteCondition = (item) => {
    if (conditionOptions.length <= 1) {
      alert('Danh mục phải giữ lại ít nhất 1 tình trạng.');
      return;
    }
    const count = assets.filter(a => canonicalCondition(a.condition).toLowerCase() === cleanText(item).toLowerCase()).length;
    const msg = count > 0
      ? `Có ${count} tài sản đang ở tình trạng "${item}". Bạn có chắc chắn muốn xóa?`
      : `Xác nhận xóa tình trạng "${item}"?`;
    if (window.confirm(msg)) {
      deleteCondition(item);
      showNotify(`Đã xóa tình trạng: "${item}"`);
    }
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!editing || !editing.value.trim()) return;
    const val = editing.value.trim();

    if (editing.category === 'type') updateAssetType(editing.oldName, val);
    else if (editing.category === 'status') updateStatus(editing.oldName, val);
    else if (editing.category === 'condition') updateCondition(editing.oldName, val);

    showNotify(`Đã cập nhật thành: "${val}"`);
    setEditing(null);
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Sliders size={26} color="#1e3a8a" />
            Tùy Biến Danh Mục Hệ Thống
          </h2>
          <p className="page-subtitle">
            Cấu hình linh hoạt các lựa chọn Loại tài sản, Trạng thái sử dụng và Tình trạng thiết bị theo thực tế đơn vị
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (window.confirm('Khôi phục toàn bộ danh mục Loại tài sản, Trạng thái, Tình trạng về danh mục chuẩn mặc định?')) {
              resetOptionsToDefault();
              showNotify('Đã khôi phục toàn bộ danh mục về mặc định');
            }
          }}
          style={{ color: '#dc2626' }}
        >
          <RotateCcw size={15} />
          Khôi phục mặc định
        </button>
      </div>

      {notification && (
        <div style={{
          background: '#dcfce7',
          color: '#15803d',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle size={18} />
          <span style={{ fontWeight: 600 }}>{notification}</span>
        </div>
      )}

      {/* 3 Columns Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20
      }}>
        {/* Column 1: Loại tài sản */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb'
              }}>
                <Tag size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e3a8a' }}>
                  Loại tài sản
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {assetTypeOptions.length} mục phân loại
                </span>
              </div>
            </div>
          </div>

          {/* Form thêm mới */}
          <form onSubmit={handleAddType} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Thêm loại mới (VD: Thiết bị Y tế...)"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={!newType.trim()}>
              <Plus size={15} />
              Thêm
            </button>
          </form>

          {/* Danh sách items */}
          <div style={{
            flex: 1,
            maxHeight: '440px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            {assetTypeOptions.map((item, idx) => {
              const isEditing = editing && editing.category === 'type' && editing.oldName === item;
              const assetCount = assets.filter(a => cleanText(a.type).toLowerCase() === cleanText(item).toLowerCase()).length;

              return (
                <div
                  key={`${item}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 6, flex: 1, marginRight: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        autoFocus
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveEdit}
                        style={{ padding: '4px 8px' }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditing(null)}
                        style={{ padding: '4px 8px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                          {item}
                        </span>
                        {assetCount > 0 && (
                          <span style={{
                            fontSize: '0.725rem',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '1px 6px',
                            borderRadius: 10,
                            fontWeight: 700
                          }}>
                            {assetCount} TS
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setEditing({ category: 'type', oldName: item, value: item })}
                          title="Sửa tên"
                        >
                          <Edit2 size={13} color="#475569" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteType(item)}
                          title="Xóa"
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Trạng thái sử dụng */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706'
              }}>
                <Activity size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e3a8a' }}>
                  Trạng thái sử dụng
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {statusOptions.length} trạng thái
                </span>
              </div>
            </div>
          </div>

          {/* Form thêm mới */}
          <form onSubmit={handleAddStatus} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Thêm trạng thái mới (VD: Đang niêm phong...)"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={!newStatus.trim()}>
              <Plus size={15} />
              Thêm
            </button>
          </form>

          {/* Danh sách items */}
          <div style={{
            flex: 1,
            maxHeight: '440px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            {statusOptions.map((item, idx) => {
              const isEditing = editing && editing.category === 'status' && editing.oldName === item;
              const assetCount = assets.filter(a => canonicalStatus(a.status).toLowerCase() === cleanText(item).toLowerCase()).length;

              return (
                <div
                  key={`${item}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 6, flex: 1, marginRight: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        autoFocus
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveEdit}
                        style={{ padding: '4px 8px' }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditing(null)}
                        style={{ padding: '4px 8px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                          {item}
                        </span>
                        {assetCount > 0 && (
                          <span style={{
                            fontSize: '0.725rem',
                            background: '#fef3c7',
                            color: '#b45309',
                            padding: '1px 6px',
                            borderRadius: 10,
                            fontWeight: 700
                          }}>
                            {assetCount} TS
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setEditing({ category: 'status', oldName: item, value: item })}
                          title="Sửa tên"
                        >
                          <Edit2 size={13} color="#475569" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteStatus(item)}
                          title="Xóa"
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Tình trạng thiết bị */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: '#dcfce7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a'
              }}>
                <HeartPulse size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e3a8a' }}>
                  Tình trạng thiết bị
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {conditionOptions.length} tình trạng
                </span>
              </div>
            </div>
          </div>

          {/* Form thêm mới */}
          <form onSubmit={handleAddCondition} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Thêm tình trạng mới (VD: Chờ phụ tùng...)"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={!newCondition.trim()}>
              <Plus size={15} />
              Thêm
            </button>
          </form>

          {/* Danh sách items */}
          <div style={{
            flex: 1,
            maxHeight: '440px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            {conditionOptions.map((item, idx) => {
              const isEditing = editing && editing.category === 'condition' && editing.oldName === item;
              const assetCount = assets.filter(a => canonicalCondition(a.condition).toLowerCase() === cleanText(item).toLowerCase()).length;

              return (
                <div
                  key={`${item}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 6, flex: 1, marginRight: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        autoFocus
                        style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveEdit}
                        style={{ padding: '4px 8px' }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditing(null)}
                        style={{ padding: '4px 8px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                          {item}
                        </span>
                        {assetCount > 0 && (
                          <span style={{
                            fontSize: '0.725rem',
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '1px 6px',
                            borderRadius: 10,
                            fontWeight: 700
                          }}>
                            {assetCount} TS
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setEditing({ category: 'condition', oldName: item, value: item })}
                          title="Sửa tên"
                        >
                          <Edit2 size={13} color="#475569" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteCondition(item)}
                          title="Xóa"
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
