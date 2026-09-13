// src/components/common/SyncStatusBadge.jsx
import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react';
import { useAssets } from '../../context/AssetContext';
import SyncModal from './SyncModal';

export default function SyncStatusBadge() {
  const { syncStatus, syncEngine } = useAssets();
  const [isModalOpen, setIsModalOpen] = useState(false);

  let bg = '#f0fdf4';
  let border = '#bbf7d0';
  let color = '#16a34a';
  let label = syncEngine === 'supabase' ? '⚡ Supabase Online' : 'Đã đồng bộ';
  let icon = syncEngine === 'supabase' ? <Zap size={14} /> : <Wifi size={14} />;

  if (syncStatus === 'syncing') {
    bg = '#eff6ff';
    border = '#bfdbfe';
    color = '#2563eb';
    label = 'Đang đồng bộ...';
    icon = <RefreshCw size={14} className="spinning" />;
  } else if (syncStatus === 'offline') {
    bg = '#fffbeb';
    border = '#fde68a';
    color = '#d97706';
    label = syncEngine === 'supabase' ? 'Supabase Offline' : 'Ngoại tuyến';
    icon = <WifiOff size={14} />;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        title="Trung tâm đồng bộ dữ liệu đa thiết bị (Bấm để xem chi tiết)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '20px',
          backgroundColor: bg,
          border: `1px solid ${border}`,
          color: color,
          fontSize: '0.76rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap'
        }}
      >
        {icon}
        <span className="sync-badge-text">{label}</span>
      </button>

      <SyncModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
