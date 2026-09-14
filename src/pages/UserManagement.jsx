import React, { useState } from 'react';
import { useAuth, SUPER_ADMIN_EMAIL, DEFAULT_PERMISSIONS, SUPER_ADMIN_PERMISSIONS } from '../context/AuthContext';
import { useAssets } from '../context/AssetContext';
import { 
  Users, UserPlus, Shield, ShieldCheck, Key, Lock, Unlock, 
  Trash2, Edit, Check, X, AlertCircle, Building2, Eye, Mail, Phone, CheckSquare,
  RefreshCw
} from 'lucide-react';

export default function UserManagement() {
  const { 
    currentUser, 
    isSuperAdmin, 
    userAccounts, 
    createUserAccount, 
    updateUserPermissions, 
    resetUserPassword, 
    toggleUserStatus, 
    deleteUserAccount,
    syncUserAccountsNow,
    isSyncingUsers
  } = useAuth();
  const { departments } = useAssets();

  // State Modal Thêm mới / Sửa quyền
  const [modalMode, setModalMode] = useState(null); // 'CREATE' | 'EDIT_PERMS' | 'RESET_PASS'
  const [targetUser, setTargetUser] = useState(null);

  // Form State Tạo mới
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    departmentId: '',
    departmentName: '',
    initialPassword: 'Truong@2026',
    permissions: { ...DEFAULT_PERMISSIONS }
  });

  // State đặt lại mật khẩu
  const [newPasswordInput, setNewPasswordInput] = useState('Truong@2026');

  // Loading & Alert state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Nếu không phải Super Admin, chặn truy cập
  if (!isSuperAdmin) {
    return (
      <div className="page-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: '#fee2e2',
          color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Shield size={32} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Khu Vực Hạn Chế Truy Cập</h2>
        <p style={{ color: '#64748b', maxWidth: 460, margin: '8px auto 0' }}>
          Trang này chỉ dành riêng cho <strong>Super Admin ({SUPER_ADMIN_EMAIL})</strong> để quản lý tài khoản và cấp quyền cho các phòng ban.
        </p>
      </div>
    );
  }

  // Mở modal tạo tài khoản
  const handleOpenCreate = () => {
    const firstDept = departments[0];
    setFormData({
      email: '',
      name: '',
      phone: '',
      departmentId: firstDept?.id || '',
      departmentName: firstDept?.name || '',
      initialPassword: 'Truong@2026',
      permissions: { ...DEFAULT_PERMISSIONS }
    });
    setErrorMsg('');
    setSuccessMsg('');
    setModalMode('CREATE');
  };

  // Mở modal sửa quyền
  const handleOpenEditPerms = (user) => {
    setTargetUser(user);
    setFormData({
      ...formData,
      permissions: { ...(user.permissions || DEFAULT_PERMISSIONS) }
    });
    setErrorMsg('');
    setSuccessMsg('');
    setModalMode('EDIT_PERMS');
  };

  // Mở modal reset mật khẩu
  const handleOpenResetPass = (user) => {
    setTargetUser(user);
    setNewPasswordInput('Truong@2026');
    setErrorMsg('');
    setSuccessMsg('');
    setModalMode('RESET_PASS');
  };

  // Toggle một quyền trong form
  const togglePermission = (permKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey]
      }
    }));
  };

  // Lưu tạo mới tài khoản
  const handleSaveCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await createUserAccount(formData);
      setSuccessMsg(`Tạo tài khoản thành công cho phòng ban: ${formData.departmentName}`);
      setModalMode(null);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi tạo tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  // Lưu sửa quyền
  const handleSavePerms = async () => {
    if (!targetUser) return;
    setErrorMsg('');
    setLoading(true);

    try {
      await updateUserPermissions(targetUser.id, formData.permissions);
      setSuccessMsg(`Đã cập nhật quyền hạn cho tài khoản: ${targetUser.email}`);
      setModalMode(null);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi cập nhật quyền.');
    } finally {
      setLoading(false);
    }
  };

  // Lưu đặt lại mật khẩu
  const handleSaveResetPass = async (e) => {
    e.preventDefault();
    if (!targetUser) return;
    setErrorMsg('');
    setLoading(true);

    try {
      await resetUserPassword(targetUser.id, newPasswordInput);
      setSuccessMsg(`Đã đặt lại mật khẩu cho ${targetUser.email}. Người dùng sẽ bắt buộc đổi mật khẩu khi đăng nhập.`);
      setModalMode(null);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  // Khóa / Mở khóa
  const handleToggleLock = async (user) => {
    try {
      await toggleUserStatus(user.id);
      setSuccessMsg(`Đã thay đổi trạng thái cho tài khoản: ${user.email}`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Xóa tài khoản
  const handleDelete = async (user) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản: ${user.email} (${user.departmentName})?`)) {
      try {
        await deleteUserAccount(user.id);
        setSuccessMsg(`Đã xóa tài khoản: ${user.email}`);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Users size={26} color="#1e3a8a" />
            Quản Lý Tài Khoản & Phân Quyền Phòng Ban
          </h2>
          <p className="page-subtitle">
            Cấp phát tài khoản cho từng phòng ban, phân quyền ma trận chi tiết và quản lý truy cập hệ thống
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={async () => {
              try {
                await syncUserAccountsNow();
                setSuccessMsg('Đã kết nối và đồng bộ tài khoản & phân quyền mới nhất từ Supabase Cloud!');
              } catch (err) {
                setErrorMsg('Không thể đồng bộ: ' + err.message);
              }
            }}
            disabled={isSyncingUsers}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            title="Đồng bộ ngay dữ liệu tài khoản từ Supabase Cloud"
          >
            <RefreshCw size={15} className={isSyncingUsers ? 'spinning' : ''} />
            {isSyncingUsers ? 'Đang đồng bộ...' : 'Đồng bộ đám mây'}
          </button>

          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <UserPlus size={16} />
            Cấp tài khoản Quản lý phòng mới
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d',
          padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Users Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
              DANH SÁCH TÀI KHOẢN ({userAccounts.length} người dùng)
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px',
              background: '#ecfdf5', color: '#059669', fontWeight: 600, border: '1px solid #a7f3d0'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Supabase Realtime
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            👑 Super Admin có toàn quyền duyệt Điều chuyển / Thanh lý / Thu hồi
          </div>
        </div>

        <div className="table-responsive">
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Người dùng & Email</th>
                <th style={{ width: '20%' }}>Phòng ban phụ trách</th>
                <th style={{ width: '15%' }}>Vai trò</th>
                <th style={{ width: '25%' }}>Quyền hạn được cấp</th>
                <th style={{ width: '10%' }}>Trạng thái</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {userAccounts.map(user => {
                const isSA = user.isSuperAdmin || user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

                return (
                  <tr key={user.id || user.email} style={{ background: isSA ? '#f0fdf4' : 'transparent' }}>
                    {/* User info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: isSA ? '#16a34a' : '#2563eb',
                          color: '#fff', fontWeight: 700, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem',
                          flexShrink: 0
                        }}>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={12} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={15} color={isSA ? '#16a34a' : '#2563eb'} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isSA ? '#15803d' : '#1e3a8a' }}>
                          {user.departmentName || 'Chưa gán'}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      {isSA ? (
                        <span style={{
                          background: '#dcfce7', color: '#15803d', fontWeight: 700,
                          fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20
                        }}>
                          👑 Super Admin
                        </span>
                      ) : (
                        <span style={{
                          background: '#eff6ff', color: '#1e40af', fontWeight: 700,
                          fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20
                        }}>
                          🏛️ Quản lý phòng
                        </span>
                      )}
                    </td>

                    {/* Permissions summary */}
                    <td>
                      {isSA ? (
                        <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>
                          Toàn quyền hệ thống & Duyệt biến động
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {user.permissions?.asset_create && (
                            <span style={{ fontSize: '0.68rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4 }}>
                              Thêm TS
                            </span>
                          )}
                          {user.permissions?.asset_edit && (
                            <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 4 }}>
                              Sửa TS
                            </span>
                          )}
                          {user.permissions?.asset_delete && (
                            <span style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: 4 }}>
                              Xóa TS
                            </span>
                          )}
                          {user.permissions?.transfer_propose && (
                            <span style={{ fontSize: '0.68rem', background: '#f3e8ff', color: '#7e22ce', padding: '2px 6px', borderRadius: 4 }}>
                              Đề xuất chuyển
                            </span>
                          )}
                          {user.permissions?.liquidation_propose && (
                            <span style={{ fontSize: '0.68rem', background: '#ffedd5', color: '#c2410c', padding: '2px 6px', borderRadius: 4 }}>
                              Đề xuất thanh lý
                            </span>
                          )}
                          {user.permissions?.inventory_scan && (
                            <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 4 }}>
                              Quét kiểm kê
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      {user.status === 'locked' ? (
                        <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                          Đã khóa
                        </span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                          Hoạt động
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      {!isSA && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button
                            title="Tùy biến quyền chi tiết"
                            onClick={() => handleOpenEditPerms(user)}
                            style={{ background: '#eff6ff', border: 'none', borderRadius: 6, padding: '5px 7px', color: '#2563eb', cursor: 'pointer' }}
                          >
                            <CheckSquare size={14} />
                          </button>
                          <button
                            title="Đặt lại mật khẩu"
                            onClick={() => handleOpenResetPass(user)}
                            style={{ background: '#fef3c7', border: 'none', borderRadius: 6, padding: '5px 7px', color: '#d97706', cursor: 'pointer' }}
                          >
                            <Key size={14} />
                          </button>
                          <button
                            title={user.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            onClick={() => handleToggleLock(user)}
                            style={{ background: user.status === 'locked' ? '#fee2e2' : '#f1f5f9', border: 'none', borderRadius: 6, padding: '5px 7px', color: user.status === 'locked' ? '#dc2626' : '#64748b', cursor: 'pointer' }}
                          >
                            {user.status === 'locked' ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>
                          <button
                            title="Xóa tài khoản"
                            onClick={() => handleDelete(user)}
                            style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '5px 7px', color: '#dc2626', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TẠO MỚI TÀI KHOẢN QUẢN LÝ PHÒNG */}
      {modalMode === 'CREATE' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 20, maxWidth: 560, width: '100%',
            padding: '28px 24px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={20} color="#1e3a8a" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Cấp Tài Khoản Quản Lý Phòng Ban
                </h3>
              </div>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 10, borderRadius: 8, fontSize: '0.8rem', marginBottom: 14 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Phòng ban phụ trách */}
              <div>
                <label className="form-label">Phòng Ban Phụ Trách (*)</label>
                <select
                  className="form-select"
                  value={formData.departmentId}
                  onChange={e => {
                    const dept = departments.find(d => d.id === e.target.value);
                    setFormData({
                      ...formData,
                      departmentId: e.target.value,
                      departmentName: dept ? dept.name : ''
                    });
                  }}
                  required
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              {/* Email đăng nhập */}
              <div>
                <label className="form-label">Email Đăng Nhập (*)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="VD: cntt@truong.edu.vn..."
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Họ tên người quản lý */}
              <div>
                <label className="form-label">Họ và Tên Người Quản Lý</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Thầy Nguyễn Văn A (Thư ký khoa)..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Mật khẩu khởi tạo */}
              <div>
                <label className="form-label">Mật Khẩu Khởi Tạo (*)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.initialPassword}
                  onChange={e => setFormData({ ...formData, initialPassword: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3, display: 'block' }}>
                  Người dùng sẽ <strong>bắt buộc đổi mật khẩu mới</strong> ngay khi đăng nhập lần đầu.
                </span>
              </div>

              {/* Ma trận phân quyền */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <label className="form-label" style={{ marginBottom: 8 }}>
                  Ma Trận Phân Quyền Chi Tiết Cho Phòng Ban:
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.permissions.asset_create} onChange={() => togglePermission('asset_create')} />
                    <span>Thêm tài sản mới / Nhập Excel</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.permissions.asset_edit} onChange={() => togglePermission('asset_edit')} />
                    <span>Chỉnh sửa thông tin tài sản</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.permissions.asset_delete} onChange={() => togglePermission('asset_delete')} />
                    <span style={{ color: '#dc2626' }}>Xóa tài sản khỏi danh mục</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.permissions.asset_print_qr} onChange={() => togglePermission('asset_print_qr')} />
                    <span>In tem nhãn mã QR</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.permissions.asset_export} onChange={() => togglePermission('asset_export')} />
                    <span>Xuất báo cáo Excel</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.permissions.transfer_propose} onChange={() => togglePermission('transfer_propose')} />
                    <span>Đề xuất Điều chuyển tài sản</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.permissions.recall_propose} onChange={() => togglePermission('recall_propose')} />
                    <span>Đề xuất Thu hồi tài sản</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.permissions.liquidation_propose} onChange={() => togglePermission('liquidation_propose')} />
                    <span>Đề xuất Thanh lý tài sản</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.permissions.inventory_scan} onChange={() => togglePermission('inventory_scan')} />
                    <span>Quét mã QR kiểm kê phòng</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Lưu & Cấp Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TÙY BIẾN MA TRẬN QUYỀN */}
      {modalMode === 'EDIT_PERMS' && targetUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 20, maxWidth: 520, width: '100%',
            padding: '28px 24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquare size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Tùy Biến Quyền Cho: {targetUser.departmentName}
                </h3>
              </div>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 14 }}>
              Tài khoản: <strong>{targetUser.email}</strong> • Tùy chỉnh bật/tắt các tính năng được phép thao tác:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.825rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.permissions.asset_create} onChange={() => togglePermission('asset_create')} />
                <span>Thêm tài sản mới / Nhập từ Excel vào phòng</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.825rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.permissions.asset_edit} onChange={() => togglePermission('asset_edit')} />
                <span>Chỉnh sửa thông tin tài sản</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.825rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.permissions.asset_delete} onChange={() => togglePermission('asset_delete')} />
                <span style={{ color: '#dc2626', fontWeight: 600 }}>Xóa tài sản khỏi danh mục phòng</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.825rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.permissions.asset_print_qr} onChange={() => togglePermission('asset_print_qr')} />
                <span>In tem nhãn mã QR</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.825rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.permissions.asset_export} onChange={() => togglePermission('asset_export')} />
                <span>Xuất danh sách ra file Excel</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.825rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.permissions.transfer_propose} onChange={() => togglePermission('transfer_propose')} />
                <span>Tạo phiếu đề xuất Điều chuyển tài sản</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.825rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.permissions.recall_propose} onChange={() => togglePermission('recall_propose')} />
                <span>Gửi đề xuất Thu hồi tài sản</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.825rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.permissions.liquidation_propose} onChange={() => togglePermission('liquidation_propose')} />
                <span>Gửi đề xuất Thanh lý tài sản</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.825rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.permissions.inventory_scan} onChange={() => togglePermission('inventory_scan')} />
                <span>Quét mã QR kiểm kê phòng ban</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalMode(null)}>
                Hủy
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSavePerms} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ĐẶT LẠI MẬT KHẨU */}
      {modalMode === 'RESET_PASS' && targetUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 20, maxWidth: 440, width: '100%',
            padding: '28px 24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={20} color="#d97706" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Đặt Lại Mật Khẩu
                </h3>
              </div>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 14 }}>
              Tài khoản: <strong>{targetUser.email}</strong> ({targetUser.departmentName})
            </p>

            <form onSubmit={handleSaveResetPass} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Mật khẩu mới khởi tạo (*)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  required
                  autoFocus
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                  Người dùng này sẽ bắt buộc phải đổi lại mật khẩu cá nhân ở lần đăng nhập tiếp theo.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Xác Nhận Đặt Lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
