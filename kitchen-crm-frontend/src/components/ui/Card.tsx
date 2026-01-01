/**
 * Card Component
 * Reusable card with optional header, body, and footer
 */

import { type ReactNode } from 'react';
import clsx from 'clsx';

export interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  bordered?: boolean;
  onClick?: () => void;
}

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({
  children,
  className,
  noPadding = false,
  bordered = true,
  onClick,
}: CardProps) => {
  return (
    <div
      className={clsx(
        'gradient-card rounded-lg',
        bordered && 'border-2 border-background-600',
        !noPadding && 'p-6',
        onClick && 'cursor-pointer hover:border-primary-700 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className,
  actions,
}: CardHeaderProps) => {
  return (
    <div
      className={clsx(
        'flex items-center justify-between mb-4 pb-4 border-b border-background-600',
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export const CardBody = ({ children, className }: CardBodyProps) => {
  return <div className={clsx('', className)}>{children}</div>;
};

export const CardFooter = ({ children, className }: CardFooterProps) => {
  return (
    <div
      className={clsx(
        'mt-4 pt-4 border-t border-background-600 flex items-center justify-end gap-2',
        className
      )}
    >
      {children}
    </div>
  );
};

// Export all components
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
