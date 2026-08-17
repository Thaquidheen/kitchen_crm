/**
 * BrandManager — the Brands tab of the product catalog in the HOCH table idiom (tableKit).
 * The page shell renders the H1 and tab chips; this manager renders only the count-plus-Add
 * row, one table card with a debounced client-side search (the brands endpoint has no search
 * param — small list, filtered in memory), and its own modals.
 *
 * Replaces the old card grid + shared ProductForm screen swap. Kept: every CRUD action, the
 * eye/eye-off toggle doing the full-object PUT, all form fields/validation/placeholders/helper
 * text. Fixed: failures now show an error row instead of the empty state, delete confirms via
 * ConfirmDialog instead of window.confirm, 200-with-success:false deletes (brand in use)
 * surface the server message, write controls are hidden from non-super-admins (the backend
 * 403s them anyway), and the fake "Image (Coming soon)" dropzone is gone.
 *
 * getActiveBrands feeds the Accessory form elsewhere — the mutations here invalidate the
 * Brands tag, so that list refreshes on its own; nothing API-side changes.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';
import {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from '../productsAPI';
import type { Brand } from '../types';
import {
  thClass,
  thActionsClass,
  iconBtn,
  searchInputCls,
  cardCls,
  inputCls,
  textareaCls,
  labelCls,
  ActivePill,
  SkeletonRows,
  ErrorRow,
  EmptyRow,
  useDebouncedSearch,
} from './tableKit';

/** Keep in sync with the header row below — the skeleton/empty/error rows span every column. */
const COL_COUNT = 4;

// ---------------------------------------------------------------------------
// Add/Edit modal — the brand subset of the old shared ProductForm, inlined.
// ---------------------------------------------------------------------------

const brandSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  active: z.boolean(),
});

type BrandFormValues = z.infer<typeof brandSchema>;

const defaultsFor = (brand?: Brand | null): BrandFormValues => ({
  name: brand?.name || '',
  description: brand?.description || '',
  active: brand?.active ?? true,
});

