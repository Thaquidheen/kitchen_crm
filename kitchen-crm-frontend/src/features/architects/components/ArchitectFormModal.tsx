/**
 * ArchitectFormModal
 * Modal for adding/editing architects
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateArchitectMutation, useUpdateArchitectMutation } from '../../architects/architectsAPI';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import type { Architect, ArchitectCreate } from '../../architects/types';

const architectSchema = z.object({
  architectureName: z.string().min(1, 'Architecture name is required'),
  firm: z.string().optional(),
  contactNumber: z.string().optional(),
  principalArchitectName: z.string().optional(),
});

type ArchitectFormData = z.infer<typeof architectSchema>;

interface ArchitectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  architect?: Architect | null;
}

export default function ArchitectFormModal({ isOpen, onClose, architect }: ArchitectFormModalProps) {
  const [createArchitect, { isLoading: isCreating }] = useCreateArchitectMutation();
  const [updateArchitect, { isLoading: isUpdating }] = useUpdateArchitectMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ArchitectFormData>({
    resolver: zodResolver(architectSchema),
    defaultValues: architect ? {
      architectureName: architect.architectureName,
      firm: architect.firm || '',
      contactNumber: architect.contactNumber || '',
      principalArchitectName: architect.principalArchitectName || '',
    } : {
      architectureName: '',
      firm: '',
      contactNumber: '',
      principalArchitectName: '',
    },
  });

  const onSubmit = async (data: ArchitectFormData) => {
    try {
      const architectData: ArchitectCreate = {
        architectureName: data.architectureName,
        firm: data.firm || undefined,
        contactNumber: data.contactNumber || undefined,
        principalArchitectName: data.principalArchitectName || undefined,
      };

      if (architect) {
        await updateArchitect({ id: architect.id, data: architectData }).unwrap();
        toast.success('Architect updated successfully');
      } else {
        await createArchitect(architectData).unwrap();
        toast.success('Architect created successfully');
      }

      onClose();
      reset();
    } catch (error: any) {
      console.error('Error saving architect:', error);
      toast.error(error?.data?.message || 'Failed to save architect');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={architect ? 'Edit Architect' : 'Add Architect'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Architecture Name *"
          {...register('architectureName')}
          error={errors.architectureName?.message}
        />

        <Input
          label="Firm"
          {...register('firm')}
          error={errors.firm?.message}
        />

        <Input
          label="Contact Number"
          {...register('contactNumber')}
          error={errors.contactNumber?.message}
        />

        <Input
          label="Principal Architect Name"
          {...register('principalArchitectName')}
          error={errors.principalArchitectName?.message}
        />

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isCreating || isUpdating} className="w-full sm:w-auto">
            {architect ? (isUpdating ? 'Updating...' : 'Update Architect') : (isCreating ? 'Creating...' : 'Create Architect')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}




