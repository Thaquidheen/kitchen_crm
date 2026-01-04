/**
 * CustomersPage
 * Main customers management page with list, filters, and bulk operations
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useDeleteCustomerMutation,
  useUpdateCustomerStatusMutation,
  customersAPI,
} from '@/features/customers/customersAPI';
import { CustomerStatistics } from '@/features/customers/components/CustomerStatistics';
import { CustomerFilters } from '@/features/customers/components/CustomerFilters';
import { CustomerList } from '@/features/customers/components/CustomerList';
import { CustomerFormModal } from '@/features/customers/components/CustomerFormModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle,
  Download,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { CustomerListParams, CustomerStatus, Customer } from '@/features/customers/types';

export function CustomersPage() {
  const navigate = useNavigate();
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

  const handleResetFilters = () => {
    setFilters({
      page: 0,
      size: 10,
      sortBy: 'createdAt',
      sortDir: 'desc',
    });
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;

    try {
      const deletePromises = selectedCustomers.map((id) =>
        deleteCustomer(id).unwrap()
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedCustomers.length} customer(s) deleted successfully`);
      setSelectedCustomers([]);
      setBulkDeleteConfirm(false);
    } catch (error) {
      toast.error('Failed to delete some customers');
      console.error(error);
    }
  };

  // Bulk status change
  const handleBulkStatusChange = async (status: CustomerStatus) => {
    if (selectedCustomers.length === 0) return;

    try {
      const updatePromises = selectedCustomers.map((id) =>
        updateStatus({ id, status }).unwrap()
      );
      await Promise.all(updatePromises);
      toast.success(`${selectedCustomers.length} customer(s) status updated to ${status}`);
      setSelectedCustomers([]);
      setBulkStatusChange(null);
    } catch (error) {
      toast.error('Failed to update some customers');
      console.error(error);
    }
  };

  const hasSelection = selectedCustomers.length > 0;

  return (
    <div className="min-h-screen bg-background-900 p-2 sm:p-3 lg:p-4">
      <div className="w-full space-y-3 sm:space-y-4 lg:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-background-700">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-primary-600/10 rounded-lg sm:rounded-xl">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-900">Customers</h1>
              <p className="text-xs sm:text-sm text-text-600 mt-1">
                Manage your customer database
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // TODO: Implement export
                  toast.success('Export feature coming soon!');
                }}
                className="flex-1 sm:flex-initial"
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // TODO: Implement import
                  toast.success('Import feature coming soon!');
                }}
                className="flex-1 sm:flex-initial"
              >
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCustomerModalOpen(true)}
              className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div>
          <CustomerStatistics />
        </div>

        {/* Bulk Actions Bar */}
        {hasSelection && (
          <Card className="p-4 sm:p-5 bg-primary-900/20 border-primary-700 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-primary-600/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary-600" />
                </div>
                <span className="text-text-900 font-semibold text-sm sm:text-base">
                  {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Bulk Status Change */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <span className="text-xs sm:text-sm text-text-700 font-medium sm:mr-2 whitespace-nowrap">Change Status:</span>
                  <div className="flex flex-wrap gap-2">
                    {(['LEAD', 'POTENTIAL', 'PLANNING', 'CONFIRMED'] as CustomerStatus[]).map(
                      (status) => (
                        <Button
                          key={status}
                          variant="ghost"
                          size="sm"
                          onClick={() => setBulkStatusChange(status)}
                          className="text-xs px-3 py-1.5 border border-background-600 hover:border-primary-500 hover:bg-primary-500/10 transition-all"
                        >
                          {status}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div className="hidden sm:block h-6 w-px bg-background-600 mx-2" />

                {/* Bulk Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setBulkDeleteConfirm(true)}
                    className="flex-1 sm:flex-initial"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomers([])}
                    className="border border-background-600 hover:border-background-500"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <div>
          <CustomerFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Customer List */}
        <CustomerList
          filters={filters}
          onFiltersChange={setFilters}
          selectedCustomers={selectedCustomers}
          onSelectionChange={setSelectedCustomers}
        />
      </div>

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
        onSuccess={(customer: Customer) => {
          // Manually invalidate the cache to ensure the list refreshes
          dispatch(customersAPI.util.invalidateTags([{ type: 'Customers', id: 'PAGE' }]));
          // Also reset to first page to show the new customer
          setFilters(prev => ({ ...prev, page: 0 }));
        }}
      />
    </div>
  );
}

export default CustomersPage;
