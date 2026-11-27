// src/utils/inventorySlipHelper.js
// Tiện ích tự động hóa tạo Tem / Phiếu Kiểm Kê Tài Sản (kèm mã QR bên phải & tải PDF trực tiếp) theo mẫu chuẩn Trường CĐBK Nam Sài Gòn

import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { cleanText, canonicalStatus, isKhoaDepartment, removeVietnameseDiacritics } from './normalize.js';

export const SCHOOL_HEADER_TITLE = 'TRƯỜNG CĐBK NAM SÀI GÒN';
export const SLIP_SUBTITLE = 'TEM KIỂM KÊ TÀI SẢN';

/**
 * Từ điển viết tắt chuẩn cho các Phòng / Khoa / Đơn vị trong nhà trường
 */
const DEPARTMENT_SHORT_MAP = {
  'phong to chuc hanh chinh': 'P.TC-HC',
  'phong to chuc - hanh chinh': 'P.TC-HC',
  'phong hanh chinh quan tri': 'P.HC-QT',
  'phong hanh chinh - quan tri': 'P.HC-QT',
  'phong quan tri thiet bi': 'P.QT-TB',
  'phong quan tri - thiet bi': 'P.QT-TB',
  'phong quan tri thiet bi - co so vat chat': 'P.QTTB-CSVC',
  'phong quan tri thiet bi co so vat chat': 'P.QTTB-CSVC',
  'phong ke hoach tai chinh': 'P.KH-TC',
  'phong ke hoach - tai chinh': 'P.KH-TC',
  'phong quan ly dao tao': 'P.QLĐT',
  'phong hoc sinh - sinh vien': 'P.HS-SV',
  'phong hoc sinh sinh vien': 'P.HS-SV',
  'phong cong tac sinh vien': 'P.CTSV',
  'phong tuyen sinh': 'P.TS',
  'phong tuyen sinh - truyen thong': 'P.TS-TT',
  'phong khoa hoc cong nghe': 'P.KH-CN',
  'phong khoa hoc - cong nghe': 'P.KH-CN',
  'phong khao khi - dam bao chat luong': 'P.KK-ĐBCL',
  'phong khao khi dam bao chat luong': 'P.KK-ĐBCL',
  'phong khao thi - dam bao chat luong': 'P.KT-ĐBCL',
  'phong khao thi dam bao chat luong': 'P.KT-ĐBCL',
  'van phong doan': 'VP.Đoàn',
  'tram y te': 'Trạm Y tế',
  'hieu truong': 'Hiệu trưởng',
  'pho hieu truong 1': 'PHT 1',
  'pho hieu truong 2': 'PHT 2',
  'pho hieu truong 3': 'PHT 3',
  'khoa y duoc': 'K.YD',
  'khoa co khi': 'K.CK',
  'khoa co khi - dong luc': 'K.CK-ĐL',
  'khoa cong nghe thong tin - ki thuat dien': 'K.CNTT-KTĐ',
  'khoa cong nghe thong tin - ky thuat dien': 'K.CNTT-KTĐ',
  'khoa cong nghe thong tin': 'K.CNTT',
  'khoa dien - dien tu': 'K.Đ-ĐT',
  'khoa kinh te du lich': 'K.KT-DL',
  'khoa kinh te - du lich': 'K.KT-DL',
  'khoa cham soc sac dep - nuoi duong tre': 'K.CSSĐ-NDT',
  'khoa giao duc dai cuong': 'K.GDĐC',
  'trung tam thi nghiem thuc hanh': 'TT.TN-TH'
};

function toInitials(phrase) {
  const words = cleanText(phrase)
    .split(/\s+/)
    .filter(w => w && !['và', '&', 'của', 'ở', 'tại', 'thuộc'].includes(w.toLowerCase()));
  return words
    .map(w => {
      const firstChar = w.charAt(0).toUpperCase();
      return firstChar === 'Đ' || firstChar === 'đ' ? 'Đ' : firstChar;
    })
    .join('');
}

