/**
 * ProjectList Component
 * Displays a list of projects with search, filters, and actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';
import { Table } from '@/components/ui/Table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Eye, Edit, Trash2, Filter } from 'lucide-react';
import { useGetProjectsQuery, useDeleteProjectMutation } from '../projectsAPI';
import { ProjectStatus, type ProjectFilters } from '../types';
import toast from 'react-hot-toast';

export interface ProjectListProps {
  customerId?: number;
  showFilters?: boolean;
}

export function ProjectList({ customerId, showFilters = true }: ProjectListProps) {
  const navigate = useNavigate();
  const currentTheme = useAppSelector(selectCurrentTheme);
  const [filters, setFilters] = useState<ProjectFilters>({
    customerId,
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const { data, isLoading, error } = useGetProjectsQuery(filters);
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const handleSearch = (searchTerm: string) => {
    setFilters({ ...filters, projectName: searchTerm, page: 0 });
  };

  const handleFilterChange = (field: keyof ProjectFilters, value: any) => {
    setFilters({ ...filters, [field]: value, page: 0 });
  };


  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteProject(id).unwrap();
      toast.success('Project deleted successfully');
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(error?.data?.message || 'Failed to delete project');
    }
  };

  const columns = [
    {
      accessorKey: 'projectName',
      header: 'Project Name',
      cell: ({ row }: { row: any }) => (
        <div
          className="font-medium break-words"
          style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
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
          className="break-words"
          style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}
        >
          {row.original.customerName}
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }: { row: any }) => (
        <div
          className="font-medium"
          style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
        >
          ₹{row.original.totalAmount?.toLocaleString('en-IN') ?? '0'}
        </div>
      ),
    },
    {
      accessorKey: 'balanceAmount',
      header: 'Balance',
      cell: ({ row }: { row: any }) => (
        <div
          className="font-medium"
          style={{
            color: row.original.balanceAmount > 0
              ? currentTheme?.colors?.warning || '#f59e0b'
              : currentTheme?.colors?.accent?.[500] || '#10b981'
          }}
        >
          ₹{row.original.balanceAmount?.toLocaleString('en-IN') ?? '0'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }: { row: any }) => (
        <div
          style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}
        >
          {row.original.startDate ? new Date(row.original.startDate).toLocaleDateString() : '-'}
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
            onClick={() => navigate(`/projects/${row.original.id}`)}
            className="min-w-[32px] h-8"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${row.original.id}/edit`)}
            className="min-w-[32px] h-8"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            disabled={isDeleting}
            className="min-w-[32px] h-8"
          >
            <Trash2
              className="h-4 w-4"
              style={{ color: currentTheme?.colors?.error || '#dc2626' }}
            />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: `${currentTheme?.colors?.error || '#dc2626'}20`,
          borderColor: currentTheme?.colors?.error || '#dc2626'
        }}
      >
        <p style={{ color: currentTheme?.colors?.error || '#dc2626' }}>
          Failed to load projects
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-lg"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
            borderColor: currentTheme?.colors?.background?.[600] || '#374151'
          }}
        >
          <div className="flex-1 w-full sm:w-auto">
            <Input
              placeholder="Search projects..."
              value={filters.projectName || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <Select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="w-full sm:w-auto min-w-[160px]"
            options={[
              { value: '', label: 'All Statuses' },
              { value: ProjectStatus.ACTIVE, label: 'Active' },
              { value: ProjectStatus.IN_PROGRESS, label: 'In Progress' },
              { value: ProjectStatus.COMPLETED, label: 'Completed' },
              { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
              { value: ProjectStatus.CANCELLED, label: 'Cancelled' },
            ]}
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setFilters({
                customerId,
                page: 0,
                size: 10,
                sortBy: 'createdAt',
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

      <div className="w-full overflow-x-auto">
        <Table
          columns={columns}
          data={data?.content || []}
          enableSorting={true}
          enablePagination={true}
          pageSize={filters.size || 10}
          emptyMessage="No projects found"
        />
      </div>
    </div>
  );
}

export default ProjectList;
