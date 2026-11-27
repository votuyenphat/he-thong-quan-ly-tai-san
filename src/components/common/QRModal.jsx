// src/components/common/QRModal.jsx
// Hộp thoại Tạo Phiếu Kiểm Kê & In Tem Mã QR cho từng tài sản trong Danh mục Tài sản
// Đồng bộ 100% mẫu phiếu 5 dòng + Mã QR bên phải + Xuất PDF / Word / Excel / In A4 như trang Tạo Phiếu Kiểm Kê

import React, { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import { useAssets } from '../../context/AssetContext';
import { generateAssetCardImageDataUrl } from '../../utils/assetCardImage';
import { cleanText, removeVietnameseDiacritics } from '../../utils/normalize';
import {
  SCHOOL_HEADER_TITLE,
  SLIP_SUBTITLE,
  buildSingleAssetSlips,
  chunkSlipsIntoRows,
  printInventorySlips,
  exportSlipsToExcel,
  exportSlipsToWord,
  exportSlipsToPdf
} from '../../utils/inventorySlipHelper';
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  CopyCheck,
  Sparkles,
  QrCode,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const SLIPS_PER_A4_PAGE = 18; // 6 hàng x 3 cột mỗi trang A4

export default function QRModal({ isOpen, onClose, asset }) {
  const { departments = [], inventorySessions = [] } = useAssets();

  const yearOptions = useMemo(() => {
    const baseYear = new Date().getFullYear();
    const set = new Set();
    for (let y = baseYear - 3; y <= baseYear + 4; y++) {
      set.add(y);
    }
    (inventorySessions || []).forEach(s => {
      if (s?.year && !isNaN(Number(s.year))) set.add(Number(s.year));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [inventorySessions]);

  const [inventoryYear, setInventoryYear] = useState(() => new Date().getFullYear());
  const [copyMode, setCopyMode] = useState('ALL'); // 'ALL' | 'SINGLE' | 'ROW3'
  const [viewMode, setViewMode] = useState('paged'); // 'paged' | 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [previewCardImgUrl, setPreviewCardImgUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCopyMode('ALL');
      setViewMode('paged');
      setCurrentPage(1);
      setPreviewCardImgUrl('');
    }
  }, [isOpen, asset?.id, asset?.code]);

  const assetQty = Math.max(1, Math.round(Number(asset?.quantity) || 1));

  const effectiveCopyCount = useMemo(() => {
    if (copyMode === 'SINGLE') return 1;
    if (copyMode === 'ROW3') return 3;
    return assetQty;
  }, [copyMode, assetQty]);

  const { slips, timeText, deptLabel, locLabel, totalQuantity } = useMemo(() => {
    return buildSingleAssetSlips({
      asset,
      departments,
      inventoryYear,
      copyCount: effectiveCopyCount
    });
  }, [asset, departments, inventoryYear, effectiveCopyCount]);

  const totalPages = Math.max(1, Math.ceil(slips.length / SLIPS_PER_A4_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedSlips = useMemo(() => {
    if (viewMode === 'all') return slips;
    const start = (safePage - 1) * SLIPS_PER_A4_PAGE;
    return slips.slice(start, start + SLIPS_PER_A4_PAGE);
  }, [slips, viewMode, safePage]);

  const previewRows = useMemo(() => {
    return chunkSlipsIntoRows(displayedSlips, 3);
  }, [displayedSlips]);

  if (!asset) return null;

  const getSafeFileBaseName = () => {
    const rawCode = removeVietnameseDiacritics(cleanText(asset.code || asset.name || 'Tai_San'))
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `Phieu_Kiem_Ke_${rawCode}_Nam_${inventoryYear}`;
  };

  const handlePreviewQrImage = async () => {
    const pngUrl = await generateAssetCardImageDataUrl(asset);
    setPreviewCardImgUrl(pngUrl);
  };

  const handleDownloadPdf = async () => {
    if (slips.length === 0 || isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      await exportSlipsToPdf(slips, `${getSafeFileBaseName()}.pdf`);
    } catch (err) {
      console.error('Lỗi xuất PDF phiếu kiểm kê tài sản:', err);
      alert('Không thể tạo file PDF. Vui lòng thử lại!');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintA4 = () => {
    const title = `Phiếu kiểm kê - ${cleanText(asset.code)} - ${cleanText(asset.name)} - Năm ${inventoryYear}`;
    printInventorySlips(slips, title);
  };

  const handleExportExcel = () => {
    exportSlipsToExcel(slips, `${getSafeFileBaseName()}.xls`);
  };

  const handleExportWord = () => {
    exportSlipsToWord(slips, `${getSafeFileBaseName()}.doc`);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title={`Tạo Phiếu Kiểm Kê & Tem Mã QR: ${asset.code}`}
        footer={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePreviewQrImage}
                title="Xem trước tấm hình ảnh thông tin tài sản hiện ra khi quét Mã QR"
                style={{ borderColor: '#93c5fd', color: '#1e3a8a', background: '#eff6ff' }}
              >
                <Eye size={15} color="#1e3a8a" />
                Xem Ảnh Khi Quét QR
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleExportWord}
                disabled={slips.length === 0}
                title="Tải về file Microsoft Word (.doc) kèm mã QR bên phải từng phiếu"
              >
                <FileText size={15} color="#2563eb" />
                Word (.doc)
              </button>

              <button
                type="button"
                className="btn btn-success"
                onClick={handleExportExcel}
                disabled={slips.length === 0}
                title="Tải về file Excel (.xls) giữ nguyên khung viền 3 cột và mã QR bên phải"
              >
                <FileSpreadsheet size={15} />
                Excel (.xls)
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePrintA4}
                disabled={slips.length === 0}
                title="Mở cửa sổ in trực tiếp ra máy in khổ A4"
              >
                <Printer size={15} color="#334155" />
                In A4
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownloadPdf}
                disabled={slips.length === 0 || isExportingPdf}
                title="Tải trực tiếp file định dạng PDF (.pdf) chuẩn khổ A4 về máy"
              >
                <Download size={15} />
                {isExportingPdf ? 'Đang tạo PDF...' : `Tải File PDF (${slips.length} Phiếu)`}
              </button>
            </div>
          </div>
        }
      >
        {/* Khung cấu hình Năm kiểm kê & Số lượng phiếu tạo */}
        <div
          style={{
            marginBottom: 16,
            padding: '14px 16px',
            borderRadius: 12,
            border: '1px solid #bfdbfe',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
              alignItems: 'end'
            }}
          >
            {/* Chọn Năm kiểm kê */}
            <div>
              <label
                className="form-label"
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1e3a8a', fontSize: '0.86rem' }}
              >
                <Calendar size={15} color="#1e3a8a" />
                1. Chọn Năm kiểm kê (*)
              </label>
              <select
                className="form-select"
                style={{
                  fontWeight: 700,
                  height: '40px',
                  borderColor: '#60a5fa',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer'
                }}
                value={inventoryYear}
                onChange={(e) => {
                  setInventoryYear(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {yearOptions.map(yr => (
                  <option key={yr} value={yr}>
                    Năm kiểm kê {yr} (01/01/{yr})
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Số lượng phiếu tạo */}
            <div>
              <label
                className="form-label"
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1e3a8a', fontSize: '0.86rem' }}
              >
                <CopyCheck size={15} color="#15803d" />
                2. Số lượng phiếu kiểm kê cần tạo
              </label>
              <select
                className="form-select"
                style={{
                  fontWeight: 600,
                  height: '40px',
                  borderColor: '#60a5fa',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer'
                }}
                value={copyMode}
                onChange={(e) => {
                  setCopyMode(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">
                  Đủ theo số lượng tài sản ({totalQuantity} phiếu)
                </option>
                {totalQuantity > 1 && (
                  <option value="SINGLE">Chỉ 1 phiếu lẻ (in bù tem rách/hỏng)</option>
                )}
                {totalQuantity !== 3 && (
                  <option value="ROW3">3 phiếu (vừa đủ 1 hàng ngang khổ A4)</option>
                )}
              </select>
            </div>
          </div>

          {/* Thanh thông tin tóm tắt tự động trên phiếu */}
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px dashed #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: '0.8rem',
              color: '#334155'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#dbeafe',
                color: '#1e40af',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '999px',
                fontSize: '0.75rem'
              }}
            >
              <Sparkles size={12} />
              Mẫu phiếu chuẩn
            </span>
            <span>
              Mốc thời gian: <strong>{timeText}</strong>
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span>
              Bộ phận: <strong style={{ color: '#1e3a8a' }}>{deptLabel}</strong> ; Vị trí:{' '}
              <strong style={{ color: '#1e3a8a' }}>{locLabel}</strong>
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#0f766e', fontWeight: 600 }}>
              <QrCode size={13} />
              Bấm vào Mã QR để xem thử hình ảnh khi quét
            </span>
          </div>
        </div>

        {/* Bản xem trước trang giấy A4 (chuẩn 3 cột như trang Tạo Phiếu Kiểm Kê) */}
        <div
          style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: 12,
            padding: 14
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Eye size={16} color="#1e3a8a" />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                Bản Xem Trước Phiếu Kiểm Kê (Chuẩn Khổ A4 - 3 Cột - Có Mã QR Bên Phải)
              </span>
            </div>

            {slips.length > SLIPS_PER_A4_PAGE && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: 2,
                    border: '1px solid #cbd5e1'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('paged')}
                    style={{
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 9px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: viewMode === 'paged' ? '#1e3a8a' : 'transparent',
                      color: viewMode === 'paged' ? '#ffffff' : '#475569'
                    }}
                  >
                    Theo trang A4 ({SLIPS_PER_A4_PAGE}/trang)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    style={{
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 9px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: viewMode === 'all' ? '#1e3a8a' : 'transparent',
                      color: viewMode === 'all' ? '#ffffff' : '#475569'
                    }}
                  >
                    Xem toàn bộ ({slips.length})
                  </button>
                </div>

                {viewMode === 'paged' && totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      {safePage}/{totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div
              style={{
                background: '#ffffff',
                minWidth: '740px',
                margin: '0 auto',
                padding: '16px 14px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.07)',
                border: '1px solid #cbd5e1'
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  tableLayout: 'fixed',
                  fontFamily: "'Times New Roman', Times, serif",
                  color: '#000000',
                  background: '#ffffff'
                }}
              >
                <colgroup>
                  <col style={{ width: '32.5%' }} />
                  <col style={{ width: '1.25%' }} />
                  <col style={{ width: '32.5%' }} />
                  <col style={{ width: '1.25%' }} />
                  <col style={{ width: '32.5%' }} />
                </colgroup>
                <tbody>
                  {previewRows.map((row, rIdx) => (
                    <React.Fragment key={rIdx}>
                      <tr style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                        {[0, 1, 2].map((colIdx) => {
                          const slip = row[colIdx];
                          return (
                            <React.Fragment key={colIdx}>
                              <td
                                style={{
                                  border: '1px solid #000000',
                                  verticalAlign: 'middle',
                                  padding: '5px 6px 6px 8px',
                                  fontSize: '12px',
                                  lineHeight: 1.38,
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word'
                                }}
                              >
                                {slip ? (
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: 6
                                    }}
                                  >
                                    {/* Bên trái: Nội dung 5 dòng chuẩn mẫu phiếu kiểm kê */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div
                                        style={{
                                          textAlign: 'center',
                                          fontWeight: 700,
                                          fontSize: '12px',
                                          lineHeight: 1.2,
                                          textTransform: 'uppercase'
                                        }}
                                      >
                                        {SCHOOL_HEADER_TITLE}
                                      </div>
                                      <div
                                        style={{
                                          textAlign: 'center',
                                          fontWeight: 400,
                                          fontSize: '12px',
                                          lineHeight: 1.22,
                                          textTransform: 'uppercase',
                                          marginBottom: '4px'
                                        }}
                                      >
                                        {SLIP_SUBTITLE}
                                      </div>
                                      <div style={{ textAlign: 'left', fontWeight: 400, lineHeight: 1.4 }}>
                                        Thời gian: {slip.timeText}
                                      </div>
                                      <div style={{ textAlign: 'left', fontWeight: 400, lineHeight: 1.4 }}>
                                        Bộ phận: {slip.deptLabel} ; Vị trí: {slip.locLabel}
                                      </div>
                                      <div style={{ textAlign: 'left', fontWeight: 400, lineHeight: 1.4 }}>
                                        Tên TS: <strong style={{ fontWeight: 700 }}>{slip.assetName}</strong> ; SL:{' '}
                                        {slip.totalQuantity}
                                      </div>
                                    </div>

                                    {/* Bên phải: Mã QR quét hiển thị 1 hình ảnh thông tin tài sản */}
                                    {slip.qrDataUrl && (
                                      <div
                                        onClick={handlePreviewQrImage}
                                        style={{
                                          flexShrink: 0,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer'
                                        }}
                                        title={`Bấm để xem thử hình ảnh thông tin tài sản (${slip.assetCode}) hiển thị khi quét QR`}
                                      >
                                        <img
                                          src={slip.qrDataUrl}
                                          alt={`QR ${slip.assetName}`}
                                          style={{
                                            width: 58,
                                            height: 58,
                                            display: 'block',
                                            imageRendering: 'pixelated'
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span>&nbsp;</span>
                                )}
                              </td>

                              {colIdx < 2 && (
                                <td
                                  style={{
                                    border: '1px solid #000000',
                                    padding: 0,
                                    fontSize: '1px',
                                    lineHeight: '1px'
                                  }}
                                >
                                  &nbsp;
                                </td>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tr>

                      {rIdx < previewRows.length - 1 && (
                        <tr style={{ height: '6px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                          <td style={{ border: '1px solid #000000', height: '6px', padding: 0, fontSize: '1px', lineHeight: '1px' }} />
                          <td style={{ border: '1px solid #000000', height: '6px', padding: 0, fontSize: '1px', lineHeight: '1px' }} />
                          <td style={{ border: '1px solid #000000', height: '6px', padding: 0, fontSize: '1px', lineHeight: '1px' }} />
                          <td style={{ border: '1px solid #000000', height: '6px', padding: 0, fontSize: '1px', lineHeight: '1px' }} />
                          <td style={{ border: '1px solid #000000', height: '6px', padding: 0, fontSize: '1px', lineHeight: '1px' }} />
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Hộp xem thử đúng bức ảnh PNG độc lập sẽ hiện ra trên điện thoại khi quét Mã QR */}
      {previewCardImgUrl && (
        <div
          onClick={() => setPreviewCardImgUrl('')}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'zoom-out'
          }}
        >
          <div style={{ color: '#e2e8f0', fontSize: '0.85rem', marginBottom: 10, fontWeight: 600 }}>
            Hình ảnh hiển thị khi quét Mã QR ({asset.code}) — Nhấn bất kỳ đâu để đóng
          </div>
          <img
            src={previewCardImgUrl}
            alt={`Hình ảnh tài sản ${asset.code}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '86vh',
              maxWidth: '94vw',
              width: 'auto',
              height: 'auto',
              borderRadius: '8px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          />
        </div>
      )}
    </>
  );
}
