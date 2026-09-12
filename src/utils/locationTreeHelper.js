// src/utils/locationTreeHelper.js
import { cleanText, deduplicateAndMergeLocationTree } from './normalize';
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
  const n = cleanText(nodeName).toLowerCase();

  // 1. Direct path containment: e.g. "Cơ sở 1 > Khu A > Tầng 1 > Phòng A1.01" includes "Cơ sở 1 > Khu A"
  if (a.includes(f)) return true;

  // 2. Check if all individual parts of the target path exist in the asset location
  const parts = f.split(/\s*>\s*/).map(p => cleanText(p).toLowerCase()).filter(Boolean);
  if (parts.length > 1) {
    return parts.every(p => a.includes(p));
  }

  // 3. Single part (e.g. "Cơ sở 1" or standalone room name)
  if (parts.length === 1) {
    return a.includes(parts[0]);
  }

  return a.includes(n);
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
          id: `loc-auto-${encodeURIComponent(cleanText(currentPath)).replace(/%/g, '').slice(0, 30)}-${idx}`,
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
