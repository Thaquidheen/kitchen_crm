/**
 * Input Component
 * Reusable input field with validation states and icons
 */

import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import clsx from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const inputBaseStyles =
      'px-4 py-3 bg-background-700 border rounded-lg text-text-900 placeholder:text-text-600 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

    const inputVariantStyles = hasError
      ? 'border-error focus:border-error focus:ring-error'
      : 'border-background-600 focus:border-primary-700 focus:ring-primary-700';

    const widthStyles = fullWidth ? 'w-full' : '';

    const withIconsStyles = {
      left: leftIcon ? 'pl-10' : '',
      right: rightIcon ? 'pr-10' : '',
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
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-600">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            className={clsx(
              inputBaseStyles,
              inputVariantStyles,
              widthStyles,
              withIconsStyles.left,
              withIconsStyles.right,
              className
            )}
            disabled={disabled}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-600">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';

export default Input;
