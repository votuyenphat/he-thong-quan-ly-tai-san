// src/pages/LocationTree.jsx
// Cây Vị Trí Địa Lý 4 cấp với đầy đủ chức năng CRUD
import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/formatters';
import { ConditionBadge, StatusBadge } from '../components/common/Badge';
import {
  MapPin, Building, Layers, DoorOpen,
  ChevronRight, ChevronDown, Boxes,
  Plus, Edit2, Trash2, Save, X, AlertTriangle
} from 'lucide-react';

// Level hierarchy labels
const LEVEL_TYPES = {
  0: { type: 'CAMPUS', label: 'Cơ sở', icon: Building },
  1: { type: 'AREA', label: 'Khu/Tòa', icon: Layers },
  2: { type: 'FLOOR', label: 'Tầng', icon: MapPin },
  3: { type: 'ROOM', label: 'Phòng', icon: DoorOpen }
};

function findDepth(nodes, targetId, depth = 0) {
  for (const n of nodes) {
    if (n.id === targetId) return depth;
    if (n.children) {
      const found = findDepth(n.children, targetId, depth + 1);
      if (found !== -1) return found;
    }
  }
  return -1;
}

export default function LocationTree() {
  const { locations, assets, addLocation, updateLocation, deleteLocation } = useAssets();
  const { permissions } = useAuth();

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [expanded, setExpanded] = useState({});
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Edit / Add state
  const [editingNode, setEditingNode] = useState(null); // { id, name, code }
  const [addingTo, setAddingTo] = useState(null); // { parentId, depth }
  const [addForm, setAddForm] = useState({ name: '', code: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // node id

  // Find assets in selected location
  const matchedAssets = selectedRoom
    ? assets.filter(a =>
        a.locationPath && (
          a.locationPath.toLowerCase().includes(selectedRoom.name.toLowerCase()) ||
          a.locationPath.toLowerCase().includes(selectedRoom.fullPath.toLowerCase())
        )
      )
    : [];

  const handleSaveEdit = () => {
    if (!editingNode || !editingNode.name.trim()) return;
    updateLocation(editingNode.id, { name: editingNode.name, code: editingNode.code });
    setEditingNode(null);
  };

  const handleAddSubmit = () => {
    if (!addForm.name.trim()) return;
    const depth = addingTo.depth + 1;
    const levelInfo = LEVEL_TYPES[depth] || LEVEL_TYPES[3];
    addLocation(addingTo.parentId, {
      name: addForm.name,
      code: addForm.code,
      type: levelInfo.type,
      children: depth < 3 ? [] : undefined
    });
    setAddingTo(null);
    setAddForm({ name: '', code: '' });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteLocation(deleteConfirm);
      setDeleteConfirm(null);
      if (selectedRoom && selectedRoom.id === deleteConfirm) setSelectedRoom(null);
    }
  };

  // ---- Recursive tree renderer ----
  const renderNode = (node, depth, ancestorPath) => {
    const isRoom = depth === 3;
    const isExpanded = !!expanded[node.id];
    const isSelected = selectedRoom?.id === node.id;
    const fullPath = ancestorPath ? `${ancestorPath} > ${node.name}` : node.name;

    const LevelIcon = (LEVEL_TYPES[depth] || LEVEL_TYPES[3]).icon;
    const levelLabel = (LEVEL_TYPES[depth] || LEVEL_TYPES[3]).label;

    const isEditing = editingNode?.id === node.id;

    const nodeStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: `${isRoom ? 5 : 7}px ${10 - depth}px`,
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: `${0.85 - depth * 0.015}rem`,
      fontWeight: depth === 0 ? 700 : depth === 1 ? 600 : 500,
      background: isSelected ? '#1e3a8a' : isRoom ? 'transparent' : (depth === 0 ? '#eff6ff' : '#f8fafc'),
      color: isSelected ? '#fff' : depth === 0 ? '#1e3a8a' : '#334155',
      border: isRoom && !isSelected ? 'none' : undefined,
      marginBottom: 2
    };

    return (
      <div key={node.id} style={{ marginBottom: depth === 0 ? 8 : 2 }}>
        <div style={nodeStyle}>
          {/* Expand toggle */}
          {!isRoom && (
            <span onClick={() => toggleExpand(node.id)} style={{ flexShrink: 0 }}>
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
          )}
          <LevelIcon size={13} color={isSelected ? '#fff' : depth === 0 ? '#2563eb' : depth === 1 ? '#059669' : '#94a3b8'} />

          {/* Name (edit mode or display) */}
          {isEditing ? (
            <div style={{ display: 'flex', gap: 6, flex: 1, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <input
                className="form-input"
                style={{ height: 28, padding: '2px 8px', fontSize: '0.8rem', flex: 1 }}
                value={editingNode.name}
                onChange={e => setEditingNode(n => ({ ...n, name: e.target.value }))}
                autoFocus
              />
              <input
                className="form-input"
                style={{ height: 28, padding: '2px 8px', fontSize: '0.8rem', width: 80 }}
                value={editingNode.code}
                onChange={e => setEditingNode(n => ({ ...n, code: e.target.value }))}
                placeholder="Mã"
              />
              <button
                style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}
                onClick={handleSaveEdit}
              >
                <Save size={13} />
              </button>
              <button
                style={{ background: '#94a3b8', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}
                onClick={() => setEditingNode(null)}
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <span
              style={{ flex: 1 }}
              onClick={() => {
                if (isRoom) {
                  setSelectedRoom({ id: node.id, name: node.name, fullPath });
                } else {
                  toggleExpand(node.id);
                }
              }}
            >
              {node.name}
              {node.code && <span style={{ marginLeft: 6, fontSize: '0.7rem', opacity: 0.6 }}>({node.code})</span>}
            </span>
          )}

          {/* Action buttons */}
          {!isEditing && permissions?.canManageAssets && (
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              {/* Add child */}
              {depth < 3 && (
                <button
                  title={`Thêm ${(LEVEL_TYPES[depth + 1] || LEVEL_TYPES[3]).label}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: isSelected ? '#fff' : '#2563eb' }}
                  onClick={() => {
                    setAddingTo({ parentId: node.id, depth });
                    setAddForm({ name: '', code: '' });
                    setExpanded(prev => ({ ...prev, [node.id]: true }));
                  }}
                >
                  <Plus size={12} />
                </button>
              )}
              {/* Edit */}
              <button
                title="Sửa tên"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: isSelected ? '#fff' : '#d97706' }}
                onClick={() => setEditingNode({ id: node.id, name: node.name, code: node.code || '' })}
              >
                <Edit2 size={12} />
              </button>
              {/* Delete */}
              <button
                title="Xóa"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, color: isSelected ? '#fca5a5' : '#dc2626' }}
                onClick={() => setDeleteConfirm(node.id)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Add child form */}
        {addingTo?.parentId === node.id && (
          <div
            style={{ paddingLeft: 28, marginTop: 4, marginBottom: 4 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                className="form-input"
                style={{ height: 30, padding: '2px 10px', fontSize: '0.8rem', flex: 1 }}
                value={addForm.name}
                onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                placeholder={`Tên ${(LEVEL_TYPES[addingTo.depth + 1] || LEVEL_TYPES[3]).label} mới...`}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleAddSubmit(); if (e.key === 'Escape') setAddingTo(null); }}
              />
              <input
                className="form-input"
                style={{ height: 30, padding: '2px 8px', fontSize: '0.8rem', width: 80 }}
                value={addForm.code}
                onChange={e => setAddForm(p => ({ ...p, code: e.target.value }))}
                placeholder="Mã"
              />
              <button
                style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}
                onClick={handleAddSubmit}
              >
                <Save size={13} />
              </button>
              <button
                style={{ background: '#94a3b8', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
                onClick={() => setAddingTo(null)}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Children */}
        {!isRoom && isExpanded && node.children && (
          <div style={{ paddingLeft: 16, marginTop: 4 }}>
            {node.children.map(child => renderNode(child, depth + 1, fullPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <MapPin size={26} color="#1e3a8a" />
            Cây Vị Trí Địa Lý Thực Tế (4 Cấp)
          </h2>
          <p className="page-subtitle">
            Cấu trúc: Cơ sở ➔ Khu/Tòa ➔ Tầng ➔ Phòng | Hỗ trợ thêm / sửa / xóa nút
          </p>
        </div>
        {permissions?.canManageAssets && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setAddingTo({ parentId: null, depth: -1 });
              setAddForm({ name: '', code: '' });
            }}
          >
            <Plus size={16} />
            Thêm Cơ sở mới
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
        {/* Left: Tree */}
        <div className="card" style={{ padding: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a', marginBottom: 10 }}>
            SƠ ĐỒ ĐỊA BÀN ({locations.length} cơ sở)
          </div>

          {/* Add top-level form */}
          {addingTo?.parentId === null && (
            <div style={{ marginBottom: 10 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  className="form-input"
                  style={{ height: 30, padding: '2px 10px', fontSize: '0.8rem', flex: 1 }}
                  value={addForm.name}
                  onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Tên Cơ sở mới..."
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSubmit(); if (e.key === 'Escape') setAddingTo(null); }}
                />
                <input
                  className="form-input"
                  style={{ height: 30, padding: '2px 8px', fontSize: '0.8rem', width: 80 }}
                  value={addForm.code}
                  onChange={e => setAddForm(p => ({ ...p, code: e.target.value }))}
                  placeholder="Mã CS"
                />
                <button
                  style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                  onClick={handleAddSubmit}
                >
                  <Save size={13} />
                </button>
                <button
                  style={{ background: '#94a3b8', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
                  onClick={() => setAddingTo(null)}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          )}

          {locations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Chưa có vị trí nào.<br />
              Nhấn <strong>Thêm Cơ sở mới</strong> để bắt đầu.
            </div>
          ) : (
            locations.map(campus => renderNode(campus, 0, ''))
          )}
        </div>

        {/* Right: Room Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedRoom ? (
            <>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>
                      VỊ TRÍ PHÒNG ĐANG CHỌN
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                      {selectedRoom.name}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                      Đường dẫn: {selectedRoom.fullPath}
                    </div>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    Hiện có: {matchedAssets.length} tài sản
                  </span>
                </div>
              </div>

              <div className="card">
                <h4 className="card-title">
                  <Boxes size={16} />
                  Tài Sản Đang Bố Trí Tại Phòng Này
                </h4>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mã tài sản</th>
                        <th>Tên tài sản</th>
                        <th>Đơn vị quản lý</th>
                        <th>Người sử dụng</th>
                        <th style={{ textAlign: 'right' }}>Nguyên giá</th>
                        <th style={{ textAlign: 'center' }}>Tình trạng</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchedAssets.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                            Không có tài sản nào ghi nhận tại phòng này.
                          </td>
                        </tr>
                      ) : (
                        matchedAssets.map(asset => (
                          <tr key={asset.id}>
                            <td>
                              <span style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                                {asset.code}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{asset.name}</div>
                              <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                                {asset.brand} - {asset.model}
                              </div>
                            </td>
                            <td style={{ fontSize: '0.825rem' }}>{asset.departmentName}</td>
                            <td style={{ fontSize: '0.825rem', fontWeight: 600 }}>{asset.currentUser}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatVND(asset.cost)}</td>
                            <td style={{ textAlign: 'center' }}><ConditionBadge condition={asset.condition} /></td>
                            <td style={{ textAlign: 'center' }}><StatusBadge status={asset.status} /></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#94a3b8' }}>
              <MapPin size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem' }}>Chọn một phòng trong cây bên trái để xem tài sản</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0 }}>Xóa vị trí này?</h3>
                <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '2px 0 0' }}>
                  Toàn bộ nút con bên trong cũng sẽ bị xóa!
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Hủy</button>
              <button
                className="btn"
                style={{ background: '#dc2626', color: '#fff' }}
                onClick={handleDeleteConfirm}
              >
                <Trash2 size={14} /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
