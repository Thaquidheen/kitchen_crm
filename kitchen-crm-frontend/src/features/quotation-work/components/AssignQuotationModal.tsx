/**
 * AssignQuotationModal — hand a customer's quotation to someone, or change work already handed
 * out (person, priority, due date, note). Used by the admin and Admin staff, and those are also
 * the only people a quotation can be given to.
 */
import React, { useEffect, useState } from 'react';
import { Check, Search, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useGetCustomersPageQuery } from '@/features/customers/customersAPI';
import { defaultDueDate, PRIORITY_LABEL, STAFF_TYPE_LABEL } from '@/features/design/designUi';
import type { StaffType } from '@/features/design/types';
import {
  useAssignQuotationWorkMutation,
  useGetQuotationAssigneesQuery,
  useUpdateQuotationJobMutation,
} from '../quotationWorkAPI';
import type { QuotationJob, QuotationWorkPriority, UnassignedQuotationCustomer } from '../types';

export type AssignQuotationTarget =
  /** New work; without a customer the dialog starts with a customer search. */
  | { mode: 'assign'; customer?: UnassignedQuotationCustomer }
  | { mode: 'edit'; job: QuotationJob };

interface Props {
  target: AssignQuotationTarget | null;
  onClose: () => void;
}

const fieldCls =
  'h-[36px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors';

const roleLabel = (staffType?: string | null) =>
  staffType === 'ADMIN' ? 'Admin' : staffType ? STAFF_TYPE_LABEL[staffType as StaffType] ?? 'Staff' : 'Staff';

const selectable = (on: boolean): React.CSSProperties =>
  on
    ? { borderColor: 'var(--color-primary-600)', background: 'color-mix(in oklab, var(--color-primary-600) 12%, transparent)' }
    : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-900)' };

export const AssignQuotationModal: React.FC<Props> = ({ target, onClose }) => {
  const editing = target?.mode === 'edit' ? target.job : null;
  const [customer, setCustomer] = useState<UnassignedQuotationCustomer | null>(null);
  const [search, setSearch] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<QuotationWorkPriority>('MEDIUM');
  const [note, setNote] = useState('');

  const { data: assignees = [], isLoading: loadingPeople } = useGetQuotationAssigneesQuery(undefined, { skip: !target });
  const needsCustomer = target?.mode === 'assign' && !customer;
  const { data: found, isFetching: searching } = useGetCustomersPageQuery(
    { name: search, page: 0, size: 8, sortBy: 'name', sortDir: 'asc' },
    { skip: !needsCustomer },
  );
  const [assign, { isLoading: assigning }] = useAssignQuotationWorkMutation();
  const [update, { isLoading: saving }] = useUpdateQuotationJobMutation();
  const busy = assigning || saving;

  useEffect(() => {
    if (!target) {return;}
    setSearch('');
    if (target.mode === 'edit') {
      setCustomer({ customerId: target.job.customerId, customerName: target.job.customerName });
      setAssigneeId(target.job.assigneeId);
      setDueDate(target.job.dueDate ?? '');
      setPriority(target.job.priority ?? 'MEDIUM');
      setNote(target.job.note ?? '');
    } else {
      setCustomer(target.customer ?? null);
      setAssigneeId(null);
      setDueDate(defaultDueDate());
      setPriority('MEDIUM');
      setNote('');
    }
  }, [target]);

  const submit = async () => {
    if (!customer || !assigneeId) {return;}
    try {
      if (editing) {
        await update({
          id: editing.id,
          assigneeId,
          priority,
          note,
          ...(dueDate ? { dueDate } : { clearDueDate: true }),
        }).unwrap();
        toast.success('Saved');
      } else {
        await assign({
          customerId: customer.customerId,
          assigneeId,
          priority,
          dueDate: dueDate || undefined,
          note: note.trim() || undefined,
        }).unwrap();
        toast.success('Quotation assigned');
      }
      onClose();
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to save');
    }
  };

  const title = editing
    ? `Quotation work · ${editing.customerName}`
    : customer
      ? `Assign quotation · ${customer.customerName}`
      : 'Assign quotation';

  return (
    <Modal isOpen={target !== null} onClose={onClose} title={title} size="md">
      <ModalBody>
        {needsCustomer ? (
          <div>
            <label className="block text-[12.5px] font-medium text-text-800 mb-1.5">Which customer?</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-500" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name"
                className={`w-full pl-9 ${fieldCls} placeholder:text-text-500`}
              />
            </div>
            <div className="flex flex-col gap-1.5 mt-2 max-h-[300px] overflow-y-auto pr-0.5">
              {(found?.content ?? []).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCustomer({ customerId: c.id, customerName: c.name, customerPlace: c.place })}
                  className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 hover:border-primary-600 text-left transition-colors"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-text-900 truncate">{c.name}</span>
                    {c.place && <span className="block text-[11.5px] text-text-600 truncate">{c.place}</span>}
                  </span>
                </button>
              ))}
              {!searching && (found?.content ?? []).length === 0 && (
                <p className="m-0 py-4 text-center text-[12.5px] text-text-500">No customer with that name.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-text-800 mb-1.5">
                <UserRound size={13} className="text-primary-600" />
                Who prepares it <span className="text-error">*</span>
              </label>
              {editing && !loadingPeople && !assignees.some((p) => p.id === editing.assigneeId) && (
                <p className="m-0 mb-1.5 text-[11.5px] text-text-600">
                  Now with {editing.assigneeName ?? 'someone else'}. Choose who takes it over.
                </p>
              )}
              {loadingPeople ? (
                <div className="h-10 rounded-[10px] bg-background-700 animate-pulse" />
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                  {assignees.map((p) => {
                    const on = assigneeId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setAssigneeId(p.id)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] border text-left transition-colors"
                        style={selectable(on)}
                      >
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13px] truncate text-text-900 ${on ? 'font-semibold' : ''}`}>{p.name}</span>
                          <span className="block text-[11.5px] text-text-600 truncate">
                            {roleLabel(p.staffType)} · {p.openCount} in queue
                            {p.overdue > 0 ? ` · ${p.overdue} overdue` : ''}
                          </span>
                        </span>
                        {on && <Check size={15} className="text-primary-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[12px] font-medium text-text-700 mb-1">Due date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`w-full ${fieldCls}`} />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-text-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as QuotationWorkPriority)}
                  className={`w-full ${fieldCls}`}
                >
                  {(Object.keys(PRIORITY_LABEL) as QuotationWorkPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-700 mb-1">Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="What should be quoted? Kitchens, brands, anything the customer asked for…"
                className="w-full px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 resize-y placeholder:text-text-500"
              />
            </div>
            <p className="m-0 text-[11.5px] text-text-600">
              {editing
                ? 'The person is told in their notifications when you change the priority, due date or note.'
                : 'The person gets a notification with the priority and due date. New work goes to the end of their list — drag it up on the board to make it first.'}
            </p>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        {target?.mode === 'assign' && !target.customer && customer && (
          <button
            type="button"
            onClick={() => setCustomer(null)}
            className="mr-auto px-3 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700"
          >
            Change customer
          </button>
        )}
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700">
          Cancel
        </button>
        {!needsCustomer && (
          <button
            type="button"
            onClick={submit}
            disabled={!assigneeId || busy}
            className="btn-raised-accent px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
          >
            {busy ? 'Saving…' : editing ? 'Save' : 'Assign'}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default AssignQuotationModal;
