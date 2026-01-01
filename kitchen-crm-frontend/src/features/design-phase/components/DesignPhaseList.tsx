/**
 * DesignPhaseList Component
 * Displays list of design phases with filtering and actions
 */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { useNavigate } from 'react-router-dom';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useGetDesignPhasesQuery } from '../designPhaseApi';
import { type DesignPhaseFilters, DesignStatus } from '../types';
import { DESIGN_STATUS_OPTIONS } from '../utils/designPhaseUtils';
import { Eye, Edit, Calendar, User } from 'lucide-react';

export interface DesignPhaseListProps {
  customerId?: number;
  showFilters?: boolean;
  initialStatus?: DesignStatus;
  onRefresh?: () => void;
}

export function DesignPhaseList({ customerId, showFilters = true, initialStatus, onRefresh }: DesignPhaseListProps) {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isStaff = currentUser?.role === 'ROLE_STAFF';
  
  const [filters, setFilters] = useState<DesignPhaseFilters>({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
    designStatus: initialStatus,
    // Auto-filter by assigned staff if user is staff
    staffAssignedId: isStaff ? currentUser?.id : undefined,
  });

  // Update filters when user changes
  useEffect(() => {
    if (isStaff && currentUser?.id) {
      setFilters(prev => ({
        ...prev,
        staffAssignedId: currentUser.id,
      }));
    }
  }, [isStaff, currentUser?.id]);

  const { data: response, isLoading, error } = useGetDesignPhasesQuery(filters);
  const data = response?.data;

  const columns = [
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }: { row: any }) => (
        <div>
          <p className="font-medium text-text-900">{row.original.customerName}</p>
          {row.original.quotationNumber && (
            <p className="text-xs text-text-600">Quote: {row.original.quotationNumber}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'designStatus',
      header: 'Status',
      cell: ({ row }: { row: any }) => <StatusBadge status={row.original.designStatus} />,
    },
    {
      accessorKey: 'staffAssignedName',
      header: 'Assigned Staff',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-text-600" />
          <span className="text-text-900">{row.original.staffAssignedName || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'designCompletionPercentage',
      header: 'Progress',
      cell: ({ row }: { row: any }) => (
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-text-900">{row.original.designCompletionPercentage}%</span>
          </div>
          <div className="w-full bg-background-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${row.original.designCompletionPercentage}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'meetingScheduled',
      header: 'Next Meeting',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          {row.original.meetingScheduled ? (
            <>
              <Calendar className="h-4 w-4 text-primary-500" />
              <span className="text-text-900">
                {new Date(row.original.meetingScheduled).toLocaleDateString()}
              </span>
            </>
          ) : (
            <span className="text-text-600">Not scheduled</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'revisionCount',
      header: 'Revisions',
      cell: ({ row }: { row: any }) => (
        <span
          className={`font-medium ${
            row.original.revisionCount > 2 ? 'text-primary-500' : 'text-text-900'
          }`}
        >
          {row.original.revisionCount}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/design-phase/customer/${row.original.customerId}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/design-phase/customer/${row.original.customerId}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleFilterChange = (field: keyof DesignPhaseFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 0,
    }));
  };


  if (error) {
    return (
      <div className="p-6 bg-background-800 border border-background-600 rounded-lg">
        <p className="text-text-700">Failed to load design phases</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background-800 border border-background-600 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">Status</label>
            <Select
              value={filters.designStatus || ''}
              onChange={(e) =>
                handleFilterChange('designStatus', e.target.value || undefined)
              }
            >
              <option value="">All Statuses</option>
              {DESIGN_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">Customer</label>
            <Input
              type="text"
              placeholder="Filter by customer..."
              value={filters.customerName || ''}
              onChange={(e) => handleFilterChange('customerName', e.target.value || undefined)}
            />
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={data?.content || []}
        enableSorting={true}
        enablePagination={true}
        pageSize={filters.size || 10}
        emptyMessage="No design phases found"
      />
    </div>
  );
}

export default DesignPhaseList;
