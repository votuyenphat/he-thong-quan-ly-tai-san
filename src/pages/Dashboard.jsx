// src/pages/Dashboard.jsx
import React from 'react';
import { useAssets } from '../context/AssetContext';
import { formatVND } from '../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
} from 'chart.js';
import { Bar, Doughnut, Line, PolarArea } from 'react-chartjs-2';
import {
  LayoutDashboard,
  Boxes,
  CheckCircle2,
  Package,
  Wrench,
  Clock,
  Archive,
  AlertTriangle,
  Building,
  TrendingUp,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
);

export default function Dashboard({ setActiveTab }) {
  const { assets, departments, alerts } = useAssets();

  // 1. KPI Counts
  const totalAssets = assets.length;
  const inUseCount = assets.filter(a => a.status === 'Đang sử dụng').length;
  const inStockCount = assets.filter(a => a.status === 'Trong kho').length;
  const repairingCount = assets.filter(a => a.status === 'Đang sửa chữa' || a.condition === 'Hỏng nhẹ' || a.condition === 'Hỏng nặng').length;
  const pendingLiquidationCount = assets.filter(a => a.status === 'Chờ thanh lý').length;
  const liquidatedCount = assets.filter(a => a.status === 'Đã thanh lý').length;

  const totalValue = assets.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);

  // 2. Thống kê theo phòng
  const deptStats = departments.map(dept => {
    const deptAssets = assets.filter(a => a.departmentId === dept.id || a.departmentName === dept.name);
    const count = deptAssets.length;
    const value = deptAssets.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
    return {
      ...dept,
      count,
      value
    };
  });

  // 3. Biểu đồ 1: Tài sản theo phòng (Bar)
  const chartDeptData = {
    labels: deptStats.map(d => d.code || d.name),
    datasets: [
      {
        label: 'Số lượng tài sản',
        data: deptStats.map(d => d.count),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      }
    ]
  };

  // 4. Biểu đồ 2: Tài sản theo loại (Doughnut)
  const typeMap = {};
  assets.forEach(a => {
    const t = a.type || 'Khác';
    typeMap[t] = (typeMap[t] || 0) + 1;
  });
  const chartTypeData = {
    labels: Object.keys(typeMap),
    datasets: [
      {
        data: Object.values(typeMap),
        backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // 5. Biểu đồ 3: Tài sản theo tình trạng (Polar Area)
  const conditionMap = { 'Tốt': 0, 'Khá': 0, 'Hỏng nhẹ': 0, 'Hỏng nặng': 0, 'Không sử dụng được': 0 };
  assets.forEach(a => {
    if (conditionMap[a.condition] !== undefined) {
      conditionMap[a.condition]++;
    } else {
      conditionMap['Khác'] = (conditionMap['Khác'] || 0) + 1;
    }
  });
  const chartConditionData = {
    labels: Object.keys(conditionMap),
    datasets: [
      {
        data: Object.values(conditionMap),
        backgroundColor: ['#10b981', '#06b6d4', '#f59e0b', '#f97316', '#ef4444'],
      }
    ]
  };

  // 6. Biểu đồ 4: Tài sản tăng/giảm theo năm (Line)
  const yearTrendMap = { 2021: 2, 2022: 4, 2023: 7, 2024: 10, 2025: 12, 2026: 12 };
  const chartTrendData = {
    labels: Object.keys(yearTrendMap),
    datasets: [
      {
        label: 'Quy mô tổng tài sản (Chiếc)',
        data: Object.values(yearTrendMap),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#10b981'
      }
    ]
  };

  // 7. Biểu đồ 5: Tài sản sắp hết thời gian sử dụng (Khấu hao)
  const currentYear = new Date().getFullYear();
  const lifespanGroups = {
    'Còn > 3 năm': 0,
    'Còn 1 - 3 năm': 0,
    'Sắp hết (<= 1 năm)': 0,
    'Đã hết hạn SD': 0
  };
  assets.forEach(a => {
    if (a.purchaseDate && a.lifespanYears) {
      const expYear = new Date(a.purchaseDate).getFullYear() + a.lifespanYears;
      const diff = expYear - currentYear;
      if (diff > 3) lifespanGroups['Còn > 3 năm']++;
      else if (diff >= 1) lifespanGroups['Còn 1 - 3 năm']++;
      else if (diff >= 0) lifespanGroups['Sắp hết (<= 1 năm)']++;
      else lifespanGroups['Đã hết hạn SD']++;
    }
  });
  const chartLifespanData = {
    labels: Object.keys(lifespanGroups),
    datasets: [
      {
        label: 'Số lượng thiết bị',
        data: Object.values(lifespanGroups),
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        borderRadius: 6
      }
    ]
  };

  // 5 Cảnh báo nghiệp vụ tài sản
  const alertCards = [
    { title: 'Sai vị trí thực tế', count: alerts.wrongLocation.length, color: '#ea580c', bg: '#ffedd5', tab: 'alerts' },
    { title: 'Không tìm thấy (Thất lạc)', count: alerts.missing.length, color: '#dc2626', bg: '#fee2e2', tab: 'alerts' },
    { title: 'Đang sửa chữa cần theo dõi', count: alerts.overdueRepair.length, color: '#2563eb', bg: '#eff6ff', tab: 'alerts' },
    { title: 'Đề nghị thanh lý chờ duyệt', count: alerts.pendingLiquidation.length, color: '#d97706', bg: '#fef3c7', tab: 'liquidation' },
    { title: 'Sắp hết thời gian sử dụng', count: alerts.expiringSoon.length, color: '#7c3aed', bg: '#f5f3ff', tab: 'alerts' },
  ];

  return (
    <div className="page-body">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <LayoutDashboard size={26} color="#1e3a8a" />
            Bảng Điều Khiển Tổng Quan
          </h2>
          <p className="page-subtitle">
            Theo dõi thời gian thực tình hình tài sản, hiện trạng sử dụng và phân bổ toàn đơn vị
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            background: '#ffffff',
            padding: '8px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#1e3a8a',
            boxShadow: 'var(--shadow-sm)'
          }}>
            Tổng nguyên giá: <span style={{ color: '#059669', fontSize: '1rem', fontWeight: 800 }}>{formatVND(totalValue)}</span>
          </div>
        </div>
      </div>

      {/* 1. TỔNG QUAN TÀI SẢN (6 Chỉ số KPI) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Tổng số */}
        <div className="card" style={{ borderLeft: '4px solid #1e3a8a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 600 }}>Tổng số tài sản</span>
            <Boxes size={18} color="#1e3a8a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: 8 }}>
            {totalAssets}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 4 }}>
            ● Khai báo trên hệ thống
          </div>
        </div>

        {/* Đang sử dụng */}
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 600 }}>Đang sử dụng</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: 8 }}>
            {inUseCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            Tỉ lệ: {((inUseCount / (totalAssets || 1)) * 100).toFixed(0)}%
          </div>
        </div>

        {/* Trong kho */}
        <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 600 }}>Trong kho</span>
            <Package size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7', marginTop: 8 }}>
            {inStockCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            Sẵn sàng cấp phát
          </div>
        </div>

        {/* Hỏng / chờ sửa */}
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 600 }}>Hỏng / chờ sửa</span>
            <Wrench size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: 8 }}>
            {repairingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            Cần bảo dưỡng kỹ thuật
          </div>
        </div>

        {/* Chờ thanh lý */}
        <div className="card" style={{ borderLeft: '4px solid #ea580c' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 600 }}>Chờ thanh lý</span>
            <Clock size={18} color="#ea580c" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c', marginTop: 8 }}>
            {pendingLiquidationCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            Đã có biên bản đề nghị
          </div>
        </div>

        {/* Đã thanh lý */}
        <div className="card" style={{ borderLeft: '4px solid #64748b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 600 }}>Đã thanh lý</span>
            <Archive size={18} color="#64748b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#64748b', marginTop: 8 }}>
            {liquidatedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            Đã thu hồi nộp quỹ
          </div>
        </div>
      </div>

      {/* 2. CẢNH BÁO THỜI GIAN THỰC (6 Thẻ cảnh báo) */}
      <div className="card" style={{ marginBottom: 24, background: '#fffbeb', borderColor: '#fde68a' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={20} color="#b45309" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', margin: 0 }}>
              Trung Tâm Cảnh Báo Nghiệp Vụ
            </h3>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setActiveTab('alerts')}
            style={{ fontSize: '0.8rem', background: '#ffffff' }}
          >
            Xem tất cả cảnh báo <ArrowRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12
        }}>
          {alertCards.map((c, idx) => (
            <div 
              key={idx}
              onClick={() => setActiveTab(c.tab)}
              style={{
                background: '#ffffff',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{c.title}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: c.color, marginTop: 4 }}>
                {c.count} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>tài sản</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. BIỂU ĐỒ 1 & 2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: 20,
        marginBottom: 24
      }}>
        {/* Biểu đồ theo phòng */}
        <div className="card">
          <h3 className="card-title">
            <span>Tài sản theo Phòng/Ban & Khoa</span>
            <Building size={18} color="#64748b" />
          </h3>
          <div style={{ height: '270px' }}>
            <Bar 
              data={chartDeptData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>

        {/* Biểu đồ theo loại */}
        <div className="card">
          <h3 className="card-title">
            <span>Cơ cấu Tài sản theo Loại</span>
            <Boxes size={18} color="#64748b" />
          </h3>
          <div style={{ height: '270px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut 
              data={chartTypeData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* 4. BIỂU ĐỒ 3, 4 & 5 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 20,
        marginBottom: 24
      }}>
        {/* Biểu đồ theo tình trạng */}
        <div className="card">
          <h3 className="card-title">Tình trạng Thiết bị</h3>
          <div style={{ height: '240px', display: 'flex', justifyContent: 'center' }}>
            <PolarArea 
              data={chartConditionData} 
              options={{
                responsive: true,
                maintainAspectRatio: false
              }} 
            />
          </div>
        </div>

        {/* Biểu đồ tăng/giảm theo năm */}
        <div className="card">
          <h3 className="card-title">Biến động Tăng/Giảm theo Năm</h3>
          <div style={{ height: '240px' }}>
            <Line 
              data={chartTrendData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>

        {/* Biểu đồ sắp hết thời gian sử dụng */}
        <div className="card">
          <h3 className="card-title">Hạn Sử Dụng & Khấu Hao</h3>
          <div style={{ height: '240px' }}>
            <Bar 
              data={chartLifespanData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>
      </div>

      {/* 5. BẢNG THỐNG KÊ THEO PHÒNG */}
      <div className="card">
        <h3 className="card-title">
          <span>Bảng Thống kê Tài sản theo Phòng/Ban</span>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('departments')}
          >
            Quản lý cây phòng ban
          </button>
        </h3>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã phòng</th>
                <th>Phòng/Ban - Khoa</th>
                <th>Trưởng phòng</th>
                <th>Người quản lý TS</th>
                <th style={{ textAlign: 'center' }}>Số tài sản</th>
                <th style={{ textAlign: 'right' }}>Tổng giá trị (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {deptStats.map(dept => (
                <tr key={dept.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#1e3a8a' }}>{dept.code}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{dept.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{dept.location}</div>
                  </td>
                  <td>{dept.manager}</td>
                  <td>{dept.assetManager}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-info">
                      {dept.count} tài sản
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatVND(dept.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
