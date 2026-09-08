// src/pages/LoginScreen.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PRESET_USERS } from '../data/mockData';
import { Building2, ShieldCheck, UserCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginScreen() {
  const { loginWithGoogle, switchRole } = useAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    loginWithGoogle(
      customEmail.trim(),
      customName.trim() || customEmail.split('@')[0],
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        width: '100%',
        maxWidth: '540px',
        padding: '36px 32px',
        textAlign: 'center'
      }}>
        {/* Brand Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 6px 14px rgba(37, 99, 235, 0.35)'
        }}>
          <Building2 size={30} />
        </div>

        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
          PHẦN MỀM QUẢN LÝ TÀI SẢN
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', marginBottom: '24px' }}>
          Hệ thống cơ sở dữ liệu định danh số, quản lý vòng đời và in tem mã QR tài sản
        </p>

        {/* 1. Google One-Click Sign In Buttons */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '18px 16px',
          marginBottom: '22px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Đăng nhập nhanh Google theo 4 vai trò phân quyền:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PRESET_USERS.map((u) => (
              <button
                key={u.role}
                type="button"
                onClick={() => switchRole(u.role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.background = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={u.avatar}
                    alt={u.name}
                    style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                      {u.role}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                      {u.name} ({u.email})
                    </div>
                  </div>
                </div>

                <ArrowRight size={16} color="#64748b" />
              </button>
            ))}
          </div>
        </div>

        {/* 2. Custom Google Workspace Account */}
        <form onSubmit={handleCustomGoogleSubmit} style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '10px' }}>
            Hoặc nhập tài khoản Google cá nhân của bạn:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="email"
              className="form-input"
              placeholder="Email Google (@truong.edu.vn hoặc @gmail.com)..."
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Họ và tên của bạn..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '11px', display: 'flex', gap: 8, justifyContent: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#ffffff" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
              </svg>
              <span>Đăng nhập với Google Workspace</span>
            </button>
          </div>
        </form>

        <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '20px' }}>
          Bảo mật thông tin • Không cần mật khẩu riêng • Tự động đồng bộ hồ sơ
        </div>
      </div>
    </div>
  );
}
