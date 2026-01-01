/**
 * Skeleton Component
 * Loading placeholder with shimmer effect
 */

import clsx from 'clsx';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

const SkeletonItem = ({
  variant = 'text',
  width,
  height,
  className,
}: Omit<SkeletonProps, 'count'>) => {
  const baseStyles = 'animate-pulse bg-gradient-to-r from-black-700 via-black-600 to-black-700 bg-[length:200%_100%]';

  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={clsx(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  );
};

export const Skeleton = ({ count = 1, ...props }: SkeletonProps) => {
  if (count === 1) {
    return <SkeletonItem {...props} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} {...props} />
      ))}
    </div>
  );
};

export default Skeleton;
