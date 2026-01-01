/**
 * Switch Component
 * Toggle switch with label and validation
 */

import { type InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  labelPosition?: 'left' | 'right';
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      error,
      helperText,
      labelPosition = 'right',
      className,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const switchBaseStyles =
      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const switchVariantStyles = hasError
      ? 'bg-red-500 focus:ring-red-500'
      : checked
      ? 'bg-red-700 focus:ring-red-700'
      : 'bg-black-600 focus:ring-red-700';

    const knobStyles = clsx(
      'inline-block h-4 w-4 transform rounded-full bg-white-900 transition-transform',
      checked ? 'translate-x-6' : 'translate-x-1'
    );

    const LabelComponent = label && (
      <label
        className={clsx(
          'text-sm font-medium cursor-pointer select-none',
          disabled ? 'text-white-600' : 'text-white-800'
        )}
      >
        {label}
      </label>
    );

    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          {/* Label Left */}
          {labelPosition === 'left' && LabelComponent}

          {/* Switch Wrapper */}
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              checked={checked}
              className="sr-only peer"
              disabled={disabled}
              {...props}
            />
            <div
              className={clsx(switchBaseStyles, switchVariantStyles, className)}
            >
              <span className={knobStyles} />
            </div>
          </div>

          {/* Label Right */}
          {labelPosition === 'right' && LabelComponent}
        </div>

        {/* Error Message */}
        {error && (
          <p
            className={clsx(
              'mt-1 text-sm text-red-400',
              labelPosition === 'left' ? 'ml-14' : ''
            )}
          >
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p
            className={clsx(
              'mt-1 text-sm text-white-600',
              labelPosition === 'left' ? 'ml-14' : ''
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
