/**
 * ApplianceQuartzPage
 * Appliance & Quartz sales module: customers buying appliances (hob/hood/fridge...)
 * or quartz, tracked separately from kitchen quotations. Manual item lists.
 * Follows the HOCH design system (chips, distribution bar, table card, 580px modal).
 */

import { useEffect, useRef, useState } from 'react';
import { Plus, Search, Trash2, Pencil, X, BellRing } from 'lucide-react';
import { Modal, ModalBody } from '@/components/ui/Modal';
import { CustomerReminders } from '@/features/customers/components/CustomerReminders';
import toast from 'react-hot-toast';
import { Pagination } from '@/components/shared/Pagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  useGetApplianceCustomersQuery,
  useGetApplianceStatisticsQuery,
  useCreateApplianceCustomerMutation,
  useUpdateApplianceCustomerMutation,
  useDeleteApplianceCustomerMutation,
} from '@/app/baseApi';

type ApplianceStatus = 'LEAD' | 'POTENTIAL' | 'QUOTATION' | 'NEGOTIATION' | 'CONFIRMED' | 'LOST';

interface ApplianceEntry {
  id: number;
  name: string;
  contact: string;
  category: 'APPLIANCE' | 'QUARTZ';
  brand?: string;
  amount?: number;
  status: ApplianceStatus;
  notes?: string;
  items: string[];
  createdBy?: string;
  createdAt?: string;
}

// Category uses the purple/pink tokens so it stays visually distinct from the six
// status colours sitting two columns away.
const CATEGORY_META: Record<string, { st: string; label: string }> = {
  APPLIANCE: { st: 'design', label: 'Appliance' },
  QUARTZ: { st: 'follow', label: 'Quartz' },
};

// Sales pipeline, same stages as the kitchen customer module.
const STATUS_ORDER: ApplianceStatus[] = [
  'LEAD',
  'POTENTIAL',
  'QUOTATION',
  'NEGOTIATION',
  'CONFIRMED',
  'LOST',
];

const STATUS_META: Record<ApplianceStatus, { st: string; label: string }> = {
  LEAD: { st: 'lead', label: 'Lead' },
  POTENTIAL: { st: 'potential', label: 'Potential' },
  QUOTATION: { st: 'quote', label: 'Quotation' },
  NEGOTIATION: { st: 'nego', label: 'Negotiation' },
  CONFIRMED: { st: 'confirmed', label: 'Confirmed' },
  LOST: { st: 'lost', label: 'Lost' },
};

const initialsOf = (name?: string) =>
  (name ?? '')
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const inputCls =
  'w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500';
const labelCls = 'block text-[12.5px] font-medium text-text-800 mb-1.5';

