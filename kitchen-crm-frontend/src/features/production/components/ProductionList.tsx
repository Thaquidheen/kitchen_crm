/**
 * ProductionList Component
 * Displays list of production installations with filtering and actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useGetProductionInstallationsQuery } from '../productionAPI';
import type { ProductionFilters, InstallationStatus } from '../types';
import { INSTALLATION_STATUS_OPTIONS } from '../utils/productionUtils';
import { formatDate } from '../utils/productionUtils';
import { Eye, User, Calendar, TrendingUp } from 'lucide-react';

export interface ProductionListProps {
  customerId?: number;
  showFilters?: boolean;
}

export function ProductionList({ customerId, showFilters = true }: ProductionListProps) {
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<ProductionFilters>({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const { data: response, isLoading, error } = useGetProductionInstallationsQuery(filters);
  const data = response?.data;

  const columns = [
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }: { row: any }) => (
        <div>
          <p className="font-medium text-white-900">{row.original.customerName || `Customer #${row.original.customerId}`}</p>
          {row.original.customerId && (
            <p className="text-xs text-white-600">ID: {row.original.customerId}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'overallStatus',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <StatusBadge status={row.original.overallStatus} />
      ),
    },
    {
      accessorKey: 'projectManagerAssigned',
      header: 'Project Manager',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-white-600" />
          <span className="text-white-900">{row.original.projectManagerAssigned || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'installationTeamLead',
      header: 'Team Lead',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-white-600" />
          <span className="text-white-900">{row.original.installationTeamLead || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'overallProgressPercentage',
      header: 'Progress',
      cell: ({ row }: { row: any }) => {
        const progress = row.original.overallProgressPercentage || 0;
        return (
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-white-900">{progress}%</span>
            </div>
            <div className="w-full bg-black-700 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'estimatedCompletionDate',
      header: 'Est. Completion',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          {row.original.estimatedCompletionDate ? (
            <>
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-white-900">
                {formatDate(row.original.estimatedCompletionDate)}
              </span>
            </>
          ) : (
            <span className="text-white-600">Not set</span>
          )}
        </div>
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
            onClick={() => navigate(`/production/customer/${row.original.customerId}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleFilterChange = (field: keyof ProductionFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 0,
    }));
  };

  if (error) {
    return (
      <div className="p-6 bg-black-800 border border-black-600 rounded-lg">
        <p className="text-white-700">Failed to load production installations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-black-800 border border-black-600 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-white-700 mb-2">Status</label>
            <Select
              value={filters.status || ''}
              onChange={(e) =>
                handleFilterChange('status', e.target.value || undefined)
              }
            >
              <option value="">All Statuses</option>
              {INSTALLATION_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white-700 mb-2">Project Manager</label>
            <Input
              type="text"
              placeholder="Filter by PM..."
              value={filters.projectManager || ''}
              onChange={(e) => handleFilterChange('projectManager', e.target.value || undefined)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white-700 mb-2">Team Lead</label>
            <Input
              type="text"
              placeholder="Filter by team lead..."
              value={filters.teamLead || ''}
              onChange={(e) => handleFilterChange('teamLead', e.target.value || undefined)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white-700 mb-2">Customer</label>
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
        emptyMessage="No production installations found"
        isLoading={isLoading}
      />
    </div>
  );
}

export default ProductionList;







