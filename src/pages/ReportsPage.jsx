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
  Layers,
  Inbox,
  DollarSign,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Eye,
  Search
} from 'lucide-react';

export default function ReportsPage() {
  const {
    assets = [],
    departments = [],
    transfers = [],
    recalls = [],
    liquidations = [],
    inventorySessions = []
  } = useAssets();

  const [selectedReportType, setSelectedReportType] = useState('1'); // 1 to 12
  const [selectedDept, setSelectedDept] = useState('ALL');
  // Trạng thái đã lọc yêu cầu hay chưa (khi chưa lọc -> không hiện bảng xem trước)
  const [appliedCriteria, setAppliedCriteria] = useState(null);

  const handleViewReport = () => {
    setAppliedCriteria({
      reportType: selectedReportType,
      dept: selectedDept
    });
  };

  const handleResetFilter = () => {
    setSelectedReportType('1');
    setSelectedDept('ALL');
    setAppliedCriteria(null);
  };

  // Danh sách các phòng ban tự động tổng hợp từ danh mục phòng ban và từ danh sách tài sản
  const availableDepts = useMemo(() => {
    const deptSet = new Set();
    departments.forEach(d => {
      if (d && d.name) deptSet.add(d.name);
    });
    assets.forEach(a => {
      if (a && a.departmentName) deptSet.add(a.departmentName);
    });
    return Array.from(deptSet);
  }, [departments, assets]);

  const reportDefinitions = [
    {
      id: '1',
      name: '1. Báo cáo tài sản toàn trường',
      desc: 'Bảng tổng hợp danh mục toàn bộ tài sản cố định trong toàn trường',
      headers: ['Mã tài sản', 'Tên tài sản', 'Phòng/Ban', 'Vị trí chi tiết', 'Người sử dụng', 'Tình trạng', 'Trạng thái', 'Nguyên giá']
    },
    {
      id: '2',
      name: '2. Báo cáo theo phòng/ban',
      desc: 'Tổng hợp số lượng và giá trị tài sản phân bổ theo từng đơn vị',
      headers: ['Mã đơn vị', 'Tên phòng/ban', 'Trưởng đơn vị', 'Phụ trách TS', 'Vị trí văn phòng', 'Số lượng TS', 'Trạng thái', 'Tổng giá trị']
    },
    {
      id: '3',
      name: '3. Báo cáo theo người sử dụng',
      desc: 'Danh mục tài sản phân quyền theo từng cá nhân chịu trách nhiệm',
      headers: ['Người sử dụng', 'Tên tài sản', 'Mã tài sản', 'Phòng/Ban', 'Vị trí', 'Tình trạng', 'Trạng thái', 'Nguyên giá']
    },
    {
      id: '4',
      name: '4. Báo cáo theo vị trí địa lý',
      desc: 'Danh mục tài sản chi tiết theo cơ sở, khu nhà, tầng và phòng học',
      headers: ['Vị trí (4 Cấp)', 'Tên tài sản', 'Mã tài sản', 'Phòng/Ban', 'Người sử dụng', 'Tình trạng', 'Trạng thái', 'Nguyên giá']
    },
    {
      id: '5',
      name: '5. Báo cáo nhập tài sản mới',
      desc: 'Báo cáo nguồn gốc, kinh phí và danh mục các thiết bị mua mới',
      headers: ['Mã tài sản', 'Tên tài sản', 'Loại tài sản', 'Năm nhập', 'Năm xuất', 'Phòng/Ban', 'Trạng thái', 'Nguyên giá']
    },
    {
      id: '6',
      name: '6. Báo cáo điều chuyển tài sản',
      desc: 'Tổng hợp các đợt điều chuyển vị trí và thay đổi đơn vị tiếp nhận',
      headers: ['Mã phiếu', 'Tên tài sản', 'Nơi chuyển đi', 'Nơi tiếp nhận', 'Giao nhận', 'Ngày chuyển', 'Trạng thái', 'Giá trị']
    },
    {
      id: '7',
      name: '7. Báo cáo thu hồi tài sản',
      desc: 'Báo cáo thu hồi thiết bị về Kho Tổng và kiểm đếm phụ kiện',
      headers: ['Mã phiếu', 'Tên tài sản', 'Đơn vị bàn giao', 'Người bàn giao', 'Phụ kiện kèm', 'Tình trạng', 'Trạng thái', 'Giá trị']
    },
    {
      id: '8',
      name: '8. Báo cáo thanh lý tài sản',
      desc: 'Danh sách các tài sản đã có quyết định thanh lý và giá trị thu hồi',
      headers: ['Mã phiếu', 'Tên tài sản', 'Hình thức thanh lý', 'Lý do thanh lý', 'Người đề xuất', 'Ngày thanh lý', 'Trạng thái', 'Tiền thu hồi']
    },
    {
      id: '9',
      name: '9. Báo cáo tài sản đang lưu kho',
      desc: 'Danh sách tài sản đang lưu giữ tại Kho Tổng sẵn sàng cấp phát',
      headers: ['Mã tài sản', 'Tên tài sản', 'Hãng sản xuất', 'Vị trí kho', 'Người quản lý', 'Tình trạng', 'Trạng thái', 'Nguyên giá']
    },
    {
      id: '10',
      name: '10. Báo cáo tài sản mất / hỏng',
      desc: 'Thống kê các thiết bị hư hỏng nặng, chờ sửa chữa hoặc thất lạc',
      headers: ['Mã tài sản', 'Tên tài sản', 'Phòng/Ban', 'Vị trí', 'Người chịu TN', 'Tình trạng', 'Trạng thái', 'Nguyên giá']
    },
    {
      id: '11',
      name: '11. Báo cáo biến động tài sản',
      desc: 'Tổng kết tăng/giảm và luân chuyển tài sản theo chu kỳ năm',
      headers: ['Mã tài sản', 'Tên tài sản', 'Phòng/Ban', 'Năm nhập', 'Trạng thái', 'Tình trạng', 'Lịch sử sự kiện', 'Nguyên giá']
    },
    {
      id: '12',
      name: '12. Báo cáo các đợt kiểm kê',
      desc: 'Thống kê tiến độ kiểm kê tài sản định kỳ và số lượng đã đối soát',
      headers: ['Mã đợt', 'Tên đợt kiểm kê', 'Năm kiểm kê', 'Phạm vi', 'Người phụ trách', 'Tiến độ kiểm đếm', 'Trạng thái', 'Giá trị']
    }
  ];

  const activeReportType = appliedCriteria ? appliedCriteria.reportType : selectedReportType;
  const activeDept = appliedCriteria ? appliedCriteria.dept : selectedDept;
  const currentDef = reportDefinitions.find(r => r.id === activeReportType) || reportDefinitions[0];
  const isFilterChanged = appliedCriteria !== null && (appliedCriteria.reportType !== selectedReportType || appliedCriteria.dept !== selectedDept);

  // Dynamic Data Generator based on Report Type (chỉ tính toán khi đã bấm Xem báo cáo)
  const reportData = useMemo(() => {
    if (!appliedCriteria) return [];
    let filteredAssets = assets;
    if (activeDept !== 'ALL') {
      filteredAssets = assets.filter(a => a.departmentName === activeDept || a.departmentId === activeDept);
    }

    switch (activeReportType) {
      case '1': // Toàn trường
        return filteredAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.code || '---',
          c2: a.quantity && a.quantity > 1 ? `${a.name} (SL: ${a.quantity} ${a.unit || 'Cái'})` : (a.name || '---'),
          c3: a.departmentName || '---',
          c4: a.locationPath || '---',
          c5: a.currentUser || 'Chưa bàn giao',
          c6: a.condition || 'Tốt',
          c7: a.status || 'Đang sử dụng',
          num: (Number(a.cost) || 0) * (Number(a.quantity) || 1)
        }));

      case '2': { // Theo phòng
        // Danh sách phòng ban kết hợp từ departments và assets
        const deptList = departments.length > 0
          ? departments
          : availableDepts.map((name, idx) => ({
              id: `dept-auto-${idx}`,
              code: `PB-${String(idx + 1).padStart(2, '0')}`,
              name: name,
              manager: 'Chưa cập nhật',
              assetManager: 'Chưa cập nhật',
              location: '---'
            }));

        return deptList.map((d, i) => {
          const dAssets = assets.filter(a => a.departmentId === d.id || a.departmentName === d.name);
          const totalQty = dAssets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0);
          const totalVal = dAssets.reduce((sum, a) => sum + ((Number(a.cost) || 0) * (Number(a.quantity) || 1)), 0);
          return {
            stt: i + 1,
            c1: d.code || `PB-${i + 1}`,
            c2: d.name,
            c3: d.manager || '---',
            c4: d.assetManager || '---',
            c5: d.location || '---',
            c6: `${totalQty} món (${dAssets.length} mã)`,
            c7: 'Đang hoạt động',
            num: totalVal
          };
        });
      }

      case '3': // Theo người sử dụng
        return filteredAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.currentUser || 'Chưa bàn giao',
          c2: a.name || '---',
          c3: a.code || '---',
          c4: a.departmentName || '---',
          c5: a.locationPath || '---',
          c6: a.condition || 'Tốt',
          c7: a.status || 'Đang sử dụng',
          num: Number(a.cost) || 0
        }));

      case '4': // Theo vị trí
        return filteredAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.locationPath || 'Chưa phân vị trí',
          c2: a.name || '---',
          c3: a.code || '---',
          c4: a.departmentName || '---',
          c5: a.currentUser || 'Chưa bàn giao',
          c6: a.condition || 'Tốt',
          c7: a.status || 'Đang sử dụng',
          num: Number(a.cost) || 0
        }));

      case '5': // Nhập tài sản
        return filteredAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.code || '---',
          c2: a.name || '---',
          c3: a.type || 'Thiết bị',
          c4: a.importYear || a.purchaseYear || (a.importDate ? String(a.importDate).slice(0, 4) : '---'),
          c5: a.exportYear || '---',
          c6: a.departmentName || '---',
          c7: a.status || 'Mới',
          num: Number(a.cost) || 0
        }));

      case '6': { // Điều chuyển
        let list = transfers;
        if (selectedDept !== 'ALL') {
          list = transfers.filter(t => t.fromDepartmentName === selectedDept || t.toDepartmentName === selectedDept);
        }
        return list.map((t, i) => ({
          stt: i + 1,
          c1: t.code || `DC-${i + 1}`,
          c2: t.assetName || t.assetCode || 'Tài sản',
          c3: `${t.fromDepartmentName || '---'} (${t.fromLocation || '---'})`,
          c4: `${t.toDepartmentName || '---'} (${t.toLocation || '---'})`,
          c5: `${t.sender || '---'} ➔ ${t.receiver || '---'}`,
          c6: t.date ? formatDate(t.date) : '---',
          c7: t.status || 'Hoàn thành',
          num: 0
        }));
      }

      case '7': { // Thu hồi
        let list = recalls;
        if (selectedDept !== 'ALL') {
          list = recalls.filter(r => r.departmentName === selectedDept);
        }
        return list.map((r, i) => ({
          stt: i + 1,
          c1: r.code || `TH-${i + 1}`,
          c2: r.assetName || r.assetCode || 'Tài sản',
          c3: r.departmentName || '---',
          c4: r.sender || '---',
          c5: Array.isArray(r.accessories) && r.accessories.length > 0 ? r.accessories.join(', ') : 'Đầy đủ',
          c6: r.condition || 'Bình thường',
          c7: r.status || 'Đã thu hồi',
          num: 0
        }));
      }

      case '8': { // Thanh lý
        let list = liquidations;
        if (selectedDept !== 'ALL') {
          list = liquidations.filter(l => l.departmentName === selectedDept);
        }
        return list.map((l, i) => ({
          stt: i + 1,
          c1: l.code || `TL-${i + 1}`,
          c2: l.assetName || l.assetCode || 'Tài sản',
          c3: l.method || 'Thanh lý phế liệu',
          c4: l.reason || 'Hết khấu hao / Hỏng',
          c5: l.requester || '---',
          c6: l.date ? formatDate(l.date) : '---',
          c7: l.status || 'Đã thanh lý',
          num: Number(l.liquidationPrice) || 0
        }));
      }

      case '9': { // Tài sản đang lưu kho
        const inStockAssets = filteredAssets.filter(a => 
          a.status === 'Trong kho' || a.status === 'Đã thu hồi' || a.status === 'Chưa cấp phát'
        );
        return inStockAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.code || '---',
          c2: a.name || '---',
          c3: a.brand || '---',
          c4: a.locationPath || 'Kho Tổng',
          c5: a.currentUser || 'Thủ kho quản lý',
          c6: a.condition || 'Tốt',
          c7: a.status || 'Lưu kho',
          num: Number(a.cost) || 0
        }));
      }

      case '10': { // Mất / hỏng
        const badAssets = filteredAssets.filter(a => 
          a.condition === 'Hỏng nặng' || a.condition === 'Hỏng nhẹ' || 
          a.status === 'Mất' || a.status === 'Chờ thanh lý'
        );
        return badAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.code || '---',
          c2: a.name || '---',
          c3: a.departmentName || '---',
          c4: a.locationPath || '---',
          c5: a.currentUser || '---',
          c6: a.condition || 'Cần kiểm tra',
          c7: a.status || 'Sự cố',
          num: Number(a.cost) || 0
        }));
      }

      case '11': // Biến động
        return filteredAssets.map((a, i) => ({
          stt: i + 1,
          c1: a.code || '---',
          c2: a.name || '---',
          c3: a.departmentName || '---',
          c4: a.importYear || a.purchaseYear || (a.importDate ? String(a.importDate).slice(0, 4) : '---'),
          c5: a.status || 'Đang sử dụng',
          c6: a.condition || 'Tốt',
          c7: (a.history?.length || 1) + ' sự kiện',
          num: Number(a.cost) || 0
        }));

      case '12': { // Kiểm kê
        return (inventorySessions || []).map((s, i) => {
          const checkedCount = Object.keys(s.records || {}).length;
          return {
            stt: i + 1,
            c1: s.code || `KK-${s.year || 2026}`,
            c2: s.name || `Đợt kiểm kê năm ${s.year || 2026}`,
            c3: `Năm ${s.year || 2026}`,
            c4: s.scope || 'Toàn trường',
            c5: s.head || 'Ban kiểm kê',
            c6: `${checkedCount} tài sản đã kiểm`,
            c7: s.status || 'Hoàn thành',
            num: 0
          };
        });
      }

      default:
        return [];
    }
  }, [assets, departments, transfers, recalls, liquidations, inventorySessions, activeReportType, activeDept, availableDepts, appliedCriteria]);

  // Tổng giá trị tính toán
  const totalReportValue = useMemo(() => {
    return reportData.reduce((sum, item) => sum + (Number(item.num) || 0), 0);
  }, [reportData]);

  const handleExportExcel = () => {
    if (!appliedCriteria || reportData.length === 0) {
      alert('Vui lòng nhấn "Xem báo cáo" để tải dữ liệu trước khi xuất Excel!');
      return;
    }

    const headers = currentDef.headers;
    const exportedRows = reportData.map(r => ({
      'STT': r.stt,
      [headers[0]]: r.c1,
      [headers[1]]: r.c2,
      [headers[2]]: r.c3,
      [headers[3]]: r.c4,
      [headers[4]]: r.c5,
      [headers[5]]: r.c6,
      [headers[6]]: r.c7,
      [headers[7]]: r.num > 0 ? r.num : 0
    }));

    exportToExcel(exportedRows, `Bao_Cao_${activeReportType}_${new Date().getFullYear()}.xlsx`);
  };

  const handlePrintReport = () => {
    if (!appliedCriteria || reportData.length === 0) {
      alert('Vui lòng nhấn "Xem báo cáo" để tải dữ liệu trước khi in báo cáo!');
      return;
    }
    printElement('printable-full-report');
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <FileSpreadsheet size={26} color="#1e3a8a" />
            Trung Tâm Báo Cáo & Xuất Dữ Liệu
          </h2>
          <p className="page-subtitle">
            Cung cấp 12 mẫu báo cáo nghiệp vụ quản lý tài sản chuẩn, hỗ trợ xuất Excel và in/xuất PDF chuẩn A4
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportExcel}
            disabled={!appliedCriteria || reportData.length === 0}
            style={{ opacity: !appliedCriteria || reportData.length === 0 ? 0.5 : 1 }}
            title={!appliedCriteria ? 'Vui lòng xem báo cáo trước khi xuất' : 'Xuất danh sách ra Excel'}
          >
            <FileSpreadsheet size={16} />
            Xuất Excel {appliedCriteria ? `(${reportData.length})` : ''}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handlePrintReport}
            disabled={!appliedCriteria || reportData.length === 0}
            style={{ opacity: !appliedCriteria || reportData.length === 0 ? 0.5 : 1 }}
            title={!appliedCriteria ? 'Vui lòng xem báo cáo trước khi in' : 'In báo cáo hoặc xuất PDF'}
          >
            <Printer size={16} />
            In Báo Cáo / Xuất PDF
          </button>
        </div>
      </div>

      {/* Selector & Filter Bar */}
      <div className="card" style={{ marginBottom: 20, padding: '18px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Chọn 1 trong 12 mẫu báo cáo nghiệp vụ (*):</label>
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
              {reportDefinitions.find(r => r.id === selectedReportType)?.desc}
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
              {availableDepts.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
              Lọc danh sách theo từng đơn vị cụ thể hoặc xem toàn bộ
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px 18px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleViewReport}
            >
              <Eye size={16} />
              Xem báo cáo
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleResetFilter}
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={16} />
              Đặt lại
            </button>
          </div>
        </div>

        {isFilterChanged && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #e2e8f0', fontSize: '0.8rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} />
            <span>Điều kiện lọc đã thay đổi. Vui lòng bấm <strong>"Xem báo cáo"</strong> để cập nhật lại dữ liệu hiển thị.</span>
          </div>
        )}
      </div>

      {!appliedCriteria ? (
        /* Hộp thông báo chờ lọc - Không hiển thị bảng xem trước mặc định */
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px', color: '#64748b' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#2563eb'
          }}>
            <FileSpreadsheet size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
            Chế độ xem trước báo cáo đang ở trạng thái chờ
          </h3>
          <p style={{ maxWidth: 520, margin: '0 auto 20px', fontSize: '0.875rem', lineHeight: 1.6, color: '#64748b' }}>
            Để tối ưu tốc độ và không làm chậm trình duyệt, bảng xem trước không hiển thị tự động.
            Vui lòng chọn mẫu báo cáo và phạm vi phòng/ban ở trên, sau đó nhấn nút <strong>"Xem báo cáo"</strong> để tải dữ liệu.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onClick={handleViewReport}
          >
            <Eye size={16} />
            Xem báo cáo ngay
          </button>
        </div>
      ) : (
        <>
          {/* Quick Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <FileText size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TỔNG SỐ BẢN GHI</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>{reportData.length}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <DollarSign size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TỔNG GIÁ TRỊ (VNĐ)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                  {totalReportValue > 0 ? formatVND(totalReportValue) : '---'}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                <Building size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>PHẠM VI ĐANG XEM</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                  {activeDept === 'ALL' ? 'Toàn trường (Tất cả)' : activeDept}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Xem Trước Báo Cáo: {currentDef.name}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                Tổng cộng: <strong>{reportData.length}</strong> kết quả
              </span>
            </h3>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                    <th>{currentDef.headers[0]}</th>
                    <th>{currentDef.headers[1]}</th>
                    <th>{currentDef.headers[2]}</th>
                    <th>{currentDef.headers[3]}</th>
                    <th>{currentDef.headers[4]}</th>
                    <th style={{ textAlign: 'center' }}>{currentDef.headers[5]}</th>
                    <th style={{ textAlign: 'center' }}>{currentDef.headers[6]}</th>
                    <th style={{ textAlign: 'right' }}>{currentDef.headers[7]}</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                        <Inbox size={44} style={{ margin: '0 auto 12px', opacity: 0.35, display: 'block', color: '#3b82f6' }} />
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#334155', marginBottom: 6 }}>
                          Chưa có dữ liệu cho mẫu báo cáo này
                        </div>
                        <div style={{ fontSize: '0.85rem', maxWidth: 500, margin: '0 auto', lineHeight: 1.5 }}>
                          {activeDept !== 'ALL'
                            ? `Không tìm thấy bản ghi nào thuộc phòng/ban "${activeDept}". Hãy chọn lại "-- Toàn trường --" và nhấn Xem báo cáo.`
                            : 'Hệ thống chưa có bản ghi nào phù hợp. Bạn có thể thêm tài sản mới hoặc tạo các phiếu nghiệp vụ tương ứng.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reportData.map((row) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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
                <th>{currentDef.headers[0]}</th>
                <th>{currentDef.headers[1]}</th>
                <th>{currentDef.headers[2]}</th>
                <th>{currentDef.headers[4]}</th>
                <th>{currentDef.headers[5]}</th>
                <th style={{ textAlign: 'right' }}>{currentDef.headers[7]}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => (
                <tr key={row.stt}>
                  <td style={{ textAlign: 'center' }}>{row.stt}</td>
                  <td><strong>{row.c1}</strong></td>
                  <td>{row.c2}</td>
                  <td>{row.c3} {row.c4 ? `- ${row.c4}` : ''}</td>
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
              <strong>Võ Tuyên Phát</strong>
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
