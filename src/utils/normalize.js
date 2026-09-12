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
