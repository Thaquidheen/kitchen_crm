/**
 * CustomersPage
 * HOCH ERP redesign: title + count pill, clickable pipeline stage chips with a
 * proportional distribution bar (replaces the old KPI cards), and the customer
 * table card with integrated toolbar / bulk actions.
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  useDeleteCustomerMutation,
  useUpdateCustomerStatusMutation,
  useGetCustomerStatisticsQuery,
  customersAPI,
} from '@/features/customers/customersAPI';
import { CustomerList } from '@/features/customers/components/CustomerList';
import { CustomerFormModal } from '@/features/customers/components/CustomerFormModal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Plus, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CustomerListParams, CustomerStatus } from '@/features/customers/types';

// Pipeline stages: enum value -> status-token key (--st-*-bg/fg) + label + stats key
export const STAGE_META: Array<{
  status: CustomerStatus;
  st: string;
  label: string;
  statsKey: string;
}> = [
  { status: 'LEAD', st: 'lead', label: 'Leads', statsKey: 'lead' },
  { status: 'POTENTIAL', st: 'potential', label: 'Potential', statsKey: 'potential' },
  { status: 'DESIGN_STAGE', st: 'design', label: 'Design Stage', statsKey: 'design_stage' },
  { status: 'QUOTE_GIVEN', st: 'quote', label: 'Quote Given', statsKey: 'quote_given' },
  { status: 'FOLLOW_UP', st: 'follow', label: 'Follow Up', statsKey: 'follow_up' },
  { status: 'NEGOTIATIONS', st: 'nego', label: 'Negotiations', statsKey: 'negotiations' },
  { status: 'CONFIRMED', st: 'confirmed', label: 'Confirmed', statsKey: 'confirmed' },
  { status: 'LOST', st: 'lost', label: 'Lost', statsKey: 'lost' },
];

export function CustomersPage() {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState<CustomerListParams>({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkStatusChange, setBulkStatusChange] = useState<CustomerStatus | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const [deleteCustomer] = useDeleteCustomerMutation();
  const [updateStatus] = useUpdateCustomerStatusMutation();
  const { data: stats } = useGetCustomerStatisticsQuery();

  const total = stats?.total ?? 0;

  const handleResetFilters = () => {
    setFilters({ page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' });
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;
    try {
      await Promise.all(selectedCustomers.map((id) => deleteCustomer(id).unwrap()));
      toast.success(`${selectedCustomers.length} customer(s) deleted successfully`);
      setSelectedCustomers([]);
      setBulkDeleteConfirm(false);
    } catch (error) {
      toast.error('Failed to delete some customers');
      console.error(error);
    }
  };

  const handleBulkStatusChange = async (status: CustomerStatus) => {
    if (selectedCustomers.length === 0) return;
    try {
      await Promise.all(selectedCustomers.map((id) => updateStatus({ id, status }).unwrap()));
      toast.success(`${selectedCustomers.length} customer(s) status updated to ${status}`);
      setSelectedCustomers([]);
      setBulkStatusChange(null);
    } catch (error) {
      toast.error('Failed to update some customers');
      console.error(error);
    }
  };

  const activeStage = filters.status ?? 'all';
  const setStage = (status?: CustomerStatus) => {
    setFilters((prev) => ({ ...prev, status, page: 0 }));
    setSelectedCustomers([]);
  };

  const segments = STAGE_META.map((m) => ({ ...m, count: (stats?.[m.statsKey] as number) ?? 0 })).filter(
    (m) => m.count > 0
  );

  return (
    <div className="w-full max-w-[1440px] mx-auto">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Customers</h1>
            <span className="text-xs font-[650] px-[9px] py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
              {total}
            </span>
          </div>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            Track every customer from first lead to confirmed order.
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => toast.success('Export feature coming soon!')}>
            <Download className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast.success('Import feature coming soon!')}>
            <Upload className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsCustomerModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Pipeline stage chips */}
      <div className="flex gap-2 flex-wrap mb-2.5">
        <button
          onClick={() => setStage(undefined)}
          className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
          style={
            activeStage === 'all'
              ? {
                  borderColor: 'var(--color-primary-600)',
                  background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                }
              : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' }
          }
        >
          <span
            className={`text-[12.5px] whitespace-nowrap ${
              activeStage === 'all' ? 'font-semibold text-text-900' : 'font-medium text-text-700'
            }`}
          >
            All Customers
          </span>
          <span
            className={`text-[13px] font-[650] tabular-nums ${
              activeStage === 'all' ? 'text-primary-600' : 'text-text-900'
            }`}
          >
            {total}
          </span>
        </button>
        {STAGE_META.map((m) => {
          const count = (stats?.[m.statsKey] as number) ?? 0;
          const active = activeStage === m.status;
          return (
            <button
              key={m.status}
              onClick={() => setStage(m.status)}
              className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
              style={
                active
                  ? {
                      borderColor: 'var(--color-primary-600)',
                      background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                    }
                  : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' }
              }
            >
              <span
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{ background: `var(--st-${m.st}-fg)` }}
              />
              <span
                className={`text-[12.5px] whitespace-nowrap ${
                  active ? 'font-semibold text-text-900' : count === 0 ? 'font-medium text-text-500' : 'font-medium text-text-700'
                }`}
              >
                {m.label}
              </span>
              <span
                className={`text-[13px] font-[650] tabular-nums ${
                  active ? 'text-primary-600' : count === 0 ? 'text-text-500' : 'text-text-900'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stage distribution bar */}
      {total > 0 && segments.length > 0 && (
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mx-0.5 mb-5">
          {segments.map((m) => (
            <div
              key={m.status}
              title={`${m.label} · ${m.count}`}
              style={{ width: `${(m.count / total) * 100}%`, background: `var(--st-${m.st}-fg)` }}
            />
          ))}
        </div>
      )}

      {/* Table card */}
      <CustomerList
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={handleResetFilters}
        selectedCustomers={selectedCustomers}
        onSelectionChange={setSelectedCustomers}
        onBulkDelete={() => setBulkDeleteConfirm(true)}
        onBulkStatusChange={(s) => setBulkStatusChange(s)}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Customers"
        message={`Are you sure you want to delete ${selectedCustomers.length} customer(s)? This action cannot be undone.`}
        confirmText="Delete All"
        type="danger"
      />

      {/* Bulk Status Change Confirmation */}
      <ConfirmDialog
        isOpen={bulkStatusChange !== null}
        onClose={() => setBulkStatusChange(null)}
        onConfirm={() => bulkStatusChange && handleBulkStatusChange(bulkStatusChange)}
        title="Change Customer Status"
        message={`Are you sure you want to change the status of ${selectedCustomers.length} customer(s) to ${bulkStatusChange}?`}
        confirmText="Update Status"
        type="info"
      />

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={() => {
          dispatch(customersAPI.util.invalidateTags([{ type: 'Customers', id: 'PAGE' }]));
          setFilters((prev) => ({ ...prev, page: 0 }));
        }}
      />
    </div>
  );
}

export default CustomersPage;
