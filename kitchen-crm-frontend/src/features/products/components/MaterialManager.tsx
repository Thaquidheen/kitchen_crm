/**
 * MaterialManager — the Materials tab of the product catalog in the HOCH table idiom
 * (VendorsPage layout, tableKit pieces). The page shell owns the H1 and tab chips; this renders
 * the count/Add row, one table card with a client-side debounced search, and the modals.
 *
 * Fixes over the old card-grid version:
 * - calculationType was register()ed but missing from the zod schema, so zodResolver STRIPPED it:
 *   create silently defaulted to BOX_AREA and edit re-injected the stale value — the select was
 *   inert while driving cabinet pricing. It is now in the schema as a required enum.
 * - unitRatePerSqft was optional() in the schema despite the red *; it is now required.
 * - window.confirm on delete replaced with ConfirmDialog; fetch failures show an error row
 *   instead of the empty state; inactive rows get a status pill instead of opacity.
 * - Delete keeps the 200-with-success:false handling (material in use) and surfaces the server
 *   message.
 * - Write controls (Add / edit / delete / toggle) render only for super admins — the backend is
 *   SUPER_ADMIN-only on every write, so staff used to fill the whole form just to get a 403.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
} from '../productsAPI';
import type { Material } from '../types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';
import {
  thClass,
  thActionsClass,
  iconBtn,
  searchInputCls,
  cardCls,
  inputCls,
  textareaCls,
  labelCls,
  Pill,
  ActivePill,
  SkeletonRows,
  ErrorRow,
  EmptyRow,
  useDebouncedSearch,
} from './tableKit';

/** Name, Rate, Calculation, Description, Status, Actions — keep in sync with the header row. */
const COL_COUNT = 6;

const materialSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  // Required — the old schema left this optional() despite the red *, letting empty submits by.
  unitRatePerSqft: z
    .number('Price is required')
    .min(0.01, 'Price must be greater than 0'),
  // THE FIX: this field was registered but absent from the old schema, so zodResolver stripped
  // it from the submitted values and the select never did anything.
  calculationType: z.enum(['BOX_AREA', 'FACE_AREA']),
  description: z.string().optional(),
  active: z.boolean(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

const defaultsFor = (material?: Material | null): Partial<MaterialFormValues> =>
  material
    ? {
        name: material.name,
        description: material.description || '',
        active: material.active,
        unitRatePerSqft: material.unitRatePerSqft,
        calculationType: material.calculationType === 'FACE_AREA' ? 'FACE_AREA' : 'BOX_AREA',
      }
    : {
        name: '',
        description: '',
        active: true,
        unitRatePerSqft: undefined,
        calculationType: 'BOX_AREA',
      };

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
}

