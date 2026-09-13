// src/data/sampleData.js
// Bộ dữ liệu mẫu chuẩn phục vụ thử nghiệm và demo hệ thống Quản lý Tài sản

export const SAMPLE_DEPARTMENTS = [
  {
    id: 'dept-cntt',
    code: 'CNTT',
    name: 'Khoa Công nghệ Thông tin',
    manager: 'TS. Trần Minh Tuấn',
    phone: '0901234567',
    email: 'cntt@donvi.vn',
    description: 'Quản trị hệ thống máy tính, phòng lab và phần mềm',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'dept-ddt',
    code: 'DDT',
    name: 'Khoa Điện - Điện tử',
    manager: 'PGS.TS. Lê Hoàng Long',
    phone: '0912345678',
    email: 'dientu@donvi.vn',
    description: 'Quản lý xưởng thực hành và thiết bị vi mạch',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'dept-hcqt',
    code: 'HCQT',
    name: 'Phòng Hành chính - Quản trị',
    manager: 'ThS. Nguyễn Văn Bình',
    phone: '0923456789',
    email: 'hanhchinh@donvi.vn',
    description: 'Quản lý cơ sở vật chất tổng hợp và tài sản dùng chung',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'dept-tttn',
    code: 'TTTN',
    name: 'Trung tâm Thí nghiệm & Thực hành',
    manager: 'ThS. Vũ Thị Lan',
    phone: '0934567890',
    email: 'thinghiem@donvi.vn',
    description: 'Kho thiết bị và phòng thí nghiệm chuyên sâu',
    createdAt: '2026-01-15T08:00:00.000Z'
  }
];

export const SAMPLE_LOCATIONS = [
  {
    id: 'cs1',
    name: 'Cơ sở 1 (Trụ sở chính)',
    level: 1,
    children: [
      {
        id: 'khu-a',
        name: 'Khu A (Nhà Hiệu bộ)',
        level: 2,
        children: [
          {
            id: 'tang-1-a',
            name: 'Tầng 1',
            level: 3,
            children: [
              { id: 'p-a101', name: 'Phòng Tiếp khách A1.01', level: 4 },
              { id: 'p-a102', name: 'Phòng Văn thư A1.02', level: 4 }
            ]
          },
          {
            id: 'tang-2-a',
            name: 'Tầng 2',
            level: 3,
            children: [
              { id: 'p-a201', name: 'Hội trường Lớn A2.01', level: 4 },
              { id: 'p-a202', name: 'Phòng Họp Ban Giám hiệu A2.02', level: 4 }
            ]
          }
        ]
      },
      {
        id: 'khu-b',
        name: 'Khu B (Giảng đường & Lab)',
        level: 2,
        children: [
          {
            id: 'tang-2-b',
            name: 'Tầng 2',
            level: 3,
            children: [
              { id: 'p-b201', name: 'Phòng Lab CNTT 201', level: 4 },
              { id: 'p-b202', name: 'Phòng Lab Mạng 202', level: 4 }
            ]
          },
          {
            id: 'tang-3-b',
            name: 'Tầng 3',
            level: 3,
            children: [
              { id: 'p-b301', name: 'Xưởng Thực hành Điện tử 301', level: 4 },
              { id: 'p-b302', name: 'Kho Lưu trữ Thiết bị 302', level: 4 }
            ]
          }
        ]
      }
    ]
  }
];