function abbreviateBody(body, splitFourWordsWithHyphen = false) {
  const cleaned = cleanText(body);
  if (!cleaned) return '';

  if (cleaned.includes('-')) {
    return cleaned
      .split(/\s*-\s*/)
      .filter(Boolean)
      .map(part => {
        if (/^\d+$/.test(part)) return part;
        return toInitials(part);
      })
      .join('-');
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (splitFourWordsWithHyphen && words.length === 4) {
    return `${toInitials(words.slice(0, 2).join(' '))}-${toInitials(words.slice(2, 4).join(' '))}`;
  }

  return toInitials(cleaned);
}

/**
 * Tự động chuyển tên Phòng / Khoa thành mã bộ phận ngắn gọn chuẩn mẫu phiếu
 * Ví dụ: "PHÒNG TỔ CHỨC HÀNH CHÍNH" -> "P.TC-HC"
 */
export function formatShortDepartment(deptName = '', deptCode = '') {
  const cleaned = cleanText(deptName);
  if (!cleaned) return '---';

  const lookupKey = removeVietnameseDiacritics(cleaned).toLowerCase().replace(/\s+/g, ' ');
  if (DEPARTMENT_SHORT_MAP[lookupKey]) {
    return DEPARTMENT_SHORT_MAP[lookupKey];
  }

  const cleanCode = cleanText(deptCode);
  if (
    cleanCode &&
    cleanCode.length >= 2 &&
    cleanCode.length <= 12 &&
    !/^(cs\s|co\s*so|phan\s*hieu|pb-\d+|loc-|dept-)/i.test(removeVietnameseDiacritics(cleanCode))
  ) {
    if (/^phong\b/i.test(lookupKey) && !/^p\./i.test(cleanCode)) {
      return `P.${cleanCode.toUpperCase()}`;
    }
    if (/^khoa\b/i.test(lookupKey) && !/^k\./i.test(cleanCode)) {
      return `K.${cleanCode.toUpperCase()}`;
    }
    return cleanCode;
  }

  if (/^(phòng|phong)\s+/i.test(cleaned)) {
    const rest = cleaned.replace(/^(phòng|phong)\s+/i, '');
    return `P.${abbreviateBody(rest, true)}`;
  }

  if (/^khoa\s+/i.test(cleaned) && !/^khoa\s+(học|hoc)\b/i.test(cleaned)) {
    const rest = cleaned.replace(/^khoa\s+/i, '');
    return `K.${abbreviateBody(rest, false)}`;
  }

  if (/^(trung tâm|trung tam)\s+/i.test(cleaned)) {
    const rest = cleaned.replace(/^(trung tâm|trung tam)\s+/i, '');
    return `TT.${abbreviateBody(rest, true)}`;
  }

  if (/^(văn phòng|van phong)\s+/i.test(cleaned)) {
    const rest = cleaned.replace(/^(văn phòng|van phong)\s+/i, '');
    const words = rest.split(/\s+/).filter(Boolean);
    if (words.length <= 2) {
      return `VP.${rest}`;
    }
    return `VP.${abbreviateBody(rest, false)}`;
  }

  if (/^(phó hiệu trưởng|pho hieu truong)/i.test(cleaned)) {
    const suffix = cleaned.replace(/^(phó hiệu trưởng|pho hieu truong)\s*/i, '');
    return suffix ? `PHT ${suffix}` : 'PHT';
  }

  if (cleaned.length <= 15) {
    return cleaned;
  }

  return abbreviateBody(cleaned, false);
}

/**
 * Trích xuất tên Cơ sở / Phân hiệu (cấp 1) từ đường dẫn vị trí tài sản
 * Ví dụ:
 * - "Cơ sở chính > KHU A > TẦNG 1 > A1.3" -> "Cơ sở chính"
 * - "Phân hiệu Bùi Minh Trực > KHU A > TẦNG TRỆT > A0.1" -> "Phân hiệu Bùi Minh Trực"
 */
export function extractCampusFromLocation(locationPath = '') {
  const cleaned = cleanText(locationPath);
  if (!cleaned || /chưa phân/i.test(cleaned)) return 'Chưa phân cơ sở';

  let parts = cleaned.split(/\s*>\s*/).map(p => cleanText(p)).filter(Boolean);
  if (parts.length === 0) {
    parts = cleaned.split(/\s*;\s*/).map(p => cleanText(p)).filter(Boolean);
  }
  if (parts.length === 0) return 'Chưa phân cơ sở';

  if (parts.length >= 2) {
    return parts[0];
  }

  if (/^(cơ sở|co so|phân hiệu|phan hieu)\b/i.test(parts[0])) {
    return parts[0];
  }

  return 'Cơ sở chính';
}

/**
 * Tự động trích xuất mã Vị trí / Phòng ngắn gọn từ đường dẫn vị trí 4 cấp (KHÔNG bao gồm tên cơ sở)
 * Ví dụ: "Cơ sở chính > KHU A > TẦNG 1 > A1.3" -> "A1.3"
 */
export function formatShortLocation(locationPath = '') {
  const cleaned = cleanText(locationPath);
  if (!cleaned || /chưa phân/i.test(cleaned)) return '---';

  let parts = cleaned.split(/\s*>\s*/).map(p => cleanText(p)).filter(Boolean);
  if (parts.length === 0) {
    parts = cleaned.split(/\s*;\s*/).map(p => cleanText(p)).filter(Boolean);
  }
  if (parts.length === 0) return '---';

  let leaf = parts[parts.length - 1];

  if (leaf.includes(' - ')) {
    leaf = cleanText(leaf.split(' - ')[0]);
  }

  const roomCodeMatch = leaf.match(/^(?:phòng|phong)\s+([A-Z0-9][A-Z0-9._-]*)$/i);
  if (roomCodeMatch) {
    return roomCodeMatch[1];
  }

  if (/^(phòng|phong)\s+/i.test(leaf) && leaf.length > 12) {
    leaf = leaf.replace(/^(phòng|phong)\s+/i, 'P. ');
  }

  return leaf || '---';
}

/**
 * Tạo chuỗi thời gian chuẩn kiểm kê đầu năm theo mẫu nhà trường
 */
export function formatInventoryTimestamp(year) {
  const y = Number(year) || new Date().getFullYear();
  return `00 giờ, ngày 01/01/${y}`;
}

/**
 * Tạo đường dẫn URL trực tiếp tới trang Chi Tiết Hồ Sơ Tài Sản khi quét Mã QR
 * - Khi chạy trên Vercel / tên miền thật: dùng đúng tên miền hiện tại (https://<domain>/?asset=<Mã_TS>)
 * - Khi đang xem thử trên máy tính localhost: tự động thay bằng địa chỉ IP mạng LAN để điện thoại cùng Wi-Fi quét mở được ngay!
 */
export function buildAssetProfileQrUrl(asset) {
  const identifier = cleanText(asset?.code || asset?.id || '');
  let origin = 'http://localhost:5173';

  if (typeof window !== 'undefined' && window.location?.origin) {
    const { protocol, hostname, port } = window.location;
    // eslint-disable-next-line no-undef
    const lanIp = typeof __APP_LAN_IP__ !== 'undefined' ? __APP_LAN_IP__ : '';
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && lanIp) {
      origin = `${protocol}//${lanIp}${port ? `:${port}` : ''}`;
    } else {
      origin = window.location.origin;
    }
  }

  return `${origin}/?card=${encodeURIComponent(identifier)}`;
}

// Bộ nhớ đệm DataURL ảnh mã QR theo nội dung phiếu để render tức thì (< 1ms) kể cả với đơn vị > 2.000 phiếu
const qrDataUrlCache = new Map();

/**
 * Tạo ảnh Mã QR sắc nét đồng bộ (PNG DataURL trên trình duyệt để hỗ trợ cả Web, In PDF, Word và Excel; SVG fallback trên Node)
 */
export function generateSlipQrDataUrl(qrText) {
  if (!qrText) return '';
  if (qrDataUrlCache.has(qrText)) {
    return qrDataUrlCache.get(qrText);
  }

  try {
    const qr = QRCode.create(qrText, { errorCorrectionLevel: 'L' });
    const size = qr.modules.size;
    const margin = 1;
    const scale = 5;
    const totalModules = size + margin * 2;
    const canvasSize = totalModules * scale;

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.fillStyle = '#000000';
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (qr.modules.get(r, c)) {
              ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
            }
          }
        }
        const pngUrl = canvas.toDataURL('image/png');
        qrDataUrlCache.set(qrText, pngUrl);
        return pngUrl;
      }
    }

    // Fallback SVG Data URI (khi chạy kiểm thử môi trường Node.js không có DOM)
    let paths = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qr.modules.get(r, c)) {
          paths += `M${c + margin},${r + margin}h1v1h-1z`;
        }
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${paths}" fill="#000"/></svg>`;
    const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    qrDataUrlCache.set(qrText, svgUrl);
    return svgUrl;
  } catch (err) {
    console.warn('QR generate error:', err);
    return '';
  }
}

