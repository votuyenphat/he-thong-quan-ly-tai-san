// src/utils/normalize.js
// Xử lý chuẩn hóa chuỗi tiếng Việt (Unicode NFC vs NFD), loại bỏ ký tự ẩn, khoảng trắng không ngắt (NBSP)

/**
 * Chuẩn hóa chuỗi văn bản:
 * 1. Chuyển Unicode NFD (tổ hợp) -> Unicode NFC (dựng sẵn)
 * 2. Thay thế non-breaking spaces (\u00A0), zero-width spaces (\u200B), BOM (\uFEFF) thành khoảng trắng thường
 * 3. Loại bỏ khoảng trắng thừa ở đầu, cuối và giữa chuỗi
 */
export function cleanText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize('NFC')
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Loại bỏ dấu tiếng Việt để so sánh fuzzy / tìm kiếm
 */
export function removeVietnameseDiacritics(str) {
  if (!str) return '';
  return cleanText(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * So sánh 2 chuỗi bất kỳ sau khi chuẩn hóa NFC và không phân biệt hoa thường
 */
export function isEqualNormalized(a, b) {
  return cleanText(a).toLowerCase() === cleanText(b).toLowerCase();
}

/**
 * Chuẩn hóa trạng thái tài sản về các trạng thái chuẩn hệ thống
 * Hệ thống hỗ trợ:
 * - 'Đang sử dụng'
 * - 'Trong kho'
 * - 'Điều chuyển'
 * - 'Chờ thanh lý'
 * - 'Đã thanh lý'
 * - 'Đã thu hồi'
 * - 'Mất'
 */
export function canonicalStatus(raw) {
  if (!raw) return '';
  const cleaned = cleanText(raw);
  const lower = cleaned.toLowerCase();
  const noDau = removeVietnameseDiacritics(lower);

  if (lower.includes('đang sử dụng') || noDau.includes('dang su dung') || noDau.includes('su dung')) {
    return 'Đang sử dụng';
  }
  if (lower.includes('trong kho') || noDau.includes('trong kho')) {
    return 'Trong kho';
  }
  if (lower.includes('điều chuyển') || noDau.includes('dieu chuyen')) {
    return 'Điều chuyển';
  }
  if (lower.includes('chờ thanh lý') || noDau.includes('cho thanh ly')) {
    return 'Chờ thanh lý';
  }
  if (lower.includes('đã thanh lý') || noDau.includes('da thanh ly')) {
    return 'Đã thanh lý';
  }
  if (lower.includes('đã thu hồi') || noDau.includes('da thu hoi') || noDau.includes('thu hoi')) {
    return 'Đã thu hồi';
  }
  if (lower.includes('mất') || noDau.includes('mat')) {
    return 'Mất';
  }

  return cleaned;
}

/**
 * Chuẩn hóa tình trạng kỹ thuật về các chuẩn hệ thống
 * - 'Tốt'
 * - 'Khá'
 * - 'Hỏng nhẹ'
 * - 'Hỏng nặng'
 * - 'Không sử dụng được'
 */
export function canonicalCondition(raw) {
  if (!raw) return '';
  const cleaned = cleanText(raw);
  const lower = cleaned.toLowerCase();
  const noDau = removeVietnameseDiacritics(lower);

  if (lower.includes('không sử dụng được') || noDau.includes('khong su dung duoc')) {
    return 'Không sử dụng được';
  }
  if (lower.includes('hỏng nặng') || noDau.includes('hong nang')) {
    return 'Hỏng nặng';
  }
  if (lower.includes('hỏng nhẹ') || noDau.includes('hong nhe')) {
    return 'Hỏng nhẹ';
  }
  if (lower.includes('khá') || noDau.includes('kha')) {
    return 'Khá';
  }
  if (lower.includes('tốt') || noDau.includes('tot')) {
    return 'Tốt';
  }

  return cleaned;
}

/**
 * Chuẩn hóa toàn bộ thông tin 1 tài sản
 */
export function sanitizeAsset(asset) {
  if (!asset) return asset;
  return {
    ...asset,
    code: cleanText(asset.code),
    name: cleanText(asset.name),
    type: cleanText(asset.type),
    brand: cleanText(asset.brand),
    unit: cleanText(asset.unit) || 'Cái',
    departmentName: cleanText(asset.departmentName),
    departmentId: cleanText(asset.departmentId),
    locationPath: cleanText(asset.locationPath),
    responsiblePerson: cleanText(asset.responsiblePerson),
    currentUser: cleanText(asset.currentUser),
    condition: canonicalCondition(asset.condition) || cleanText(asset.condition) || 'Tốt',
    status: canonicalStatus(asset.status) || cleanText(asset.status) || 'Đang sử dụng',
    notes: cleanText(asset.notes),
    fundingSource: cleanText(asset.fundingSource)
  };
}

/**
 * Chuẩn hóa danh sách tài sản
 */
export function sanitizeAssetList(assets) {
  if (!Array.isArray(assets)) return [];
  return assets.map(sanitizeAsset);
}

/**
 * Đếm số lượng vật tư / tài sản trực thuộc phòng ban (so khớp cả id và name đã chuẩn hóa)
 */
export function getDepartmentAssetCount(dept, assets = []) {
  if (!dept || !Array.isArray(assets)) return 0;
  const deptIdClean = cleanText(dept.id).toLowerCase();
  const deptNameClean = cleanText(dept.name).toLowerCase();
  return assets.filter(a => {
    const aDeptId = cleanText(a.departmentId).toLowerCase();
    const aDeptName = cleanText(a.departmentName).toLowerCase();
    return (deptIdClean && aDeptId === deptIdClean) || (deptNameClean && aDeptName === deptNameClean);
  }).length;
}

/**
 * Phân loại phòng ban:
 * true: Khối Khoa đào tạo
 * false: Khối Phòng / Ban chức năng
 */
export function isKhoaDepartment(name = '') {
  const l = cleanText(name).toLowerCase();
  return l.startsWith('khoa') || /\bkhoa\b/.test(l);
}

/**
 * Sắp xếp danh sách phòng ban:
 * 1. Khối Phòng / Ban (xếp trước) theo thứ tự số lượng vật tư giảm dần (nhiều vật tư lên đầu)
 * 2. Khối Khoa (xếp sau) theo thứ tự số lượng vật tư giảm dần
 * Nếu cùng số lượng thì sắp xếp theo bảng chữ cái tiếng Việt.
 */
export function sortDepartments(departments, assets = []) {
  if (!Array.isArray(departments)) return [];
  return [...departments].sort((a, b) => {
    const groupA = isKhoaDepartment(a.name) ? 1 : 0;
    const groupB = isKhoaDepartment(b.name) ? 1 : 0;
    if (groupA !== groupB) return groupA - groupB;

    const countA = getDepartmentAssetCount(a, assets);
    const countB = getDepartmentAssetCount(b, assets);
    if (countB !== countA) return countB - countA;

    return cleanText(a.name).localeCompare(cleanText(b.name), 'vi', { sensitivity: 'base' });
  });
}

/**
 * Kiểm tra xem vị trí có phải là Bãi xe không (Bãi xe, Bãi đỗ xe, Bãi giữ xe, Nhà xe...)
 */
export function isBaiXeLocation(name = '') {
  const n = cleanText(name).toLowerCase();
  return (
    n.includes('bãi xe') || n.includes('bai xe') ||
    n.includes('bãi đỗ') || n.includes('bai do') ||
    n.includes('bãi giữ') || n.includes('bai giu') ||
    n.includes('nhà xe') || n.includes('nha xe')
  );
}

/**
 * Chuẩn hóa khóa so sánh cho cấp Khu / Tòa:
 * Quy tắc: Bãi xe luôn nằm ở vị trí ngay phía dưới Khu D
 */
function getAreaSortKey(name = '') {
  const clean = cleanText(name);
  const lower = clean.toLowerCase();

  // Bãi xe: gán khóa để luôn nằm ngay phía dưới Khu D
  if (isBaiXeLocation(clean)) {
    return `khu d_z_baixe_${lower}`;
  }

  // Khu / Tòa / Block + ký hiệu (A, B, C, D, E hoặc 1, 2...)
  const match = lower.match(/^(khu|tòa|toa|block)\s*([a-z0-9]+)/i);
  if (match) {
    const ident = match[2];
    const padded = /^\d+$/.test(ident) ? ident.padStart(5, '0') : ident;
    return `khu ${padded}`;
  }

  return lower;
}

/**
 * So sánh 2 node cấp Khu / Tòa (Area)
 */
export function compareAreaNodes(a, b) {
  const keyA = getAreaSortKey(a.name);
  const keyB = getAreaSortKey(b.name);
  return keyA.localeCompare(keyB, 'vi', { numeric: true, sensitivity: 'base' });
}

/**
 * Tính trọng số sắp xếp cấp Tầng (Floor)
 */
function getFloorSortKey(name = '') {
  const clean = cleanText(name).toLowerCase();
  // Tầng hầm
  if (clean.includes('hầm') || clean.includes('ham') || clean.includes('b1') || clean.includes('b2')) {
    const numMatch = clean.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0], 10) : 1;
    return -100 + num;
  }
  // Tầng trệt / Tầng G
  if (clean.includes('trệt') || clean.includes('tret') || /\bg\b/.test(clean) || clean.includes('ground')) {
    return 0;
  }
  // Tầng lửng
  if (clean.includes('lửng') || clean.includes('lung')) {
    return 0.5;
  }
  // Tầng 1, 2, 3...
  const numMatch = clean.match(/\d+/);
  if (numMatch) {
    return parseInt(numMatch[0], 10);
  }
  // Sân thượng
  if (clean.includes('thượng') || clean.includes('thuong') || clean.includes('rooftop')) {
    return 999;
  }
  return 500;
}

