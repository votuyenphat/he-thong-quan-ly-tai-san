// src/pages/AssetPublicProfile.jsx
// Chế độ hiển thị ĐỘC LẬP 1 HÌNH ẢNH DUY NHẤT khi quét Mã QR — hoàn toàn tách biệt, không mở vào Phần mềm

import React, { useEffect, useState } from 'react';
import { INITIAL_ASSETS } from '../data/mockData';
import { fetchDataFromSupabase, isSupabaseEnabled } from '../services/supabaseSync';
import { fetchServerData } from '../services/syncService';
import { cleanText, sanitizeAsset } from '../utils/normalize';
import { generateAssetCardImageDataUrl } from '../utils/assetCardImage';

function findAssetInList(list, query) {
  if (!Array.isArray(list) || !query) return null;
  const q = cleanText(query).toLowerCase();
  const found =
    list.find(a => cleanText(a?.code).toLowerCase() === q) ||
    list.find(a => cleanText(a?.id).toLowerCase() === q) ||
    null;
  return found ? sanitizeAsset(found) : null;
}

export default function AssetPublicProfile({ assetQuery }) {
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'not_found'

  useEffect(() => {
    let active = true;

    async function renderAsset(assetObj) {
      try {
        document.title = `${assetObj.code} - ${assetObj.name}`;
        const pngDataUrl = await generateAssetCardImageDataUrl(assetObj);
        if (!active) return false;
        if (pngDataUrl) {
          setImageUrl(pngDataUrl);
          setStatus('ready');
          return true;
        }
      } catch (err) {
        console.error('Lỗi kết xuất ảnh tài sản:', err);
      }
      return false;
    }

    async function loadAndRenderCard() {
      setStatus('loading');
      let renderedFromCache = false;

      // 1. Ưu tiên đọc tức thì (0ms) từ bộ nhớ trình duyệt để hiện hình ảnh ngay lập tức
      try {
        const rawLocal = localStorage.getItem('qlts_assets');
        if (rawLocal) {
          const localMatched = findAssetInList(JSON.parse(rawLocal), assetQuery);
          if (localMatched) {
            renderedFromCache = await renderAsset(localMatched);
          }
        }
      } catch {
        // ignore localStorage parse error
      }

      // 2. Đồng bộ dữ liệu mới nhất từ Supabase Cloud (hoặc Server LAN) — cần thiết khi mở lần đầu trên điện thoại mới
      try {
        let remoteData = null;
        if (isSupabaseEnabled()) {
          remoteData = await fetchDataFromSupabase();
        } else {
          remoteData = await fetchServerData();
        }
        if (!active) return;

        if (remoteData && Array.isArray(remoteData.assets)) {
          const remoteMatched = findAssetInList(remoteData.assets, assetQuery);
          if (remoteMatched) {
            await renderAsset(remoteMatched);
            return;
          }
        }
      } catch {
        // Nếu ngoại tuyến mà đã hiển thị từ cache thì giữ nguyên ảnh
      }

      if (!active || renderedFromCache) return;

      // 3. Dự phòng cuối từ INITIAL_ASSETS (nếu test mã mẫu offline)
      const fallbackMatched = findAssetInList(INITIAL_ASSETS, assetQuery);
      if (fallbackMatched) {
        const ok = await renderAsset(fallbackMatched);
        if (ok) return;
      }

      if (active) {
        document.title = `Không tìm thấy tài sản ${assetQuery}`;
        setStatus('not_found');
      }
    }

    loadAndRenderCard();

    return () => {
      active = false;
    };
  }, [assetQuery]);

  // Màn hình xem ảnh thuần túy (chỉ hiển thị duy nhất 1 tấm ảnh .png, KHÔNG có nút hay đường dẫn vào phần mềm)
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: '16px 10px',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box'
      }}
    >
      {status === 'loading' && (
        <div
          style={{
            color: '#e2e8f0',
            fontSize: '0.95rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center'
          }}
        >
          Đang tải hình ảnh thông tin tài sản ({assetQuery})...
        </div>
      )}

      {status === 'not_found' && (
        <div
          style={{
            color: '#cbd5e1',
            background: '#1e293b',
            padding: '24px 28px',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center'
          }}
        >
          Không tìm thấy thông tin tài sản ({assetQuery}).
        </div>
      )}

      {status === 'ready' && imageUrl && (
        <img
          src={imageUrl}
          alt={`Thông tin tài sản ${assetQuery}`}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '640px',
            height: 'auto',
            borderRadius: '8px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)'
          }}
        />
      )}
    </div>
  );
}
