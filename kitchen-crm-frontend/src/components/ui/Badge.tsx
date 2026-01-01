/**
 * Badge Component
 * Status badges with different variants and sizes
 */

import { type ReactNode } from 'react';
import clsx from 'clsx';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
}

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
}: BadgeProps) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 font-semibold rounded-full transition-all';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const variantStyles = {
    default: 'bg-background-700 text-text-900 border border-background-600',
    primary: 'bg-primary-700 text-text-900',
    success: 'bg-success text-text-900',
    warning: 'bg-warning text-text-900',
    danger: 'bg-error text-text-900',
    info: 'bg-info text-text-900',
  };

  const dotStyles = {
    default: 'bg-text-900',
    primary: 'bg-text-900',
    success: 'bg-text-900',
    warning: 'bg-text-900',
    danger: 'bg-text-900',
    info: 'bg-text-900',
  };

  return (
    <span
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', dotStyles[variant])}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
