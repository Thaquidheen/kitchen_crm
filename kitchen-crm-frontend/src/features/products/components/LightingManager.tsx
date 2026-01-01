/**
 * LightingManager Component
 * Manage lighting products (LED profiles, drivers, connectors, sensors)
 */

import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Lightbulb } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetLightProfilesQuery,
  useCreateLightProfileMutation,
  useUpdateLightProfileMutation,
  useDeleteLightProfileMutation,
  useGetDriversQuery,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useDeleteDriverMutation,
  useGetConnectorsQuery,
  useCreateConnectorMutation,
  useUpdateConnectorMutation,
  useDeleteConnectorMutation,
  useGetSensorsQuery,
  useCreateSensorMutation,
  useUpdateSensorMutation,
  useDeleteSensorMutation,
} from '../lightingAPI';
import type { LightProfile, Driver, Connector, Sensor } from '../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

type LightingType = 'profiles' | 'drivers' | 'connectors' | 'sensors';

export const LightingManager = () => {
  const [activeTab, setActiveTab] = useState<LightingType>('profiles');

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-text-900">Lighting Products</h2>
        <p className="text-xs sm:text-sm text-text-600 mt-1">Manage LED profiles, drivers, connectors, and sensors</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-background-600">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-2">
          {(['profiles', 'drivers', 'connectors', 'sensors'] as LightingType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-text-600 hover:text-text-900 border-b-2 border-transparent'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'profiles' && <LightProfilesTab />}
      {activeTab === 'drivers' && <DriversTab />}
      {activeTab === 'connectors' && <ConnectorsTab />}
      {activeTab === 'sensors' && <SensorsTab />}
    </div>
  );
};

function LightProfilesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LightProfile | null>(null);

  const { data: profiles, isLoading } = useGetLightProfilesQuery();
  const [create, { isLoading: isCreating }] = useCreateLightProfileMutation();
  const [update, { isLoading: isUpdating }] = useUpdateLightProfileMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteLightProfileMutation();

  const handleSubmit = async (values: Partial<LightProfile>) => {
    try {
      if (editing) {
        await update({ ...editing, ...values } as LightProfile).unwrap();
        toast.success('Light profile updated');
      } else {
        await create(values as Omit<LightProfile, 'id'>).unwrap();
        toast.success('Light profile created');
      }
      setShowForm(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save light profile');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteItem(id).unwrap();
      toast.success('Deleted successfully');
    } catch (e: any) {
      toast.error('Failed to delete');
    }
  };

  const handleToggleActive = async (item: LightProfile) => {
    try {
      await update({ ...item, active: !item.active }).unwrap();
      toast.success(`Light profile ${!item.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error('Failed to update');
    }
  };

  if (showForm || editing) {
    return (
      <LightingForm
        initialValues={editing || undefined}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditing(null);
        }}
        isLoading={isCreating || isUpdating}
        type="Light Profile"
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
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Add Light Profile</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {!profiles || profiles.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <Lightbulb className="w-12 h-12 sm:w-16 sm:h-16 text-text-500 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-text-600 mb-4">No light profiles found</p>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">Create First Light Profile</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {profiles.map((item) => (
            <Card key={item.id} className={`p-3 sm:p-4 ${item.active ? 'hover:border-primary-600' : 'opacity-60'}`}>
              <div className="flex justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-text-900 line-clamp-1">{String((item as any).profileType ?? (item as any).name ?? '')}</h3>
                <button
                  onClick={() => handleToggleActive(item)}
                  className={`p-1.5 sm:p-2 rounded-md flex-shrink-0 ${item.active ? 'text-success' : 'text-text-500'}`}
                >
                  {item.active ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
              {(item as any).description && <p className="text-xs sm:text-sm text-text-600 mb-2 sm:mb-3 line-clamp-2">{(item as any).description}</p>}
              <div className="bg-background-700 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">Price/Meter:</span>
                  <span className="text-xs sm:text-sm font-semibold text-text-900">₹{Number((item as any).pricePerMeter ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">MRP:</span>
                  <span className="text-xs sm:text-sm font-semibold text-text-900">₹{Number((item as any).mrp ?? 0).toLocaleString()}</span>
                </div>
                {(item as any).discountPercentage ? (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-text-600">Discount:</span>
                    <span className="text-xs sm:text-sm text-success">{Number((item as any).discountPercentage).toLocaleString()}%</span>
                  </div>
                ) : null}
                {(item as any).companyPrice ? (
                  <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-background-600">
                    <span className="text-xs sm:text-sm font-medium text-text-700">Company Price:</span>
                    <span className="text-sm sm:text-base font-bold text-success">₹{Number((item as any).companyPrice).toLocaleString()}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2 pt-2 sm:pt-3 border-t border-background-600">
                <Button variant="ghost" size="sm" onClick={() => setEditing(item)} className="flex-1 text-xs sm:text-sm">
                  <Edit2 className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">Edit</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, (item as any).name || String((item as any).profileType || 'item'))} className="text-error flex-1 text-xs sm:text-sm">
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
}

function DriversTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);

  const { data: drivers, isLoading } = useGetDriversQuery();
  const [create, { isLoading: isCreating }] = useCreateDriverMutation();
  const [update, { isLoading: isUpdating }] = useUpdateDriverMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteDriverMutation();

  const handleSubmit = async (values: Partial<Driver>) => {
    try {
      if (editing) {
        await update({ ...editing, ...values } as Driver).unwrap();
        toast.success('Driver updated');
      } else {
        await create(values as Omit<Driver, 'id'>).unwrap();
        toast.success('Driver created');
      }
      setShowForm(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save driver');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteItem(id).unwrap();
      toast.success('Deleted successfully');
    } catch (e: any) {
      toast.error('Failed to delete');
    }
  };

  const handleToggleActive = async (item: Driver) => {
    try {
      await update({ ...item, active: !item.active }).unwrap();
      toast.success(`Driver ${!item.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error('Failed to update');
    }
  };

  if (showForm || editing) {
    return (
      <LightingForm
        initialValues={editing || undefined}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditing(null);
        }}
        isLoading={isCreating || isUpdating}
        type="Driver"
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
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Add Driver</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {!drivers || drivers.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-text-600 mb-4">No drivers found</p>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">Create First Driver</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {drivers.map((item) => (
            <Card key={item.id} className={`p-3 sm:p-4 ${item.active ? 'hover:border-primary-600' : 'opacity-60'}`}>
              <div className="flex justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-text-900">{`${(item as any).wattage ?? ''}W`}</h3>
                <button
                  onClick={() => handleToggleActive(item)}
                  className={`p-1.5 sm:p-2 rounded-md flex-shrink-0 ${item.active ? 'text-success' : 'text-text-500'}`}
                >
                  {item.active ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
              {(item as any).description && <p className="text-xs sm:text-sm text-text-600 mb-2 sm:mb-3 line-clamp-2">{(item as any).description}</p>}
              <div className="bg-background-700 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">Price:</span>
                  <span className="text-xs sm:text-sm font-semibold text-text-900">₹{Number((item as any).price ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">MRP:</span>
                  <span className="text-xs sm:text-sm font-semibold text-text-900">₹{Number((item as any).mrp ?? 0).toLocaleString()}</span>
                </div>
                {(item as any).discountPercentage ? (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-text-600">Discount:</span>
                    <span className="text-xs sm:text-sm text-success">{Number((item as any).discountPercentage).toLocaleString()}%</span>
                  </div>
                ) : null}
                {(item as any).companyPrice ? (
                  <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-background-600">
                    <span className="text-xs sm:text-sm font-medium text-text-700">Company Price:</span>
                    <span className="text-sm sm:text-base font-bold text-success">₹{Number((item as any).companyPrice).toLocaleString()}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2 pt-2 sm:pt-3 border-t border-background-600">
                <Button variant="ghost" size="sm" onClick={() => setEditing(item)} className="flex-1 text-xs sm:text-sm">
                  <Edit2 className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">Edit</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, (item as any).name || `${(item as any).wattage}W`)} className="text-error flex-1 text-xs sm:text-sm">
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
}

interface LightingFormProps {
  initialValues?: any;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  type: string;
}

function LightingForm({ initialValues, onSubmit, onCancel, isLoading, type }: LightingFormProps) {
  const [formData, setFormData] = useState({
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    active: initialValues?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-text-900 mb-4 sm:mb-6">
        {initialValues ? `Edit ${type}` : `New ${type}`}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">
            Name <span className="text-error">*</span>
          </label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={`e.g., LED Strip 5m`}
            className="text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-700 mb-1.5 sm:mb-2">Description</label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            className="text-sm sm:text-base"
          />
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
            {isLoading ? 'Saving...' : initialValues ? `Update ${type}` : `Create ${type}`}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ConnectorsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Connector | null>(null);

  const { data: connectors, isLoading } = useGetConnectorsQuery();
  const [create, { isLoading: isCreating }] = useCreateConnectorMutation();
  const [update, { isLoading: isUpdating }] = useUpdateConnectorMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteConnectorMutation();

  const handleSubmit = async (values: Partial<Connector>) => {
    try {
      if (editing) {
        await update({ ...editing, ...values } as Connector).unwrap();
        toast.success('Connector updated');
      } else {
        await create(values as Omit<Connector, 'id'>).unwrap();
        toast.success('Connector created');
      }
      setShowForm(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save connector');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteItem(id).unwrap();
      toast.success('Deleted successfully');
    } catch (e: any) {
      toast.error('Failed to delete');
    }
  };

  const handleToggleActive = async (item: Connector) => {
    try {
      await update({ ...item, active: !item.active }).unwrap();
      toast.success(`Connector ${!item.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error('Failed to update');
    }
  };

  if (showForm || editing) {
    return (
      <LightingForm
        initialValues={editing || undefined}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditing(null);
        }}
        isLoading={isCreating || isUpdating}
        type="Connector"
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
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Add Connector</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {!connectors || connectors.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-text-600 mb-4">No connectors found</p>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">Create First Connector</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {connectors.map((item) => (
            <Card key={item.id} className={`p-3 sm:p-4 ${item.active ? 'hover:border-primary-600' : 'opacity-60'}`}>
              <div className="flex justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-text-900 line-clamp-1">{String((item as any).type ?? '')}</h3>
                <button
                  onClick={() => handleToggleActive(item)}
                  className={`p-1.5 sm:p-2 rounded-md flex-shrink-0 ${item.active ? 'text-success' : 'text-text-500'}`}
                >
                  {item.active ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
              {(item as any).description && <p className="text-xs sm:text-sm text-text-600 mb-2 sm:mb-3 line-clamp-2">{(item as any).description}</p>}
              <div className="bg-background-700 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">Price/Piece:</span>
                  <span className="text-xs sm:text-sm font-semibold text-text-900">₹{Number((item as any).pricePerPiece ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">MRP:</span>
                  <span className="text-xs sm:text-sm font-semibold text-text-900">₹{Number((item as any).mrp ?? 0).toLocaleString()}</span>
                </div>
                {(item as any).discountPercentage ? (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-text-600">Discount:</span>
                    <span className="text-xs sm:text-sm text-success">{Number((item as any).discountPercentage).toLocaleString()}%</span>
                  </div>
                ) : null}
                {(item as any).companyPrice ? (
                  <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-background-600">
                    <span className="text-xs sm:text-sm font-medium text-text-700">Company Price:</span>
                    <span className="text-sm sm:text-base font-bold text-success">₹{Number((item as any).companyPrice).toLocaleString()}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2 pt-2 sm:pt-3 border-t border-background-600">
                <Button variant="ghost" size="sm" onClick={() => setEditing(item)} className="flex-1 text-xs sm:text-sm">
                  <Edit2 className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">Edit</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, (item as any).name || String((item as any).type || 'Connector'))} className="text-error flex-1 text-xs sm:text-sm">
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
}

function SensorsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sensor | null>(null);

  const { data: sensors, isLoading } = useGetSensorsQuery();
  const [create, { isLoading: isCreating }] = useCreateSensorMutation();
  const [update, { isLoading: isUpdating }] = useUpdateSensorMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteSensorMutation();

  const handleSubmit = async (values: Partial<Sensor>) => {
    try {
      if (editing) {
        await update({ ...editing, ...values } as Sensor).unwrap();
        toast.success('Sensor updated');
      } else {
        await create(values as Omit<Sensor, 'id'>).unwrap();
        toast.success('Sensor created');
      }
      setShowForm(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to save sensor');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteItem(id).unwrap();
      toast.success('Deleted successfully');
    } catch (e: any) {
      toast.error('Failed to delete');
    }
  };

  const handleToggleActive = async (item: Sensor) => {
    try {
      await update({ ...item, active: !item.active }).unwrap();
      toast.success(`Sensor ${!item.active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error('Failed to update');
    }
  };

  if (showForm || editing) {
    return (
      <LightingForm
        initialValues={editing || undefined}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditing(null);
        }}
        isLoading={isCreating || isUpdating}
        type="Sensor"
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
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Add Sensor</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {!sensors || sensors.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-text-600 mb-4">No sensors found</p>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">Create First Sensor</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {sensors.map((item) => (
            <Card key={item.id} className={`p-3 sm:p-4 ${item.active ? 'hover:border-primary-600' : 'opacity-60'}`}>
              <div className="flex justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-text-900 line-clamp-1">{String((item as any).type ?? '')}</h3>
                <button
                  onClick={() => handleToggleActive(item)}
                  className={`p-1.5 sm:p-2 rounded-md flex-shrink-0 ${item.active ? 'text-success' : 'text-text-500'}`}
                >
                  {item.active ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
              {(item as any).description && <p className="text-xs sm:text-sm text-text-600 mb-2 sm:mb-3 line-clamp-2">{(item as any).description}</p>}
              <div className="bg-background-700 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">Price/Piece:</span>
                  <span className="text-xs sm:text-sm font-semibold text-text-900">₹{Number((item as any).pricePerPiece ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-text-600">MRP:</span>
                  <span className="text-xs sm:text-sm font-semibold text-text-900">₹{Number((item as any).mrp ?? 0).toLocaleString()}</span>
                </div>
                {(item as any).discountPercentage ? (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-text-600">Discount:</span>
                    <span className="text-xs sm:text-sm text-success">{Number((item as any).discountPercentage).toLocaleString()}%</span>
                  </div>
                ) : null}
                {(item as any).companyPrice ? (
                  <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-background-600">
                    <span className="text-xs sm:text-sm font-medium text-text-700">Company Price:</span>
                    <span className="text-sm sm:text-base font-bold text-success">₹{Number((item as any).companyPrice).toLocaleString()}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2 pt-2 sm:pt-3 border-t border-background-600">
                <Button variant="ghost" size="sm" onClick={() => setEditing(item)} className="flex-1 text-xs sm:text-sm">
                  <Edit2 className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">Edit</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, (item as any).name || String((item as any).type || 'Sensor'))} className="text-error flex-1 text-xs sm:text-sm">
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
}

export default LightingManager;
