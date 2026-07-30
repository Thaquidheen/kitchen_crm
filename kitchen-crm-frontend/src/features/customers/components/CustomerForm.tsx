/**
 * CustomerForm
 * HOCH ERP New/Edit Customer form: grouped sections (Customer details / Project / Lead),
 * kitchen-type chips, lead-source details panel, status + next-follow-up row, notes.
 * Rendered inside CustomerFormModal's 580px panel; footer is sticky via the modal layout.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useGetCustomerByIdQuery,
} from '../../customers/customersAPI';
import { useCreateReminderMutation } from '@/app/baseApi';
import type { Customer, CustomerCreate, CustomerStatus, LeadSourceType } from '../../customers/types';
import { SELECTABLE_LEAD_SOURCES, LEAD_SOURCE_LABELS, isReferralSource } from '../../customers/leadSource';

const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  contact: z.string().min(5, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  place: z.string().optional().or(z.literal('')),
  sqft: z.string().optional().or(z.literal('')),
  status: z
    .enum(['LEAD', 'POTENTIAL', 'DESIGN_STAGE', 'QUOTE_GIVEN', 'FOLLOW_UP', 'NEGOTIATIONS', 'CONFIRMED', 'LOST'])
    .optional(),
  leadSourceType: z
    .enum(['NONE', 'ARCHITECT', 'MANUAL', 'ONLINE', 'WALK_IN', 'SCOUTING', 'BUILDER_REFERRAL', 'MANUAL_REFERRAL', 'CONSULTED'])
    .optional(),
  referralName: z.string().optional().or(z.literal('')),
  referralFirm: z.string().optional().or(z.literal('')),
  referralContact: z.string().optional().or(z.literal('')),
  referralEmail: z.string().optional().or(z.literal('')),
  referralLocation: z.string().optional().or(z.literal('')),
  followUpNotes: z.string().optional().or(z.literal('')),
  nextFollowUpDate: z.string().optional().or(z.literal('')),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

const KITCHEN_TYPE_OPTIONS = ['Modular', 'L-Shape', 'U-Shape', 'Island', 'Parallel', 'Wardrobe'];

const STATUS_OPTIONS: Array<{ value: CustomerStatus; label: string }> = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'POTENTIAL', label: 'Potential' },
  { value: 'DESIGN_STAGE', label: 'Design Stage' },
  { value: 'QUOTE_GIVEN', label: 'Quote Given' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
  { value: 'NEGOTIATIONS', label: 'Negotiations' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'LOST', label: 'Lost' },
];

export interface CustomerFormProps {
  customerId?: number;
  onSuccess?: (customer: Customer) => void;
  onCancel?: () => void;
  showStatusSelector?: boolean;
}

const inputCls =
  'w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500';
const textareaCls =
  'w-full px-3 py-2.5 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 resize-none';
const labelCls = 'block text-[12.5px] font-medium text-text-800 mb-1.5';
const sectionLabelCls =
  'text-[10.5px] font-semibold tracking-[0.09em] uppercase text-text-500 mb-3';

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customerId,
  onSuccess,
  onCancel,
}) => {
  const isEdit = typeof customerId === 'number';

  const { data: existingCustomer, isFetching: isLoadingCustomer } = useGetCustomerByIdQuery(
    customerId as number,
    { skip: !isEdit }
  );

  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
  const [createReminder] = useCreateReminderMutation();

  const [kitchenTypes, setKitchenTypes] = useState<string[]>([]);

  const defaultValues: CustomerFormValues = useMemo(
    () => ({
      name: existingCustomer?.name ?? '',
      contact: existingCustomer?.contact ?? '',
      email: existingCustomer?.email ?? '',
      address: existingCustomer?.address ?? '',
      place: existingCustomer?.place ?? '',
      sqft: existingCustomer?.sqft ?? '',
      status: existingCustomer?.status ?? 'LEAD',
      leadSourceType: existingCustomer?.leadSourceType ?? 'NONE',
      referralName: existingCustomer?.referralName ?? '',
      referralFirm: existingCustomer?.referralFirm ?? '',
      referralContact: existingCustomer?.referralContact ?? '',
      referralEmail: existingCustomer?.referralEmail ?? '',
      referralLocation: existingCustomer?.referralLocation ?? '',
      followUpNotes: existingCustomer?.followUpNotes ?? '',
      nextFollowUpDate: '',
    }),
    [existingCustomer]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const leadSourceType = watch('leadSourceType');
  const showDetails = isReferralSource(leadSourceType as LeadSourceType);
  const detailsLabel = leadSourceType
    ? `${LEAD_SOURCE_LABELS[leadSourceType as LeadSourceType]} details`
    : 'Source details';

  // Sync when existing customer loads (edit mode)
  useEffect(() => {
    if (isEdit && existingCustomer) {
      reset(defaultValues, { keepDirty: false });
      setKitchenTypes(
        (existingCustomer.kitchenTypes ?? '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      );
    }
  }, [isEdit, existingCustomer, reset, defaultValues]);

  const toggleKitchenType = (t: string) => {
    setKitchenTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };
  // Preserve custom values from older records so they are not silently dropped
  const extraKitchenTypes = kitchenTypes.filter((t) => !KITCHEN_TYPE_OPTIONS.includes(t));

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      const withDetails = isReferralSource(values.leadSourceType as LeadSourceType);
      const payloadBase = {
        name: values.name,
        contact: values.contact,
        email: values.email || undefined,
        address: values.address || undefined,
        place: values.place || undefined,
        sqft: values.sqft || undefined,
        kitchenTypes: kitchenTypes.length ? kitchenTypes.join(', ') : undefined,
        followUpNotes: values.followUpNotes || undefined,
        status: values.status,
        leadSourceType: values.leadSourceType,
        referralName: withDetails ? values.referralName || undefined : undefined,
        referralFirm: withDetails ? values.referralFirm || undefined : undefined,
        referralContact: withDetails ? values.referralContact || undefined : undefined,
        referralEmail: withDetails ? values.referralEmail || undefined : undefined,
        referralLocation: withDetails ? values.referralLocation || undefined : undefined,
      };

      if (isEdit) {
        const res = await updateCustomer({ id: customerId as number, ...payloadBase } as Customer).unwrap();
        toast.success('Customer updated');
        onSuccess?.(res);
      } else {
        const res = await createCustomer(payloadBase as CustomerCreate).unwrap();
        // Schedule the first follow-up as a reminder (bell notifies at 10:00 that day)
        if (values.nextFollowUpDate && (res as any)?.id) {
          try {
            await createReminder({
              customerId: (res as any).id,
              title: `Follow up: ${values.name}`,
              remindAt: `${values.nextFollowUpDate}T10:00:00`,
            }).unwrap();
          } catch {
            toast.error('Customer saved, but the follow-up reminder could not be created');
          }
        }
        toast.success('Customer created');
        onSuccess?.(res as unknown as Customer);
        reset();
        setKitchenTypes([]);
      }
    } catch (e: any) {
      toast.error(e?.data?.message || 'Operation failed');
    }
  };

  const disabled = isCreating || isUpdating || isLoadingCustomer;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
        {/* ===== Customer details ===== */}
        <section>
          <div className={sectionLabelCls}>Customer details</div>
          <div className="space-y-3.5">
            <div>
              <label className={labelCls}>
                Name <span className="text-error">*</span>
              </label>
              <input className={inputCls} placeholder="Customer name" {...register('name')} disabled={disabled} />
              {errors.name && <p className="text-error text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls}>
                  Phone <span className="text-error">*</span>
                </label>
                <input className={inputCls} placeholder="Phone number" {...register('contact')} disabled={disabled} />
                {errors.contact && <p className="text-error text-xs mt-1">{errors.contact.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} placeholder="name@example.com" {...register('email')} disabled={disabled} />
                {errors.email && <p className="text-error text-xs mt-1">{errors.email.message as string}</p>}
              </div>
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <textarea className={textareaCls} rows={2} placeholder="Street, City, ..." {...register('address')} disabled={disabled} />
            </div>
          </div>
        </section>

        {/* ===== Project ===== */}
        <section>
          <div className={sectionLabelCls}>Project</div>
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls}>Place</label>
                <input className={inputCls} placeholder="Town / City" {...register('place')} disabled={disabled} />
              </div>
              <div>
                <label className={labelCls}>Area (sqft)</label>
                <input className={inputCls} placeholder="e.g., 1200" {...register('sqft')} disabled={disabled} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Kitchen types</label>
              <div className="flex flex-wrap gap-1.5">
                {[...KITCHEN_TYPE_OPTIONS, ...extraKitchenTypes].map((t) => {
                  const on = kitchenTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleKitchenType(t)}
                      className={`px-2.5 py-1.5 rounded-[9px] text-[12.5px] border transition-colors ${
                        on
                          ? 'border-primary-600 text-primary-600 font-semibold'
                          : 'border-background-600 bg-background-900 text-text-700 hover:border-background-500 hover:text-text-900 font-medium'
                      }`}
                      style={
                        on
                          ? { background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)' }
                          : undefined
                      }
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ===== Lead ===== */}
        <section>
          <div className={sectionLabelCls}>Lead</div>
          <div className="space-y-3.5">
            <div>
              <label className={labelCls}>Lead source</label>
              <select className={inputCls} {...register('leadSourceType')} disabled={disabled}>
                {SELECTABLE_LEAD_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-[11.5px] text-text-500 mt-1">Used for filtering and sorting only.</p>
            </div>

            {showDetails && (
              <div className="rounded-[12px] border border-background-600 bg-background-700 p-3.5 space-y-3">
                <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-text-500">
                  {detailsLabel}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Name</label>
                    <input className={inputCls} placeholder="Name" {...register('referralName')} disabled={disabled} />
                  </div>
                  <div>
                    <label className={labelCls}>Firm name</label>
                    <input className={inputCls} placeholder="Firm / company" {...register('referralFirm')} disabled={disabled} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input className={inputCls} placeholder="Phone number" {...register('referralContact')} disabled={disabled} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input className={inputCls} placeholder="name@example.com" {...register('referralEmail')} disabled={disabled} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input className={inputCls} placeholder="Location" {...register('referralLocation')} disabled={disabled} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} {...register('status')} disabled={disabled}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              {!isEdit && (
                <div>
                  <label className={labelCls}>Next follow-up</label>
                  <input type="date" className={inputCls} {...register('nextFollowUpDate')} disabled={disabled} />
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                className={textareaCls}
                rows={2}
                placeholder="Anything worth remembering about this customer..."
                {...register('followUpNotes')}
                disabled={disabled}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 flex items-center justify-end gap-2.5 px-6 py-4 border-t border-background-600 bg-background-800 rounded-b-2xl">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700 hover:text-text-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="btn-raised-accent inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
        >
          {disabled ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Customer'}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
