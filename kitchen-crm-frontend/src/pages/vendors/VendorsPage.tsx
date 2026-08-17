/**
 * VendorsPage
 * Vendors in the HOCH table idiom shared with the Customers and Architects modules: compact
 * header with a count pill, type filter chips with a distribution bar, then a single table card
 * with an inline debounced search toolbar and a "showing x of y" footer.
 *
 * Everything is server-side (search / type / active / sort / page) — the old page searched only
 * the 10 rows of the current page. Delete is a soft delete, so the list defaults to active-only
 * with an explicit toggle for the rest; before, deleted vendors reappeared forever with a badge.
 */

import { useEffect, useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  useGetVendorsQuery,
  useDeleteVendorMutation,
  vendorTypeLabel,
  VENDOR_TYPES,
} from '@/features/vendors/vendorsAPI';
import type { Vendor, VendorType } from '@/features/vendors/vendorsAPI';
import VendorFormModal from '@/features/vendors/components/VendorFormModal';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

/** Reuse existing --st-* keys, as ArchitectsPage does — no new colour tokens. */
const TYPE_PILL: Record<VendorType, { st: string }> = {
  MATERIAL_SUPPLIER: { st: 'design' },
  LABOR_CONTRACTOR: { st: 'nego' },
  TRANSPORT_SERVICE: { st: 'follow' },
  APPLIANCE_VENDOR: { st: 'quote' },
  OTHER: { st: 'draft' },
};

const initialsOf = (name: string) =>
  name
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

const selectCls =
  'h-[34px] px-2.5 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[12.5px] outline-none cursor-pointer focus:border-primary-600 transition-colors';

/** Keep in sync with the header row below — the empty/error rows span every column. */
const COL_COUNT = 7;

