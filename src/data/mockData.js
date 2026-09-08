// src/data/mockData.js
// Dữ liệu khởi tạo trống - người dùng tự nhập thông tin của mình

export const INITIAL_DEPARTMENTS = [];

export const INITIAL_LOCATIONS = [];

export const INITIAL_ASSETS = [];

export const INITIAL_TRANSFERS = [];

export const INITIAL_RECALLS = [];

export const INITIAL_LIQUIDATIONS = [];

export const INITIAL_INVENTORY_SESSIONS = [];

export const INITIAL_AUDIT_LOGS = [];

// Danh sách người dùng mẫu để đăng nhập demo (có thể xóa khi dùng Google OAuth thật)
export const PRESET_USERS = [
  {
    id: 'user-admin',
    email: 'admin@donvi.vn',
    name: 'Quản trị viên',
    avatar: null,
    role: 'Quản trị viên',
    department: null,
    status: 'active',
    lastLogin: null
  },
  {
    id: 'user-thukho',
    email: 'thukho@donvi.vn',
    name: 'Thủ kho',
    avatar: null,
    role: 'Thủ kho',
    department: null,
    status: 'active',
    lastLogin: null
  },
  {
    id: 'user-tp',
    email: 'truongphong@donvi.vn',
    name: 'Trưởng phòng',
    avatar: null,
    role: 'Trưởng phòng/Ban',
    department: null,
    status: 'active',
    lastLogin: null
  },
  {
    id: 'user-nd',
    email: 'nguoidung@donvi.vn',
    name: 'Người dùng',
    avatar: null,
    role: 'Người dùng',
    department: null,
    status: 'active',
    lastLogin: null
  }
];
