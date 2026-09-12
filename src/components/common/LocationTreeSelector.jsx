// src/components/common/LocationTreeSelector.jsx
import React, { useState, useMemo } from 'react';
import { useAssets } from '../../context/AssetContext';
import { LEVEL_TYPES, buildEffectiveLocationTree, isAssetAtLocation } from '../../utils/locationTreeHelper';
import { cleanText } from '../../utils/normalize';
import {
  ChevronRight,
  ChevronDown,
  Building,
  Layers,
  MapPin,
  DoorOpen,
  Search,
  Check,
  FolderTree,
  X,
  ExternalLink
} from 'lucide-react';

export default function LocationTreeSelector({
  value,
  onChange,
  placeholder = 'VD: Cơ sở 1 > Khu B > Tầng 2 > Giảng đường B2.01',
  required = false,
  label = 'Vị trí phòng ốc mới chi tiết (*)'
}) {
  const { locations, assets } = useAssets();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState({});

  // Cây vị trí địa lý thực tế đồng bộ chính xác với trang Cây Vị Trí Địa Lý
  const effectiveTree = useMemo(() => {
    return buildEffectiveLocationTree(locations, assets);
  }, [locations, assets]);

  // Tự động mở rộng các cấp khi mới mở cây
  const handleToggleOpen = () => {
    if (!isOpen && Object.keys(expanded).length === 0) {
      const initialExpanded = {};
      effectiveTree.forEach(campus => {
        initialExpanded[campus.id] = true;
        if (campus.children) {
          campus.children.forEach(area => {
            initialExpanded[area.id] = true;
          });
        }
      });
      setExpanded(initialExpanded);
    }
    setIsOpen(prev => !prev);
  };

  const toggleNode = (id, e) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all = {};
    const traverse = (nodes) => {
      nodes.forEach(n => {
        all[n.id] = true;
        if (n.children) traverse(n.children);
      });
    };
    traverse(effectiveTree);
    setExpanded(all);
  };

  const collapseAll = () => {
    setExpanded({});
  };

  const handleSelectNode = (fullPath) => {
    onChange(fullPath);
  };

  // Lọc tìm kiếm trên cây
  const matchesSearch = (node, fullPath) => {
    if (!searchTerm.trim()) return true;
    const q = cleanText(searchTerm).toLowerCase();
    if (cleanText(node.name).toLowerCase().includes(q)) return true;
    if (cleanText(fullPath).toLowerCase().includes(q)) return true;
    if (node.children && node.children.some(c => matchesSearch(c, `${fullPath} > ${c.name}`))) {
      return true;
    }
    return false;
  };

  // Đếm số tài sản tại vị trí
  const getNodeAssetCount = (fullPath, nodeName) => {
    return (assets || []).filter(a => isAssetAtLocation(a.locationPath, fullPath, nodeName)).length;
  };

  const renderTreeNode = (node, parentPath = '', depth = 0) => {
    const fullPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
    if (!matchesSearch(node, fullPath)) return null;

    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = expanded[node.id] || searchTerm.trim().length > 0;
    const isSelected = cleanText(value).toLowerCase() === cleanText(fullPath).toLowerCase();
    const assetCount = getNodeAssetCount(fullPath, node.name);

    const levelConfig = LEVEL_TYPES[depth] || LEVEL_TYPES[3];
    const IconComponent = levelConfig.icon || DoorOpen;

    return (
      <div key={node.id} style={{ marginLeft: depth > 0 ? 16 : 0, marginTop: 2 }}>
        <div
          onClick={() => handleSelectNode(fullPath)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: isSelected ? '#eff6ff' : 'transparent',
            border: isSelected ? '1px solid #93c5fd' : '1px solid transparent',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!isSelected) e.currentTarget.style.background = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            if (!isSelected) e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflow: 'hidden' }}>
            {hasChildren ? (
              <span
                onClick={(e) => toggleNode(node.id, e)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            ) : (
              <span style={{ width: 20, height: 20, display: 'inline-block' }} />
            )}

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: '5px',
                background: levelConfig.bg,
                color: levelConfig.color
              }}
            >
              <IconComponent size={13} />
            </span>

            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: isSelected ? 700 : (depth === 0 ? 600 : 500),
                color: isSelected ? '#1d4ed8' : '#1e293b',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {node.name}
            </span>

            <span
              style={{
                fontSize: '0.7rem',
                padding: '1px 6px',
                borderRadius: '4px',
                background: '#f1f5f9',
                color: '#64748b'
              }}
            >
              {levelConfig.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {assetCount > 0 && (
              <span
                title={`${assetCount} tài sản đang đặt tại vị trí này`}
                style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: '#e2e8f0',
                  color: '#475569',
                  fontWeight: 500
                }}
              >
                {assetCount} TS
              </span>
            )}

            {isSelected && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: '0.75rem',
                  color: '#059669',
                  fontWeight: 600,
                  background: '#d1fae5',
                  padding: '2px 6px',
                  borderRadius: 4
                }}
              >
                <Check size={13} /> Đã chọn
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div style={{ borderLeft: '1px dashed #cbd5e1', marginLeft: 10, paddingLeft: 4 }}>
            {node.children.map(child => renderTreeNode(child, fullPath, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="form-group" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label className="form-label" style={{ marginBottom: 0 }}>
          {label}
        </label>
        <button
          type="button"
          onClick={handleToggleOpen}
          className="btn btn-secondary btn-sm"
          style={{
            fontSize: '0.8rem',
            padding: '4px 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: isOpen ? '#eff6ff' : '#ffffff',
            borderColor: isOpen ? '#3b82f6' : '#cbd5e1',
            color: isOpen ? '#1d4ed8' : '#334155'
          }}
        >
          <FolderTree size={14} color={isOpen ? '#2563eb' : '#64748b'} />
          {isOpen ? 'Ẩn Cây Vị Trí' : '📂 Xem Cây Vị Trí Địa Lý Thực Tế'}
        </button>
      </div>

      {/* Input hiển thị & cho phép nhập/chỉnh sửa */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          style={{
            borderColor: value ? '#3b82f6' : undefined,
            background: value ? '#f8fafc' : '#ffffff',
            paddingRight: value ? 36 : 12,
            fontWeight: value ? 600 : 400
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Xóa vị trí đã chọn"
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

      {/* Hiển thị Breadcrumb vị trí đã chọn */}
      {value && (
        <div
          style={{
            marginTop: 6,
            padding: '6px 12px',
            borderRadius: '6px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#166534'
          }}
        >
          <MapPin size={14} color="#059669" />
          <span>Vị trí đã chọn: <strong>{value}</strong></span>
        </div>
      )}

      {/* Panel Duyệt Cây Vị Trí Địa Lý Thực Tế */}
      {isOpen && (
        <div
          style={{
            marginTop: 8,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            padding: '12px',
            maxHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          {/* Header công cụ cây */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 30, fontSize: '0.825rem', height: 32 }}
                placeholder="Tìm nhanh cơ sở, khu, tầng, phòng học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={expandAll}
              style={{ fontSize: '0.75rem', height: 32, padding: '0 8px', whiteSpace: 'nowrap' }}
            >
              Mở rộng
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={collapseAll}
              style={{ fontSize: '0.75rem', height: 32, padding: '0 8px', whiteSpace: 'nowrap' }}
            >
              Thu gọn
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
            <span>💡 Bấm vào phòng/tầng bất kỳ để chọn vị trí tự động:</span>
            <span>Tổng số: {effectiveTree.length} cơ sở</span>
          </div>

          {/* Vùng cuộn danh sách cây */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: '230px',
              paddingRight: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {effectiveTree.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem' }}>
                Chưa có dữ liệu vị trí nào trong hệ thống.
              </div>
            ) : (
              effectiveTree.map(campus => renderTreeNode(campus, '', 0))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
