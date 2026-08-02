/**
 * StaffPage
 * Staff directory in the HOCH table idiom shared with the Customers module: compact page
 * header with a count pill, status filter chips with a distribution bar, then a single
 * table card with an inline search toolbar and a "showing x of y" footer.
 */

import { useMemo, useState } from 'react';
import { Plus, Search, Edit, Trash2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetStaffQuery, useDeleteStaffMutation } from '@/features/staff/staffAPI';
import type { Staff } from '@/features/staff/types';
import StaffFormModal from '@/features/staff/components/StaffFormModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

type StaffFilter = 'all' | 'active' | 'inactive';

const STATUS_PILL: Record<'active' | 'inactive', { st: string; label: string }> = {
  active: { st: 'confirmed', label: 'Active' },
  inactive: { st: 'draft', label: 'Inactive' },
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

export function StaffPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stage, setStage] = useState<StaffFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Staff | null>(null);

  const { data: staffList = [], isLoading, error } = useGetStaffQuery();
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();

  const activeCount = staffList.filter((s: Staff) => s.active).length;
  const inactiveCount = staffList.length - activeCount;

  const visibleStaff = useMemo(() => {
    const byStage = staffList.filter((s: Staff) =>
      stage === 'all' ? true : stage === 'active' ? s.active : !s.active
    );
    const q = searchTerm.trim().toLowerCase();
    if (!q) return byStage;
    return byStage.filter(
      (s: Staff) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phoneNumber?.toLowerCase().includes(q)
    );
  }, [staffList, stage, searchTerm]);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deleteStaff(deactivateTarget.id).unwrap();
      toast.success(`${deactivateTarget.name} deactivated`);
      setDeactivateTarget(null);
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || 'Failed to deactivate staff');
    }
  };

  const chips: Array<{ key: StaffFilter; st?: string; label: string; count: number }> = [
    { key: 'all', label: 'All Staff', count: staffList.length },
    { key: 'active', st: 'confirmed', label: 'Active', count: activeCount },
    { key: 'inactive', st: 'draft', label: 'Inactive', count: inactiveCount },
  ];

  const chipStyle = (active: boolean) =>
    active
      ? {
          borderColor: 'var(--color-primary-600)',
          background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
        }
      : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' };

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Staff</h1>
            <span className="text-xs font-[650] px-[9px] py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
              {staffList.length}
            </span>
          </div>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            Manage staff members and their access to the system.
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => {
            setEditingStaff(null);
            setIsModalOpen(true);
          }}
          className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
        >
          <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          Add Staff
        </button>
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        {chips.map((c) => {
          const active = stage === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setStage(c.key)}
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
      {staffList.length > 0 && (
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mx-0.5 mb-5">
          {activeCount > 0 && (
            <div
              title={`Active · ${activeCount}`}
              style={{
                width: `${(activeCount / staffList.length) * 100}%`,
                background: 'var(--st-confirmed-fg)',
              }}
            />
          )}
          {inactiveCount > 0 && (
            <div
              title={`Inactive · ${inactiveCount}`}
              style={{
                width: `${(inactiveCount / staffList.length) * 100}%`,
                background: 'var(--st-draft-fg)',
              }}
            />
          )}
        </div>
      )}

      {/* Table card */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <div className="relative flex-1 max-w-[480px]">
            <Search
              size={15}
              className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name, email, phone…"
              className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={thClass}>Name</th>
                <th className={thClass}>Contact</th>
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
                    <td className="px-3 py-[13px]"><div className="h-4 bg-background-600 rounded w-40" /></td>
                    <td className="px-3 py-[13px]"><div className="h-5 bg-background-600 rounded-full w-20" /></td>
                    <td className="px-3 py-[13px]"><div className="h-4 bg-background-600 rounded w-24" /></td>
                    <td className="px-3.5 py-[13px]"><div className="h-4 bg-background-600 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr className="border-t border-background-600">
                  <td colSpan={5} className="px-5 py-14 text-center text-[13px] text-text-700">
                    Failed to load staff
                  </td>
                </tr>
              ) : visibleStaff.length === 0 ? (
                <tr className="border-t border-background-600">
                  <td colSpan={5} className="px-5 py-14 text-center">
                    {searchTerm || stage !== 'all' ? (
                      <>
                        <div className="text-[14.5px] font-semibold text-text-900">No matching staff</div>
                        <div className="text-[12.5px] text-text-700 mt-1">
                          Nothing here for the current filters — try a different one or clear the search.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[14.5px] font-semibold text-text-900">No staff yet</div>
                        <div className="text-[12.5px] text-text-700 mt-1">
                          Add your first staff member with the button above.
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                visibleStaff.map((staff: Staff) => {
                  const pill = STATUS_PILL[staff.active ? 'active' : 'inactive'];
                  return (
                    <tr
                      key={staff.id}
                      className="border-t border-background-600 hover:bg-background-700 transition-colors"
                    >
                      <td className="px-3 py-[13px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-[11px] font-[650] text-text-700 shrink-0">
                            {initialsOf(staff.name)}
                          </div>
                          <span className="text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis">
                            {staff.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-[13px] min-w-0">
                        <div className="text-[13px] text-text-900 whitespace-nowrap overflow-hidden text-ellipsis">
                          {staff.email}
                        </div>
                        <div className="text-xs text-text-700 tabular-nums">{staff.phoneNumber || '—'}</div>
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
                      <td className="px-3 py-[13px] text-[12.5px] text-text-700 tabular-nums whitespace-nowrap">
                        {fmtDate(staff.createdAt)}
                      </td>
                      <td className="px-3.5 py-[13px]">
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => {
                              setEditingStaff(staff);
                              setIsModalOpen(true);
                            }}
                            title="Edit"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          {staff.active ? (
                            <button
                              onClick={() => setDeactivateTarget(staff)}
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
                          ) : (
                            <button
                              onClick={() => {
                                setEditingStaff(staff);
                                setIsModalOpen(true);
                              }}
                              title="Reactivate from the edit form"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
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
            Showing {visibleStaff.length} of {staffList.length} staff
          </span>
        </div>
      </div>

      {/* Staff form modal */}
      {isModalOpen && (
        <StaffFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingStaff(null);
          }}
          staff={editingStaff}
        />
      )}

      {/* Deactivate confirmation — replaces the browser confirm() this page used to call */}
      <ConfirmDialog
        isOpen={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Staff"
        message={
          deactivateTarget
            ? `Deactivate ${deactivateTarget.name}? They will lose access but their record is kept.`
            : ''
        }
        confirmText={isDeleting ? 'Deactivating…' : 'Deactivate'}
        type="danger"
      />
    </div>
  );
}

export default StaffPage;
