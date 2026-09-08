// src/App.jsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AssetProvider } from './context/AssetContext';

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

function MainApplication() {
  const { isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

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
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        {renderActivePage()}
      </div>
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
