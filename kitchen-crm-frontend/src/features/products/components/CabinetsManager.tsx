/**
 * CabinetsManager — the Cabinets tab of the product catalog in the HOCH table idiom
 * (tableKit pieces, one table card, modal form, ConfirmDialog).
 *
 * Server-side pagination via useGetCabinetsPaginatedQuery (size 20) — the old tab hardcoded
 * size:100 and threw the page metadata away, silently capping the list. Search stays
 * server-side on the `name` param, now debounced. Writes are SUPER_ADMIN-only on the backend,
 * so every write control is hidden from staff instead of letting them fill a form into a 403.
 * powderCoatingRatePerSqft is consumed by the quotation builder — the field name is load-bearing.
 */

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetCategoriesQuery,
  useGetCabinetsPaginatedQuery,
  useCreateCabinetMutation,
  useUpdateCabinetMutation,
  useDeleteCabinetMutation,
} from '../productsAPI';
import type { CabinetType, Category } from '../types';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
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
  labelCls,
  ActivePill,
  SkeletonRows,
  ErrorRow,
  EmptyRow,
  TableFooter,
  useDebouncedSearch,
} from './tableKit';

/** Keep in sync with the header row below — Actions is dropped entirely for staff. */
const COL_COUNT = 7;

const PAGE_SIZE = 20;

const fmtInr = (n: number | undefined) => `₹${(n ?? 0).toLocaleString('en-IN')}`;