export const SAMPLE_ASSETS = [
  {
    id: 'ast-001',
    code: 'TS-2026-0001',
    name: 'Máy tính để bàn Dell OptiPlex 7010 MT',
    type: 'Thiết bị CNTT',
    brand: 'Dell',
    quantity: 5,
    unit: 'Bộ',
    cost: 16500000,
    price: 16500000,
    purchaseYear: 2026,
    purchaseDate: '2026-01-10',
    usefulLifeYears: 5,
    budgetSource: 'Ngân sách Nhà nước cấp',
    departmentId: 'dept-cntt',
    departmentName: 'Khoa Công nghệ Thông tin',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Khu B (Giảng đường & Lab) > Tầng 2 > Phòng Lab CNTT 201',
    responsiblePerson: 'TS. Trần Minh Tuấn',
    currentUser: 'Nguyễn Văn Hùng',
    condition: 'Tốt',
    status: 'Đang sử dụng',
    notes: 'Bộ máy tính gồm case Core i5, RAM 16GB, SSD 512GB, màn hình 24 inch',
    createdAt: '2026-01-10T09:00:00.000Z'
  },
  {
    id: 'ast-002',
    code: 'TS-2026-0002',
    name: 'Máy in laser đa chức năng HP LaserJet Pro M404dn',
    type: 'Thiết bị Văn phòng',
    brand: 'HP',
    quantity: 1,
    unit: 'Cái',
    cost: 8500000,
    price: 8500000,
    purchaseYear: 2026,
    purchaseDate: '2026-01-12',
    usefulLifeYears: 4,
    budgetSource: 'Nguồn thu sự nghiệp',
    departmentId: 'dept-hcqt',
    departmentName: 'Phòng Hành chính - Quản trị',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Khu A (Nhà Hiệu bộ) > Tầng 1 > Phòng Văn thư A1.02',
    responsiblePerson: 'ThS. Nguyễn Văn Bình',
    currentUser: 'Lê Thị Thu',
    condition: 'Tốt',
    status: 'Đang sử dụng',
    notes: 'In hai mặt tự động, kết nối mạng LAN',
    createdAt: '2026-01-12T10:30:00.000Z'
  },
  {
    id: 'ast-003',
    code: 'TS-2026-0003',
    name: 'Máy chiếu Laser tương tác Epson EB-725Wi',
    type: 'Thiết bị Giảng dạy',
    brand: 'Epson',
    quantity: 2,
    unit: 'Bộ',
    cost: 28000000,
    price: 28000000,
    purchaseYear: 2025,
    purchaseDate: '2025-11-20',
    usefulLifeYears: 5,
    budgetSource: 'Dự án đầu tư phát triển',
    departmentId: 'dept-cntt',
    departmentName: 'Khoa Công nghệ Thông tin',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Khu A (Nhà Hiệu bộ) > Tầng 2 > Hội trường Lớn A2.01',
    responsiblePerson: 'TS. Trần Minh Tuấn',
    currentUser: 'Ban Quản trị Hội trường',
    condition: 'Tốt',
    status: 'Đang sử dụng',
    notes: 'Độ sáng 4.000 ANSI Lumens, kèm 2 bút cảm ứng tương tác',
    createdAt: '2025-11-20T14:00:00.000Z'
  },
  {
    id: 'ast-004',
    code: 'TS-2026-0004',
    name: 'Thiết bị chuyển mạch Cisco Catalyst 2960X 48 Port',
    type: 'Thiết bị CNTT',
    brand: 'Cisco',
    quantity: 2,
    unit: 'Chiếc',
    cost: 22000000,
    price: 22000000,
    purchaseYear: 2024,
    purchaseDate: '2024-06-15',
    usefulLifeYears: 6,
    budgetSource: 'Ngân sách Nhà nước cấp',
    departmentId: 'dept-cntt',
    departmentName: 'Khoa Công nghệ Thông tin',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Khu B (Giảng đường & Lab) > Tầng 2 > Phòng Lab Mạng 202',
    responsiblePerson: 'TS. Trần Minh Tuấn',
    currentUser: 'Kỹ sư Quản trị mạng',
    condition: 'Khá',
    status: 'Đang sử dụng',
    notes: 'Switch Gigabit PoE quản lý mạng Lab',
    createdAt: '2024-06-15T08:30:00.000Z'
  },
  {
    id: 'ast-005',
    code: 'TS-2026-0005',
    name: 'Máy hiện sóng số 2 kênh Tektronix TBS1052B',
    type: 'Thiết bị Thí nghiệm',
    brand: 'Tektronix',
    quantity: 4,
    unit: 'Chiếc',
    cost: 14200000,
    price: 14200000,
    purchaseYear: 2025,
    purchaseDate: '2025-09-05',
    usefulLifeYears: 5,
    budgetSource: 'Ngân sách Nhà nước cấp',
    departmentId: 'dept-ddt',
    departmentName: 'Khoa Điện - Điện tử',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Khu B (Giảng đường & Lab) > Tầng 3 > Xưởng Thực hành Điện tử 301',
    responsiblePerson: 'PGS.TS. Lê Hoàng Long',
    currentUser: 'Phạm Hồng Thái',
    condition: 'Tốt',
    status: 'Đang sử dụng',
    notes: 'Băng thông 50MHz, tốc độ lấy mẫu 1GS/s',
    createdAt: '2025-09-05T09:15:00.000Z'
  },
  {
    id: 'ast-006',
    code: 'TS-2026-0006',
    name: 'Bộ lưu điện UPS APC Smart-UPS 2200VA LCD 230V',
    type: 'Thiết bị CNTT',
    brand: 'APC',
    quantity: 1,
    unit: 'Chiếc',
    cost: 17500000,
    price: 17500000,
    purchaseYear: 2026,
    purchaseDate: '2026-02-01',
    usefulLifeYears: 4,
    budgetSource: 'Nguồn thu sự nghiệp',
    departmentId: 'dept-tttn',
    departmentName: 'Trung tâm Thí nghiệm & Thực hành',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Khu B (Giảng đường & Lab) > Tầng 3 > Kho Lưu trữ Thiết bị 302',
    responsiblePerson: 'ThS. Vũ Thị Lan',
    currentUser: null,
    condition: 'Tốt',
    status: 'Trong kho',
    notes: 'Dự phòng cúp điện cho phòng máy chủ',
    createdAt: '2026-02-01T11:00:00.000Z'
  },
  {
    id: 'ast-007',
    code: 'TS-2026-0007',
    name: 'Máy photocopy kỹ thuật số Canon imageRUNNER 2625i',
    type: 'Thiết bị Văn phòng',
    brand: 'Canon',
    quantity: 1,
    unit: 'Máy',
    cost: 45000000,
    price: 45000000,
    purchaseYear: 2024,
    purchaseDate: '2024-03-10',
    usefulLifeYears: 5,
    budgetSource: 'Ngân sách Nhà nước cấp',
    departmentId: 'dept-hcqt',
    departmentName: 'Phòng Hành chính - Quản trị',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Khu A (Nhà Hiệu bộ) > Tầng 1 > Phòng Văn thư A1.02',
    responsiblePerson: 'ThS. Nguyễn Văn Bình',
    currentUser: 'Tổ Văn thư',
    condition: 'Tốt',
    status: 'Đang sử dụng',
    notes: 'Khổ A3/A4, tốc độ 25 trang/phút',
    createdAt: '2024-03-10T14:20:00.000Z'
  },
  {
    id: 'ast-008',
    code: 'TS-2026-0008',
    name: 'Bộ bàn ghế phòng họp cao cấp Hòa Phát (1 bàn + 12 ghế)',
    type: 'Bàn ghế & Nội thất',
    brand: 'Hòa Phát',
    quantity: 1,
    unit: 'Bộ',
    cost: 18500000,
    price: 18500000,
    purchaseYear: 2023,
    purchaseDate: '2023-08-15',
    usefulLifeYears: 8,
    budgetSource: 'Nguồn thu sự nghiệp',
    departmentId: 'dept-hcqt',
    departmentName: 'Phòng Hành chính - Quản trị',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Khu A (Nhà Hiệu bộ) > Tầng 2 > Phòng Họp Ban Giám hiệu A2.02',
    responsiblePerson: 'ThS. Nguyễn Văn Bình',
    currentUser: 'Ban Giám hiệu',
    condition: 'Tốt',
    status: 'Đang sử dụng',
    notes: 'Gỗ sơn PU cao cấp, ghế da chân quỳ',
    createdAt: '2023-08-15T09:00:00.000Z'
  },
  {
    id: 'ast-009',
    code: 'TS-2026-0009',
    name: 'Máy tính để bàn HP ProDesk 400 G4 (Cũ)',
    type: 'Thiết bị CNTT',
    brand: 'HP',
    quantity: 3,
    unit: 'Bộ',
    cost: 9500000,
    price: 9500000,
    purchaseYear: 2018,
    purchaseDate: '2018-05-10',
    usefulLifeYears: 5,
    budgetSource: 'Ngân sách Nhà nước cấp',
    departmentId: 'dept-cntt',
    departmentName: 'Khoa Công nghệ Thông tin',
    locationPath: 'Cơ sở 1 (Trụ sở chính) > Khu B (Giảng đường & Lab) > Tầng 3 > Kho Lưu trữ Thiết bị 302',
    responsiblePerson: 'TS. Trần Minh Tuấn',
    currentUser: null,
    condition: 'Hỏng nặng',
    status: 'Chờ thanh lý',
    notes: 'Hỏng bo mạch chủ, chi phí sửa chữa cao hơn mua mới, đã lập biên bản',
    createdAt: '2018-05-10T10:00:00.000Z'
  }
];

export const SAMPLE_AUDIT_LOGS = [
  {
    id: 'log-001',
    action: 'CREATE',
    target: 'TÀI SẢN',
    description: 'Khởi tạo dữ liệu mẫu hệ thống Quản lý Tài sản 2026',
    performedBy: 'Quản trị viên',
    userRole: 'Quản trị viên',
    timestamp: '2026-01-10T08:00:00.000Z'
  }
];
