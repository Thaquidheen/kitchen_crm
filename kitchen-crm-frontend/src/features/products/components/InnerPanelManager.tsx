import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetInnerPanelTypesQuery,
  useCreateInnerPanelTypeMutation,
  useUpdateInnerPanelTypeMutation,
  useDeleteInnerPanelTypeMutation,
} from '../productsAPI';
import type { InnerPanelType } from '../types';

export const InnerPanelManager: React.FC = () => {
  const { data: innerPanels, isLoading } = useGetInnerPanelTypesQuery();
  const [createInnerPanel, { isLoading: isCreating }] = useCreateInnerPanelTypeMutation();
  const [updateInnerPanel, { isLoading: isUpdating }] = useUpdateInnerPanelTypeMutation();
  const [deleteInnerPanel, { isLoading: isDeleting }] = useDeleteInnerPanelTypeMutation();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InnerPanelType | null>(null);
  const [formData, setFormData] = useState({ name: '', ratePerSqft: '', multiplier: '1.0', description: '' });

  const resetForm = () => {
    setFormData({ name: '', ratePerSqft: '', multiplier: '1.0', description: '' });
    setShowForm(false);
    setEditing(null);
  };

  const handleEdit = (item: InnerPanelType) => {
    setEditing(item);
    setFormData({
      name: item.name,
      ratePerSqft: String(item.ratePerSqft),
      multiplier: String(item.multiplier),
      description: item.description || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      ratePerSqft: parseFloat(formData.ratePerSqft),
      multiplier: parseFloat(formData.multiplier),
      description: formData.description || undefined,
      active: true,
    };

    try {
      if (editing) {
        await updateInnerPanel({ ...payload, id: editing.id } as InnerPanelType).unwrap();
        toast.success('Inner panel type updated');
      } else {
        await createInnerPanel(payload as Omit<InnerPanelType, 'id'>).unwrap();
        toast.success('Inner panel type created');
      }
      resetForm();
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save inner panel type');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete inner panel type "${name}"?`)) return;
    try {
      const response = await deleteInnerPanel(id).unwrap();
      if (response.success === false) {
        toast.error(response.message || 'Failed to delete');
      } else {
        toast.success('Inner panel type deleted');
      }
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete');
    }
  };

  const handleToggleActive = async (item: InnerPanelType) => {
    try {
      await updateInnerPanel({ ...item, active: !item.active }).unwrap();
      toast.success(`Inner panel type ${!item.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update');
    }
  };

  if (showForm) {
    return (
      <div>
        <div className="mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-text-900">
            {editing ? 'Edit Inner Panel Type' : 'New Inner Panel Type'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="bg-background-800 border border-background-600 rounded-lg p-4 space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background-700 border border-background-600 rounded-md text-text-900 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-700 mb-1">Rate per Sqft *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.ratePerSqft}
                onChange={(e) => setFormData({ ...formData, ratePerSqft: e.target.value })}
                className="w-full px-3 py-2 bg-background-700 border border-background-600 rounded-md text-text-900 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-700 mb-1">Multiplier *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.multiplier}
                onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                className="w-full px-3 py-2 bg-background-700 border border-background-600 rounded-md text-text-900 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-background-700 border border-background-600 rounded-md text-text-900 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-text-600 hover:bg-background-700 rounded-md">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-text-900 rounded-md font-medium"
            >
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-background-800 border border-background-600 rounded-lg p-3 sm:p-4 animate-pulse">
            <div className="h-5 sm:h-6 bg-background-700 rounded w-1/3 mb-2"></div>
            <div className="h-3 sm:h-4 bg-background-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-text-900">Inner Panel Types</h2>
          <p className="text-xs sm:text-sm text-text-600 mt-1">
            {innerPanels?.length || 0} inner panel type{innerPanels?.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-text-900 rounded-md transition-colors text-sm sm:text-base font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Inner Panel</span>
        </button>
      </div>

      {!innerPanels || innerPanels.length === 0 ? (
        <div className="bg-background-800 border border-background-600 rounded-lg p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-text-600 mb-4">No inner panel types found</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-text-900 rounded-md transition-colors text-sm sm:text-base font-medium"
          >
            <Plus className="w-4 h-4" />
            Create First Inner Panel Type
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {innerPanels.map((item) => (
            <div
              key={item.id}
              className={`bg-background-800 border rounded-lg p-3 sm:p-4 transition-colors ${
                item.active ? 'border-background-600 hover:border-primary-600' : 'border-background-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-text-900 mb-1 line-clamp-1">{item.name}</h3>
                  <p className="text-xs sm:text-sm text-text-600 line-clamp-2">
                    {item.description || 'No description'}
                  </p>
                  <p className="text-xs sm:text-sm text-primary-400 font-medium mt-1">
                    Rs. {item.ratePerSqft.toFixed(2)}/sqft x {item.multiplier}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                      item.active
                        ? 'text-success hover:bg-success/20'
                        : 'text-text-500 hover:bg-background-700'
                    }`}
                    title={item.active ? 'Active' : 'Inactive'}
                    disabled={isUpdating || isDeleting}
                  >
                    {item.active ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-3 border-t border-background-600">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-text-900 hover:bg-background-700 rounded-md transition-colors flex-1 justify-center"
                  disabled={isDeleting}
                >
                  <Edit2 className="w-3 h-3" />
                  <span className="hidden xs:inline">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-error hover:bg-error/20 rounded-md transition-colors flex-1 justify-center"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden xs:inline">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InnerPanelManager;
