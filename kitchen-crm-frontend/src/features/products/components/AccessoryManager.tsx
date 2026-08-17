/**
 * AccessoryManager — the Accessories tab of the product catalog in the HOCH table idiom
 * (VendorsPage reference). The page shell renders the H1 and tab chips; this manager renders
 * only the count/Add row, one table card, and its modals.
 *
 * Fixes over the old card grid:
 * - THE TRUNCATION BUG: the old tab wired `page` into the query but rendered no pagination, so
 *   only the first 20 accessories were ever reachable. Now uses the paginated query + footer.
 * - Search is debounced server-side (the backend filters by `name`) and resets the page.
 * - Fetch failures show an error row — before, they looked like an empty catalog.
 * - Delete confirms via ConfirmDialog (no window.confirm) and surfaces a 200-with-
 *   success:false "in use" response instead of toasting success.
 * - Write controls (Add / edit / delete / toggle) render only for SUPER_ADMIN — every write
 *   endpoint is admin-only and staff used to get a 403 after filling the whole form.
 * - Inactive rows show a status pill instead of 60% opacity.
 */

import { useEffect, useRef, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Package, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetCategoriesQuery,
  useGetActiveBrandsQuery,
  useGetAccessoriesPaginatedQuery,
  useCreateAccessoryMutation,
  useUpdateAccessoryMutation,
  useDeleteAccessoryMutation,
  useUploadAccessoryImageMutation,
} from '../productsAPI';
import type { Accessory, Category } from '../types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';
import { getImageUrl } from '@/utils/imageUtils';
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

/** Keep in sync with the header row below — skeleton/error/empty rows span every column. */
const COL_COUNT = 9;

const PAGE_SIZE = 20;

/** Grey "No Image" placeholder for broken thumbnails/previews (same data URI the old form used). */
const IMG_FALLBACK =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect fill="%23333" width="128" height="128"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';

