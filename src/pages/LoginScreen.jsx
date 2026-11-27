// src/pages/LoginScreen.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { testSupabaseConnection } from '../services/supabaseClient';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import schoolLogo from '../assets/logo.png';
import loginIllustration from '../assets/login-illustration.jpg';

export default function LoginScreen() {
  const { loginWithPassword, isSyncingUsers } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [connectionState, setConnectionState] = useState('checking'); // 'checking' | 'cloud' | 'local'

  useEffect(() => {
    let isMounted = true;

    const verifyConnection = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (isMounted) setConnectionState('local');
        return;
      }

      if (isMounted) setConnectionState('checking');
      try {
        const res = await testSupabaseConnection();
        if (!isMounted) return;
        if (res?.success || res?.needsMigration) {
          setConnectionState('cloud');
        } else {
          setConnectionState('local');
        }
      } catch {
        if (isMounted) setConnectionState('local');
      }
    };

    verifyConnection();

    const handleOnline = () => verifyConnection();
    const handleOffline = () => {
      if (isMounted) setConnectionState('local');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const effectiveStatus = isSyncingUsers && connectionState === 'checking' ? 'checking' : connectionState;

  const statusConfig = {
    cloud: {
      cls: 'cloud',
      label: 'Đồng bộ Đám mây sẵn sàng'
    },
    local: {
      cls: 'local',
      label: 'Chế độ Nội bộ (Hoạt động ngoại tuyến)'
    },
    checking: {
      cls: 'checking',
      label: 'Đang kiểm tra kết nối hệ thống...'
    }
  }[effectiveStatus];

  return (
    <div className="login-split-wrapper">
      {/* Cột trái (45%): Form đăng nhập nền trắng tinh gọn */}
      <section className="login-form-panel">
        <div className="login-form-container">
          {/* Logo chính thức của Trường Cao Đẳng Bách Khoa Nam Sài Gòn */}
          <div className="login-brand-logo-wrap">
            <img
              src={schoolLogo}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/logo.png';
              }}
              alt="Logo Trường Cao Đẳng Bách Khoa Nam Sài Gòn"
              className="login-brand-logo"
            />
          </div>

          <h1 className="login-heading">HỆ THỐNG QUẢN LÝ TÀI SẢN</h1>
          <p className="login-subheading">Trường Cao Đẳng Bách Khoa Nam Sài Gòn</p>

          {/* Thông báo lỗi nếu nhập sai */}
          {errorMsg && (
            <div
              style={{
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
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Form đăng nhập Email & Mật khẩu */}
          <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="login-field-group">
              <label htmlFor="login-email" className="login-field-label">
                Địa chỉ Email
              </label>
              <div className="login-input-wrap">
                <Mail size={17} className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder="Email công tác (ví dụ: cntt@truong.edu.vn)..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="login-field-group">
              <label htmlFor="login-password" className="login-field-label">
                Mật khẩu
              </label>
              <div className="login-input-wrap">
                <Lock size={17} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  style={{ paddingRight: 42 }}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
              {!loading && <ArrowRight size={17} className="login-submit-arrow" />}
            </button>
          </form>

          {/* Chân trang: Bảo mật & Chấm trạng thái kết nối Hệ thống */}
          <div className="login-footer">
            <div className="login-security-note">
              <ShieldCheck size={15} color="#10b981" strokeWidth={2.2} />
              <span>Hệ thống bảo mật xác thực phân quyền nội bộ</span>
            </div>

            <div className={`login-status-pill ${statusConfig.cls}`}>
              <span className={`login-status-dot ${statusConfig.cls}`} />
              <span>{statusConfig.label}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cột phải (55%): Minh họa 3D Quản lý Tài sản & Hiệu ứng ánh sáng động */}
      <section className="login-visual-panel" aria-hidden="true">
        <div className="login-ambient-glow" />
        <div className="login-light-beam" />
        <span className="login-particle p1" />
        <span className="login-particle p2" />
        <span className="login-particle p3" />
        <span className="login-particle p4" />
        <span className="login-particle p5" />
        <img
          src={loginIllustration}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/login-illustration.jpg';
          }}
          alt=""
          className="login-visual-img"
        />
        <div className="login-visual-vignette" />
      </section>
    </div>
  );
}
