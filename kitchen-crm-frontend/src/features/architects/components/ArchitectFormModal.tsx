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
import { partnerTypeLabel, partnerTypeOf } from '../../architects/types';
import type { Architect, ArchitectCreate, PartnerType } from '../../architects/types';

const architectSchema = z.object({
  architectureName: z.string().min(1, 'Name is required'),
  partnerType: z.enum(['ARCHITECT', 'BUILDER']),
  firm: z.string().optional(),
  contactNumber: z.string().optional(),
  principalArchitectName: z.string().optional(),
});

type ArchitectFormData = z.infer<typeof architectSchema>;

interface ArchitectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  architect?: Architect | null;
  /** Pre-selects the type when adding — e.g. "Add" from the Builders filter. */
  defaultType?: PartnerType;
  /** Fired with the created record, so callers can link it without a refetch. */
  onCreated?: (architect: Architect) => void;
}

export default function ArchitectFormModal({
  isOpen,
  onClose,
  architect,
  defaultType,
  onCreated,
}: ArchitectFormModalProps) {
  const [createArchitect, { isLoading: isCreating }] = useCreateArchitectMutation();
  const [updateArchitect, { isLoading: isUpdating }] = useUpdateArchitectMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ArchitectFormData>({
    resolver: zodResolver(architectSchema),
    defaultValues: architect ? {
      architectureName: architect.architectureName,
      partnerType: partnerTypeOf(architect),
      firm: architect.firm || '',
      contactNumber: architect.contactNumber || '',
      principalArchitectName: architect.principalArchitectName || '',
    } : {
      architectureName: '',
      partnerType: defaultType ?? 'ARCHITECT',
      firm: '',
      contactNumber: '',
      principalArchitectName: '',
    },
  });

  const selectedType = watch('partnerType');
  const typeLabel = partnerTypeLabel(selectedType);

  const onSubmit = async (data: ArchitectFormData) => {
    try {
      const architectData: ArchitectCreate = {
        architectureName: data.architectureName,
        partnerType: data.partnerType,
        firm: data.firm || undefined,
        contactNumber: data.contactNumber || undefined,
        principalArchitectName: data.principalArchitectName || undefined,
      };

      if (architect) {
        await updateArchitect({ id: architect.id, data: architectData }).unwrap();
        toast.success(`${typeLabel} updated successfully`);
      } else {
        const created = await createArchitect(architectData).unwrap();
        onCreated?.(created);
        toast.success(`${typeLabel} created successfully`);
      }

      onClose();
      reset();
    } catch (error: any) {
      console.error('Error saving architect:', error);
      toast.error(error?.data?.message || `Failed to save ${typeLabel.toLowerCase()}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={architect ? `Edit ${typeLabel}` : `Add ${typeLabel}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-text-800 text-sm font-medium mb-2">Type</label>
          <div className="flex gap-2">
            {(['ARCHITECT', 'BUILDER'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('partnerType', t, { shouldDirty: true })}
                className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  selectedType === t
                    ? 'border-primary-600 text-primary-600 bg-primary-600/10'
                    : 'border-background-600 bg-background-700 text-text-700 hover:text-text-900'
                }`}
              >
                {partnerTypeLabel(t)}
              </button>
            ))}
          </div>
        </div>

        <Input
          label={selectedType === 'BUILDER' ? 'Builder Name *' : 'Architecture Name *'}
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
            {architect
              ? (isUpdating ? 'Updating...' : `Update ${typeLabel}`)
              : (isCreating ? 'Creating...' : `Create ${typeLabel}`)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}