/**
 * So sánh 2 node cấp Tầng (Floor)
 */
export function compareFloorNodes(a, b) {
  const rankA = getFloorSortKey(a.name);
  const rankB = getFloorSortKey(b.name);
  if (rankA !== rankB) return rankA - rankB;
  return cleanText(a.name).localeCompare(cleanText(b.name), 'vi', { numeric: true, sensitivity: 'base' });
}

/**
 * Phân cấp phòng trong tầng:
 * Quy tắc: Phòng số trước, tới phòng chữ
 * - Phòng số: có chứa chữ số trong tên (101, 102, P.101, Phòng 101, A1.01, Giảng đường B2.01, Lab 201...)
 * - Phòng chữ: không chứa chữ số trong tên (Hội trường, Kho, Phòng Họp, Văn phòng Khoa, Phòng A, Phòng B...)
 */
export function getRoomSortRank(name = '') {
  const clean = cleanText(name);
  // Không có chữ số nào: PHÒNG CHỮ (xếp sau)
  if (!/\d/.test(clean)) return 3;

  // Bắt đầu bằng số thuần túy (ví dụ: "101", "102", "102A") -> ưu tiên cao nhất
  if (/^\s*\d/.test(clean)) return 0;

  // Bắt đầu bằng tiền tố phòng + số (ví dụ: "P.101", "Phòng 101", "P101", "Lab 101") -> ưu tiên thứ 2
  if (/^\s*(phòng|phong|p\.?|lab)\s*\d/i.test(clean)) return 1;

  // Các phòng có số khác (ví dụ: "Giảng đường B2.01", "A1.01") -> ưu tiên thứ 3
  return 2;
}

