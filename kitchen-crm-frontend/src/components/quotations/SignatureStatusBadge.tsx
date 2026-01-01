/**
 * Signature Status Badge Component
 * Reusable badge for displaying signature status
 */

import { CheckCircle, Clock, Send, XCircle, AlertCircle } from 'lucide-react';

interface SignatureStatusBadgeProps {
  status?: string;
  className?: string;
  showIcon?: boolean;
}

export default function SignatureStatusBadge({
  status,
  className = '',
  showIcon = true,
}: SignatureStatusBadgeProps) {
  if (!status) {
    return (
      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-background-500/20 text-text-600 ${className}`}>
        {showIcon && <AlertCircle className="h-3 w-3 mr-1" />}
        No Signature
      </span>
    );
  }

  const badges = {
    PENDING: {
      color: 'bg-warning/20 text-warning',
      icon: Clock,
      text: 'Pending',
    },
    SENT: {
      color: 'bg-info/20 text-info',
      icon: Send,
      text: 'Sent',
    },
    SIGNED: {
      color: 'bg-success/20 text-success',
      icon: CheckCircle,
      text: 'Approved',
    },
    REJECTED: {
      color: 'bg-error/20 text-error',
      icon: XCircle,
      text: 'Rejected',
    },
    EXPIRED: {
      color: 'bg-background-500/20 text-text-600',
      icon: Clock,
      text: 'Expired',
    },
  };

  const badge = badges[status as keyof typeof badges] || badges.PENDING;
  const Icon = badge.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color} ${className}`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {badge.text}
    </span>
  );
}