/**
 * Tổng hợp danh sách lựa chọn theo cấu trúc: "Vị trí cơ sở - Phòng/Khoa"
 * tự động từ dữ liệu tài sản & danh mục phòng ban.
 */
export function buildCampusDepartmentOptions(assets = [], departments = []) {
  const deptMetaMap = new Map();
  (departments || []).forEach(d => {
    if (d?.name) {
      deptMetaMap.set(cleanText(d.name).toLowerCase(), d);
    }
  });

  const pairMap = new Map();
  const deptSeenInAssets = new Set();

  (assets || []).forEach(asset => {
    if (!asset) return;
    const st = canonicalStatus(asset.status);
    if (st === 'Đã thanh lý' || st === 'Mất') return;

    const deptName = cleanText(asset.departmentName);
    if (!deptName) return;

    const campus = extractCampusFromLocation(asset.locationPath);
    const normCampus = campus.toLowerCase();
    const normDept = deptName.toLowerCase();
    const pairKey = `${campus}|||${deptName}`;
    const lookupKey = `${normCampus}|||${normDept}`;

    deptSeenInAssets.add(normDept);

    if (!pairMap.has(lookupKey)) {
      const dObj = deptMetaMap.get(normDept);
      pairMap.set(lookupKey, {
        value: pairKey,
        campus,
        deptName,
        deptId: dObj?.id || cleanText(asset.departmentId) || '',
        deptShort: formatShortDepartment(deptName, dObj?.code || ''),
        label: `${campus} - ${deptName}`,
        assetCount: 0,
        slipCount: 0
      });
    }

    const entry = pairMap.get(lookupKey);
    entry.assetCount += 1;
    entry.slipCount += Math.max(1, Math.round(Number(asset.quantity) || 1));
  });

  // Xác định cơ sở mặc định cho các phòng ban mới tạo chưa có tài sản
  const existingCampuses = Array.from(new Set(Array.from(pairMap.values()).map(p => p.campus)));
  const defaultCampus =
    existingCampuses.find(c => /cơ sở chính|co so chinh|cơ sở 1/i.test(c)) ||
    existingCampuses[0] ||
    'Cơ sở chính';

  (departments || []).forEach(d => {
    const deptName = cleanText(d?.name);
    if (!deptName) return;
    const normDept = deptName.toLowerCase();
    if (!deptSeenInAssets.has(normDept)) {
      const lookupKey = `${defaultCampus.toLowerCase()}|||${normDept}`;
      pairMap.set(lookupKey, {
        value: `${defaultCampus}|||${deptName}`,
        campus: defaultCampus,
        deptName,
        deptId: d.id || '',
        deptShort: formatShortDepartment(deptName, d.code || ''),
        label: `${defaultCampus} - ${deptName}`,
        assetCount: 0,
        slipCount: 0
      });
    }
  });

  const getCampusRank = (campusName = '') => {
    const lower = removeVietnameseDiacritics(campusName).toLowerCase();
    if (lower.includes('co so chinh') || lower.includes('co so 1')) return 0;
    if (lower.startsWith('phan hieu') || lower.startsWith('co so')) return 1;
    return 2;
  };

  const allOptions = Array.from(pairMap.values()).sort((a, b) => {
    const rankA = getCampusRank(a.campus);
    const rankB = getCampusRank(b.campus);
    if (rankA !== rankB) return rankA - rankB;

    const campusCmp = a.campus.localeCompare(b.campus, 'vi', { sensitivity: 'base' });
    if (campusCmp !== 0) return campusCmp;

    // Trong cùng 1 cơ sở: Khối Phòng/Ban xếp trước, Khối Khoa xếp sau, sau đó theo bảng chữ cái
    const groupA = isKhoaDepartment(a.deptName) ? 1 : 0;
    const groupB = isKhoaDepartment(b.deptName) ? 1 : 0;
    if (groupA !== groupB) return groupA - groupB;

    return a.deptName.localeCompare(b.deptName, 'vi', { sensitivity: 'base' });
  });

  // Nhóm theo từng Cơ sở để hiển thị <optgroup> trực quan
  const campusGroupMap = new Map();
  allOptions.forEach(opt => {
    if (!campusGroupMap.has(opt.campus)) {
      campusGroupMap.set(opt.campus, []);
    }
    campusGroupMap.get(opt.campus).push(opt);
  });

  const campusGroups = Array.from(campusGroupMap.entries()).map(([campus, items]) => ({
    campus,
    totalSlips: items.reduce((sum, i) => sum + i.slipCount, 0),
    items
  }));

  return {
    options: allOptions,
    campusGroups
  };
}

/**
 * Giải mã giá trị được chọn từ dropdown "Vị trí cơ sở - Phòng/Khoa"
 * Hỗ trợ:
 * - "<Cơ sở>|||<Phòng/Khoa>" (chọn cụ thể 1 Cơ sở - Phòng/Khoa)
 * - "CAMPUS|||<Cơ sở>" (toàn bộ phòng/khoa tại 1 cơ sở)
 * - "ALL" (toàn trường)
 */
export function parseScopeSelection(selectionValue = '') {
  const raw = cleanText(selectionValue);
  if (!raw || raw === 'ALL') {
    return { mode: 'ALL', campus: 'ALL', deptName: 'ALL' };
  }
  if (raw.startsWith('CAMPUS|||')) {
    return {
      mode: 'CAMPUS',
      campus: cleanText(raw.slice('CAMPUS|||'.length)),
      deptName: 'ALL'
    };
  }
  if (raw.includes('|||')) {
    const [campusPart, deptPart] = raw.split('|||');
    return {
      mode: 'PAIR',
      campus: cleanText(campusPart),
      deptName: cleanText(deptPart)
    };
  }
  return {
    mode: 'DEPT_ONLY',
    campus: 'ALL',
    deptName: raw
  };
}

/**
 * Lọc, sắp xếp và nhân bản tự động danh sách phiếu kiểm kê kèm Mã QR bên phải:
 * - Mỗi tài sản có số lượng N sẽ tự động sinh ra đúng N phiếu kiểm kê
 * - Phiếu KHÔNG hiển thị tên cơ sở (chỉ hiển thị Bộ phận & Vị trí phòng như mẫu)
 * - Mã QR bên phải chứa đúng nội dung 5 dòng trên phiếu
 */
