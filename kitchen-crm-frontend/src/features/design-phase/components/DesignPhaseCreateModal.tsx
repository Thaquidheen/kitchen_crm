import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { TextArea } from '../../../components/ui/TextArea';
import { Select } from '../../../components/ui/Select';
import { Palette, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { useGetCustomersQuery } from '@/features/customers/customersAPI';
import { useGetStaffQuery } from '@/features/staff/staffAPI';
import type { DesignPhaseCreateRequest, DesignPhaseUpdateRequest, DesignPhase } from '../types';

const designPhaseSchema = z.object({
  customerId: z.number().min(1, 'Please select a customer'),
  quotationId: z.number().optional(),
  designRequirements: z.string().optional(),
  staffAssignedId: z.number().optional(),
  designStatus: z.string().optional(),
});

type DesignPhaseFormValues = z.infer<typeof designPhaseSchema>;

export interface DesignPhaseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DesignPhaseCreateRequest | DesignPhaseUpdateRequest) => void;
  initialData?: DesignPhase;
  customerId?: number;
  mode?: 'create' | 'update';
  title?: string;
}

export const DesignPhaseCreateModal: React.FC<DesignPhaseCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  customerId,
  mode = 'create',
  title
}) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = currentUser?.role === 'ROLE_SUPER_ADMIN';
  
  const { data: customersData, isLoading: customersLoading } = useGetCustomersQuery({
    page: 0,
    size: 100,
    sortBy: 'name',
    sortDir: 'asc'
  });

  const { data: staffList = [], isLoading: staffLoading } = useGetStaffQuery(undefined, {
    skip: !isSuperAdmin, // Only fetch if super admin
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<DesignPhaseFormValues>({
    resolver: zodResolver(designPhaseSchema),
    defaultValues: {
      customerId: customerId || initialData?.customerId || 0,
      quotationId: initialData?.quotationId || 0,
      designRequirements: initialData?.designRequirements || '',
      staffAssignedId: initialData?.staffAssignedId || 0,
      designStatus: initialData?.designStatus || 'PLANNING',
    },
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setValue('customerId', initialData.customerId);
      setValue('quotationId', initialData.quotationId || 0);
      setValue('designRequirements', initialData.designRequirements || '');
      setValue('staffAssignedId', initialData.staffAssignedId || 0);
      setValue('designStatus', initialData.designStatus || 'PLANNING');
    } else if (customerId) {
      setValue('customerId', customerId);
    }
  }, [initialData, customerId, setValue]);

  const customers = customersData || [];
  const availableStaff = staffList.filter(staff => staff.active);
  const selectedStaffId = watch('staffAssignedId');

  const handleFormSubmit = async (data: DesignPhaseFormValues) => {
    try {
      // Transform form data to the appropriate request format
      const requestData = {
        customerId: data.customerId,
        quotationId: data.quotationId || undefined,
        designRequirements: data.designRequirements,
        staffAssignedId: data.staffAssignedId || undefined,
        ...(mode === 'update' && initialData ? { id: initialData.id } : {}),
        ...(mode === 'update' ? { designStatus: data.designStatus } : {})
      };
      
      await onSubmit(requestData);
      toast.success(`Design phase ${mode === 'update' ? 'updated' : 'created'} successfully!`);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(`Failed to ${mode === 'update' ? 'update' : 'create'} design phase`);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const modalTitle = title || (mode === 'update' ? 'Update Design Phase' : 'Create Design Phase');
  const submitButtonText = mode === 'update' ? 'Update Design Phase' : 'Create Design Phase';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Customer Selection - Only show in create mode */}
        {mode === 'create' && (
          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">
              Customer *
            </label>
            <Select
              {...register('customerId', { valueAsNumber: true })}
              disabled={customersLoading}
            >
              <option value={0}>Select a customer...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.email}
                </option>
              ))}
            </Select>
            {errors.customerId && (
              <p className="mt-1 text-sm text-error">{errors.customerId.message}</p>
            )}
          </div>
        )}

        {/* Quotation ID */}
        <div>
          <label className="block text-sm font-medium text-text-700 mb-2">
            Quotation ID (Optional)
          </label>
          <Input
            {...register('quotationId', { valueAsNumber: true })}
            type="number"
            placeholder="Enter quotation ID..."
            min="0"
          />
          {errors.quotationId && (
            <p className="mt-1 text-sm text-error">{errors.quotationId.message}</p>
          )}
        </div>

        {/* Design Requirements */}
        <div>
          <label className="block text-sm font-medium text-text-700 mb-2">
            Design Requirements
          </label>
          <TextArea
            {...register('designRequirements')}
            placeholder="Describe the design requirements..."
            rows={4}
          />
          {errors.designRequirements && (
            <p className="mt-1 text-sm text-error">{errors.designRequirements.message}</p>
          )}
        </div>

        {/* Staff Assignment */}
        {isSuperAdmin && (
          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">
              Assign Staff *
            </label>
            <Select
              {...register('staffAssignedId', { valueAsNumber: true })}
              disabled={staffLoading}
            >
              <option value={0}>Select a staff member...</option>
              {availableStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} - {staff.email}
                </option>
              ))}
            </Select>
            {errors.staffAssignedId && (
              <p className="mt-1 text-sm text-error">{errors.staffAssignedId.message}</p>
            )}
            <p className="mt-1 text-xs text-text-500">
              Select a staff member to assign this design phase
            </p>
          </div>
        )}

        {/* Design Status */}
        <div>
          <label className="block text-sm font-medium text-text-700 mb-2">
            Design Status
          </label>
          <Select {...register('designStatus')}>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING_SUPERADMIN_APPROVAL">Pending Approval</option>
            <option value="APPROVED_BY_ADMIN">Approved by Admin</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="FEEDBACK_RECEIVED">Feedback Received</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
            <option value="APPROVED">Approved</option>
            <option value="FROZEN">Frozen</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          {errors.designStatus && (
            <p className="mt-1 text-sm text-error">{errors.designStatus.message}</p>
          )}
        </div>

        {/* Selected Staff Info */}
        {selectedStaffId && selectedStaffId > 0 && (
          <div className="bg-primary-100 p-4 rounded-lg">
            <h4 className="font-medium text-primary-900 mb-2">Selected Staff</h4>
            {(() => {
              const selectedStaff = availableStaff.find(s => s.id === selectedStaffId);
              return selectedStaff ? (
                <div className="text-sm text-primary-800">
                  <p><strong>Name:</strong> {selectedStaff.name}</p>
                  <p><strong>Email:</strong> {selectedStaff.email}</p>
                  <p><strong>Phone:</strong> {selectedStaff.phoneNumber || 'N/A'}</p>
                  <p><strong>Status:</strong> {selectedStaff.active ? 'Active' : 'Inactive'}</p>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700"
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};