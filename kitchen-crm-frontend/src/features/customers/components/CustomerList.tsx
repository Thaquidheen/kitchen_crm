/**
 * CustomerList
 * HOCH ERP redesign: one table card with integrated toolbar (live search + filters),
 * bulk-selection bar, avatar initials, stacked contact, semantic status pills,
 * Created column and a "Showing X of Y" footer with pagination.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/shared/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerFilters } from './CustomerFilters';
import { LeadSourceChips } from './LeadSourceChips';
import { formatLeadSources } from '../leadSource';
import { Eye, Edit, Trash2, Search, Filter, Columns3 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetCustomersPageQuery,
  useDeleteCustomerMutation,
} from '../customersAPI';
import type { Customer, CustomerListParams, CustomerStatus } from '../types';

export interface CustomerListProps {
  filters: CustomerListParams;
  onFiltersChange: (filters: CustomerListParams) => void;
  onResetFilters?: () => void;
  selectedCustomers: number[];
  onSelectionChange: (ids: number[]) => void;
  onBulkDelete?: () => void;
  onBulkStatusChange?: (status: CustomerStatus) => void;
}

// Status -> pill token (--st-*-bg/fg) + label
export const STATUS_PILL: Record<string, { st: string; label: string }> = {
  LEAD: { st: 'lead', label: 'Lead' },
  POTENTIAL: { st: 'potential', label: 'Potential' },
  DESIGN_STAGE: { st: 'design', label: 'Design Stage' },
  QUOTE_GIVEN: { st: 'quote', label: 'Quote Given' },
  FOLLOW_UP: { st: 'follow', label: 'Follow Up' },
  NEGOTIATIONS: { st: 'nego', label: 'Negotiation' },
  CONFIRMED: { st: 'confirmed', label: 'Confirmed' },
  LOST: { st: 'lost', label: 'Lost' },
};

const STATUS_OPTIONS: Array<{ value: CustomerStatus; label: string }> = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'POTENTIAL', label: 'Potential' },
  { value: 'DESIGN_STAGE', label: 'Design Stage' },
  { value: 'QUOTE_GIVEN', label: 'Quote Given' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
  { value: 'NEGOTIATIONS', label: 'Negotiations' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'LOST', label: 'Lost' },
];

const initialsOf = (name: string) =>
  name
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

const formatCreated = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

export function CustomerList({
  filters,
  onFiltersChange,
  onResetFilters,
  selectedCustomers,
  onSelectionChange,
  onBulkDelete,
  onBulkStatusChange,
}: CustomerListProps) {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: pageData, isLoading, error } = useGetCustomersPageQuery(filters);
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();

  const customers: Customer[] = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;
  const currentPage = filters.page ?? 0;

  // Live search (debounced 350ms)
  const [searchDraft, setSearchDraft] = useState(filters.search ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (searchDraft === (filters.search ?? '')) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchDraft || undefined, page: 0 });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);
  // Sync the draft when filters are reset from outside
  useEffect(() => {
    setSearchDraft(filters.search ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const handleSort = (field: string) => {
    const isCurrentField = filters.sortBy === field;
    const newDir = isCurrentField && filters.sortDir === 'asc' ? 'desc' : 'asc';
    onFiltersChange({ ...filters, sortBy: field, sortDir: newDir });
  };

  const sortArrow = (field: string) =>
    filters.sortBy === field ? (
      <span className="text-primary-600">{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : null;

  const isSelected = (id: number) => selectedCustomers.includes(id);
  const allSelected = customers.length > 0 && customers.every((c) => isSelected(c.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(selectedCustomers.filter((id) => !customers.some((c) => c.id === id)));
    } else {
      onSelectionChange([...new Set([...selectedCustomers, ...customers.map((c) => c.id)])]);
    }
  };
  const toggleSelect = (id: number) => {
    onSelectionChange(
      isSelected(id) ? selectedCustomers.filter((x) => x !== id) : [...selectedCustomers, id]
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCustomer(deleteId).unwrap();
      toast.success('Customer deleted successfully');
      setDeleteId(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete customer');
    }
  };

  const hasSelection = selectedCustomers.length > 0;

  // CSV export of the currently selected (loaded) rows
  const exportSelected = () => {
    const rows = customers.filter((c) => selectedCustomers.includes(c.id));
    if (rows.length === 0) {
      toast('Selected customers are not on this page');
      return;
    }
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
      ['Name', 'Phone', 'Email', 'Status', 'Lead sources', 'Place', 'Sqft', 'Created'].join(','),
      ...rows.map((c) =>
        [c.name, c.contact, c.email, c.status, formatLeadSources(c), c.place, c.sqft, formatCreated(c.createdAt)]
          .map(esc)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} customer(s)`);
  };

  if (error) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-[14px] p-6 text-center text-text-700">
        Failed to load customers
      </div>
    );
  }

  const thClass =
    'px-3 py-[9px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
      {/* Toolbar / bulk bar */}
      {!hasSelection ? (
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <div className="relative flex-1 max-w-[480px]">
            <Search
              size={15}
              className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none"
            />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Filter by name, phone, email, source…"
              className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
            />
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[10px] border text-[12.5px] font-medium transition-colors ${
              showFilters
                ? 'border-primary-600 text-primary-600'
                : 'border-background-500 text-text-700 hover:bg-background-700 hover:text-text-900'
            }`}
            style={
              showFilters
                ? { background: 'color-mix(in oklab, var(--color-primary-600) 12%, transparent)' }
                : { background: 'var(--color-background-800)' }
            }
          >
            <Filter size={13} />
            More Filters
          </button>
          <button
            title="Columns"
            onClick={() => toast('Column settings coming soon')}
            className="w-8 h-8 rounded-[10px] border border-background-500 bg-background-800 text-text-700 hover:bg-background-700 hover:text-text-900 flex items-center justify-center transition-colors"
          >
            <Columns3 size={14} />
          </button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2.5 px-3.5 py-3 flex-wrap"
          style={{ background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)' }}
        >
          <span className="text-[13px] font-[650] text-primary-600">
            {selectedCustomers.length} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={exportSelected}
            className="px-[11px] py-1.5 rounded-[9px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors whitespace-nowrap"
          >
            Export selected
          </button>
          {onBulkStatusChange && (
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onBulkStatusChange(e.target.value as CustomerStatus);
                  e.target.value = '';
                }
              }}
              className="h-[30px] px-2 rounded-[9px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] outline-none cursor-pointer"
            >
              <option value="" disabled>
                Set status…
              </option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
          {onBulkDelete && (
            <button
              onClick={onBulkDelete}
              className="px-[11px] py-1.5 rounded-[9px] text-[12.5px] font-semibold cursor-pointer border border-transparent"
              style={{ background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }}
            >
              Delete
            </button>
          )}
          <button
            onClick={() => onSelectionChange([])}
            className="px-[9px] py-1.5 rounded-[9px] text-[12.5px] font-medium text-text-700 hover:text-text-900 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Advanced filters (collapsible, inside the card) */}
      {showFilters && !hasSelection && (
        <div className="px-3.5 pb-3 border-b border-background-600">
          <CustomerFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            onReset={onResetFilters ?? (() => undefined)}
            hideSearch
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-t border-background-600 bg-background-700">
              <th className="w-11 pl-3.5 py-[9px]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-[15px] h-[15px] cursor-pointer align-middle"
                  style={{ accentColor: 'var(--color-primary-600)' }}
                />
              </th>
              <th className={thClass}>
                <button
                  onClick={() => handleSort('name')}
                  className="inline-flex items-center gap-1 uppercase tracking-[0.05em] hover:text-text-700 transition-colors"
                >
                  Name {sortArrow('name')}
                </button>
              </th>
              <th className={thClass}>Contact</th>
              <th className={thClass}>Lead source</th>
              <th className={thClass}>
                <button
                  onClick={() => handleSort('status')}
                  className="inline-flex items-center gap-1 uppercase tracking-[0.05em] hover:text-text-700 transition-colors"
                >
                  Status {sortArrow('status')}
                </button>
              </th>
              <th className={thClass}>
                <button
                  onClick={() => handleSort('createdAt')}
                  className="inline-flex items-center gap-1 uppercase tracking-[0.05em] hover:text-text-700 transition-colors"
                >
                  Created {sortArrow('createdAt')}
                </button>
              </th>
              <th className="px-3.5 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[110px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-background-600 animate-pulse">
                  <td className="pl-3.5 py-[13px]">
                    <div className="w-[15px] h-[15px] bg-background-600 rounded" />
                  </td>
                  <td className="px-3 py-[13px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-background-600 rounded-[9px]" />
                      <div className="h-4 bg-background-600 rounded w-32" />
                    </div>
                  </td>
                  <td className="px-3 py-[13px]"><div className="h-4 bg-background-600 rounded w-28" /></td>
                  <td className="px-3 py-[13px]"><div className="h-5 bg-background-600 rounded-full w-24" /></td>
                  <td className="px-3 py-[13px]"><div className="h-5 bg-background-600 rounded-full w-20" /></td>
                  <td className="px-3 py-[13px]"><div className="h-4 bg-background-600 rounded w-20" /></td>
                  <td className="px-3.5 py-[13px]"><div className="h-4 bg-background-600 rounded w-16 ml-auto" /></td>
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr className="border-t border-background-600">
                <td colSpan={7} className="px-5 py-14 text-center">
                  <div className="text-[14.5px] font-semibold text-text-900">No customers found</div>
                  <div className="text-[12.5px] text-text-700 mt-1">
                    Try a different search or clear the active filters.
                  </div>
                  {onResetFilters && (
                    <button
                      onClick={onResetFilters}
                      className="mt-3.5 px-[13px] py-[7px] rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
                const pill = STATUS_PILL[customer.status] ?? { st: 'lead', label: customer.status };
                const selected = isSelected(customer.id);
                return (
                  <tr
                    key={customer.id}
                    className="border-t border-background-600 hover:bg-background-700 transition-colors"
                    style={
                      selected
                        ? { background: 'color-mix(in oklab, var(--color-primary-600) 10%, transparent)' }
                        : undefined
                    }
                  >
                    <td className="pl-3.5 py-[13px]">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(customer.id)}
                        className="w-[15px] h-[15px] cursor-pointer align-middle"
                        style={{ accentColor: 'var(--color-primary-600)' }}
                      />
                    </td>
                    <td className="px-3 py-[13px]">
                      <button
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="flex items-center gap-2.5 min-w-0 text-left group"
                        title="Open customer"
                      >
                        <div className="w-8 h-8 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-[11px] font-[650] text-text-700 shrink-0">
                          {initialsOf(customer.name)}
                        </div>
                        <div className="text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-primary-600 transition-colors">
                          {customer.name}
                        </div>
                      </button>
                    </td>
                    <td className="px-3 py-[13px] min-w-0">
                      <div className="text-[13px] text-text-900 tabular-nums">{customer.contact || '—'}</div>
                      <div className="text-xs text-text-700 whitespace-nowrap overflow-hidden text-ellipsis">
                        {customer.email || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-[13px] max-w-[220px]">
                      <LeadSourceChips customer={customer} max={2} />
                    </td>
                    <td className="px-3 py-[13px]">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold"
                        style={{ background: `var(--st-${pill.st}-bg)`, color: `var(--st-${pill.st}-fg)` }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: `var(--st-${pill.st}-fg)` }}
                        />
                        {pill.label}
                      </span>
                    </td>
                    <td className="px-3 py-[13px] text-[12.5px] text-text-700 tabular-nums whitespace-nowrap">
                      {formatCreated(customer.createdAt)}
                    </td>
                    <td className="px-3.5 py-[13px]">
                      <div className="flex justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          title="View"
                          className="p-1.5"
                        >
                          <Eye className="h-[15px] w-[15px]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditCustomerId(customer.id)}
                          title="Edit"
                          className="p-1.5"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(customer.id)}
                          title="Delete"
                          className="p-1.5 text-error hover:text-error"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-3.5 py-[11px] border-t border-background-600">
        <span className="text-[12.5px] text-text-700">
          Showing {customers.length} of {totalElements} customers
        </span>
        <div className="flex-1" />
        <Pagination
          currentPage={currentPage + 1}
          totalPages={totalPages}
          onPageChange={(p) => onFiltersChange({ ...filters, page: p - 1 })}
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        type="danger"
      />

      {/* Edit Customer Modal */}
      <CustomerFormModal
        isOpen={editCustomerId !== null}
        onClose={() => setEditCustomerId(null)}
        customerId={editCustomerId || undefined}
      />
    </div>
  );
}

export default CustomerList;
