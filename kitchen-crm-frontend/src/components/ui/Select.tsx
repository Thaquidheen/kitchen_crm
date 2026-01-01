/**
 * Select Component
 * Reusable dropdown select with validation states
 */

import { type SelectHTMLAttributes, type ReactNode, forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder = 'Select an option',
      fullWidth = true,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const selectBaseStyles =
      'px-4 py-3 bg-background-700 border rounded-lg text-text-900 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer';

    const selectVariantStyles = hasError
      ? 'border-error focus:border-error focus:ring-error'
      : 'border-background-600 focus:border-primary-700 focus:ring-primary-700';

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <div className={clsx(fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label className="block text-text-800 text-sm font-medium mb-2">
            {label}
          </label>
        )}

        {/* Select Wrapper */}
        <div className="relative">
          {/* Select Field */}
          <select
            ref={ref}
            className={clsx(
              selectBaseStyles,
              selectVariantStyles,
              widthStyles,
              'pr-10',
              className
            )}
            disabled={disabled}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options ? (
              options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))
            ) : (
              children
            )}
          </select>

          {/* Dropdown Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-600">
            <ChevronDown size={20} />
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

Select.displayName = 'Select';

export default Select;
