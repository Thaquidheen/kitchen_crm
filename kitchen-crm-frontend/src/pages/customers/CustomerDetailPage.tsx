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
  Ruler,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetCustomerByIdQuery,
  useDeleteCustomerMutation,
} from '../../features/customers/customersAPI';
import { useCustomerStatusChange, type StatusChangeExtras } from '../../features/customers/useCustomerStatusChange';
import { useIsSuperAdmin } from '../../features/auth/useIsSuperAdmin';
import { usePermissions } from '../../features/permissions/usePermissions';
import { NoAccess } from '../../features/permissions/NoAccess';
import { CustomerFormModal } from '../../features/customers/components/CustomerFormModal';
import { CustomerFollowUps } from '../../features/customers/components/CustomerFollowUps';
import { CustomerReminders } from '../../features/customers/components/CustomerReminders';
import { CustomerActivityPanel } from '../../features/customers/components/CustomerActivityPanel';
import { CustomerProductionTab } from '../../features/customers/components/CustomerProductionTab';
import {
  CustomerQuotationsTab,
  CustomerQuotationsSummary,
} from '../../features/customers/components/CustomerQuotationsTab';
import { StatusChangeModal } from '../../features/customers/components/StatusChangeModal';
import { CustomerDesignCard } from '../../features/design/components/CustomerDesignCard';
import { useGetCustomerDesignJobQuery } from '../../features/design/designAPI';
import { DesignStatusPill } from '../../features/design/designUi';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { STATUS_PILL } from '../../features/customers/components/CustomerList';
import { ProjectNetworkChips } from '../../features/customers/components/ProjectNetworkChips';
import { customerLeadSource, leadSourceLabel } from '../../features/customers/leadSource';
import type { CustomerStatus } from '../../features/customers/types';
import { getSiteMeasurementRoute } from '../../routes/routes.config';

// Timeline is gone as a tab — its feed now lives on Overview, where notes are written.
const TABS = ['Overview', 'Reminders', 'Pipeline', 'Quotations', 'Production', 'Warranty'];

const STATUS_OPTIONS: Array<{ value: CustomerStatus; label: string }> = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'POTENTIAL', label: 'Potential' },
  { value: 'DESIGN_STAGE', label: 'Design Stage' },
  { value: 'QUOTE_GIVEN', label: 'Quotation Stage' },
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

  const changeStatus = useCustomerStatusChange();
  const isAdmin = useIsSuperAdmin();
  const { can, ready: permissionsReady } = usePermissions();
  const { data: designJob } = useGetCustomerDesignJobQuery(customerId!, { skip: !customerId });
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

  if (permissionsReady && !can('customers.view')) {
    return <NoAccess what="customer details" />;
  }

  const pill = STATUS_PILL[customer.status] ?? { st: 'lead', label: customer.status };
  // Tabs the administrator has not allowed for this staff type are simply not there.
  const tabs = TABS.filter(
    (tab) =>
      (tab !== 'Reminders' || can('customers.reminders')) &&
      (tab !== 'Quotations' || can('customers.quotations')) &&
      (tab !== 'Production' || can('customers.production')),
  );
  const shownTab = tabs.includes(activeTab) ? activeTab : 'Overview';

  const handleStatusChange = async (note: string, extras: StatusChangeExtras) => {
    if (!pendingStatus) return;
    setIsSavingStatus(true);
    try {
      const result = await changeStatus({ customerId, status: pendingStatus, note, extras });
      toast.success(`Status updated to ${STATUS_PILL[pendingStatus]?.label ?? pendingStatus}`);
      if (result.warning) {
        toast.error(result.warning, { duration: 8000 });
      }
      setPendingStatus(null);
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to update status');
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
          {designJob && designJob.designerName && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[12px] text-text-700">
              <span>
                Designer: <span className="font-semibold text-text-900">{designJob.designerName}</span>
              </span>
              <DesignStatusPill status={designJob.status} />
            </div>
          )}
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
          {can('customers.site_measurement') && (
            <button onClick={() => navigate(getSiteMeasurementRoute(customer.id))} className={ghostBtn}>
              <Ruler size={13} className="text-text-700" />
              Measure site
            </button>
          )}
          {can('customers.edit') && (
            <button onClick={() => setEditOpen(true)} className={ghostBtn}>
              <Pencil size={13} className="text-text-700" />
              Edit
            </button>
          )}
          {can('customers.delete') && (
            <button
              onClick={() => setDeleteConfirm(true)}
              title="Delete customer"
              className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-colors"
              style={{ background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }}
            >
              <Trash2 size={14} />
            </button>
          )}
          {can('customers.change_stage') && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-background-600 mb-4 overflow-x-auto">
        {tabs.map((tab) => {
          const active = shownTab === tab;
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

      {shownTab === 'Overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-4 items-start">
          {/* Left column */}
          <div className="space-y-4 min-w-0">
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

            {/* The design this customer is quoted on, with its versions */}
            <CustomerDesignCard
              customerId={customer.id}
              customerName={customer.name}
              customerStatus={customer.status}
              isAdmin={isAdmin}
              canUploadDesign={can('customers.upload_design')}
            />
          </div>

          {/* Right column */}
          <div className="space-y-4 min-w-0">
            {/* Quotations — each version with its own value. Versions are alternatives, so they
                are never summed into one "total value". */}
            {can('customers.quotations') && (
              <CustomerQuotationsSummary customerId={customer.id} onViewAll={() => setActiveTab('Quotations')} />
            )}

            {/* Follow-ups (reminders have their own tab) */}
            {can('customers.followups') && <CustomerFollowUps customerId={customer.id} />}

            {/* Activity & notes — scrolls internally so Overview stays a fixed height */}
            <CustomerActivityPanel customerId={customer.id} canAddNote={can('customers.notes')} />
          </div>
        </div>
      ) : shownTab === 'Reminders' ? (
        <div className="space-y-4">
          <CustomerReminders customerId={customer.id} />
        </div>
      ) : shownTab === 'Quotations' ? (
        <CustomerQuotationsTab customerId={customer.id} />
      ) : shownTab === 'Production' ? (
        <CustomerProductionTab customerId={customer.id} />
      ) : (
        <div className="bg-background-800 border border-background-600 rounded-[14px] px-6 py-16 text-center">
          <div className="text-[14.5px] font-semibold text-text-900">{shownTab}</div>
          <div className="text-[12.5px] text-text-700 mt-1">
            This tab is coming soon — the {shownTab.toLowerCase()} view will appear here.
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
        currentDesignerId={designJob?.designerId ?? null}
        customerId={customerId}
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