export const AccessoryManager = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const [page, setPage] = useState(0);
  const { draft, setDraft, search } = useDebouncedSearch(() => setPage(0));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Accessory | null>(null);

  const { data, isLoading, isError } = useGetAccessoriesPaginatedQuery({
    name: search || undefined,
    page,
    size: PAGE_SIZE,
    sortBy: 'name',
    sortDir: 'asc',
  });

  // Deleting the last row of the last page leaves the page index past the end — walk back.
  useEffect(() => {
    if (data && page > 0 && page >= data.totalPages) {
      setPage(Math.max(0, data.totalPages - 1));
    }
  }, [data, page]);
  const { data: categoriesData } = useGetCategoriesQuery();

  const [createAccessory, { isLoading: isCreating }] = useCreateAccessoryMutation();
  const [updateAccessory, { isLoading: isUpdating }] = useUpdateAccessoryMutation();
  const [deleteAccessory, { isLoading: isDeleting }] = useDeleteAccessoryMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadAccessoryImageMutation();

  const accessories = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const categories = categoriesData ?? [];

  const handleSubmit = async (values: Partial<Accessory>, imageFile?: File) => {
    try {
      let savedAccessory: Accessory;

      if (editingAccessory) {
        savedAccessory = await updateAccessory({ ...editingAccessory, ...values } as Accessory).unwrap();
        toast.success('Accessory updated successfully');
      } else {
        savedAccessory = await createAccessory(values as Omit<Accessory, 'id'>).unwrap();
        toast.success('Accessory created successfully');
      }

      // Two-step save: the image goes up separately; its failure must not undo the entity save.
      if (imageFile && savedAccessory?.id) {
        try {
          await uploadImage({ id: savedAccessory.id, file: imageFile }).unwrap();
          toast.success('Image uploaded successfully');
        } catch (imgError: any) {
          toast.error(imgError?.data?.message || 'Failed to upload image');
        }
      }

      setIsModalOpen(false);
      setEditingAccessory(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save accessory');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      // deleteAccessory returns the raw ApiResponse: the backend answers 200 with
      // success:false when the accessory is referenced by quotations.
      const response = await deleteAccessory(deleteTarget.id).unwrap();
      if (response.success === false) {
        toast.error(response.message || `"${deleteTarget.name}" is in use and cannot be deleted`);
        setDeleteTarget(null);
        return;
      }
      toast.success('Accessory deleted successfully');
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete accessory');
    }
  };

  const handleToggleActive = async (accessory: Accessory) => {
    try {
      await updateAccessory({ ...accessory, active: !accessory.active }).unwrap();
      toast.success(`Accessory ${!accessory.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update accessory');
    }
  };

  return (
    <div className="w-full">
      {/* Count + Add row (the page shell owns the H1 and tab chips) */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span className="text-[13px] text-text-700">
          {isLoading ? 'Loading…' : `${totalElements} accessor${totalElements === 1 ? 'y' : 'ies'}`}
        </span>
        <div className="flex-1" />
        {isSuperAdmin && (
          <button
            onClick={() => {
              setEditingAccessory(null);
              setIsModalOpen(true);
            }}
            className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
          >
            <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            Add Accessory
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
              placeholder="Search accessories…"
              className={searchInputCls}
            />
          </div>
          <div className="flex-1" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={thClass}>Item</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Brand</th>
                <th className={thClass}>MRP</th>
                <th className={thClass}>Discount %</th>
                <th className={thClass}>Company Price</th>
                <th className={thClass}>Width (mm)</th>
                <th className={thClass}>Status</th>
                <th className={thActionsClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={COL_COUNT} />
              ) : isError ? (
                <ErrorRow cols={COL_COUNT} entity="accessories" />
              ) : accessories.length === 0 ? (
                <EmptyRow
                  cols={COL_COUNT}
                  filtered={!!search}
                  title="No accessories yet"
                  sub="Add your first accessory with the button above."
                />
              ) : (
                accessories.map((accessory) => (
                  <tr
                    key={accessory.id}
                    className="border-t border-background-600 hover:bg-background-700 transition-colors"
                  >
                    <td className="px-3 py-[13px]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {accessory.imageUrl ? (
                          <img
                            src={getImageUrl(accessory.imageUrl)}
                            alt={accessory.name}
                            className="w-12 h-12 rounded-[9px] border border-background-600 object-cover bg-background-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = IMG_FALLBACK;
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-[9px] border border-background-600 bg-background-700 flex items-center justify-center shrink-0">
                            <Package size={18} className="text-text-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
                            {accessory.name}
                          </div>
                          {accessory.materialCode && (
                            <div className="text-xs text-text-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">
                              {accessory.materialCode}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 whitespace-nowrap">
                      {accessory.categoryName || '—'}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 whitespace-nowrap">
                      {accessory.brandName || '—'}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-900 tabular-nums whitespace-nowrap">
                      ₹{accessory.mrp.toLocaleString()}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] tabular-nums whitespace-nowrap">
                      {accessory.discountPercentage && accessory.discountPercentage > 0 ? (
                        <span className="text-success">{accessory.discountPercentage}%</span>
                      ) : (
                        <span className="text-text-700">—</span>
                      )}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] font-[650] text-text-900 tabular-nums whitespace-nowrap">
                      {accessory.companyPrice != null ? `₹${accessory.companyPrice.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 tabular-nums whitespace-nowrap">
                      {accessory.widthMm ? `${accessory.widthMm} mm` : '—'}
                    </td>
                    <td className="px-3 py-[13px]">
                      <ActivePill active={accessory.active} />
                    </td>
                    <td className="px-3.5 py-[13px]">
                      {isSuperAdmin && (
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => {
                              setEditingAccessory(accessory);
                              setIsModalOpen(true);
                            }}
                            title="Edit"
                            className={iconBtn}
                            disabled={isDeleting}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(accessory)}
                            title={accessory.active ? 'Deactivate' : 'Activate'}
                            className={iconBtn}
                            disabled={isUpdating || isDeleting}
                          >
                            {accessory.active ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(accessory)}
                            title="Delete"
                            className={iconBtn}
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

        {/* Footer — the pagination the old tab never rendered */}
        <TableFooter
          shown={accessories.length}
          total={totalElements}
          page={page}
          totalPages={totalPages}
          onPage={setPage}
        />
      </div>

      {/* Add/Edit modal (mounted per open so the form state resets between targets) */}
      {isSuperAdmin && isModalOpen && (
        <AccessoryFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAccessory(null);
          }}
          accessory={editingAccessory}
          categories={categories}
          onSubmit={handleSubmit}
          isSaving={isCreating || isUpdating || isUploading}
        />
      )}

      {/* Delete confirmation — replaces the window.confirm the old tab used */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Accessory"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This removes it from the catalog permanently — quotations that already use it keep their prices, but it cannot be added to new ones.`
            : ''
        }
        confirmText={isDeleting ? 'Deleting…' : 'Delete'}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Form modal
// ---------------------------------------------------------------------------

interface AccessoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessory: Accessory | null;
  categories: Category[];
  onSubmit: (values: Partial<Accessory>, imageFile?: File) => void;
  isSaving: boolean;
}

function AccessoryFormModal({
  isOpen,
  onClose,
  accessory,
  categories,
  onSubmit,
  isSaving,
}: AccessoryFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: brands } = useGetActiveBrandsQuery();

  const [formData, setFormData] = useState<Partial<Accessory>>({
    name: accessory?.name || '',
    materialCode: accessory?.materialCode || '',
    categoryId: accessory?.categoryId,
    brandId: accessory?.brandId,
    mrp: accessory?.mrp || 0,
    discountPercentage: accessory?.discountPercentage || 0,
    widthMm: accessory?.widthMm,
    color: accessory?.color || '',
    active: accessory?.active ?? true,
    imageUrl: accessory?.imageUrl || '',
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Also clears a previously saved image so the PUT drops it (old form behaviour).
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, imageFile || undefined);
  };

  // Display only — the backend recomputes company price from MRP and discount.
  const companyPrice =
    formData.mrp && formData.discountPercentage
      ? formData.mrp - formData.mrp * (formData.discountPercentage / 100)
      : formData.mrp;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={accessory ? 'Edit Accessory' : 'Add Accessory'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Accessory Name <span className="text-error">*</span>
            </label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mullboy Wastebin"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Material Code</label>
            <input
              value={formData.materialCode}
              onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
              placeholder="e.g., ACC-001"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Category</label>
            <select
              value={formData.categoryId || ''}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : undefined })
              }
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
          <div>
            <label className={labelCls}>Brand</label>
            <select
              value={formData.brandId || ''}
              onChange={(e) =>
                setFormData({ ...formData, brandId: e.target.value ? Number(e.target.value) : undefined })
              }
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">-- Select Brand --</option>
              {(brands || []).map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              MRP (₹) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.mrp}
              onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
              placeholder="2600"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.discountPercentage}
              onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
              placeholder="0"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Company Price (₹)</label>
            <div className="h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-700 text-[13px] font-semibold text-success flex items-center">
              {companyPrice ? `₹${companyPrice.toLocaleString()}` : '₹0'}
            </div>
          </div>
          <div>
            <label className={labelCls}>Width (mm)</label>
            <input
              type="number"
              min="0"
              value={formData.widthMm || ''}
              onChange={(e) =>
                setFormData({ ...formData, widthMm: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="e.g., 300"
              className={inputCls}
            />
          </div>
        </div>

        {/* Image upload — two-step save: the file goes up after the entity POST/PUT succeeds */}
        <div>
          <label className={labelCls}>Accessory Image</label>
          <div className="space-y-3">
            {(imagePreview || formData.imageUrl) && (
              <div className="relative inline-block">
                <img
                  src={imagePreview || getImageUrl(formData.imageUrl)}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-background-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = IMG_FALLBACK;
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 hover:bg-error/80"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                {imagePreview || formData.imageUrl ? 'Change Image' : 'Upload Image'}
              </Button>
              <span className="text-xs text-text-500">Max 5MB, JPG/PNG</span>
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Color</label>
          <input
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="e.g., Silver, Black"
            className={inputCls}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="accessory-active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 text-primary-600 bg-background-900 border-background-600 rounded focus:ring-primary-600"
          />
          <label htmlFor="accessory-active" className="text-[12.5px] font-medium text-text-800">
            Active
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-background-600">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? 'Saving...' : accessory ? 'Update Accessory' : 'Create Accessory'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AccessoryManager;