export function generateInventorySlips({
  assets = [],
  departments = [],
  selectedScope = '',
  selectedDept = '',
  inventoryYear = new Date().getFullYear(),
  selectedLocationPath = 'ALL'
}) {
  const yearNum = Number(inventoryYear) || new Date().getFullYear();
  const timeText = formatInventoryTimestamp(yearNum);
  const scope = parseScopeSelection(selectedScope || selectedDept);

  const deptById = new Map();
  const deptByName = new Map();
  (departments || []).forEach(d => {
    if (d?.id) deptById.set(cleanText(d.id).toLowerCase(), d);
    if (d?.name) deptByName.set(cleanText(d.name).toLowerCase(), d);
  });

  const normTargetCampus = cleanText(scope.campus).toLowerCase();
  const normTargetDept = cleanText(scope.deptName).toLowerCase();

  // 1. Lọc tài sản theo Cơ sở & Phòng/Khoa được chọn
  const matchedAssets = (assets || []).filter(asset => {
    if (!asset) return false;

    const status = canonicalStatus(asset.status);
    if (status === 'Đã thanh lý' || status === 'Mất') return false;

    if (asset.exportYear && Number(asset.exportYear) > 0 && Number(asset.exportYear) < yearNum) {
      return false;
    }

    // Lọc theo Cơ sở (nếu người dùng chọn Cơ sở - Phòng/Khoa hoặc Toàn Cơ sở)
    if (normTargetCampus && normTargetCampus !== 'all') {
      const assetCampus = extractCampusFromLocation(asset.locationPath).toLowerCase();
      if (assetCampus !== normTargetCampus) return false;
    }

    // Lọc theo Phòng / Khoa
    if (normTargetDept && normTargetDept !== 'all') {
      const aId = cleanText(asset.departmentId).toLowerCase();
      const aName = cleanText(asset.departmentName).toLowerCase();
      const targetDeptObj = deptById.get(normTargetDept) || deptByName.get(normTargetDept);

      if (targetDeptObj) {
        const tId = cleanText(targetDeptObj.id).toLowerCase();
        const tName = cleanText(targetDeptObj.name).toLowerCase();
        if (aId !== tId && aName !== tName) return false;
      } else if (aId !== normTargetDept && aName !== normTargetDept) {
        return false;
      }
    }

    // Lọc theo phòng/vị trí cụ thể nếu được chọn
    if (selectedLocationPath && selectedLocationPath !== 'ALL') {
      const aLoc = cleanText(asset.locationPath).toLowerCase();
      const targetLoc = cleanText(selectedLocationPath).toLowerCase();
      if (aLoc !== targetLoc) return false;
    }

    return true;
  });

  // 2. Sắp xếp tài sản theo cụm phòng/vị trí -> Mã TS tăng dần -> Tên TS
  const roomOrderMap = new Map();
  matchedAssets.forEach(a => {
    const locKey = cleanText(a.locationPath).toLowerCase() || '__none__';
    const codeStr = cleanText(a.code) || 'ZZZZ';
    const prevMin = roomOrderMap.get(locKey);
    if (!prevMin || codeStr.localeCompare(prevMin, 'vi', { numeric: true, sensitivity: 'base' }) < 0) {
      roomOrderMap.set(locKey, codeStr);
    }
  });

  const sortedAssets = [...matchedAssets].sort((a, b) => {
    if (!normTargetDept || normTargetDept === 'all') {
      const deptCmp = cleanText(a.departmentName).localeCompare(cleanText(b.departmentName), 'vi', { sensitivity: 'base' });
      if (deptCmp !== 0) return deptCmp;
    }

    const locA = cleanText(a.locationPath).toLowerCase() || '__none__';
    const locB = cleanText(b.locationPath).toLowerCase() || '__none__';
    if (locA !== locB) {
      const minCodeA = roomOrderMap.get(locA) || '';
      const minCodeB = roomOrderMap.get(locB) || '';
      const roomCodeCmp = minCodeA.localeCompare(minCodeB, 'vi', { numeric: true, sensitivity: 'base' });
      if (roomCodeCmp !== 0) return roomCodeCmp;
      return locA.localeCompare(locB, 'vi', { numeric: true, sensitivity: 'base' });
    }

    const codeCmp = cleanText(a.code).localeCompare(cleanText(b.code), 'vi', { numeric: true, sensitivity: 'base' });
    if (codeCmp !== 0) return codeCmp;

    return cleanText(a.name).localeCompare(cleanText(b.name), 'vi', { sensitivity: 'base' });
  });

  // 3. Nhân bản mỗi tài sản có số lượng SL thành đúng SL phiếu kiểm kê kèm Mã QR bên phải
  const slips = [];
  sortedAssets.forEach(asset => {
    const qty = Math.max(1, Math.round(Number(asset.quantity) || 1));
    const deptObj =
      deptById.get(cleanText(asset.departmentId).toLowerCase()) ||
      deptByName.get(cleanText(asset.departmentName).toLowerCase());

    const deptLabel = formatShortDepartment(
      asset.departmentName || deptObj?.name || '',
      deptObj?.code || ''
    );
    const locLabel = formatShortLocation(asset.locationPath);
    const assetName = cleanText(asset.name) || '---';

    const qrText = buildAssetProfileQrUrl(asset);
    const qrDataUrl = generateSlipQrDataUrl(qrText);

    for (let idx = 1; idx <= qty; idx++) {
      slips.push({
        slipIndex: slips.length + 1,
        copyIndex: idx,
        totalQuantity: qty,
        asset,
        assetId: asset.id,
        assetCode: cleanText(asset.code),
        assetName,
        departmentName: cleanText(asset.departmentName),
        deptLabel,
        locationPath: cleanText(asset.locationPath),
        locLabel,
        timeText,
        year: yearNum,
        qrText,
        qrDataUrl
      });
    }
  });

  return {
    slips,
    matchedAssets,
    timeText,
    year: yearNum
  };
}

/**
 * Tạo danh sách phiếu kiểm kê chuẩn (kèm Mã QR bên phải) cho 1 tài sản cụ thể
 * - Mặc định sinh đủ số phiếu theo đúng Số lượng (SL) của tài sản đó
 * - Dùng chung 100% mẫu phiếu 5 dòng, định dạng Bộ phận, Vị trí, Thời gian và Mã QR như trang Tạo Phiếu Kiểm Kê
 */
