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
  ShieldCheck,
  Tag
} from 'lucide-react';
import { cleanText, removeVietnameseDiacritics, canonicalStatus, canonicalCondition } from '../../utils/normalize';

export function resolveConditionStyle(condition) {
  const cleaned = cleanText(condition);
  const lower = cleaned.toLowerCase();
  const noDau = removeVietnameseDiacritics(lower);

  if (lower.includes('không sử dụng được') || noDau.includes('khong su dung duoc')) {
    return {
      badgeClass: 'badge-danger',
      Icon: XCircle,
      label: 'Không sử dụng được',
      style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 600, whiteSpace: 'nowrap' }
    };
  }
  if (lower.includes('hỏng nặng') || noDau.includes('hong nang')) {
    return {
      badgeClass: 'badge-danger',
      Icon: AlertTriangle,
      label: 'Hỏng nặng',
      style: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 600, whiteSpace: 'nowrap' }
    };
  }
  if (lower.includes('hỏng nhẹ') || noDau.includes('hong nhe')) {
    return {
      badgeClass: 'badge-warning',
      Icon: AlertTriangle,
      label: 'Hỏng nhẹ',
      style: { background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d', fontWeight: 600, whiteSpace: 'nowrap' }
    };
  }
  if (lower.includes('khá') || noDau.includes('kha')) {
    return {
      badgeClass: 'badge-info',
      Icon: CheckCircle,
      label: 'Khá',
      style: { background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', fontWeight: 600, whiteSpace: 'nowrap' }
    };
  }
  if (lower.includes('tốt') || noDau.includes('tot')) {
    return {
      badgeClass: 'badge-success',
      Icon: ShieldCheck,
      label: 'Tốt',
      style: { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 600, whiteSpace: 'nowrap' }
    };
  }

  return {
    badgeClass: 'badge-info',
    Icon: HelpCircle,
    label: cleaned || 'Chưa rõ',
    style: { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 600, whiteSpace: 'nowrap' }
  };
}

export function resolveStatusStyle(status) {
  const cleaned = cleanText(status);
  const lower = cleaned.toLowerCase();
  const noDau = removeVietnameseDiacritics(lower);

  // 1. Đang sử dụng / Sử dụng / Hoạt động / Sẵn sàng -> XANH LÁ (badge-success)
  if (
    lower.includes('đang sử dụng') ||
    lower.includes('su dung') ||
    noDau.includes('su dung') ||
    noDau.includes('dang dung') ||
    noDau.includes('hoat dong') ||
    noDau.includes('san sang') ||
    noDau.includes('binh thuong') ||
    noDau.includes('cap phat')
  ) {
    return {
      badgeClass: 'badge-success',
      Icon: CheckCircle,
      label: 'Đang sử dụng',
      style: {
        background: '#dcfce7',
        color: '#15803d',
        border: '1px solid #86efac',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }
    };
  }

  // 2. Trong kho / Lưu kho / Dự trữ -> XANH DƯƠNG (badge-info)
  if (lower.includes('kho') || noDau.includes('kho') || noDau.includes('du tru') || noDau.includes('moi')) {
    return {
      badgeClass: 'badge-info',
      Icon: Package,
      label: 'Trong kho',
      style: {
        background: '#e0f2fe',
        color: '#0369a1',
        border: '1px solid #7dd3fc',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }
    };
  }

  // 3. Điều chuyển / Luân chuyển -> TÍM / VÀNG (badge-warning)
  if (lower.includes('chuyển') || noDau.includes('chuyen')) {
    return {
      badgeClass: 'badge-warning',
      Icon: RefreshCw,
      label: 'Điều chuyển',
      style: {
        background: '#ede9fe',
        color: '#6d28d9',
        border: '1px solid #c4b5fd',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }
    };
  }

  // 4. Chờ thanh lý / Đề nghị thanh lý -> VÀNG CAM (badge-warning)
  if (
    lower.includes('chờ') ||
    noDau.includes('cho thanh ly') ||
    noDau.includes('de nghi thanh ly') ||
    noDau.includes('cho duyet')
  ) {
    return {
      badgeClass: 'badge-warning',
      Icon: Clock,
      label: 'Chờ thanh lý',
      style: {
        background: '#fef3c7',
        color: '#b45309',
        border: '1px solid #fcd34d',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }
    };
  }

  // 5. Đã thanh lý / Thanh lý -> TÍM SLATE CAO CẤP (KHÔNG ĐỂ XÁM MẤT MÀU)
  if (lower.includes('thanh lý') || noDau.includes('thanh ly')) {
    return {
      badgeClass: 'badge-secondary',
      Icon: Archive,
      label: 'Đã thanh lý',
      style: {
        background: '#f3e8ff',
        color: '#7e22ce',
        border: '1px solid #d8b4fe',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }
    };
  }

  // 6. Đã thu hồi / Thu hồi -> XANH TEAL
  if (lower.includes('thu hồi') || noDau.includes('thu hoi')) {
    return {
      badgeClass: 'badge-info',
      Icon: Package,
      label: 'Đã thu hồi',
      style: {
        background: '#ccfbf1',
        color: '#0f766e',
        border: '1px solid #5eead4',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }
    };
  }

  // 7. Mất / Hỏng / Sự cố -> ĐỎ (badge-danger)
  if (
    lower.includes('mất') ||
    noDau.includes('mat') ||
    lower.includes('hỏng') ||
    noDau.includes('hong') ||
    noDau.includes('su co') ||
    noDau.includes('that lac')
  ) {
    return {
      badgeClass: 'badge-danger',
      Icon: XCircle,
      label: 'Mất',
      style: {
        background: '#fee2e2',
        color: '#b91c1c',
        border: '1px solid #fca5a5',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }
    };
  }

  // 8. Bất kỳ trạng thái tùy chỉnh khác -> DÙNG MÀU XANH INDIGO RỰC RỠ (TUYỆT ĐỐI KHÔNG BỊ MẤT MÀU)
  return {
    badgeClass: 'badge-info',
    Icon: Tag,
    label: cleaned || 'Khác',
    style: {
      background: '#eff6ff',
      color: '#1d4ed8',
      border: '1px solid #bfdbfe',
      fontWeight: 600,
      whiteSpace: 'nowrap'
    }
  };
}

export function ConditionBadge({ condition }) {
  const { badgeClass, Icon, label, style } = resolveConditionStyle(condition);

  return (
    <span className={`badge ${badgeClass}`} style={style}>
      <Icon size={13} />
      {label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const { badgeClass, Icon, label, style } = resolveStatusStyle(status);

  return (
    <span className={`badge ${badgeClass}`} style={style}>
      <Icon size={13} />
      {label}
    </span>
  );
}


