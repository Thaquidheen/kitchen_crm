/**
 * Checkbox Component
 * Reusable checkbox with label and validation
 */

import { type InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      indeterminate = false,
      className,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const checkboxBaseStyles =
      'w-5 h-5 bg-background-700 border-2 rounded cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-900 disabled:opacity-50 disabled:cursor-not-allowed';

    const checkboxVariantStyles = hasError
      ? 'border-error focus:ring-error'
      : checked
      ? 'border-primary-700 bg-primary-700 focus:ring-primary-700'
      : 'border-background-600 focus:ring-primary-700 hover:border-primary-700';

    return (
      <div className="flex flex-col">
        <div className="flex items-start gap-3">
          {/* Checkbox Wrapper */}
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="checkbox"
              checked={checked}
              className={clsx(
                checkboxBaseStyles,
                checkboxVariantStyles,
                'appearance-none',
                className
              )}
              disabled={disabled}
              {...props}
            />
            {/* Check Icon */}
            {checked && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Check size={16} className="text-text-900" strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Label */}
          {label && (
            <label
              className={clsx(
                'text-sm font-medium cursor-pointer select-none',
                disabled ? 'text-text-600' : 'text-text-800'
              )}
            >
              {label}
            </label>
          )}
        </div>

        {/* Error Message */}
        {error && <p className="mt-1 text-sm text-error ml-8">{error}</p>}

        {/* Helper Text */}
        {!error && helperText && (
          <p className="mt-1 text-sm text-text-600 ml-8">{helperText}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
