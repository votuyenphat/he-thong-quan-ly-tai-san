// src/components/common/SyncModal.jsx
import React, { useState, useRef } from 'react';
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
  Smartphone,
  Laptop,
  ArrowLeftRight,
  Info
} from 'lucide-react';
import { useAssets } from '../../context/AssetContext';

export default function SyncModal({ isOpen, onClose }) {
  const {
    syncStatus,
    lastSyncTime,
    syncError,
    syncNow,
    forcePushToServer,
    exportBackup,
    importBackup,
    assets,
    departments,
    locations,
    inventorySessions
  } = useAssets();

  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const fileInputRef = useRef(null);

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
      setFeedback({ type: 'success', message: 'Đã đồng bộ dữ liệu mới nhất từ máy chủ thành công!' });
    } else {
      setFeedback({ type: 'error', message: `Không thể kết nối máy chủ: ${res.error || 'Mất kết nối'}` });
    }
  };

  const handleForcePush = async () => {
    if (!window.confirm('Hành động này sẽ đẩy toàn bộ dữ liệu trên thiết bị này lên máy chủ và áp dụng cho các thiết bị khác. Bạn có chắc chắn muốn tiếp tục?')) {
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
          maxWidth: '560px',
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
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                Đồng bộ Dữ liệu Đa Thiết bị
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Đồng bộ thời gian thực giữa Máy tính ⟷ Điện thoại ⟷ Tablet
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

        {/* Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
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
                  <Wifi size={22} />
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
                  {syncStatus === 'synced' && '🟢 Đã kết nối & Đồng bộ máy chủ'}
                  {syncStatus === 'syncing' && '🔄 Đang đồng bộ với máy chủ...'}
                  {syncStatus === 'offline' && '🟡 Ngoại tuyến (Đang dùng dữ liệu trên máy)'}
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
          </div>

          {/* Guide Section */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#f0fdfa',
              border: '1px solid #99f6e4',
              display: 'flex',
              gap: '10px'
            }}
          >
            <Info size={18} color="#0d9488" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.78rem', color: '#115e59', lineHeight: 1.5 }}>
              <strong>Hướng dẫn dùng trên điện thoại:</strong> Kết nối điện thoại chung mạng Wi-Fi với máy tính, sau đó mở trình duyệt trên điện thoại và truy cập địa chỉ IP của máy tính (ví dụ: <code>http://192.168.1.x:5173</code>). Mọi thao tác thêm tài sản, quét mã kiểm kê trên điện thoại sẽ tự động đồng bộ tức thì về máy tính!
            </div>
          </div>

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
