import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { TextArea } from '../../../components/ui/TextArea';
import { Package } from 'lucide-react';
import type { ProductionInstallationCreateRequest } from '../types';

const productionCreateSchema = z.object({
  customerId: z.number().min(1, 'Customer ID is required'),
  projectManagerAssigned: z.string().optional(),
  installationTeamLead: z.string().optional(),
  estimatedCompletionDate: z.string().optional(),
  installationNotes: z.string().optional(),
});

type ProductionCreateFormValues = z.infer<typeof productionCreateSchema>;

export interface ProductionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductionInstallationCreateRequest) => Promise<void>;
  customerId: number;
  title?: string;
}

export const ProductionCreateModal: React.FC<ProductionCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customerId,
  title = 'Create Production Installation',
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProductionCreateFormValues>({
    resolver: zodResolver(productionCreateSchema),
    defaultValues: {
      customerId: customerId,
      projectManagerAssigned: '',
      installationTeamLead: '',
      estimatedCompletionDate: '',
      installationNotes: '',
    },
  });

  // Update form when customerId changes
  useEffect(() => {
    setValue('customerId', customerId);
  }, [customerId, setValue]);

  const handleFormSubmit = async (data: ProductionCreateFormValues) => {
    try {
      // Transform form data to the request format
      const requestData: ProductionInstallationCreateRequest = {
        customerId: data.customerId,
        projectManagerAssigned: data.projectManagerAssigned || undefined,
        installationTeamLead: data.installationTeamLead || undefined,
        estimatedCompletionDate: data.estimatedCompletionDate || undefined,
        installationNotes: data.installationNotes || undefined,
      };

      await onSubmit(requestData);
      toast.success('Production installation created successfully!');
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to create production installation');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Customer ID (hidden, pre-filled) */}
        <input type="hidden" {...register('customerId', { valueAsNumber: true })} />

        {/* Project Manager */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Manager (Optional)
          </label>
          <Input
            {...register('projectManagerAssigned')}
            type="text"
            placeholder="Enter project manager name..."
          />
          {errors.projectManagerAssigned && (
            <p className="mt-1 text-sm text-red-400">{errors.projectManagerAssigned.message}</p>
          )}
        </div>

        {/* Team Lead */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Team Lead (Optional)
          </label>
          <Input
            {...register('installationTeamLead')}
            type="text"
            placeholder="Enter team lead name..."
          />
          {errors.installationTeamLead && (
            <p className="mt-1 text-sm text-red-400">{errors.installationTeamLead.message}</p>
          )}
        </div>

        {/* Estimated Completion Date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Estimated Completion Date (Optional)
          </label>
          <Input
            {...register('estimatedCompletionDate')}
            type="date"
          />
          {errors.estimatedCompletionDate && (
            <p className="mt-1 text-sm text-red-400">{errors.estimatedCompletionDate.message}</p>
          )}
        </div>

        {/* Installation Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Installation Notes (Optional)
          </label>
          <TextArea
            {...register('installationNotes')}
            placeholder="Enter installation notes..."
            rows={4}
          />
          {errors.installationNotes && (
            <p className="mt-1 text-sm text-red-400">{errors.installationNotes.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-red-700 hover:bg-red-600 text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            Create Production Installation
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductionCreateModal;

