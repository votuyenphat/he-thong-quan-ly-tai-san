// src/components/common/ManageOptionsModal.jsx
import React, { useState } from 'react';
import Modal from './Modal';
import { useAssets } from '../../context/AssetContext';
import { Plus, Trash2, Edit2, Check, X, RotateCcw, Sliders } from 'lucide-react';

export default function ManageOptionsModal({ isOpen, onClose, initialTab = 'types' }) {
  const {
    assetTypeOptions, addAssetType, deleteAssetType, updateAssetType,
    conditionOptions, addCondition, deleteCondition, updateCondition,
    statusOptions, addStatus, deleteStatus, updateStatus,
    resetOptionsToDefault
  } = useAssets();

  const [activeTab, setActiveTab] = useState(initialTab); // 'types' | 'conditions' | 'statuses'
  const [newVal, setNewVal] = useState('');
  const [editingItem, setEditingItem] = useState(null); // { oldName: '', value: '' }

  const tabs = [
    { id: 'types', label: `Loại tài sản (${assetTypeOptions.length})` },
    { id: 'statuses', label: `Trạng thái (${statusOptions.length})` },
    { id: 'conditions', label: `Tình trạng (${conditionOptions.length})` }
  ];

  const handleAdd = (e) => {
    e.preventDefault();
    const val = newVal.trim();
    if (!val) return;

    if (activeTab === 'types') addAssetType(val);
    else if (activeTab === 'statuses') addStatus(val);
    else if (activeTab === 'conditions') addCondition(val);

    setNewVal('');
  };

  const handleDelete = (name) => {
    let list = [];
    if (activeTab === 'types') list = assetTypeOptions;
    else if (activeTab === 'statuses') list = statusOptions;
    else if (activeTab === 'conditions') list = conditionOptions;

    if (list.length <= 1) {
      alert('Danh mục phải giữ lại ít nhất một mục.');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa "${name}" khỏi danh mục?`)) {
      if (activeTab === 'types') deleteAssetType(name);
      else if (activeTab === 'statuses') deleteStatus(name);
      else if (activeTab === 'conditions') deleteCondition(name);
    }
  };

  const startEdit = (name) => {
    setEditingItem({ oldName: name, value: name });
  };

  const saveEdit = () => {
    if (!editingItem || !editingItem.value.trim()) return;
    const newName = editingItem.value.trim();

    if (activeTab === 'types') updateAssetType(editingItem.oldName, newName);
    else if (activeTab === 'statuses') updateStatus(editingItem.oldName, newName);
    else if (activeTab === 'conditions') updateCondition(editingItem.oldName, newName);

    setEditingItem(null);
  };

  const currentList = activeTab === 'types'
    ? assetTypeOptions
    : activeTab === 'statuses'
      ? statusOptions
      : conditionOptions;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tùy Chỉnh Danh Mục: Loại TS, Trạng Thái, Tình Trạng"
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (window.confirm('Khôi phục toàn bộ Loại tài sản, Tình trạng, Trạng thái về danh mục mặc định ban đầu?')) {
                resetOptionsToDefault();
              }
            }}
            style={{ fontSize: '0.825rem', color: '#dc2626' }}
          >
            <RotateCcw size={14} />
            Khôi phục mặc định
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Đóng
          </button>
        </div>
      }
    >
      <div>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          gap: 6,
          marginBottom: 16
        }}>
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setActiveTab(t.id); setEditingItem(null); setNewVal(''); }}
              style={{
                padding: '8px 14px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid #2563eb' : '2px solid transparent',
                color: activeTab === t.id ? '#1e40af' : '#64748b',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form thêm mới */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            className="form-input"
            placeholder={
              activeTab === 'types'
                ? 'Nhập tên loại tài sản mới (VD: Thiết bị Y tế, Máy nông nghiệp...)'
                : activeTab === 'statuses'
                  ? 'Nhập tên trạng thái mới (VD: Chờ kiểm định, Đang niêm phong...)'
                  : 'Nhập tên tình trạng mới (VD: Cần bảo dưỡng gấp, Chờ phụ tùng...)'
            }
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={!newVal.trim()}>
            <Plus size={16} />
            Thêm
          </button>
        </form>

        {/* Danh sách mục hiện có */}
        <div style={{
          maxHeight: '340px',
          overflowY: 'auto',
          border: '1px solid #f1f5f9',
          borderRadius: '8px',
          background: '#f8fafc',
          padding: '8px'
        }}>
          {currentList.map((item, idx) => {
            const isEditing = editingItem && editingItem.oldName === item;

            return (
              <div
                key={`${item}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '6px'
                }}
              >
                {isEditing ? (
                  <div style={{ display: 'flex', gap: 6, flex: 1, marginRight: 8 }}>
                    <input
                      type="text"
                      className="form-input"
                      value={editingItem.value}
                      onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                      autoFocus
                      style={{ padding: '4px 8px', fontSize: '0.875rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={saveEdit}
                      style={{ padding: '4px 8px' }}
                      title="Lưu"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditingItem(null)}
                      style={{ padding: '4px 8px' }}
                      title="Hủy"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                    {item}
                  </span>
                )}

                {!isEditing && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      style={{
                        border: 'none',
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#475569'
                      }}
                      title="Sửa tên"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      style={{
                        border: 'none',
                        background: '#fee2e2',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#dc2626'
                      }}
                      title="Xóa"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
