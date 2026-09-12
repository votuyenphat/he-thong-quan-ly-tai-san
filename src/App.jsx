// src/App.jsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AssetProvider, useAssets } from './context/AssetContext';
import { LayoutDashboard, Boxes, PlusCircle, ShieldAlert, Menu } from 'lucide-react';

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
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import CategoryConfig from './pages/CategoryConfig';

function MainApplication() {
  const { isLoggedIn } = useAuth();
  const { alerts } = useAssets();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const totalAlerts = 
    (alerts?.wrongLocation?.length || 0) + 
    (alerts?.missing?.length || 0) + 
    (alerts?.pendingLiquidation?.length || 0) + 
    (alerts?.expiringSoon?.length || 0);

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'alerts':
        return <AlertsPage setActiveTab={setActiveTab} />;
      case 'assets':
        return <AssetList setActiveTab={setActiveTab} />;
      case 'inbound':
        return <AssetInbound setActiveTab={setActiveTab} />;
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
          className={`mobile-nav-item ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('alerts');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <ShieldAlert size={20} />
          <span>Cảnh báo</span>
          {totalAlerts > 0 && (
            <span className="mobile-nav-badge">{totalAlerts}</span>
          )}
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
  return (
    <AuthProvider>
      <AssetProvider>
        <MainApplication />
      </AssetProvider>
    </AuthProvider>
  );
}