function MaterialFormModal({ isOpen, onClose, material }: MaterialFormModalProps) {
  const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();
  const [updateMaterial, { isLoading: isUpdating }] = useUpdateMaterialMutation();
  const isSaving = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: defaultsFor(material),
  });

  // defaultValues are only read on mount; re-sync on every open so "edit A, close, edit B"
  // shows (and saves) B's values, not A's.
  useEffect(() => {
    if (isOpen) reset(defaultsFor(material));
  }, [isOpen, material, reset]);

  const activeValue = watch('active');

  const onSubmit = async (values: MaterialFormValues) => {
    try {
      if (material) {
        await updateMaterial({ ...material, ...values }).unwrap();
        toast.success('Material updated successfully');
      } else {
        await createMaterial(values).unwrap();
        toast.success('Material created successfully');
      }
      onClose();
    } catch (e: any) {
      toast.error(
        e?.data?.message || (material ? 'Failed to update material' : 'Failed to create material')
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={material ? 'Edit Material' : 'Add Material'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className={labelCls}>
            Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            className={inputCls}
            placeholder="Enter material name"
            {...register('name')}
            disabled={isSaving}
          />
          {errors.name && <p className="text-error text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Price per Sqft */}
        <div>
          <label className={labelCls}>
            Price per Sqft (Rs.) <span className="text-error">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={inputCls}
            placeholder="Enter price per square foot"
            {...register('unitRatePerSqft', { valueAsNumber: true })}
            disabled={isSaving}
          />
          {errors.unitRatePerSqft && (
            <p className="text-error text-xs mt-1">{errors.unitRatePerSqft.message}</p>
          )}
        </div>

        {/* Area Calculation Type */}
        <div>
          <label className={labelCls}>Area Calculation Type</label>
          <select
            className={`${inputCls} cursor-pointer`}
            {...register('calculationType')}
            disabled={isSaving}
          >
            <option value="BOX_AREA">Box Area (Full cabinet surface - SS, etc.)</option>
            <option value="FACE_AREA">Face Area (Front face only - PLY, WPC, etc.)</option>
          </select>
          {errors.calculationType && (
            <p className="text-error text-xs mt-1">{errors.calculationType.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            className={textareaCls}
            rows={3}
            placeholder="Enter material description"
            {...register('description')}
            disabled={isSaving}
          />
          {errors.description && (
            <p className="text-error text-xs mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="sr-only" {...register('active')} disabled={isSaving} />
          <span
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              activeValue ? 'bg-success' : 'bg-background-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-text-900 rounded-full transition-transform ${
                activeValue ? 'translate-x-5' : ''
              }`}
            />
          </span>
          <span>
            <span className="block text-sm font-medium text-text-900">
              {activeValue ? 'Active' : 'Inactive'}
            </span>
            <span className="block text-xs text-text-600">
              {activeValue
                ? 'This material will be visible and usable'
                : 'This material will be hidden'}
            </span>
          </span>
        </label>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-background-600">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving} className="w-full sm:w-auto">
            {material ? 'Update Material' : 'Create Material'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export const MaterialManager = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const { data: materials = [], isLoading, isError } = useGetMaterialsQuery();
  const [updateMaterial, { isLoading: isUpdating }] = useUpdateMaterialMutation();
  const [deleteMaterial, { isLoading: isDeleting }] = useDeleteMaterialMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);

  // The materials endpoint returns the full list, so search filters client-side.
  const { draft, setDraft, search } = useDebouncedSearch();
  const q = search.toLowerCase();
  const filtered = q
    ? materials.filter(
        (m) =>
          m.name.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q)
      )
    : materials;

  const handleToggleActive = async (material: Material) => {
    try {
      await updateMaterial({ ...material, active: !material.active }).unwrap();
      toast.success(`Material ${!material.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update material');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await deleteMaterial(deleteTarget.id).unwrap();
      // The backend answers 200 with success:false when the material is still referenced
      // (e.g. by a cabinet type) — surface its message instead of a false "deleted".
      if (response.success === false) {
        toast.error(response.message || 'Failed to delete material');
      } else {
        toast.success('Material deleted successfully');
      }
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete material');
    }
  };

  return (
    <div className="w-full">
      {/* Count + Add row (the page shell owns the H1 and tab chips) */}
      <div className="flex items-center gap-4 flex-wrap mb-3.5">
        <span className="text-[13px] text-text-700 tabular-nums">
          {search
            ? `${filtered.length} of ${materials.length} materials`
            : `${materials.length} material${materials.length === 1 ? '' : 's'}`}
        </span>
        <div className="flex-1" />
        {isSuperAdmin && (
          <button
            onClick={() => {
              setEditingMaterial(null);
              setIsModalOpen(true);
            }}
            className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
          >
            <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            Add Material
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
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={thClass}>Name</th>
                <th className={thClass}>Rate</th>
                <th className={thClass}>Calculation</th>
                <th className={thClass}>Description</th>
                <th className={thClass}>Status</th>
                <th className={thActionsClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={COL_COUNT} />
              ) : isError ? (
                <ErrorRow cols={COL_COUNT} entity="materials" />
              ) : filtered.length === 0 ? (
                <EmptyRow
                  cols={COL_COUNT}
                  filtered={!!search}
                  title="No materials yet"
                  sub={
                    isSuperAdmin
                      ? 'Add your first material with the button above.'
                      : 'Materials appear here once a super admin adds them.'
                  }
                />
              ) : (
                filtered.map((material) => (
                  <tr
                    key={material.id}
                    className="border-t border-background-600 hover:bg-background-700 transition-colors"
                  >
                    <td className="px-3 py-[13px]">
                      <div className="text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
                        {material.name}
                      </div>
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-900 tabular-nums whitespace-nowrap">
                      {material.unitRatePerSqft != null ? (
                        <>
                          ₹{material.unitRatePerSqft.toFixed(2)}
                          <span className="text-text-500"> /sqft</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-[13px]">
                      <Pill
                        st={material.calculationType === 'FACE_AREA' ? 'quote' : 'design'}
                        label={material.calculationType === 'FACE_AREA' ? 'Face Area' : 'Box Area'}
                      />
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">
                      {material.description || '—'}
                    </td>
                    <td className="px-3 py-[13px]">
                      <ActivePill active={material.active} />
                    </td>
                    <td className="px-3.5 py-[13px]">
                      {isSuperAdmin && (
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => handleToggleActive(material)}
                            title={material.active ? 'Deactivate' : 'Activate'}
                            className={`${iconBtn} disabled:opacity-40`}
                            disabled={isUpdating || isDeleting}
                          >
                            {material.active ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingMaterial(material);
                              setIsModalOpen(true);
                            }}
                            title="Edit"
                            className={`${iconBtn} disabled:opacity-40`}
                            disabled={isDeleting}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(material)}
                            title="Delete"
                            className={`${iconBtn} disabled:opacity-40`}
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
      </div>

      {/* Add/Edit modal */}
      {isModalOpen && (
        <MaterialFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingMaterial(null);
          }}
          material={editingMaterial}
        />
      )}

      {/* Delete confirmation — replaces the window.confirm the old card grid used. */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Material"
        message={
          deleteTarget
            ? `Delete material "${deleteTarget.name}"? This removes it from the catalog for new cabinets and quotes. If it is still in use, the server will refuse and tell you why.`
            : ''
        }
        confirmText={isDeleting ? 'Deleting…' : 'Delete'}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MaterialManager;
