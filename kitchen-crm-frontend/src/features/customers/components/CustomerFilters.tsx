/**
 * CustomerFilters Component
 * Search and filter controls for customers list
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Search, Filter, X } from 'lucide-react';
import type { CustomerListParams, CustomerStatus } from '../types';

interface CustomerFiltersProps {
  filters: CustomerListParams;
  onFiltersChange: (filters: CustomerListParams) => void;
  onReset: () => void;
}

export function CustomerFilters({
  filters,
  onFiltersChange,
  onReset,
}: CustomerFiltersProps) {
  const [localFilters, setLocalFilters] = useState<CustomerListParams>(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = () => {
    onFiltersChange({ ...localFilters, page: 0 }); // Reset to first page when filtering
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  const hasActiveFilters = !!(
    filters.name ||
    filters.email ||
    filters.status
  );

  const statusOptions: Array<{ value: CustomerStatus; label: string }> = [
    { value: 'LEAD', label: 'Lead' },
    { value: 'POTENTIAL', label: 'Potential' },
    { value: 'DESIGN_STAGE', label: 'Design Stage' },
    { value: 'QUOTE_GIVEN', label: 'Quote Given' },
    { value: 'FOLLOW_UP', label: 'Follow Up' },
    { value: 'NEGOTIATIONS', label: 'Negotiations' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'LOST', label: 'Lost' },
  ];

  return (
    <Card className="p-4 sm:p-5 lg:p-6 bg-background-800 border-background-600 shadow-md">
      <div className="space-y-4 sm:space-y-5">
        {/* Quick Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-text-600" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={localFilters.name || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, name: e.target.value })
                }
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                className="pl-10 sm:pl-12 h-11 sm:h-12 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative flex-1 sm:flex-initial"
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isExpanded ? 'Hide' : 'More'} Filters</span>
              <span className="sm:hidden">Filters</span>
              {hasActiveFilters && !isExpanded && (
                <span className="absolute -top-1 -right-1 sm:static sm:ml-2 px-2 py-0.5 bg-primary-600 text-text-900 rounded-full text-xs font-semibold">
                  {Object.keys(filters).filter((k) => filters[k as keyof CustomerListParams]).length - 2}
                </span>
              )}
            </Button>

            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleApply}
              className="flex-1 sm:flex-initial shadow-md hover:shadow-lg transition-shadow"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>

            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="border border-background-600 hover:border-background-500"
              >
                <X className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="pt-4 sm:pt-5 border-t border-background-600 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* Email Filter */}
              <div>
                <label className="block text-sm font-semibold text-text-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Search by email..."
                  value={localFilters.email || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, email: e.target.value })
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                  className="h-11 sm:h-12"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-text-700 mb-2">
                  Status
                </label>
                <Select
                  value={localFilters.status || ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      status: e.target.value ? (e.target.value as CustomerStatus) : undefined,
                    })
                  }
                  className="h-11 sm:h-12"
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Items Per Page */}
              <div>
                <label className="block text-sm font-semibold text-text-700 mb-2">
                  Items Per Page
                </label>
                <Select
                  value={localFilters.size || 10}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      size: parseInt(e.target.value),
                      page: 0,
                    })
                  }
                  className="h-11 sm:h-12"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Select>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleReset}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Reset All
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleApply}
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default CustomerFilters;
