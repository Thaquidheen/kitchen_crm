/**
 * ProjectList Component
 * HOCH ERP design: token-styled cells (avatars, dot status pills, tabular amounts).
 * Functionality unchanged: search, status filter, clear, sorting, pagination, actions.
 * Filters can be controlled from the page (for the status chips) or kept internal
 * when embedded elsewhere.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '@/components/ui/Table';
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
  /** Optional controlled filters (used by ProjectsPage so the status chips drive the list) */
  filters?: ProjectFilters;
  onFiltersChange?: (filters: ProjectFilters) => void;
}

// Status -> semantic pill token + label
const PSTATUS: Record<string, { st: string; label: string }> = {
  ACTIVE: { st: 'lead', label: 'Active' },
  IN_PROGRESS: { st: 'design', label: 'In Progress' },
  COMPLETED: { st: 'confirmed', label: 'Completed' },
  ON_HOLD: { st: 'potential', label: 'On Hold' },
  CANCELLED: { st: 'lost', label: 'Cancelled' },
};

const initialsOf = (name?: string) =>
  (name ?? '')
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

export function ProjectList({
  customerId,
  showFilters = true,
  filters: controlledFilters,
  onFiltersChange,
}: ProjectListProps) {
  const navigate = useNavigate();
  const [internalFilters, setInternalFilters] = useState<ProjectFilters>({
    customerId,
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  const filters = controlledFilters ?? internalFilters;
  const setFilters = onFiltersChange ?? setInternalFilters;

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

  const statusPill = (status?: string) => {
    const m = (status && PSTATUS[status]) || { st: '', label: status ?? '—' };
    const fg = m.st ? `var(--st-${m.st}-fg)` : 'var(--color-text-700)';
    const bg = m.st ? `var(--st-${m.st}-bg)` : 'var(--color-background-700)';
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
        style={{ background: bg, color: fg }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: fg }} />
        {m.label}
      </span>
    );
  };

  const columns = [
    {
      accessorKey: 'projectName',
      header: 'Project',
      cell: ({ row }: { row: any }) => (
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-text-900 break-words">{row.original.projectName}</div>
          {row.original.quotationNumber && (
            <div className="text-xs text-text-700 tabular-nums mt-0.5">{row.original.quotationNumber}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-[8px] bg-background-600 border border-background-500 flex items-center justify-center text-[10px] font-[650] text-text-700 shrink-0">
            {initialsOf(row.original.customerName)}
          </div>
          <span className="text-[13px] text-text-900 whitespace-nowrap overflow-hidden text-ellipsis">
            {row.original.customerName || '—'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }: { row: any }) => (
        <div className="text-[13px] font-semibold text-text-900 text-right tabular-nums whitespace-nowrap">
          ₹{row.original.totalAmount?.toLocaleString('en-IN') ?? '0'}
        </div>
      ),
    },
    {
      accessorKey: 'balanceAmount',
      header: 'Balance',
      cell: ({ row }: { row: any }) => (
        <div
          className="text-[13px] font-semibold text-right tabular-nums whitespace-nowrap"
          style={{
            color: row.original.balanceAmount > 0 ? 'var(--st-potential-fg)' : 'var(--st-confirmed-fg)',
          }}
        >
          ₹{row.original.balanceAmount?.toLocaleString('en-IN') ?? '0'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => statusPill(row.original.status),
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }: { row: any }) => (
        <div className="text-[12.5px] text-text-700 tabular-nums whitespace-nowrap">
          {row.original.startDate
            ? new Date(row.original.startDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${row.original.id}`)}
            title="View"
            className="p-1.5"
          >
            <Eye className="h-[15px] w-[15px]" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${row.original.id}/edit`)}
            title="Edit"
            className="p-1.5"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            disabled={isDeleting}
            title="Delete"
            className="p-1.5 text-error hover:text-error"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div
        className="p-4 rounded-[12px] border text-center"
        style={{ background: 'var(--st-lost-bg)', borderColor: 'var(--st-lost-fg)', color: 'var(--st-lost-fg)' }}
      >
        Failed to load projects
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showFilters && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 sm:max-w-[480px]">
            <Input
              placeholder="Filter by project name…"
              value={filters.projectName || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 hidden sm:block" />
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
            ]}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setFilters({ customerId, page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' })
            }
            className="w-full sm:w-auto"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
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
      {isLoading && <p className="text-[12.5px] text-text-600 px-1">Loading projects…</p>}
    </div>
  );
}

export default ProjectList;
