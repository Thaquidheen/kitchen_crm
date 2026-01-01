/**
 * CustomerList Component
 * Displays customers in a data table with actions
 */

import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  useGetCustomersPageQuery,
  useDeleteCustomerMutation,
  useUpdateCustomerStatusMutation,
  customersAPI,
} from '../customersAPI';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CustomerFormModal } from './CustomerFormModal';
import {
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Customer, CustomerStatus, CustomerListParams } from '../types';

interface CustomerListProps {
  filters: CustomerListParams;
  onFiltersChange: (filters: CustomerListParams) => void;
  selectedCustomers: number[];
  onSelectionChange: (selected: number[]) => void;
}

export function CustomerList({
  filters,
  onFiltersChange,
  selectedCustomers,
  onSelectionChange,
}: CustomerListProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusChangeId, setStatusChangeId] = useState<number | null>(null);
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);

  // Fetch customers with pagination
  const { data: pageData, isLoading, error } = useGetCustomersPageQuery(filters);
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();
  const [updateStatus] = useUpdateCustomerStatusMutation();

  const customers = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;
  const currentPage = filters.page ?? 0;

  // Handle sorting
  const handleSort = (field: string) => {
    const isCurrentField = filters.sortBy === field;
    const newDir = isCurrentField && filters.sortDir === 'asc' ? 'desc' : 'asc';
    onFiltersChange({ ...filters, sortBy: field, sortDir: newDir });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    onFiltersChange({ ...filters, page });
  };

  // Handle selection
  const toggleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(customers.map((c) => c.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedCustomers.includes(id)) {
      onSelectionChange(selectedCustomers.filter((cid) => cid !== id));
    } else {
      onSelectionChange([...selectedCustomers, id]);
    }
  };

  const isSelected = (id: number) => selectedCustomers.includes(id);
  const isAllSelected = customers.length > 0 && selectedCustomers.length === customers.length;

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteCustomer(deleteId).unwrap();
      toast.success('Customer deleted successfully');
      setDeleteId(null);
      // Clear from selection if selected
      if (selectedCustomers.includes(deleteId)) {
        onSelectionChange(selectedCustomers.filter((id) => id !== deleteId));
      }
    } catch (error) {
      toast.error('Failed to delete customer');
      console.error(error);
    }
  };

  // Handle status change
  const handleStatusChange = async (id: number, newStatus: CustomerStatus) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      toast.success('Customer status updated');
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  // Status badge variant mapping
  const getStatusVariant = (status: CustomerStatus): 'default' | 'info' | 'warning' | 'success' | 'danger' => {
    const map: Record<CustomerStatus, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
      LEAD: 'info',
      PROSPECT: 'warning',
      ACTIVE: 'success',
      COMPLETED: 'default',
      INACTIVE: 'danger',
    };
    return map[status] || 'default';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (error) {
    return (
      <Card className="p-6 bg-background-800 border-background-600">
        <div className="text-center text-text-700">
          <p>Failed to load customers</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-background-800 border-background-600 overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-700 text-primary-600">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="text-text-700 hover:text-text-900"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-text-900 font-semibold">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-primary-500 transition-colors"
                  >
                    Name
                    {filters.sortBy === 'name' && (
                      <span>{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-text-900 font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-text-900 font-semibold">Contact</th>
                <th className="px-4 py-3 text-left text-text-900 font-semibold">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-primary-500 transition-colors"
                  >
                    Status
                    {filters.sortBy === 'status' && (
                      <span>{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-text-900 font-semibold">Kitchen Types</th>
                <th className="px-4 py-3 text-left text-text-900 font-semibold">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center gap-1 hover:text-primary-500 transition-colors"
                  >
                    Created
                    {filters.sortBy === 'createdAt' && (
                      <span>{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-right w-32 text-text-900 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-600 bg-background-800">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 bg-background-600 rounded w-4" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-background-600 rounded w-32" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-background-600 rounded w-40" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-background-600 rounded w-24" /></td>
                    <td className="px-4 py-4"><div className="h-6 bg-background-600 rounded w-20" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-background-600 rounded w-28" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-background-600 rounded w-20" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-background-600 rounded w-16" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-600">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-background-700 transition-colors ${
                      isSelected(customer.id) ? 'bg-primary-900/10' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleSelect(customer.id)}
                        className="text-text-700 hover:text-text-900"
                      >
                        {isSelected(customer.id) ? (
                          <CheckSquare className="h-5 w-5 text-primary-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-text-900">{customer.name}</div>
                    </td>
                    <td className="px-4 py-4 text-text-800">{customer.email || '-'}</td>
                    <td className="px-4 py-4 text-text-800">{customer.contact || '-'}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={customer.status} variant={getStatusVariant(customer.status)} />
                    </td>
                    <td className="px-4 py-4 text-text-800">
                      {customer.kitchenTypes ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.kitchenTypes.split(',').slice(0, 2).map((type, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-background-600 text-text-900 rounded text-xs font-medium"
                            >
                              {type.trim()}
                            </span>
                          ))}
                          {customer.kitchenTypes.split(',').length > 2 && (
                            <span className="px-2 py-1 text-text-600 text-xs">
                              +{customer.kitchenTypes.split(',').length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-4 text-text-700 text-sm">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditCustomerId(customer.id)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(customer.id)}
                          title="Delete"
                          className="text-error hover:text-error/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-background-600 px-4 py-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalElements}
              itemsPerPage={filters.size ?? 10}
            />
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
      />

      {/* Edit Customer Modal */}
      <CustomerFormModal
        isOpen={editCustomerId !== null}
        onClose={() => setEditCustomerId(null)}
        customerId={editCustomerId || undefined}
        onSuccess={() => {
          setEditCustomerId(null);
          // Manually invalidate the cache to ensure the list refreshes
          dispatch(customersAPI.util.invalidateTags([{ type: 'Customers', id: 'PAGE' }]));
        }}
      />
    </>
  );
}

export default CustomerList;
