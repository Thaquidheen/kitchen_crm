/**
 * PaymentList Component
 * Displays list of payments with filters and actions
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '@/components/ui/Table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Eye, Edit, Trash2, Filter } from 'lucide-react';
import { useGetPaymentsQuery, useDeletePaymentMutation } from '../paymentApi';
import { PaymentMethod, PaymentStatus, type PaymentFilters } from '../types';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';

export interface PaymentListProps {
  projectId?: number;
  showFilters?: boolean;
}

export function PaymentList({ projectId, showFilters = true }: PaymentListProps) {
  const navigate = useNavigate();
  const currentTheme = useAppSelector(selectCurrentTheme);
  const [filters, setFilters] = useState<PaymentFilters>({
    projectId,
    page: 0,
    size: 10,
    sortBy: 'paymentDate',
    sortDir: 'desc',
  });

  const { data, isLoading, error } = useGetPaymentsQuery(filters);
  const [deletePayment, { isLoading: isDeleting }] = useDeletePaymentMutation();

  // Dynamic colors based on theme
  const themeColors = useMemo(() => {
    if (!currentTheme?.colors) {
      return {
        success: '#10B981',
        info: '#3B82F6',
        primary: '#8B5CF6',
        warning: '#F59E0B',
        error: '#EF4444',
        text: '#FFFFFF',
        background: '#12121A',
      };
    }
    return {
      success: currentTheme.colors.semantic.success,
      info: currentTheme.colors.semantic.info,
      primary: currentTheme.colors.primary[500],
      warning: currentTheme.colors.semantic.warning,
      error: currentTheme.colors.semantic.error,
      text: currentTheme.colors.text[900],
      background: currentTheme.colors.background[800],
    };
  }, [currentTheme]);

  const handleFilterChange = (field: keyof PaymentFilters, value: any) => {
    setFilters({ ...filters, [field]: value, page: 0 });
  };


  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    try {
      await deletePayment(id).unwrap();
      toast.success('Payment deleted successfully');
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      toast.error(error?.data?.message || 'Failed to delete payment');
    }
  };

  const getMethodBadgeColor = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return themeColors.success;
      case PaymentMethod.ACCOUNT_TRANSFER:
      case PaymentMethod.NEFT:
      case PaymentMethod.RTGS:
        return themeColors.info;
      case PaymentMethod.UPI:
        return themeColors.primary;
      case PaymentMethod.CHEQUE:
        return themeColors.warning;
      case PaymentMethod.CARD:
        return '#EC4899'; // Pink - keep as fallback
      default:
        return currentTheme?.colors?.background?.[500] || '#3A3A45';
    }
  };

  const columns = [
    {
      accessorKey: 'paymentDate',
      header: 'Payment Date',
      cell: ({ row }: { row: any }) => (
        <div 
          className="font-medium text-xs sm:text-sm"
          style={{ color: themeColors.text }}
        >
          {new Date(row.original.paymentDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: 'projectName',
      header: 'Project',
      cell: ({ row }: { row: any }) => (
        <div 
          className="text-xs sm:text-sm"
          style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
        >
          {row.original.projectName}
        </div>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }: { row: any }) => (
        <div 
          className="text-xs sm:text-sm"
          style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
        >
          {row.original.customerName}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: { row: any }) => (
        <div 
          className="font-bold text-xs sm:text-sm"
          style={{ color: themeColors.success }}
        >
          ₹{row.original.amount?.toLocaleString('en-IN') ?? '0'}
        </div>
      ),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Method',
      cell: ({ row }: { row: any }) => (
        <span
          className="px-2 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: getMethodBadgeColor(row.original.paymentMethod),
            color: '#FFFFFF'
          }}
        >
          {row.original.paymentMethod.replace('_', ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Status',
      cell: ({ row }: { row: any }) => <StatusBadge status={row.original.paymentStatus} />,
    },
    {
      accessorKey: 'referenceNumber',
      header: 'Reference',
      cell: ({ row }: { row: any }) => (
        <div 
          className="text-xs sm:text-sm"
          style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
        >
          {row.original.referenceNumber || '-'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/payments/${row.original.id}`)}
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            disabled={isDeleting}
          >
            <Trash2 
              className="h-3 w-3 sm:h-4 sm:w-4" 
              style={{ color: themeColors.error }}
            />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div 
        className="p-3 sm:p-4 rounded-lg border"
        style={{
          backgroundColor: `${themeColors.error}33`,
          borderColor: `${themeColors.error}80`
        }}
      >
        <p 
          className="text-xs sm:text-sm"
          style={{ color: themeColors.error }}
        >
          Failed to load payments
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {showFilters && (
        <div 
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
            borderColor: currentTheme?.colors?.background?.[600] || '#252530'
          }}
        >
          <div className="flex-1 w-full sm:w-auto">
            <Input
              placeholder="Search by project name..."
              value={filters.projectName || ''}
              onChange={(e) => handleFilterChange('projectName', e.target.value)}
            />
          </div>

          <Select
            value={filters.paymentMethod || ''}
            onChange={(e) =>
              handleFilterChange('paymentMethod', e.target.value || undefined)
            }
            options={[
              { value: '', label: 'All Methods' },
              { value: PaymentMethod.CASH, label: 'Cash' },
              { value: PaymentMethod.ACCOUNT_TRANSFER, label: 'Account Transfer' },
              { value: PaymentMethod.UPI, label: 'UPI' },
              { value: PaymentMethod.CHEQUE, label: 'Cheque' },
              { value: PaymentMethod.CARD, label: 'Card' },
              { value: PaymentMethod.NEFT, label: 'NEFT' },
              { value: PaymentMethod.RTGS, label: 'RTGS' },
            ]}
            className="w-full sm:w-auto"
          />

          <Select
            value={filters.paymentStatus || ''}
            onChange={(e) =>
              handleFilterChange('paymentStatus', e.target.value || undefined)
            }
            options={[
              { value: '', label: 'All Statuses' },
              { value: PaymentStatus.PENDING, label: 'Pending' },
              { value: PaymentStatus.COMPLETED, label: 'Completed' },
              { value: PaymentStatus.FAILED, label: 'Failed' },
              { value: PaymentStatus.REFUNDED, label: 'Refunded' },
            ]}
            className="w-full sm:w-auto"
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setFilters({
                projectId,
                page: 0,
                size: 10,
                sortBy: 'paymentDate',
                sortDir: 'desc',
              })
            }
            className="w-full sm:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      )}

      <Table
        columns={columns}
        data={data?.content || []}
        enableSorting={true}
        enablePagination={true}
        pageSize={filters.size || 10}
        emptyMessage="No payments found"
      />
    </div>
  );
}

export default PaymentList;
