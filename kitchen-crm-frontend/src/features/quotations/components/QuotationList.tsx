/**
 * QuotationList Component
 * Folder view (default): one row per quotation folder, expandable to show all versions.
 * List view: the classic flat table of every quotation.
 */

import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/shared/Pagination';
import SignatureStatusBadge from '@/components/quotations/SignatureStatusBadge';
import { Eye, Edit, Trash2, Folder, FolderOpen, ChevronRight, ChevronDown, Pencil, List as ListIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import type { QuotationFilters, QuotationSummary, QuotationFolderSummary } from '../types';
import { QuotationFilters as QuotationFiltersBar } from './QuotationFilters';
import {
  useGetQuotationsQuery,
  useDeleteQuotationMutation,
  useGetQuotationFoldersQuery,
  useGetFolderVersionsQuery,
  useRenameQuotationFolderMutation,
  useDeleteQuotationFolderMutation,
} from '@/app/baseApi';
import type { RootState } from '@/app/store';

export interface QuotationListProps {
  filters: QuotationFilters;
  onFiltersChange: (filters: QuotationFilters) => void;
  /** Restores the page's default filters; supplied by QuotationsPage. */
  onResetFilters?: () => void;
}

/**
 * A quotation is identified by its project name; the generated number stays as a
 * secondary reference. Quotations saved without a project name (everything created
 * before the name became the label) fall back to showing the number on its own.
 */
export const quotationLabel = (q: { projectName?: string; quotationNumber?: string }) => {
  const project = q.projectName?.trim();
  return {
    primary: project || q.quotationNumber || '—',
    secondary: project ? q.quotationNumber : undefined,
  };
};

export function QuotationList({ filters, onFiltersChange, onResetFilters }: QuotationListProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'folders' | 'all'>('folders');
  const [expandedFolderId, setExpandedFolderId] = useState<number | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<QuotationFolderSummary | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = currentUser?.role === 'ROLE_SUPER_ADMIN';

  // Flat list (classic view)
  const { data, isLoading, error } = useGetQuotationsQuery(filters, { skip: viewMode !== 'all' });
  // Folder view
  const { data: folderData, isLoading: foldersLoading, error: foldersError } = useGetQuotationFoldersQuery(
    { customerName: filters.customerName, page: filters.page ?? 0, size: filters.size ?? 10 },
    { skip: viewMode !== 'folders' }
  );
  const { data: versionsData, isFetching: versionsLoading } = useGetFolderVersionsQuery(expandedFolderId!, {
    skip: expandedFolderId == null,
  });

  const [deleteQuotation, { isLoading: isDeleting }] = useDeleteQuotationMutation();
  const [renameFolder, { isLoading: isRenaming }] = useRenameQuotationFolderMutation();
  const [deleteFolder, { isLoading: isDeletingFolder }] = useDeleteQuotationFolderMutation();

  const quotations: QuotationSummary[] = data?.content ?? [];
  const folders: QuotationFolderSummary[] = folderData?.content ?? [];
  const versions: QuotationSummary[] = versionsData ?? [];

  const totalPages = viewMode === 'folders' ? (folderData?.totalPages ?? 0) : (data?.totalPages ?? 0);
  const currentPage = filters.page ?? 0;

  const switchView = (mode: 'folders' | 'all') => {
    setViewMode(mode);
    setExpandedFolderId(null);
    onFiltersChange({ ...filters, page: 0 });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteQuotation(deleteId).unwrap();
      toast.success('Quotation deleted successfully');
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete quotation');
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameTarget.name.trim()) return;
    try {
      const res = await renameFolder({ id: renameTarget.id, name: renameTarget.name.trim() }).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Failed to rename folder');
        return;
      }
      toast.success('Folder renamed');
      setRenameTarget(null);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to rename folder');
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    try {
      const res = await deleteFolder(deleteFolderTarget.id).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Failed to delete folder');
        return;
      }
      toast.success('Folder and all its versions deleted');
      setDeleteFolderTarget(null);
      if (expandedFolderId === deleteFolderTarget.id) setExpandedFolderId(null);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete folder');
    }
  };

  const handleSort = (field: string) => {
    const isCurrentField = filters.sortBy === field;
    const newDir = isCurrentField && filters.sortDir === 'asc' ? 'desc' : 'asc';
    onFiltersChange({ ...filters, sortBy: field, sortDir: newDir });
  };

  const handlePageChange = (page: number) => {
    onFiltersChange({ ...filters, page });
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  // Design-only: semantic status pills (gray draft, blue sent, green approved,
  // red rejected, violet revised) using the shared --st-* tokens.
  const QSTATUS: Record<string, { st: string; label: string }> = {
    DRAFT: { st: 'draft', label: 'Draft' },
    SENT: { st: 'lead', label: 'Sent' },
    APPROVED: { st: 'confirmed', label: 'Approved' },
    REJECTED: { st: 'lost', label: 'Rejected' },
    REVISED: { st: 'design', label: 'Revised' },
    PENDING: { st: 'potential', label: 'Pending' },
  };
  const statusPill = (status?: string) => {
    const m = (status && QSTATUS[status]) || { st: '', label: status ?? '—' };
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
  const isOverdue = (d?: string) => !!d && new Date(d) < new Date(new Date().toDateString());

  // Shared with the customers/appliance tables so every list reads the same
  const thClass = 'px-3 py-[9px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';
  const thClassRight = 'px-3 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

  const initialsOf = (name?: string) =>
    (name ?? '')
      .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';

  const rowActions = (q: QuotationSummary) => (
    <div className="flex items-center justify-end gap-1 sm:gap-2">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/quotations/${q.id}`)} title="View" className="p-1 sm:p-2">
        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/quotations/${q.id}/edit`)}
        title="Edit"
        disabled={!(q.status === 'DRAFT' || (q.status as string) === 'PENDING')}
        className="p-1 sm:p-2"
      >
        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
      {isSuperAdmin && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteId(q.id)}
          title="Delete"
          className="p-1 sm:p-2 text-error hover:text-error"
        >
          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      )}
    </div>
  );

  if (viewMode === 'all' ? error : foldersError) {
    return (
      <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
        <div className="text-center text-text-700">
          <p>Failed to load quotations</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
      {/* Toolbar: view toggle + search/filters, all inside the card like the customers table */}
      <div className="flex items-start gap-2.5 px-3.5 py-3">
        <div className="inline-flex shrink-0 rounded-[10px] border border-background-500 bg-background-800 overflow-hidden shadow-sm">
          <button
            onClick={() => switchView('folders')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-[7px] text-[13px] font-medium transition-colors ${
              viewMode === 'folders'
                ? 'bg-primary-600/10 text-primary-600'
                : 'text-text-700 hover:bg-background-700 hover:text-text-900'
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            Folders
          </button>
          <div className="w-px self-stretch bg-background-500" />
          <button
            onClick={() => switchView('all')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-[7px] text-[13px] font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-primary-600/10 text-primary-600'
                : 'text-text-700 hover:bg-background-700 hover:text-text-900'
            }`}
          >
            <ListIcon className="h-3.5 w-3.5" />
            All Versions
          </button>
        </div>

        <QuotationFiltersBar
          filters={filters}
          onFiltersChange={onFiltersChange}
          onReset={onResetFilters ?? (() => onFiltersChange({ page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' } as QuotationFilters))}
        />
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          {viewMode === 'folders' ? (
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-t border-background-600 bg-background-700">
                  <th className={`${thClass} pl-3.5`}>Folder</th>
                  <th className={thClass}>Versions</th>
                  <th className={thClassRight}>Latest Amount</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} hidden md:table-cell`}>Date</th>
                  <th className={`${thClassRight} pr-3.5 w-24 sm:w-36`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-600">
                {foldersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-40 sm:w-56" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-10" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-20" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-6 bg-background-700 rounded w-16" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 hidden md:table-cell"><div className="h-4 bg-background-700 rounded w-24" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-16" /></td>
                    </tr>
                  ))
                ) : folders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 sm:py-12 text-center text-text-600 text-sm sm:text-base">
                      No quotation folders found
                    </td>
                  </tr>
                ) : (
                  folders.map((f) => {
                    const isExpanded = expandedFolderId === f.id;
                    return (
                      <Fragment key={`folder-${f.id}`}>
                        <tr
                          className="hover:bg-background-700 transition-colors cursor-pointer"
                          onClick={() => setExpandedFolderId(isExpanded ? null : f.id)}
                        >
                          <td className="px-2 sm:px-4 py-3 sm:py-4">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-primary-600 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-text-600 shrink-0" />
                              )}
                              {isExpanded ? (
                                <FolderOpen className="h-4 w-4 text-primary-600 shrink-0" />
                              ) : (
                                <Folder className="h-4 w-4 text-text-600 shrink-0" />
                              )}
                              <span className="text-text-900 font-medium text-xs sm:text-sm">{f.name}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-background-700 text-text-700">
                              {f.versionCount} {f.versionCount === 1 ? 'version' : 'versions'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 text-text-900 font-semibold text-xs sm:text-sm text-right tabular-nums whitespace-nowrap">
                            ₹{f.latestTotalAmount?.toLocaleString('en-IN') ?? '-'}
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4">
                            {f.latestStatus ? statusPill(f.latestStatus) : '-'}
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 text-text-700 text-xs sm:text-sm hidden md:table-cell">
                            {formatDate(f.latestCreatedAt)}
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRenameTarget({ id: f.id, name: f.name })}
                                title="Rename folder"
                                className="p-1 sm:p-2"
                              >
                                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              {isSuperAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteFolderTarget(f)}
                                  title="Delete folder (all versions)"
                                  className="p-1 sm:p-2 text-error hover:text-error"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          versionsLoading ? (
                            <tr key={`versions-loading-${f.id}`} className="bg-background-900/40">
                              <td colSpan={6} className="px-4 py-4 text-center text-text-600 text-xs sm:text-sm">
                                Loading versions...
                              </td>
                            </tr>
                          ) : (
                            versions.map((q) => (
                              <tr key={`version-${q.id}`} className="bg-background-900/40 hover:bg-background-700 transition-colors">
                                <td className="px-2 sm:px-4 py-2.5 sm:py-3">
                                  <div className="flex items-center gap-2 pl-8 sm:pl-10 min-w-0">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold bg-primary-600/15 text-primary-600 shrink-0">
                                      V{q.versionNumber ?? '?'}
                                    </span>
                                    {(() => {
                                      const { primary, secondary } = quotationLabel(q);
                                      return (
                                        <span className="min-w-0">
                                          <span className="block text-text-900 text-xs sm:text-sm truncate" title={primary}>
                                            {primary}
                                          </span>
                                          {secondary && (
                                            <span className="block text-text-500 text-[10px] sm:text-[11px] tabular-nums truncate">
                                              {secondary}
                                            </span>
                                          )}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </td>
                                <td className="px-2 sm:px-4 py-2.5 sm:py-3 text-text-600 text-xs sm:text-sm">
                                  {q.createdBy || '-'}
                                </td>
                                <td className="px-2 sm:px-4 py-2.5 sm:py-3 text-text-800 text-xs sm:text-sm text-right tabular-nums whitespace-nowrap">
                                  ₹{q.totalAmount?.toLocaleString('en-IN') ?? '-'}
                                </td>
                                <td className="px-2 sm:px-4 py-2.5 sm:py-3">
                                  {statusPill(q.status)}
                                </td>
                                <td className="px-2 sm:px-4 py-2.5 sm:py-3 text-text-700 text-xs sm:text-sm hidden md:table-cell">
                                  {formatDate(q.createdAt)}
                                </td>
                                <td className="px-2 sm:px-4 py-2.5 sm:py-3">{rowActions(q)}</td>
                              </tr>
                            ))
                          )
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-t border-background-600 bg-background-700">
                  <th className={`${thClass} pl-3.5`}>
                    <button onClick={() => handleSort('quotationNumber')} className="inline-flex items-center gap-1 uppercase tracking-[0.05em] hover:text-text-700 transition-colors">
                      Quotation
                      {filters.sortBy === 'quotationNumber' && (
                        <span className="text-primary-600">{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className={thClass}>Customer</th>
                  <th className={thClassRight}>Amount</th>
                  <th className={thClass}>
                    <button onClick={() => handleSort('status')} className="inline-flex items-center gap-1 uppercase tracking-[0.05em] hover:text-text-700 transition-colors">
                      Status
                      {filters.sortBy === 'status' && (
                        <span className="text-primary-600">{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className={`${thClass} hidden md:table-cell`}>
                    <button onClick={() => handleSort('createdAt')} className="inline-flex items-center gap-1 uppercase tracking-[0.05em] hover:text-text-700 transition-colors">
                      Date
                      {filters.sortBy === 'createdAt' && (
                        <span className="text-primary-600">{filters.sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className={`${thClass} hidden lg:table-cell`}>Valid till</th>
                  <th className={`${thClass} hidden sm:table-cell`}>Signature</th>
                  <th className={`${thClassRight} pr-3.5 w-20 sm:w-32`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-600">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-20 sm:w-24" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-32 sm:w-40" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-16 sm:w-20" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-6 bg-background-700 rounded w-16 sm:w-20" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 hidden md:table-cell"><div className="h-4 bg-background-700 rounded w-24 sm:w-28" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 hidden lg:table-cell"><div className="h-4 bg-background-700 rounded w-20" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 hidden sm:table-cell"><div className="h-6 bg-background-700 rounded w-16 sm:w-20" /></td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4"><div className="h-4 bg-background-700 rounded w-12 sm:w-16" /></td>
                    </tr>
                  ))
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 sm:py-12 text-center text-text-600 text-sm sm:text-base">
                      No quotations found
                    </td>
                  </tr>
                ) : (
                  quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-background-700 transition-colors">
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-text-900 font-semibold text-xs sm:text-sm">
                        {(() => {
                          const { primary, secondary } = quotationLabel(q);
                          return (
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="truncate tracking-tight" title={primary}>
                                  {primary}
                                </span>
                                {(q.versionNumber ?? 1) > 1 && (
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                                    style={{
                                      background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)',
                                      color: 'var(--color-primary-600)',
                                    }}
                                  >
                                    Rev {q.versionNumber}
                                  </span>
                                )}
                              </div>
                              {secondary && (
                                <div className="text-text-500 font-normal text-[11px] tabular-nums truncate">
                                  {secondary}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-[8px] bg-background-600 border border-background-500 flex items-center justify-center text-[10px] font-[650] text-text-700 shrink-0">
                            {initialsOf(q.customerName)}
                          </div>
                          <span className="text-text-900 whitespace-nowrap overflow-hidden text-ellipsis">{q.customerName}</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-text-900 font-semibold text-xs sm:text-sm text-right tabular-nums whitespace-nowrap">
                        ₹{q.totalAmount?.toLocaleString('en-IN') ?? '-'}
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        {statusPill(q.status)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-text-700 text-xs sm:text-sm hidden md:table-cell">
                        {formatDate(q.createdAt)}
                      </td>
                      <td
                        className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm hidden lg:table-cell tabular-nums whitespace-nowrap"
                        style={isOverdue(q.validUntil) ? { color: 'var(--st-lost-fg)' } : { color: 'var(--color-text-700)' }}
                      >
                        {q.validUntil ? formatDate(q.validUntil) : '—'}
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 hidden sm:table-cell">
                        <SignatureStatusBadge status={q.signatureStatus} />
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4">{rowActions(q)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="border-t border-background-600 px-2 sm:px-4 py-2 sm:py-3">
          <Pagination
            currentPage={currentPage + 1}
            totalPages={totalPages}
            onPageChange={(p) => handlePageChange(p - 1)}
          />
        </div>
      )}

      {/* Delete Quotation (single version) Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-800 p-6 rounded-lg max-w-md mx-4 border border-background-600">
            <h3 className="text-lg font-semibold text-text-900 mb-4">Delete Quotation</h3>
            <p className="text-text-600 mb-6">
              Are you sure you want to delete this quotation version? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Dialog */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-800 p-6 rounded-lg max-w-md w-full mx-4 border border-background-600">
            <h3 className="text-lg font-semibold text-text-900 mb-4">Rename Folder</h3>
            <input
              type="text"
              value={renameTarget.name}
              onChange={(e) => setRenameTarget({ ...renameTarget, name: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-background-700 border border-background-600 text-text-900 text-sm mb-6 focus:outline-none focus:border-primary-600"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setRenameTarget(null)} disabled={isRenaming}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRename} disabled={isRenaming || !renameTarget.name.trim()}>
                {isRenaming ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation Dialog */}
      {deleteFolderTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-800 p-6 rounded-lg max-w-md mx-4 border border-background-600">
            <h3 className="text-lg font-semibold text-text-900 mb-4">Delete Folder?</h3>
            <p className="text-text-600 mb-2">
              "{deleteFolderTarget.name}" contains {deleteFolderTarget.versionCount}{' '}
              {deleteFolderTarget.versionCount === 1 ? 'version' : 'versions'}.
            </p>
            <p className="text-error mb-6">
              Deleting the folder will delete ALL versions inside it. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteFolderTarget(null)} disabled={isDeletingFolder}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteFolder}
                disabled={isDeletingFolder}
              >
                {isDeletingFolder ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuotationList;
