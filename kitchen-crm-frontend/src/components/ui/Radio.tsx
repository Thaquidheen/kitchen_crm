/**
 * Radio Component
 * Reusable radio button with label and validation
 */

import { type InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      error,
      helperText,
      className,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const radioBaseStyles =
      'w-5 h-5 bg-black-700 border-2 rounded-full cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black-900 disabled:opacity-50 disabled:cursor-not-allowed';

    const radioVariantStyles = hasError
      ? 'border-red-500 focus:ring-red-500'
      : checked
      ? 'border-red-700 focus:ring-red-700'
      : 'border-black-600 focus:ring-red-700 hover:border-red-700';

    return (
      <div className="flex flex-col">
        <div className="flex items-start gap-3">
          {/* Radio Wrapper */}
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="radio"
              checked={checked}
              className={clsx(
                radioBaseStyles,
                radioVariantStyles,
                'appearance-none',
                className
              )}
              disabled={disabled}
              {...props}
            />
            {/* Inner Circle */}
            {checked && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2.5 h-2.5 bg-red-700 rounded-full" />
              </div>
            )}
          </div>

          {/* Label */}
          {label && (
            <label
              className={clsx(
                'text-sm font-medium cursor-pointer select-none',
                disabled ? 'text-white-600' : 'text-white-800'
              )}
            >
              {label}
            </label>
          )}
        </div>

        {/* Error Message */}
        {error && <p className="mt-1 text-sm text-red-400 ml-8">{error}</p>}

        {/* Helper Text */}
        {!error && helperText && (
          <p className="mt-1 text-sm text-white-600 ml-8">{helperText}</p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
