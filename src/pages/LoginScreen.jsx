// src/pages/LoginScreen.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginScreen() {
  const { loginWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

        {/* Form đăng nhập Email & Mật khẩu */}
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

        {/* Security & System Note */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: '0.75rem',
          color: '#94a3b8'
        }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Hệ thống bảo mật xác thực phân quyền nội bộ</span>
        </div>
      </div>
    </div>
  );
}
