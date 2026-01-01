/**
 * QuotationFilters Component
 * Search and filter controls for quotations list
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

  return (
    <Card className="p-3 sm:p-4 bg-background-800 border-background-600">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-600" />
              <Input
                type="text"
                placeholder="Search by customer name..."
                value={localFilters.customerName || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, customerName: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="flex-1 sm:flex-none">
              <Filter className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{isExpanded ? 'Hide' : 'More'} Filters</span>
              <span className="sm:hidden">{isExpanded ? 'Hide' : 'Filters'}</span>
              {hasActiveFilters && !isExpanded && (
                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-primary-600 text-text-900 rounded-full text-xs">
                  {Object.keys(filters).filter((k) => (filters as any)[k]).length - 2}
                </span>
              )}
            </Button>

            <Button variant="primary" size="sm" onClick={handleApply} className="flex-1 sm:flex-none">
              <Search className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="flex-1 sm:flex-none">
                <X className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="pt-3 sm:pt-4 border-t border-background-600">
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

            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-end gap-2">
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
    </Card>
  );
}

export default QuotationFilters;


