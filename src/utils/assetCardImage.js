// src/utils/assetCardImage.js
// Bộ kết xuất 1 hình ảnh PNG chất lượng cao duy nhất chứa đầy đủ thông tin Danh mục Hồ sơ Tài sản khi quét Mã QR

import schoolLogoUrl from '../assets/logo.png';
import { formatVND } from './formatters.js';
import { cleanText, canonicalCondition, canonicalStatus } from './normalize.js';

let cachedLogoPromise = null;

function loadSchoolLogo() {
  if (!cachedLogoPromise) {
    cachedLogoPromise = new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Thử nạp dự phòng từ /logo.png nếu đường dẫn bundle gặp sự cố
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => resolve(null);
        fallback.src = `/logo.png?v=${Date.now()}`;
      };
      img.src = schoolLogoUrl;
    });
  }
  return cachedLogoPromise;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, maxWidth) {
  const str = cleanText(text) || '---';
  const words = str.split(/\s+/);
  const lines = [];
  let curLine = '';

  words.forEach(word => {
    const candidate = curLine ? `${curLine} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      curLine = candidate;
    } else {
      if (curLine) lines.push(curLine);
      curLine = word;
    }
  });

  if (curLine) lines.push(curLine);
  return lines.length > 0 ? lines : ['---'];
}

function getConditionColors(condition) {
  const c = canonicalCondition(condition);
  if (c === 'Tốt') return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
  if (c === 'Khá') return { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' };
  if (c === 'Hỏng nhẹ') return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };
  return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
}

function getStatusColors(status) {
  const s = canonicalStatus(status);
  if (s === 'Đang sử dụng') return { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' };
  if (s === 'Trong kho') return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
  if (s === 'Điều chuyển') return { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' };
  return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' };
}

/**
 * Vẽ toàn bộ thông tin Danh mục Hồ sơ Tài sản thành 1 hình ảnh PNG sắc nét (Data URL)
 */
export async function generateAssetCardImageDataUrl(asset) {
  if (!asset || typeof document === 'undefined') return '';

  const logoImg = await loadSchoolLogo();

  const W = 1080; // Độ phân giải chuẩn HD sắc nét trên mọi màn hình điện thoại & máy tính
  const PAD_X = 44;
  const CONTENT_W = W - PAD_X * 2;
  const FONT = "'Inter', 'Segoe UI', Arial, sans-serif";

  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d');

  const code = cleanText(asset.code) || '---';
  const name = cleanText(asset.name) || '---';
  const type = cleanText(asset.type) || '---';
  const brand = cleanText(asset.brand) || '---';
  const qty = Math.max(1, Number(asset.quantity) || 1);
  const unit = cleanText(asset.unit) || 'Cái';
  const unitCost = Number(asset.cost) || 0;
  const totalCost = unitCost * qty;
  const importYear =
    asset.importYear ||
    asset.purchaseYear ||
    (asset.purchaseDate ? String(asset.purchaseDate).slice(0, 4) : '---');
  const exportYearText = asset.exportYear ? String(asset.exportYear) : 'Chưa xuất (Đang quản lý)';
  const lifespanText = asset.lifespanYears ? `${asset.lifespanYears} năm` : 'Vô hạn (Không giới hạn)';
  const fundingSource = cleanText(asset.fundingSource) || '---';
  const deptName = cleanText(asset.departmentName) || '---';
  const locationPath = cleanText(asset.locationPath) || '---';
  const responsiblePerson = cleanText(asset.responsiblePerson) || '---';
  const currentUser = cleanText(asset.currentUser) || '---';
  const condition = canonicalCondition(asset.condition) || cleanText(asset.condition) || 'Tốt';
  const status = canonicalStatus(asset.status) || cleanText(asset.status) || 'Đang sử dụng';
  const trainingSuitability = cleanText(asset.trainingSuitability) || 'Phù hợp đào tạo';
  const maintenanceStatus = cleanText(asset.maintenanceStatus) || 'Bình thường';
  const technicalSpecs = cleanText(asset.technicalSpecs) || 'Chưa có thông số kỹ thuật chi tiết';
  const notes = cleanText(asset.notes) || 'Không có ghi chú thêm';

  mCtx.font = `800 34px ${FONT}`;
  const titleLines = wrapCanvasText(mCtx, name, CONTENT_W - 10);

  const colGap = 24;
  const halfW = (CONTENT_W - colGap) / 2;
  const cellInnerW = halfW - 36;
  const fullCellInnerW = CONTENT_W - 36;

  const measureFieldRows = (rows) => {
    return rows.map(row => {
      if (row.fullWidth) {
        mCtx.font = `${row.bold ? '700' : '600'} 21px ${FONT}`;
        const lines = wrapCanvasText(mCtx, row.value, fullCellInnerW);
        const h = Math.max(82, 44 + lines.length * 28 + 14);
        return { ...row, lines, rowH: h };
      }

      mCtx.font = `${row.left.bold ? '700' : '600'} 21px ${FONT}`;
      const leftLines = wrapCanvasText(mCtx, row.left.value, cellInnerW);
      mCtx.font = `${row.right.bold ? '700' : '600'} 21px ${FONT}`;
      const rightLines = wrapCanvasText(mCtx, row.right.value, cellInnerW);
      const maxLines = Math.max(leftLines.length, rightLines.length);
      const h = Math.max(84, 44 + maxLines * 28 + 14);
      return {
        ...row,
        leftLines,
        rightLines,
        rowH: h
      };
    });
  };

  // Nhóm 1: Thông tin chung danh mục tài sản
  const generalRows = measureFieldRows([
    {
      left: { label: 'LOẠI TÀI SẢN', value: type, color: '#0f172a' },
      right: { label: 'NHÃN HIỆU / HÃNG SẢN XUẤT', value: brand, color: '#0f172a' }
    },
    {
      left: { label: 'SỐ LƯỢNG & ĐƠN VỊ TÍNH', value: `${qty} ${unit}`, color: '#1e3a8a', bold: true },
      right: {
        label: qty > 1 ? 'TỔNG GIÁ TRỊ (ĐƠN GIÁ)' : 'NGUYÊN GIÁ (VNĐ)',
        value: qty > 1 ? `${formatVND(totalCost)} (${formatVND(unitCost)} / ${unit.toLowerCase()})` : formatVND(totalCost),
        color: '#059669',
        bold: true
      }
    },
    {
      left: { label: 'NĂM NHẬP KHO', value: String(importYear), color: '#0f172a' },
      right: {
        label: 'NĂM XUẤT KHO',
        value: exportYearText,
        color: asset.exportYear ? '#ea580c' : '#15803d'
      }
    },
    {
      left: { label: 'THỜI HẠN SỬ DỤNG', value: lifespanText, color: '#0f172a' },
      right: { label: 'NGUỒN KINH PHÍ', value: fundingSource, color: '#0f172a' }
    }
  ]);

  // Nhóm 2: Đơn vị quản lý & Vị trí
  const locationRows = measureFieldRows([
    {
      fullWidth: true,
      label: 'PHÒNG / KHOA QUẢN LÝ',
      value: deptName,
      color: '#1e3a8a',
      bold: true
    },
    {
      fullWidth: true,
      label: 'VỊ TRÍ VẬT LÝ CỤ THỂ',
      value: locationPath,
      color: '#2563eb',
      bold: true
    },
    {
      left: { label: 'NGƯỜI CHỊU TRÁCH NHIỆM', value: responsiblePerson, color: '#0f172a' },
      right: { label: 'NGƯỜI SỬ DỤNG TRỰC TIẾP', value: currentUser, color: '#059669', bold: true }
    }
  ]);

  // Nhóm 3: Kỹ thuật, đào tạo & Ghi chú
  const techRows = measureFieldRows([
    {
      left: { label: 'ĐÁNH GIÁ PHÙ HỢP ĐÀO TẠO', value: trainingSuitability, color: '#15803d', bold: true },
      right: { label: 'TÌNH TRẠNG BẢO TRÌ / SỬA CHỮA', value: maintenanceStatus, color: '#0f172a' }
    },
    {
      fullWidth: true,
      label: 'CẤU HÌNH / THÔNG SỐ KỸ THUẬT',
      value: technicalSpecs,
      color: '#334155'
    },
    {
      fullWidth: true,
      label: 'GHI CHÚ HỒ SƠ',
      value: notes,
      color: '#475569'
    }
  ]);

  const sumHeight = (rows) => rows.reduce((acc, r) => acc + r.rowH + 12, 0);

  const headerH = 156;
  const identityBlockH = 48 + titleLines.length * 44 + 62;
  const secTitleH = 44;
  const secGap = 24;
  const footerH = 74;

  const totalH =
    headerH +
    28 +
    identityBlockH +
    secGap +
    secTitleH +
    sumHeight(generalRows) +
    secGap +
    secTitleH +
    sumHeight(locationRows) +
    secGap +
    secTitleH +
    sumHeight(techRows) +
    24 +
    footerH;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  // Nền trắng toàn bộ thẻ ảnh
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, totalH);

  // 1. BANNER THƯƠNG HIỆU NHÀ TRƯỜNG KÈM LOGO MỚI NHẤT
  const bannerGrad = ctx.createLinearGradient(0, 0, W, headerH);
  bannerGrad.addColorStop(0, '#0f172a');
  bannerGrad.addColorStop(0.55, '#1e3a8a');
  bannerGrad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = bannerGrad;
  ctx.fillRect(0, 0, W, headerH);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, headerH - 5, W, 5);

  // Vẽ Logo mới nhất của Trường CĐBK Nam Sài Gòn trong vòng tròn trắng sắc nét
  const logoR = 50;
  const logoCenterX = PAD_X + logoR;
  const logoCenterY = (headerH - 5) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(logoCenterX, logoCenterY, logoR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  if (logoImg) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.beginPath();
    ctx.arc(logoCenterX, logoCenterY, logoR - 3, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      logoImg,
      logoCenterX - (logoR - 3),
      logoCenterY - (logoR - 3),
      (logoR - 3) * 2,
      (logoR - 3) * 2
    );
    ctx.restore();
  }

  const headerTextX = PAD_X + logoR * 2 + 24;
  ctx.fillStyle = '#93c5fd';
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText('TRƯỜNG CAO ĐẲNG BÁCH KHOA NAM SÀI GÒN', headerTextX, 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText('THÔNG TIN HỒ SƠ DANH MỤC TÀI SẢN', headerTextX, 102);

  // 2. KHỐI ĐỊNH DANH TÀI SẢN & NHÃN TÌNH TRẠNG / TRẠNG THÁI
  let curY = headerH + 28;

  drawRoundedRect(ctx, PAD_X, curY, CONTENT_W, identityBlockH, 16);
  ctx.fillStyle = '#eff6ff';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#bfdbfe';
  ctx.stroke();

  ctx.fillStyle = '#1d4ed8';
  ctx.font = `800 18px ${FONT}`;
  ctx.fillText(`MÃ ĐỊNH DANH TÀI SẢN: ${code}`, PAD_X + 24, curY + 34);

  ctx.fillStyle = '#0f172a';
  ctx.font = `800 34px ${FONT}`;
  let titleY = curY + 78;
  titleLines.forEach(line => {
    ctx.fillText(line, PAD_X + 24, titleY);
    titleY += 44;
  });

  const drawBadgePill = (label, colors, startX, pillY) => {
    ctx.font = `700 18px ${FONT}`;
    const textW = ctx.measureText(label).width;
    const pillW = textW + 32;
    const pillH = 38;
    drawRoundedRect(ctx, startX, pillY, pillW, pillH, 19);
    ctx.fillStyle = colors.bg;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = colors.border;
    ctx.stroke();
    ctx.fillStyle = colors.text;
    ctx.fillText(label, startX + 16, pillY + 25);
    return startX + pillW + 14;
  };

  const badgeY = titleY - 14;
  const nextPillX = drawBadgePill(`Tình trạng: ${condition}`, getConditionColors(condition), PAD_X + 24, badgeY);
  drawBadgePill(`Trạng thái: ${status}`, getStatusColors(status), nextPillX, badgeY);

  curY += identityBlockH + secGap;

  const drawSectionHeader = (title) => {
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(PAD_X, curY + 6, 6, 24);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = `800 21px ${FONT}`;
    ctx.fillText(title, PAD_X + 16, curY + 26);
    curY += secTitleH;
  };

  const drawFieldBox = (x, y, w, h, label, lines, valueColor, isBold) => {
    drawRoundedRect(ctx, x, y, w, h, 12);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = `700 15px ${FONT}`;
    ctx.fillText(label, x + 18, y + 28);

    ctx.fillStyle = valueColor || '#0f172a';
    ctx.font = `${isBold ? '700' : '600'} 21px ${FONT}`;
    let lineY = y + 58;
    lines.forEach(line => {
      ctx.fillText(line, x + 18, lineY);
      lineY += 28;
    });
  };

  const drawRowsList = (rows) => {
    rows.forEach(r => {
      if (r.fullWidth) {
        drawFieldBox(PAD_X, curY, CONTENT_W, r.rowH, r.label, r.lines, r.color, r.bold);
      } else {
        drawFieldBox(PAD_X, curY, halfW, r.rowH, r.left.label, r.leftLines, r.left.color, r.left.bold);
        drawFieldBox(
          PAD_X + halfW + colGap,
          curY,
          halfW,
          r.rowH,
          r.right.label,
          r.rightLines,
          r.right.color,
          r.right.bold
        );
      }
      curY += r.rowH + 12;
    });
  };

  // 3. VẼ 3 PHẦN THÔNG TIN ĐẦY ĐỦ
  drawSectionHeader('I. THÔNG TIN CHUNG DANH MỤC TÀI SẢN');
  drawRowsList(generalRows);

  curY += secGap - 12;
  drawSectionHeader('II. ĐƠN VỊ QUẢN LÝ & VỊ TRÍ ĐẶT TÀI SẢN');
  drawRowsList(locationRows);

  curY += secGap - 12;
  drawSectionHeader('III. ĐÁNH GIÁ KỸ THUẬT & GHI CHÚ HỒ SƠ');
  drawRowsList(techRows);

  // 4. CHÂN TRANG HÌNH ẢNH
  const footerY = totalH - footerH;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, footerY, W, footerH);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, footerY, W, 1);

  const now = new Date();
  const pad2 = n => String(n).padStart(2, '0');
  const dateStr = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;

  ctx.fillStyle = '#475569';
  ctx.font = `600 17px ${FONT}`;
  ctx.fillText('Phiếu hình ảnh trích xuất từ Danh mục Tài sản — Trường CĐBK Nam Sài Gòn', PAD_X, footerY + 43);

  ctx.fillStyle = '#64748b';
  ctx.font = `600 17px ${FONT}`;
  const rightFooter = `Ngày tra cứu: ${dateStr}`;
  const rfW = ctx.measureText(rightFooter).width;
  ctx.fillText(rightFooter, W - PAD_X - rfW, footerY + 43);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, totalH - 2);

  return canvas.toDataURL('image/png');
}
