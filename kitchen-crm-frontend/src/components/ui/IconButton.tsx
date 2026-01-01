/**
 * IconButton Component
 * Icon-only button for compact actions
 * Enhanced with better styling and hover effects
 */

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

export type IconButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}: IconButtonProps) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-900 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeBasedTransform = {
    sm: 'transform hover:scale-105 active:scale-95 disabled:transform-none',
    md: 'transform hover:scale-110 active:scale-95 disabled:transform-none',
    lg: 'transform hover:scale-110 active:scale-95 disabled:transform-none',
  };

  const variantStyles = {
    primary:
      size === 'sm'
        ? 'bg-primary-700 hover:bg-primary-600 text-white shadow-md shadow-primary-700/30 hover:shadow-lg hover:shadow-primary-600/40 focus:ring-primary-500 active:bg-primary-800 border border-primary-600/30'
        : 'bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-600 hover:to-primary-500 text-white shadow-lg shadow-primary-700/40 hover:shadow-xl hover:shadow-primary-600/50 focus:ring-primary-500 active:from-primary-800 active:to-primary-700 border border-primary-500/20',
    secondary:
      size === 'sm'
        ? 'bg-background-700 border border-primary-600/40 hover:bg-background-600 hover:border-primary-500 text-text-900 shadow-sm shadow-background-900/20 hover:shadow-md focus:ring-primary-500 active:bg-background-800'
        : 'bg-background-700 border border-primary-600/50 hover:bg-background-600 hover:border-primary-500 text-text-900 shadow-md shadow-background-900/30 hover:shadow-lg focus:ring-primary-500 active:bg-background-800',
    danger:
      size === 'sm'
        ? 'bg-error hover:bg-error/90 text-white shadow-md shadow-error/30 hover:shadow-lg hover:shadow-error/40 focus:ring-error active:bg-error/80 border border-error/30'
        : 'bg-gradient-to-r from-error to-error/90 hover:from-error/90 hover:to-error/80 text-white shadow-lg shadow-error/40 hover:shadow-xl hover:shadow-error/50 focus:ring-error active:from-error/80 active:to-error/70 border border-error/20',
    ghost:
      size === 'sm'
        ? 'bg-transparent hover:bg-background-700/80 text-text-900 border border-background-600/40 hover:border-primary-600/40 focus:ring-primary-500 active:bg-background-800'
        : 'bg-transparent hover:bg-background-700/80 text-text-900 border border-background-600/50 hover:border-primary-600/50 focus:ring-primary-500 active:bg-background-800 shadow-sm hover:shadow-md',
    outline:
      size === 'sm'
        ? 'bg-transparent border border-background-600 hover:bg-background-800/50 text-text-700 hover:text-text-900 focus:ring-primary-500 active:bg-background-800'
        : 'bg-transparent border-2 border-background-600 hover:bg-background-800/50 text-text-700 hover:text-text-900 focus:ring-primary-500 active:bg-background-800 shadow-sm hover:shadow-md',
  };

  const sizeStyles = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5',
  };

  const iconSizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], sizeBasedTransform[size], className)}
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
        <span className={iconSizeStyles[size]}>{icon}</span>
      )}
    </button>
  );
};

export default IconButton;

