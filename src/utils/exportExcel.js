// src/utils/exportExcel.js
import * as XLSX from 'xlsx';

export function exportToExcel(data, fileName = 'Bao_Cao_Tai_San.xlsx', sheetName = 'Danh sách') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Set basic column widths
  const colWidths = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(String(k).length + 4, 16) }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, fileName);
}

export function exportMultiSheetExcel(sheets, fileName = 'Mau_Nhap_Tai_San_Chuan.xlsx') {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, data, colWidths }) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    if (colWidths) {
      worksheet['!cols'] = colWidths;
    } else if (data && data.length > 0) {
      const keys = Object.keys(data[0] || {});
      worksheet['!cols'] = keys.map(k => ({ wch: Math.max(String(k).length + 4, 18) }));
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  XLSX.writeFile(workbook, fileName);
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Smart sheet selection: Look for data sheet if multiple sheets exist
        let targetSheetName = workbook.SheetNames[0];
        const preferredNames = [
          'DanhSach_NhapTaiSan',
          'Mau_Nhap_Tai_San',
          'MauTaiSan',
          'Danh sách',
          'DanhSach',
          'TaiSan',
          'Tài sản',
          'Data'
        ];
        const matched = workbook.SheetNames.find(s => preferredNames.includes(s));
        if (matched) {
          targetSheetName = matched;
        }

        const worksheet = workbook.Sheets[targetSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

