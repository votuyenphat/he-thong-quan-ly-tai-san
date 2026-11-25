// src/data/mockData.js
// Dữ liệu mẫu trang thiết bị chuẩn hóa phục vụ quản lý và đào tạo Nhà trường

export const INITIAL_DEPARTMENTS = [
  { id: 'dept-cntt', code: 'CNTT', name: 'Khoa Công nghệ Thông tin', manager: 'TS. Nguyễn Văn Hùng', phone: '0912345671' },
  { id: 'dept-dien', code: 'DIEN', name: 'Khoa Điện - Điện tử', manager: 'ThS. Trần Thị Mai', phone: '0912345672' },
  { id: 'dept-cokhi', code: 'COKHI', name: 'Khoa Cơ khí - Động lực', manager: 'TS. Lê Hoàng Long', phone: '0912345673' },
  { id: 'dept-lab', code: 'TT-TNTH', name: 'Trung tâm Thí nghiệm Thực hành', manager: 'Kỹ sư Vũ Đức Anh', phone: '0912345674' },
  { id: 'dept-hcqt', code: 'HCQT', name: 'Phòng Quản trị - Thiết bị', manager: 'Võ Tuyền Phát', phone: '0912345675' }
];

export const INITIAL_LOCATIONS = [
  {
    id: 'loc-cs1',
    name: 'Cơ sở 1 (Trụ sở chính)',
    children: [
      {
        id: 'loc-nha-a',
        name: 'Tòa nhà A - Khu Giảng đường',
        children: [
          {
            id: 'loc-a-t1',
            name: 'Tầng 1',
            children: [
              { id: 'loc-a101', name: 'Phòng A101 - Giảng đường đa năng' },
              { id: 'loc-a102', name: 'Phòng A102 - Giảng đường chuyên đề' }
            ]
          },
          {
            id: 'loc-a-t2',
            name: 'Tầng 2',
            children: [
              { id: 'loc-a201', name: 'Phòng A201 - Phòng học thông minh' }
            ]
          }
        ]
      },
      {
        id: 'loc-nha-b',
        name: 'Tòa nhà B - Trung tâm Thực hành & Lab',
        children: [
          {
            id: 'loc-b-t1',
            name: 'Tầng 1',
            children: [
              { id: 'loc-lab-ck', name: 'Xưởng Thực hành Cơ khí & Gia công' }
            ]
          },
          {
            id: 'loc-b-t2',
            name: 'Tầng 2',
            children: [
              { id: 'loc-lab-dien', name: 'Phòng Thí nghiệm Điện tử viễn thông' }
            ]
          },
          {
            id: 'loc-b-t3',
            name: 'Tầng 3',
            children: [
              { id: 'loc-lab-cntt1', name: 'Phòng Lab CNTT 1 (Đồ họa & AI)' },
              { id: 'loc-lab-cntt2', name: 'Phòng Lab CNTT 2 (Mạng máy tính)' }
            ]
          }
        ]
      }
    ]
  }
];

