// src/components/common/SyncStatusBadge.jsx
import React, { useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useAssets } from '../../context/AssetContext';
import SyncModal from './SyncModal';

export default function SyncStatusBadge({ onOpenModal }) {
  const { syncStatus } = useAssets();
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const handleOpen = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      setInternalModalOpen(true);
    }
  };

  // PHƯƠNG ÁN 2: Tự động ẩn hoàn toàn khi hoạt động bình thường (synced)
  if (syncStatus === 'synced') {
    return !onOpenModal ? (
      <SyncModal isOpen={internalModalOpen} onClose={() => setInternalModalOpen(false)} />
    ) : null;
  }

  // Khi đang lưu dữ liệu ngầm (hiển thị kín đáo, nhỏ gọn)
  if (syncStatus === 'syncing') {
    return (
      <>
        <div
          title="Đang đồng bộ dữ liệu thời gian thực..."
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#2563eb',
            fontSize: '0.74rem',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}
        >
          <RefreshCw size={13} className="spinning" />
          <span className="sync-badge-text">Đang lưu...</span>
        </div>
        {!onOpenModal && (
          <SyncModal isOpen={internalModalOpen} onClose={() => setInternalModalOpen(false)} />
        )}
      </>
    );
  }

  // Khi mất kết nối mạng hoặc có lỗi: Hiển thị cảnh báo màu vàng để người dùng nhận biết
  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        title="Mất kết nối mạng - Dữ liệu đang được lưu an toàn trên máy (Bấm để xem chi tiết)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '20px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          color: '#b45309',
          fontSize: '0.76rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        <WifiOff size={14} />
        <span className="sync-badge-text">Ngoại tuyến (Lưu tạm trên máy)</span>
      </button>

      {!onOpenModal && (
        <SyncModal isOpen={internalModalOpen} onClose={() => setInternalModalOpen(false)} />
      )}
    </>
  );
}
