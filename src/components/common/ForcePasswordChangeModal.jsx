// src/components/common/ForcePasswordChangeModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, ShieldAlert, Check, Eye, EyeOff, Lock } from 'lucide-react';

export default function ForcePasswordChangeModal() {
  const { currentUser, changePassword, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Chỉ hiển thị nếu tài khoản đang bị cờ forcePasswordChange
  if (!currentUser?.forcePasswordChange) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPassword);
    } catch (err) {
      setError(err.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '460px',
        width: '100%',
        padding: '32px 28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #d97706, #f59e0b)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)'
        }}>
          <KeyRound size={28} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
          Đổi Mật Khẩu Khởi Tạo
        </h3>

        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
          Xin chào <strong>{currentUser.name}</strong> ({currentUser.email})!<br />
          Đây là lần đăng nhập đầu tiên. Vì lý do bảo mật, bạn <strong>bắt buộc phải thiết lập mật khẩu cá nhân mới</strong> để tiếp tục sử dụng hệ thống.
        </p>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.825rem',
            marginBottom: 16,
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
              Mật khẩu mới (*)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Tối thiểu 6 ký tự..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ paddingRight: 36 }}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
              Xác nhận mật khẩu mới (*)
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Nhập lại mật khẩu mới..."
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              padding: '11px',
              fontSize: '0.9rem',
              fontWeight: 700,
              marginTop: 6,
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)'
            }}
          >
            {loading ? 'Đang cập nhật mật khẩu...' : 'Xác Nhận & Vào Hệ Thống'}
          </button>

          <button
            type="button"
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginTop: 4
            }}
          >
            Đăng xuất tài khoản này
          </button>
        </form>
      </div>
    </div>
  );
}