export function buildSingleAssetSlips({
  asset,
  departments = [],
  inventoryYear = new Date().getFullYear(),
  copyCount = null
}) {
  const yearNum = Number(inventoryYear) || new Date().getFullYear();
  const timeText = formatInventoryTimestamp(yearNum);

  if (!asset) {
    return {
      slips: [],
      timeText,
      year: yearNum,
      deptLabel: '---',
      locLabel: '---',
      totalQuantity: 0
    };
  }

  const aDeptId = cleanText(asset.departmentId).toLowerCase();
  const aDeptName = cleanText(asset.departmentName).toLowerCase();
  const deptObj = (departments || []).find(
    d =>
      (aDeptId && cleanText(d?.id).toLowerCase() === aDeptId) ||
      (aDeptName && cleanText(d?.name).toLowerCase() === aDeptName)
  );

  const deptLabel = formatShortDepartment(
    asset.departmentName || deptObj?.name || '',
    deptObj?.code || ''
  );
  const locLabel = formatShortLocation(asset.locationPath);
  const assetName = cleanText(asset.name) || '---';
  const totalQuantity = Math.max(1, Math.round(Number(asset.quantity) || 1));
  const copies =
    copyCount !== null && copyCount !== undefined
      ? Math.max(1, Math.round(Number(copyCount) || 1))
      : totalQuantity;

  const qrText = buildAssetProfileQrUrl(asset);
  const qrDataUrl = generateSlipQrDataUrl(qrText);

  const slips = [];
  for (let idx = 1; idx <= copies; idx++) {
    slips.push({
      slipIndex: idx,
      copyIndex: idx,
      totalQuantity,
      asset,
      assetId: asset.id,
      assetCode: cleanText(asset.code),
      assetName,
      departmentName: cleanText(asset.departmentName),
      deptLabel,
      locationPath: cleanText(asset.locationPath),
      locLabel,
      timeText,
      year: yearNum,
      qrText,
      qrDataUrl
    });
  }

  return {
    slips,
    timeText,
    year: yearNum,
    deptLabel,
    locLabel,
    totalQuantity
  };
}

/**
 * Chia danh sách phiếu thành từng hàng 3 cột để render bảng chuẩn mẫu
 */
