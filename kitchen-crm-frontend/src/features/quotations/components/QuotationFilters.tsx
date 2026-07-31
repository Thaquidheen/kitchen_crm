/**
 * QuotationFilters Component
 * Search and filter controls for quotations list
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Search, Filter, X } from 'lucide-react';
import type { QuotationListParams, QuotationStatus } from '../types';

interface QuotationFiltersProps {
  filters: QuotationListParams;
  onFiltersChange: (filters: QuotationListParams) => void;
  onReset: () => void;
}

export function QuotationFilters({ filters, onFiltersChange, onReset }: QuotationFiltersProps) {
  const [localFilters, setLocalFilters] = useState<QuotationListParams>(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = () => {
    onFiltersChange({ ...localFilters, page: 0 });
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  const hasActiveFilters = !!(filters.customerName || filters.status);

  const statusOptions: Array<{ value: QuotationStatus; label: string }> = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SENT', label: 'Sent' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'REVISED', label: 'Revised' },
  ];

  const controlClass =
    'inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors';

  return (
    <div className="flex-1 min-w-0">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 min-w-0 sm:max-w-[420px]">
          <Search size={15} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name…"
            value={localFilters.customerName || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, customerName: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={handleApply} className={controlClass}>
            <Search className="h-3.5 w-3.5" />
            Search
          </button>

          <button type="button" onClick={() => setIsExpanded(!isExpanded)} className={controlClass}>
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isExpanded ? 'Hide' : 'More'} Filters</span>
            <span className="sm:hidden">Filters</span>
            {hasActiveFilters && !isExpanded && (
              <span className="ml-0.5 px-1.5 py-px rounded-full text-[10px] font-semibold bg-primary-600/15 text-primary-600 tabular-nums">
                {Object.keys(filters).filter((k) => (filters as any)[k]).length - 2}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] text-[12.5px] font-medium text-text-600 hover:text-text-900 hover:bg-background-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
          <div className="mt-3 pt-3 border-t border-background-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Status</label>
                <Select
                  value={localFilters.status || ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      status: e.target.value ? (e.target.value as QuotationStatus) : undefined,
                    })
                  }
                  options={[
                    { value: '', label: 'All Statuses' },
                    ...statusOptions.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Items Per Page</label>
                <Select
                  value={localFilters.size || 10}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, size: parseInt(e.target.value), page: 0 })
                  }
                  options={[
                    { value: 10, label: '10' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50' },
                    { value: 100, label: '100' },
                  ]}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={handleReset} className="w-full sm:w-auto">
                Reset All
              </Button>
              <Button variant="primary" size="sm" onClick={handleApply} className="w-full sm:w-auto">
                Apply Filters
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}

export default QuotationFilters;


