// src/App.jsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AssetProvider } from './context/AssetContext';
import { LayoutDashboard, Boxes, PlusCircle, Menu } from 'lucide-react';

// Layout
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Pages
import LoginScreen from './pages/LoginScreen';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetInbound from './pages/AssetInbound';
import AssetTransfer from './pages/AssetTransfer';
import AssetRecall from './pages/AssetRecall';
import AssetLiquidation from './pages/AssetLiquidation';
import DepartmentTree from './pages/DepartmentTree';
import LocationTree from './pages/LocationTree';
import ReportsPage from './pages/ReportsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import CategoryConfig from './pages/CategoryConfig';
import UserManagement from './pages/UserManagement';
import InventorySlipGenerator from './pages/InventorySlipGenerator';
import AssetPublicProfile from './pages/AssetPublicProfile';
import ForcePasswordChangeModal from './components/common/ForcePasswordChangeModal';

const VALID_TABS = new Set([
  'dashboard', 'assets', 'inbound', 'inventory-slips',
  'categories', 'transfer', 'recall', 'liquidation', 'departments', 'locations',
  'reports', 'audit', 'users'
]);

function MainApplication() {
  const { isLoggedIn, currentUser } = useAuth();
  const [activeTab, setActiveTabState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    return tabParam && VALID_TABS.has(tabParam) ? tabParam : 'dashboard';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const setActiveTab = (nextTab) => {
    setActiveTabState(nextTab);
    try {
      const url = new URL(window.location.href);
      if (nextTab === 'dashboard') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', nextTab);
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore URL update errors
    }
  };

  if (!isLoggedIn || !currentUser) {
    return <LoginScreen />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'assets':
        return <AssetList setActiveTab={setActiveTab} />;
      case 'inbound':
        return <AssetInbound setActiveTab={setActiveTab} />;
      case 'inventory-slips':
        return <InventorySlipGenerator />;
      case 'categories':
        return <CategoryConfig />;
      case 'transfer':
        return <AssetTransfer />;
      case 'recall':
        return <AssetRecall />;
      case 'liquidation':
        return <AssetLiquidation />;
      case 'departments':
        return <DepartmentTree />;
      case 'locations':
        return <LocationTree />;
      case 'reports':
        return <ReportsPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="main-content">
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        {renderActivePage()}
        <ForcePasswordChangeModal />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav no-print">
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <LayoutDashboard size={20} />
          <span>Tổng quan</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('assets');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Boxes size={20} />
          <span>Tài sản</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'inbound' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('inbound');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <PlusCircle size={20} />
          <span>Nhập mới</span>
        </button>

        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const qrCardQuery = params.get('card') || params.get('asset');

  // Khi quét Mã QR: chỉ hiển thị độc lập 1 hình ảnh thông tin tài sản duy nhất, hoàn toàn không mở vào Phần mềm
  if (qrCardQuery) {
    return <AssetPublicProfile assetQuery={qrCardQuery} />;
  }

  return (
    <AuthProvider>
      <AssetProvider>
        <MainApplication />
      </AssetProvider>
    </AuthProvider>
  );
}
