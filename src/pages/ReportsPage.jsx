// src/pages/ReportsPage.jsx
import React, { useState, useMemo } from 'react';
import { useAssets } from '../context/AssetContext';
import { exportToExcel } from '../utils/exportExcel';
import { printElement } from '../utils/printHelpers';
import { formatVND, formatDate } from '../utils/formatters';
import {
  FileSpreadsheet,
  Printer,
  FileText,
  Filter,
  CheckCircle,
  Building,
  Calendar,
  Layers
} from 'lucide-react';

export default function ReportsPage() {
  const { assets, departments, transfers, recalls, liquidations } = useAssets();

  const [selectedReportType, setSelectedReportType] = useState('1'); // 1 to 11
  const [selectedDept, setSelectedDept] = useState('ALL');

  const reportDefinitions = [
    { id: '1', name: '1. Báo cáo tài sản toàn trường', desc: 'Bảng tổng hợp danh mục toàn bộ tài sản cố định trong toàn trường' },
    { id: '2', name: '2. Báo cáo theo phòng/ban', desc: 'Tổng hợp số lượng và giá trị tài sản phân bổ theo từng đơn vị' },
    { id: '3', name: '3. Báo cáo theo người sử dụng', desc: 'Danh mục tài sản phân quyền theo từng cá nhân chịu trách nhiệm' },
    { id: '4', name: '4. Báo cáo theo vị trí địa lý', desc: 'Danh mục tài sản chi tiết theo cơ sở, khu nhà, tầng và phòng học' },
    { id: '5', name: '5. Báo cáo nhập tài sản mới', desc: 'Báo cáo nguồn gốc, kinh phí và danh mục các thiết bị mua mới' },
    { id: '6', name: '6. Báo cáo điều chuyển tài sản', desc: 'Tổng hợp các đợt điều chuyển vị trí và thay đổi đơn vị tiếp nhận' },
    { id: '7', name: '7. Báo cáo thu hồi tài sản', desc: 'Báo cáo thu hồi thiết bị về Kho Tổng và kiểm đếm phụ kiện' },
    { id: '8', name: '8. Báo cáo thanh lý tài sản', desc: 'Danh sách các tài sản đã có quyết định thanh lý và giá trị thu hồi' },
    { id: '9', name: '9. Báo cáo tài sản đang lưu kho', desc: 'Danh sách tài sản đang lưu giữ tại Kho Tổng sẵn sàng cấp phát' },
    { id: '10', name: '10. Báo cáo tài sản mất / hỏng', desc: 'Thống kê các thiết bị hư hỏng nặng, chờ sửa chữa hoặc thất lạc' },
    { id: '11', name: '11. Báo cáo biến động tài sản', desc: 'Tổng kết tăng/giảm và luân chuyển tài sản theo chu kỳ năm' },
  ];

  const currentDef = reportDefinitions.find(r => r.id === selectedReportType) || reportDefinitions[0];

  // Dynamic Data Generator based on Report Type
  const reportData = useMemo(() => {
    let filteredAssets = assets;
    if (selectedDept !== 'ALL') {
      filteredAssets = assets.filter(a => a.departmentName === selectedDept || a.departmentId === selectedDept);
    }

    switch (selectedReportType) {
      case '1': // Toàn trường
        return filteredAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.code,
          c2: a.name,
          c3: a.departmentName,
          c4: a.locationPath,
          c5: a.currentUser,
          c6: a.condition,
          c7: a.status,
          num: a.cost
        }));

      case '2': // Theo phòng
        return departments.map((d, i) => {
          const dAssets = assets.filter(a => a.departmentId === d.id || a.departmentName === d.name);
          const totalVal = dAssets.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
          return {
            stt: i + 1,
            c1: d.code,
            c2: d.name,
            c3: d.manager,
            c4: d.assetManager,
            c5: d.location,
            c6: `${dAssets.length} thiết bị`,
            c7: 'Đang hoạt động',
            num: totalVal
          };
        });

      case '3': // Theo người sử dụng
        return filteredAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.currentUser || 'Chưa bàn giao',
          c2: a.name,
          c3: a.code,
          c4: a.departmentName,
          c5: a.locationPath,
          c6: a.condition,
          c7: a.status,
          num: a.cost
        }));

      case '4': // Theo vị trí
        return filteredAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.locationPath,
          c2: a.name,
          c3: a.code,
          c4: a.departmentName,
          c5: a.currentUser,
          c6: a.condition,
          c7: a.status,
          num: a.cost
        }));

      case '5': // Nhập tài sản
        return filteredAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.code,
          c2: a.name,
          c3: a.supplier || 'Nhà cung cấp',
          c4: a.invoiceNumber || 'HD-2026',
          c5: a.importDate,
          c6: a.departmentName,
          c7: a.status,
          num: a.cost
        }));

      case '6': // Điều chuyển
        return transfers.map((t, i) => ({
          stt: i + 1,
          c1: t.code,
          c2: t.assetName,
          c3: `${t.fromDepartmentName} (${t.fromLocation})`,
          c4: `${t.toDepartmentName} (${t.toLocation})`,
          c5: `${t.sender} ➔ ${t.receiver}`,
          c6: t.date,
          c7: t.status,
          num: 0
        }));

      case '7': // Thu hồi
        return recalls.map((r, i) => ({
          stt: i + 1,
          c1: r.code,
          c2: r.assetName,
          c3: r.departmentName,
          c4: r.sender,
          c5: (r.accessories || []).join(', '),
          c6: r.condition,
          c7: r.status,
          num: 0
        }));

      case '8': // Thanh lý
        return liquidations.map((l, i) => ({
          stt: i + 1,
          c1: l.code,
          c2: l.assetName,
          c3: l.method,
          c4: l.reason,
          c5: l.requester,
          c6: l.date,
          c7: l.status,
          num: l.liquidationPrice
        }));

      case '9': // Tài sản đang lưu kho
        const inStockAssets = filteredAssets.filter(a => a.status === 'Trong kho' || a.status === 'Đã thu hồi');
        return inStockAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.code,
          c2: a.name,
          c3: a.brand || '---',
          c4: a.locationPath || 'Kho Tổng CS1',
          c5: a.currentUser || 'Thủ kho quản lý',
          c6: a.condition,
          c7: a.status,
          num: a.cost
        }));

      case '10': // Mất / hỏng
        const badAssets = filteredAssets.filter(a => 
          a.condition === 'Hỏng nặng' || a.condition === 'Hỏng nhẹ' || a.status === 'Mất' || a.status === 'Đang sửa chữa'
        );
        return badAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.code,
          c2: a.name,
          c3: a.departmentName,
          c4: a.locationPath,
          c5: a.currentUser,
          c6: a.condition,
          c7: a.status,
          num: a.cost
        }));

      case '11': // Biến động
      default:
        return filteredAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.code,
          c2: a.name,
          c3: a.departmentName,
          c4: a.importDate,
          c5: a.status,
          c6: a.condition,
          c7: (a.history?.length || 1) + ' sự kiện',
          num: a.cost
        }));
    }
  }, [assets, departments, transfers, recalls, liquidations, inventorySessions, selectedReportType, selectedDept]);

  const handleExportExcel = () => {
    const exportedRows = reportData.map(r => ({
      'STT': r.stt,
      'Mã / Cột 1': r.c1,
      'Tên / Nội dung': r.c2,
      'Cột 3': r.c3,
      'Cột 4': r.c4,
      'Cột 5': r.c5,
      'Tình trạng / Cột 6': r.c6,
      'Trạng thái / Cột 7': r.c7,
      'Giá trị (VNĐ)': r.num
    }));
    exportToExcel(exportedRows, `Bao_Cao_${selectedReportType}_${new Date().getFullYear()}.xlsx`);
  };

  const handlePrintReport = () => {
    printElement('printable-full-report');
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <FileSpreadsheet size={26} color="#1e3a8a" />
            Trung Tâm Báo Cáo & Xuất Dữ Liệu
          </h2>
          <p className="page-subtitle">
            Cung cấp 11 mẫu báo cáo nghiệp vụ quản lý tài sản chuẩn, hỗ trợ xuất Excel và in/xuất PDF chuẩn A4
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} />
            Xuất Excel ({reportData.length})
          </button>
          <button className="btn btn-primary" onClick={handlePrintReport}>
            <Printer size={16} />
            In Báo Cáo / Xuất PDF
          </button>
        </div>
      </div>

      {/* Selector & Filter Bar */}
      <div className="card" style={{ marginBottom: 20, padding: '18px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div>
            <label className="form-label">Chọn 1 trong 11 mẫu báo cáo (*):</label>
            <select
              className="form-select"
              style={{ fontWeight: 600 }}
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
            >
              {reportDefinitions.map(def => (
                <option key={def.id} value={def.id}>
                  {def.name}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
              {currentDef.desc}
            </div>
          </div>

          <div>
            <label className="form-label">Lọc theo Phòng/Ban:</label>
            <select
              className="form-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="ALL">-- Toàn trường (Tất cả đơn vị) --</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="card">
        <h3 className="card-title">
          <span>Xem Trước Báo Cáo: {currentDef.name}</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Tổng số dòng: {reportData.length}
          </span>
        </h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                <th>Mã / Tiêu đề</th>
                <th>Tên tài sản / Nội dung</th>
                <th>Đơn vị / Nguồn</th>
                <th>Địa điểm / Chi tiết</th>
                <th>Người phụ trách / Kết quả</th>
                <th style={{ textAlign: 'center' }}>Tình trạng</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Giá trị (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => (
                <tr key={row.stt}>
                  <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>{row.stt}</td>
                  <td><strong style={{ color: '#1e3a8a' }}>{row.c1}</strong></td>
                  <td><div style={{ fontWeight: 600 }}>{row.c2}</div></td>
                  <td style={{ fontSize: '0.825rem' }}>{row.c3}</td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.c4}</td>
                  <td style={{ fontSize: '0.825rem' }}>{row.c5}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>{row.c6}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>{row.c7}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {row.num > 0 ? formatVND(row.num) : '---'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Printable Full Report Template */}
      <div style={{ display: 'none' }}>
        <div id="printable-full-report">
          <div className="header">
            <div className="header-left">
              <strong>BỘ GIÁO DỤC VÀ ĐÀO TẠO</strong><br />
              <strong>TRƯỜNG ĐẠI HỌC</strong><br />
              Phòng Hành chính - Quản trị
            </div>
            <div className="header-right">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br />
              Độc lập - Tự do - Hạnh phúc<br />
              <em>Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</em>
            </div>
          </div>

          <div className="title">{currentDef.name.toUpperCase()}</div>
          <p style={{ textAlign: 'center', fontStyle: 'italic', marginBottom: '20px' }}>
            Phạm vi: {selectedDept === 'ALL' ? 'Toàn trường' : selectedDept}
          </p>

          <table>
            <thead>
              <tr>
                <th style={{ width: '35px' }}>STT</th>
                <th>Mã / Cột 1</th>
                <th>Tên tài sản / Nội dung</th>
                <th>Đơn vị / Vị trí</th>
                <th>Người phụ trách</th>
                <th>Tình trạng</th>
                <th>Nguyên giá</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => (
                <tr key={row.stt}>
                  <td style={{ textAlign: 'center' }}>{row.stt}</td>
                  <td><strong>{row.c1}</strong></td>
                  <td>{row.c2}</td>
                  <td>{row.c3} - {row.c4}</td>
                  <td>{row.c5}</td>
                  <td>{row.c6}</td>
                  <td style={{ textAlign: 'right' }}>
                    {row.num > 0 ? formatVND(row.num) : '---'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="signatures">
            <div className="sig-block">
              <strong>NGƯỜI LẬP BIỂU</strong><br />
              <em>(Ký, ghi rõ họ tên)</em>
              <div className="sig-space"></div>
              <strong>Vũ Tuyên Phát</strong>
            </div>
            <div className="sig-block">
              <strong>KẾ TOÁN TRƯỞNG</strong><br />
              <em>(Ký, ghi rõ họ tên)</em>
              <div className="sig-space"></div>
              <strong>ThS. Võ Thị Thanh</strong>
            </div>
            <div className="sig-block">
              <strong>HIỆU TRƯỞNG</strong><br />
              <em>(Ký, đóng dấu)</em>
              <div className="sig-space"></div>
              <strong>GS.TS Nguyễn Văn An</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
