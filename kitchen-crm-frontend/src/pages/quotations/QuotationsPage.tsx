/**
 * QuotationsPage
 * Main quotations management page with list and filters
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QuotationFilters } from '@/features/quotations/components/QuotationFilters';
import { QuotationList } from '@/features/quotations/components/QuotationList';
import { QuotationStatistics } from '@/features/quotations/components/QuotationStatistics';
import { FileText, Plus } from 'lucide-react';
import type { QuotationListParams } from '@/features/quotations/types';

export function QuotationsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<QuotationListParams>({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const handleResetFilters = () => {
    setFilters({ page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' });
  };

  return (
    <div className="min-h-screen bg-background-900 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-900">Quotations</h1>
              <p className="text-xs sm:text-sm text-text-600 mt-1">Manage quotations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/quotations/new')}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Quotation</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-4 sm:mb-6">
        <QuotationStatistics />
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6">
        <QuotationFilters filters={filters} onFiltersChange={setFilters} onReset={handleResetFilters} />
      </div>

      {/* List */}
      <QuotationList filters={filters} onFiltersChange={setFilters} />
    </div>
  );
}

export default QuotationsPage;