/**
 * So sánh 2 phòng trong tầng: phòng số trước, tới phòng chữ
 */
export function compareRoomNodes(a, b) {
  const rankA = getRoomSortRank(a.name);
  const rankB = getRoomSortRank(b.name);

  // Phòng số (ranks 0, 1, 2) xếp trước phòng chữ (rank 3)
  if (rankA !== rankB) return rankA - rankB;

  // Cùng nhóm phòng số: sắp xếp số tự nhiên (101 < 102, 2 < 10)
  if (rankA < 3) {
    return cleanText(a.name).localeCompare(cleanText(b.name), 'vi', { numeric: true, sensitivity: 'base' });
  }

  // Cùng nhóm phòng chữ: sắp xếp theo bảng chữ cái tiếng Việt
  return cleanText(a.name).localeCompare(cleanText(b.name), 'vi', { sensitivity: 'base' });
}

/**
 * Tự động xác định và sắp xếp danh sách các node vị trí ở cấp hiện tại
 */
export function sortLocationNodes(nodes, parentPath = '') {
  if (!Array.isArray(nodes) || nodes.length <= 1) return nodes || [];

  const pathSegments = cleanText(parentPath).split(/\s*>\s*/).filter(Boolean);
  const parentName = pathSegments[pathSegments.length - 1] || '';
  const parentNameLower = parentName.toLowerCase();

  // Kiểm tra đặc trưng của các node con
  const hasAreaNodes = nodes.some(n => isBaiXeLocation(n.name) || /^(khu|tòa|toa|block)\b/i.test(cleanText(n.name)) || n.type === 'AREA');
  const hasFloorNodes = nodes.some(n => /^(tầng|tang|lầu|lau|hầm|ham|trệt|tret)\b/i.test(cleanText(n.name)) || n.type === 'FLOOR');
  const isParentFloor = /^(tầng|tang|lầu|lau|hầm|ham|trệt|tret)\b/i.test(parentNameLower);
  const hasRoomTypes = nodes.some(n => n.type === 'ROOM');

  // 1. Cấp Tầng (Floors)
  if (hasFloorNodes) {
    return [...nodes].sort(compareFloorNodes);
  }

  // 2. Cấp Phòng (Rooms): Nếu cha là tầng, hoặc có type là ROOM, hoặc dưới bất kỳ cấp cha nào mà không phải Area/Floor
  if (isParentFloor || hasRoomTypes || (!hasAreaNodes && !hasFloorNodes && pathSegments.length > 0)) {
    return [...nodes].sort(compareRoomNodes);
  }

  // 3. Cấp Khu / Tòa / Bãi xe
  if (hasAreaNodes || pathSegments.length === 1) {
    return [...nodes].sort(compareAreaNodes);
  }

  // 4. Cấp Cơ sở hoặc fallback có Bãi xe
  if (nodes.some(n => isBaiXeLocation(n.name))) {
    return [...nodes].sort(compareAreaNodes);
  }

  return [...nodes].sort((a, b) => cleanText(a.name).localeCompare(cleanText(b.name), 'vi', { numeric: true, sensitivity: 'base' }));
}

