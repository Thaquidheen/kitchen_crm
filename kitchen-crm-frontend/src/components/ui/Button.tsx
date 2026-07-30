/**
 * Button Component
 * HOCH ERP style: flat, 10px radius, 1px borders, no gradients/glows/scale effects.
 */

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-[10px] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-primary-600 text-[var(--on-accent)] font-semibold hover:brightness-105 active:brightness-95 border border-transparent',
    secondary:
      'bg-background-800 border border-background-500 text-text-900 font-medium hover:bg-background-700 active:bg-background-600',
    danger:
      'bg-error text-white font-semibold hover:brightness-105 active:brightness-95 border border-transparent',
    ghost:
      'bg-transparent text-text-700 font-medium hover:bg-background-700 hover:text-text-900 active:bg-background-600 border border-transparent',
    outline:
      'bg-transparent border border-background-500 text-text-700 font-medium hover:bg-background-700 hover:text-text-900 active:bg-background-600',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-[7px] text-[13px] gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-sm gap-2 min-h-[38px]',
    lg: 'px-5 py-2.5 text-[15px] gap-2.5 min-h-[44px]',
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], widthStyles, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span className="whitespace-nowrap">{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
