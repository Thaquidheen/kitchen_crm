/**
 * DateRangePicker Component
 * Date range selector with start and end dates
 */

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface DateRangePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  disabled?: boolean;
  className?: string;
}

export const DateRangePicker = ({
  label,
  error,
  helperText,
  fullWidth = true,
  value,
  onChange,
  disabled,
  className,
}: DateRangePickerProps) => {
  const [range, setRange] = useState<DateRange>(
    value || { startDate: null, endDate: null }
  );

  const hasError = !!error;

  const inputBaseStyles =
    'px-4 py-3 bg-black-700 border rounded-lg text-white-900 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed pr-10';

  const inputVariantStyles = hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-black-600 focus:border-red-700 focus:ring-red-700';

  const widthStyles = fullWidth ? 'w-full' : '';

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value ? new Date(e.target.value) : null;
    const newRange = { ...range, startDate: newStartDate };
    setRange(newRange);
    onChange?.(newRange);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value ? new Date(e.target.value) : null;
    const newRange = { ...range, endDate: newEndDate };
    setRange(newRange);
    onChange?.(newRange);
  };

  const startValue = range.startDate
    ? format(range.startDate, 'yyyy-MM-dd')
    : '';
  const endValue = range.endDate ? format(range.endDate, 'yyyy-MM-dd') : '';

  return (
    <div className={clsx(fullWidth && 'w-full', className)}>
      {/* Label */}
      {label && (
        <label className="block text-white-800 text-sm font-medium mb-2">
          {label}
        </label>
      )}

      {/* Date Range Inputs */}
      <div className="grid grid-cols-2 gap-3">
        {/* Start Date */}
        <div className="relative">
          <input
            type="date"
            value={startValue}
            onChange={handleStartDateChange}
            disabled={disabled}
            className={clsx(
              inputBaseStyles,
              inputVariantStyles,
              'w-full',
              '[&::-webkit-calendar-picker-indicator]:opacity-0',
              '[&::-webkit-calendar-picker-indicator]:absolute',
              '[&::-webkit-calendar-picker-indicator]:right-0',
              '[&::-webkit-calendar-picker-indicator]:w-10',
              '[&::-webkit-calendar-picker-indicator]:h-full',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer'
            )}
            placeholder="Start date"
            max={endValue || undefined}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white-600">
            <Calendar size={20} />
          </div>
        </div>

        {/* End Date */}
        <div className="relative">
          <input
            type="date"
            value={endValue}
            onChange={handleEndDateChange}
            disabled={disabled}
            className={clsx(
              inputBaseStyles,
              inputVariantStyles,
              'w-full',
              '[&::-webkit-calendar-picker-indicator]:opacity-0',
              '[&::-webkit-calendar-picker-indicator]:absolute',
              '[&::-webkit-calendar-picker-indicator]:right-0',
              '[&::-webkit-calendar-picker-indicator]:w-10',
              '[&::-webkit-calendar-picker-indicator]:h-full',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer'
            )}
            placeholder="End date"
            min={startValue || undefined}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white-600">
            <Calendar size={20} />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}

      {/* Helper Text */}
      {!error && helperText && (
        <p className="mt-1 text-sm text-white-600">{helperText}</p>
      )}
    </div>
  );
};

export default DateRangePicker;