/**
 * Hợp nhất và loại bỏ vị trí trùng lặp trong cây vị trí địa lý đa cấp:
 * - Chuẩn hóa tên (Unicode NFC, loại bỏ khoảng trắng ẩn/thừa)
 * - Gộp các node cùng tên ở cùng một cấp
 * - Hợp nhất danh sách children của các node trùng lặp một cách đệ quy
 * - Tự động sắp xếp các node ở mọi cấp (Bãi xe dưới Khu D, phòng số trước phòng chữ...)
 */
export function deduplicateAndMergeLocationTree(nodes, parentPath = '') {
  if (!Array.isArray(nodes)) return [];
  const map = new Map();

  nodes.forEach(rawNode => {
    if (!rawNode || !rawNode.name) return;
    const normName = cleanText(rawNode.name);
    if (!normName) return;
    const currentPath = parentPath ? `${parentPath} > ${normName}` : normName;
    const key = normName.toLowerCase();
    const safeId = `loc-${cleanText(currentPath).toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    if (!map.has(key)) {
      map.set(key, {
        ...rawNode,
        id: safeId,
        name: normName,
        code: cleanText(rawNode.code),
        children: Array.isArray(rawNode.children) ? [...rawNode.children] : []
      });
    } else {
      const existing = map.get(key);
      if (!existing.code && rawNode.code) existing.code = cleanText(rawNode.code);
      if (Array.isArray(rawNode.children) && rawNode.children.length > 0) {
        existing.children = [...existing.children, ...rawNode.children];
      }
    }
  });

  const merged = Array.from(map.values());
  merged.forEach(node => {
    const currentPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
    if (node.children && node.children.length > 0) {
      node.children = deduplicateAndMergeLocationTree(node.children, currentPath);
    }
  });

  // Tự động sắp xếp cây vị trí theo chuẩn logic:
  // - Bãi xe nằm ở vị trí phía dưới Khu D
  // - Phòng trong tầng: phòng số trước, phòng chữ sau
  return sortLocationNodes(merged, parentPath);
}

