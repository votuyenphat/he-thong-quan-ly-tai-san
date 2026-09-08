// src/utils/exportExcel.js
import * as XLSX from 'xlsx';

export function exportToExcel(data, fileName = 'Bao_Cao_Tai_San.xlsx', sheetName = 'Danh sách') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Set basic column widths
  const colWidths = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length + 4, 16) }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, fileName);
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
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