export const INITIAL_ASSETS = [
  {
    id: 'as-001',
    code: 'TS-2026-0001',
    name: 'Máy tính để bàn Dell OptiPlex 7010 MT',
    type: 'Thiết bị CNTT',
    brand: 'Dell',
    quantity: 30,
    unit: 'Bộ',
    cost: 16500000,
    importYear: 2024,
    purchaseYear: 2024,
    purchaseDate: '2024-02-15',
    lifespanYears: 5,
    departmentId: 'dept-cntt',
    departmentName: 'Khoa Công nghệ Thông tin',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Tòa nhà B - Trung tâm Thực hành & Lab > Tầng 3 > Phòng Lab CNTT 1 (Đồ họa & AI)',
    responsiblePerson: 'TS. Nguyễn Văn Hùng',
    currentUser: 'KTV. Lê Minh Tuấn',
    condition: 'Tốt',
    status: 'Đang sử dụng',
    trainingSuitability: 'Phù hợp đào tạo',
    technicalSpecs: 'Core i7-13700, 32GB RAM, 1TB SSD NVMe, GPU RTX 3060 12GB',
    obsoleteReason: '',
    maintenanceStatus: 'Bình thường',
    fundingSource: 'Ngân sách Nhà nước cấp',
    notes: 'Phục vụ đào tạo Trí tuệ nhân tạo và Xử lý ảnh'
  },
  {
    id: 'as-002',
    code: 'TS-2018-0042',
    name: 'Máy tính để bàn HP Compaq CQ2000',
    type: 'Thiết bị CNTT',
    brand: 'HP',
    quantity: 25,
    unit: 'Bộ',
    cost: 6200000,
    importYear: 2017,
    purchaseYear: 2017,
    purchaseDate: '2017-08-10',
    lifespanYears: 5,
    departmentId: 'dept-cntt',
    departmentName: 'Khoa Công nghệ Thông tin',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Tòa nhà B - Trung tâm Thực hành & Lab > Tầng 3 > Phòng Lab CNTT 2 (Mạng máy tính)',
    responsiblePerson: 'TS. Nguyễn Văn Hùng',
    currentUser: 'ThS. Đặng Văn Nam',
    condition: 'Hỏng nặng',
    status: 'Đang sử dụng',
    trainingSuitability: 'Lạc hậu / Không phù hợp đào tạo',
    technicalSpecs: 'Intel Core 2 Duo E7500, 2GB RAM DDR2, 160GB HDD SATA2, Win 7 32-bit',
    obsoleteReason: 'Cấu hình quá cũ, khởi động chậm, không tương thích phần mềm mô phỏng mạng Cisco Packet Tracer mới và VS Code',
    maintenanceStatus: 'Hỏng không thể sửa',
    fundingSource: 'Dự án tăng cường cơ sở vật chất',
    notes: 'Đã hết niên hạn sử dụng (quá 8 năm), đề xuất Ban Giám Hiệu thay mới'
  },
  {
    id: 'as-003',
    code: 'TS-2016-0105',
    name: 'Máy hiện sóng tương tự Kenwood CS-4125',
    type: 'Thiết bị Thí nghiệm',
    brand: 'Kenwood',
    quantity: 8,
    unit: 'Cái',
    cost: 14500000,
    importYear: 2016,
    purchaseYear: 2016,
    purchaseDate: '2016-11-20',
    lifespanYears: 6,
    departmentId: 'dept-dien',
    departmentName: 'Khoa Điện - Điện tử',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Tòa nhà B - Trung tâm Thực hành & Lab > Tầng 2 > Phòng Thí nghiệm Điện tử viễn thông',
    responsiblePerson: 'ThS. Trần Thị Mai',
    currentUser: 'KTV. Hoàng Minh',
    condition: 'Không sử dụng được',
    status: 'Đang sử dụng',
    trainingSuitability: 'Lạc hậu / Không phù hợp đào tạo',
    technicalSpecs: 'Băng thông 20MHz, màn hình tia Catot CRT, hiển thị analog, không có cổng USB/kết nối máy tính',
    obsoleteReason: 'Công nghệ tương tự CRT cũ không đáp ứng chương trình đào tạo Xử lý tín hiệu số hiện đại (DSP), không còn linh kiện bóng hình thay thế',
    maintenanceStatus: 'Hỏng không thể sửa',
    fundingSource: 'Ngân sách Nhà nước cấp',
    notes: 'Đề xuất thanh lý và đầu tư máy hiện sóng kỹ thuật số DSO 100MHz'
  },
  {
    id: 'as-004',
    code: 'TS-2015-0019',
    name: 'Máy tiện vạn năng cơ khí T616',
    type: 'Thiết bị Xưởng',
    brand: 'Cơ khí Hà Nội',
    quantity: 4,
    unit: 'Máy',
    cost: 58000000,
    importYear: 2015,
    purchaseYear: 2015,
    purchaseDate: '2015-05-12',
    lifespanYears: 8,
    departmentId: 'dept-cokhi',
    departmentName: 'Khoa Cơ khí - Động lực',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Tòa nhà B - Trung tâm Thực hành & Lab > Tầng 1 > Xưởng Thực hành Cơ khí & Gia công',
    responsiblePerson: 'TS. Lê Hoàng Long',
    currentUser: 'Giảng viên Xưởng Cơ khí',
    condition: 'Hỏng nặng',
    status: 'Đang sử dụng',
    trainingSuitability: 'Lạc hậu / Không phù hợp đào tạo',
    technicalSpecs: 'Máy tiện ren vít cơ khí công suất 4.5kW, điều khiển bằng tay đòn số cơ',
    obsoleteReason: 'Trục chính bị đảo và mòn băng trượt, sai số gia công > 0.3mm, tiềm ẩn nguy cơ mất an toàn lao động cho sinh viên thực hành',
    maintenanceStatus: 'Hỏng chờ sửa chữa',
    fundingSource: 'Ngân sách Nhà nước cấp',
    notes: 'Đề xuất tạm dừng thực hành và thẩm định thanh lý hoặc sửa chữa tổng thể'
  },
  {
    id: 'as-005',
    code: 'TS-2021-0088',
    name: 'Máy chiếu đa năng Sony VPL-EX430',
    type: 'Thiết bị Giảng dạy',
    brand: 'Sony',
    quantity: 1,
    unit: 'Bộ',
    cost: 15800000,
    importYear: 2021,
    purchaseYear: 2021,
    purchaseDate: '2021-09-01',
    lifespanYears: 5,
    departmentId: 'dept-hcqt',
    departmentName: 'Phòng Quản trị - Thiết bị',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Tòa nhà A - Khu Giảng đường > Tầng 1 > Phòng A101 - Giảng đường đa năng',
    responsiblePerson: 'Võ Tuyền Phát',
    currentUser: 'Giảng viên phụ trách phòng A101',
    condition: 'Hỏng nhẹ',
    status: 'Đang sử dụng',
    trainingSuitability: 'Cần nâng cấp',
    technicalSpecs: 'Độ sáng 3200 Lumens, độ phân giải XGA (1024x768), cổng VGA/HDMI',
    obsoleteReason: 'Bóng đèn chiếu mờ sau 3000 giờ sử dụng, giảng đường lớn khó quan sát slide bài giảng',
    maintenanceStatus: 'Cần bảo dưỡng định kỳ',
    fundingSource: 'Kinh phí chi thường xuyên',
    notes: 'Cần thay cụm bóng đèn Halogen mới trong tháng'
  },
  {
    id: 'as-006',
    code: 'TS-2025-0012',
    name: 'Máy in 3D công nghiệp Creality K1 Max',
    type: 'Thiết bị Thí nghiệm',
    brand: 'Creality',
    quantity: 2,
    unit: 'Máy',
    cost: 26500000,
    importYear: 2025,
    purchaseYear: 2025,
    purchaseDate: '2025-03-10',
    lifespanYears: 5,
    departmentId: 'dept-lab',
    departmentName: 'Trung tâm Thí nghiệm Thực hành',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Tòa nhà B - Trung tâm Thực hành & Lab > Tầng 2 > Phòng Thí nghiệm Điện tử viễn thông',
    responsiblePerson: 'Kỹ sư Vũ Đức Anh',
    currentUser: 'Kỹ sư Vũ Đức Anh',
    condition: 'Tốt',
    status: 'Đang sử dụng',
    trainingSuitability: 'Phù hợp đào tạo',
    technicalSpecs: 'Kích thước in 300x300x300mm, tốc độ 600mm/s, hỗ trợ AI LiDAR cân bàn tự động',
    obsoleteReason: '',
    maintenanceStatus: 'Bình thường',
    fundingSource: 'Dự án ODA hỗ trợ kỹ thuật',
    notes: 'Thiết bị công nghệ mới phục vụ chế tạo mẫu nhanh cho đồ án sinh viên'
  }
];

export const INITIAL_TRANSFERS = [];
export const INITIAL_RECALLS = [];
export const INITIAL_LIQUIDATIONS = [];
export const INITIAL_INVENTORY_SESSIONS = [];
export const INITIAL_AUDIT_LOGS = [];

export const PRESET_USERS = [
  {
    id: 'user-admin',
    email: 'admin@donvi.vn',
    name: 'Quản trị viên (Super Admin)',
    avatar: null,
    role: 'SUPER_ADMIN',
    department: 'ALL',
    status: 'active',
    lastLogin: null
  },
  {
    id: 'user-cntt',
    email: 'cntt@donvi.vn',
    name: 'Trưởng Khoa CNTT',
    avatar: null,
    role: 'QUAN_LY_PHONG',
    department: 'Khoa Công nghệ Thông tin',
    departmentId: 'dept-cntt',
    status: 'active',
    lastLogin: null
  }
];
