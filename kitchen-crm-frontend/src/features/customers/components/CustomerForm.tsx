/**
 * CustomerForm
 * HOCH ERP New/Edit Customer form: grouped sections (Customer details / Project / Lead),
 * kitchen-type chips, lead source + status row, project network panel, notes.
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
import { Plus } from 'lucide-react';
import type {
  Customer,
  CustomerCreate,
  CustomerStatus,
  ProjectNetworkMember,
  ProjectNetworkMemberType,
} from '../../customers/types';
import {
  PROJECT_NETWORK_LABELS,
  SELECTABLE_LEAD_SOURCES,
  customerLeadSource,
  customerProjectNetwork,
  isLinkedMember,
} from '../../customers/leadSource';
import { ProjectNetworkRow } from './ProjectNetworkRow';
import type { ProjectNetworkRowDraft } from './ProjectNetworkRow';

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
  // The channel they arrived through — one value, so it registers straight onto the form.
  leadSourceType: z
    .enum(['NONE', 'ARCHITECT', 'BUILDER', 'MANUAL', 'ONLINE', 'WALK_IN', 'SCOUTING', 'BUILDER_REFERRAL', 'MANUAL_REFERRAL', 'CONSULTED'])
    .optional(),
  // The project network is a list, held in component state alongside the form (see
  // projectNetwork below) exactly as kitchenTypes is — the zod schema stays flat.
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

const newRowKey = () =>
  globalThis.crypto?.randomUUID?.() ?? `pn-${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
  const [projectNetwork, setProjectNetwork] = useState<ProjectNetworkRowDraft[]>([]);
  const [networkErrors, setNetworkErrors] = useState<Record<string, string>>({});

  const defaultValues: CustomerFormValues = useMemo(
    () => ({
      name: existingCustomer?.name ?? '',
      contact: existingCustomer?.contact ?? '',
      email: existingCustomer?.email ?? '',
      address: existingCustomer?.address ?? '',
      place: existingCustomer?.place ?? '',
      sqft: existingCustomer?.sqft ?? '',
      status: existingCustomer?.status ?? 'LEAD',
      leadSourceType: existingCustomer ? customerLeadSource(existingCustomer) : 'NONE',
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
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
    mode: 'onBlur',
  });

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
      setProjectNetwork(
        customerProjectNetwork(existingCustomer).map((r) => ({ ...r, key: newRowKey() }))
      );
      setNetworkErrors({});
    }
  }, [isEdit, existingCustomer, reset, defaultValues]);

  const addMember = () =>
    setProjectNetwork((prev) => [...prev, { key: newRowKey(), memberType: 'ARCHITECT' }]);

  const updateMember = (key: string, patch: Partial<ProjectNetworkMember>) => {
    setProjectNetwork((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setNetworkErrors(({ [key]: _drop, ...rest }) => rest);
  };

  const removeMember = (key: string) => {
    setProjectNetwork((prev) => prev.filter((r) => r.key !== key));
    setNetworkErrors(({ [key]: _drop, ...rest }) => rest);
  };

  // Changing the type clears the row body, so an architect link can't survive a switch to
  // Referral, and an architect id can't survive a switch to Builder.
  const changeRowType = (key: string, memberType: ProjectNetworkMemberType) => {
    setProjectNetwork((prev) =>
      prev.map((r) => (r.key !== key ? r : { key: r.key, id: r.id, memberType }))
    );
    setNetworkErrors(({ [key]: _drop, ...rest }) => rest);
  };

  const validateNetwork = (rows: ProjectNetworkRowDraft[]): Record<string, string> => {
    const errs: Record<string, string> = {};
    rows.forEach((r) => {
      if (isLinkedMember(r.memberType) && !r.architectId) {
        errs[r.key] = `Select an existing ${PROJECT_NETWORK_LABELS[r.memberType].toLowerCase()} or create a new one`;
      } else if (!isLinkedMember(r.memberType) && !r.referralName?.trim()) {
        errs[r.key] = 'Name is required';
      }
    });
    return errs;
  };

  const toggleKitchenType = (t: string) => {
    setKitchenTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };
  // Preserve custom values from older records so they are not silently dropped
  const extraKitchenTypes = kitchenTypes.filter((t) => !KITCHEN_TYPE_OPTIONS.includes(t));

  const onSubmit = async (values: CustomerFormValues) => {
    const pnErrors = validateNetwork(projectNetwork);
    if (Object.keys(pnErrors).length) {
      setNetworkErrors(pnErrors);
      toast.error('Fix the highlighted project network entries');
      return;
    }

    try {
      const rows = projectNetwork.map(({ key: _key, ...row }, i) => ({ ...row, sortOrder: i }));

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
        leadSourceType: values.leadSourceType ?? 'NONE',
        // Always sent, even when empty — an omitted key would leave the server's existing
        // network untouched, and updateCustomer's optimistic merge only copies keys present
        // on the patch, so the UI would keep showing stale rows.
        projectNetwork: rows,
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
        setProjectNetwork([]);
        setNetworkErrors({});
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={labelCls}>Lead source</label>
                <select className={inputCls} {...register('leadSourceType')} disabled={disabled}>
                  {SELECTABLE_LEAD_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
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
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`${labelCls} mb-0`}>Project network</label>
                <button
                  type="button"
                  onClick={addMember}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[9px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors disabled:opacity-60"
                >
                  <Plus size={13} /> Add
                </button>
              </div>

              {projectNetwork.length === 0 ? (
                <button
                  type="button"
                  onClick={addMember}
                  disabled={disabled}
                  className="w-full px-3 py-4 rounded-[12px] border border-dashed border-background-500 text-[12.5px] text-text-600 hover:text-text-900 hover:border-background-400 transition-colors"
                >
                  Nobody added yet — click to add an architect, builder or referral.
                </button>
              ) : (
                <div className="space-y-2.5">
                  {projectNetwork.map((row, i) => (
                    <ProjectNetworkRow
                      key={row.key}
                      row={row}
                      index={i}
                      disabled={disabled}
                      error={networkErrors[row.key]}
                      takenArchitectIds={projectNetwork
                        .filter((r) => r.key !== row.key && r.architectId)
                        .map((r) => r.architectId as number)}
                      onChangeType={(t) => changeRowType(row.key, t)}
                      onChange={(patch) => updateMember(row.key, patch)}
                      onRemove={() => removeMember(row.key)}
                    />
                  ))}
                </div>
              )}

              <p className="text-[11.5px] text-text-500 mt-1.5">
                Everyone involved in this project — add as many as apply. Architects and builders
                are saved to the Architects module and reusable across customers.
              </p>
            </div>

            {!isEdit && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelCls}>Next follow-up</label>
                  <input type="date" className={inputCls} {...register('nextFollowUpDate')} disabled={disabled} />
                </div>
              </div>
            )}

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