const pill = (st: string, label: string) => (
  <span
    className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
    style={{ background: `var(--st-${st}-bg)`, color: `var(--st-${st}-fg)` }}
  >
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${st}-fg)` }} />
    {label}
  </span>
);

export function ApplianceQuartzPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<ApplianceStatus | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');

  const { data: pageData, isLoading } = useGetApplianceCustomersQuery({
    category,
    status,
    search: search || undefined,
    page,
    size: 10,
  });
  // Status counts follow the selected category so the chips match the rows listed.
  const { data: stats } = useGetApplianceStatisticsQuery({ category });

  const [createEntry, { isLoading: isCreating }] = useCreateApplianceCustomerMutation();
  const [updateEntry, { isLoading: isUpdating }] = useUpdateApplianceCustomerMutation();
  const [deleteEntry] = useDeleteApplianceCustomerMutation();

  // Debounced live search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchDraft);
      setPage(0);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchDraft]);

  const entries: ApplianceEntry[] = pageData?.content ?? [];
  const totalElements: number = pageData?.totalElements ?? 0;
  const totalPages: number = pageData?.totalPages ?? 0;

  const total = Number(stats?.total ?? 0);
  const applianceCount = Number(stats?.appliance ?? 0);
  const quartzCount = Number(stats?.quartz ?? 0);
  const totalAmount = Number(stats?.totalAmount ?? 0);

  // Backend keys the per-status counts by the lowercased enum name.
  const statusCount = (s: ApplianceStatus) => Number(stats?.[s.toLowerCase()] ?? 0);
  const statusTotal = STATUS_ORDER.reduce((sum, s) => sum + statusCount(s), 0);

  // ===== Modal state =====
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApplianceEntry | null>(null);
  const [fName, setFName] = useState('');
  const [fContact, setFContact] = useState('');
  const [fCategory, setFCategory] = useState<'APPLIANCE' | 'QUARTZ'>('APPLIANCE');
  const [fBrand, setFBrand] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fStatus, setFStatus] = useState<ApplianceStatus>('LEAD');
  const [fNotes, setFNotes] = useState('');
  const [fItems, setFItems] = useState<string[]>([]);
  const [itemDraft, setItemDraft] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [remindersFor, setRemindersFor] = useState<ApplianceEntry | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFName('');
    setFContact('');
    setFCategory('APPLIANCE');
    setFBrand('');
    setFAmount('');
    setFStatus('LEAD');
    setFNotes('');
    setFItems([]);
    setItemDraft('');
    setModalOpen(true);
  };

  const openEdit = (e: ApplianceEntry) => {
    setEditing(e);
    setFName(e.name);
    setFContact(e.contact);
    setFCategory(e.category);
    setFBrand(e.brand ?? '');
    setFAmount(e.amount != null ? String(e.amount) : '');
    setFStatus(e.status);
    setFNotes(e.notes ?? '');
    setFItems(e.items ?? []);
    setItemDraft('');
    setModalOpen(true);
  };

  const addItem = () => {
    const v = itemDraft.trim();
    if (!v) return;
    setFItems((prev) => [...prev, v]);
    setItemDraft('');
  };

  const handleSave = async () => {
    if (!fName.trim()) return toast.error('Customer name is required');
    if (!fContact.trim()) return toast.error('Contact is required');
    const body = {
      name: fName.trim(),
      contact: fContact.trim(),
      category: fCategory,
      brand: fBrand.trim() || undefined,
      amount: fAmount ? Number(fAmount) : undefined,
      status: fStatus,
      notes: fNotes.trim() || undefined,
      items: fItems,
    };
    try {
      const res = editing
        ? await updateEntry({ id: editing.id, ...body }).unwrap()
        : await createEntry(body).unwrap();
      if (res?.success === false) return toast.error(res?.message || 'Failed to save');
      toast.success(editing ? 'Entry updated' : 'Entry created');
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEntry(deleteId).unwrap();
      toast.success('Entry deleted');
      setDeleteId(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete');
    }
  };

  const chipStyle = (active: boolean) =>
    active
      ? {
          borderColor: 'var(--color-primary-600)',
          background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
        }
      : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' };

  const chips: Array<{ key?: string; st?: string; label: string; count: number }> = [
    { key: undefined, label: 'All', count: total },
    { key: 'APPLIANCE', st: 'lead', label: 'Appliance', count: applianceCount },
    { key: 'QUARTZ', st: 'quote', label: 'Quartz', count: quartzCount },
  ];

  const thClass =
    'px-3 py-[9px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Appliance &amp; Quartz</h1>
            <span className="text-xs font-[650] px-[9px] py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
              {total}
            </span>
          </div>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            Customers buying appliances or quartz — quoted separately from kitchens.
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={openAdd}
          className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
        >
          <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          Add Entry
        </button>
      </div>

      {/* Category chips + total value */}
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        {chips.map((c) => {
          const active = category === c.key;
          return (
            <button
              key={c.label}
              onClick={() => {
                setCategory(c.key);
                setPage(0);
              }}
              className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
              style={chipStyle(active)}
            >
              {c.st && <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: `var(--st-${c.st}-fg)` }} />}
              <span
                className={`text-[12.5px] whitespace-nowrap ${
                  active ? 'font-semibold text-text-900' : 'font-medium text-text-700'
                }`}
              >
                {c.label}
              </span>
              <span className={`text-[13px] font-[650] tabular-nums ${active ? 'text-primary-600' : 'text-text-900'}`}>
                {c.count}
              </span>
            </button>
          );
        })}
        <div className="flex-1" />
        {totalAmount > 0 && (
          <span className="text-[12.5px] text-text-700 whitespace-nowrap tabular-nums">
            Total value <span className="font-semibold text-text-900">₹{totalAmount.toLocaleString('en-IN')}</span>
          </span>
        )}
      </div>

      {/* Status pipeline filter */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        <button
          onClick={() => {
            setStatus(undefined);
            setPage(0);
          }}
          className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-[9px] border transition-colors"
          style={chipStyle(status === undefined)}
        >
          <span
            className={`text-[12px] whitespace-nowrap ${
              status === undefined ? 'font-semibold text-text-900' : 'font-medium text-text-700'
            }`}
          >
            All stages
          </span>
        </button>
        {STATUS_ORDER.map((s) => {
          const active = status === s;
          const meta = STATUS_META[s];
          const count = statusCount(s);
          return (
            <button
              key={s}
              onClick={() => {
                setStatus(active ? undefined : s);
                setPage(0);
              }}
              title={`Filter by ${meta.label}`}
              className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-[9px] border transition-colors"
              style={chipStyle(active)}
            >
              <span
                className="w-[6px] h-[6px] rounded-full shrink-0"
                style={{ background: `var(--st-${meta.st}-fg)` }}
              />
              <span
                className={`text-[12px] whitespace-nowrap ${
                  active ? 'font-semibold text-text-900' : 'font-medium text-text-700'
                }`}
              >
                {meta.label}
              </span>
              <span
                className={`text-[12px] font-[650] tabular-nums ${
                  active ? 'text-primary-600' : count > 0 ? 'text-text-900' : 'text-text-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pipeline distribution bar */}
      {statusTotal > 0 && (
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mx-0.5 mb-5">
          {STATUS_ORDER.map((s) => {
            const count = statusCount(s);
            if (count === 0) return null;
            return (
              <div
                key={s}
                title={`${STATUS_META[s].label} · ${count}`}
                style={{
                  width: `${(count / statusTotal) * 100}%`,
                  background: `var(--st-${STATUS_META[s].st}-fg)`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Table card */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <div className="relative flex-1 max-w-[480px]">
            <Search size={15} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none" />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Filter by name, phone, brand…"
              className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={thClass}>Name</th>
                <th className={thClass}>Contact</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Brand</th>
                <th className="px-3 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500">Amount</th>
                <th className={thClass}>Items</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Created</th>
                <th className="px-3.5 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-background-600 animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-3 py-[13px]">
                        <div className="h-4 bg-background-600 rounded w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr className="border-t border-background-600">
                  <td colSpan={9} className="px-5 py-14 text-center">
                    {category || status || search ? (
                      <>
                        <div className="text-[14.5px] font-semibold text-text-900">No matching entries</div>
                        <div className="text-[12.5px] text-text-700 mt-1">
                          Nothing here for the current filters — try a different stage or clear the search.
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[14.5px] font-semibold text-text-900">No entries yet</div>
                        <div className="text-[12.5px] text-text-700 mt-1">
                          Add your first appliance or quartz customer with the button above.
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                entries.map((e) => {
                  const cat = CATEGORY_META[e.category] ?? CATEGORY_META.APPLIANCE;
                  const st = STATUS_META[e.status] ?? STATUS_META.LEAD;
                  const itemsPreview = e.items?.slice(0, 2).join(', ');
                  const more = (e.items?.length ?? 0) - 2;
                  return (
                    <tr key={e.id} className="border-t border-background-600 hover:bg-background-700 transition-colors">
                      <td className="px-3 py-[13px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-[11px] font-[650] text-text-700 shrink-0">
                            {initialsOf(e.name)}
                          </div>
                          <span className="text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis">
                            {e.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-[13px] text-[13px] text-text-900 tabular-nums whitespace-nowrap">{e.contact}</td>
                      <td className="px-3 py-[13px]">{pill(cat.st, cat.label)}</td>
                      <td className="px-3 py-[13px] text-[13px] text-text-800 whitespace-nowrap">{e.brand || '—'}</td>
                      <td className="px-3 py-[13px] text-[13px] font-semibold text-text-900 text-right tabular-nums whitespace-nowrap">
                        {e.amount != null ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-3 py-[13px] text-[12.5px] text-text-700 max-w-[220px]">
                        <span className="block whitespace-nowrap overflow-hidden text-ellipsis" title={e.items?.join(', ')}>
                          {itemsPreview || '—'}
                          {more > 0 && <span className="text-text-500"> +{more} more</span>}
                        </span>
                      </td>
                      <td className="px-3 py-[13px]">{pill(st.st, st.label)}</td>
                      <td className="px-3 py-[13px] text-[12.5px] text-text-700 tabular-nums whitespace-nowrap">{fmtDate(e.createdAt)}</td>
                      <td className="px-3.5 py-[13px]">
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => setRemindersFor(e)}
                            title="Reminders"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors"
                          >
                            <BellRing size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(e)}
                            title="Edit"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(e.id)}
                            title="Delete"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 transition-colors"
                            style={{}}
                            onMouseEnter={(ev) => {
                              (ev.currentTarget as HTMLButtonElement).style.background = 'var(--st-lost-bg)';
                              (ev.currentTarget as HTMLButtonElement).style.color = 'var(--st-lost-fg)';
                            }}
                            onMouseLeave={(ev) => {
                              (ev.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              (ev.currentTarget as HTMLButtonElement).style.color = '';
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-3.5 py-[11px] border-t border-background-600">
          <span className="text-[12.5px] text-text-700">
            Showing {entries.length} of {totalElements} entries
          </span>
          <div className="flex-1" />
          <Pagination currentPage={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />
        </div>
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[5px]" onClick={() => setModalOpen(false)} />
          <div className="relative w-[580px] max-w-full max-h-[88vh] flex flex-col bg-background-800 border border-background-600 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="shrink-0 flex items-start gap-3 px-6 pt-5 pb-4 border-b border-background-600">
              <div>
                <h2 className="text-[17px] font-[650] text-text-900 m-0">{editing ? 'Edit Entry' : 'Add Entry'}</h2>
                <p className="text-[12.5px] text-text-600 mt-1 mb-0">
                  Appliance or quartz sale — items are entered manually.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="ml-auto w-8 h-8 rounded-[9px] flex items-center justify-center text-text-500 hover:bg-background-700 hover:text-text-900 transition-colors shrink-0"
              >
                <X size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelCls}>
                    Customer name <span className="text-error">*</span>
                  </label>
                  <input className={inputCls} value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Customer name" autoFocus />
                </div>
                <div>
                  <label className={labelCls}>
                    Contact <span className="text-error">*</span>
                  </label>
                  <input className={inputCls} value={fContact} onChange={(e) => setFContact(e.target.value)} placeholder="Phone number" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <div className="flex gap-1.5">
                  {(['APPLIANCE', 'QUARTZ'] as const).map((c) => {
                    const on = fCategory === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFCategory(c)}
                        className={`px-3 py-1.5 rounded-[9px] text-[12.5px] border transition-colors ${
                          on
                            ? 'border-primary-600 text-primary-600 font-semibold'
                            : 'border-background-600 bg-background-900 text-text-700 hover:border-background-500 font-medium'
                        }`}
                        style={on ? { background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)' } : undefined}
                      >
                        {CATEGORY_META[c].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelCls}>Brand</label>
                  <input className={inputCls} value={fBrand} onChange={(e) => setFBrand(e.target.value)} placeholder="e.g., Bosch, Faber, Caesarstone" />
                </div>
                <div>
                  <label className={labelCls}>Amount (₹)</label>
                  <input
                    className={inputCls}
                    value={fAmount}
                    onChange={(e) => setFAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="e.g., 85000"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>List of items</label>
                <div className="flex gap-2">
                  <input
                    className={inputCls}
                    value={itemDraft}
                    onChange={(e) => setItemDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem();
                      }
                    }}
                    placeholder="e.g., 90cm Chimney — press Enter to add"
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    className="shrink-0 px-3 rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[13px] font-medium hover:bg-background-700 transition-colors"
                  >
                    + Add
                  </button>
                </div>
                {fItems.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {fItems.map((item, i) => (
                      <div
                        key={`${item}-${i}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-[9px] bg-background-700 border border-background-600"
                      >
                        <span className="text-[13px] text-text-900 flex-1 min-w-0 break-words">{item}</span>
                        <button
                          type="button"
                          onClick={() => setFItems((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-text-500 hover:text-error transition-colors shrink-0"
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    className={inputCls}
                    value={fStatus}
                    onChange={(e) => setFStatus(e.target.value as ApplianceStatus)}
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 resize-none"
                  rows={2}
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Anything worth remembering..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 px-6 py-4 border-t border-background-600 rounded-b-2xl">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700 hover:text-text-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isCreating || isUpdating}
                className="btn-raised-accent inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
              >
                {isCreating || isUpdating ? 'Saving…' : editing ? 'Save Changes' : 'Create Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Entry"
        message="Delete this appliance/quartz entry? This cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      {/* Reminders for one entry — this module is a list with no detail page, so they
          open in a dialog rather than on a tab. */}
      <Modal
        isOpen={remindersFor !== null}
        onClose={() => setRemindersFor(null)}
        title={remindersFor ? `Reminders — ${remindersFor.name}` : 'Reminders'}
        size="lg"
      >
        <ModalBody>
          {remindersFor && <CustomerReminders applianceCustomerId={remindersFor.id} />}
        </ModalBody>
      </Modal>
    </div>
  );
}

export default ApplianceQuartzPage;
