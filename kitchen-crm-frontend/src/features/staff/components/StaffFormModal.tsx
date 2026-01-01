/**
 * StaffFormModal
 * Modal for adding/editing staff members
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateStaffMutation, useUpdateStaffMutation } from '../staffAPI';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import type { Staff, StaffCreate } from '../types';

const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().optional(),
});

const updateStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
});

type StaffFormData = z.infer<typeof createStaffSchema> | z.infer<typeof updateStaffSchema>;

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: Staff | null;
}

export default function StaffFormModal({ isOpen, onClose, staff }: StaffFormModalProps) {
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staff ? updateStaffSchema : createStaffSchema),
    defaultValues: {
      name: '',
      email: '',
      ...(staff ? {} : { password: '' }),
      phoneNumber: '',
    },
  });

  // Reset form when staff changes
  useEffect(() => {
    if (staff) {
      reset({
        name: staff.name,
        email: staff.email,
        phoneNumber: staff.phoneNumber || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        password: '',
        phoneNumber: '',
      });
    }
  }, [staff, reset]);

  const onSubmit = async (data: StaffFormData) => {
    try {
      if (staff) {
        // Update staff - password updates not supported through this endpoint
        const updateData = {
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber || undefined,
        };

        await updateStaff({ id: staff.id, data: updateData }).unwrap();
        toast.success('Staff updated successfully');
      } else {
        // Create staff - password is required
        if (!data.password || data.password.length < 6) {
          toast.error('Password is required and must be at least 6 characters');
          return;
        }

        const staffData: StaffCreate = {
          name: data.name,
          email: data.email,
          password: data.password,
          phoneNumber: data.phoneNumber || undefined,
        };

        await createStaff(staffData).unwrap();
        toast.success('Staff created successfully. Login credentials have been sent to their email.');
      }

      onClose();
      reset();
    } catch (error: any) {
      console.error('Error saving staff:', error);
      toast.error(error?.data?.message || error?.message || 'Failed to save staff');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={staff ? 'Edit Staff' : 'Add Staff'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name *"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Enter staff name"
        />

        <Input
          label="Email *"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="Enter email address"
        />

        {!staff && (
          <Input
            label="Password *"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            placeholder="Enter password (min 6 characters)"
          />
        )}

        <Input
          label="Phone Number"
          {...register('phoneNumber')}
          error={errors.phoneNumber?.message}
          placeholder="Enter phone number"
        />

        {!staff && (
          <div className="text-xs sm:text-sm text-text-600 bg-background-800 p-3 rounded-lg border border-background-600">
            <p className="font-medium mb-1">Note:</p>
            <p>Login credentials will be automatically sent to the staff member's email address.</p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isCreating || isUpdating} className="w-full sm:w-auto">
            {staff ? (isUpdating ? 'Updating...' : 'Update Staff') : (isCreating ? 'Creating...' : 'Create Staff')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

