/**
 * DateRangeFilter Component
 * Allows users to select date ranges for analytics
 */

import { useAppDispatch } from '@/app/hooks';
import {
  setRevenueAnalyticsDateRange,
  setProjectAnalyticsDateRange,
  setCustomerAnalyticsDateRange,
  setPerformanceMetricsDateRange,
  setAllDateRanges,
} from '../dashboardSlice';
import { Card } from '@/components/ui/Card';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/Button';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import type { DateRange as DateRangeType } from '../dashboardSlice';

interface DateRangeFilterProps {
  scope?: 'revenue' | 'project' | 'customer' | 'performance' | 'all';
  compact?: boolean;
}

export function DateRangeFilter({
  scope = 'all',
  compact = false,
}: DateRangeFilterProps) {
  const dispatch = useAppDispatch();

  const [localDateRange, setLocalDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  const handleQuickSelect = (period: string) => {
    const today = new Date();
    const fromDate = new Date();

    switch (period) {
      case '7d':
        fromDate.setDate(today.getDate() - 7);
        break;
      case '30d':
        fromDate.setDate(today.getDate() - 30);
        break;
      case '3m':
        fromDate.setMonth(today.getMonth() - 3);
        break;
      case '6m':
        fromDate.setMonth(today.getMonth() - 6);
        break;
      case '1y':
        fromDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'ytd':
        fromDate.setMonth(0);
        fromDate.setDate(1);
        break;
      default:
        return;
    }

    const dateRange: DateRangeType = {
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
    };

    applyDateRange(dateRange);
  };

  const handleCustomDateRange = () => {
    if (!localDateRange.startDate || !localDateRange.endDate) return;

    const dateRange: DateRangeType = {
      fromDate: localDateRange.startDate.toISOString().split('T')[0],
      toDate: localDateRange.endDate.toISOString().split('T')[0],
    };

    applyDateRange(dateRange);
  };

  const applyDateRange = (dateRange: DateRangeType) => {
    switch (scope) {
      case 'revenue':
        dispatch(setRevenueAnalyticsDateRange(dateRange));
        break;
      case 'project':
        dispatch(setProjectAnalyticsDateRange(dateRange));
        break;
      case 'customer':
        dispatch(setCustomerAnalyticsDateRange(dateRange));
        break;
      case 'performance':
        dispatch(setPerformanceMetricsDateRange(dateRange));
        break;
      case 'all':
      default:
        dispatch(setAllDateRanges(dateRange));
        break;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="h-4 w-4 text-white-600" />
        {['7d', '30d', '3m', '6m', '1y'].map((period) => (
          <button
            key={period}
            onClick={() => handleQuickSelect(period)}
            className="px-3 py-1 text-xs font-medium bg-black-700 hover:bg-red-700 text-white-900 rounded transition-colors"
          >
            {period === '7d' && 'Last 7 Days'}
            {period === '30d' && 'Last 30 Days'}
            {period === '3m' && '3 Months'}
            {period === '6m' && '6 Months'}
            {period === '1y' && '1 Year'}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Card className="p-6 bg-black-800 border-black-600">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-white-900">Date Range Filter</h3>
      </div>

      {/* Quick Select Buttons */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white-700 mb-2">
          Quick Select
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[
            { key: '7d', label: 'Last 7 Days' },
            { key: '30d', label: 'Last 30 Days' },
            { key: '3m', label: 'Last 3 Months' },
            { key: '6m', label: 'Last 6 Months' },
            { key: '1y', label: 'Last Year' },
            { key: 'ytd', label: 'Year to Date' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant="secondary"
              size="sm"
              onClick={() => handleQuickSelect(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      <div>
        <label className="block text-sm font-medium text-white-700 mb-2">
          Custom Range
        </label>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <DateRangePicker
              value={localDateRange}
              onChange={(range) => setLocalDateRange(range)}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleCustomDateRange}
            disabled={!localDateRange.startDate || !localDateRange.endDate}
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Scope Indicator */}
      <div className="mt-4 text-xs text-white-600">
        <p>
          Applying to:{' '}
          <span className="font-semibold text-white-900">
            {scope === 'all'
              ? 'All Analytics'
              : `${scope.charAt(0).toUpperCase() + scope.slice(1)} Analytics`}
          </span>
        </p>
      </div>
    </Card>
  );
}

export default DateRangeFilter;
