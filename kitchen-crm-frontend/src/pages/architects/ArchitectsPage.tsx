/**
 * ArchitectsPage
 * Architects and builders in the HOCH table idiom shared with the Customers module:
 * compact page header with a count pill, type filter chips with a distribution bar, then a
 * single table card with an inline search toolbar and a "showing x of y" footer.
 */

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/shared/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  useGetArchitectsQuery,
  useDeleteArchitectMutation,
  useMarkAsVisitedMutation,
} from '@/features/architects/architectsAPI';
import { Plus, Search, Trash2, Edit, CheckCircle, Calendar, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { partnerTypeLabel, partnerTypeOf } from '@/features/architects/types';
import type { Architect, PartnerType } from '@/features/architects/types';
import ArchitectFormModal from '@/features/architects/components/ArchitectFormModal';
import ArchitectVisitFormModal from '@/features/architects/components/ArchitectVisitFormModal';
import ArchitectVisitHistory from '@/features/architects/components/ArchitectVisitHistory';

/** Purple for architects, orange for builders — distinct from the green/red visit states. */
const TYPE_PILL: Record<PartnerType, { st: string; label: string }> = {
  ARCHITECT: { st: 'design', label: 'Architect' },
  BUILDER: { st: 'nego', label: 'Builder' },
};

const initialsOf = (name: string) =>
  name
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const thClass =
  'px-3 py-[9px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

const iconBtn =
  'w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors';

export function ArchitectsPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [visitStatusFilter, setVisitStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'' | PartnerType>('');
  const [sortBy, setSortBy] = useState<string>('architectureName');
  const [sortDir, setSortDir] = useState<string>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingArchitect, setEditingArchitect] = useState<Architect | null>(null);
  const [selectedArchitect, setSelectedArchitect] = useState<Architect | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Architect | null>(null);

  const { data, isLoading, error } = useGetArchitectsQuery({
    page,
    size: 10,
    sortBy,
    sortDir,
    visitStatus: visitStatusFilter || undefined,
    partnerType: typeFilter || undefined,
  });
  const [deleteArchitect, { isLoading: isDeleting }] = useDeleteArchitectMutation();
  const [markAsVisited] = useMarkAsVisitedMutation();

  const architects: Architect[] = data?.content || [];
  const totalElements: number = data?.totalElements || 0;
  const totalPages: number = data?.totalPages || 0;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteArchitect(deleteTarget.id).unwrap();
      toast.success(`${partnerTypeLabel(partnerTypeOf(deleteTarget))} deleted`);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete');
    }
  };

  const handleMarkAsVisited = async (architect: Architect) => {
    try {
      await markAsVisited(architect.id).unwrap();
      toast.success(`${architect.architectureName} marked as visited`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to mark as visited');
    }
  };

  // The type filter is applied server-side too; this keeps the chips honest for any row the
  // server returned before the param landed, and matches the existing client-side search.
  const typedArchitects = typeFilter
    ? architects.filter((a) => partnerTypeOf(a) === typeFilter)
    : architects;

  const filteredArchitects = searchTerm
    ? typedArchitects.filter(
        (a) =>
          a.architectureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.firm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.principalArchitectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : typedArchitects;

  // Counts come from the current page, so they describe what is on screen rather than the
  // whole table — the list endpoint returns no per-type totals.
  const architectCount = architects.filter((a) => partnerTypeOf(a) === 'ARCHITECT').length;
  const builderCount = architects.filter((a) => partnerTypeOf(a) === 'BUILDER').length;

  const chips: Array<{ key: '' | PartnerType; st?: string; label: string; count: number }> = [
    { key: '', label: 'All', count: architects.length },
    { key: 'ARCHITECT', st: 'design', label: 'Architects', count: architectCount },
    { key: 'BUILDER', st: 'nego', label: 'Builders', count: builderCount },
  ];

  const chipStyle = (active: boolean) =>
    active
      ? {
          borderColor: 'var(--color-primary-600)',
          background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
        }
      : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' };

  const selectCls =
    'h-[34px] px-2.5 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[12.5px] outline-none cursor-pointer focus:border-primary-600 transition-colors';

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">
              Architects &amp; Builders
            </h1>
            <span className="text-xs font-[650] px-[9px] py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
              {totalElements}
            </span>
          </div>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            Partners who refer customers — track firms, contacts and visits.
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => {
            setEditingArchitect(null);
            setIsModalOpen(true);
          }}
          className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
        >
          <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          Add {typeFilter ? partnerTypeLabel(typeFilter) : 'Architect'}
        </button>
      </div>

      {/* Type chips */}
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        {chips.map((c) => {
          const active = typeFilter === c.key;
          return (
            <button
              key={c.key || 'all'}
              onClick={() => {
                setTypeFilter(c.key);
                setPage(0);
              }}
              className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
              style={chipStyle(active)}
            >
              {c.st && (
                <span
                  className="w-[7px] h-[7px] rounded-full shrink-0"
                  style={{ background: `var(--st-${c.st}-fg)` }}
                />
              )}
              <span
                className={`text-[12.5px] whitespace-nowrap ${
                  active ? 'font-semibold text-text-900' : 'font-medium text-text-700'
                }`}
              >
                {c.label}
              </span>
              <span
                className={`text-[13px] font-[650] tabular-nums ${
                  active ? 'text-primary-600' : 'text-text-900'
                }`}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Distribution bar */}
      {architects.length > 0 && (
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mx-0.5 mb-5">
          {architectCount > 0 && (
            <div
              title={`Architects · ${architectCount}`}
              style={{
                width: `${(architectCount / architects.length) * 100}%`,
                background: 'var(--st-design-fg)',
              }}
            />
          )}
          {builderCount > 0 && (
            <div
              title={`Builders · ${builderCount}`}
              style={{
                width: `${(builderCount / architects.length) * 100}%`,
                background: 'var(--st-nego-fg)',
              }}
            />
          )}
        </div>
      )}

      {/* Table card */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-[480px]">
            <Search
              size={15}
              className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name, firm, contact…"
              className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
            />
          </div>
          <div className="flex-1" />
          <select
            value={visitStatusFilter}
            onChange={(e) => {
              setVisitStatusFilter(e.target.value);
              setPage(0);
            }}
            className={selectCls}
            aria-label="Visit status"
          >
            <option value="">All visits</option>
            <option value="VISITED">Visited</option>
            <option value="NOT_VISITED">Not visited</option>
          </select>
          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [by, dir] = e.target.value.split(':');
              setSortBy(by);
              setSortDir(dir);
              setPage(0);
            }}
            className={selectCls}
            aria-label="Sort"
          >
            <option value="architectureName:asc">Name A–Z</option>
            <option value="architectureName:desc">Name Z–A</option>
            <option value="lastVisitDate:desc">Recently visited</option>
            <option value="lastVisitDate:asc">Least recently visited</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={thClass}>Name</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Firm</th>
                <th className={thClass}>Contact</th>
                <th className={thClass}>Visits</th>
                <th className={thClass}>Last Visit</th>
                <th className="px-3.5 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[170px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-background-600 animate-pulse">
                    <td className="px-3 py-[13px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-background-600 rounded-[9px]" />
                        <div className="h-4 bg-background-600 rounded w-32" />
                      </div>
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-3 py-[13px]">
                        <div className="h-4 bg-background-600 rounded w-20" />
                      </td>
                    ))}
                    <td className="px-3.5 py-[13px]">
                      <div className="h-4 bg-background-600 rounded w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr className="border-t border-background-600">
                  <td colSpan={7} className="px-5 py-14 text-center text-[13px] text-text-700">
                    Failed to load architects
                  </td>
                </tr>
              ) : filteredArchitects.length === 0 ? (
                <tr className="border-t border-background-600">
                  <td colSpan={7} className="px-5 py-14 text-center">
                    {searchTerm || typeFilter || visitStatusFilter ? (
                      <>
                        <div className="text-[14.5px] font-semibold text-text-900">No matching records</div>
                        <div className="text-[12.5px] text-text-700 mt-1">
                          Nothing here for the current filters — try a different one or clear the search.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[14.5px] font-semibold text-text-900">No architects or builders yet</div>
                        <div className="text-[12.5px] text-text-700 mt-1">
                          Add your first one with the button above, or create one straight from a customer's lead source.
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filteredArchitects.map((architect) => {
                  const type = partnerTypeOf(architect);
                  const pill = TYPE_PILL[type];
                  const visits = architect.visitCount ?? 0;
                  return (
                    <tr
                      key={architect.id}
                      className="border-t border-background-600 hover:bg-background-700 transition-colors"
                    >
                      <td className="px-3 py-[13px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-[11px] font-[650] text-text-700 shrink-0">
                            {initialsOf(architect.architectureName)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis">
                              {architect.architectureName}
                            </div>
                            {architect.principalArchitectName && (
                              <div className="text-xs text-text-700 whitespace-nowrap overflow-hidden text-ellipsis">
                                {architect.principalArchitectName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-[13px]">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{
                            background: `var(--st-${pill.st}-bg)`,
                            color: `var(--st-${pill.st}-fg)`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: `var(--st-${pill.st}-fg)` }}
                          />
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-3 py-[13px] text-[13px] text-text-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                        {architect.firm || '—'}
                      </td>
                      <td className="px-3 py-[13px] text-[13px] text-text-900 tabular-nums whitespace-nowrap">
                        {architect.contactNumber || '—'}
                      </td>
                      <td className="px-3 py-[13px] text-[13px] text-text-800 tabular-nums whitespace-nowrap">
                        {visits > 0 ? `${visits} visit${visits !== 1 ? 's' : ''}` : '—'}
                      </td>
                      <td className="px-3 py-[13px] text-[12.5px] text-text-700 tabular-nums whitespace-nowrap">
                        {fmtDate(architect.lastVisitDate)}
                      </td>
                      <td className="px-3.5 py-[13px]">
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => handleMarkAsVisited(architect)}
                            title="Mark visited today"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: 'var(--st-confirmed-fg)' }}
                            onMouseEnter={(ev) => {
                              ev.currentTarget.style.background = 'var(--st-confirmed-bg)';
                            }}
                            onMouseLeave={(ev) => {
                              ev.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedArchitect(architect);
                              setIsVisitModalOpen(true);
                            }}
                            title="Record a visit"
                            className={iconBtn}
                          >
                            <Calendar size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedArchitect(architect);
                              setIsHistoryModalOpen(true);
                            }}
                            title="Visit history"
                            className={iconBtn}
                          >
                            <History size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingArchitect(architect);
                              setIsModalOpen(true);
                            }}
                            title="Edit"
                            className={iconBtn}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(architect)}
                            title="Delete"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 transition-colors"
                            onMouseEnter={(ev) => {
                              ev.currentTarget.style.background = 'var(--st-lost-bg)';
                              ev.currentTarget.style.color = 'var(--st-lost-fg)';
                            }}
                            onMouseLeave={(ev) => {
                              ev.currentTarget.style.background = 'transparent';
                              ev.currentTarget.style.color = '';
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
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
            Showing {filteredArchitects.length} of {totalElements}
          </span>
          <div className="flex-1" />
          <Pagination
            currentPage={page + 1}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p - 1)}
          />
        </div>
      </div>

      {/* Architect Form Modal */}
      {isModalOpen && (
        <ArchitectFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingArchitect(null);
          }}
          architect={editingArchitect}
          defaultType={typeFilter || 'ARCHITECT'}
        />
      )}

      {/* Visit Form Modal */}
      {isVisitModalOpen && selectedArchitect && (
        <ArchitectVisitFormModal
          isOpen={isVisitModalOpen}
          onClose={() => {
            setIsVisitModalOpen(false);
            setSelectedArchitect(null);
          }}
          architect={selectedArchitect}
        />
      )}

      {/* Visit History Modal */}
      {isHistoryModalOpen && selectedArchitect && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedArchitect(null);
          }}
          title={`Visit History — ${selectedArchitect.architectureName}`}
          size="lg"
        >
          <div className="max-h-[70vh] overflow-y-auto">
            <ArchitectVisitHistory architect={selectedArchitect} />
          </div>
        </Modal>
      )}

      {/* Delete confirmation — replaces the browser confirm() this page used to call */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.architectureName}? Their visit history goes with them, and any customer lead source linking to them will be left unlinked.`
            : ''
        }
        confirmText={isDeleting ? 'Deleting…' : 'Delete'}
        type="danger"
      />
    </div>
  );
}

export default ArchitectsPage;
