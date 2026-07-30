import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { useCreateCustomerMutation, useUpdateCustomerMutation, useGetCustomerByIdQuery } from '../../customers/customersAPI';
import { useGetAllArchitectsQuery } from '../../architects/architectsAPI';
import { Button } from '@/components/ui/Button';
import type { Customer, CustomerCreate, CustomerStatus } from '../../customers/types';
import { SELECTABLE_LEAD_SOURCES, isReferralSource } from '../../customers/leadSource';

const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z
    .string()
    .email('Invalid email')
    .optional()
    .or(z.literal('')),
  contact: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  kitchenTypes: z.string().optional().or(z.literal('')),
  sqft: z.string().optional().or(z.literal('')),
  place: z.string().optional().or(z.literal('')),
  followUpNotes: z.string().optional().or(z.literal('')),
  status: z.enum(['LEAD', 'POTENTIAL', 'DESIGN_STAGE', 'QUOTE_GIVEN', 'FOLLOW_UP', 'NEGOTIATIONS', 'CONFIRMED', 'LOST']).optional(),
  // Lead tracking fields
  leadSourceType: z.enum(['NONE', 'ARCHITECT', 'MANUAL', 'ONLINE', 'WALK_IN', 'SCOUTING', 'BUILDER_REFERRAL', 'MANUAL_REFERRAL']).optional(),
  architectId: z.number().optional(),
  manualLeadName: z.string().optional().or(z.literal('')),
  manualLeadContact: z.string().optional().or(z.literal('')),
  // Referrer details (optional)
  referralName: z.string().optional().or(z.literal('')),
  referralContact: z.string().optional().or(z.literal('')),
  referralLocation: z.string().optional().or(z.literal('')),
  referralDesignation: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    // Architect is the only source that requires a selection; referral fields are optional.
    if (data.leadSourceType === 'ARCHITECT') {
      return data.architectId !== undefined && data.architectId !== null;
    }
    return true;
  },
  {
    message: 'Please select an architect',
    path: ['architectId'],
  }
);

export type CustomerFormValues = z.infer<typeof customerSchema>;

