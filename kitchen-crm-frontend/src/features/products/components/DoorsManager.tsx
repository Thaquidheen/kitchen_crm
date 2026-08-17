/**
 * DoorsManager — Door Types tab of the product catalog in the HOCH table idiom (see
 * VendorsPage): one table card with a debounced server-side search toolbar, paginated via
 * useGetDoorsPaginatedQuery (the old tab was silently capped at 20 rows with no pager),
 * ConfirmDialog instead of window.confirm, and every write control gated to SUPER_ADMIN.
 * `mrp` is semantically the RATE PER SQ.FT of the door material.
 */

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, DoorOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetDoorsPaginatedQuery,
  useCreateDoorMutation,
  useUpdateDoorMutation,
  useDeleteDoorMutation,
} from '../productsAPI';
import type { DoorType } from '../types';
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

/** Keep in sync with the header row below — skeleton/error/empty rows span every column. */
const COL_COUNT = 7;

const PAGE_SIZE = 20;

export const DoorsManager = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const [page, setPage] = useState(0);
  const { draft, setDraft, search } = useDebouncedSearch(() => setPage(0));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoor, setEditingDoor] = useState<DoorType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DoorType | null>(null);

  const { data, isLoading, isError } = useGetDoorsPaginatedQuery({
    name: search || undefined,
    page,
    size: PAGE_SIZE,
  });

  // Deleting the last row of the last page leaves the page index past the end — walk back.
  useEffect(() => {
    if (data && page > 0 && page >= data.totalPages) {
      setPage(Math.max(0, data.totalPages - 1));
    }
  }, [data, page]);

  const [createDoor, { isLoading: isCreating }] = useCreateDoorMutation();
  const [updateDoor, { isLoading: isUpdating }] = useUpdateDoorMutation();
  const [deleteDoor, { isLoading: isDeleting }] = useDeleteDoorMutation();

  const doors: DoorType[] = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const handleSave = async (values: Partial<DoorType>) => {
    try {
      if (editingDoor) {
        await updateDoor({ ...editingDoor, ...values } as DoorType).unwrap();
        toast.success('Door type updated successfully');
      } else {
        await createDoor(values as Omit<DoorType, 'id'>).unwrap();
        toast.success('Door type created successfully');
      }
      setIsModalOpen(false);
      setEditingDoor(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save door type');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      // Delete returns the raw ApiResponse: a 200 with success:false means the door material
      // is in use (e.g. referenced by quotations) and must surface the server's message.
      const response = await deleteDoor(deleteTarget.id).unwrap();
      if (response.success === false) {
        toast.error(response.message || 'Failed to delete door type');
      } else {
        toast.success('Door type deleted successfully');
      }
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete door type');
    }
  };

  const handleToggleActive = async (door: DoorType) => {
    try {
      await updateDoor({ ...door, active: !door.active }).unwrap();
      toast.success(`Door type ${!door.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update door type');
    }
  };

  return (
    <div className="w-full">
      {/* Count + Add (the page shell owns the H1 and tab chips) */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[13px] text-text-700">
          {totalElements} door material{totalElements === 1 ? '' : 's'}
        </span>
        <div className="flex-1" />
        {isSuperAdmin && (
          <button
            onClick={() => {
              setEditingDoor(null);
              setIsModalOpen(true);
            }}
            className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
          >
            <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            Add Door Type
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
              placeholder="Search door types…"
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
                <th className={thClass}>Code</th>
                <th className={thClass}>Rate/Sq.Ft</th>
                <th className={thClass}>Discount %</th>
                <th className={thClass}>Company Rate</th>
                <th className={thClass}>Status</th>
                <th className={thActionsClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={COL_COUNT} />
              ) : isError ? (
                <ErrorRow cols={COL_COUNT} entity="door types" />
              ) : doors.length === 0 ? (
                <EmptyRow
                  cols={COL_COUNT}
                  filtered={!!search}
                  title="No door types yet"
                  sub="Add your first door material to start pricing shutters per sq.ft."
                />
              ) : (
                doors.map((door) => (
                  <tr
                    key={door.id}
                    className="border-t border-background-600 hover:bg-background-700 transition-colors"
                  >
                    <td className="px-3 py-[13px]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-text-700 shrink-0">
                          <DoorOpen size={15} />
                        </div>
                        <div className="text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[260px]">
                          {door.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                      {door.material || '—'}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] font-semibold text-text-900 tabular-nums whitespace-nowrap">
                      ₹{door.mrp.toLocaleString()}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 tabular-nums whitespace-nowrap">
                      {door.discountPercentage && door.discountPercentage > 0
                        ? `${door.discountPercentage}%`
                        : '—'}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] font-semibold text-text-900 tabular-nums whitespace-nowrap">
                      {door.companyPrice != null ? `₹${door.companyPrice.toLocaleString()}/sq.ft` : '—'}
                    </td>
                    <td className="px-3 py-[13px]">
                      <ActivePill active={door.active} />
                    </td>
                    <td className="px-3.5 py-[13px]">
                      {isSuperAdmin && (
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => handleToggleActive(door)}
                            title={door.active ? 'Deactivate' : 'Activate'}
                            disabled={isUpdating || isDeleting}
                            className={iconBtn}
                          >
                            {door.active ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingDoor(door);
                              setIsModalOpen(true);
                            }}
                            title="Edit"
                            disabled={isDeleting}
                            className={iconBtn}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(door)}
                            title="Delete"
                            disabled={isDeleting}
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

        <TableFooter
          shown={doors.length}
          total={totalElements}
          page={page}
          totalPages={totalPages}
          onPage={setPage}
        />
      </div>

      {/* Add/Edit modal */}
      {isModalOpen && (
        <DoorFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDoor(null);
          }}
          door={editingDoor}
          onSubmit={handleSave}
          isSaving={isCreating || isUpdating}
        />
      )}

      {/* Delete confirmation — replaces the window.confirm the old tab used */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Door Type"
        message={
          deleteTarget
            ? `Delete the door material "${deleteTarget.name}"? It disappears from the catalog and can no longer be picked in quotations — if it is already in use, the server will refuse and nothing changes.`
            : ''
        }
        confirmText={isDeleting ? 'Deleting…' : 'Delete'}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

interface DoorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  door: DoorType | null;
  onSubmit: (values: Partial<DoorType>) => void;
  isSaving: boolean;
}

function DoorFormModal({ isOpen, onClose, door, onSubmit, isSaving }: DoorFormModalProps) {
  const [formData, setFormData] = useState<Partial<DoorType>>({
    name: door?.name || '',
    material: door?.material || '',
    mrp: door?.mrp || 0,
    discountPercentage: door?.discountPercentage || 0,
    active: door?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const companyPrice =
    formData.mrp && formData.discountPercentage
      ? formData.mrp - formData.mrp * (formData.discountPercentage / 100)
      : formData.mrp;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={door ? 'Edit Door Type' : 'New Door Type'} size="md">
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelCls}>
                Door Material Name <span className="text-error">*</span>
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., SS 304, PU on Ply (Glossy)"
                className={inputCls}
              />
              <p className="text-xs text-text-500 mt-1">Example: Laminate on Ply (Law), Glass on SS</p>
            </div>

            <div>
              <label className={labelCls}>Material Code</label>
              <input
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="e.g., SS304, LAMPLY"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className={labelCls}>
                Rate per Sq.Ft (₹) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                placeholder="1000"
                className={inputCls}
              />
              <p className="text-xs text-text-500 mt-1">Price per square foot</p>
            </div>

            <div>
              <label className={labelCls}>Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discountPercentage}
                onChange={(e) =>
                  setFormData({ ...formData, discountPercentage: Number(e.target.value) })
                }
                placeholder="0"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Company Rate</label>
              <div className="h-[38px] px-3 flex items-center rounded-[10px] bg-background-900 border border-background-600 text-success font-semibold text-[13px] whitespace-nowrap">
                ₹{companyPrice ? companyPrice.toLocaleString() : '0'}/sq.ft
              </div>
            </div>
          </div>

          <div className="bg-primary-900/20 border border-primary-500/30 rounded-lg p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-semibold text-primary-400 mb-2">Pricing Reference (from Excel):</h4>
            <div className="text-xs text-text-600 space-y-1">
              <p>• SS 304: ₹1,000/sq.ft</p>
              <p>• PU on SS: ₹1,220/sq.ft</p>
              <p>• Laminate on Ply (High): ₹850/sq.ft</p>
              <p>• Laminate on Ply (Law): ₹450/sq.ft</p>
              <p>• Glass on SS: ₹1,450/sq.ft</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="door-active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-primary-600 bg-background-900 border-background-600 rounded focus:ring-primary-600"
            />
            <label htmlFor="door-active" className="text-[12.5px] font-medium text-text-800">
              Active
            </label>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {door ? 'Update Door Type' : 'Create Door Type'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default DoorsManager;
