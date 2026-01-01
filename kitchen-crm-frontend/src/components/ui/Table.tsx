/**
 * Table Component
 * Data table with sorting, filtering, and pagination using TanStack Table
 */

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import Button from './Button';

export interface TableProps<TData> {
  data: TData[];
  columns: any[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
}

export function Table<TData>({
  data,
  columns,
  enableSorting = true,
  enableFiltering = false,
  enablePagination = true,
  pageSize = 10,
  className,
  emptyMessage = 'No data available',
}: TableProps<TData>) {
  const [sorting, setSorting] = useState<any[]>([]);
  const [columnFilters, setColumnFilters] = useState<any[]>([]);
  const [pagination, setPagination] = useState<{
    pageIndex: number;
    pageSize: number;
  }>({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: enableSorting ? sorting : undefined,
      columnFilters: enableFiltering ? columnFilters : undefined,
      pagination: enablePagination ? pagination : undefined,
    },
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    onPaginationChange: enablePagination ? setPagination : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
  });

  return (
    <div className={clsx('w-full', className)}>
      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border-2 border-background-600">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-background-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-sm font-semibold text-text-900"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={clsx(
                          'flex items-center gap-2',
                          header.column.getCanSort() && 'cursor-pointer select-none'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {enableSorting && header.column.getCanSort() && (
                          <span className="text-text-600">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp size={16} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronsUpDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Table Body */}
          <tbody className="bg-background-800 divide-y divide-background-600">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-background-700 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 text-sm text-text-800"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-text-600"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-text-700">
            Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              data.length
            )}{' '}
            of {data.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: table.getPageCount() }, (_, i) => i).map(
                (pageIndex) => (
                  <button
                    key={pageIndex}
                    onClick={() => table.setPageIndex(pageIndex)}
                    className={clsx(
                      'px-3 py-1 text-sm font-medium rounded transition-all',
                      pageIndex === table.getState().pagination.pageIndex
                        ? 'bg-primary-700 text-text-900'
                        : 'text-text-700 hover:bg-background-700'
                    )}
                  >
                    {pageIndex + 1}
                  </button>
                )
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
