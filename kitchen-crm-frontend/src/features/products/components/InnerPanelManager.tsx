/**
 * InnerPanelManager — inner panel types in the shared HOCH table idiom (tableKit pieces).
 * The Products page shell owns the H1 and tab chips; this tab renders only the count line,
 * the Add button and one table card. The list is fetch-all, so search is client-side
 * (debounced) and there is no pagination footer.
 *
 * Changes from the old card grid: real error state (it used to show the empty state on
 * failures), delete confirms via ConfirmDialog instead of window.confirm, write controls are
 * hidden from non-super-admins (the backend 403s them anyway), the form gained an Active
 * control (create used to force active:true), and empty number inputs can no longer submit
 * NaN. The delete success:false handling (panel in use) is preserved.
 */

import { useMemo, useState } from 'react';
import type { FC, FormEvent } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetInnerPanelTypesQuery,
  useCreateInnerPanelTypeMutation,
  useUpdateInnerPanelTypeMutation,
  useDeleteInnerPanelTypeMutation,
} from '../productsAPI';
import type { InnerPanelType } from '../types';
import {
  thClass,
  thActionsClass,
  iconBtn,
  searchInputCls,
  cardCls,
  inputCls,
  labelCls,
  ActivePill,
  SkeletonRows,
  ErrorRow,
  EmptyRow,
  useDebouncedSearch,
} from './tableKit';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';

/** Name · Rate · Multiplier · Description · Status · Actions — keep in sync with the header row. */
const COL_COUNT = 6;

interface FormState {
  name: string;
  ratePerSqft: string;
  multiplier: string;
  description: string;
  active: boolean;
}

type FormErrors = Partial<Record<'name' | 'ratePerSqft' | 'multiplier', string>>;

const EMPTY_FORM: FormState = {
  name: '',
  ratePerSqft: '',
  multiplier: '1.0',
  description: '',
  active: true,
};

const errCls = 'mt-1.5 text-xs text-error';