export function chunkSlipsIntoRows(slips = [], columns = 3) {
  const rows = [];
  for (let i = 0; i < slips.length; i += columns) {
    const chunk = slips.slice(i, i + columns);
    while (chunk.length < columns) {
      chunk.push(null);
    }
    rows.push(chunk);
  }
  return rows;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Sinh mã HTML bảng 3 cột (mỗi phiếu gồm Nội dung bên trái + Mã QR bên phải, không hiện tên cơ sở)
 */
export function buildSlipsTableHtml(slips = []) {
  const rows = chunkSlipsIntoRows(slips, 3);
  if (rows.length === 0) return '';

  const renderCellContent = (slip) => {
    if (!slip) return '&nbsp;';

    const qrImgHtml = slip.qrDataUrl
      ? `<img src="${slip.qrDataUrl}" alt="QR" width="58" height="58" class="slip-qr-img" />`
      : '';

    return `
      <table class="slip-inner-layout" cellspacing="0" cellpadding="0">
        <tr>
          <td class="slip-inner-text">
            <div class="slip-school">${escapeHtml(SCHOOL_HEADER_TITLE)}</div>
            <div class="slip-subtitle">${escapeHtml(SLIP_SUBTITLE)}</div>
            <div class="slip-line">Thời gian: ${escapeHtml(slip.timeText)}</div>
            <div class="slip-line">Bộ phận: ${escapeHtml(slip.deptLabel)} ; Vị trí: ${escapeHtml(slip.locLabel)}</div>
            <div class="slip-line">Tên TS: <strong class="slip-asset-name">${escapeHtml(slip.assetName)}</strong> ; SL: ${slip.totalQuantity}</div>
          </td>
          <td class="slip-inner-qr">
            ${qrImgHtml}
          </td>
        </tr>
      </table>
    `;
  };

  const htmlRows = [];
  rows.forEach((row, rIdx) => {
    htmlRows.push(`
      <tr class="slip-content-row">
        <td class="slip-box">${renderCellContent(row[0])}</td>
        <td class="slip-col-gap">&nbsp;</td>
        <td class="slip-box">${renderCellContent(row[1])}</td>
        <td class="slip-col-gap">&nbsp;</td>
        <td class="slip-box">${renderCellContent(row[2])}</td>
      </tr>
    `);

    if (rIdx < rows.length - 1) {
      htmlRows.push(`
        <tr class="slip-row-gap">
          <td class="slip-gap-cell"></td>
          <td class="slip-gap-cross"></td>
          <td class="slip-gap-cell"></td>
          <td class="slip-gap-cross"></td>
          <td class="slip-gap-cell"></td>
        </tr>
      `);
    }
  });

  return `
    <table class="inventory-slip-sheet" cellspacing="0" cellpadding="0">
      <colgroup>
        <col style="width: 32.5%;" />
        <col style="width: 1.25%;" />
        <col style="width: 32.5%;" />
        <col style="width: 1.25%;" />
        <col style="width: 32.5%;" />
      </colgroup>
      <tbody>
        ${htmlRows.join('\n')}
      </tbody>
    </table>
  `;
}

const PRINT_AND_DOC_STYLES = `
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    margin: 0;
    padding: 0;
    color: #000000;
    background: #ffffff;
  }
  table.inventory-slip-sheet {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-family: 'Times New Roman', Times, serif;
    color: #000000;
  }
  table.inventory-slip-sheet > tbody > tr > td {
    border: 1px solid #000000;
  }
  tr.slip-content-row {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  td.slip-box {
    vertical-align: middle;
    padding: 4px 5px 5px 6px;
    font-size: 9pt;
    line-height: 1.35;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  table.slip-inner-layout {
    width: 100%;
    border-collapse: collapse;
    border: none;
  }
  table.slip-inner-layout td {
    border: none !important;
    padding: 0;
  }
  td.slip-inner-text {
    vertical-align: top;
    padding-right: 4px !important;
  }
  td.slip-inner-qr {
    width: 60px;
    vertical-align: middle;
    text-align: right;
  }
  img.slip-qr-img {
    width: 58px;
    height: 58px;
    display: block;
    margin-left: auto;
    image-rendering: pixelated;
  }
  td.slip-col-gap {
    padding: 0;
    font-size: 1pt;
    line-height: 1pt;
  }
  tr.slip-row-gap {
    height: 5px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  tr.slip-row-gap td {
    height: 5px;
    padding: 0;
    font-size: 1pt;
    line-height: 1pt;
  }
  .slip-school {
    text-align: center;
    font-weight: 700;
    font-size: 9pt;
    line-height: 1.18;
    text-transform: uppercase;
  }
  .slip-subtitle {
    text-align: center;
    font-weight: 400;
    font-size: 9pt;
    line-height: 1.2;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .slip-line {
    text-align: left;
    font-weight: 400;
    font-size: 8.8pt;
    line-height: 1.36;
    margin-top: 1px;
  }
  .slip-asset-name {
    font-weight: 700;
  }
  @media print {
    @page {
      size: A4 portrait;
      margin: 7mm 7mm;
    }
    body {
      margin: 0;
    }
  }
`;

/**
 * Mở cửa sổ in chuẩn A4 cho toàn bộ danh sách phiếu kiểm kê (có kèm mã QR bên phải)
 */
export function printInventorySlips(slips = [], title = 'Phiếu Kiểm Kê Tài Sản') {
  if (!slips || slips.length === 0) return;

  const tableHtml = buildSlipsTableHtml(slips);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>${PRINT_AND_DOC_STYLES}</style>
      </head>
      <body>
        ${tableHtml}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}

/**
 * Tải xuống file Excel (.xls) giữ nguyên khung viền, nội dung bên trái và Mã QR bên phải của từng phiếu
 */
export function exportSlipsToExcel(slips = [], fileName = 'Phieu_Kiem_Ke_Tai_San.xls') {
  if (!slips || slips.length === 0) return;
  const rows = chunkSlipsIntoRows(slips, 3);

  const excelRowsHtml = [];
  rows.forEach((row, rIdx) => {
    const lineTextCell = (slip, lineNo) => {
      const borderStyle =
        lineNo === 0
          ? 'border-top:.5pt solid #000000;border-left:.5pt solid #000000;'
          : lineNo === 4
          ? 'border-bottom:.5pt solid #000000;border-left:.5pt solid #000000;'
          : 'border-left:.5pt solid #000000;';

      if (!slip) {
        return `<td style="${borderStyle}">&nbsp;</td>`;
      }
      if (lineNo === 0) {
        return `<td style="${borderStyle}text-align:center;font-weight:bold;padding:2pt 3pt 0 4pt;">${escapeHtml(SCHOOL_HEADER_TITLE)}</td>`;
      }
      if (lineNo === 1) {
        return `<td style="${borderStyle}text-align:center;font-weight:normal;padding:0 3pt 2pt 4pt;">${escapeHtml(SLIP_SUBTITLE)}</td>`;
      }
      if (lineNo === 2) {
        return `<td style="${borderStyle}text-align:left;padding:1pt 3pt 1pt 5pt;">Thời gian: ${escapeHtml(slip.timeText)}</td>`;
      }
      if (lineNo === 3) {
        return `<td style="${borderStyle}text-align:left;padding:1pt 3pt 1pt 5pt;">Bộ phận: ${escapeHtml(slip.deptLabel)} ; Vị trí: ${escapeHtml(slip.locLabel)}</td>`;
      }
      return `<td style="${borderStyle}text-align:left;padding:1pt 3pt 3pt 5pt;">Tên TS: <b>${escapeHtml(slip.assetName)}</b> ; SL: ${slip.totalQuantity}</td>`;
    };

    const qrCell = (slip) => {
      const borderStyle = 'border-top:.5pt solid #000000;border-bottom:.5pt solid #000000;border-right:.5pt solid #000000;';
      if (!slip || !slip.qrDataUrl) {
        return `<td rowspan="5" style="${borderStyle}vertical-align:middle;text-align:center;">&nbsp;</td>`;
      }
      return `<td rowspan="5" style="${borderStyle}vertical-align:middle;text-align:center;padding:3pt;"><img src="${slip.qrDataUrl}" width="56" height="56" alt="QR" /></td>`;
    };

    const spacerColCell = (lineNo) => {
      const borderStyle =
        lineNo === 0
          ? 'border-top:.5pt solid #000000;border-left:.5pt solid #000000;border-right:.5pt solid #000000;'
          : lineNo === 4
          ? 'border-bottom:.5pt solid #000000;border-left:.5pt solid #000000;border-right:.5pt solid #000000;'
          : 'border-left:.5pt solid #000000;border-right:.5pt solid #000000;';
      return `<td style="${borderStyle}width:8pt;"></td>`;
    };

    for (let l = 0; l < 5; l++) {
      if (l === 0) {
        excelRowsHtml.push(`
          <tr style="height:15pt;">
            ${lineTextCell(row[0], 0)}
            ${qrCell(row[0])}
            ${spacerColCell(0)}
            ${lineTextCell(row[1], 0)}
            ${qrCell(row[1])}
            ${spacerColCell(0)}
            ${lineTextCell(row[2], 0)}
            ${qrCell(row[2])}
          </tr>
        `);
      } else {
        excelRowsHtml.push(`
          <tr style="height:${l === 4 ? '17pt' : '15pt'};">
            ${lineTextCell(row[0], l)}
            ${spacerColCell(l)}
            ${lineTextCell(row[1], l)}
            ${spacerColCell(l)}
            ${lineTextCell(row[2], l)}
          </tr>
        `);
      }
    }

    if (rIdx < rows.length - 1) {
      excelRowsHtml.push(`
        <tr style="height:4.5pt;">
          <td colspan="2" class="spacer-row">&nbsp;</td>
          <td class="spacer-row">&nbsp;</td>
          <td colspan="2" class="spacer-row">&nbsp;</td>
          <td class="spacer-row">&nbsp;</td>
          <td colspan="2" class="spacer-row">&nbsp;</td>
        </tr>
      `);
    }
  });

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Phieu Kiem Ke</x:Name>
                <x:WorksheetOptions>
                  <x:Print>
                    <x:ValidPrinterInfo/>
                    <x:PaperSizeIndex>9</x:PaperSizeIndex>
                  </x:Print>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4 portrait;
            margin: 0.28in 0.28in 0.28in 0.28in;
          }
          table {
            border-collapse: collapse;
            table-layout: fixed;
            font-family: 'Times New Roman', serif;
            font-size: 9pt;
          }
          td {
            font-family: 'Times New Roman', serif;
            font-size: 9pt;
            color: #000000;
            white-space: normal;
            word-wrap: break-word;
            mso-number-format: "\\@";
          }
          td.spacer-row {
            border: 0.5pt solid #000000;
            height: 4.5pt;
            font-size: 1pt;
          }
        </style>
      </head>
      <body>
        <table>
          <col width="180" />
          <col width="64" />
          <col width="10" />
          <col width="180" />
          <col width="64" />
          <col width="10" />
          <col width="180" />
          <col width="64" />
          ${excelRowsHtml.join('\n')}
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF', html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Tải xuống file Word (.doc) chuẩn khổ A4 có kèm Mã QR bên phải của từng phiếu
 */
export function exportSlipsToWord(slips = [], fileName = 'Phieu_Kiem_Ke_Tai_San.doc') {
  if (!slips || slips.length === 0) return;
  const tableHtml = buildSlipsTableHtml(slips);

  const wordHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <style>
          @page Section1 {
            size: 21cm 29.7cm;
            margin: 0.7cm 0.7cm 0.7cm 0.7cm;
          }
          div.Section1 {
            page: Section1;
          }
          ${PRINT_AND_DOC_STYLES}
        </style>
      </head>
      <body>
        <div class="Section1">
          ${tableHtml}
        </div>
      </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF', wordHtml], { type: 'application/msword;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Bộ nhớ đệm font tiếng Việt chuẩn Times (Tinos Regular & Bold) dưới dạng chuỗi Base64 cho jsPDF
let cachedPdfFontsPromise = null;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, sub);
  }
  return btoa(binary);
}

