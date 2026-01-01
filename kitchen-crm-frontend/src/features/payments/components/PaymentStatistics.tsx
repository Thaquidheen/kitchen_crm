/**
 * PaymentStatistics Component
 * Displays payment statistics and metrics
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { useGetPaymentStatisticsQuery } from '../paymentApi';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';

export function PaymentStatistics() {
  const { data: statistics, isLoading } = useGetPaymentStatisticsQuery();
  const currentTheme = useAppSelector(selectCurrentTheme);

  // Dynamic colors based on theme
  const themeColors = useMemo(() => {
    if (!currentTheme?.colors) {
      return {
        info: '#3B82F6',
        success: '#10B981',
        primary: '#8B5CF6',
        warning: '#F59E0B',
        text: '#FFFFFF',
        background: '#12121A',
      };
    }
    return {
      info: currentTheme.colors.semantic.info,
      success: currentTheme.colors.semantic.success,
      primary: currentTheme.colors.primary[500],
      warning: currentTheme.colors.semantic.warning,
      text: currentTheme.colors.text[900],
      background: currentTheme.colors.background[800],
    };
  }, [currentTheme]);

  if (isLoading || !statistics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card 
            key={i} 
            className="p-4 sm:p-6"
            style={{
              backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
              borderColor: currentTheme?.colors?.background?.[600] || '#252530'
            }}
          >
            <div className="animate-pulse space-y-2">
              <div 
                className="h-3 sm:h-4 w-20 sm:w-24 rounded"
                style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24' }}
              />
              <div 
                className="h-6 sm:h-8 w-24 sm:w-32 rounded"
                style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24' }}
              />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Payments',
      value: statistics?.data?.totalPayments || 0,
      icon: Calendar,
      color: themeColors.info,
    },
    {
      label: 'Total Amount',
      value: `₹${(statistics?.data?.totalAmount || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: themeColors.success,
    },
    {
      label: 'Average Payment',
      value: `₹${(statistics?.data?.averagePaymentAmount || 0).toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: themeColors.primary,
    },
    {
      label: 'This Month',
      value: `₹${(statistics?.data?.monthlyRevenue?.[0]?.amount || 0).toLocaleString('en-IN')}`,
      icon: CreditCard,
      color: themeColors.warning,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className="p-4 sm:p-6"
            style={{
              backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
              borderColor: currentTheme?.colors?.background?.[600] || '#252530'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-xs sm:text-sm"
                  style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
                >
                  {stat.label}
                </p>
                <p 
                  className="text-xl sm:text-2xl font-bold mt-1"
                  style={{ color: themeColors.text }}
                >
                  {stat.value}
                </p>
              </div>
              <Icon 
                className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" 
                style={{ color: stat.color }} 
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default PaymentStatistics;
