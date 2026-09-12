// src/pages/AssetInbound.jsx
import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { generateAssetCode, formatVND } from '../utils/formatters';
import { exportMultiSheetExcel, parseExcelFile } from '../utils/exportExcel';
import ManageOptionsModal from '../components/common/ManageOptionsModal';
import Modal from '../components/common/Modal';
import {
  PlusCircle,
  Upload,
  Download,
  CheckCircle,
  Sliders,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { cleanText, canonicalStatus, canonicalCondition } from '../utils/normalize';


export default function AssetInbound({ setActiveTab }) {
  const {
    assets,
    departments,
    locations,
    addAsset,
    importAssetsBatch,
    assetTypeOptions,
    conditionOptions,
    statusOptions
  } = useAssets();
  const { currentUser } = useAuth();

  const locationSuggestions = React.useMemo(() => {
    const set = new Set();
    assets.forEach(a => {
      if (a.locationPath && a.locationPath.trim()) set.add(a.locationPath.trim());
    });
    const collectPaths = (nodes, parentPath = '') => {
      nodes.forEach(n => {
        const p = parentPath ? `${parentPath} > ${n.name}` : n.name;
        set.add(p);
        if (n.children && n.children.length > 0) collectPaths(n.children, p);
      });
    };
    collectPaths(locations || []);
    return Array.from(set);
  }, [assets, locations]);

  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [optionsModalTab, setOptionsModalTab] = useState('types');
  const [isTemplateGuideOpen, setIsTemplateGuideOpen] = useState(false);

  const openOptions = (tab) => {
    setOptionsModalTab(tab);
    setIsOptionsModalOpen(true);
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: assetTypeOptions[0] || 'Thiết bị CNTT',
    brand: '',
    quantity: 1,
    unit: 'Cái',
    importYear: new Date().getFullYear(),
    exportYear: '',
    cost: '',
    lifespanYears: '', // để trống = vô hạn
    departmentId: departments[0]?.id || '',
    departmentName: departments[0]?.name || '',
    locationPath: '',
    responsiblePerson: '',
    currentUser: '',
    condition: conditionOptions[0] || 'Tốt',
    status: statusOptions[0] || 'Đang sử dụng',
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
    const impYear = Number(formData.importYear) || new Date().getFullYear();
    const expYear = formData.exportYear ? Number(formData.exportYear) : null;
    const lifespanVal = formData.lifespanYears === '' ? null : (Number(formData.lifespanYears) || null);

    const newAsset = {
      ...formData,
      code: newCode,
      quantity: Math.max(1, Number(formData.quantity) || 1),
      unit: formData.unit?.trim() || 'Cái',
      cost: Number(formData.cost) || 0,
      lifespanYears: lifespanVal,
      importYear: impYear,
      purchaseYear: impYear,
      exportYear: expYear,
      purchaseDate: `${impYear}-01-01`,
      importDate: `${impYear}-01-01`,
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
      quantity: 1,
      unit: 'Cái',
      cost: '',
      lifespanYears: '',
      exportYear: '',
      notes: ''
    }));

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Download Comprehensive Multi-sheet Excel Template
  const handleDownloadSample = () => {
    const defaultDept = departments[0]?.name || 'Phòng Hành chính - Quản trị';
    const itDept = departments.find(d => d.name.includes('CNTT') || d.name.includes('Thông tin'))?.name || defaultDept;
    const labDept = departments.find(d => d.name.includes('Điện') || d.name.includes('Thí nghiệm'))?.name || defaultDept;

    // Sheet 1: DanhSach_NhapTaiSan (Full 19 fields matching the form)
    const sampleRows = [
      {
        'Mã tài sản': 'TS-2026-0001',
        'Tên tài sản (*)': 'Máy tính để bàn Dell OptiPlex 7010 MT',
        'Loại tài sản (*)': assetTypeOptions[0] || 'Thiết bị CNTT',
        'Nhãn hiệu / Hãng SX': 'Dell',
        'Số lượng (*)': 5,
        'Đơn vị tính (*)': 'Bộ',
        'Đơn giá (VNĐ) (*)': 16500000,
        'Thành tiền (VNĐ)': 82500000,
        'Năm nhập kho (*)': 2026,
        'Năm xuất kho': '',
        'Thời gian SD (Năm)': 5,
        'Nguồn kinh phí (*)': 'Ngân sách Nhà nước cấp',
        'Phòng ban tiếp nhận (*)': itDept,
        'Vị trí cụ thể': 'Cơ sở 1 > Khu B > Tầng 2 > Phòng Lab CNTT 201',
        'Người chịu trách nhiệm': departments.find(d => d.name === itDept)?.manager || 'TS. Trần Minh Tuấn',
        'Người sử dụng trực tiếp': 'Nguyễn Văn Hùng',
        'Tình trạng ban đầu (*)': conditionOptions[0] || 'Tốt',
        'Trạng thái ban đầu (*)': statusOptions[0] || 'Đang sử dụng',
        'Ghi chú thêm': 'Bộ máy tính gồm case Intel Core i5, RAM 16GB, SSD 512GB, màn hình Dell 24 inch, chuột và bàn phím'
      },
      {
        'Mã tài sản': 'TS-2026-0002',
        'Tên tài sản (*)': 'Máy in laser đa năng HP LaserJet Pro M404dn',
        'Loại tài sản (*)': assetTypeOptions.find(t => t.includes('Văn phòng')) || assetTypeOptions[0] || 'Thiết bị Văn phòng',
        'Nhãn hiệu / Hãng SX': 'HP',
        'Số lượng (*)': 1,
        'Đơn vị tính (*)': 'Cái',
        'Đơn giá (VNĐ) (*)': 8500000,
        'Thành tiền (VNĐ)': 8500000,
        'Năm nhập kho (*)': 2026,
        'Năm xuất kho': '',
        'Thời gian SD (Năm)': 4,
        'Nguồn kinh phí (*)': 'Nguồn thu sự nghiệp',
        'Phòng ban tiếp nhận (*)': defaultDept,
        'Vị trí cụ thể': 'Cơ sở 1 > Khu A > Tầng 1 > Phòng Văn thư A1.02',
        'Người chịu trách nhiệm': departments.find(d => d.name === defaultDept)?.manager || 'ThS. Lê Hoàng Long',
        'Người sử dụng trực tiếp': 'Nguyễn Thị Hoa',
        'Tình trạng ban đầu (*)': conditionOptions[0] || 'Tốt',
        'Trạng thái ban đầu (*)': statusOptions[0] || 'Đang sử dụng',
        'Ghi chú thêm': 'In 2 mặt tự động, hỗ trợ in qua mạng LAN'
      },
      {
        'Mã tài sản': 'TS-2026-0003',
        'Tên tài sản (*)': 'Máy chiếu kỹ thuật số tương tác Panasonic PT-VX430',
        'Loại tài sản (*)': assetTypeOptions.find(t => t.includes('Giảng dạy')) || assetTypeOptions[0] || 'Thiết bị Giảng dạy',
        'Nhãn hiệu / Hãng SX': 'Panasonic',
        'Số lượng (*)': 2,
        'Đơn vị tính (*)': 'Bộ',
        'Đơn giá (VNĐ) (*)': 22500000,
        'Thành tiền (VNĐ)': 45000000,
        'Năm nhập kho (*)': 2025,
        'Năm xuất kho': '',
        'Thời gian SD (Năm)': 6,
        'Nguồn kinh phí (*)': 'Tài trợ / Viện trợ dự án',
        'Phòng ban tiếp nhận (*)': defaultDept,
        'Vị trí cụ thể': 'Cơ sở 1 > Khu A > Tầng 3 > Giảng đường A3.01',
        'Người chịu trách nhiệm': departments.find(d => d.name === defaultDept)?.manager || 'ThS. Lê Hoàng Long',
        'Người sử dụng trực tiếp': 'Giảng viên phụ trách giảng đường',
        'Tình trạng ban đầu (*)': conditionOptions[0] || 'Tốt',
        'Trạng thái ban đầu (*)': statusOptions[0] || 'Đang sử dụng',
        'Ghi chú thêm': 'Kèm màn chiếu điện 120 inch điều khiển từ xa và giá treo trần'
      },
      {
        'Mã tài sản': 'TS-2026-0004',
        'Tên tài sản (*)': 'Bộ bàn ghế phòng họp cao cấp Hòa Phát (1 bàn 4m + 12 ghế da)',
        'Loại tài sản (*)': assetTypeOptions.find(t => t.includes('Bàn ghế') || t.includes('Nội thất')) || assetTypeOptions[0] || 'Bàn ghế & Nội thất',
        'Nhãn hiệu / Hãng SX': 'Hòa Phát',
        'Số lượng (*)': 1,
        'Đơn vị tính (*)': 'Bộ',
        'Đơn giá (VNĐ) (*)': 36000000,
        'Thành tiền (VNĐ)': 36000000,
        'Năm nhập kho (*)': 2024,
        'Năm xuất kho': '',
        'Thời gian SD (Năm)': '', // Để trống = vô hạn
        'Nguồn kinh phí (*)': 'Ngân sách Nhà nước cấp',
        'Phòng ban tiếp nhận (*)': defaultDept,
        'Vị trí cụ thể': 'Cơ sở 1 > Khu A > Tầng 3 > Phòng Họp Hội đồng',
        'Người chịu trách nhiệm': departments.find(d => d.name === defaultDept)?.manager || 'ThS. Lê Hoàng Long',
        'Người sử dụng trực tiếp': 'Ban Giám hiệu & Các đơn vị',
        'Tình trạng ban đầu (*)': conditionOptions[0] || 'Tốt',
        'Trạng thái ban đầu (*)': statusOptions[0] || 'Đang sử dụng',
        'Ghi chú thêm': 'Để trống cột Thời gian SD (Năm) đồng nghĩa với thời hạn sử dụng vô hạn (không tính khấu hao & không cảnh báo)'
      },
      {
        'Mã tài sản': '', // Minh họa để trống mã tài sản
        'Tên tài sản (*)': 'Thiết bị đo dao động số đa kênh Tektronix TBS1102B-EDU',
        'Loại tài sản (*)': assetTypeOptions.find(t => t.includes('Thí nghiệm') || t.includes('Xưởng')) || assetTypeOptions[0] || 'Thiết bị Thí nghiệm',
        'Nhãn hiệu / Hãng SX': 'Tektronix',
        'Số lượng (*)': 3,
        'Đơn vị tính (*)': 'Cái',
        'Đơn giá (VNĐ) (*)': 19500000,
        'Thành tiền (VNĐ)': 58500000,
        'Năm nhập kho (*)': 2026,
        'Năm xuất kho': '',
        'Thời gian SD (Năm)': 8,
        'Nguồn kinh phí (*)': 'Ngân sách Nhà nước cấp',
        'Phòng ban tiếp nhận (*)': labDept,
        'Vị trí cụ thể': 'Cơ sở 1 > Khu C > Tầng 1 > Phòng Thí nghiệm 102',
        'Người chịu trách nhiệm': departments.find(d => d.name === labDept)?.manager || 'Thủ kho',
        'Người sử dụng trực tiếp': 'Chưa bàn giao',
        'Tình trạng ban đầu (*)': conditionOptions[0] || 'Tốt',
        'Trạng thái ban đầu (*)': 'Trong kho',
        'Ghi chú thêm': 'Để trống cột Mã tài sản thì hệ thống sẽ tự động sinh mã dạng TS-YYYY-XXXX khi import'
      }
    ];

    // Sheet 2: HuongDan_NhapLieu
    const instructionsRows = [
      {
        'STT': 1,
        'Tên cột trong file': 'Mã tài sản',
        'Bắt buộc?': 'Tùy chọn',
        'Định dạng dữ liệu': 'Văn bản (Chuỗi)',
        'Quy tắc & Gợi ý nhập': 'Để trống để hệ thống TỰ ĐỘNG sinh mã dạng TS-YYYY-XXXX. Nếu đơn vị có mã định danh riêng thì nhập mã tại đây.',
        'Ví dụ mẫu': 'TS-2026-0001 (hoặc để trống)'
      },
      {
        'STT': 2,
        'Tên cột trong file': 'Tên tài sản (*)',
        'Bắt buộc?': 'BẮT BUỘC',
        'Định dạng dữ liệu': 'Văn bản',
        'Quy tắc & Gợi ý nhập': 'Tên đầy đủ của tài sản, thiết bị hoặc tài sản cố định cần quản lý.',
        'Ví dụ mẫu': 'Máy tính để bàn Dell OptiPlex 7010'
      },
      {
        'STT': 3,
        'Tên cột trong file': 'Loại tài sản (*)',
        'Bắt buộc?': 'BẮT BUỘC',
        'Định dạng dữ liệu': 'Văn bản',
        'Quy tắc & Gợi ý nhập': 'Chọn đúng một trong các loại tài sản chuẩn của hệ thống (xem Sheet DanhMuc_ThamChieu).',
        'Ví dụ mẫu': 'Thiết bị CNTT, Thiết bị Văn phòng...'
      },
      {
        'STT': 4,
        'Tên cột trong file': 'Nhãn hiệu / Hãng SX',
        'Bắt buộc?': 'Tùy chọn',
        'Định dạng dữ liệu': 'Văn bản',
        'Quy tắc & Gợi ý nhập': 'Hãng sản xuất, nhà sản xuất hoặc xuất xứ của tài sản.',
        'Ví dụ mẫu': 'Dell, HP, Panasonic, Canon, Hòa Phát...'
      },
      {
        'STT': 5,
        'Tên cột trong file': 'Số lượng (*)',
        'Bắt buộc?': 'BẮT BUỘC',
        'Định dạng dữ liệu': 'Số nguyên (> 0)',
        'Quy tắc & Gợi ý nhập': 'Số lượng bàn giao/nhập kho. Nếu để trống hệ thống sẽ tự động gán là 1.',
        'Ví dụ mẫu': '1, 5, 10'
      },
      {
        'STT': 6,
        'Tên cột trong file': 'Đơn vị tính (*)',
        'Bắt buộc?': 'BẮT BUỘC',
        'Định dạng dữ liệu': 'Văn bản',
        'Quy tắc & Gợi ý nhập': 'Đơn vị đo lường của tài sản.',
        'Ví dụ mẫu': 'Cái, Bộ, Chiếc, Thiết bị, Hệ thống'
      },
      {
        'STT': 7,
        'Tên cột trong file': 'Đơn giá (VNĐ) (*)',
        'Bắt buộc?': 'BẮT BUỘC',
        'Định dạng dữ liệu': 'Số (VNĐ)',
        'Quy tắc & Gợi ý nhập': 'Nguyên giá / giá mua vào của 1 đơn vị tài sản. Không ghi kèm chữ đ.',
        'Ví dụ mẫu': '16500000'
      },
      {
        'STT': 8,
        'Tên cột trong file': 'Thành tiền (VNĐ)',
        'Bắt buộc?': 'Tùy chọn (Tự tính)',
        'Định dạng dữ liệu': 'Số (VNĐ)',
        'Quy tắc & Gợi ý nhập': 'Tổng kinh phí mua sắm = Số lượng * Đơn giá. Có thể để trống hệ thống tự tính.',
        'Ví dụ mẫu': '82500000'
      },
      {
        'STT': 9,
        'Tên cột trong file': 'Năm nhập kho (*)',
        'Bắt buộc?': 'BẮT BUỘC',
        'Định dạng dữ liệu': 'Năm (4 chữ số)',
        'Quy tắc & Gợi ý nhập': 'Năm tiếp nhận / đưa tài sản vào sử dụng. Mặc định nếu trống là năm hiện tại.',
        'Ví dụ mẫu': '2026'
      },
      {
        'STT': 10,
        'Tên cột trong file': 'Năm xuất kho',
        'Bắt buộc?': 'Tùy chọn',
        'Định dạng dữ liệu': 'Năm (4 chữ số)',
        'Quy tắc & Gợi ý nhập': 'Để trống nếu tài sản đang sử dụng bình thường trong đơn vị.',
        'Ví dụ mẫu': 'Để trống hoặc 2028'
      },
      {
        'STT': 11,
        'Tên cột trong file': 'Thời gian SD (Năm)',
        'Bắt buộc?': 'Tùy chọn',
        'Định dạng dữ liệu': 'Số năm (nguyên)',
        'Quy tắc & Gợi ý nhập': 'Tuổi thọ sử dụng dự kiến. ĐỂ TRỐNG = Sử dụng vô hạn (không tính khấu hao & không cảnh báo).',
        'Ví dụ mẫu': '5 (hoặc để trống nếu vô hạn)'
      },
      {
        'STT': 12,
        'Tên cột trong file': 'Nguồn kinh phí (*)',
        'Bắt buộc?': 'BẮT BUỘC',
        'Định dạng dữ liệu': 'Văn bản',
        'Quy tắc & Gợi ý nhập': 'Nguồn cấp kinh phí mua sắm theo quy định tài chính.',
        'Ví dụ mẫu': 'Ngân sách Nhà nước cấp, Nguồn thu sự nghiệp...'
      },
      {
        'STT': 13,
        'Tên cột trong file': 'Phòng ban tiếp nhận (*)',
        'Bắt buộc?': 'BẮT BUỘC',
        'Định dạng dữ liệu': 'Văn bản',
        'Quy tắc & Gợi ý nhập': 'Tên phòng ban, khoa, phòng thí nghiệm quản lý tài sản (khớp theo danh mục đơn vị).',
        'Ví dụ mẫu': 'Phòng Hành chính - Quản trị, Khoa CNTT...'
      },
      {
        'STT': 14,
        'Tên cột trong file': 'Vị trí cụ thể',
        'Bắt buộc?': 'Tùy chọn',
        'Định dạng dữ liệu': 'Văn bản',
        'Quy tắc & Gợi ý nhập': 'Vị trí lắp đặt chi tiết theo cây định vị hoặc tên phòng làm việc.',
        'Ví dụ mẫu': 'Cơ sở 1 > Khu A > Tầng 2 > Phòng A2.01'
      },
      {
        'STT': 15,
        'Tên cột trong file': 'Người chịu trách nhiệm',
        'Bắt buộc?': 'Tùy chọn',
        'Định dạng dữ liệu': 'Họ và tên',
        'Quy tắc & Gợi ý nhập': 'Họ tên cán bộ quản lý / trưởng bộ phận phụ trách tài sản.',
        'Ví dụ mẫu': 'ThS. Lê Hoàng Long'
      },
      {
        'STT': 16,
        'Tên cột trong file': 'Người sử dụng trực tiếp',
        'Bắt buộc?': 'Tùy chọn',
        'Định dạng dữ liệu': 'Họ và tên',
        'Quy tắc & Gợi ý nhập': 'Họ tên cán bộ, giảng viên, nhân viên trực tiếp sử dụng tài sản hàng ngày.',
        'Ví dụ mẫu': 'Nguyễn Thị Hoa, Chưa bàn giao...'
      },
      {
        'STT': 17,
        'Tên cột trong file': 'Tình trạng ban đầu (*)',
        'Bắt buộc?': 'BẮT BUỘC',
        'Định dạng dữ liệu': 'Văn bản',
        'Quy tắc & Gợi ý nhập': 'Hiện trạng kỹ thuật ban đầu của tài sản khi nhập vào hệ thống.',
        'Ví dụ mẫu': 'Tốt, Khá, Hỏng nhẹ...'
      },
      {
        'STT': 18,
        'Tên cột trong file': 'Trạng thái ban đầu (*)',
        'Bắt buộc?': 'BẮT BUỘC',
        'Định dạng dữ liệu': 'Văn bản',
        'Quy tắc & Gợi ý nhập': 'Trạng thái theo dõi vòng đời tài sản.',
        'Ví dụ mẫu': 'Đang sử dụng, Trong kho, Chờ thanh lý...'
      },
      {
        'STT': 19,
        'Tên cột trong file': 'Ghi chú thêm',
        'Bắt buộc?': 'Tùy chọn',
        'Định dạng dữ liệu': 'Văn bản',
        'Quy tắc & Gợi ý nhập': 'Ghi chú thêm về cấu hình máy, phụ kiện, hợp đồng, số hóa đơn, thông số kỹ thuật...',
        'Ví dụ mẫu': 'Kèm màn hình 24 inch, chuột và bàn phím'
      }
    ];

    // Sheet 3: DanhMuc_ThamChieu
    const fundingSources = [
      'Ngân sách Nhà nước cấp',
      'Nguồn thu sự nghiệp',
      'Tài trợ / Viện trợ dự án',
      'Khác'
    ];

    const maxLen = Math.max(
      assetTypeOptions.length,
      conditionOptions.length,
      statusOptions.length,
      departments.length,
      fundingSources.length
    );

    const referenceRows = [];
    for (let i = 0; i < maxLen; i++) {
      referenceRows.push({
        'STT': i + 1,
        'Loại tài sản hợp lệ': assetTypeOptions[i] || '',
        'Tình trạng hợp lệ': conditionOptions[i] || '',
        'Trạng thái hợp lệ': statusOptions[i] || '',
        'Nguồn kinh phí hợp lệ': fundingSources[i] || '',
        'Phòng ban hiện có': departments[i]?.name || ''
      });
    }

    exportMultiSheetExcel([
      {
        name: 'DanhSach_NhapTaiSan',
        data: sampleRows,
        colWidths: [
          { wch: 18 }, // Mã TS
          { wch: 42 }, // Tên TS
          { wch: 24 }, // Loại TS
          { wch: 22 }, // Nhãn hiệu
          { wch: 14 }, // SL
          { wch: 14 }, // ĐVT
          { wch: 20 }, // Đơn giá
          { wch: 20 }, // Thành tiền
          { wch: 16 }, // Năm nhập
          { wch: 15 }, // Năm xuất
          { wch: 20 }, // Thời gian SD
          { wch: 26 }, // Nguồn kinh phí
          { wch: 32 }, // Phòng ban
          { wch: 42 }, // Vị trí
          { wch: 26 }, // Người chịu trách nhiệm
          { wch: 26 }, // Người sử dụng
          { wch: 22 }, // Tình trạng
          { wch: 22 }, // Trạng thái
          { wch: 50 }  // Ghi chú
        ]
      },
      {
        name: 'HuongDan_NhapLieu',
        data: instructionsRows,
        colWidths: [
          { wch: 6 },
          { wch: 28 },
          { wch: 20 },
          { wch: 22 },
          { wch: 70 },
          { wch: 40 }
        ]
      },
      {
        name: 'DanhMuc_ThamChieu',
        data: referenceRows,
        colWidths: [
          { wch: 6 },
          { wch: 28 },
          { wch: 22 },
          { wch: 22 },
          { wch: 28 },
          { wch: 36 }
        ]
      }
    ], 'Mau_Nhap_Tai_San_Chuan.xlsx');
  };

  // Helper: Smart extract value across multiple aliases and normalize special characters
  const extractVal = (row, candidateKeys) => {
    // Direct match
    for (const key of candidateKeys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
        return String(row[key]).trim();
      }
    }
    // Normalized match
    const rowKeys = Object.keys(row);
    for (const cand of candidateKeys) {
      const normCand = cand.toLowerCase().replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/gi, '');
      const foundKey = rowKeys.find(k => {
        const normK = k.toLowerCase().replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/gi, '');
        return normK === normCand;
      });
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
        return String(row[foundKey]).trim();
      }
    }
    return '';
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

      // Filter out empty rows (where neither name nor code is filled)
      const validRows = jsonList.filter(row => {
        const name = extractVal(row, ['Tên tài sản (*)', 'Tên tài sản', 'Tên TS', 'Tên', 'name']);
        const code = extractVal(row, ['Mã tài sản', 'Mã tài sản (*)', 'Mã TS', 'Mã', 'code']);
        return Boolean(name || code);
      });

      if (validRows.length === 0) {
        alert('Tập tin Excel không có dòng dữ liệu tài sản hợp lệ nào để nhập.');
        setIsImporting(false);
        return;
      }

      const formatted = validRows.map((row, idx) => {
        const userCode = extractVal(row, ['Mã tài sản', 'Mã tài sản (*)', 'Mã TS', 'Mã', 'code']);
        const generatedCode = userCode || `TS-${new Date().getFullYear()}-${String(assets.length + idx + 1).padStart(4, '0')}`;

        const rawYear = extractVal(row, ['Năm nhập kho (*)', 'Năm nhập (*)', 'Năm nhập kho', 'Năm nhập', 'Năm mua', 'Ngày nhập', 'importYear']);
        let impYear = new Date().getFullYear();
        if (rawYear) {
          const match = String(rawYear).match(/\b(19\d{2}|20\d{2})\b/);
          if (match) {
            impYear = Number(match[1]);
          } else {
            const n = Number(rawYear);
            if (!isNaN(n) && n >= 1990 && n <= 2100) impYear = n;
          }
        }

        const rawExp = extractVal(row, ['Năm xuất kho', 'Năm xuất', 'exportYear']);
        let expYear = null;
        if (rawExp) {
          const match = String(rawExp).match(/\b(19\d{2}|20\d{2})\b/);
          if (match) {
            expYear = Number(match[1]);
          } else {
            const n = Number(rawExp);
            if (!isNaN(n) && n >= 1990 && n <= 2100) expYear = n;
          }
        }

        const lifespanRaw = extractVal(row, ['Thời gian SD (Năm)', 'Thời gian sử dụng (Năm)', 'Hạn SD (Năm)', 'Thời gian sử dụng', 'Khấu hao (năm)', 'lifespanYears']);
        const lifespanVal = (lifespanRaw !== '' && !isNaN(Number(lifespanRaw)))
          ? Number(lifespanRaw)
          : null;

        const rawCost = extractVal(row, ['Đơn giá (VNĐ) (*)', 'Đơn giá (VNĐ)', 'Đơn giá', 'Nguyên giá (VNĐ) (*)', 'Nguyên giá (VNĐ)', 'Nguyên giá', 'Giá mua', 'cost']);
        const cleanCost = typeof rawCost === 'string' ? rawCost.replace(/[.,\sđVNĐvnd]/g, '') : rawCost;
        const cost = Number(cleanCost) || 0;

        const rawQty = extractVal(row, ['Số lượng (*)', 'Số lượng', 'SL', 'quantity']);
        const quantity = Math.max(1, Number(rawQty) || 1);

        const deptName = extractVal(row, ['Phòng ban tiếp nhận (*)', 'Phòng ban (*)', 'Phòng ban tiếp nhận', 'Phòng ban', 'Phòng/Ban tiếp nhận', 'Phòng/Ban', 'Đơn vị quản lý', 'Đơn vị', 'department']) || (departments[0]?.name || 'Phòng Hành chính - Quản trị');
        const matchedDept = departments.find(d => 
          d.name.trim().toLowerCase() === deptName.trim().toLowerCase() ||
          d.id.trim().toLowerCase() === deptName.trim().toLowerCase()
        );
        const departmentId = matchedDept ? matchedDept.id : (departments[0]?.id || 'pb-hcqt');
        const finalDeptName = matchedDept ? matchedDept.name : deptName;

        const fundingSource = extractVal(row, ['Nguồn kinh phí (*)', 'Nguồn kinh phí', 'Nguồn vốn', 'fundingSource']) || 'Ngân sách Nhà nước cấp';

        const responsiblePerson = extractVal(row, ['Người chịu trách nhiệm', 'Người chịu trách nhiệm chính', 'Người quản lý', 'responsiblePerson']) || (matchedDept?.manager || currentUser?.name || 'Thủ kho');

        const userPerson = extractVal(row, ['Người sử dụng trực tiếp', 'Người sử dụng', 'currentUser']) || responsiblePerson || 'Chưa bàn giao';

        const rawName = extractVal(row, ['Tên tài sản (*)', 'Tên tài sản', 'Tên TS', 'Tên', 'name']);
        const name = cleanText(rawName) || 'Tài sản nhập Excel';
        const rawType = extractVal(row, ['Loại tài sản (*)', 'Loại tài sản', 'Loại TS', 'Nhóm tài sản', 'type']);
        const type = cleanText(rawType) || assetTypeOptions[0] || 'Thiết bị CNTT';
        const brand = cleanText(extractVal(row, ['Nhãn hiệu / Hãng SX', 'Nhãn hiệu', 'Hãng sản xuất', 'Hãng SX', 'Thương hiệu', 'brand']));
        const unit = cleanText(extractVal(row, ['Đơn vị tính (*)', 'Đơn vị tính', 'ĐVT', 'Đơn vị', 'unit'])) || 'Cái';
        const locationPath = cleanText(extractVal(row, ['Vị trí cụ thể', 'Vị trí lắp đặt', 'Vị trí', 'Địa điểm', 'location'])) || 'Cơ sở 1 > Khu A > Tầng 1 > Kho Tổng CS1';
        const rawCondition = extractVal(row, ['Tình trạng ban đầu (*)', 'Tình trạng (*)', 'Tình trạng ban đầu', 'Tình trạng', 'condition']);
        const condition = canonicalCondition(rawCondition) || conditionOptions[0] || 'Tốt';
        const rawStatus = extractVal(row, ['Trạng thái ban đầu (*)', 'Trạng thái (*)', 'Trạng thái ban đầu', 'Trạng thái', 'status']);
        const status = canonicalStatus(rawStatus) || statusOptions[0] || 'Đang sử dụng';
        const notes = cleanText(extractVal(row, ['Ghi chú thêm', 'Ghi chú', 'notes'])) || 'Nhập từ file Excel';

        return {
          code: cleanText(generatedCode),
          name,
          type,
          brand,
          quantity,
          unit,
          importYear: impYear,
          purchaseYear: impYear,
          exportYear: expYear,
          purchaseDate: `${impYear}-01-01`,
          importDate: `${impYear}-01-01`,
          cost,
          lifespanYears: lifespanVal,
          fundingSource: cleanText(fundingSource),
          departmentId: cleanText(departmentId),
          departmentName: cleanText(finalDeptName),
          locationPath,
          responsiblePerson: cleanText(responsiblePerson),
          currentUser: cleanText(userPerson),
          condition,
          status,
          notes,
          qrValue: cleanText(generatedCode)
        };
      });

      importAssetsBatch(formatted);
      setNotification(`Đã nhập thành công ${formatted.length} tài sản từ file Excel vào hệ thống!`);
      alert(`Đã nhập thành công ${formatted.length} tài sản từ file Excel!`);
      setActiveTab('assets');
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng tệp!');
    } finally {
      setIsImporting(false);
      // Reset input value to allow re-importing the same file if needed
      e.target.value = '';
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

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsTemplateGuideOpen(true)}
            style={{ color: '#0369a1', borderColor: '#bae6fd' }}
          >
            <HelpCircle size={16} />
            Hướng dẫn mẫu Excel (19 cột)
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsOptionsModalOpen(true)}
            style={{ color: '#1e40af' }}
          >
            <Sliders size={16} />
            Tùy chỉnh danh mục
          </button>
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

      {/* Banner thông tin về mẫu Excel chuẩn 19 cột */}
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '10px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileSpreadsheet size={24} color="#16a34a" />
          <div style={{ fontSize: '0.875rem', color: '#166534' }}>
            <strong>Mẫu Excel đã được cập nhật chuẩn 19 trường dữ liệu:</strong> Bao gồm đầy đủ Mã TS, Tên, Loại, Nhãn hiệu, SL, ĐVT, Đơn giá, Thành tiền, Năm nhập/xuất, Hạn SD (để trống = vô hạn), Nguồn kinh phí, Phòng ban, Vị trí, Người quản lý, Tình trạng, Trạng thái và Ghi chú.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setIsTemplateGuideOpen(true)}
            style={{
              background: '#ffffff',
              border: '1px solid #86efac',
              color: '#15803d',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <HelpCircle size={14} />
            Xem cấu trúc 19 cột
          </button>
          <button
            type="button"
            onClick={handleDownloadSample}
            style={{
              background: '#16a34a',
              border: 'none',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Download size={14} />
            Tải mẫu .XLSX
          </button>
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
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Tên tài sản (*)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Máy chiếu Laser Panasonic, Bàn làm việc gỗ..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Loại tài sản</label>
                  <button
                    type="button"
                    onClick={() => openOptions('types')}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#2563eb',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    + Tùy biến
                  </button>
                </div>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {assetTypeOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nhãn hiệu / Hãng SX</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Dell, HP, Canon, Hòa Phát..."
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tài chính & Năm nhập */}
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
                <label className="form-label">Năm nhập kho (*)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1990"
                  max="2100"
                  placeholder="VD: 2026"
                  value={formData.importYear}
                  onChange={(e) => setFormData({ ...formData, importYear: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Năm xuất kho (nếu có)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1990"
                  max="2100"
                  placeholder="Để trống nếu chưa xuất"
                  value={formData.exportYear}
                  onChange={(e) => setFormData({ ...formData, exportYear: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Thời gian sử dụng dự kiến (Năm)
                  <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 400 }}>— để trống = vô hạn</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Để trống = Sử dụng vô hạn (không cảnh báo)"
                  value={formData.lifespanYears}
                  onChange={(e) => setFormData({ ...formData, lifespanYears: e.target.value })}
                  min="1"
                  max="100"
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
                  list="inbound-location-list"
                />
                <datalist id="inbound-location-list">
                  {locationSuggestions.map(loc => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Tình trạng ban đầu</label>
                  <button
                    type="button"
                    onClick={() => openOptions('conditions')}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#2563eb',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    + Tùy biến
                  </button>
                </div>
                <select
                  className="form-select"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                >
                  {conditionOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Trạng thái ban đầu</label>
                  <button
                    type="button"
                    onClick={() => openOptions('statuses')}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#2563eb',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    + Tùy biến
                  </button>
                </div>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {statusOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú thêm</label>
              <textarea
                className="form-textarea"
                placeholder="Ghi chú chi tiết về phụ kiện, thông số hoặc hướng dẫn..."
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

      <ManageOptionsModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        initialTab={optionsModalTab}
      />

      {/* Modal Hướng dẫn chi tiết cấu trúc 19 cột mẫu Excel */}
      <Modal
        isOpen={isTemplateGuideOpen}
        onClose={() => setIsTemplateGuideOpen(false)}
        title="Cấu Trúc & Hướng Dẫn Mẫu Excel Nhập Tài Sản (19 Cột)"
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              File tải về gồm 3 trang tính (Sheets): <strong>Dữ liệu mẫu</strong>, <strong>Hướng dẫn</strong> và <strong>Danh mục tham chiếu</strong>
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsTemplateGuideOpen(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleDownloadSample();
                  setIsTemplateGuideOpen(false);
                }}
                style={{ background: '#16a34a' }}
              >
                <Download size={16} />
                Tải mẫu Excel (.XLSX)
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Thông tin 3 sheet */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 18px',
            fontSize: '0.85rem',
            lineHeight: 1.6
          }}>
            <div style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileSpreadsheet size={18} color="#2563eb" />
              Tập tin Excel mẫu tải về bao gồm 3 Sheet chuyên nghiệp:
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#334155' }}>
              <li><strong>Sheet 1 (DanhSach_NhapTaiSan):</strong> Bảng dữ liệu chính với đầy đủ 19 cột chuẩn hóa kèm 5 dòng ví dụ thực tế (PC, Máy in, Máy chiếu, Bàn ghế, Thiết bị đo).</li>
              <li><strong>Sheet 2 (HuongDan_NhapLieu):</strong> Bảng giải thích chi tiết ý nghĩa, kiểu dữ liệu, các trường bắt buộc (*) và tùy chọn.</li>
              <li><strong>Sheet 3 (DanhMuc_ThamChieu):</strong> Danh sách các giá trị chuẩn trong hệ thống (Loại tài sản, Tình trạng, Trạng thái, Nguồn kinh phí, Phòng ban) giúp đối soát copy/paste tiện lợi.</li>
            </ul>
          </div>

          {/* Bảng tóm tắt 19 cột */}
          <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table className="table" style={{ margin: 0, fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                  <th style={{ width: '180px' }}>Tên cột trong Excel</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Bắt buộc</th>
                  <th style={{ width: '120px' }}>Kiểu dữ liệu</th>
                  <th>Quy tắc & Gợi ý nghiệp vụ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>1</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>Mã tài sản</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#64748b', fontSize: '0.75rem' }}>Tùy chọn</span></td>
                  <td>Văn bản</td>
                  <td>Để trống để hệ thống <strong>TỰ SINH MÃ</strong> tự động (TS-YYYY-XXXX). Nhập nếu đơn vị có mã quản lý riêng.</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>2</td>
                  <td style={{ fontWeight: 700, color: '#dc2626' }}>Tên tài sản (*)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>BẮT BUỘC</span></td>
                  <td>Văn bản</td>
                  <td>Tên đầy đủ của tài sản, trang thiết bị, máy móc cần quản lý.</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>3</td>
                  <td style={{ fontWeight: 700, color: '#dc2626' }}>Loại tài sản (*)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>BẮT BUỘC</span></td>
                  <td>Danh mục</td>
                  <td>Chọn theo danh mục: Thiết bị CNTT, Thiết bị Văn phòng, Thiết bị Giảng dạy, Thiết bị Thí nghiệm, Bàn ghế & Nội thất, Khác...</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>4</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>Nhãn hiệu / Hãng SX</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#64748b', fontSize: '0.75rem' }}>Tùy chọn</span></td>
                  <td>Văn bản</td>
                  <td>Hãng sản xuất, xuất xứ (VD: Dell, HP, Panasonic, Hòa Phát...).</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>5</td>
                  <td style={{ fontWeight: 700, color: '#dc2626' }}>Số lượng (*)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>BẮT BUỘC</span></td>
                  <td>Số nguyên</td>
                  <td>Số lượng bàn giao (VD: 1, 5, 10). Mặc định là 1 nếu để trống.</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>6</td>
                  <td style={{ fontWeight: 700, color: '#dc2626' }}>Đơn vị tính (*)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>BẮT BUỘC</span></td>
                  <td>Văn bản</td>
                  <td>Đơn vị đo lường (VD: Cái, Bộ, Chiếc, Thiết bị, Hệ thống...).</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>7</td>
                  <td style={{ fontWeight: 700, color: '#dc2626' }}>Đơn giá (VNĐ) (*)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>BẮT BUỘC</span></td>
                  <td>Số tiền (VNĐ)</td>
                  <td>Nguyên giá mua sắm của 1 đơn vị. Hỗ trợ cả số thông thường lẫn dấu chấm/phẩy (VD: 16,500,000).</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>8</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>Thành tiền (VNĐ)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#64748b', fontSize: '0.75rem' }}>Tự tính</span></td>
                  <td>Số tiền (VNĐ)</td>
                  <td>Tổng kinh phí = Số lượng x Đơn giá. Có thể để trống để hệ thống tự động tính.</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>9</td>
                  <td style={{ fontWeight: 700, color: '#dc2626' }}>Năm nhập kho (*)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>BẮT BUỘC</span></td>
                  <td>Năm 4 số</td>
                  <td>Năm đưa vào quản lý (VD: 2026, 2025). Mặc định là năm hiện tại nếu trống.</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>10</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>Năm xuất kho</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#64748b', fontSize: '0.75rem' }}>Tùy chọn</span></td>
                  <td>Năm 4 số</td>
                  <td>Để trống nếu tài sản đang sử dụng bình thường tại đơn vị.</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>11</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>Thời gian SD (Năm)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#64748b', fontSize: '0.75rem' }}>Tùy chọn</span></td>
                  <td>Số năm</td>
                  <td>Tuổi thọ sử dụng dự kiến (VD: 5, 8). <strong>ĐỂ TRỐNG = SỬ DỤNG VÔ HẠN</strong> (không cảnh báo hết hạn).</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>12</td>
                  <td style={{ fontWeight: 700, color: '#dc2626' }}>Nguồn kinh phí (*)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>BẮT BUỘC</span></td>
                  <td>Danh mục</td>
                  <td>Ngân sách Nhà nước cấp, Nguồn thu sự nghiệp, Tài trợ / Viện trợ dự án, Khác.</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>13</td>
                  <td style={{ fontWeight: 700, color: '#dc2626' }}>Phòng ban tiếp nhận (*)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>BẮT BUỘC</span></td>
                  <td>Tên phòng ban</td>
                  <td>Đơn vị tiếp nhận và quản lý (khớp theo danh mục Phòng ban của đơn vị).</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>14</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>Vị trí cụ thể</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#64748b', fontSize: '0.75rem' }}>Tùy chọn</span></td>
                  <td>Văn bản</td>
                  <td>Đường dẫn vị trí (VD: Cơ sở 1 &gt; Khu A &gt; Tầng 2 &gt; Phòng A2.01).</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>15</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>Người chịu trách nhiệm</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#64748b', fontSize: '0.75rem' }}>Tùy chọn</span></td>
                  <td>Họ tên</td>
                  <td>Cán bộ quản lý / Trưởng phòng phụ trách tài sản.</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>16</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>Người sử dụng trực tiếp</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#64748b', fontSize: '0.75rem' }}>Tùy chọn</span></td>
                  <td>Họ tên</td>
                  <td>Cán bộ, giảng viên, nhân viên trực tiếp quản lý vận hành hàng ngày.</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>17</td>
                  <td style={{ fontWeight: 700, color: '#dc2626' }}>Tình trạng ban đầu (*)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>BẮT BUỘC</span></td>
                  <td>Danh mục</td>
                  <td>Tốt, Khá, Hỏng nhẹ, Hỏng nặng, Không sử dụng được.</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>18</td>
                  <td style={{ fontWeight: 700, color: '#dc2626' }}>Trạng thái ban đầu (*)</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>BẮT BUỘC</span></td>
                  <td>Danh mục</td>
                  <td>Đang sử dụng, Trong kho, Điều chuyển, Chờ thanh lý...</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>19</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>Ghi chú thêm</td>
                  <td style={{ textAlign: 'center' }}><span style={{ color: '#64748b', fontSize: '0.75rem' }}>Tùy chọn</span></td>
                  <td>Văn bản</td>
                  <td>Ghi chú phụ kiện đi kèm, số hóa đơn, thông số kỹ thuật, ghi chú bảo hành...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
