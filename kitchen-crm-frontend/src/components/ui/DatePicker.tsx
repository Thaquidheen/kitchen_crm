/**
 * DatePicker Component
 * Date input with validation and formatting
 */

import { type InputHTMLAttributes, forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  value?: Date | string;
  onChange?: (date: Date | null) => void;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const inputBaseStyles =
      'px-4 py-3 bg-background-700 border rounded-lg text-text-900 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed pr-10';

    const inputVariantStyles = hasError
      ? 'border-error focus:border-error focus:ring-error'
      : 'border-background-600 focus:border-primary-700 focus:ring-primary-700';

    const widthStyles = fullWidth ? 'w-full' : '';

    // Convert value to string format for input
    const inputValue =
      value instanceof Date
        ? format(value, 'yyyy-MM-dd')
        : value || '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateValue = e.target.value;
      if (onChange) {
        onChange(dateValue ? new Date(dateValue) : null);
      }
    };

    return (
      <div className={clsx(fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label className="block text-text-800 text-sm font-medium mb-2">
            {label}
          </label>
        )}

        {/* Input Wrapper */}
        <div className="relative">
          {/* Date Input */}
          <input
            ref={ref}
            type="date"
            value={inputValue}
            onChange={handleChange}
            className={clsx(
              inputBaseStyles,
              inputVariantStyles,
              widthStyles,
              className,
              // Custom date input styling
              '[&::-webkit-calendar-picker-indicator]:opacity-0',
              '[&::-webkit-calendar-picker-indicator]:absolute',
              '[&::-webkit-calendar-picker-indicator]:right-0',
              '[&::-webkit-calendar-picker-indicator]:w-10',
              '[&::-webkit-calendar-picker-indicator]:h-full',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer'
            )}
            disabled={disabled}
            {...props}
          />

          {/* Calendar Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-600">
            <Calendar size={20} />
          </div>
        </div>

        {/* Error Message */}
        {error && <p className="mt-1 text-sm text-error">{error}</p>}

        {/* Helper Text */}
        {!error && helperText && (
          <p className="mt-1 text-sm text-text-600">{helperText}</p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
