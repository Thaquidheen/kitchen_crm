/**
 * FilterPanel Component
 * Collapsible filter panel with multiple filter options
 */

import { useState, type ReactNode } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import Button from '../ui/Button';

export interface FilterPanelProps {
  children: ReactNode;
  title?: string;
  onClear?: () => void;
  initiallyOpen?: boolean;
  className?: string;
}

export const FilterPanel = ({
  children,
  title = 'Filters',
  onClear,
  initiallyOpen = false,
  className,
}: FilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <div
      className={clsx(
        'gradient-card rounded-lg border-2 border-background-600',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b-2 border-background-600 flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-text-900 font-semibold hover:text-primary-700 transition-colors"
        >
          <Filter size={18} />
          {title}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {onClear && (
          <Button size="sm" variant="ghost" onClick={onClear} leftIcon={<X size={16} />}>
            Clear
          </Button>
        )}
      </div>

      {/* Filter Content */}
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
};

export default FilterPanel;
