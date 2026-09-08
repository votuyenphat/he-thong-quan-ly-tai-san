// src/utils/formatters.js

export function formatVND(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

export function generateAssetCode(prefix = 'TS', existingAssets = []) {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `${prefix}-${currentYear}-`;
  
  let maxNum = 0;
  existingAssets.forEach(a => {
    if (a.code && a.code.startsWith(yearPrefix)) {
      const numPart = parseInt(a.code.replace(yearPrefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });

  const nextNum = String(maxNum + 1).padStart(4, '0');
  return `${yearPrefix}${nextNum}`;
}

export function generateTransferCode(existingTransfers = []) {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `PDC-${dateStr}-`;
  const count = (existingTransfers.length + 1).toString().padStart(3, '0');
  return `${prefix}${count}`;
}

export function generateLiquidationCode(existing = []) {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `PTL-${dateStr}-`;
  const count = (existing.length + 1).toString().padStart(3, '0');
  return `${prefix}${count}`;
}

export function generateRecallCode(existing = []) {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `PTH-${dateStr}-`;
  const count = (existing.length + 1).toString().padStart(3, '0');
  return `${prefix}${count}`;
}
