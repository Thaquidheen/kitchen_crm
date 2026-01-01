/**
 * Pagination Component
 * Standalone pagination controls
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import Button from '../ui/Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  className?: string;
  totalItems?: number;
  itemsPerPage?: number;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxPageNumbers = 5,
  className,
}: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const halfMax = Math.floor(maxPageNumbers / 2);

    let startPage = Math.max(1, currentPage - halfMax);
    let endPage = Math.min(totalPages, currentPage + halfMax);

    if (currentPage - halfMax < 1) {
      endPage = Math.min(totalPages, maxPageNumbers);
    }
    if (currentPage + halfMax > totalPages) {
      startPage = Math.max(1, totalPages - maxPageNumbers + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={clsx('flex items-center justify-center gap-2', className)}>
      {/* Previous Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        leftIcon={<ChevronLeft size={16} />}
      >
        Previous
      </Button>

      {/* Page Numbers */}
      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-text-600">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded transition-all min-w-[2.5rem]',
                  isActive
                    ? 'bg-primary-700 text-text-900'
                    : 'text-text-700 hover:bg-background-700 hover:text-text-900'
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
      )}

      {/* Next Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        rightIcon={<ChevronRight size={16} />}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
