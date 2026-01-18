/**
 * QuotationList Component
 * Displays quotations in a data table with actions
 */

import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/shared/StatusBadge';
import SignatureStatusBadge from '@/components/quotations/SignatureStatusBadge';
import { Eye, Edit } from 'lucide-react';
import type { QuotationFilters, QuotationSummary } from '../types';
import { useGetQuotationsQuery } from '@/app/baseApi';

export interface QuotationListProps {
  filters: QuotationFilters;
  onFiltersChange: (filters: QuotationFilters) => void;
}

// Status mapping is handled by StatusBadge internally

export function QuotationList({ filters, onFiltersChange }: QuotationListProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetQuotationsQuery(filters);

  const quotations: QuotationSummary[] = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const currentPage = filters.page ?? 0;

  const handleSort = (field: string) => {
    const isCurrentField = filters.sortBy === field;
    const newDir = isCurrentField && filters.sortDir === 'asc' ? 'desc' : 'asc';
    onFiltersChange({ ...filters, sortBy: field, sortDir: newDir });
  };

  const handlePageChange = (page: number) => {
    onFiltersChange({ ...filters, page });
  };

  if (error) {
    return (
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <div className="text-center text-text-700">
          <p>Failed to load quotations</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-background-800 border-background-600 overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="w-full">
            <thead className="bg-background-900 text-primary-600 sticky top-0 z-10">
              <tr>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">
                  <button onClick={() => handleSort('refNo')} className="flex items-center gap-1 hover:text-primary-500 transition-colors">
                    Ref No
                    {filters.sortBy === 'refNo' && (
                      <span className="text-xs">{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Customer</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Amount</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">
                  <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-primary-500 transition-colors">
                    Status
                    {filters.sortBy === 'status' && (
                      <span className="text-xs">{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden md:table-cell">
                  <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 hover:text-primary-500 transition-colors">
                    Created
                    {filters.sortBy === 'createdAt' && (
                      <span className="text-xs">{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden sm:table-cell">Signature</th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm w-20 sm:w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-600">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-20 sm:w-24" /></td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-32 sm:w-40" /></td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-16 sm:w-20" /></td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-6 bg-background-700 rounded w-16 sm:w-20" /></td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 hidden md:table-cell"><div className="h-4 bg-background-700 rounded w-24 sm:w-28" /></td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 hidden sm:table-cell"><div className="h-6 bg-background-700 rounded w-16 sm:w-20" /></td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-12 sm:w-16" /></td>
                  </tr>
                ))
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 sm:py-12 text-center text-text-600 text-sm sm:text-base">
                    No quotations found
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-background-700 transition-colors">
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-text-900 font-medium text-xs sm:text-sm">{q.quotationNumber}</td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-text-700 text-xs sm:text-sm">{q.customerName}</td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-text-700 text-xs sm:text-sm">₹{q.totalAmount?.toLocaleString('en-IN') ?? '-'}</td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4">
                      <StatusBadge status={q.status} className="inline-flex" />
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-text-700 text-xs sm:text-sm hidden md:table-cell">
                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 hidden sm:table-cell">
                      <SignatureStatusBadge status={q.signatureStatus} />
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/quotations/${q.id}`)} title="View" className="p-1 sm:p-2">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/quotations/${q.id}/edit`)} 
                          title="Edit"
                          disabled={!(q.status === 'DRAFT' || q.status === 'PENDING')}
                          className="p-1 sm:p-2"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="border-t border-background-600 px-2 sm:px-4 py-2 sm:py-3">
          <Pagination
            currentPage={currentPage + 1}
            totalPages={totalPages}
            onPageChange={(p) => handlePageChange(p - 1)}
          />
        </div>
      )}
    </Card>
  );
}

export default QuotationList;


