// src/context/AssetContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
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
    return s ? JSON.parse(s) : INITIAL_ASSETS;
  });

  const [departments, setDepartments] = useState(() => {
    const s = localStorage.getItem('qlts_departments');
    return s ? JSON.parse(s) : INITIAL_DEPARTMENTS;
  });

  const [locations, setLocations] = useState(() => {
    const s = localStorage.getItem('qlts_locations');
    return s ? JSON.parse(s) : INITIAL_LOCATIONS;
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

  // Sync back to localStorage
  useEffect(() => { localStorage.setItem('qlts_assets', JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem('qlts_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('qlts_locations', JSON.stringify(locations)); }, [locations]);
  useEffect(() => { localStorage.setItem('qlts_transfers', JSON.stringify(transfers)); }, [transfers]);
  useEffect(() => { localStorage.setItem('qlts_recalls', JSON.stringify(recalls)); }, [recalls]);
  useEffect(() => { localStorage.setItem('qlts_liquidations', JSON.stringify(liquidations)); }, [liquidations]);
  useEffect(() => { localStorage.setItem('qlts_inventory_sessions', JSON.stringify(inventorySessions)); }, [inventorySessions]);
  useEffect(() => { localStorage.setItem('qlts_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);

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
    const asset = {
      id: newId,
      ...newAssetData,
      history: [
        {
          id: `h-${Date.now()}`,
          date: dateStr,
          action: 'Nhập tài sản mới',
          actor: currentUser ? currentUser.name : 'Thủ kho',
          detail: `Nhập vào hệ thống theo phiếu/chứng từ: ${newAssetData.invoiceNumber || 'Mới'}`
        }
      ],
      documents: newAssetData.documents || []
    };

    setAssets(prev => [asset, ...prev]);
    addAuditLog('Nhập tài sản mới', `${asset.name} (${asset.code})`, `Nguyên giá: ${asset.cost} đ, Phòng ban: ${asset.departmentName}`);
    return asset;
  };

  // Batch import assets from Excel
  const importAssetsBatch = (importedList) => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const newAssets = importedList.map((item, idx) => ({
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
        return {
          ...a,
          ...updatedFields,
          history: [historyEntry, ...(a.history || [])]
        };
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

  // Create Recall (Thu hồi) -> automatically shifts status to "Trong kho"
  const createRecall = (recallData) => {
    const newId = `rc-${Date.now()}`;
    const newRecall = {
      id: newId,
      ...recallData,
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
          detail: `Thu hồi theo phiếu ${recallData.code}. Người giao: ${recallData.sender}. Phụ kiện bàn giao: ${(recallData.accessories || []).join(', ')}`
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
    wrongLocation: assets.filter(a => a.status === 'Đang sử dụng' && a.condition === 'Khá' && a.id === 'as-012'), // flagged or evaluated
    missing: assets.filter(a => a.status === 'Mất'),
    overdueRepair: assets.filter(a => a.status === 'Đang sửa chữa'),
    pendingLiquidation: assets.filter(a => a.status === 'Chờ thanh lý'),
    expiringSoon: assets.filter(a => {
      if (!a.purchaseDate || !a.lifespanYears) return false;
      const purchaseYear = new Date(a.purchaseDate).getFullYear();
      const expireYear = purchaseYear + a.lifespanYears;
      const currentYear = new Date().getFullYear();
      return expireYear <= currentYear + 1 && a.status !== 'Đã thanh lý';
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
      transfers,
      recalls,
      liquidations,
      inventorySessions,
      auditLogs,
      alerts,
      addAsset,
      importAssetsBatch,
      updateAsset,
      deleteAsset,
      addAssetDocument,
      createTransfer,
      approveTransfer,
      createRecall,
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
      deleteDepartment
    }}>
      {children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  return useContext(AssetContext);
}
