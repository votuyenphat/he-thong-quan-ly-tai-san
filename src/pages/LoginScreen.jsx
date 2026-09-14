// src/pages/LoginScreen.jsx
import React, { useState } from 'react';
import { useAuth, SUPER_ADMIN_EMAIL } from '../context/AuthContext';
import { Building2, ShieldCheck, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import GoogleWorkspaceLoginModal from '../components/common/GoogleWorkspaceLoginModal';

export default function LoginScreen() {
  const { loginWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await loginWithPassword(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setShowGoogleModal(true);
  };

  const handleQuickFillSuperAdmin = () => {
    setEmail(SUPER_ADMIN_EMAIL);
    setPassword('Admin@123456');
    setErrorMsg('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        width: '100%',
        maxWidth: '480px',
        padding: '36px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top subtle decorative bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          background: 'linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)'
        }} />

        {/* Brand Icon */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 18px rgba(37, 99, 235, 0.35)'
        }}>
          <Building2 size={32} />
        </div>

        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
          PHẦN MỀM QUẢN LÝ TÀI SẢN
        </h1>
        <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '6px', marginBottom: '22px' }}>
          Hệ thống định danh số, quản lý vòng đời & kiểm kê tài sản phòng ban
        </p>

        {/* Error message */}
        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.825rem',
            marginBottom: '18px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* 1. Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '11px 16px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#334155',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 150ms',
            marginBottom: '18px'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#2563eb';
            e.currentTarget.style.background = '#f8fafc';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.background = '#ffffff';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Đăng nhập với Google Workspace</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '16px 0 20px',
          color: '#94a3b8',
          fontSize: '0.78rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span>HOẶC ĐĂNG NHẬP MẬT KHẨU</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* 2. Password Login Form */}
        <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
              Địa chỉ Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="Email công tác (ví dụ: cntt@truong.edu.vn)..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: 36 }}
                required
                autoFocus
              />
              <Mail size={16} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: 36, paddingRight: 36 }}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              padding: '11px',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)'
            }}
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* 3. Super Admin Quick Access Tip */}
        <div style={{
          marginTop: '22px',
          padding: '12px 14px',
          background: '#f0fdf4',
          border: '1px dashed #86efac',
          borderRadius: '12px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
              👑 Tài khoản Super Admin Tối Cao:
            </div>
            <button
              type="button"
              onClick={handleQuickFillSuperAdmin}
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                color: '#15803d',
                background: '#dcfce7',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 8px',
                cursor: 'pointer'
              }}
            >
              Điền nhanh
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: 4 }}>
            Email: <strong>{SUPER_ADMIN_EMAIL}</strong> • Mật khẩu mặc định: <strong>Admin@123456</strong>
          </div>
        </div>
      </div>

      {/* Modal Đăng nhập Google Workspace */}
      <GoogleWorkspaceLoginModal 
        isOpen={showGoogleModal} 
        onClose={() => setShowGoogleModal(false)} 
      />
    </div>
  );
}
