/**
 * VerticalButton Component
 * Button with icon above text (vertical layout)
 * Perfect for action buttons like Date Range, Export, Refresh, Settings
 */

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

export type VerticalButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type VerticalButtonSize = 'sm' | 'md' | 'lg';

export interface VerticalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VerticalButtonVariant;
  size?: VerticalButtonSize;
  isLoading?: boolean;
  icon: ReactNode;
  label: string;
  fullWidth?: boolean;
}

export const VerticalButton = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  label,
  fullWidth = false,
  className,
  disabled,
  ...props
}: VerticalButtonProps) => {
  const baseStyles =
    'inline-flex flex-col items-center justify-center rounded-xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-900 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none';

  const variantStyles = {
    primary:
      'bg-gradient-to-b from-primary-700 to-primary-600 hover:from-primary-600 hover:to-primary-500 text-white shadow-lg shadow-primary-700/40 hover:shadow-xl hover:shadow-primary-600/50 focus:ring-primary-500 active:from-primary-800 active:to-primary-700 border border-primary-500/20',
    secondary:
      'bg-background-800 border-2 border-background-600/50 hover:bg-background-700 hover:border-primary-600/50 text-text-900 shadow-md shadow-background-900/30 hover:shadow-lg focus:ring-primary-500 active:bg-background-800',
    danger:
      'bg-gradient-to-b from-error to-error/90 hover:from-error/90 hover:to-error/80 text-white shadow-lg shadow-error/40 hover:shadow-xl hover:shadow-error/50 focus:ring-error active:from-error/80 active:to-error/70 border border-error/20',
    ghost:
      'bg-transparent hover:bg-background-700/80 text-text-900 border border-background-600/50 hover:border-primary-600/50 focus:ring-primary-500 active:bg-background-800 shadow-sm hover:shadow-md',
    outline:
      'bg-transparent border-2 border-background-600 hover:bg-background-800/50 text-text-700 hover:text-text-900 focus:ring-primary-500 active:bg-background-800 shadow-sm hover:shadow-md',
  };

  const sizeStyles = {
    sm: 'px-3 py-3 gap-1.5 min-w-[80px]',
    md: 'px-4 py-4 gap-2 min-w-[100px]',
    lg: 'px-5 py-5 gap-2.5 min-w-[120px]',
  };

  const iconSizeStyles = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  };

  const textSizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyles,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className={clsx('animate-spin', iconSizeStyles[size])}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <span className={clsx('flex-shrink-0', iconSizeStyles[size])}>{icon}</span>
      )}
      <span className={clsx('font-medium whitespace-nowrap', textSizeStyles[size])}>
        {label}
      </span>
    </button>
  );
};

export default VerticalButton;

