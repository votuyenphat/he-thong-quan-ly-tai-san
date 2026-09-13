// src/components/common/SyncModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Upload,
  Download,
  FileJson,
  X,
  ArrowLeftRight,
  Info,
  Zap,
  Database,
  Key,
  Globe,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useAssets } from '../../context/AssetContext';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection
} from '../../services/supabaseClient';

const SUPABASE_SCHEMA_SQL = `-- SCRIPT KHỞI TẠO BẢNG VÀ REALTIME CHO SUPABASE (HTQL KIỂM KÊ TÀI SẢN)
CREATE TABLE IF NOT EXISTS public.app_database (
    id TEXT PRIMARY KEY DEFAULT 'main',
    data JSONB NOT NULL,
    last_updated BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.app_database REPLICA IDENTITY FULL;
ALTER TABLE public.app_database ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phep doc ghi public" ON public.app_database;
CREATE POLICY "Cho phep doc ghi public" ON public.app_database
    FOR ALL TO public USING (true) WITH CHECK (true);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'app_database'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_database;
    END IF;
END $$;

INSERT INTO public.app_database (id, data, last_updated)
VALUES (
    'main',
    '{"assets":[],"departments":[],"locations":[],"transfers":[],"recalls":[],"liquidations":[],"inventorySessions":[],"auditLogs":[],"assetTypeOptions":[],"conditionOptions":[],"statusOptions":[]}'::jsonb,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
)
ON CONFLICT (id) DO NOTHING;`;

