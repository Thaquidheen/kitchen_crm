/**
 * DoorsManager Component
 * Manage door types with material rates per sq.ft
 */

import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, DoorOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useGetDoorsQuery, useCreateDoorMutation, useUpdateDoorMutation, useDeleteDoorMutation } from '../productsAPI';
import type { DoorType } from '../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export const DoorsManager = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDoor, setEditingDoor] = useState<DoorType | null>(null);

  const { data: doorsData, isLoading } = useGetDoorsQuery({
    name: search || undefined,
    page,
    size: 20,
  });

  const [createDoor, { isLoading: isCreating }] = useCreateDoorMutation();
  const [updateDoor, { isLoading: isUpdating }] = useUpdateDoorMutation();
  const [deleteDoor, { isLoading: isDeleting }] = useDeleteDoorMutation();

  const doors = doorsData || [];

  const handleSubmit = async (values: Partial<DoorType>) => {
    try {
      if (editingDoor) {
        await updateDoor({ ...editingDoor, ...values } as DoorType).unwrap();
        toast.success('Door type updated successfully');
      } else {
        await createDoor(values as Omit<DoorType, 'id'>).unwrap();
        toast.success('Door type created successfully');
      }
      setShowForm(false);
      setEditingDoor(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save door type');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteDoor(id).unwrap();
      toast.success('Door type deleted successfully');
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

  if (showForm || editingDoor) {
    return (
      <DoorForm
        initialValues={editingDoor || undefined}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingDoor(null);
        }}
        isLoading={isCreating || isUpdating}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="text-text-900 text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-text-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-text-900">Door Types</h2>
          <p className="text-xs sm:text-sm text-text-600 mt-1">{doors.length} door material{doors.length === 1 ? '' : 's'}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Add Door Type</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-text-500 w-4 h-4 sm:w-5 sm:h-5" />
        <Input
          type="text"
          placeholder="Search door types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 sm:pl-10 text-sm sm:text-base"
        />
      </div>

      {doors.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <DoorOpen className="w-12 h-12 sm:w-16 sm:h-16 text-text-500 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-text-600 mb-4">No door types found</p>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create First Door Type
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {doors.map((door) => (
            <Card
              key={door.id}
              className={`p-3 sm:p-4 ${door.active ? 'hover:border-primary-600' : 'opacity-60'}`}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-1 line-clamp-1">{door.name}</h3>
                  {door.material && <p className="text-xs sm:text-sm text-text-600 line-clamp-1">Material: {door.material}</p>}
                </div>
                <button
                  onClick={() => handleToggleActive(door)}
                  className={`p-1.5 sm:p-2 rounded-md flex-shrink-0 ${door.active ? 'text-success' : 'text-text-500'}`}
                  disabled={isUpdating || isDeleting}
                >
                  {door.active ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>

              <div className="bg-background-700 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">Rate per Sq.Ft:</span>
                  <span className="text-base sm:text-lg font-bold text-success">₹{door.mrp.toLocaleString()}</span>
                </div>
                {door.discountPercentage && door.discountPercentage > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-text-600">Discount:</span>
                    <span className="text-xs sm:text-sm text-success">{door.discountPercentage}%</span>
                  </div>
                )}
                {door.companyPrice && (
                  <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-background-600">
                    <span className="text-xs sm:text-sm font-medium text-text-700">Company Rate:</span>
                    <span className="text-sm sm:text-base font-bold text-success">₹{door.companyPrice.toLocaleString()}/sq.ft</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-3 border-t border-background-600">
                <Button variant="ghost" size="sm" onClick={() => setEditingDoor(door)} disabled={isDeleting} className="flex-1 text-xs sm:text-sm">
                  <Edit2 className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(door.id, door.name)}
                  disabled={isDeleting}
                  className="text-error flex-1 text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">Delete</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface DoorFormProps {
  initialValues?: DoorType;
  onSubmit: (values: Partial<DoorType>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function DoorForm({ initialValues, onSubmit, onCancel, isLoading }: DoorFormProps) {
  const [formData, setFormData] = useState<Partial<DoorType>>({
    name: initialValues?.name || '',
    material: initialValues?.material || '',
    mrp: initialValues?.mrp || 0,
    discountPercentage: initialValues?.discountPercentage || 0,
    active: initialValues?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const companyPrice = formData.mrp && formData.discountPercentage
    ? formData.mrp - (formData.mrp * (formData.discountPercentage / 100))
    : formData.mrp;

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-text-900 mb-4 sm:mb-6">
        {initialValues ? 'Edit Door Type' : 'New Door Type'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              Door Material Name <span className="text-error">*</span>
            </label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., SS 304, PU on Ply (Glossy)"
              className="text-sm sm:text-base"
            />
            <p className="text-xs text-text-500 mt-1">Example: Laminate on Ply (Law), Glass on SS</p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">Material Code</label>
            <Input
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              placeholder="e.g., SS304, LAMPLY"
              className="text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
              Rate per Sq.Ft (₹) <span className="text-error">*</span>
            </label>
            <Input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.mrp}
              onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
              placeholder="1000"
              className="text-sm sm:text-base"
            />
            <p className="text-xs text-text-500 mt-1">Price per square foot</p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">Discount (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.discountPercentage}
              onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
              placeholder="0"
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">Company Rate</label>
            <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-background-800 border border-background-600 rounded-md text-success font-semibold text-sm sm:text-base">
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
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 text-primary-600 bg-background-900 border-background-600 rounded focus:ring-primary-600"
          />
          <label htmlFor="active" className="text-xs sm:text-sm font-medium text-text-700">Active</label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-background-600">
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Saving...' : initialValues ? 'Update Door Type' : 'Create Door Type'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default DoorsManager;
