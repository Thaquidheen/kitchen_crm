/**
 * Spinner Component
 * Loading spinner with different sizes and variants
 */

import clsx from 'clsx';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'secondary' | 'white';

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

export const Spinner = ({
  size = 'md',
  variant = 'primary',
  className,
}: SpinnerProps) => {
  const sizeStyles = {
    xs: 'h-3 w-3 border-2',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
    xl: 'h-12 w-12 border-4',
  };

  const variantStyles = {
    primary: 'border-red-700 border-t-transparent',
    secondary: 'border-white-600 border-t-transparent',
    white: 'border-white-900 border-t-transparent',
  };

  return (
    <div
      className={clsx(
        'inline-block rounded-full animate-spin',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