export function VendorsPage() {
  const [page, setPage] = useState(0);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | VendorType>('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [sortBy, setSortBy] = useState('vendorName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);

  // Debounce the search into the server param, resetting to the first page (CustomerList idiom).
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchDraft.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchDraft]);

  const { data, isLoading, error } = useGetVendorsQuery({
    page,
    size: 10,
    sortBy,
    sortDir,
    search: search || undefined,
    vendorType: typeFilter || undefined,
    active: activeFilter === 'all' ? undefined : activeFilter === 'active',
  });

  // Deleting the last row of the last page leaves the page index past the end — walk back.
  useEffect(() => {
    if (data && page > 0 && page >= data.totalPages) {
      setPage(Math.max(0, data.totalPages - 1));
    }
  }, [data, page]);
  const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();

  const vendors: Vendor[] = data?.content || [];
  const totalElements: number = data?.totalElements || 0;
  const totalPages: number = data?.totalPages || 0;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVendor(deleteTarget.id).unwrap();
      toast.success(`${deleteTarget.vendorName} deactivated`);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete');
    }
  };

  // Counts describe the rows on screen (the endpoint returns no per-type totals) — same
  // honest-chips approach as ArchitectsPage.
  const countOf = (t: VendorType) => vendors.filter((v) => v.vendorType === t).length;
  const chips: Array<{ key: '' | VendorType; st?: string; label: string; count: number }> = [
    { key: '', label: 'All', count: vendors.length },
    ...VENDOR_TYPES.map((t) => ({
      key: t as '' | VendorType,
      st: TYPE_PILL[t].st,
      label: vendorTypeLabel(t),
      count: countOf(t),
    })),
  ];

  const chipStyle = (active: boolean) =>
    active
      ? {
          borderColor: 'var(--color-primary-600)',
          background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
        }
      : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' };

  const hasFilters = !!(search || typeFilter || activeFilter !== 'active');

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Vendors</h1>
            <span className="text-xs font-[650] px-[9px] py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
              {totalElements}
            </span>
          </div>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            Suppliers, contractors and service providers you buy from.
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => {
            setEditingVendor(null);
            setIsModalOpen(true);
          }}
          className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
        >
          <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          Add Vendor
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
      {vendors.length > 0 && (
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mx-0.5 mb-5">
          {VENDOR_TYPES.filter((t) => countOf(t) > 0).map((t) => (
            <div
              key={t}
              title={`${vendorTypeLabel(t)} · ${countOf(t)}`}
              style={{
                width: `${(countOf(t) / vendors.length) * 100}%`,
                background: `var(--st-${TYPE_PILL[t].st}-fg)`,
              }}
            />
          ))}
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
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search name, contact, phone, email…"
              className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
            />
          </div>
          <div className="flex-1" />
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as typeof activeFilter);
              setPage(0);
            }}
            className={selectCls}
            aria-label="Active filter"
          >
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
            <option value="all">All vendors</option>
          </select>
          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [by, dir] = e.target.value.split(':');
              setSortBy(by);
              setSortDir(dir as 'asc' | 'desc');
              setPage(0);
            }}
            className={selectCls}
            aria-label="Sort"
          >
            <option value="vendorName:asc">Name A–Z</option>
            <option value="vendorName:desc">Name Z–A</option>
            <option value="vendorType:asc">Type</option>
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={thClass}>Name</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Added</th>
                <th className="px-3.5 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[110px]">
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
                    {Array.from({ length: COL_COUNT - 2 }).map((_, j) => (
                      <td key={j} className="px-3 py-[13px]">
                        <div className="h-4 bg-background-600 rounded w-20" />
                      </td>
                    ))}
                    <td className="px-3.5 py-[13px]">
                      <div className="h-4 bg-background-600 rounded w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr className="border-t border-background-600">
                  <td colSpan={COL_COUNT} className="px-5 py-14 text-center text-[13px] text-text-700">
                    Failed to load vendors — check the connection and try again.
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr className="border-t border-background-600">
                  <td colSpan={COL_COUNT} className="px-5 py-14 text-center">
                    {hasFilters ? (
                      <>
                        <div className="text-[14.5px] font-semibold text-text-900">No matching vendors</div>
                        <div className="text-[12.5px] text-text-700 mt-1">
                          Nothing here for the current filters — try different ones or clear the search.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[14.5px] font-semibold text-text-900">No vendors yet</div>
                        <div className="text-[12.5px] text-text-700 mt-1">
                          Add your first supplier or contractor with the button above.
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => {
                  const pill = TYPE_PILL[vendor.vendorType] ?? TYPE_PILL.OTHER;
                  return (
                    <tr
                      key={vendor.id}
                      className="border-t border-background-600 hover:bg-background-700 transition-colors"
                    >
                      <td className="px-3 py-[13px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-[11px] font-[650] text-text-700 shrink-0">
                            {initialsOf(vendor.vendorName)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
                              {vendor.vendorName}
                            </div>
                            {vendor.contactPerson && (
                              <div className="text-xs text-text-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
                                {vendor.contactPerson}
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
                          {vendorTypeLabel(vendor.vendorType)}
                        </span>
                      </td>
                      <td className="px-3 py-[13px] text-[13px] text-text-900 tabular-nums whitespace-nowrap">
                        {vendor.phone || '—'}
                      </td>
                      <td className="px-3 py-[13px] text-[13px] text-text-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                        {vendor.email || '—'}
                      </td>
                      <td className="px-3 py-[13px]">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{
                            background: `var(--st-${vendor.active ? 'confirmed' : 'lost'}-bg)`,
                            color: `var(--st-${vendor.active ? 'confirmed' : 'lost'}-fg)`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: `var(--st-${vendor.active ? 'confirmed' : 'lost'}-fg)` }}
                          />
                          {vendor.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-[13px] text-[12.5px] text-text-700 tabular-nums whitespace-nowrap">
                        {fmtDate(vendor.createdAt)}
                      </td>
                      <td className="px-3.5 py-[13px]">
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => {
                              setEditingVendor(vendor);
                              setIsModalOpen(true);
                            }}
                            title="Edit"
                            className={iconBtn}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(vendor)}
                            title="Deactivate"
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
            Showing {vendors.length} of {totalElements}
          </span>
          <div className="flex-1" />
          <Pagination currentPage={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />
        </div>
      </div>

      {/* Add/Edit modal */}
      {isModalOpen && (
        <VendorFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingVendor(null);
          }}
          vendor={editingVendor}
        />
      )}

      {/* Deactivate confirmation — replaces the browser confirm() this page used to call.
          Wording matches reality: delete is a soft delete. */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Vendor"
        message={
          deleteTarget
            ? `Deactivate ${deleteTarget.vendorName}? They disappear from the default list and from expense forms, but their history is kept — switch the filter to "Inactive only" to bring them back.`
            : ''
        }
        confirmText={isDeleting ? 'Deactivating…' : 'Deactivate'}
        type="danger"
      />
    </div>
  );
}

export default VendorsPage;
