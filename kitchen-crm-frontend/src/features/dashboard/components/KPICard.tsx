/**
 * KPICard Component
 * Reusable card component for displaying Key Performance Indicators
 */

import { Card } from '@/components/ui/Card';
import clsx from 'clsx';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  loading = false,
  variant = 'default',
  onClick,
}: KPICardProps) {
  const variantStyles = {
    default: {
      card: 'bg-background-800 border-background-600 hover:border-background-500',
      icon: 'text-text-700',
      iconBg: 'bg-background-700',
    },
    primary: {
      card: 'bg-background-800 border-primary-600 hover:border-primary-500',
      icon: 'text-primary-500',
      iconBg: 'bg-primary-900/20',
    },
    success: {
      card: 'bg-background-800 border-success/50 hover:border-success',
      icon: 'text-success',
      iconBg: 'bg-success/20',
    },
    warning: {
      card: 'bg-background-800 border-warning/50 hover:border-warning',
      icon: 'text-warning',
      iconBg: 'bg-warning/20',
    },
    danger: {
      card: 'bg-background-800 border-error/50 hover:border-error',
      icon: 'text-error',
      iconBg: 'bg-error/20',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card
      className={clsx(
        'p-6 transition-all duration-200',
        styles.card,
        onClick && 'cursor-pointer hover:shadow-lg',
        loading && 'animate-pulse'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-600 mb-2">{title}</p>

          {loading ? (
            <div className="h-8 bg-background-700 rounded w-24 mb-2" />
          ) : (
            <h3 className="text-3xl font-bold text-text-900 mb-1">{value}</h3>
          )}

          {trend && !loading && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={clsx(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-success' : 'text-primary-400'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-text-500">vs last month</span>
            </div>
          )}

          {subtitle && !loading && (
            <p className="text-xs text-text-500 mt-1">{subtitle}</p>
          )}
        </div>

        <div className={clsx('p-3 rounded-lg', styles.iconBg)}>
          <Icon className={clsx('h-6 w-6', styles.icon)} />
        </div>
      </div>
    </Card>
  );
}

export default KPICard;
