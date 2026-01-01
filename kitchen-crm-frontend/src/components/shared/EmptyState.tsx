/**
 * EmptyState Component
 * Display when no data is available
 */

import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import clsx from 'clsx';
import Button from '../ui/Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="text-text-600 mb-4">
        {icon || <Inbox size={64} />}
      </div>
      <h3 className="text-xl font-semibold text-text-900 mb-2">{title}</h3>
      {description && (
        <p className="text-text-700 text-center max-w-md mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} leftIcon={action.icon}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