export const InnerPanelManager: FC = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const { data: innerPanels, isLoading, isError } = useGetInnerPanelTypesQuery();
  const [createInnerPanel, { isLoading: isCreating }] = useCreateInnerPanelTypeMutation();
  const [updateInnerPanel, { isLoading: isUpdating }] = useUpdateInnerPanelTypeMutation();
  const [deleteInnerPanel, { isLoading: isDeleting }] = useDeleteInnerPanelTypeMutation();
  const { draft, setDraft, search } = useDebouncedSearch();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<InnerPanelType | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<InnerPanelType | null>(null);

  const all = innerPanels ?? [];
  const rows = useMemo(() => {
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    );
  }, [all, search]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (item: InnerPanelType) => {
    setEditing(item);
    setForm({
      name: item.name,
      ratePerSqft: String(item.ratePerSqft),
      multiplier: String(item.multiplier),
      description: item.description || '',
      active: item.active,
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Guard the parseFloat path: an empty or junk number input must never save NaN.
    const next: FormErrors = {};
    const name = form.name.trim();
    const ratePerSqft = parseFloat(form.ratePerSqft);
    const multiplier = parseFloat(form.multiplier);
    if (!name) next.name = 'Name is required';
    if (!Number.isFinite(ratePerSqft)) next.ratePerSqft = 'Enter a rate';
    else if (ratePerSqft < 0.01) next.ratePerSqft = 'Must be at least 0.01';
    if (!Number.isFinite(multiplier)) next.multiplier = 'Enter a multiplier';
    else if (multiplier < 0.1) next.multiplier = 'Must be at least 0.1';
    if (next.name || next.ratePerSqft || next.multiplier) {
      setErrors(next);
      return;
    }

    const payload = {
      name,
      ratePerSqft,
      multiplier,
      description: form.description.trim() || undefined,
      active: form.active,
    };

    try {
      if (editing) {
        await updateInnerPanel({ ...payload, id: editing.id }).unwrap();
        toast.success('Inner panel type updated');
      } else {
        await createInnerPanel(payload).unwrap();
        toast.success('Inner panel type created');
      }
      closeForm();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save inner panel type');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      // The delete endpoint answers 200 with success:false when the panel is in use — surface
      // the server's message instead of pretending it worked.
      const response = await deleteInnerPanel(deleteTarget.id).unwrap();
      if (response.success === false) {
        toast.error(response.message || 'Failed to delete');
      } else {
        toast.success('Inner panel type deleted');
      }
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete');
    }
  };

  const handleToggleActive = async (item: InnerPanelType) => {
    try {
      await updateInnerPanel({ ...item, active: !item.active }).unwrap();
      toast.success(`Inner panel type ${!item.active ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update');
    }
  };

  return (
    <div className="w-full">
      {/* Count line + primary action (the page shell renders the H1 and tab chips) */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span className="text-[13px] text-text-700">
          {all.length} inner panel type{all.length === 1 ? '' : 's'}
        </span>
        <div className="flex-1" />
        {isSuperAdmin && (
          <button
            onClick={openCreate}
            className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
          >
            <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            Add Inner Panel
          </button>
        )}
      </div>

      {/* Table card */}
      <div className={cardCls}>
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-[480px]">
            <Search
              size={15}
              className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none"
            />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search name or description…"
              className={searchInputCls}
            />
          </div>
          <div className="flex-1" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={thClass}>Name</th>
                <th className={thClass}>Rate (₹/sqft)</th>
                <th className={thClass}>Multiplier</th>
                <th className={thClass}>Description</th>
                <th className={thClass}>Status</th>
                <th className={thActionsClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={COL_COUNT} />
              ) : isError ? (
                <ErrorRow cols={COL_COUNT} entity="inner panel types" />
              ) : rows.length === 0 ? (
                <EmptyRow
                  cols={COL_COUNT}
                  filtered={!!search}
                  title="No inner panel types yet"
                  sub={
                    isSuperAdmin
                      ? 'Add your first inner panel type with the button above.'
                      : 'Nothing has been added yet.'
                  }
                />
              ) : (
                rows.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-background-600 hover:bg-background-700 transition-colors"
                  >
                    <td className="px-3 py-[13px] text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
                      {item.name}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-900 tabular-nums whitespace-nowrap">
                      ₹{item.ratePerSqft.toFixed(2)}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 tabular-nums whitespace-nowrap">
                      ×{item.multiplier}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">
                      {item.description || '—'}
                    </td>
                    <td className="px-3 py-[13px]">
                      <ActivePill active={item.active} />
                    </td>
                    <td className="px-3.5 py-[13px]">
                      {isSuperAdmin && (
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => handleToggleActive(item)}
                            title={item.active ? 'Deactivate' : 'Activate'}
                            className={iconBtn}
                            disabled={isUpdating || isDeleting}
                          >
                            {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            title="Edit"
                            className={iconBtn}
                            disabled={isDeleting}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            title="Delete"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 transition-colors"
                            disabled={isDeleting}
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
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Fetch-all tab: count line instead of a pagination footer */}
        <div className="flex items-center gap-2 px-3.5 py-[11px] border-t border-background-600">
          <span className="text-[12.5px] text-text-700">
            Showing {rows.length} of {all.length}
          </span>
        </div>
      </div>

      {/* Add/Edit modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editing ? 'Edit Inner Panel Type' : 'New Inner Panel Type'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className={inputCls}
                required
              />
              {errors.name && <p className={errCls}>{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Rate per Sqft *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.ratePerSqft}
                  onChange={(e) => setField('ratePerSqft', e.target.value)}
                  className={inputCls}
                  required
                />
                {errors.ratePerSqft && <p className={errCls}>{errors.ratePerSqft}</p>}
              </div>
              <div>
                <label className={labelCls}>Multiplier *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.multiplier}
                  onChange={(e) => setField('multiplier', e.target.value)}
                  className={inputCls}
                  required
                />
                {errors.multiplier && <p className={errCls}>{errors.multiplier}</p>}
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setField('active', e.target.checked)}
                className="w-4 h-4 accent-[var(--color-primary-600)] cursor-pointer"
              />
              <span className="text-[13px] text-text-800">
                Active — inactive types are hidden from new quotations
              </span>
            </label>
          </div>
          <div className="mt-6 pt-4 border-t border-background-600 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isCreating || isUpdating}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation — replaces the window.confirm the old tab used */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Inner Panel Type"
        message={
          deleteTarget
            ? `Permanently delete the inner panel type "${deleteTarget.name}"? If you only want to hide it from new quotations, deactivate it with the eye icon instead.`
            : ''
        }
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default InnerPanelManager;
