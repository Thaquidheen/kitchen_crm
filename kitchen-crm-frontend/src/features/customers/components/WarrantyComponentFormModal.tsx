import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  useCreateWarrantyComponentMutation,
  useUpdateWarrantyComponentMutation,
} from '../../../services/warrantyCardAPI';
import type { WarrantyComponent } from '../../../services/warrantyCardAPI';
import toast from 'react-hot-toast';

export interface WarrantyComponentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  component?: WarrantyComponent | null;
}

export const WarrantyComponentFormModal: React.FC<WarrantyComponentFormModalProps> = ({
  isOpen,
  onClose,
  component,
}) => {
  const [createComponent, { isLoading: isCreating }] = useCreateWarrantyComponentMutation();
  const [updateComponent, { isLoading: isUpdating }] = useUpdateWarrantyComponentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<{ componentName: string; warrantyPeriod: string; active?: boolean }>({
    defaultValues: {
      componentName: '',
      warrantyPeriod: '',
      active: true,
    },
  });

  useEffect(() => {
    if (component) {
      reset({
        componentName: component.componentName,
        warrantyPeriod: component.warrantyPeriod,
        active: component.active,
      });
    } else {
      reset({
        componentName: '',
        warrantyPeriod: '',
        active: true,
      });
    }
  }, [component, reset, isOpen]);

  const onSubmit = async (data: { componentName: string; warrantyPeriod: string; active?: boolean }) => {
    try {
      if (component?.id) {
        // Update existing component
        await updateComponent({
          id: component.id,
          data: {
            componentName: data.componentName,
            warrantyPeriod: data.warrantyPeriod,
            active: data.active !== undefined ? data.active : component.active,
          },
        }).unwrap();
        toast.success('Warranty component updated successfully');
      } else {
        // Create new component
        await createComponent({
          componentName: data.componentName,
          warrantyPeriod: data.warrantyPeriod,
          displayOrder: 0,
          active: data.active !== undefined ? data.active : true,
        }).unwrap();
        toast.success('Warranty component added successfully');
      }
      onClose();
      reset();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save warranty component');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={component?.id ? 'Edit Warranty Component' : 'Add Warranty Component'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Component Name"
          {...register('componentName', { required: 'Component name is required' })}
          error={errors.componentName?.message}
          placeholder="e.g., Modular Cabinet, Hinges & Drawer Channels"
        />

        <Input
          label="Warranty Period"
          {...register('warrantyPeriod', { required: 'Warranty period is required' })}
          error={errors.warrantyPeriod?.message}
          placeholder="e.g., 15 Years, 12 months, 1 year"
          helperText="Enter warranty period as number or text (e.g., '15 Years', '12 months', '1 year')"
        />

        {component?.id && (
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('active')}
                className="w-4 h-4 text-red-700 bg-black-700 border-black-600 rounded focus:ring-red-700 focus:ring-2"
              />
              <span className="text-white-700">Active</span>
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating
              ? 'Saving...'
              : component?.id
              ? 'Update Component'
              : 'Add Component'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WarrantyComponentFormModal;