export const CabinetsManager = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const [page, setPage] = useState(0);
  const { draft, setDraft, search } = useDebouncedSearch(() => setPage(0));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<CabinetType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CabinetType | null>(null);

  const { data, isLoading, isError } = useGetCabinetsPaginatedQuery({
    page,
    size: PAGE_SIZE,
    name: search || undefined,
  });
  const { data: categoriesData } = useGetCategoriesQuery();

  const [createCabinet, { isLoading: isCreating }] = useCreateCabinetMutation();
  const [updateCabinet, { isLoading: isUpdating }] = useUpdateCabinetMutation();
  const [deleteCabinet, { isLoading: isDeleting }] = useDeleteCabinetMutation();

  const cabinets = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const categories = categoriesData ?? [];

  // Deleting the last row of the last page leaves the page index past the end — walk back.
  useEffect(() => {
    if (data && page > 0 && page >= data.totalPages) {
      setPage(Math.max(0, data.totalPages - 1));
    }
  }, [data, page]);

  // Staff see no Actions column at all — every action in it is a SUPER_ADMIN-only write.
  const cols = isSuperAdmin ? COL_COUNT : COL_COUNT - 1;

  const openCreate = () => {
    setEditingCabinet(null);
    setIsFormOpen(true);
  };
  const openEdit = (cabinet: CabinetType) => {
    setEditingCabinet(cabinet);
    setIsFormOpen(true);
  };
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCabinet(null);
  };

  const handleSubmit = async (values: Omit<CabinetType, 'id'>) => {
    try {
      if (editingCabinet) {
        // Full-object PUT: spread the original so brandId/materialId etc. survive untouched.
        await updateCabinet({ ...editingCabinet, ...values }).unwrap();
        toast.success('Cabinet updated successfully');
      } else {
        await createCabinet(values).unwrap();
        toast.success('Cabinet created successfully');
      }
      closeForm();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save cabinet');
    }
  };

  const handleToggleActive = async (cabinet: CabinetType) => {
    try {
      await updateCabinet({ ...cabinet, active: !cabinet.active }).unwrap();
      toast.success(`Cabinet ${!cabinet.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update cabinet');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await deleteCabinet(deleteTarget.id).unwrap();
      // The backend answers 200 with success:false when the cabinet type is referenced
      // (e.g. by quotation line items) — surface its message instead of claiming success.
      if (response?.success === false) {
        toast.error(response.message || 'Cabinet type is in use and cannot be deleted');
      } else {
        toast.success(`"${deleteTarget.name}" deleted`);
      }
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete cabinet');
    }
  };

  return (
    <div className="w-full">
      {/* Count + primary action (the page shell owns the H1 and tab chips) */}
      <div className="flex items-center gap-4 flex-wrap mb-3.5">
        <span className="text-[13px] text-text-700">
          {totalElements} cabinet type{totalElements === 1 ? '' : 's'}
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
            Add Cabinet Type
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
              placeholder="Search cabinet types…"
              className={searchInputCls}
            />
          </div>
          <div className="flex-1" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={thClass}>Name</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Material</th>
                <th className={thClass}>Fixed Price (₹)</th>
                <th className={thClass}>Powder Coating</th>
                <th className={thClass}>Status</th>
                {isSuperAdmin && <th className={thActionsClass}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={cols} />
              ) : isError ? (
                <ErrorRow cols={cols} entity="cabinet types" />
              ) : cabinets.length === 0 ? (
                <EmptyRow
                  cols={cols}
                  filtered={!!search}
                  title="No cabinet types yet"
                  sub={
                    isSuperAdmin
                      ? 'Add your first cabinet type with the button above.'
                      : 'Cabinet types added by an admin will appear here.'
                  }
                />
              ) : (
                cabinets.map((cabinet) => (
                  <tr
                    key={cabinet.id}
                    className="border-t border-background-600 hover:bg-background-700 transition-colors"
                  >
                    <td className="px-3 py-[13px] text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[260px]">
                      {cabinet.name}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 whitespace-nowrap">
                      {cabinet.categoryName ?? '—'}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 whitespace-nowrap">
                      {cabinet.materialName ?? '—'}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] font-semibold text-text-900 tabular-nums whitespace-nowrap">
                      {fmtInr(cabinet.fixedPrice)}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 tabular-nums whitespace-nowrap">
                      {(cabinet.powderCoatingRatePerSqft ?? 0) > 0
                        ? `${fmtInr(cabinet.powderCoatingRatePerSqft)}/sq.ft`
                        : '—'}
                    </td>
                    <td className="px-3 py-[13px]">
                      <ActivePill active={cabinet.active} />
                    </td>
                    {isSuperAdmin && (
                      <td className="px-3.5 py-[13px]">
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => handleToggleActive(cabinet)}
                            title={cabinet.active ? 'Deactivate' : 'Activate'}
                            className={iconBtn}
                            disabled={isUpdating || isDeleting}
                          >
                            {cabinet.active ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => openEdit(cabinet)}
                            title="Edit"
                            className={iconBtn}
                            disabled={isDeleting}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(cabinet)}
                            title="Delete"
                            className={iconBtn}
                            disabled={isDeleting}
                            onMouseEnter={(ev) => {
                              ev.currentTarget.style.background = 'var(--st-lost-bg)';
                              ev.currentTarget.style.color = 'var(--st-lost-fg)';
                            }}
                            onMouseLeave={(ev) => {
                              ev.currentTarget.style.background = '';
                              ev.currentTarget.style.color = '';
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TableFooter
          shown={cabinets.length}
          total={totalElements}
          page={page}
          totalPages={totalPages}
          onPage={setPage}
        />
      </div>

      {/* Add/Edit modal — keyed so switching between rows resets the form state. */}
      {isFormOpen && (
        <CabinetFormModal
          key={editingCabinet?.id ?? 'new'}
          initialValues={editingCabinet}
          categories={categories}
          onSubmit={handleSubmit}
          onClose={closeForm}
          isSaving={isCreating || isUpdating}
        />
      )}

      {/* Delete confirmation — replaces the window.confirm the old tab used. */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Cabinet Type"
        message={
          deleteTarget
            ? `Delete the cabinet type "${deleteTarget.name}"? It disappears from the catalog and can no longer be added to quotations. This cannot be undone.`
            : ''
        }
        confirmText={isDeleting ? 'Deleting…' : 'Delete'}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

interface CabinetFormModalProps {
  initialValues: CabinetType | null;
  categories: Category[];
  onSubmit: (values: Omit<CabinetType, 'id'>) => void;
  onClose: () => void;
  isSaving: boolean;
}

function CabinetFormModal({ initialValues, categories, onSubmit, onClose, isSaving }: CabinetFormModalProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [categoryId, setCategoryId] = useState(
    initialValues?.categoryId != null ? String(initialValues.categoryId) : ''
  );
  const [fixedPrice, setFixedPrice] = useState(String(initialValues?.fixedPrice ?? 0));
  const [powderCoatingRatePerSqft, setPowderCoatingRatePerSqft] = useState(
    String(initialValues?.powderCoatingRatePerSqft ?? 0)
  );
  const [active, setActive] = useState(initialValues?.active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      categoryId: categoryId ? Number(categoryId) : undefined,
      fixedPrice: Number(fixedPrice) || 0,
      // Field name is consumed by the quotation builder — must not change.
      powderCoatingRatePerSqft: Number(powderCoatingRatePerSqft) || 0,
      active,
    });
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={initialValues ? 'Edit Cabinet Type' : 'New Cabinet Type'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Cabinet Name <span className="text-error">*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Storage Base Cabinet"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Fixed Price (₹) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={fixedPrice}
                onChange={(e) => setFixedPrice(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Powder Coating (₹ / sq.ft)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={powderCoatingRatePerSqft}
                onChange={(e) => setPowderCoatingRatePerSqft(e.target.value)}
                className={inputCls}
              />
              <p className="text-[11.5px] text-text-600 mt-1">
                Charged on the cabinet's box surface area. Leave at 0 to hide the option on quotations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cabinet-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-background-900 border-background-600 rounded focus:ring-primary-600"
            />
            <label htmlFor="cabinet-active" className="text-[12.5px] font-medium text-text-800">
              Active
            </label>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {initialValues ? 'Update Cabinet' : 'Create Cabinet'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default CabinetsManager;
