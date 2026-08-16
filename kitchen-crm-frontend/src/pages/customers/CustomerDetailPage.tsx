/**
 * CustomerDetailPage
 * HOCH ERP: compact header (back · avatar · name + status · meta · actions ·
 * working status dropdown), tab bar, and a two-column Overview
 * (Details card | stat cards + Follow-ups + Reminders).
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  LayoutGrid,
  Target,
  Users,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  FileText,
  IndianRupee,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerStatusMutation,
  useDeleteCustomerMutation,
} from '../../features/customers/customersAPI';
import { useGetQuotationsByCustomerQuery } from '../../app/baseApi';
import { CustomerFormModal } from '../../features/customers/components/CustomerFormModal';
import { CustomerFollowUps } from '../../features/customers/components/CustomerFollowUps';
import { CustomerReminders } from '../../features/customers/components/CustomerReminders';
import { CustomerActivityPanel } from '../../features/customers/components/CustomerActivityPanel';
import { CustomerProductionTab } from '../../features/customers/components/CustomerProductionTab';
import { StatusChangeModal } from '../../features/customers/components/StatusChangeModal';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { STATUS_PILL } from '../../features/customers/components/CustomerList';
import { ProjectNetworkChips } from '../../features/customers/components/ProjectNetworkChips';
import { customerLeadSource, leadSourceLabel } from '../../features/customers/leadSource';
import type { CustomerStatus } from '../../features/customers/types';

// Timeline is gone as a tab — its feed now lives on Overview, where notes are written.
const TABS = ['Overview', 'Reminders', 'Pipeline', 'Quotations', 'Production', 'Warranty'];

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

const initialsOf = (name: string) =>
  name
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ghostBtn =
  'inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors whitespace-nowrap';

const CustomerDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const customerId = params.id ? Number(params.id) : undefined;

  const { data: customer, isLoading, error } = useGetCustomerByIdQuery(customerId!, { skip: !customerId });
  const { data: quotationsRaw } = useGetQuotationsByCustomerQuery(customerId!, { skip: !customerId });

  const [updateStatus] = useUpdateCustomerStatusMutation();
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();

  const [activeTab, setActiveTab] = useState('Overview');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  // Status changes go through a modal that requires a note, so the picked status is
  // held here until the note is supplied rather than being applied on change.
  const [pendingStatus, setPendingStatus] = useState<CustomerStatus | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  if (!customerId) {
    return <div className="p-4 text-error">Invalid customer ID</div>;
  }

  if (isLoading) {
    return (
      <div className="p-4 animate-pulse space-y-4">
        <div className="h-12 bg-background-700 rounded-[12px] w-1/2" />
        <div className="h-64 bg-background-700 rounded-[14px]" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-4">
        <p className="text-error">Failed to load customer details</p>
        <button onClick={() => navigate('/customers')} className="mt-4 text-primary-600 hover:underline text-sm">
          Back to Customers
        </button>
      </div>
    );
  }

  const pill = STATUS_PILL[customer.status] ?? { st: 'lead', label: customer.status };
  const quotationsPage = (quotationsRaw as any)?.data;
  const quotationCount: number = quotationsPage?.totalElements ?? 0;
  const totalValue: number = (quotationsPage?.content ?? []).reduce(
    (sum: number, q: any) => sum + (Number(q.totalAmount) || 0),
    0
  );

  const handleStatusChange = async (note: string) => {
    if (!pendingStatus) return;
    setIsSavingStatus(true);
    try {
      await updateStatus({ id: customerId, status: pendingStatus, reason: note }).unwrap();
      toast.success(`Status updated to ${STATUS_PILL[pendingStatus]?.label ?? pendingStatus}`);
      setPendingStatus(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update status');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer(customerId).unwrap();
      toast.success('Customer deleted');
      navigate('/customers');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete customer');
    }
  };

  const detailRows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = [
    { icon: <Phone size={15} />, label: 'Phone', value: customer.contact || '—' },
    { icon: <Mail size={15} />, label: 'Email', value: customer.email || '—' },
    { icon: <MapPin size={15} />, label: 'Address', value: customer.address || '—' },
    { icon: <LayoutGrid size={15} />, label: 'Kitchen types', value: customer.kitchenTypes || '—' },
    { icon: <Target size={15} />, label: 'Lead source', value: leadSourceLabel(customerLeadSource(customer)) },
    { icon: <Users size={15} />, label: 'Project network', value: <ProjectNetworkChips customer={customer} /> },
    { icon: <Calendar size={15} />, label: 'Created', value: fmtDate(customer.createdAt) },
    { icon: <Clock size={15} />, label: 'Last updated', value: fmtDate(customer.updatedAt) },
  ];

  const stats = [
    { icon: <FileText size={16} />, label: 'Quotations', value: String(quotationCount) },
    {
      icon: <IndianRupee size={16} />,
      label: 'Total Value',
      value: `₹${totalValue.toLocaleString('en-IN')}`,
    },
  ];

  return (
    <div className="w-full">
      {/* Compact header */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <button
          onClick={() => navigate('/customers')}
          className="w-[34px] h-[34px] rounded-[10px] border border-background-500 bg-background-800 text-text-700 hover:bg-background-700 hover:text-text-900 flex items-center justify-center transition-colors shrink-0"
          title="Back to customers"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="w-10 h-10 rounded-[11px] bg-background-600 border border-background-500 flex items-center justify-center text-[13px] font-[650] text-text-700 shrink-0">
          {initialsOf(customer.name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="m-0 text-[19px] font-[650] tracking-[-0.01em] text-text-900 whitespace-nowrap overflow-hidden text-ellipsis">
              {customer.name}
            </h1>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-xs font-semibold"
              style={{ background: `var(--st-${pill.st}-bg)`, color: `var(--st-${pill.st}-fg)` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${pill.st}-fg)` }} />
              {pill.label}
            </span>
          </div>
          <p className="m-0 mt-0.5 text-[12.5px] text-text-600 tabular-nums">
            Customer #{customer.id}
            {customer.place ? ` · ${customer.place}` : ''} · Created {fmtDate(customer.createdAt)}
          </p>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 flex-wrap">
          {customer.contact && (
            <a href={`tel:${customer.contact}`} className={ghostBtn}>
              <Phone size={13} className="text-text-700" />
              Call
            </a>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className={ghostBtn}>
              <Mail size={13} className="text-text-700" />
              Email
            </a>
          )}
          <button onClick={() => setEditOpen(true)} className={ghostBtn}>
            <Pencil size={13} className="text-text-700" />
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            title="Delete customer"
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-colors"
            style={{ background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }}
          >
            <Trash2 size={14} />
          </button>
          <div className="w-px h-6 bg-background-500 hidden sm:block" />
          <select
            value={customer.status}
            onChange={(e) => {
              const next = e.target.value as CustomerStatus;
              if (next !== customer.status) setPendingStatus(next);
            }}
            className="h-[34px] px-2.5 rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium outline-none cursor-pointer focus:border-primary-600"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-background-600 mb-4 overflow-x-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2.5 text-[13px] whitespace-nowrap border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-primary-600 text-primary-600 font-semibold'
                  : 'border-transparent text-text-700 hover:text-text-900 font-medium'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {activeTab === 'Overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-4 items-start">
          {/* Details card */}
          <div className="bg-background-800 border border-background-600 rounded-[14px] p-4">
            <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-text-500 mb-3">Details</div>
            <div className="space-y-3.5">
              {detailRows.map((row) => (
                <div key={row.label} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-text-500 shrink-0">{row.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-semibold tracking-[0.07em] uppercase text-text-500">
                      {row.label}
                    </div>
                    <div className="text-[13px] text-text-900 mt-0.5 break-words">{row.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4 min-w-0">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-3.5 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center text-primary-600 shrink-0"
                    style={{ background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)' }}
                  >
                    {s.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-semibold tracking-[0.07em] uppercase text-text-500">{s.label}</div>
                    <div className="text-[17px] font-[650] text-text-900 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
                      {s.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Follow-ups (reminders have their own tab) */}
            <CustomerFollowUps customerId={customer.id} />

            {/* Activity & notes — scrolls internally so Overview stays a fixed height */}
            <CustomerActivityPanel customerId={customer.id} />
          </div>
        </div>
      ) : activeTab === 'Reminders' ? (
        <div className="space-y-4">
          <CustomerReminders customerId={customer.id} />
        </div>
      ) : activeTab === 'Production' ? (
        <CustomerProductionTab customerId={customer.id} />
      ) : (
        <div className="bg-background-800 border border-background-600 rounded-[14px] px-6 py-16 text-center">
          <div className="text-[14.5px] font-semibold text-text-900">{activeTab}</div>
          <div className="text-[12.5px] text-text-700 mt-1">
            This tab is coming soon — the {activeTab.toLowerCase()} view will appear here.
          </div>
        </div>
      )}

      {/* Status change — note is mandatory and lands on the Overview activity feed */}
      <StatusChangeModal
        isOpen={pendingStatus !== null}
        onClose={() => setPendingStatus(null)}
        onConfirm={handleStatusChange}
        targetStatus={pendingStatus}
        currentStatus={customer.status as CustomerStatus}
        isSubmitting={isSavingStatus}
      />

      {/* Edit modal */}
      <CustomerFormModal isOpen={editOpen} onClose={() => setEditOpen(false)} customerId={customerId} />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Delete "${customer.name}" and all their data? This cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        type="danger"
      />
    </div>
  );
};

export default CustomerDetailPage;