export default function SyncModal({ isOpen, onClose }) {
  const {
    syncStatus,
    syncEngine,
    reconnectSyncEngine,
    lastSyncTime,
    syncError,
    syncNow,
    forcePushToServer,
    loadSampleData,
    clearAllData,
    exportBackup,
    importBackup,
    assets,
    departments,
    locations,
    inventorySessions
  } = useAssets();

  const [activeTab, setActiveTab] = useState('status'); // 'status' | 'supabase'
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const fileInputRef = useRef(null);

  // Supabase form states
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setSupabaseUrl(cfg.url || '');
      setSupabaseKey(cfg.anonKey || '');
      setTestResult(null);
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (ts) => {
    if (!ts) return 'Chưa đồng bộ';
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const handleManualSync = async () => {
    setIsProcessing(true);
    setFeedback(null);
    const res = await syncNow();
    setIsProcessing(false);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Đã đồng bộ dữ liệu mới nhất thành công!' });
    } else {
      setFeedback({ type: 'error', message: `Không thể kết nối máy chủ: ${res.error || 'Mất kết nối'}` });
    }
  };

  const handleForcePush = async () => {
    if (!window.confirm('Hành động này sẽ tải toàn bộ dữ liệu trên máy này lên máy chủ/đám mây. Các thiết bị khác sẽ nhận dữ liệu này. Bạn có chắc chắn?')) {
      return;
    }
    setIsProcessing(true);
    setFeedback(null);
    const res = await forcePushToServer();
    setIsProcessing(false);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Đã tải toàn bộ dữ liệu lên máy chủ thành công!' });
    } else {
      setFeedback({ type: 'error', message: `Không thể gửi dữ liệu: ${res.error || 'Lỗi mạng'}` });
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Bạn có chắc chắn muốn nhập dữ liệu từ tệp "${file.name}"? Dữ liệu hiện tại sẽ được cập nhật.`)) {
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    const res = await importBackup(file);
    setIsProcessing(false);
    e.target.value = '';

    if (res.success) {
      setFeedback({ type: 'success', message: `Khôi phục thành công ${res.count} tài sản từ tệp sao lưu!` });
    } else {
      setFeedback({ type: 'error', message: `Lỗi nhập tệp: ${res.error}` });
    }
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setTestResult({ success: false, message: 'Vui lòng nhập cả Supabase URL và Anon Key' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSaveSupabase = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      alert('Vui lòng nhập đầy đủ Supabase URL và Anon Key!');
      return;
    }
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    reconnectSyncEngine();
    setFeedback({ type: 'success', message: 'Đã lưu cấu hình Supabase và kích hoạt đồng bộ Online!' });
    setActiveTab('status');
  };

  const handleClearSupabase = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cấu hình Supabase? Hệ thống sẽ quay về chế độ mạng LAN/Cục bộ.')) {
      clearSupabaseConfig();
      setSupabaseUrl('');
      setSupabaseKey('');
      setTestResult(null);
      reconnectSyncEngine();
      setFeedback({ type: 'success', message: 'Đã hủy cấu hình Supabase. Hệ thống chuyển về mạng LAN/Cục bộ.' });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: syncEngine === 'supabase' ? '#ecfdf5' : '#e0f2fe',
                color: syncEngine === 'supabase' ? '#059669' : '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {syncEngine === 'supabase' ? <Zap size={20} /> : <ArrowLeftRight size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                Đồng bộ Dữ liệu Đa Thiết bị
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                {syncEngine === 'supabase'
                  ? 'Cơ sở dữ liệu Online: Supabase PostgreSQL (Realtime)'
                  : 'Chế độ mạng nội bộ LAN / Máy chủ Local'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '0 16px'
          }}
        >
          <button
            onClick={() => setActiveTab('status')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'status' ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === 'status' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'status' ? 600 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeftRight size={16} />
            Trạng thái & Thao tác
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'supabase' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'supabase' ? '#059669' : '#64748b',
              fontWeight: activeTab === 'supabase' ? 600 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Database size={16} />
            Cơ sở dữ liệu Online (Supabase)
            {syncEngine === 'supabase' && (
              <span style={{ fontSize: '0.68rem', backgroundColor: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: '10px' }}>
                Đang dùng
              </span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Feedback Message */}
          {feedback && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: feedback.type === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${feedback.type === 'success' ? '#86efac' : '#fecaca'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: STATUS & BASIC SYNC */}
          {activeTab === 'status' && (
            <>
              {/* Status Box */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: syncStatus === 'synced' ? '#f0fdf4' : syncStatus === 'syncing' ? '#eff6ff' : '#fffbeb',
                  border: `1px solid ${syncStatus === 'synced' ? '#bbf7d0' : syncStatus === 'syncing' ? '#bfdbfe' : '#fde68a'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {syncStatus === 'synced' ? (
                    <div style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {syncEngine === 'supabase' ? <Zap size={22} /> : <Wifi size={22} />}
                    </div>
                  ) : syncStatus === 'syncing' ? (
                    <div style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RefreshCw size={22} className="spinning" />
                    </div>
                  ) : (
                    <div style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <WifiOff size={22} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#0f172a' }}>
                      {syncStatus === 'synced' && (syncEngine === 'supabase' ? '🟢 Supabase Online (Đồng bộ Realtime tức thì)' : '🟢 Đã kết nối & Đồng bộ máy chủ LAN')}
                      {syncStatus === 'syncing' && '🔄 Đang đồng bộ dữ liệu...'}
                      {syncStatus === 'offline' && (syncEngine === 'supabase' ? '🟡 Mất kết nối Supabase (Đang lưu trên máy)' : '🟡 Ngoại tuyến (Đang dùng dữ liệu trên máy)')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      Lần đồng bộ gần nhất: <strong>{formatTime(lastSyncTime)}</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleManualSync}
                  disabled={isProcessing}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  <RefreshCw size={14} className={isProcessing ? 'spinning' : ''} />
                  Đồng bộ ngay
                </button>
              </div>

              {/* Data Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{assets.length}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Tài sản</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{departments.length}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Phòng ban</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{locations.length}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Vị trí</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{inventorySessions.length}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Đợt kiểm kê</div>
                </div>
              </div>

              {/* Actions: Push & Backup */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  Thao tác dữ liệu & Sao lưu:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={handleForcePush}
                    disabled={isProcessing}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Upload size={16} color="#0284c7" />
                    Đẩy dữ liệu lên máy chủ
                  </button>

                  <button
                    onClick={exportBackup}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Download size={16} color="#16a34a" />
                    Sao lưu file JSON
                  </button>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportFile}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      border: '1px dashed #94a3b8',
                      color: '#475569',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <FileJson size={16} color="#6366f1" />
                    Khôi phục từ tệp sao lưu (.json)
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                  <button
                    onClick={async () => {
                      if (window.confirm('Khởi tạo bộ dữ liệu mẫu chuẩn gồm 4 phòng ban, vị trí và 9 tài sản lên hệ thống?')) {
                        setIsProcessing(true);
                        await loadSampleData();
                        setIsProcessing(false);
                        setFeedback({ type: 'success', message: 'Đã nạp thành công bộ dữ liệu mẫu và đồng bộ lên Cloud!' });
                      }
                    }}
                    disabled={isProcessing}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sparkles size={15} color="#2563eb" />
                    Nạp dữ liệu mẫu
                  </button>

                  <button
                    onClick={async () => {
                      if (window.confirm('CẢNH BÁO: Hành động này sẽ xóa sạch dữ liệu (0 tài sản, 0 phòng ban) để bạn nhập mới từ đầu. Bạn có chắc chắn?')) {
                        setIsProcessing(true);
                        await clearAllData();
                        setIsProcessing(false);
                        setFeedback({ type: 'success', message: 'Đã xóa toàn bộ dữ liệu, hệ thống sẵn sàng nhập mới!' });
                      }
                    }}
                    disabled={isProcessing}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      color: '#be123c',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Trash2 size={15} color="#e11d48" />
                    Xóa sạch dữ liệu
                  </button>
                </div>
              </div>

              {/* Engine Switch Notice */}
              {syncEngine !== 'supabase' && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={18} color="#059669" />
                    <div style={{ fontSize: '0.8rem', color: '#065f46' }}>
                      Bạn muốn đồng bộ qua Internet từ mọi nơi? Hãy kết nối <strong>Supabase Online Miễn phí</strong>.
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('supabase')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#059669',
                      color: '#fff',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Cấu hình ngay
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: SUPABASE CONFIGURATION */}
          {activeTab === 'supabase' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Introduction Banner */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: '#166534', lineHeight: 1.5 }}>
                  <strong>Cơ sở dữ liệu Supabase (PostgreSQL) - Miễn phí 100% vĩnh viễn:</strong>
                  <div>
                    Dữ liệu được lưu trữ trực tuyến an toàn trên đám mây. Điện thoại quét mã QR ở bất kỳ đâu (kể cả dùng 4G) sẽ đồng bộ tức thì về màn hình máy tính theo thời gian thực (Realtime WebSocket).
                  </div>
                </div>
              </div>

              {/* Form Input URL & Key */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    <Globe size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    Supabase Project URL:
                  </label>
                  <input
                    type="text"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                    Tìm thấy tại: Supabase Dashboard → Project Settings → API → Project URL
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    <Key size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    Supabase Anon / Public Key:
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                    Tìm thấy tại: Supabase Dashboard → Project Settings → API → Project API keys (anon public)
                  </div>
                </div>
              </div>

              {/* Test result message */}
              {testResult && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    backgroundColor: testResult.success ? '#f0fdf4' : '#fff1f2',
                    color: testResult.success ? '#15803d' : '#be123c',
                    border: `1px solid ${testResult.success ? '#86efac' : '#fecdd3'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Actions Button */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={handleTestSupabase}
                  disabled={isTesting}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: isTesting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={14} className={isTesting ? 'spinning' : ''} />
                  {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                </button>

                <button
                  onClick={handleSaveSupabase}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    backgroundColor: '#059669',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  <Check size={16} />
                  Lưu & Kích hoạt Online
                </button>

                {getSupabaseConfig().isConfigured && (
                  <button
                    onClick={handleClearSupabase}
                    title="Xóa cấu hình và trở về mạng LAN"
                    style={{
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={15} />
                    Xóa cấu hình
                  </button>
                )}
              </div>

              {/* Step by Step Guide */}
              <div
                style={{
                  marginTop: '6px',
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                    Hướng dẫn khởi tạo nhanh Supabase trong 2 phút:
                  </div>
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      color: '#2563eb',
                      textDecoration: 'none',
                      fontWeight: 500
                    }}
                  >
                    Mở Supabase.com <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                  <div><strong>Bước 1:</strong> Đăng ký tài khoản miễn phí tại <strong>supabase.com</strong> → Bấm <em>New Project</em> (chọn khu vực Singapore).</div>
                  <div><strong>Bước 2:</strong> Vào tab <strong>SQL Editor</strong> ở thanh menu bên trái, dán đoạn mã SQL bên dưới rồi bấm <strong>Run (▶)</strong>:</div>
                </div>

                <button
                  onClick={handleCopySql}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: copiedSql ? '#ecfdf5' : '#1e293b',
                    color: copiedSql ? '#059669' : '#ffffff',
                    border: copiedSql ? '1px solid #10b981' : 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {copiedSql ? <Check size={15} /> : <Copy size={15} />}
                  {copiedSql ? '✓ Đã sao chép mã SQL vào bộ nhớ đệm!' : 'Sao chép toàn bộ mã SQL khởi tạo bảng'}
                </button>

                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                  <div><strong>Bước 3:</strong> Vào <strong>Project Settings → API</strong>, sao chép <em>Project URL</em> và <em>anon public key</em> dán vào ô bên trên rồi bấm <strong>Lưu & Kích hoạt Online</strong>.</div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: '#e2e8f0',
              border: 'none',
              color: '#334155',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

