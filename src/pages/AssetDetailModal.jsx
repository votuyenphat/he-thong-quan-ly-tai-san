// src/pages/AssetDetailModal.jsx
import React, { useState } from 'react';
import Modal from '../components/common/Modal';
import { ConditionBadge, StatusBadge } from '../components/common/Badge';
import { formatVND, formatDate } from '../utils/formatters';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import {
  QrCode,
  History,
  FileText,
  Upload,
  User,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  Shield,
  Layers,
  Clock
} from 'lucide-react';

export default function AssetDetailModal({ isOpen, onClose, asset, onOpenQR }) {
  const { addAssetDocument } = useAssets();
  const { permissions } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // info | history | documents
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('Hóa đơn chứng từ');

  if (!asset) return null;

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    addAssetDocument(asset.id, {
      name: newDocName.trim(),
      type: newDocType,
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`
    });
    setNewDocName('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi Tiết Hồ Sơ Tài Sản: ${asset.code}`}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              onClose();
              onOpenQR(asset);
            }}
          >
            <QrCode size={16} />
            In Tem Mã QR
          </button>
        </>
      }
    >
      {/* Sub-header with tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${activeTab === 'info' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('info')}
          >
            <Layers size={15} />
            Thông Tin Chung
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={15} />
            Lịch Sử Bất Biến ({asset.history?.length || 0})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'documents' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('documents')}
          >
            <FileText size={15} />
            Hồ Sơ Đính Kèm ({asset.documents?.length || 0})
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ConditionBadge condition={asset.condition} />
          <StatusBadge status={asset.status} />
        </div>
      </div>

      {/* TAB 1: THÔNG TIN CHI TIẾT */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main Title */}
          <div>
            <div style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 'bold' }}>
              MÃ ĐỊNH DANH: {asset.code}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
              {asset.name}
            </h2>
          </div>

          {/* Grid Information */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            background: '#f8fafc',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Loại tài sản</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{asset.type || '---'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nhóm / Phân khúc</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{asset.category || '---'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nhãn hiệu / Nhà SX</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{asset.brand || '---'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Model / Quy cách</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{asset.model || '---'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Số Serial Number</div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{asset.serial || '---'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nguyên giá (VNĐ)</div>
              <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                {formatVND(asset.cost)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ngày mua / Ngày nhập</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                {formatDate(asset.purchaseDate)} (Nhập: {formatDate(asset.importDate)})
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Thời hạn sử dụng</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                {asset.lifespanYears} năm (Hạn BH: {formatDate(asset.warrantyEnd)})
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Nhà cung cấp</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{asset.supplier || '---'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Số chứng từ / Hóa đơn</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{asset.invoiceNumber || '---'}</div>
            </div>
          </div>

          {/* Location & Responsibility */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} />
              Vị Trí & Trách Nhiệm Sử Dụng
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Phòng/Ban quản lý:</span>
                <div style={{ fontWeight: 600 }}>{asset.departmentName}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Vị trí vật lý cụ thể:</span>
                <div style={{ fontWeight: 600, color: '#2563eb' }}>{asset.locationPath}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Người chịu trách nhiệm:</span>
                <div style={{ fontWeight: 600 }}>{asset.responsiblePerson}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Người sử dụng trực tiếp:</span>
                <div style={{ fontWeight: 600, color: '#059669' }}>{asset.currentUser}</div>
              </div>
            </div>

            {asset.notes && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#64748b' }}>
                <strong>Ghi chú:</strong> {asset.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LỊCH SỬ BẤT BIẾN (AUDIT TRAIL) */}
      {activeTab === 'history' && (
        <div>
          <div style={{
            background: '#f8fafc',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '0.8rem',
            color: '#64748b',
            marginBottom: '16px'
          }}>
            * Hệ thống tự động ghi nhận mọi biến động (nhập, điều chuyển, bàn giao, bảo dưỡng, kiểm kê, thanh lý). Dữ liệu là bất biến và không cho phép xóa.
          </div>

          <div className="timeline">
            {(asset.history || []).map((h, idx) => (
              <div key={h.id || idx} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-title">
                    <span>{h.action}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>{h.date}</span>
                  </div>
                  <div className="timeline-actor">
                    Người thực hiện: {h.actor}
                  </div>
                  <div className="timeline-desc">
                    {h.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HỒ SƠ ĐÍNH KÈM */}
      {activeTab === 'documents' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>
              Danh mục tài liệu điện tử đã lưu trữ ({asset.documents?.length || 0})
            </h4>

            {(!asset.documents || asset.documents.length === 0) ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
                Chưa có tài liệu điện tử nào được đính kèm.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {asset.documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FileText size={20} color="#2563eb" />
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {doc.type} • {doc.size} • Ngày tải lên: {doc.date}
                        </div>
                      </div>
                    </div>

                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => alert(`Đang tải tệp: ${doc.name}`)}
                    >
                      Tải về
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form đính kèm tài liệu mới */}
          <form onSubmit={handleAddDocument} style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '10px',
            border: '1px dashed #cbd5e1',
            marginTop: '16px'
          }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', color: '#334155' }}>
              + Đính kèm thêm tài liệu/chứng từ vào hồ sơ
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Tên tệp (VD: Hoa_Don_Dien_Tu_GTGT.pdf, Bien_Ban_Ban_Giao.docx)..."
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                required
              />
              <select 
                className="form-select"
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value)}
              >
                <option value="Hóa đơn">Hóa đơn</option>
                <option value="Phiếu nhập">Phiếu nhập</option>
                <option value="Biên bản bàn giao">Biên bản bàn giao</option>
                <option value="Biên bản điều chuyển">Biên bản điều chuyển</option>
                <option value="Biên bản kiểm kê">Biên bản kiểm kê</option>
                <option value="Phiếu sửa chữa">Phiếu sửa chữa</option>
                <option value="Hình ảnh chụp">Hình ảnh chụp</option>
                <option value="File PDF">File PDF</option>
                <option value="File Word">File Word</option>
              </select>
              <button type="submit" className="btn btn-primary btn-sm">
                <Upload size={14} />
                Lưu vào hồ sơ
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
