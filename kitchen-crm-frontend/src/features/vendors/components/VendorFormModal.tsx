/**
 * VendorFormModal
 * Modal for adding/editing vendors
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateVendorMutation, useUpdateVendorMutation } from '@/features/vendors/vendorsAPI';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import toast from 'react-hot-toast';
import type { Vendor, VendorCreate } from '@/features/vendors/vendorsAPI';

const vendorSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  vendorType: z.string().min(1, 'Vendor type is required'),
  active: z.boolean().default(true),
  notes: z.string().optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

interface VendorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor?: Vendor | null;
}

export default function VendorFormModal({ isOpen, onClose, vendor }: VendorFormModalProps) {
  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendor ? {
      vendorName: vendor.vendorName,
      contactPerson: vendor.contactPerson || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
      vendorType: vendor.vendorType,
      active: vendor.active,
      notes: vendor.notes || '',
    } : {
      vendorName: '',
      vendorType: 'MATERIAL_SUPPLIER',
      active: true,
    },
  });

  const onSubmit = async (data: VendorFormData) => {
    try {
      const vendorData: VendorCreate = {
        vendorName: data.vendorName,
        contactPerson: data.contactPerson || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        vendorType: data.vendorType,
        active: data.active,
        notes: data.notes || undefined,
      };

      if (vendor) {
        await updateVendor({ id: vendor.id, vendor: vendorData }).unwrap();
        toast.success('Vendor updated successfully');
      } else {
        await createVendor(vendorData).unwrap();
        toast.success('Vendor created successfully');
      }

      onClose();
      reset();
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast.error(error?.data?.message || 'Failed to save vendor');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={vendor ? 'Edit Vendor' : 'Add Vendor'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Vendor Name *"
          {...register('vendorName')}
          error={errors.vendorName?.message}
        />

        <Input
          label="Contact Person"
          {...register('contactPerson')}
          error={errors.contactPerson?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone"
            {...register('phone')}
            error={errors.phone?.message}
          />

          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>

        <TextArea
          label="Address"
          {...register('address')}
          error={errors.address?.message}
          rows={3}
        />

        <Select
          label="Vendor Type *"
          {...register('vendorType')}
          error={errors.vendorType?.message}
        >
          <option value="MATERIAL_SUPPLIER">Material Supplier</option>
          <option value="LABOR_CONTRACTOR">Labor Contractor</option>
          <option value="TRANSPORT_SERVICE">Transport Service</option>
          <option value="APPLIANCE_VENDOR">Appliance Vendor</option>
          <option value="OTHER">Other</option>
        </Select>

        <Select
          label="Status"
          {...register('active')}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>

        <TextArea
          label="Notes"
          {...register('notes')}
          error={errors.notes?.message}
          rows={3}
        />

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isCreating || isUpdating} className="w-full sm:w-auto">
            {vendor ? (isUpdating ? 'Updating...' : 'Update Vendor') : (isCreating ? 'Creating...' : 'Create Vendor')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}






