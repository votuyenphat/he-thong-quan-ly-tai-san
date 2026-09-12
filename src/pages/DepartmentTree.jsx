// src/pages/DepartmentTree.jsx
// Sơ Đồ Tổ Chức & Cây Phòng / Ban với CRUD
import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/formatters';
import { ConditionBadge, StatusBadge } from '../components/common/Badge';
import { cleanText } from '../utils/normalize';
import {
  FolderTree, Building2, Users, MapPin, Phone, Boxes,
  ChevronRight, Shield, UserCheck, Plus, Edit2, Trash2,
  Save, X, AlertTriangle
} from 'lucide-react';

const EMPTY_DEPT = {
  code: '',
  name: '',
  manager: '',
  assetManager: '',
  location: '',
  phone: '',
  description: ''
};

export default function DepartmentTree() {
  const { departments, assets, addDepartment, updateDepartment, deleteDepartment, deleteAssetsBatch } = useAssets();
  const { permissions } = useAuth();

  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || '');
  const activeDept = departments.find(d => d.id === selectedDeptId) || departments[0];
  const deptAssets = assets.filter(a =>
    (activeDept?.id && cleanText(a.departmentId).toLowerCase() === cleanText(activeDept.id).toLowerCase()) ||
    (activeDept?.name && cleanText(a.departmentName).toLowerCase() === cleanText(activeDept.name).toLowerCase())
  );
  const deptTotalValue = deptAssets.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);

  // State: Add / Edit
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editDept, setEditDept] = useState(null); // dept object to edit
  const [formData, setFormData] = useState({ ...EMPTY_DEPT });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // dept id
  const [isDeleteDeptAssetsOpen, setIsDeleteDeptAssetsOpen] = useState(false);

  const handleDeleteDeptAssetsConfirm = () => {
    if (!activeDept || deptAssets.length === 0) return;
    const assetIds = deptAssets.map(a => a.id);
    deleteAssetsBatch(assetIds, `Xóa toàn bộ ${assetIds.length} tài sản của phòng/ban: ${activeDept.name} (${activeDept.code})`);
    setIsDeleteDeptAssetsOpen(false);
  };

  const handleOpenAdd = () => {
    setFormData({ ...EMPTY_DEPT });
    setEditDept(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (dept, e) => {
    e.stopPropagation();
    setFormData({ ...dept });
    setEditDept(dept);
    setIsAddOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.code.trim()) return;
    if (editDept) {
      updateDepartment(editDept.id, formData);
    } else {
      addDepartment(formData);
    }
    setIsAddOpen(false);
    setEditDept(null);
    setFormData({ ...EMPTY_DEPT });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteDepartment(deleteConfirm);
      setDeleteConfirm(null);
      if (selectedDeptId === deleteConfirm) setSelectedDeptId(departments[0]?.id || '');
    }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <FolderTree size={26} color="#1e3a8a" />
            Sơ Đồ Tổ Chức & Cây Phòng / Ban
          </h2>
          <p className="page-subtitle">
            Cây phân cấp cơ cấu tổ chức đơn vị, thông tin lãnh đạo và danh mục tài sản trực thuộc
          </p>
        </div>
        {permissions?.canManageAssets && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            Thêm phòng/ban mới
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Left: List of departments */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            background: '#eff6ff', borderRadius: '8px', color: '#1e3a8a',
            fontWeight: 800, fontSize: '0.9rem', marginBottom: '14px'
          }}>
            <Building2 size={18} />
            <span>ĐƠN VỊ ({departments.length} phòng/ban)</span>
          </div>

          {departments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Chưa có phòng ban nào.<br />
              Nhấn <strong>Thêm phòng/ban mới</strong> để bắt đầu.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {departments.map((dept) => {
                const isSelected = dept.id === activeDept?.id;
                const count = assets.filter(a => a.departmentId === dept.id || a.departmentName === dept.name).length;

                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                      background: isSelected ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : '#f8fafc',
                      color: isSelected ? '#ffffff' : '#0f172a',
                      border: isSelected ? '1px solid #1e3a8a' : '1px solid #e2e8f0',
                      transition: 'all 150ms'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ChevronRight size={14} color={isSelected ? '#ffffff' : '#94a3b8'} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{dept.name}</div>
                        <div style={{ fontSize: '0.725rem', color: isSelected ? '#cbd5e1' : '#64748b' }}>
                          Mã: {dept.code}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: '0.725rem', fontWeight: 'bold', padding: '2px 8px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                        color: isSelected ? '#ffffff' : '#475569'
                      }}>
                        {count} TS
                      </span>
                      {permissions?.canManageAssets && (
                        <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                          <button
                            title="Sửa"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: isSelected ? '#bfdbfe' : '#d97706' }}
                            onClick={(e) => handleOpenEdit(dept, e)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            title="Xóa"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: isSelected ? '#fca5a5' : '#dc2626' }}
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(dept.id); }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Department Details & Asset List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {activeDept ? (
            <>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <span style={{
                      background: '#eff6ff', color: '#1e40af', fontWeight: 700,
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem'
                    }}>
                      MÃ ĐƠN VỊ: {activeDept.code}
                    </span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: 6 }}>
                      {activeDept.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                      {activeDept.description}
                    </p>
                  </div>
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '10px', padding: '10px 16px', textAlign: 'right'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Tổng giá trị tài sản</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>
                      {formatVND(deptTotalValue)}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 14, marginTop: 18, paddingTop: 18, borderTop: '1px solid #e2e8f0'
                }}>
                  {activeDept.manager && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <UserCheck size={20} color="#2563eb" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Trưởng phòng / Ban</div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{activeDept.manager}</div>
                      </div>
                    </div>
                  )}
                  {activeDept.assetManager && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Shield size={20} color="#059669" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Người quản lý tài sản</div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{activeDept.assetManager}</div>
                      </div>
                    </div>
                  )}
                  {activeDept.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MapPin size={20} color="#ea580c" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Địa điểm làm việc</div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{activeDept.location}</div>
                      </div>
                    </div>
                  )}
                  {activeDept.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Phone size={20} color="#7c3aed" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Điện thoại liên hệ</div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{activeDept.phone}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assets Table */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <h4 className="card-title" style={{ margin: 0 }}>
                    <span>Danh Sách Tài Sản Trực Thuộc ({deptAssets.length} tài sản)</span>
                  </h4>
                  {permissions?.canManageAssets && deptAssets.length > 0 && (
                    <button
                      type="button"
                      className="btn"
                      style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '6px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        borderRadius: 6,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fee2e2';
                        e.currentTarget.style.borderColor = '#f87171';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fef2f2';
                        e.currentTarget.style.borderColor = '#fecaca';
                      }}
                      onClick={() => setIsDeleteDeptAssetsOpen(true)}
                      title={`Xóa toàn bộ ${deptAssets.length} tài sản đang phân bổ cho phòng ${activeDept.name}`}
                    >
                      <Trash2 size={15} />
                      Xóa toàn bộ tài sản phòng này ({deptAssets.length})
                    </button>
                  )}
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mã tài sản</th>
                        <th>Tên tài sản</th>
                        <th>Vị trí chi tiết</th>
                        <th>Người sử dụng</th>
                        <th style={{ textAlign: 'right' }}>Nguyên giá</th>
                        <th style={{ textAlign: 'center' }}>Tình trạng</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptAssets.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                            Chưa có tài sản nào được phân bổ cho phòng ban này.
                          </td>
                        </tr>
                      ) : (
                        deptAssets.map((asset) => (
                          <tr key={asset.id}>
                            <td>
                              <span style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                                {asset.code}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{asset.name}</div>
                              <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{asset.brand ? `${asset.brand} • ` : ''}{asset.type}</div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#475569' }}>{asset.locationPath}</td>
                            <td><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{asset.currentUser}</div></td>
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
              <Building2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>Chọn một phòng ban để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Department Modal */}
      {isAddOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '580px', width: '95%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0 }}>
                {editDept ? 'Chỉnh sửa phòng/ban' : 'Thêm phòng/ban mới'}
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsAddOpen(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="form-label">Mã đơn vị *</label>
                <input className="form-input" value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} placeholder="VD: P-HC, K-CNTT" required />
              </div>
              <div>
                <label className="form-label">Tên phòng/ban *</label>
                <input className="form-input" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Trưởng phòng / Lãnh đạo</label>
                <input className="form-input" value={formData.manager} onChange={e => setFormData(p => ({ ...p, manager: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Người quản lý tài sản</label>
                <input className="form-input" value={formData.assetManager} onChange={e => setFormData(p => ({ ...p, assetManager: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Địa điểm làm việc</label>
                <input className="form-input" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Điện thoại</label>
                <input className="form-input" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Mô tả chức năng</label>
                <textarea className="form-input" rows={2} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={15} />
                {editDept ? 'Lưu thay đổi' : 'Thêm phòng/ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation for Department */}
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
                <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>Xóa phòng/ban?</h3>
                <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '2px 0 0' }}>
                  Tài sản của phòng ban này sẽ không bị xóa nhưng sẽ mất liên kết phòng ban.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Hủy</button>
              <button className="btn" style={{ background: '#dc2626', color: '#fff' }} onClick={handleDeleteConfirm}>
                <Trash2 size={14} /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Assets of Department Modal */}
      {isDeleteDeptAssetsOpen && activeDept && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '24px 28px', maxWidth: '520px', width: '92%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: '#fef2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <AlertTriangle size={24} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: '#991b1b' }}>
                  Xóa toàn bộ tài sản: {activeDept.name}?
                </h3>
                <p style={{ color: '#475569', fontSize: '0.85rem', margin: '6px 0 0', lineHeight: 1.5 }}>
                  Bạn có chắc chắn muốn xóa vĩnh viễn tất cả <strong>{deptAssets.length}</strong> tài sản thuộc phòng ban <strong>{activeDept.name}</strong>?
                </p>
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginTop: 10,
                  fontSize: '0.8rem',
                  color: '#b91c1c'
                }}>
                  ⚠️ <strong>Cảnh báo:</strong> Tổng giá trị tài sản sẽ bị xóa là <strong>{formatVND(deptTotalValue)}</strong>. Thao tác này sẽ xóa hoàn toàn các tài sản này khỏi hệ thống!
                </div>
              </div>
            </div>

            {/* Danh sách rút gọn tài sản sắp bị xóa */}
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px 12px',
              maxHeight: 180,
              overflowY: 'auto',
              background: '#f8fafc',
              fontSize: '0.8rem',
              marginBottom: 18
            }}>
              <div style={{ fontWeight: 700, color: '#475569', marginBottom: 6, fontSize: '0.75rem' }}>
                DANH SÁCH TÀI SẢN SẼ BỊ XÓA ({deptAssets.length}):
              </div>
              {deptAssets.map((a, idx) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: idx < deptAssets.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  <span><strong style={{ color: '#1e3a8a' }}>[{a.code}]</strong> {a.name}</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>{formatVND(a.cost)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setIsDeleteDeptAssetsOpen(false)}>
                Hủy bỏ
              </button>
              <button
                className="btn"
                style={{ background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={handleDeleteDeptAssetsConfirm}
              >
                <Trash2 size={16} />
                Xác nhận xóa {deptAssets.length} tài sản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
