// src/pages/AssetInbound.jsx
import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { generateAssetCode, formatVND } from '../utils/formatters';
import { exportToExcel, parseExcelFile } from '../utils/exportExcel';
import {
  PlusCircle,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  Building,
  MapPin,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export default function AssetInbound({ setActiveTab }) {
  const { assets, departments, addAsset, importAssetsBatch } = useAssets();
  const { currentUser } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'Thiết bị CNTT',
    category: 'Máy tính để bàn',
    brand: '',
    model: '',
    serial: '',
    quantity: 1,
    unit: 'Cái',
    purchaseDate: new Date().toISOString().slice(0, 10),
    importDate: new Date().toISOString().slice(0, 10),
    supplier: '',
    invoiceNumber: '',
    cost: '',
    lifespanYears: 5,
    departmentId: departments[0]?.id || '',
    departmentName: departments[0]?.name || '',
    locationPath: '',
    responsiblePerson: '',
    currentUser: '',
    condition: 'Tốt',
    status: 'Đang sử dụng',
    notes: '',
    fundingSource: 'Ngân sách Nhà nước cấp'
  });

  const [notification, setNotification] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Auto generated code preview
  const previewCode = generateAssetCode('TS', assets);

  const handleDeptChange = (e) => {
    const deptId = e.target.value;
    const dept = departments.find(d => d.id === deptId);
    setFormData({
      ...formData,
      departmentId: deptId,
      departmentName: dept ? dept.name : '',
      responsiblePerson: dept ? dept.manager : ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newCode = generateAssetCode('TS', assets);
    const newAsset = {
      ...formData,
      code: newCode,
      quantity: Math.max(1, Number(formData.quantity) || 1),
      unit: formData.unit?.trim() || 'Cái',
      cost: Number(formData.cost) || 0,
      lifespanYears: Number(formData.lifespanYears) || 5,
      qrValue: newCode,
      responsiblePerson: formData.responsiblePerson || currentUser?.name,
      currentUser: formData.currentUser || formData.responsiblePerson || currentUser?.name
    };

    addAsset(newAsset);
    setNotification(`Đã nhập thành công tài sản mới: "${newAsset.name}" với mã: [${newCode}] (SL: ${newAsset.quantity} ${newAsset.unit})`);

    // Reset Form
    setFormData(prev => ({
      ...prev,
      name: '',
      brand: '',
      model: '',
      serial: '',
      quantity: 1,
      unit: 'Cái',
      cost: '',
      invoiceNumber: '',
      notes: ''
    }));

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Download Sample Excel Template
  const handleDownloadSample = () => {
    const sampleRows = [
      {
        'Mã tài sản': 'TS-2026-0091',
        'Tên tài sản': 'Máy in HP LaserJet Pro M404dn',
        'Loại tài sản': 'Thiết bị Văn phòng',
        'Nhóm tài sản': 'Máy in & Photocopy',
        'Nhãn hiệu': 'HP',
        'Model': 'M404dn Laser',
        'Serial Number': 'SN-HP-M404-001',
        'Ngày mua (YYYY-MM-DD)': '2026-03-01',
        'Ngày nhập (YYYY-MM-DD)': '2026-03-05',
        'Nhà cung cấp': 'Công ty Phúc Anh',
        'Số chứng từ/HĐ': 'HD-PA-88192',
        'Số lượng': 1,
        'Đơn vị tính': 'Cái',
        'Nguyên giá': 8500000,
        'Thời gian SD (Năm)': 4,
        'Phòng ban': 'Phòng Hành chính - Quản trị',
        'Vị trí': 'Cơ sở 1 > Khu A > Tầng 1 > Phòng A1.01',
        'Người chịu trách nhiệm': 'ThS. Lê Hoàng Long',
        'Người sử dụng': 'Nguyễn Thị Hoa',
        'Tình trạng': 'Tốt',
        'Trạng thái': 'Đang sử dụng',
        'Ghi chú': 'Nhập mẫu từ Excel'
      }
    ];
    exportToExcel(sampleRows, 'Mau_Import_Tai_San_Moi.xlsx', 'MauTaiSan');
  };

  // Upload and parse Excel
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const jsonList = await parseExcelFile(file);

      if (!jsonList || jsonList.length === 0) {
        alert('Tập tin Excel trống hoặc không có dòng dữ liệu hợp lệ.');
        setIsImporting(false);
        return;
      }

      const formatted = jsonList.map((row, idx) => {
        const generatedCode = row['Mã tài sản'] || `TS-${new Date().getFullYear()}-${String(assets.length + idx + 1).padStart(4, '0')}`;
        return {
          code: generatedCode,
          name: row['Tên tài sản'] || 'Tài sản nhập Excel',
          type: row['Loại tài sản'] || 'Khác',
          category: row['Nhóm tài sản'] || 'Khác',
          brand: row['Nhãn hiệu'] || '',
          model: row['Model'] || '',
          serial: row['Serial Number'] || '',
          quantity: Math.max(1, Number(row['Số lượng']) || 1),
          unit: row['Đơn vị tính'] || 'Cái',
          purchaseDate: row['Ngày mua (YYYY-MM-DD)'] || new Date().toISOString().slice(0, 10),
          importDate: row['Ngày nhập (YYYY-MM-DD)'] || new Date().toISOString().slice(0, 10),
          supplier: row['Nhà cung cấp'] || '',
          invoiceNumber: row['Số chứng từ/HĐ'] || '',
          cost: Number(row['Nguyên giá']) || 0,
          lifespanYears: Number(row['Thời gian SD (Năm)']) || 5,
          departmentName: row['Phòng ban'] || 'Phòng Hành chính - Quản trị',
          locationPath: row['Vị trí'] || 'Cơ sở 1 > Khu A > Tầng 1 > Kho Tổng CS1',
          responsiblePerson: row['Người chịu trách nhiệm'] || 'Thủ kho',
          currentUser: row['Người sử dụng'] || 'Chưa bàn giao',
          condition: row['Tình trạng'] || 'Tốt',
          status: row['Trạng thái'] || 'Trong kho',
          notes: row['Ghi chú'] || 'Nhập từ file Excel',
          qrValue: generatedCode
        };
      });

      importAssetsBatch(formatted);
      alert(`Đã nhập thành công ${formatted.length} tài sản từ file Excel!`);
      setActiveTab('assets');
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng tệp!');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <PlusCircle size={26} color="#1e3a8a" />
            Nhập Tài Sản Mới Vào Hệ Thống
          </h2>
          <p className="page-subtitle">
            Hỗ trợ lập phiếu nhập kho đơn chiếc tự sinh mã và nhập hàng loạt bằng tập tin Excel
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleDownloadSample}>
            <Download size={16} />
            Tải mẫu Excel chuẩn
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} />
            <span>{isImporting ? 'Đang nhập...' : 'Import từ file Excel'}</span>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
              disabled={isImporting}
            />
          </label>
        </div>
      </div>

      {notification && (
        <div style={{
          background: '#dcfce7',
          color: '#15803d',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle size={20} />
          <span style={{ fontWeight: 600 }}>{notification}</span>
        </div>
      )}

      {/* Main Entry Form */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            Phiếu Nhập Kho Tài Sản Mới
          </h3>
          <span style={{ 
            background: '#eff6ff', 
            color: '#1e40af', 
            fontWeight: 700, 
            padding: '6px 14px', 
            borderRadius: '20px',
            fontSize: '0.85rem'
          }}>
            Mã dự kiến sinh tự động: {previewCode}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Thông tin phân loại & Định danh */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: 12 }}>
              1. THÔNG TIN ĐỊNH DANH & PHÂN LOẠI
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tên tài sản (*)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Máy chiếu Laser Panasonic PT-VMZ51..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Loại tài sản</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Thiết bị CNTT">Thiết bị CNTT</option>
                  <option value="Thiết bị Thí nghiệm">Thiết bị Thí nghiệm</option>
                  <option value="Thiết bị Xưởng">Thiết bị Xưởng</option>
                  <option value="Thiết bị Giảng dạy">Thiết bị Giảng dạy</option>
                  <option value="Thiết bị Văn phòng">Thiết bị Văn phòng</option>
                  <option value="Bàn ghế & Nội thất">Bàn ghế & Nội thất</option>
                  <option value="Phương tiện vận tải">Phương tiện vận tải</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nhóm tài sản</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Máy in & Photocopy, Máy chủ..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nhãn hiệu / Hãng SX</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Dell, HP, Canon, Ricoh..."
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Model / Quy cách</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: PowerEdge R750..."
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số Serial Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: SN-2026-99812..."
                  value={formData.serial}
                  onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tài chính & Nhà cung cấp */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: 12 }}>
              2. NGUỒN GỐC & TÀI CHÍNH
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Số lượng nhập (*)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Đơn vị tính</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Cái, Chiếc, Bộ, Thiết bị..."
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Đơn giá mua vào (VNĐ) (*)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="VD: 25000000"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Thành tiền (Tổng kinh phí)</label>
                <div style={{
                  height: 38,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  fontWeight: 700,
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {formatVND((Number(formData.cost) || 0) * Math.max(1, Number(formData.quantity) || 1))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Thời gian sử dụng dự kiến (Năm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.lifespanYears}
                  onChange={(e) => setFormData({ ...formData, lifespanYears: e.target.value })}
                  min="1"
                  max="30"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nguồn kinh phí</label>
                <select
                  className="form-select"
                  value={formData.fundingSource}
                  onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value })}
                >
                  <option value="Ngân sách Nhà nước cấp">Ngân sách Nhà nước cấp</option>
                  <option value="Nguồn thu sự nghiệp">Nguồn thu sự nghiệp</option>
                  <option value="Tài trợ / Viện trợ dự án">Tài trợ / Viện trợ dự án</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nhà cung cấp</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Công ty TNHH Tin học Mai Hoàng..."
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số chứng từ / Hóa đơn</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: HD-MH-2026-092..."
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ngày mua / Ngày nghiệm thu</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bàn giao & Vị trí ban đầu */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: 12 }}>
              3. PHÂN BỔ ĐƠN VỊ & VỊ TRÍ BAN ĐẦU
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Phòng/Ban tiếp nhận</label>
                <select
                  className="form-select"
                  value={formData.departmentId}
                  onChange={handleDeptChange}
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vị trí lắp đặt cụ thể</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Cơ sở 1 > Khu C > Tầng 4 > Lab C4.02"
                  value={formData.locationPath}
                  onChange={(e) => setFormData({ ...formData, locationPath: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Người chịu trách nhiệm chính</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: ThS. Lê Hoàng Long..."
                  value={formData.responsiblePerson}
                  onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Người sử dụng trực tiếp</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Nguyễn Thị Hoa..."
                  value={formData.currentUser}
                  onChange={(e) => setFormData({ ...formData, currentUser: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tình trạng ban đầu</label>
                <select
                  className="form-select"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                >
                  <option value="Tốt">Tốt (Mới 100%)</option>
                  <option value="Khá">Khá (Đã qua sử dụng)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái ban đầu</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Đang sử dụng">Đang sử dụng</option>
                  <option value="Trong kho">Trong kho</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú thêm</label>
              <textarea
                className="form-textarea"
                placeholder="Ghi chú chi tiết về phụ kiện, hướng dẫn bảo hành..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setActiveTab('assets')}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn-primary">
              <PlusCircle size={16} />
              Xác nhận Nhập kho & Sinh mã QR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