export interface CustomerFormProps {
  customerId?: number;
  onSuccess?: (customer: Customer) => void;
  onCancel?: () => void;
  showStatusSelector?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customerId,
  onSuccess,
  onCancel,
  showStatusSelector = true,
}) => {
  const isEdit = typeof customerId === 'number';

  const { data: existingCustomer, isFetching: isLoadingCustomer } = useGetCustomerByIdQuery(
    customerId as number,
    { skip: !isEdit }
  );

  const { data: architects = [], isLoading: isLoadingArchitects } = useGetAllArchitectsQuery();

  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  const defaultValues: CustomerFormValues = useMemo(
    () => ({
      name: existingCustomer?.name ?? '',
      email: existingCustomer?.email ?? '',
      contact: existingCustomer?.contact ?? '',
      address: existingCustomer?.address ?? '',
      kitchenTypes: existingCustomer?.kitchenTypes ?? '',
      sqft: existingCustomer?.sqft ?? '',
      place: existingCustomer?.place ?? '',
      followUpNotes: existingCustomer?.followUpNotes ?? '',
      status: existingCustomer?.status ?? 'LEAD',
      leadSourceType: existingCustomer?.leadSourceType ?? 'NONE',
      architectId: existingCustomer?.architectId,
      manualLeadName: existingCustomer?.manualLeadName ?? '',
      manualLeadContact: existingCustomer?.manualLeadContact ?? '',
      referralName: existingCustomer?.referralName ?? '',
      referralContact: existingCustomer?.referralContact ?? '',
      referralLocation: existingCustomer?.referralLocation ?? '',
      referralDesignation: existingCustomer?.referralDesignation ?? '',
    }),
    [existingCustomer]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const leadSourceType = watch('leadSourceType');

  // Clear fields not relevant to the chosen lead source
  useEffect(() => {
    const clearReferral = () => {
      setValue('referralName', '');
      setValue('referralContact', '');
      setValue('referralLocation', '');
      setValue('referralDesignation', '');
    };
    if (leadSourceType === 'ARCHITECT') {
      setValue('manualLeadName', '');
      setValue('manualLeadContact', '');
      clearReferral();
    } else if (isReferralSource(leadSourceType)) {
      setValue('architectId', undefined);
      setValue('manualLeadName', '');
      setValue('manualLeadContact', '');
    } else {
      // NONE, ONLINE, WALK_IN, SCOUTING
      setValue('architectId', undefined);
      setValue('manualLeadName', '');
      setValue('manualLeadContact', '');
      clearReferral();
    }
  }, [leadSourceType, setValue]);

  // Sync when existingCustomer loads
  useEffect(() => {
    if (isEdit && existingCustomer) {
      reset(defaultValues, { keepDirty: false });
    }
  }, [isEdit, existingCustomer, reset, defaultValues]);

  // Warn on browser/tab close if dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      const isReferral = isReferralSource(values.leadSourceType);
      const leadFields = {
        leadSourceType: values.leadSourceType,
        architectId: values.leadSourceType === 'ARCHITECT' ? values.architectId : undefined,
        referralName: isReferral ? (values.referralName || undefined) : undefined,
        referralContact: isReferral ? (values.referralContact || undefined) : undefined,
        referralLocation: isReferral ? (values.referralLocation || undefined) : undefined,
        referralDesignation: isReferral ? (values.referralDesignation || undefined) : undefined,
      };

      if (isEdit) {
        const payload = {
          id: customerId as number,
          name: values.name,
          email: values.email || undefined,
          contact: values.contact || undefined,
          address: values.address || undefined,
          kitchenTypes: values.kitchenTypes || undefined,
          sqft: values.sqft || undefined,
          place: values.place || undefined,
          followUpNotes: values.followUpNotes || undefined,
          status: values.status,
          ...leadFields,
        } as Customer;
        const res = await updateCustomer(payload).unwrap();
        toast.success('Customer updated');
        onSuccess?.(res);
      } else {
        const createPayload: CustomerCreate = {
          name: values.name,
          email: values.email || undefined,
          contact: values.contact || undefined,
          address: values.address || undefined,
          kitchenTypes: values.kitchenTypes || undefined,
          sqft: values.sqft || undefined,
          place: values.place || undefined,
          followUpNotes: values.followUpNotes || undefined,
          status: values.status,
          ...leadFields,
        };
        const res = await createCustomer(createPayload).unwrap();
        toast.success('Customer created');
        onSuccess?.(res as unknown as Customer);
        reset();
      }
    } catch (e: any) {
      const msg = e?.data?.message || 'Operation failed';
      toast.error(msg);
    }
  };


  // Force refresh to clear any cached references
  const disabled = isCreating || isUpdating || isLoadingCustomer;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
          style={{ color: '#000000' }}
          placeholder="Customer name"
          {...register('name')}
          disabled={disabled}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
          style={{ color: '#000000' }}
          placeholder="name@example.com"
          {...register('email')}
          disabled={disabled}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>
        )}
      </div>

      {/* Contact */}
      <div>
        <label className="block text-sm font-medium mb-1">Contact</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
          style={{ color: '#000000' }}
          placeholder="Phone number"
          {...register('contact')}
          disabled={disabled}
        />
      </div>

      {/* SQFT */}
      <div>
        <label className="block text-sm font-medium mb-1">SQFT</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
          style={{ color: '#000000' }}
          placeholder="e.g., 1200"
          {...register('sqft')}
          disabled={disabled}
        />
      </div>

      {/* Place */}
      <div>
        <label className="block text-sm font-medium mb-1">Place</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
          style={{ color: '#000000' }}
          placeholder="Town / City"
          {...register('place')}
          disabled={disabled}
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea
          className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
          style={{ color: '#000000' }}
          rows={3}
          placeholder="Street, City, ..."
          {...register('address')}
          disabled={disabled}
        />
      </div>


      {/* Kitchen Types */}
      <div>
        <label className="block text-sm font-medium mb-1">Kitchen Types</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
          style={{ color: '#000000' }}
          placeholder="e.g., Modular, L-Shape, U-Shape"
          {...register('kitchenTypes')}
          disabled={disabled}
        />
        <p className="text-gray-400 text-xs mt-1">Comma separated values</p>
      </div>

      {/* Lead Source Section */}
      <div className="border-t border-gray-600 pt-4">
        <label className="block text-sm font-medium mb-2">Lead Source</label>
        
        <div className="space-y-2 mb-3">
          {SELECTABLE_LEAD_SOURCES.map((source) => (
            <label key={source.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={source.value}
                {...register('leadSourceType')}
                disabled={disabled}
                className="cursor-pointer"
              />
              <span>{source.label}</span>
            </label>
          ))}
        </div>

        {/* Architect Selection */}
        {leadSourceType === 'ARCHITECT' && (
          <div>
            <label className="block text-sm font-medium mb-1">Architect</label>
            <select
              className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
              style={{ color: '#000000' }}
              {...register('architectId', { valueAsNumber: true })}
              disabled={disabled || isLoadingArchitects}
            >
              <option value="">Select an architect...</option>
              {architects.map((architect) => (
                <option key={architect.id} value={architect.id}>
                  {architect.architectureName}
                  {architect.firm ? ` - ${architect.firm}` : ''}
                  {architect.principalArchitectName ? ` (${architect.principalArchitectName})` : ''}
                </option>
              ))}
            </select>
            {errors.architectId && (
              <p className="text-red-500 text-sm mt-1">{errors.architectId.message}</p>
            )}
          </div>
        )}

        {/* Referrer details (Builder Referral / Manual Referral) */}
        {isReferralSource(leadSourceType) && (
          <div className="space-y-3">
            <p className="text-gray-400 text-xs">Referrer details (all optional)</p>
            <div>
              <label className="block text-sm font-medium mb-1">Referrer Name</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
                style={{ color: '#000000' }}
                placeholder="Name"
                {...register('referralName')}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Referrer Number</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
                style={{ color: '#000000' }}
                placeholder="Phone number"
                {...register('referralContact')}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Referrer Location</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
                style={{ color: '#000000' }}
                placeholder="Location"
                {...register('referralLocation')}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Referrer Designation</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
                style={{ color: '#000000' }}
                placeholder="Designation"
                {...register('referralDesignation')}
                disabled={disabled}
              />
            </div>
          </div>
        )}
        {errors.leadSourceType && (
          <p className="text-red-500 text-sm mt-1">{errors.leadSourceType.message}</p>
        )}
      </div>

      {/* Follow Up Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Follow Up Notes</label>
        <textarea
          className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
          style={{ color: '#000000' }}
          rows={3}
          placeholder="Last call, next follow-up date, remarks..."
          {...register('followUpNotes')}
          disabled={disabled}
        />
      </div>

      {/* Status (only if shown) */}
      {showStatusSelector && (
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            className="w-full rounded-md border border-gray-600 bg-white text-black p-2 !text-black"
            style={{ color: '#000000' }}
            {...register('status')}
            disabled={disabled}
          >
            {([
              { value: 'LEAD', label: 'Lead' },
              { value: 'POTENTIAL', label: 'Potential' },
              { value: 'DESIGN_STAGE', label: 'Design Stage' },
              { value: 'QUOTE_GIVEN', label: 'Quote Given' },
              { value: 'FOLLOW_UP', label: 'Follow Up' },
              { value: 'NEGOTIATIONS', label: 'Negotiations' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'LOST', label: 'Lost' },
            ] as Array<{ value: CustomerStatus; label: string }>).map((s) => (
              <option value={s.value} key={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={disabled}
          isLoading={disabled}
        >
          {isEdit ? 'Update' : 'Create'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (!isDirty) return onCancel?.();
            // Simple confirm for unsaved changes
            if (window.confirm('You have unsaved changes. Discard and leave?')) {
              onCancel?.();
            }
          }}
          disabled={disabled}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;


