// src/components/common/Badge.jsx
import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Package, 
  Archive, 
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

export function ConditionBadge({ condition }) {
  let badgeClass = 'badge-secondary';
  let Icon = HelpCircle;

  switch (condition) {
    case 'Tốt':
      badgeClass = 'badge-success';
      Icon = ShieldCheck;
      break;
    case 'Khá':
      badgeClass = 'badge-info';
      Icon = CheckCircle;
      break;
    case 'Hỏng nhẹ':
      badgeClass = 'badge-warning';
      Icon = AlertTriangle;
      break;
    case 'Hỏng nặng':
      badgeClass = 'badge-danger';
      Icon = AlertTriangle;
      break;
    case 'Không sử dụng được':
      badgeClass = 'badge-danger';
      Icon = XCircle;
      break;
    default:
      badgeClass = 'badge-secondary';
      Icon = HelpCircle;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <Icon size={13} />
      {condition || 'Chưa rõ'}
    </span>
  );
}

export function StatusBadge({ status }) {
  let badgeClass = 'badge-secondary';
  let Icon = Clock;

  switch (status) {
    case 'Đang sử dụng':
      badgeClass = 'badge-success';
      Icon = CheckCircle;
      break;
    case 'Trong kho':
      badgeClass = 'badge-info';
      Icon = Package;
      break;
    case 'Đang sửa chữa':
      badgeClass = 'badge-warning';
      Icon = RefreshCw;
      break;
    case 'Điều chuyển':
      badgeClass = 'badge-warning';
      Icon = RefreshCw;
      break;
    case 'Chờ thanh lý':
      badgeClass = 'badge-warning';
      Icon = Clock;
      break;
    case 'Đã thanh lý':
      badgeClass = 'badge-secondary';
      Icon = Archive;
      break;
    case 'Đã thu hồi':
      badgeClass = 'badge-info';
      Icon = Package;
      break;
    case 'Mất':
      badgeClass = 'badge-danger';
      Icon = XCircle;
      break;
    default:
      badgeClass = 'badge-secondary';
      Icon = Clock;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <Icon size={13} />
      {status || 'Khác'}
    </span>
  );
}
