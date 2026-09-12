// src/pages/LocationTree.jsx
// Cây Vị Trí Địa Lý 4 cấp - Nhận dữ liệu tự động từ tài sản với CRUD đầy đủ
import React, { useState, useMemo } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/formatters';
import { exportToExcel } from '../utils/exportExcel';
import { ConditionBadge, StatusBadge } from '../components/common/Badge';
import AssetDetailModal from './AssetDetailModal';
import QRModal from '../components/common/QRModal';
import {
  cleanText,
  canonicalStatus,
  canonicalCondition,
  deduplicateAndMergeLocationTree
} from '../utils/normalize';

import {
  MapPin, Building, Layers, DoorOpen,
  ChevronRight, ChevronDown, Boxes,
  Plus, Edit2, Trash2, Save, X, AlertTriangle,
  RefreshCw, Search, CheckCircle,
  Globe, Download, Eye, QrCode
} from 'lucide-react';

import {
  LEVEL_TYPES,
  isAssetAtLocation,
  buildEffectiveLocationTree
} from '../utils/locationTreeHelper';

export default function LocationTree() {
  const {
    locations,
    setLocations,
    assets,
    addLocation,
    updateLocation,
    deleteLocation,
    syncLocationsFromAssets
  } = useAssets();
  const { permissions } = useAuth();

  // Selected location state: null | { type: 'ALL' | 'UNASSIGNED' | 'NODE', id, name, fullPath, depth, label }
  const [selectedLocation, setSelectedLocation] = useState({
    type: 'ALL',
    name: 'Toàn bộ địa bàn đơn vị',
    fullPath: 'Tất cả vị trí',
    label: 'Toàn đơn vị'
  });

  const [expanded, setExpanded] = useState({});
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Search & Filter state for assets within selected location
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Edit / Add state for location nodes
  const [editingNode, setEditingNode] = useState(null); // { id, name, code }
  const [addingTo, setAddingTo] = useState(null); // { parentId, depth }
  const [addForm, setAddForm] = useState({ name: '', code: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // node id
  const [notification, setNotification] = useState(null);

  // Asset detail & QR modals
  const [detailAsset, setDetailAsset] = useState(null);
  const [qrAsset, setQrAsset] = useState(null);

  // Effective location tree automatically including all locations from assets
  const effectiveTree = useMemo(() => {
    return buildEffectiveLocationTree(locations, assets);
  }, [locations, assets]);

  // Expand top-level campuses by default if not yet initialized
  React.useEffect(() => {
    if (effectiveTree.length > 0 && Object.keys(expanded).length === 0) {
      const initialExpanded = {};
      effectiveTree.forEach(c => {
        initialExpanded[c.id] = true;
        if (c.children) {
          c.children.forEach(a => { initialExpanded[a.id] = true; });
        }
      });
      setExpanded(initialExpanded);
    }
  }, [effectiveTree]);

  // Auto-heal locations state if it contains duplicated nodes from prior sessions
  React.useEffect(() => {
    if (Array.isArray(locations) && locations.length > 0) {
      const deduplicated = deduplicateAndMergeLocationTree(locations);
      if (JSON.stringify(deduplicated) !== JSON.stringify(locations)) {
        if (setLocations) setLocations(deduplicated);
      }
    }
  }, [locations, setLocations]);

  // Statistics: Unassigned vs Assigned assets
  const unassignedCount = useMemo(() => {
    return assets.filter(a => !a.locationPath || !a.locationPath.trim() || a.locationPath.includes('Chưa phân')).length;
  }, [assets]);

  const assetsWithLocationCount = assets.length - unassignedCount;

  // Filter matched assets for currently selected location
  const filteredAssets = useMemo(() => {
    if (!selectedLocation) return [];

    let list = [];
    if (selectedLocation.type === 'ALL') {
      list = assets;
    } else if (selectedLocation.type === 'UNASSIGNED') {
      list = assets.filter(a => !a.locationPath || !a.locationPath.trim() || a.locationPath.includes('Chưa phân'));
    } else {
      list = assets.filter(a => isAssetAtLocation(a.locationPath, selectedLocation.fullPath, selectedLocation.name));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a =>
        a.code?.toLowerCase().includes(q) ||
        a.name?.toLowerCase().includes(q) ||
        a.currentUser?.toLowerCase().includes(q) ||
        a.departmentName?.toLowerCase().includes(q) ||
        a.brand?.toLowerCase().includes(q) ||
        a.locationPath?.toLowerCase().includes(q)
      );
    }

    // Filter by condition
    if (filterCondition !== 'ALL') {
      list = list.filter(a => canonicalCondition(a.condition).toLowerCase() === cleanText(filterCondition).toLowerCase());
    }

    // Filter by status
    if (filterStatus !== 'ALL') {
      list = list.filter(a => canonicalStatus(a.status).toLowerCase() === cleanText(filterStatus).toLowerCase());
    }

    return list;
  }, [assets, selectedLocation, searchQuery, filterCondition, filterStatus]);

  // Total value of filtered assets
  const totalValue = useMemo(() => {
    return filteredAssets.reduce((sum, a) => sum + ((Number(a.cost) || 0) * (Number(a.quantity) || 1)), 0);
  }, [filteredAssets]);

  // Handle Sync locations from assets
  const handleSyncFromAssets = () => {
    if (syncLocationsFromAssets) {
      const synced = syncLocationsFromAssets(assets);
      setNotification(`Đã đồng bộ thành công cấu trúc vị trí từ ${assets.length} tài sản!`);
    } else if (setLocations) {
      const newTree = buildEffectiveLocationTree(locations, assets);
      setLocations(newTree);
      setNotification(`Đã lưu ${newTree.length} cơ sở vào hệ thống!`);
    }
    setTimeout(() => setNotification(null), 4000);
  };

  // Node CRUD handlers
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
      if (selectedLocation?.id === deleteConfirm) {
        setSelectedLocation({
          type: 'ALL',
          name: 'Toàn bộ địa bàn đơn vị',
          fullPath: 'Tất cả vị trí',
          label: 'Toàn đơn vị'
        });
      }
    }
  };

  // Export current location assets to Excel
  const handleExportLocationExcel = () => {
    const exportRows = filteredAssets.map((a, idx) => ({
      'STT': idx + 1,
      'Mã tài sản': a.code,
      'Tên tài sản': a.name,
      'Loại tài sản': a.type,
      'Nhãn hiệu': a.brand || '',
      'Số lượng': a.quantity || 1,
      'Đơn vị tính': a.unit || 'Cái',
      'Đơn giá (VNĐ)': a.cost || 0,
      'Tổng giá trị (VNĐ)': (Number(a.cost) || 0) * (Number(a.quantity) || 1),
      'Vị trí cụ thể': a.locationPath || 'Chưa phân vị trí',
      'Phòng ban quản lý': a.departmentName || '',
      'Người sử dụng': a.currentUser || '',
      'Tình trạng': a.condition || '',
      'Trạng thái': a.status || ''
    }));

    const filename = `Tai_San_${(selectedLocation.name || 'Vi_Tri').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getFullYear()}.xlsx`;
    exportToExcel(exportRows, filename, 'TaiSan_ViTri');
  };

  // ---- Recursive Tree Node Renderer ----
  const renderNode = (node, depth, ancestorPath) => {
    const isExpanded = !!expanded[node.id];
    const isSelected = selectedLocation?.id === node.id;
    const fullPath = ancestorPath ? `${ancestorPath} > ${node.name}` : node.name;

    const levelInfo = LEVEL_TYPES[depth] || LEVEL_TYPES[3];
    const LevelIcon = levelInfo.icon;
    const isEditing = editingNode?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;

    // Count assets present in this node or any child nodes
    const nodeAssetCount = assets.filter(a => isAssetAtLocation(a.locationPath, fullPath, node.name)).length;

    const nodeStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '7px 10px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: `${0.86 - depth * 0.02}rem`,
      fontWeight: depth === 0 ? 700 : depth === 1 ? 600 : 500,
      background: isSelected ? '#1e3a8a' : (depth === 0 ? '#f0f9ff' : 'transparent'),
      color: isSelected ? '#ffffff' : (depth === 0 ? '#1e3a8a' : '#334155'),
      marginBottom: 2,
      transition: 'all 0.15s ease'
    };

    return (
      <div key={node.id} style={{ marginBottom: depth === 0 ? 6 : 2 }}>
        <div
          style={nodeStyle}
          className="location-tree-node"
          onClick={() => {
            setSelectedLocation({
              type: 'NODE',
              id: node.id,
              name: node.name,
              fullPath,
              depth,
              label: levelInfo.label
            });
            if (hasChildren && !isExpanded) {
              toggleExpand(node.id);
            }
          }}
        >
          {/* Expand toggle */}
          {hasChildren ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              style={{
                flexShrink: 0,
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                color: isSelected ? '#fff' : '#64748b'
              }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <span style={{ width: 18, flexShrink: 0 }} />
          )}

          <LevelIcon
            size={15}
            color={isSelected ? '#ffffff' : levelInfo.color}
            style={{ flexShrink: 0 }}
          />

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
                style={{ height: 28, padding: '2px 8px', fontSize: '0.8rem', width: 70 }}
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
            <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{node.name}</span>
              {node.code && (
                <span style={{
                  fontSize: '0.7rem',
                  opacity: isSelected ? 0.85 : 0.6,
                  fontFamily: 'monospace'
                }}>
                  ({node.code})
                </span>
              )}
            </span>
          )}

          {/* Asset count badge */}
          {!isEditing && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '12px',
                background: isSelected ? 'rgba(255, 255, 255, 0.25)' : (nodeAssetCount > 0 ? '#e0f2fe' : '#f1f5f9'),
                color: isSelected ? '#ffffff' : (nodeAssetCount > 0 ? '#0369a1' : '#94a3b8'),
                flexShrink: 0
              }}
              title={`${nodeAssetCount} tài sản đang bố trí tại vị trí này và cấp con`}
            >
              {nodeAssetCount}
            </span>
          )}

          {/* Action buttons */}
          {!isEditing && permissions?.canManageAssets && (
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              {depth < 3 && (
                <button
                  title={`Thêm ${(LEVEL_TYPES[depth + 1] || LEVEL_TYPES[3]).label}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 4,
                    color: isSelected ? '#fff' : '#2563eb'
                  }}
                  onClick={() => {
                    setAddingTo({ parentId: node.id, depth });
                    setAddForm({ name: '', code: '' });
                    setExpanded(prev => ({ ...prev, [node.id]: true }));
                  }}
                >
                  <Plus size={12} />
                </button>
              )}
              <button
                title="Sửa tên vị trí"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: 4,
                  color: isSelected ? '#fff' : '#d97706'
                }}
                onClick={() => setEditingNode({ id: node.id, name: node.name, code: node.code || '' })}
              >
                <Edit2 size={12} />
              </button>
              <button
                title="Xóa vị trí"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: 4,
                  color: isSelected ? '#fca5a5' : '#dc2626'
                }}
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
            style={{ paddingLeft: 24, marginTop: 4, marginBottom: 6 }}
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
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddSubmit();
                  if (e.key === 'Escape') setAddingTo(null);
                }}
              />
              <input
                className="form-input"
                style={{ height: 30, padding: '2px 8px', fontSize: '0.8rem', width: 70 }}
                value={addForm.code}
                onChange={e => setAddForm(p => ({ ...p, code: e.target.value }))}
                placeholder="Mã"
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

        {/* Children */}
        {hasChildren && isExpanded && (
          <div style={{ paddingLeft: 14, borderLeft: '1px dashed #cbd5e1', marginLeft: 10 }}>
            {node.children.map(child => renderNode(child, depth + 1, fullPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <MapPin size={26} color="#1e3a8a" />
            Cây Vị Trí Địa Lý Thực Tế (4 Cấp)
          </h2>
          <p className="page-subtitle">
            Cấu trúc: Cơ sở ➔ Khu/Tòa ➔ Tầng ➔ Phòng | Tự động đồng bộ với vị trí tài sản
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSyncFromAssets}
            style={{ color: '#059669', borderColor: '#a7f3d0' }}
            title="Quét toàn bộ vị trí từ danh sách tài sản hiện có vào cây địa lý"
          >
            <RefreshCw size={16} />
            Đồng bộ từ tài sản ({assetsWithLocationCount} TS)
          </button>

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
      </div>

      {/* Notification */}
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
          <CheckCircle size={20} />
          <span style={{ fontWeight: 600 }}>{notification}</span>
        </div>
      )}

      {/* Main Grid: Tree Left | Details Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
        {/* Left: Tree */}
        <div className="card" style={{ padding: '16px', maxHeight: '82vh', overflowY: 'auto' }}>
          {/* Header of Tree */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building size={16} color="#2563eb" />
              SƠ ĐỒ ĐỊA BÀN ({effectiveTree.length} cơ sở)
            </div>
          </div>

          {/* Quick Select Buttons: ALL & UNASSIGNED */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedLocation?.type === 'ALL' ? '#1e3a8a' : '#f8fafc',
                color: selectedLocation?.type === 'ALL' ? '#ffffff' : '#1e293b',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: '1px solid',
                borderColor: selectedLocation?.type === 'ALL' ? '#1e3a8a' : '#e2e8f0'
              }}
              onClick={() => setSelectedLocation({
                type: 'ALL',
                name: 'Toàn bộ địa bàn đơn vị',
                fullPath: 'Tất cả vị trí',
                label: 'Toàn đơn vị'
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={16} color={selectedLocation?.type === 'ALL' ? '#fff' : '#2563eb'} />
                <span>Tất cả tài sản</span>
              </div>
              <span style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: selectedLocation?.type === 'ALL' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                color: selectedLocation?.type === 'ALL' ? '#fff' : '#475569'
              }}>
                {assets.length}
              </span>
            </div>

            {unassignedCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedLocation?.type === 'UNASSIGNED' ? '#dc2626' : '#fff1f2',
                  color: selectedLocation?.type === 'UNASSIGNED' ? '#ffffff' : '#991b1b',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  border: '1px solid',
                  borderColor: selectedLocation?.type === 'UNASSIGNED' ? '#dc2626' : '#fecdd3'
                }}
                onClick={() => setSelectedLocation({
                  type: 'UNASSIGNED',
                  name: 'Chưa phân bổ vị trí cụ thể',
                  fullPath: 'Chưa phân vị trí',
                  label: 'Chưa phân bổ'
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={15} color={selectedLocation?.type === 'UNASSIGNED' ? '#fff' : '#dc2626'} />
                  <span>Chưa phân vị trí</span>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: selectedLocation?.type === 'UNASSIGNED' ? 'rgba(255,255,255,0.25)' : '#fee2e2',
                  color: selectedLocation?.type === 'UNASSIGNED' ? '#fff' : '#b91c1c'
                }}>
                  {unassignedCount}
                </span>
              </div>
            )}
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
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddSubmit();
                    if (e.key === 'Escape') setAddingTo(null);
                  }}
                />
                <input
                  className="form-input"
                  style={{ height: 30, padding: '2px 8px', fontSize: '0.8rem', width: 70 }}
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

          {/* The tree nodes */}
          {effectiveTree.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '0.85rem' }}>
              <MapPin size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
              <div>Chưa có dữ liệu vị trí nào.</div>
              <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                Nhấn <strong>"Thêm Cơ sở mới"</strong> hoặc <strong>"Đồng bộ từ tài sản"</strong>.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {effectiveTree.map(campus => renderNode(campus, 0, ''))}
            </div>
          )}
        </div>

        {/* Right: Location Details & Assets Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedLocation ? (
            <>
              {/* Location Summary Card */}
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#2563eb',
                      background: '#eff6ff',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      marginBottom: 4
                    }}>
                      <MapPin size={12} />
                      {selectedLocation.label ? selectedLocation.label.toUpperCase() : 'VỊ TRÍ ĐỊA LÝ'}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {selectedLocation.name}
                    </h3>
                    <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: 3 }}>
                      <strong>Đường dẫn:</strong> {selectedLocation.fullPath}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      textAlign: 'right',
                      background: '#f8fafc',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Tổng số tài sản</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a' }}>
                        {filteredAssets.length} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>tài sản</span>
                      </div>
                    </div>

                    <div style={{
                      textAlign: 'right',
                      background: '#f0fdf4',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <div style={{ fontSize: '0.72rem', color: '#15803d' }}>Tổng giá trị bố trí</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>
                        {formatVND(totalValue)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets List Card */}
              <div className="card">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Boxes size={18} color="#1e3a8a" />
                    <h4 className="card-title" style={{ margin: 0 }}>
                      Danh Mục Tài Sản Tại Vị Trí Này ({filteredAssets.length})
                    </h4>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search box */}
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#94a3b8' }} />
                      <input
                        type="text"
                        className="form-input"
                        style={{ height: 32, paddingLeft: 30, fontSize: '0.8rem', width: 180 }}
                        placeholder="Tìm mã, tên, người..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Condition filter */}
                    <select
                      className="form-select"
                      style={{ height: 32, fontSize: '0.8rem', padding: '2px 8px' }}
                      value={filterCondition}
                      onChange={e => setFilterCondition(e.target.value)}
                    >
                      <option value="ALL">Tất cả tình trạng</option>
                      <option value="Tốt">Tốt</option>
                      <option value="Khá">Khá</option>
                      <option value="Hỏng nhẹ">Hỏng nhẹ</option>
                      <option value="Hỏng nặng">Hỏng nặng</option>
                      <option value="Không sử dụng được">Không sử dụng được</option>
                    </select>

                    {/* Status filter */}
                    <select
                      className="form-select"
                      style={{ height: 32, fontSize: '0.8rem', padding: '2px 8px' }}
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="Đang sử dụng">Đang sử dụng</option>
                      <option value="Trong kho">Trong kho</option>
                      <option value="Điều chuyển">Điều chuyển</option>
                      <option value="Chờ thanh lý">Chờ thanh lý</option>
                    </select>

                    {/* Export Excel button */}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ height: 32, padding: '0 10px', fontSize: '0.8rem' }}
                      onClick={handleExportLocationExcel}
                      title="Xuất bảng Excel tài sản vị trí này"
                    >
                      <Download size={14} />
                      Xuất Excel
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 40, textAlign: 'center' }}>STT</th>
                        <th>Mã tài sản</th>
                        <th>Tên tài sản</th>
                        <th>Vị trí chi tiết</th>
                        <th>Đơn vị quản lý</th>
                        <th>Người sử dụng</th>
                        <th style={{ textAlign: 'right' }}>Nguyên giá</th>
                        <th style={{ textAlign: 'center' }}>Tình trạng</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                        <th style={{ textAlign: 'center', width: 70 }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                            <Boxes size={32} color="#cbd5e1" style={{ marginBottom: 8 }} />
                            <div>Không có tài sản nào phù hợp tại vị trí này.</div>
                          </td>
                        </tr>
                      ) : (
                        filteredAssets.map((asset, idx) => (
                          <tr key={asset.id}>
                            <td style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                              {idx + 1}
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {asset.code}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{asset.name}</div>
                              <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                                {asset.brand ? `${asset.brand} • ` : ''}{asset.type} • SL: {asset.quantity || 1} {asset.unit || 'Cái'}
                              </div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#2563eb', maxWidth: 180 }}>
                              {asset.locationPath || <span style={{ color: '#dc2626' }}>Chưa phân vị trí</span>}
                            </td>
                            <td style={{ fontSize: '0.825rem' }}>{asset.departmentName}</td>
                            <td style={{ fontSize: '0.825rem', fontWeight: 600 }}>{asset.currentUser}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              {formatVND(asset.cost)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <ConditionBadge condition={asset.condition} />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <StatusBadge status={asset.status} />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                <button
                                  className="btn-icon"
                                  onClick={() => setDetailAsset(asset)}
                                  title="Xem chi tiết tài sản"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  className="btn-icon"
                                  onClick={() => setQrAsset(asset)}
                                  title="In tem mã QR"
                                >
                                  <QrCode size={14} />
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
            </>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 250, color: '#94a3b8' }}>
              <MapPin size={44} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem', margin: 0 }}>Chọn một vị trí trong cây bên trái để xem danh mục tài sản</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
                  Toàn bộ các vị trí cấp con bên trong cũng sẽ bị xóa khỏi cây!
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

      {/* Asset Detail Modal */}
      {detailAsset && (
        <AssetDetailModal
          isOpen={Boolean(detailAsset)}
          onClose={() => setDetailAsset(null)}
          asset={detailAsset}
          onOpenQR={(a) => {
            setDetailAsset(null);
            setQrAsset(a);
          }}
        />
      )}

      {/* QR Modal */}
      {qrAsset && (
        <QRModal
          isOpen={Boolean(qrAsset)}
          onClose={() => setQrAsset(null)}
          asset={qrAsset}
        />
      )}
    </div>
  );
}

