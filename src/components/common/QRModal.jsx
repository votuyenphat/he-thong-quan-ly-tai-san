// src/components/common/QRModal.jsx
import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import Modal from './Modal';
import { Printer, Download } from 'lucide-react';
import { printElement } from '../../utils/printHelpers';

export default function QRModal({ isOpen, onClose, asset }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && asset && canvasRef.current) {
      const qrData = JSON.stringify({
        code: asset.code,
        name: asset.name,
        dept: asset.departmentName,
        loc: asset.locationPath
      });

      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }, (err) => {
        if (err) console.error(err);
      });
    }
  }, [isOpen, asset]);

  if (!asset) return null;

  const handlePrintTag = () => {
    printElement('printable-qr-tag');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tem Nhãn Mã QR: ${asset.code}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
          <button className="btn btn-primary" onClick={handlePrintTag}>
            <Printer size={16} />
            In Tem Nhãn
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {/* Printable Tag Container */}
        <div 
          id="printable-qr-tag" 
          style={{
            border: '2px dashed #94a3b8',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '380px',
            width: '100%',
            background: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', color: '#1e3a8a', textTransform: 'uppercase', marginBottom: '8px' }}>
            HỆ THỐNG QUẢN LÝ TÀI SẢN
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
            <canvas ref={canvasRef} style={{ borderRadius: '8px' }} />
          </div>

          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.5px' }}>
            {asset.code}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '4px', lineHeight: 1.3 }}>
            {asset.name}
          </div>

          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', textAlign: 'left', lineHeight: 1.6 }}>
            <div><strong>Số lượng:</strong> <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>{asset.quantity || 1} {asset.unit || 'Cái'}</span></div>
            <div><strong>Đơn vị:</strong> {asset.departmentName}</div>
            <div><strong>Vị trí:</strong> {asset.locationPath}</div>
            <div><strong>Phụ trách:</strong> {asset.responsiblePerson}</div>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
          * Dán mã QR này trực tiếp lên thân máy/thiết bị. Cán bộ kiểm kê chỉ cần dùng camera quét mã để ghi nhận tình trạng thực tế tức thì.
        </p>
      </div>
    </Modal>
  );
}
