/**
 * ArchitectVisitFormModal
 * Modal for recording a visit to an architect
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRecordVisitMutation } from '../architectsAPI';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import type { Architect, ArchitectVisitCreate } from '../types';

const visitSchema = z.object({
  visitDate: z.string().min(1, 'Visit date is required'),
  notes: z.string().optional(),
  visitedBy: z.string().optional(),
});

type VisitFormData = z.infer<typeof visitSchema>;

interface ArchitectVisitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  architect: Architect;
}

export default function ArchitectVisitFormModal({ 
  isOpen, 
  onClose, 
  architect 
}: ArchitectVisitFormModalProps) {
  const [recordVisit, { isLoading }] = useRecordVisitMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VisitFormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      visitDate: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
      notes: '',
      visitedBy: '',
    },
  });

  const onSubmit = async (data: VisitFormData) => {
    try {
      const visitData: ArchitectVisitCreate = {
        architectId: architect.id,
        visitDate: new Date(data.visitDate).toISOString(),
        notes: data.notes || undefined,
        visitedBy: data.visitedBy || undefined,
      };

      await recordVisit({ id: architect.id, data: visitData }).unwrap();
      toast.success('Visit recorded successfully');
      onClose();
      reset();
    } catch (error: any) {
      console.error('Error recording visit:', error);
      toast.error(error?.data?.message || 'Failed to record visit');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Visit - ${architect.architectureName}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="visitDate"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-text-800 text-xs sm:text-sm font-medium mb-2">
                Visit Date & Time *
              </label>
              <input
                type="datetime-local"
                {...field}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-background-700 border border-background-600 rounded-lg text-text-900 focus:outline-none focus:ring-2 focus:border-primary-700 focus:ring-primary-700 w-full text-sm sm:text-base"
              />
              {errors.visitDate && (
                <p className="mt-1 text-xs sm:text-sm text-error">{errors.visitDate.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="visitedBy"
          control={control}
          render={({ field }) => (
            <Input
              label="Visited By"
              {...field}
              placeholder="Name of person who visited"
              error={errors.visitedBy?.message}
            />
          )}
        />

        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <TextArea
              label="Notes"
              {...field}
              placeholder="Add any notes about the visit..."
              rows={4}
              error={errors.notes?.message}
            />
          )}
        />

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Recording...' : 'Record Visit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}






