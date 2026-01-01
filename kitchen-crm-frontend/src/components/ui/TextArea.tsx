/**
 * TextArea Component
 * Reusable textarea field with validation states
 */

import { type TextareaHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  resize?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      resize = true,
      className,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;

    const textareaBaseStyles =
      'px-4 py-3 bg-background-700 border rounded-lg text-text-900 placeholder:text-text-600 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

    const textareaVariantStyles = hasError
      ? 'border-error focus:border-error focus:ring-error'
      : 'border-background-600 focus:border-primary-700 focus:ring-primary-700';

    const widthStyles = fullWidth ? 'w-full' : '';
    const resizeStyles = resize ? 'resize-y' : 'resize-none';

    return (
      <div className={clsx(fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label className="block text-text-800 text-sm font-medium mb-2">
            {label}
          </label>
        )}

        {/* TextArea Field */}
        <textarea
          ref={ref}
          rows={rows}
          className={clsx(
            textareaBaseStyles,
            textareaVariantStyles,
            widthStyles,
            resizeStyles,
            className
          )}
          disabled={disabled}
          {...props}
        />

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

TextArea.displayName = 'TextArea';

export default TextArea;
