// src/components/common/GoogleWorkspaceLoginModal.jsx
import React, { useState } from 'react';
import { useAuth, SUPER_ADMIN_EMAIL } from '../../context/AuthContext';
import { useAssets } from '../../context/AssetContext';
import { 
  X, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Building2, 
  AlertTriangle,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export default function GoogleWorkspaceLoginModal({ isOpen, onClose }) {
  const { loginWithGoogleOAuth, loginWithGoogleDemo, userAccounts } = useAuth();
  const { departments } = useAssets();

  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'oauth' | 'dept'
  const [selectedDeptEmail, setSelectedDeptEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [oauthStatus, setOauthStatus] = useState(null); // null | 'loading' | 'error' | 'success'
  const [oauthError, setOauthError] = useState('');

  if (!isOpen) return null;

  const callbackUrl = 'https://dszzfrpqblrlsjxrjzup.supabase.co/auth/v1/callback';
  const supabaseProvidersUrl = 'https://supabase.com/dashboard/project/dszzfrpqblrlsjxrjzup/auth/providers';

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickLoginSuperAdmin = () => {
    loginWithGoogleDemo(SUPER_ADMIN_EMAIL, 'Võ Tuyền Phát (Super Admin)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    onClose();
  };

  const handleDeptLogin = (e) => {
    e.preventDefault();
    if (!selectedDeptEmail) return;

    const matched = userAccounts.find(u => u.email?.toLowerCase() === selectedDeptEmail.toLowerCase());
    const name = matched?.name || `Quản lý ${matched?.departmentName || 'Phòng ban'}`;
    loginWithGoogleDemo(selectedDeptEmail, name);
    onClose();
  };

  const handleLiveOAuth = async () => {
    setOauthStatus('loading');
    setOauthError('');

    try {
      const res = await loginWithGoogleOAuth();
      // Nếu mở popup, người dùng sẽ đăng nhập trong cửa sổ Google
      setOauthStatus('success');
    } catch (err) {
      setOauthStatus('error');
      setOauthError(err.message || 'Chưa thể kết nối tới Google OAuth.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '560px',
        width: '100%',
        padding: '28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
              Đăng nhập Google Workspace
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.825rem', color: '#64748b' }}>
              Xác thực định danh qua tài khoản Google của trường / doanh nghiệp
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '20px',
          gap: 4
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'quick' ? '#ffffff' : 'transparent',
              color: activeTab === 'quick' ? '#1e3a8a' : '#64748b',
              boxShadow: activeTab === 'quick' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 150ms'
            }}
          >
            ⚡ Đăng nhập ngay
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'oauth' ? '#ffffff' : 'transparent',
              color: activeTab === 'oauth' ? '#1e3a8a' : '#64748b',
              boxShadow: activeTab === 'oauth' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 150ms'
            }}
          >
            🌐 Cổng OAuth Online
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dept')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'dept' ? '#ffffff' : 'transparent',
              color: activeTab === 'dept' ? '#1e3a8a' : '#64748b',
              boxShadow: activeTab === 'dept' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 150ms'
            }}
          >
            🏛️ Google Phòng Ban
          </button>
        </div>

        {/* TAB 1: Quick One-Click Google Login (Super Admin) */}
        {activeTab === 'quick' && (
          <div>
            <div style={{
              border: '1.5px solid #bfdbfe',
              borderRadius: '16px',
              padding: '20px',
              background: '#eff6ff',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '1.1rem'
                }}>
                  VP
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                    Võ Tuyền Phát (Super Admin)
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#1e40af', fontWeight: 500 }}>
                    {SUPER_ADMIN_EMAIL}
                  </div>
                </div>
                <div style={{
                  marginLeft: 'auto',
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px'
                }}>
                  ● Super Admin
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 14px', lineHeight: 1.5 }}>
                Đăng nhập tức thì với danh tính Google của Super Admin. Toàn quyền quản trị tài sản và phê duyệt biến động toàn trường.
              </p>

              <button
                type="button"
                onClick={handleQuickLoginSuperAdmin}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  justifyContent: 'center',
                  fontSize: '0.925rem',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                }}
              >
                <span>Đăng nhập ngay dưới tên {SUPER_ADMIN_EMAIL}</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '0.8rem',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <ShieldCheck size={18} color="#059669" />
              <span>Phiên đăng nhập được gắn nhãn Google Auth chuẩn và lưu trữ an toàn trong phiên làm việc.</span>
            </div>
          </div>
        )}

        {/* TAB 2: Live OAuth & Setup Instructions */}
        {activeTab === 'oauth' && (
          <div>
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '16px',
              fontSize: '0.825rem',
              color: '#92400e'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 4 }}>
                <AlertTriangle size={16} color="#d97706" />
                Tại sao chưa thể đăng nhập trực tiếp từ cửa sổ Google?
              </div>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Supabase yêu cầu bạn bật <strong>Google Provider</strong> trong bảng điều khiển và cung cấp <strong>Google Client ID + Secret</strong> từ Google Cloud Console. Khi chưa cấu hình, Supabase sẽ trả về thông báo <em>"Unsupported provider: provider is not enabled"</em>.
              </p>
            </div>

            {/* Live OAuth Button */}
            <button
              type="button"
              onClick={handleLiveOAuth}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '11px',
                justifyContent: 'center',
                gap: 8,
                marginBottom: '16px',
                borderColor: '#cbd5e1'
              }}
            >
              <ExternalLink size={16} />
              Thử mở cổng xác thực Google OAuth (Cửa sổ Popup)
            </button>

            {oauthStatus === 'error' && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                marginBottom: '16px'
              }}>
                {oauthError}
              </div>
            )}

            {/* Hướng dẫn cấu hình 3 bước */}
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              background: '#f8fafc'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: 12 }}>
                Hướng dẫn kích hoạt Google OAuth trên Supabase (3 Bước):
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.8rem', color: '#334155' }}>
                <div>
                  <strong>Bước 1:</strong> Tạo <em>OAuth Client ID (Web application)</em> tại <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Google Cloud Console</a>.
                </div>

                <div>
                  <strong>Bước 2:</strong> Dán đường dẫn <strong>Authorized redirect URI</strong> sau vào Google Cloud:
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    marginTop: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: '#0f172a'
                  }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{callbackUrl}</span>
                    <button
                      type="button"
                      onClick={handleCopyCallback}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: copied ? '#059669' : '#2563eb' }}
                      title="Sao chép URI"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <strong>Bước 3:</strong> Mở <a href={supabaseProvidersUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Supabase Auth Providers</a>, chọn <strong>Google</strong>, bật <strong>Enable</strong>, dán <em>Client ID</em> và <em>Client Secret</em> rồi bấm <strong>Save</strong>.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Department Google Login */}
        {activeTab === 'dept' && (
          <div>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: 0, marginBottom: 16 }}>
              Chọn tài khoản phòng ban để đăng nhập dưới danh nghĩa Google Workspace của phòng:
            </p>

            <form onSubmit={handleDeptLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Chọn tài khoản Quản lý phòng ban
                </label>
                <select
                  className="form-select"
                  value={selectedDeptEmail}
                  onChange={(e) => setSelectedDeptEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', fontSize: '0.875rem' }}
                  required
                >
                  <option value="">-- Chọn tài khoản phòng ban --</option>
                  {userAccounts
                    .filter(u => !u.isSuperAdmin)
                    .map(u => (
                      <option key={u.email} value={u.email}>
                        {u.name} ({u.departmentName}) - {u.email}
                      </option>
                    ))}
                </select>
              </div>

              {selectedDeptEmail && (
                <div style={{
                  padding: '12px 14px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  color: '#166534',
                  marginBottom: 16
                }}>
                  ● Sẽ đăng nhập vào phòng: <strong>{userAccounts.find(u => u.email === selectedDeptEmail)?.departmentName}</strong>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
                disabled={!selectedDeptEmail}
              >
                Đăng nhập với Google phòng ban này
              </button>
            </form>
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.825rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
