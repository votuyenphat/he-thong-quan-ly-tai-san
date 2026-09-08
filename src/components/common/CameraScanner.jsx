// src/components/common/CameraScanner.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Modal from './Modal';
import { Camera, Search, Check, AlertCircle } from 'lucide-react';
import { useAssets } from '../../context/AssetContext';

export default function CameraScanner({ isOpen, onClose, onScanSuccess }) {
  const { assets } = useAssets();
  const [manualCode, setManualCode] = useState('');
  const [scanError, setScanError] = useState('');
  const [scannerStarted, setScannerStarted] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setScanError('');
      // Initialize Html5QrcodeScanner if open
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader-region',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            handleParsedText(decodedText);
          },
          (error) => {
            // Ignore frame parse errors
          }
        );
        setScannerStarted(true);
      } catch (e) {
        console.warn('Camera scanner init error:', e);
      }
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Scanner cleanup error:', e);
        }
      }
    };
  }, [isOpen]);

  const handleParsedText = (text) => {
    let targetCode = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.code) targetCode = parsed.code;
    } catch (e) {
      // It's raw text
    }

    const matchedAsset = assets.find(a => 
      a.code.toLowerCase() === targetCode.trim().toLowerCase() ||
      a.qrValue === targetCode.trim()
    );

    if (matchedAsset) {
      if (scannerRef.current) {
        try { scannerRef.current.clear(); } catch (e) {}
      }
      onScanSuccess(matchedAsset);
      onClose();
    } else {
      setScanError(`Không tìm thấy tài sản có mã: "${targetCode}" trong hệ thống.`);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleParsedText(manualCode.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quét Mã QR Kiểm Kê Bằng Camera"
      size="lg"
      footer={
        <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Real Camera Scanner */}
        <div style={{ 
          background: '#f8fafc', 
          borderRadius: '12px', 
          padding: '16px', 
          border: '1px solid #e2e8f0',
          minHeight: '260px'
        }}>
          <div id="qr-reader-region" style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}></div>
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '10px' }}>
            * Hướng camera vào tem mã QR dán trên tài sản để nhận diện tự động.
          </p>
        </div>

        {scanError && (
          <div style={{
            background: '#fee2e2',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} />
            {scanError}
          </div>
        )}

        {/* Manual Input Alternative */}
        <form onSubmit={handleManualSubmit} style={{ 
          display: 'flex', 
          gap: 10, 
          paddingTop: 16, 
          borderTop: '1px solid #e2e8f0',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Hoặc nhập mã tài sản bằng tay (VD: TS-2024-0001, TS-2023-0015)..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <Search size={16} />
            Tìm & Kiểm kê
          </button>
        </form>

        {/* Quick select demo buttons */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
            Gợi ý quét nhanh cho đợt kiểm kê mẫu:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {assets.slice(0, 6).map(a => (
              <button
                key={a.id}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleParsedText(a.code)}
              >
                {a.code} - {a.name.slice(0, 24)}...
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
