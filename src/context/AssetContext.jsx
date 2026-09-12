// src/context/AssetContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  INITIAL_ASSETS,
  INITIAL_DEPARTMENTS,
  INITIAL_LOCATIONS,
  INITIAL_TRANSFERS,
  INITIAL_RECALLS,
  INITIAL_LIQUIDATIONS,
  INITIAL_INVENTORY_SESSIONS,
  INITIAL_AUDIT_LOGS
} from '../data/mockData';
import { useAuth } from './AuthContext';
import {
  cleanText,
  canonicalStatus,
  canonicalCondition,
  sanitizeAsset,
  sanitizeAssetList,
  deduplicateAndMergeLocationTree
} from '../utils/normalize';
import {
  fetchServerVersion,
  fetchServerData,
  pushServerData,
  exportBackupToFile,
  readBackupFromFile
} from '../services/syncService';

const AssetContext = createContext();

const DATA_VERSION = 'v3-empty'; // Bump this to reset all stored data

export function AssetProvider({ children }) {
  const { currentUser } = useAuth();

  // One-time migration: clear old mock data when version changes
  React.useEffect(() => {
    const storedVersion = localStorage.getItem('qlts_data_version');
    if (storedVersion !== DATA_VERSION) {
      // Clear old data keys
      ['qlts_assets','qlts_departments','qlts_locations','qlts_transfers',
       'qlts_recalls','qlts_liquidations','qlts_inventory_sessions','qlts_audit_logs'].forEach(k => localStorage.removeItem(k));
      localStorage.setItem('qlts_data_version', DATA_VERSION);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from localStorage or defaults
  const [assets, setAssets] = useState(() => {
    const s = localStorage.getItem('qlts_assets');
    const raw = s ? JSON.parse(s) : INITIAL_ASSETS;
    return sanitizeAssetList(raw);
  });


  const [departments, setDepartments] = useState(() => {
    const s = localStorage.getItem('qlts_departments');
    return s ? JSON.parse(s) : INITIAL_DEPARTMENTS;
  });

  const [locations, setLocations] = useState(() => {
    const s = localStorage.getItem('qlts_locations');
    const parsed = s ? JSON.parse(s) : INITIAL_LOCATIONS;
    return deduplicateAndMergeLocationTree(parsed);
  });

  const [transfers, setTransfers] = useState(() => {
    const s = localStorage.getItem('qlts_transfers');
    return s ? JSON.parse(s) : INITIAL_TRANSFERS;
  });

  const [recalls, setRecalls] = useState(() => {
    const s = localStorage.getItem('qlts_recalls');
    return s ? JSON.parse(s) : INITIAL_RECALLS;
  });

  const [liquidations, setLiquidations] = useState(() => {
    const s = localStorage.getItem('qlts_liquidations');
    return s ? JSON.parse(s) : INITIAL_LIQUIDATIONS;
  });

  const [inventorySessions, setInventorySessions] = useState(() => {
    const s = localStorage.getItem('qlts_inventory_sessions');
    return s ? JSON.parse(s) : INITIAL_INVENTORY_SESSIONS;
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const s = localStorage.getItem('qlts_audit_logs');
    return s ? JSON.parse(s) : INITIAL_AUDIT_LOGS;
  });

  // --- Custom select options (Loại tài sản, Tình trạng, Trạng thái) ---
  const DEFAULT_ASSET_TYPES = [
    'Thiết bị CNTT', 'Thiết bị Thí nghiệm', 'Thiết bị Xưởng',
    'Thiết bị Giảng dạy', 'Thiết bị Văn phòng', 'Bàn ghế & Nội thất',
    'Phương tiện vận tải', 'Khác'
  ];
  const DEFAULT_CONDITIONS = ['Tốt', 'Khá', 'Hỏng nhẹ', 'Hỏng nặng', 'Không sử dụng được'];
  const DEFAULT_STATUSES = [
    'Đang sử dụng', 'Trong kho',
    'Điều chuyển', 'Chờ thanh lý', 'Đã thanh lý', 'Đã thu hồi', 'Mất'
  ];

  const [assetTypeOptions, setAssetTypeOptions] = useState(() => {
    const s = localStorage.getItem('qlts_asset_types');
    const raw = s ? JSON.parse(s) : DEFAULT_ASSET_TYPES;
    return Array.from(new Set((raw || []).map(cleanText).filter(Boolean)));
  });
  const [conditionOptions, setConditionOptions] = useState(() => {
    const s = localStorage.getItem('qlts_conditions');
    const raw = s ? JSON.parse(s) : DEFAULT_CONDITIONS;
    return Array.from(new Set((raw || []).map(canonicalCondition).filter(Boolean)));
  });
  const [statusOptions, setStatusOptions] = useState(() => {
    const s = localStorage.getItem('qlts_statuses');
    const raw = s ? JSON.parse(s) : DEFAULT_STATUSES;
    return Array.from(new Set((raw || []).map(canonicalStatus).filter(Boolean)));
  });

  // Tự động kiểm tra và chuẩn hóa (auto-heal) toàn bộ dữ liệu tài sản đã lưu trong localStorage
  useEffect(() => {
    let hasDirtyData = false;
    const healed = assets.map(a => {
      const clean = sanitizeAsset(a);
      if (
        clean.status !== a.status ||
        clean.condition !== a.condition ||
        clean.departmentName !== a.departmentName ||
        clean.type !== a.type ||
        clean.name !== a.name
      ) {
        hasDirtyData = true;
        return clean;
      }
      return a;
    });

    if (hasDirtyData) {
      setAssets(healed);
      localStorage.setItem('qlts_assets', JSON.stringify(healed));
    }

    // Auto-heal duplicate locations in localStorage
    if (Array.isArray(locations) && locations.length > 0) {
      const deduplicated = deduplicateAndMergeLocationTree(locations);
      if (JSON.stringify(deduplicated) !== JSON.stringify(locations)) {
        setLocations(deduplicated);
        localStorage.setItem('qlts_locations', JSON.stringify(deduplicated));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync back to localStorage
  useEffect(() => { localStorage.setItem('qlts_assets', JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem('qlts_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('qlts_locations', JSON.stringify(deduplicateAndMergeLocationTree(locations))); }, [locations]);
  useEffect(() => { localStorage.setItem('qlts_transfers', JSON.stringify(transfers)); }, [transfers]);
  useEffect(() => { localStorage.setItem('qlts_recalls', JSON.stringify(recalls)); }, [recalls]);
  useEffect(() => { localStorage.setItem('qlts_liquidations', JSON.stringify(liquidations)); }, [liquidations]);
  useEffect(() => { localStorage.setItem('qlts_inventory_sessions', JSON.stringify(inventorySessions)); }, [inventorySessions]);
  useEffect(() => { localStorage.setItem('qlts_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('qlts_asset_types', JSON.stringify(assetTypeOptions)); }, [assetTypeOptions]);
  useEffect(() => { localStorage.setItem('qlts_conditions', JSON.stringify(conditionOptions)); }, [conditionOptions]);
  useEffect(() => { localStorage.setItem('qlts_statuses', JSON.stringify(statusOptions)); }, [statusOptions]);

  // ========================================================
  // HỆ THỐNG ĐỒNG BỘ DỮ LIỆU ĐA THIẾT BỊ (REAL-TIME SYNC)
  // ========================================================
  const [syncStatus, setSyncStatus] = useState('syncing'); // 'synced' | 'syncing' | 'offline' | 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const isIncomingSyncRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Áp dụng dữ liệu từ máy chủ trung tâm vào React state
  const applyServerData = useCallback((serverData) => {
    isIncomingSyncRef.current = true;
    if (Array.isArray(serverData.assets)) {
      setAssets(sanitizeAssetList(serverData.assets));
    }
    if (Array.isArray(serverData.departments)) {
      setDepartments(serverData.departments);
    }
    if (Array.isArray(serverData.locations)) {
      setLocations(deduplicateAndMergeLocationTree(serverData.locations));
    }
    if (Array.isArray(serverData.transfers)) {
      setTransfers(serverData.transfers);
    }
    if (Array.isArray(serverData.recalls)) {
      setRecalls(serverData.recalls);
    }
    if (Array.isArray(serverData.liquidations)) {
      setLiquidations(serverData.liquidations);
    }
    if (Array.isArray(serverData.inventorySessions)) {
      setInventorySessions(serverData.inventorySessions);
    }
    if (Array.isArray(serverData.auditLogs)) {
      setAuditLogs(serverData.auditLogs);
    }
    if (Array.isArray(serverData.assetTypeOptions) && serverData.assetTypeOptions.length > 0) {
      setAssetTypeOptions(Array.from(new Set(serverData.assetTypeOptions.map(cleanText).filter(Boolean))));
    }
    if (Array.isArray(serverData.conditionOptions) && serverData.conditionOptions.length > 0) {
      setConditionOptions(Array.from(new Set(serverData.conditionOptions.map(canonicalCondition).filter(Boolean))));
    }
    if (Array.isArray(serverData.statusOptions) && serverData.statusOptions.length > 0) {
      setStatusOptions(Array.from(new Set(serverData.statusOptions.map(canonicalStatus).filter(Boolean))));
    }
    const t = serverData.lastUpdated || Date.now();
    setLastSyncTime(t);
    setSyncStatus('synced');
    setSyncError(null);
  }, []);

  // 1. Khởi tạo ban đầu: Kết nối máy chủ và đồng bộ dữ liệu 2 chiều
  useEffect(() => {
    let mounted = true;

    async function initSync() {
      setSyncStatus('syncing');
      try {
        const serverData = await fetchServerData();
        if (!mounted) return;

        const serverHasData = (serverData.assets && serverData.assets.length > 0) ||
                              (serverData.departments && serverData.departments.length > 0) ||
                              (serverData.lastUpdated && serverData.lastUpdated > 0);

        // Kiểm tra xem trình duyệt hiện tại đã có dữ liệu trong localStorage chưa
        const localSavedAssets = localStorage.getItem('qlts_assets');
        const localAssetsCount = localSavedAssets ? JSON.parse(localSavedAssets).length : 0;
        const localSavedDepts = localStorage.getItem('qlts_departments');
        const localDeptsCount = localSavedDepts ? JSON.parse(localSavedDepts).length : 0;

        if (serverHasData) {
          // Máy chủ đã có dữ liệu -> nạp dữ liệu máy chủ vào thiết bị này
          applyServerData(serverData);
        } else if (localAssetsCount > 0 || localDeptsCount > 0) {
          // Máy chủ trống nhưng máy này đã có dữ liệu sẵn -> tự động đẩy lên máy chủ làm dữ liệu gốc
          const payload = {
            assets,
            departments,
            locations,
            transfers,
            recalls,
            liquidations,
            inventorySessions,
            auditLogs,
            assetTypeOptions,
            conditionOptions,
            statusOptions,
            lastUpdated: Date.now()
          };
          await pushServerData(payload);
          setLastSyncTime(payload.lastUpdated);
          setSyncStatus('synced');
        } else {
          setSyncStatus('synced');
          setLastSyncTime(Date.now());
        }
      } catch (err) {
        console.warn('[Sync] Máy chủ ngoại tuyến hoặc chưa kết nối:', err.message);
        if (mounted) {
          setSyncStatus('offline');
          setSyncError(err.message);
        }
      } finally {
        if (mounted) {
          isInitializedRef.current = true;
        }
      }
    }

    initSync();

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyServerData]);

  // 2. Tự động đẩy thay đổi lên máy chủ khi người dùng thao tác trên thiết bị này (Debounce 500ms)
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (isIncomingSyncRef.current) {
      isIncomingSyncRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        const payload = {
          assets,
          departments,
          locations,
          transfers,
          recalls,
          liquidations,
          inventorySessions,
          auditLogs,
          assetTypeOptions,
          conditionOptions,
          statusOptions,
          lastUpdated: Date.now()
        };
        const res = await pushServerData(payload);
        if (res && res.status === 'ok') {
          setLastSyncTime(res.lastUpdated || payload.lastUpdated);
          setSyncStatus('synced');
          setSyncError(null);
        }
      } catch (err) {
        setSyncStatus('offline');
        setSyncError(err.message);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    assets,
    departments,
    locations,
    transfers,
    recalls,
    liquidations,
    inventorySessions,
    auditLogs,
    assetTypeOptions,
    conditionOptions,
    statusOptions
  ]);

  // 3. Định kỳ thăm dò máy chủ để cập nhật dữ liệu từ thiết bị khác (Polling mỗi 2.5s)
  useEffect(() => {
    let active = true;

    async function checkServerUpdates() {
      if (!isInitializedRef.current) return;
      try {
        const ver = await fetchServerVersion();
        if (!active) return;

        // Nếu máy chủ có cập nhật mới hơn lần đồng bộ cuối
        if (ver && ver.lastUpdated && lastSyncTime && ver.lastUpdated > lastSyncTime) {
          setSyncStatus('syncing');
          const fullData = await fetchServerData();
          if (active && fullData) {
            applyServerData(fullData);
          }
        } else if (syncStatus === 'offline') {
          setSyncStatus('synced');
          setSyncError(null);
        }
      } catch (err) {
        if (active && syncStatus !== 'offline') {
          setSyncStatus('offline');
        }
      }
    }

    const intervalId = setInterval(checkServerUpdates, 2500);

    // Đồng bộ ngay khi người dùng quay lại tab hoặc mở màn hình điện thoại
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkServerUpdates();
      }
    };
    const handleFocus = () => {
      checkServerUpdates();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      active = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [lastSyncTime, applyServerData, syncStatus]);

  // Cưỡng bức làm mới dữ liệu từ máy chủ
  const syncNow = async () => {
    setSyncStatus('syncing');
    try {
      const data = await fetchServerData();
      applyServerData(data);
      return { success: true };
    } catch (err) {
      setSyncStatus('offline');
      setSyncError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Cưỡng chế đẩy toàn bộ dữ liệu máy này lên máy chủ
  const forcePushToServer = async () => {
    setSyncStatus('syncing');
    try {
      const payload = {
        assets,
        departments,
        locations,
        transfers,
        recalls,
        liquidations,
        inventorySessions,
        auditLogs,
        assetTypeOptions,
        conditionOptions,
        statusOptions,
        lastUpdated: Date.now()
      };
      const res = await pushServerData(payload);
      setLastSyncTime(res.lastUpdated || payload.lastUpdated);
      setSyncStatus('synced');
      setSyncError(null);
      return { success: true };
    } catch (err) {
      setSyncStatus('offline');
      setSyncError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Xuất file backup JSON
  const exportBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      assets,
      departments,
      locations,
      transfers,
      recalls,
      liquidations,
      inventorySessions,
      auditLogs,
      assetTypeOptions,
      conditionOptions,
      statusOptions,
      lastUpdated: Date.now()
    };
    exportBackupToFile(payload);
  };

  // Nhập file backup JSON
  const importBackup = async (file) => {
    try {
      const data = await readBackupFromFile(file);
      applyServerData(data);
      await forcePushToServer();
      addAuditLog('Khôi phục dữ liệu', file.name, 'Nhập dữ liệu thành công từ tệp sao lưu JSON');
      return { success: true, count: (data.assets || []).length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };



  // Helper functions to manage dynamic options
  const addAssetType = (name) => {
    const trimmed = name.trim();
    if (!trimmed || assetTypeOptions.includes(trimmed)) return;
    setAssetTypeOptions(prev => [...prev, trimmed]);
    addAuditLog('Cập nhật danh mục', trimmed, 'Thêm loại tài sản mới');
  };

  const deleteAssetType = (name) => {
    setAssetTypeOptions(prev => prev.filter(t => t !== name));
    addAuditLog('Cập nhật danh mục', name, 'Xóa loại tài sản');
  };

  const updateAssetType = (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setAssetTypeOptions(prev => prev.map(t => t === oldName ? trimmed : t));
    // Cập nhật cả các tài sản đang mang giá trị này
    setAssets(prev => prev.map(a => a.type === oldName ? { ...a, type: trimmed } : a));
    addAuditLog('Cập nhật danh mục', `${oldName} -> ${trimmed}`, 'Đổi tên loại tài sản');
  };

  const addCondition = (name) => {
    const trimmed = name.trim();
    if (!trimmed || conditionOptions.includes(trimmed)) return;
    setConditionOptions(prev => [...prev, trimmed]);
    addAuditLog('Cập nhật danh mục', trimmed, 'Thêm tình trạng mới');
  };

  const deleteCondition = (name) => {
    setConditionOptions(prev => prev.filter(c => c !== name));
    addAuditLog('Cập nhật danh mục', name, 'Xóa tình trạng');
  };

  const updateCondition = (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setConditionOptions(prev => prev.map(c => c === oldName ? trimmed : c));
    setAssets(prev => prev.map(a => a.condition === oldName ? { ...a, condition: trimmed } : a));
    addAuditLog('Cập nhật danh mục', `${oldName} -> ${trimmed}`, 'Đổi tên tình trạng');
  };

  const addStatus = (name) => {
    const trimmed = name.trim();
    if (!trimmed || statusOptions.includes(trimmed)) return;
    setStatusOptions(prev => [...prev, trimmed]);
    addAuditLog('Cập nhật danh mục', trimmed, 'Thêm trạng thái mới');
  };

  const deleteStatus = (name) => {
    setStatusOptions(prev => prev.filter(s => s !== name));
    addAuditLog('Cập nhật danh mục', name, 'Xóa trạng thái');
  };

  const updateStatus = (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setStatusOptions(prev => prev.map(s => s === oldName ? trimmed : s));
    setAssets(prev => prev.map(a => a.status === oldName ? { ...a, status: trimmed } : a));
    addAuditLog('Cập nhật danh mục', `${oldName} -> ${trimmed}`, 'Đổi tên trạng thái');
  };

  const resetOptionsToDefault = () => {
    setAssetTypeOptions(DEFAULT_ASSET_TYPES);
    setConditionOptions(DEFAULT_CONDITIONS);
    setStatusOptions(DEFAULT_STATUSES);
    addAuditLog('Cập nhật danh mục', 'Khôi phục', 'Khôi phục danh mục phân loại về mặc định');
  };

  // Log action helper (Immutable)
  const addAuditLog = (action, target, detail) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeStr,
      user: currentUser ? currentUser.name : 'Hệ thống',
      userEmail: currentUser ? currentUser.email : 'system@truong.edu.vn',
      role: currentUser ? currentUser.role : 'Hệ thống',
      action,
      target,
      detail,
      ip: '192.168.1.' + Math.floor(Math.random() * 200 + 10)
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Add Asset
  const addAsset = (newAssetData) => {
    const newId = `as-${Date.now()}`;
    const dateStr = new Date().toISOString().slice(0, 10);
    const rawAsset = {
      id: newId,
      ...newAssetData,
      history: [
        {
          id: `h-${Date.now()}`,
          date: dateStr,
          action: 'Nhập tài sản mới',
          actor: currentUser ? currentUser.name : 'Thủ kho',
          detail: 'Nhập mới vào danh mục quản lý hệ thống'
        }
      ],
      documents: newAssetData.documents || []
    };
    const asset = sanitizeAsset(rawAsset);

    setAssets(prev => [asset, ...prev]);
    addAuditLog('Nhập tài sản mới', `${asset.name} (${asset.code})`, `Nguyên giá: ${asset.cost} đ, Phòng ban: ${asset.departmentName}`);
    return asset;
  };

  // Batch import assets from Excel
  const importAssetsBatch = (importedList) => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const cleanedList = sanitizeAssetList(importedList);
    const newAssets = cleanedList.map((item, idx) => ({
      ...item,
      id: `as-${Date.now()}-${idx}`,
      history: [
        {
          id: `h-${Date.now()}-${idx}`,
          date: dateStr,
          action: 'Nhập từ file Excel',
          actor: currentUser ? currentUser.name : 'Thủ kho',
          detail: 'Nhập hàng loạt từ tập tin bảng tính Excel'
        }
      ],
      documents: []
    }));

    setAssets(prev => [...newAssets, ...prev]);
    addAuditLog('Nhập Excel', `Nhập ${newAssets.length} tài sản`, `Người thực hiện: ${currentUser?.name}`);
  };

  // Update Asset
  const updateAsset = (id, updatedFields) => {
    setAssets(prev => prev.map(a => {
      if (a.id === id) {
        const historyEntry = {
          id: `h-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          action: 'Cập nhật thông tin',
          actor: currentUser ? currentUser.name : 'Người dùng',
          detail: 'Chỉnh sửa thông số tài sản'
        };
        const updated = sanitizeAsset({
          ...a,
          ...updatedFields,
          history: [historyEntry, ...(a.history || [])]
        });
        return updated;
      }
      return a;
    }));
    addAuditLog('Cập nhật tài sản', `ID: ${id}`, `Người thực hiện: ${currentUser?.name}`);
  };


  // Delete Asset
  const deleteAsset = (id) => {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;
    setAssets(prev => prev.filter(a => a.id !== id));
    addAuditLog('Xóa tài sản', `${asset.name} (${asset.code})`, `Người thực hiện: ${currentUser?.name}`);
  };

  // Delete Batch of Assets (Xóa hàng loạt tài sản)
  const deleteAssetsBatch = (assetIds, logReason = '') => {
    if (!assetIds || assetIds.length === 0) return;
    const idSet = new Set(assetIds);
    setAssets(prev => prev.filter(a => !idSet.has(a.id)));
    addAuditLog('Xóa hàng loạt tài sản', `${assetIds.length} tài sản`, logReason || `Người thực hiện: ${currentUser?.name || 'Người dùng'}`);
  };

  // Add Document to Asset
  const addAssetDocument = (assetId, doc) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        const newDoc = {
          id: `doc-${Date.now()}`,
          name: doc.name,
          type: doc.type || 'Tài liệu',
          size: doc.size || '1.0 MB',
          date: new Date().toISOString().slice(0, 10)
        };
        return {
          ...a,
          documents: [...(a.documents || []), newDoc],
          history: [
            {
              id: `h-${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              action: 'Đính kèm hồ sơ tài liệu',
              actor: currentUser ? currentUser.name : 'Người dùng',
              detail: `Thêm tệp: ${doc.name}`
            },
            ...(a.history || [])
          ]
        };
      }
      return a;
    }));
    addAuditLog('Đính kèm tài liệu', `Tài sản ${assetId}`, `Tệp: ${doc.name}`);
  };

  // Transfer Asset (Create Transfer slip)
  const createTransfer = (transferData) => {
    const newId = `tf-${Date.now()}`;
    const newTransfer = {
      id: newId,
      ...transferData,
      status: 'Chờ duyệt',
      date: new Date().toISOString().slice(0, 10)
    };

    setTransfers(prev => [newTransfer, ...prev]);
    addAuditLog('Tạo phiếu điều chuyển', newTransfer.code, `Điều chuyển tài sản: ${newTransfer.assetName}`);
    return newTransfer;
  };

  // Approve Transfer -> Automatically updates asset location & records history
  const approveTransfer = (transferId) => {
    const targetTransfer = transfers.find(t => t.id === transferId);
    if (!targetTransfer) return;

    const nowStr = new Date().toISOString().slice(0, 10);

    // 1. Update transfer slip status
    setTransfers(prev => prev.map(t => {
      if (t.id === transferId) {
        return {
          ...t,
          status: 'Đã duyệt',
          approvedBy: currentUser ? currentUser.name : 'Ban Giám Hiệu',
          approvedDate: nowStr
        };
      }
      return t;
    }));

    // 2. Automatically update asset's location, department, and history
    setAssets(prev => prev.map(a => {
      if (a.id === targetTransfer.assetId || a.code === targetTransfer.assetCode) {
        const historyEntry = {
          id: `h-${Date.now()}`,
          date: nowStr,
          action: 'Điều chuyển vị trí',
          actor: currentUser ? currentUser.name : 'Ban Giám hiệu',
          detail: `Điều chuyển theo phiếu ${targetTransfer.code}. Từ: [${targetTransfer.fromLocation}] sang Đến: [${targetTransfer.toLocation}]. Người nhận: ${targetTransfer.receiver}`
        };
        return {
          ...a,
          departmentId: targetTransfer.toDepartmentId,
          departmentName: targetTransfer.toDepartmentName,
          locationPath: targetTransfer.toLocation,
          currentUser: targetTransfer.receiver,
          status: 'Đang sử dụng',
          history: [historyEntry, ...(a.history || [])]
        };
      }
      return a;
    }));

    addAuditLog('Phê duyệt điều chuyển', targetTransfer.code, `Tự động cập nhật vị trí mới cho: ${targetTransfer.assetName}`);
  };

  // Delete Transfer -> If approved, automatically reverts asset to its original location
  const deleteTransfer = (transferId) => {
    const targetTransfer = transfers.find(t => t.id === transferId);
    if (!targetTransfer) return;

    // If the transfer was approved, revert asset back to original location, department and user
    if (targetTransfer.status === 'Đã duyệt') {
      const nowStr = new Date().toISOString().slice(0, 10);
      setAssets(prev => prev.map(a => {
        if (a.id === targetTransfer.assetId || a.code === targetTransfer.assetCode) {
          const historyEntry = {
            id: `h-${Date.now()}`,
            date: nowStr,
            action: 'Hủy phiếu điều chuyển',
            actor: currentUser ? currentUser.name : 'Quản trị viên',
            detail: `Xóa phiếu ${targetTransfer.code}. Hoàn trả vị trí từ [${targetTransfer.toLocation}] về vị trí ban đầu: [${targetTransfer.fromLocation || 'Vị trí cũ'}]. Người quản lý: ${targetTransfer.sender || a.currentUser}`
          };
          return {
            ...a,
            departmentId: targetTransfer.fromDepartmentId || a.departmentId,
            departmentName: targetTransfer.fromDepartmentName || a.departmentName,
            locationPath: targetTransfer.fromLocation || a.locationPath,
            currentUser: targetTransfer.sender || a.currentUser,
            history: [historyEntry, ...(a.history || [])]
          };
        }
        return a;
      }));
    }

    setTransfers(prev => prev.filter(t => t.id !== transferId));
    addAuditLog(
      'Xóa phiếu điều chuyển',
      targetTransfer.code,
      `Xóa phiếu ${targetTransfer.code}${targetTransfer.status === 'Đã duyệt' ? ` (hoàn trả tài sản về [${targetTransfer.fromLocation}])` : ''}`
    );
  };

  // Create Recall (Thu hồi) -> automatically shifts status to "Trong kho" & preserves previous state for potential rollback
  const createRecall = (recallData) => {
    const targetAsset = assets.find(a => a.id === recallData.assetId || a.code === recallData.assetCode);
    const newId = `rc-${Date.now()}`;
    const newRecall = {
      id: newId,
      ...recallData,
      fromLocation: targetAsset?.locationPath || recallData.fromLocation || 'Chưa phân vị trí',
      fromDepartmentId: targetAsset?.departmentId || recallData.departmentId || '',
      fromDepartmentName: targetAsset?.departmentName || recallData.departmentName || '',
      fromUser: targetAsset?.currentUser || targetAsset?.responsiblePerson || recallData.sender || '',
      fromStatus: targetAsset?.status || 'Đang sử dụng',
      fromCondition: targetAsset?.condition || 'Tốt',
      status: 'Đã thu hồi',
      date: new Date().toISOString().slice(0, 10)
    };

    setRecalls(prev => [newRecall, ...prev]);

    // Update asset to Trong kho
    setAssets(prev => prev.map(a => {
      if (a.id === recallData.assetId || a.code === recallData.assetCode) {
        const historyEntry = {
          id: `h-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          action: 'Thu hồi về kho',
          actor: currentUser ? currentUser.name : 'Thủ kho',
          detail: `Thu hồi theo phiếu ${recallData.code}. Người giao: ${recallData.sender || a.currentUser}. Lý do: ${recallData.reason || 'Nhập kho'}`
        };
        return {
          ...a,
          status: 'Trong kho',
          locationPath: 'Cơ sở 1 > Khu A > Tầng 1 > Kho Tổng CS1',
          currentUser: 'Kho Quản lý',
          condition: recallData.condition || a.condition,
          history: [historyEntry, ...(a.history || [])]
        };
      }
      return a;
    }));

    addAuditLog('Thu hồi tài sản', newRecall.code, `Thu hồi tài sản ${newRecall.assetName} về Kho Tổng`);
    return newRecall;
  };

  // Delete Recall -> Automatically reverts asset back to original location, department, user and status
  const deleteRecall = (recallId) => {
    const targetRecall = recalls.find(r => r.id === recallId);
    if (!targetRecall) return;

    const nowStr = new Date().toISOString().slice(0, 10);
    setAssets(prev => prev.map(a => {
      if (a.id === targetRecall.assetId || a.code === targetRecall.assetCode) {
        const historyEntry = {
          id: `h-${Date.now()}`,
          date: nowStr,
          action: 'Hủy phiếu thu hồi (Hoàn trả vị trí cũ)',
          actor: currentUser ? currentUser.name : 'Quản trị viên',
          detail: `Xóa phiếu thu hồi ${targetRecall.code}. Hoàn trả tài sản về vị trí ban đầu: [${targetRecall.fromLocation || 'Vị trí cũ'}]. Đơn vị: [${targetRecall.fromDepartmentName || a.departmentName}]. Người sử dụng: [${targetRecall.fromUser || targetRecall.sender || a.currentUser}]`
        };
        return {
          ...a,
          locationPath: targetRecall.fromLocation || a.locationPath,
          departmentId: targetRecall.fromDepartmentId || a.departmentId,
          departmentName: targetRecall.fromDepartmentName || a.departmentName,
          currentUser: targetRecall.fromUser || targetRecall.sender || a.currentUser,
          status: targetRecall.fromStatus || 'Đang sử dụng',
          condition: targetRecall.fromCondition || a.condition,
          history: [historyEntry, ...(a.history || [])]
        };
      }
      return a;
    }));

    setRecalls(prev => prev.filter(r => r.id !== recallId));
    addAuditLog(
      'Xóa biên bản thu hồi',
      targetRecall.code,
      `Xóa biên bản ${targetRecall.code}, hoàn trả tài sản ${targetRecall.assetName} về vị trí cũ: [${targetRecall.fromLocation || 'Vị trí cũ'}]`
    );
  };

  // Liquidation Process
  // 1. Propose Liquidation
  const proposeLiquidation = (lqData) => {
    const newId = `lq-${Date.now()}`;
    const newLq = {
      id: newId,
      ...lqData,
      status: 'Đề nghị',
      date: new Date().toISOString().slice(0, 10),
      requester: currentUser ? currentUser.name : 'Cán bộ quản lý',
      approver: 'Chờ phê duyệt'
    };

    setLiquidations(prev => [newLq, ...prev]);

    // Mark asset status as Chờ thanh lý
    setAssets(prev => prev.map(a => {
      if (a.id === lqData.assetId || a.code === lqData.assetCode) {
        return {
          ...a,
          status: 'Chờ thanh lý',
          history: [
            {
              id: `h-${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              action: 'Lập đề nghị thanh lý',
              actor: currentUser ? currentUser.name : 'Cán bộ',
              detail: `Đề nghị theo phiếu ${lqData.code}. Lý do: ${lqData.reason}`
            },
            ...(a.history || [])
          ]
        };
      }
      return a;
    }));

    addAuditLog('Đề nghị thanh lý', newLq.code, `Lập đề nghị thanh lý tài sản: ${newLq.assetName}`);
  };

  // 2. Approve Liquidation
  const approveLiquidation = (lqId) => {
    const targetLq = liquidations.find(l => l.id === lqId);
    if (!targetLq) return;

    setLiquidations(prev => prev.map(l => {
      if (l.id === lqId) {
        return {
          ...l,
          status: 'Đã duyệt',
          approver: currentUser ? currentUser.name : 'Ban Giám Hiệu'
        };
      }
      return l;
    }));

    addAuditLog('Phê duyệt thanh lý', targetLq.code, `Phê duyệt cho phép tiến hành thanh lý: ${targetLq.assetName}`);
  };

  // 3. Complete Liquidation -> status "Đã thanh lý"
  const completeLiquidation = (lqId, finalDetails = {}) => {
    const targetLq = liquidations.find(l => l.id === lqId);
    if (!targetLq) return;

    const nowStr = new Date().toISOString().slice(0, 10);

    setLiquidations(prev => prev.map(l => {
      if (l.id === lqId) {
        return {
          ...l,
          ...finalDetails,
          status: 'Đã hoàn tất',
          date: nowStr
        };
      }
      return l;
    }));

    setAssets(prev => prev.map(a => {
      if (a.id === targetLq.assetId || a.code === targetLq.assetCode) {
        return {
          ...a,
          status: 'Đã thanh lý',
          condition: 'Không sử dụng được',
          history: [
            {
              id: `h-${Date.now()}`,
              date: nowStr,
              action: 'Hoàn tất thanh lý',
              actor: currentUser ? currentUser.name : 'Hội đồng thanh lý',
              detail: `Thanh lý theo phương thức: ${finalDetails.method || targetLq.method}. Thu hồi: ${finalDetails.liquidationPrice || targetLq.liquidationPrice} đ`
            },
            ...(a.history || [])
          ]
        };
      }
      return a;
    }));

    addAuditLog('Hoàn tất thanh lý', targetLq.code, `Tài sản ${targetLq.assetName} chính thức chuyển sang trạng thái Đã thanh lý`);
  };

  // Inventory Session Management
  const createInventorySession = (sessionData) => {
    const newId = `inv-${Date.now()}`;
    const newSession = {
      id: newId,
      ...sessionData,
      status: 'Đang diễn ra',
      totalCount: assets.length,
      checkedCount: 0,
      matchedCount: 0,
      damagedCount: 0,
      wrongLocationCount: 0,
      missingCount: 0,
      extraCount: 0,
      records: {}
    };

    setInventorySessions(prev => [newSession, ...prev]);
    addAuditLog('Mở đợt kiểm kê', newSession.name, `Năm kiểm kê: ${newSession.year}, Phạm vi: ${newSession.scope}`);
    return newSession;
  };

  // Record item in inventory session (quét QR / chọn trạng thái thực tế)
  const recordInventoryItem = (sessionId, assetId, recordData) => {
    // recordData: { condition, statusResult, note, actualLocation, actualUser }
    // statusResult options: 'Có thực tế' | 'Hỏng' | 'Sai vị trí' | 'Không tìm thấy' | 'Thừa ngoài sổ'
    setInventorySessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const prevRecord = s.records[assetId];
        const newRecords = {
          ...s.records,
          [assetId]: {
            ...recordData,
            checkedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            checkedBy: currentUser ? currentUser.name : 'Ban Kiểm kê'
          }
        };

        // Recalculate summary stats
        const values = Object.values(newRecords);
        const checkedCount = values.length;
        const matchedCount = values.filter(v => v.statusResult === 'Có thực tế').length;
        const damagedCount = values.filter(v => v.statusResult === 'Hỏng').length;
        const wrongLocationCount = values.filter(v => v.statusResult === 'Sai vị trí').length;
        const missingCount = values.filter(v => v.statusResult === 'Không tìm thấy').length;
        const extraCount = values.filter(v => v.statusResult === 'Thừa ngoài sổ').length;

        return {
          ...s,
          records: newRecords,
          checkedCount,
          matchedCount,
          damagedCount,
          wrongLocationCount,
          missingCount,
          extraCount
        };
      }
      return s;
    }));

    // Update asset history and condition if damaged
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      setAssets(prev => prev.map(a => {
        if (a.id === assetId) {
          const newCondition = recordData.condition || a.condition;
          const newStatus = recordData.statusResult === 'Không tìm thấy' ? 'Mất' : a.status;
          return {
            ...a,
            condition: newCondition,
            status: newStatus,
            history: [
              {
                id: `h-${Date.now()}`,
                date: new Date().toISOString().slice(0, 10),
                action: `Kiểm kê: ${recordData.statusResult}`,
                actor: currentUser ? currentUser.name : 'Tổ kiểm kê',
                detail: `Kết quả: ${recordData.statusResult}, Tình trạng: ${recordData.condition}. Ghi chú: ${recordData.note || 'Không'}`
              },
              ...(a.history || [])
            ]
          };
        }
        return a;
      }));
    }

    addAuditLog('Kiểm kê tài sản', asset ? asset.name : assetId, `Ghi nhận kết quả: ${recordData.statusResult}`);
  };

  // Smart Alerts Calculation
  const alerts = {
    wrongLocation: assets.filter(a => canonicalStatus(a.status) === 'Đang sử dụng' && canonicalCondition(a.condition) === 'Khá' && a.id === 'as-012'), // flagged or evaluated
    missing: assets.filter(a => canonicalStatus(a.status) === 'Mất'),
    pendingLiquidation: assets.filter(a => canonicalStatus(a.status) === 'Chờ thanh lý'),
    expiringSoon: assets.filter(a => {
      // Nếu không điền thời gian sử dụng (hoặc null, rỗng, <=0) => xem như Vô hạn, KHÔNG CẢNH BÁO
      if (!a.lifespanYears || Number(a.lifespanYears) <= 0) return false;
      const rawYear = a.purchaseYear || a.importYear || (a.purchaseDate ? new Date(a.purchaseDate).getFullYear() : null);
      if (!rawYear) return false;
      const purchaseYear = Number(rawYear);
      if (isNaN(purchaseYear)) return false;
      const expireYear = purchaseYear + Number(a.lifespanYears);
      const currentYear = new Date().getFullYear();
      return expireYear <= currentYear + 1 && canonicalStatus(a.status) !== 'Đã thanh lý';
    })
  };


  // Reset demo data helper
  const resetToDemoData = () => {
    setAssets(INITIAL_ASSETS);
    setDepartments(INITIAL_DEPARTMENTS);
    setLocations(INITIAL_LOCATIONS);
    setTransfers(INITIAL_TRANSFERS);
    setRecalls(INITIAL_RECALLS);
    setLiquidations(INITIAL_LIQUIDATIONS);
    setInventorySessions(INITIAL_INVENTORY_SESSIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.clear();
    addAuditLog('Khôi phục dữ liệu', 'Toàn bộ hệ thống', 'Khôi phục dữ liệu ban đầu từ kho mẫu');
  };

  // =========== LOCATION MANAGEMENT ===========
  // Helper: deep clone & update node by id in tree
  const updateNodeInTree = (nodes, targetId, updateFn) => {
    return nodes.map(node => {
      if (node.id === targetId) return updateFn(node);
      if (node.children) {
        return { ...node, children: updateNodeInTree(node.children, targetId, updateFn) };
      }
      return node;
    });
  };

  const deleteNodeInTree = (nodes, targetId) => {
    return nodes
      .filter(node => node.id !== targetId)
      .map(node => {
        if (node.children) {
          return { ...node, children: deleteNodeInTree(node.children, targetId) };
        }
        return node;
      });
  };

  const addNodeToParent = (nodes, parentId, newNode) => {
    if (parentId === null) {
      return [...nodes, newNode];
    }
    return nodes.map(node => {
      if (node.id === parentId) {
        return { ...node, children: [...(node.children || []), newNode] };
      }
      if (node.children) {
        return { ...node, children: addNodeToParent(node.children, parentId, newNode) };
      }
      return node;
    });
  };

  const addLocation = (parentId, newNodeData) => {
    const newNode = {
      id: `loc-${Date.now()}`,
      children: [],
      ...newNodeData
    };
    setLocations(prev => addNodeToParent(prev, parentId, newNode));
    addAuditLog('Thêm vị trí', newNode.name, `Thêm vị trí mới vào cây địa lý`);
    return newNode;
  };

  const updateLocation = (id, updatedData) => {
    setLocations(prev => updateNodeInTree(prev, id, node => ({ ...node, ...updatedData })));
    addAuditLog('Cập nhật vị trí', updatedData.name || id, `Chỉnh sửa thông tin vị trí`);
  };

  const syncLocationsFromAssets = (customAssets = null) => {
    const list = customAssets || assets;
    const LEVEL_TYPES = [
      { type: 'CAMPUS', label: 'Cơ sở' },
      { type: 'AREA', label: 'Khu/Tòa' },
      { type: 'FLOOR', label: 'Tầng' },
      { type: 'ROOM', label: 'Phòng' }
    ];

    const rootNodes = deduplicateAndMergeLocationTree(locations || []);

    list.forEach(asset => {
      if (!asset.locationPath || !asset.locationPath.trim()) return;

      const rawPath = cleanText(asset.locationPath);
      let parts = rawPath.split(/\s*>\s*/).map(p => cleanText(p)).filter(Boolean);
      if (parts.length === 0) {
        parts = rawPath.split(/\s*;\s*/).map(p => cleanText(p)).filter(Boolean);
      }
      if (parts.length === 0) return;

      let currentLevelNodes = rootNodes;
      let currentPath = '';

      parts.forEach((partName, idx) => {
        const cleanPart = cleanText(partName);
        if (!cleanPart) return;
        currentPath = currentPath ? `${currentPath} > ${cleanPart}` : cleanPart;
        const key = cleanPart.toLowerCase();
        let node = currentLevelNodes.find(n => cleanText(n.name).toLowerCase() === key);

        if (!node) {
          const depth = Math.min(idx, 3);
          node = {
            id: `loc-auto-${encodeURIComponent(cleanText(currentPath)).replace(/%/g, '').slice(0, 35)}-${idx}`,
            name: cleanPart,
            code: cleanPart.slice(0, 10).toUpperCase(),
            type: LEVEL_TYPES[depth]?.type || 'ROOM',
            children: []
          };
          currentLevelNodes.push(node);
        } else {
          if (!Array.isArray(node.children)) node.children = [];
        }

        currentLevelNodes = node.children;
      });
    });

    const finalTree = deduplicateAndMergeLocationTree(rootNodes);
    setLocations(finalTree);
    addAuditLog('Đồng bộ vị trí', 'Cây địa lý', `Đồng bộ cây vị trí địa lý từ danh mục ${list.length} tài sản`);
    return finalTree;
  };

  const deleteLocation = (id) => {
    setLocations(prev => deleteNodeInTree(prev, id));
    addAuditLog('Xóa vị trí', id, `Xóa vị trí khỏi cây địa lý`);
  };

  // =========== DEPARTMENT MANAGEMENT ===========
  const addDepartment = (deptData) => {
    const newDept = {
      id: `dept-${Date.now()}`,
      ...deptData
    };
    setDepartments(prev => [...prev, newDept]);
    addAuditLog('Thêm phòng ban', newDept.name, `Tạo phòng ban mới: ${newDept.code}`);
    return newDept;
  };

  const updateDepartment = (id, updatedData) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...updatedData } : d));
    addAuditLog('Cập nhật phòng ban', updatedData.name || id, `Chỉnh sửa thông tin phòng ban`);
  };

  const deleteDepartment = (id) => {
    const dept = departments.find(d => d.id === id);
    setDepartments(prev => prev.filter(d => d.id !== id));
    addAuditLog('Xóa phòng ban', dept?.name || id, `Xóa phòng ban khỏi hệ thống`);
  };

  return (
    <AssetContext.Provider value={{
      assets,
      departments,
      locations,
      setLocations,
      syncLocationsFromAssets,
      transfers,
      recalls,
      liquidations,
      inventorySessions,
      auditLogs,
      alerts,
      // Custom option lists & actions
      assetTypeOptions, setAssetTypeOptions,
      conditionOptions, setConditionOptions,
      statusOptions, setStatusOptions,
      addAssetType, deleteAssetType, updateAssetType,
      addCondition, deleteCondition, updateCondition,
      addStatus, deleteStatus, updateStatus,
      resetOptionsToDefault,
      addAsset,
      importAssetsBatch,
      updateAsset,
      deleteAsset,
      deleteAssetsBatch,
      addAssetDocument,
      createTransfer,
      approveTransfer,
      deleteTransfer,
      createRecall,
      deleteRecall,
      proposeLiquidation,
      approveLiquidation,
      completeLiquidation,
      createInventorySession,
      recordInventoryItem,
      addAuditLog,
      resetToDemoData,
      addLocation,
      updateLocation,
      deleteLocation,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      // Multi-device sync
      syncStatus,
      lastSyncTime,
      syncError,
      syncNow,
      forcePushToServer,
      exportBackup,
      importBackup
    }}>
      {children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  return useContext(AssetContext);
}