async function loadVietnameseSerifFonts() {
  if (!cachedPdfFontsPromise) {
    cachedPdfFontsPromise = Promise.all([
      fetch('/fonts/Tinos-Regular.ttf').then(res => {
        if (!res.ok) throw new Error('Không tải được font Tinos-Regular.ttf');
        return res.arrayBuffer();
      }),
      fetch('/fonts/Tinos-Bold.ttf').then(res => {
        if (!res.ok) throw new Error('Không tải được font Tinos-Bold.ttf');
        return res.arrayBuffer();
      })
    ])
      .then(([regBuf, boldBuf]) => ({
        regularBase64: arrayBufferToBase64(regBuf),
        boldBase64: arrayBufferToBase64(boldBuf)
      }))
      .catch(err => {
        cachedPdfFontsPromise = null;
        throw err;
      });
  }
  return cachedPdfFontsPromise;
}

/**
 * Tự động ngắt dòng cho câu có nhiều định dạng (thường + in đậm + thường) trong jsPDF
 * Ví dụ: "Tên TS: " (normal) + "Bàn làm việc (gỗ)" (bold) + " ; SL: 6" (normal)
 */
function wrapStyledSegments(doc, segments, maxWidthMm, fontFamily, fontSizePt) {
  doc.setFontSize(fontSizePt);

  // Tách thành các token từ + khoảng trắng giữ nguyên style
  const tokens = [];
  segments.forEach(seg => {
    const parts = String(seg.text || '').split(/(\s+)/);
    parts.forEach(p => {
      if (p.length > 0) {
        tokens.push({ text: p, style: seg.style || 'normal' });
      }
    });
  });

  const lines = [];
  let currentLine = [];
  let currentWidth = 0;

  tokens.forEach(tok => {
    doc.setFont(fontFamily, tok.style);
    const w = doc.getTextWidth(tok.text);

    // Bỏ qua khoảng trắng đầu dòng mới
    if (currentLine.length === 0 && /^\s+$/.test(tok.text)) {
      return;
    }

    if (currentLine.length > 0 && currentWidth + w > maxWidthMm) {
      lines.push(currentLine);
      if (/^\s+$/.test(tok.text)) {
        currentLine = [];
        currentWidth = 0;
      } else {
        currentLine = [{ ...tok, width: w }];
        currentWidth = w;
      }
    } else {
      currentLine.push({ ...tok, width: w });
      currentWidth += w;
    }
  });

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Tải trực tiếp file PDF (.pdf) chuẩn khổ A4 (3 cột, khung viền liền mạch, font chuẩn Times tiếng Việt & Mã QR bên phải)
 */
export async function exportSlipsToPdf(slips = [], fileName = 'Phieu_Kiem_Ke_Tai_San.pdf') {
  if (!slips || slips.length === 0) return;

  const { regularBase64, boldBase64 } = await loadVietnameseSerifFonts();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const FONT_FAMILY = 'TimesVN';
  doc.addFileToVFS('Tinos-Regular.ttf', regularBase64);
  doc.addFont('Tinos-Regular.ttf', FONT_FAMILY, 'normal');
  doc.addFileToVFS('Tinos-Bold.ttf', boldBase64);
  doc.addFont('Tinos-Bold.ttf', FONT_FAMILY, 'bold');

  // Kích thước trang A4 (210 x 297 mm) và bố cục 3 cột + 2 khe đệm dọc + khe đệm ngang chuẩn mẫu
  const pageH = 297;
  const marginX = 7.5;
  const marginY = 8.0;
  const usableW = 210 - marginX * 2; // 195 mm
  const spacerColW = 2.4; // 2 cột đệm = 4.8 mm
  const slipW = (usableW - spacerColW * 2) / 3; // 63.4 mm mỗi phiếu
  const spacerRowH = 1.5; // Khe đệm ngang giữa các hàng phiếu

  const padLeft = 1.8;
  const padRight = 1.3;
  const padTop = 1.7;
  const padBottom = 1.8;
  const qrSize = 15.6; // ~1.56 cm x 1.56 cm bên tay phải, rất dễ quét bằng camera điện thoại
  const qrGap = 1.2;
  const textAreaW = slipW - padLeft - padRight - qrSize - qrGap; // ~43.5 mm cho phần chữ bên trái

  const headerFontSize = 8.7;
  const bodyFontSize = 8.5;
  const lineStepMm = 3.65;
  const headerGapMm = 0.7;

  const rows = chunkSlipsIntoRows(slips, 3);

  // Tiền xử lý bố cục dòng chữ và chiều cao từng hàng để đảm bảo không bao giờ cắt đôi phiếu giữa 2 trang
  const preparedRows = rows.map(row => {
    const cells = row.map(slip => {
      if (!slip) return null;

      doc.setFont(FONT_FAMILY, 'bold');
      doc.setFontSize(headerFontSize);
      const schoolLines = doc.splitTextToSize(SCHOOL_HEADER_TITLE, textAreaW);

      doc.setFont(FONT_FAMILY, 'normal');
      doc.setFontSize(headerFontSize);
      const subLines = doc.splitTextToSize(SLIP_SUBTITLE, textAreaW);

      doc.setFont(FONT_FAMILY, 'normal');
      doc.setFontSize(bodyFontSize);
      const timeLines = doc.splitTextToSize(`Thời gian: ${slip.timeText}`, textAreaW);
      const deptLocLines = doc.splitTextToSize(
        `Bộ phận: ${slip.deptLabel} ; Vị trí: ${slip.locLabel}`,
        textAreaW
      );

      const assetRichLines = wrapStyledSegments(
        doc,
        [
          { text: 'Tên TS: ', style: 'normal' },
          { text: slip.assetName, style: 'bold' },
          { text: ` ; SL: ${slip.totalQuantity}`, style: 'normal' }
        ],
        textAreaW,
        FONT_FAMILY,
        bodyFontSize
      );

      const totalTextLines =
        schoolLines.length +
        subLines.length +
        timeLines.length +
        deptLocLines.length +
        assetRichLines.length;

      const textBlockH = totalTextLines * lineStepMm + headerGapMm;
      const neededH = Math.max(textBlockH + padTop + padBottom, qrSize + padTop + padBottom, 21.5);

      return {
        slip,
        schoolLines,
        subLines,
        timeLines,
        deptLocLines,
        assetRichLines,
        neededH
      };
    });

    const rowH = Math.max(
      21.5,
      ...cells.map(c => (c ? c.neededH : 21.5))
    );

    return { cells, rowH };
  });

  // Bản đồ alias ảnh QR để jsPDF chỉ lưu 1 bản ảnh QR duy nhất cho mỗi tài sản (giúp file PDF siêu nhẹ)
  const qrAliasMap = new Map();
  let qrAliasCounter = 0;

  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);
  doc.setLineWidth(0.22);

  const colX = [
    marginX,
    marginX + slipW + spacerColW,
    marginX + (slipW + spacerColW) * 2
  ];
  const spacerX = [
    marginX + slipW,
    marginX + slipW * 2 + spacerColW
  ];

  let curY = marginY;

  preparedRows.forEach((pRow, rIdx) => {
    const { cells, rowH } = pRow;

    // Sang trang A4 mới nếu hàng hiện tại vượt quá lề dưới
    if (curY + rowH > pageH - marginY) {
      doc.addPage();
      doc.setDrawColor(0, 0, 0);
      doc.setTextColor(0, 0, 0);
      doc.setLineWidth(0.22);
      curY = marginY;
    }

    // Vẽ khung viền 3 ô phiếu + 2 ô khe cột dọc đúng mẫu gốc
    colX.forEach(x => doc.rect(x, curY, slipW, rowH));
    spacerX.forEach(sx => doc.rect(sx, curY, spacerColW, rowH));

    // Vẽ nội dung chữ bên trái & Mã QR bên phải cho từng ô
    cells.forEach((cellData, cIdx) => {
      if (!cellData) return;
      const { slip, schoolLines, subLines, timeLines, deptLocLines, assetRichLines } = cellData;
      const cellLeft = colX[cIdx];
      const textLeft = cellLeft + padLeft;
      const textCenterX = textLeft + textAreaW / 2;

      let baselineY = curY + padTop + 2.9;

      // Dòng 1: TRƯỜNG CĐBK NAM SÀI GÒN (căn giữa, in đậm)
      doc.setFont(FONT_FAMILY, 'bold');
      doc.setFontSize(headerFontSize);
      schoolLines.forEach(line => {
        doc.text(line, textCenterX, baselineY, { align: 'center' });
        baselineY += lineStepMm;
      });

      // Dòng 2: TEM KIỂM KÊ TÀI SẢN (căn giữa, chữ thường)
      doc.setFont(FONT_FAMILY, 'normal');
      doc.setFontSize(headerFontSize);
      subLines.forEach(line => {
        doc.text(line, textCenterX, baselineY, { align: 'center' });
        baselineY += lineStepMm;
      });

      baselineY += headerGapMm;

      // Dòng 3: Thời gian
      doc.setFont(FONT_FAMILY, 'normal');
      doc.setFontSize(bodyFontSize);
      timeLines.forEach(line => {
        doc.text(line, textLeft, baselineY);
        baselineY += lineStepMm;
      });

      // Dòng 4: Bộ phận ; Vị trí
      deptLocLines.forEach(line => {
        doc.text(line, textLeft, baselineY);
        baselineY += lineStepMm;
      });

      // Dòng 5: Tên TS (in đậm tên TS) ; SL
      doc.setFontSize(bodyFontSize);
      assetRichLines.forEach(tokensLine => {
        let runX = textLeft;
        tokensLine.forEach(tok => {
          doc.setFont(FONT_FAMILY, tok.style);
          doc.text(tok.text, runX, baselineY);
          runX += tok.width;
        });
        baselineY += lineStepMm;
      });

      // Vẽ Mã QR nằm bên tay phải của phiếu (căn giữa theo chiều dọc của ô)
      const qrPng = generateSlipQrDataUrl(slip.qrText);
      if (qrPng && qrPng.startsWith('data:image/png')) {
        let alias = qrAliasMap.get(slip.qrText);
        if (!alias) {
          qrAliasCounter += 1;
          alias = `qr_${qrAliasCounter}`;
          qrAliasMap.set(slip.qrText, alias);
        }
        const qrX = cellLeft + slipW - padRight - qrSize;
        const qrY = curY + (rowH - qrSize) / 2;
        doc.addImage(qrPng, 'PNG', qrX, qrY, qrSize, qrSize, alias, 'FAST');
      }
    });

    // Kiểm tra xem hàng kế tiếp có còn nằm trên cùng trang A4 hiện tại không để vẽ dòng đệm ngang
    const nextRow = preparedRows[rIdx + 1];
    if (nextRow && curY + rowH + spacerRowH + nextRow.rowH <= pageH - marginY) {
      const gapY = curY + rowH;
      colX.forEach(x => doc.rect(x, gapY, slipW, spacerRowH));
      spacerX.forEach(sx => doc.rect(sx, gapY, spacerColW, spacerRowH));
      curY += rowH + spacerRowH;
    } else {
      curY += rowH;
    }
  });

  doc.save(fileName);
}