function BrandFormModal({
  isOpen,
  onClose,
  brand,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** null → create mode */
  brand: Brand | null;
}) {
  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();
  const busy = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: defaultsFor(brand),
  });

  // defaultValues are only read on mount — re-sync when reopened for a different row.
  useEffect(() => {
    if (isOpen) reset(defaultsFor(brand));
  }, [isOpen, brand, reset]);

  const active = watch('active');

  const onSubmit = async (values: BrandFormValues) => {
    try {
      if (brand) {
        await updateBrand({ ...brand, ...values }).unwrap();
        toast.success('Brand updated successfully');
      } else {
        await createBrand(values).unwrap();
        toast.success('Brand created successfully');
      }
      onClose();
    } catch (e: any) {
      toast.error(
        e?.data?.message || (brand ? 'Failed to update brand' : 'Failed to create brand')
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={brand ? 'Edit Brand' : 'Add Brand'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className={labelCls}>
            Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            className={inputCls}
            placeholder="Enter brand name"
            disabled={busy}
            {...register('name')}
          />
          {errors.name && <p className="text-error text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            rows={3}
            className={textareaCls}
            placeholder="Enter brand description"
            disabled={busy}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-error text-xs mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Active toggle — same semantics and helper text as the old ProductForm switch */}
        <div>
          <span className={labelCls}>Status</span>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={() => setValue('active', !active, { shouldDirty: true })}
            disabled={busy}
            className="flex items-center gap-3 text-left"
          >
            <span
              className={`relative inline-block w-11 h-6 rounded-full transition-colors shrink-0 ${
                active ? 'bg-success' : 'bg-background-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-text-900 rounded-full transition-transform ${
                  active ? 'translate-x-5' : ''
                }`}
              />
            </span>
            <span>
              <span className="block text-[13px] font-medium text-text-900">
                {active ? 'Active' : 'Inactive'}
              </span>
              <span className="block text-xs text-text-600">
                {active ? 'This brand will be visible and usable' : 'This brand will be hidden'}
              </span>
            </span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-background-600">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={busy} className="w-full sm:w-auto">
            {brand ? 'Update Brand' : 'Create Brand'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

export const BrandManager = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const { data, isLoading, isError } = useGetBrandsQuery();
  const [updateBrand, { isLoading: isToggling }] = useUpdateBrandMutation();
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation();

  const { draft, setDraft, search } = useDebouncedSearch();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const brands = data ?? [];
  // No server-side search on this endpoint (small list) — filter the fetched list, still debounced.
  const q = search.toLowerCase();
  const visible = q
    ? brands.filter(
        (b) => b.name.toLowerCase().includes(q) || (b.description || '').toLowerCase().includes(q)
      )
    : brands;

  const handleToggleActive = async (brand: Brand) => {
    try {
      await updateBrand({ ...brand, active: !brand.active }).unwrap();
      toast.success(`Brand ${!brand.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update brand');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteBrand(deleteTarget.id).unwrap();
      // The backend answers 200 with success:false when the brand is still referenced.
      if (res && res.success === false) {
        toast.error(res.message || 'Brand is in use and cannot be deleted');
      } else {
        toast.success('Brand deleted successfully');
      }
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete brand');
    }
  };

  return (
    <div className="w-full">
      {/* Count + Add row (the page shell owns the H1 and tab chips) */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span className="text-[13px] text-text-700 tabular-nums">
          {brands.length} brand{brands.length === 1 ? '' : 's'}
        </span>
        <div className="flex-1" />
        {isSuperAdmin && (
          <button
            onClick={() => {
              setEditingBrand(null);
              setFormOpen(true);
            }}
            className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
          >
            <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            Add Brand
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
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={thClass}>Name</th>
                <th className={thClass}>Description</th>
                <th className={thClass}>Status</th>
                <th className={thActionsClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={COL_COUNT} />
              ) : isError ? (
                <ErrorRow cols={COL_COUNT} entity="brands" />
              ) : visible.length === 0 ? (
                <EmptyRow
                  cols={COL_COUNT}
                  filtered={!!search}
                  title="No brands yet"
                  sub={
                    isSuperAdmin
                      ? 'Create the first brand with the button above.'
                      : 'Brands added by an administrator will appear here.'
                  }
                />
              ) : (
                visible.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-t border-background-600 hover:bg-background-700 transition-colors"
                  >
                    <td className="px-3 py-[13px] text-[13.5px] font-semibold text-text-900 whitespace-nowrap">
                      {brand.name}
                    </td>
                    <td className="px-3 py-[13px]">
                      <div
                        className="text-[13px] text-text-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[380px]"
                        title={brand.description || undefined}
                      >
                        {brand.description || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-[13px]">
                      <ActivePill active={brand.active} />
                    </td>
                    <td className="px-3.5 py-[13px]">
                      {isSuperAdmin && (
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => handleToggleActive(brand)}
                            title={brand.active ? 'Deactivate' : 'Activate'}
                            className={iconBtn}
                            disabled={isToggling || isDeleting}
                          >
                            {brand.active ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingBrand(brand);
                              setFormOpen(true);
                            }}
                            title="Edit"
                            className={iconBtn}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(brand)}
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
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Fetch-all tab: no pagination footer — the count line above the card covers it. */}
      </div>

      {/* Add/Edit modal */}
      {formOpen && (
        <BrandFormModal
          isOpen={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingBrand(null);
          }}
          brand={editingBrand}
        />
      )}

      {/* Delete confirmation — replaces the window.confirm the old tab used */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Brand"
        message={
          deleteTarget
            ? `Delete the brand "${deleteTarget.name}"? This cannot be undone — if products still use it, the server will refuse and nothing is lost.`
            : ''
        }
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BrandManager;
