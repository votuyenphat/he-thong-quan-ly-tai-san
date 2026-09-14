import { cleanText, deduplicateAndMergeLocationTree } from './normalize.js';
import { Building, Layers, MapPin, DoorOpen } from 'lucide-react';

// Level hierarchy definitions
export const LEVEL_TYPES = {
  0: { type: 'CAMPUS', label: 'Cơ sở', icon: Building, color: '#2563eb', bg: '#dbeafe' },
  1: { type: 'AREA', label: 'Khu/Tòa', icon: Layers, color: '#059669', bg: '#d1fae5' },
  2: { type: 'FLOOR', label: 'Tầng', icon: MapPin, color: '#d97706', bg: '#fef3c7' },
  3: { type: 'ROOM', label: 'Phòng', icon: DoorOpen, color: '#6366f1', bg: '#e0e7ff' }
};

// Check if an asset locationPath belongs to a specific location node
export function isAssetAtLocation(assetLoc, nodeFullPath, nodeName) {
  if (!assetLoc || typeof assetLoc !== 'string') return false;
  const a = cleanText(assetLoc).toLowerCase();
  const f = cleanText(nodeFullPath).toLowerCase();
  if (!a || !f) return false;

  // 1. So khớp chính xác
  if (a === f) return true;

  // 2. So khớp tiền tố phân cấp: e.g. "cơ sở 1 > khu a > tầng 1" bắt đầu bằng "cơ sở 1 > khu a >"
  if (a.startsWith(`${f} >`)) return true;

  // 3. Tách theo dấu '>' để kiểm tra từng phân cấp chính xác tuyệt đối
  const aParts = a.split(/\s*>\s*/).map(p => cleanText(p)).filter(Boolean);
  const fParts = f.split(/\s*>\s*/).map(p => cleanText(p)).filter(Boolean);

  if (fParts.length > 0 && aParts.length >= fParts.length) {
    let match = true;
    for (let i = 0; i < fParts.length; i++) {
      if (aParts[i] !== fParts[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }

  // 4. Fallback: Nếu là cấp phòng cuối cùng, so khớp chính xác tên phân đoạn
  if (nodeName) {
    const n = cleanText(nodeName).toLowerCase();
    if (aParts.includes(n)) return true;
  }

  return false;
}

/**
 * Build dynamic tree merging formal locations with paths extracted from assets
 * Đồng bộ 100% giữa Cây Vị Trí Địa Lý và các màn hình chọn vị trí
 */
export function buildEffectiveLocationTree(locations, assets) {
  // First, deduplicate and merge formal locations
  const tree = deduplicateAndMergeLocationTree(locations || []);

  (assets || []).forEach(asset => {
    if (!asset.locationPath || !asset.locationPath.trim()) return;

    const rawPath = cleanText(asset.locationPath);
    let parts = rawPath.split(/\s*>\s*/).map(p => cleanText(p)).filter(Boolean);
    if (parts.length === 0) {
      parts = rawPath.split(/\s*;\s*/).map(p => cleanText(p)).filter(Boolean);
    }
    if (parts.length === 0) return;

    let currentLevel = tree;
    let currentPath = '';

    parts.forEach((partName, idx) => {
      const cleanPart = cleanText(partName);
      if (!cleanPart) return;
      currentPath = currentPath ? `${currentPath} > ${cleanPart}` : cleanPart;
      const key = cleanPart.toLowerCase();
      let existingNode = currentLevel.find(n => cleanText(n.name).toLowerCase() === key);

      if (!existingNode) {
        const depth = Math.min(idx, 3);
        existingNode = {
          id: `loc-${cleanText(currentPath).toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: cleanPart,
          code: cleanPart.slice(0, 10).toUpperCase(),
          type: (LEVEL_TYPES[depth] || LEVEL_TYPES[3]).type,
          children: []
        };
        currentLevel.push(existingNode);
      } else {
        if (!Array.isArray(existingNode.children)) existingNode.children = [];
      }

      currentLevel = existingNode.children;
    });
  });

  return deduplicateAndMergeLocationTree(tree);
}
