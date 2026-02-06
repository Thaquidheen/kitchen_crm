/**
 * CustomerStatistics Component
 * Displays customer statistics with status breakdown
 */

import { useGetCustomerStatisticsQuery } from '../customersAPI';
import { Card } from '@/components/ui/Card';
import { Users, TrendingUp, UserCheck, UserX, Clock, Palette, FileText, Phone, MessageSquare } from 'lucide-react';
import type { CustomerStatus } from '../types';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'inactive';
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, variant = 'default', loading }: StatCardProps) {
  const variantStyles = {
    default: 'bg-background-800 border-background-600 hover:border-background-500',
    primary: 'bg-background-800 border-primary-700 hover:border-primary-600',
    success: 'bg-success/10 border-success hover:border-success/80',
    warning: 'bg-warning/10 border-warning hover:border-warning/80',
    inactive: 'bg-background-700 border-background-600 hover:border-background-500',
  };

  const iconStyles = {
    default: 'text-text-700',
    primary: 'text-primary-600',
    success: 'text-success',
    warning: 'text-warning',
    inactive: 'text-text-500',
  };

  return (
    <Card className={`p-4 sm:p-5 ${variantStyles[variant]} transition-all duration-200 hover:shadow-lg cursor-default`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-text-600 mb-1.5 sm:mb-2 font-medium">{label}</p>
          {loading ? (
            <div className="h-7 sm:h-8 bg-background-600 rounded w-16 sm:w-20 animate-pulse" />
          ) : (
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-900">{value.toLocaleString()}</p>
          )}
        </div>
        <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-background-700/50 ${iconStyles[variant]} flex-shrink-0`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </Card>
  );
}

export function CustomerStatistics() {
  const { data: stats, isLoading, error } = useGetCustomerStatisticsQuery();

  if (error) {
    return (
      <Card className="p-4 bg-error/20 border-error">
        <p className="text-text-900 text-sm">Failed to load customer statistics</p>
      </Card>
    );
  }

  // Map status to display info
  const statusInfo: Record<CustomerStatus, { label: string; icon: React.ElementType; variant: StatCardProps['variant'] }> = {
    LEAD: { label: 'Leads', icon: Clock, variant: 'warning' },
    POTENTIAL: { label: 'Potential', icon: TrendingUp, variant: 'primary' },
    DESIGN_STAGE: { label: 'Design Stage', icon: Palette, variant: 'primary' },
    QUOTE_GIVEN: { label: 'Quote Given', icon: FileText, variant: 'warning' },
    FOLLOW_UP: { label: 'Follow Up', icon: Phone, variant: 'primary' },
    NEGOTIATIONS: { label: 'Negotiations', icon: MessageSquare, variant: 'warning' },
    CONFIRMED: { label: 'Confirmed', icon: UserCheck, variant: 'success' },
    LOST: { label: 'Lost', icon: UserX, variant: 'inactive' },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {/* Total Customers */}
      <StatCard
        label="Total Customers"
        value={stats?.total ?? 0}
        icon={Users}
        variant="primary"
        loading={isLoading}
      />

      {/* Status breakdown */}
      {(['LEAD', 'POTENTIAL', 'DESIGN_STAGE', 'QUOTE_GIVEN', 'FOLLOW_UP', 'NEGOTIATIONS', 'CONFIRMED', 'LOST'] as CustomerStatus[]).map((status) => {
        const info = statusInfo[status];
        return (
          <StatCard
            key={status}
            label={info.label}
            value={stats?.[status.toLowerCase() as keyof typeof stats] as number ?? 0}
            icon={info.icon}
            variant={info.variant}
            loading={isLoading}
          />
        );
      })}
    </div>
  );
}

export default CustomerStatistics;
