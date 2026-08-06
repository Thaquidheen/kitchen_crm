/**
 * ProductionPage
 * Production jobs in the HOCH table idiom. Chips group jobs by STAGE (computed from the
 * checklist), not raw status; progress is computed from checklist completion, never typed.
 * Start Production lives here too, with a customer picker — the checklist seeds automatically.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Filter, Plus, BellRing, AlertTriangle, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetProductionInstallationsQuery,
  useGetProductionStatisticsQuery,
  useCreateProductionInstallationMutation,
} from '@/features/production/productionAPI';
import { ReportIssueModal } from '@/features/production/components/ReportIssueModal';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetCustomersPageQuery } from '@/features/customers/customersAPI';
import { useGetStaffQuery } from '@/features/staff/staffAPI';

type Bucket = 'all' | 'not_started' | 's1' | 's2' | 's3' | 'inprog' | 'completed' | 'hold' | 'cancelled';

const BUCKETS: { key: Bucket; label: string; st?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'not_started', label: 'Not Started', st: 'draft' },
  { key: 's1', label: 'Stage 1', st: 'lead' },
  { key: 's2', label: 'Stage 2', st: 'design' },
  { key: 's3', label: 'Stage 3', st: 'quote' },
  { key: 'inprog', label: 'In Progress', st: 'lead' },
  { key: 'completed', label: 'Completed', st: 'confirmed' },
  { key: 'hold', label: 'On Hold', st: 'potential' },
  { key: 'cancelled', label: 'Cancelled', st: 'lost' },
];

const thClass = 'px-3 py-[9px] text-left text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500';

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
const fmtShort = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
const isPast = (iso?: string) => !!iso && new Date(iso) < new Date(new Date().toDateString());

/** Which chip a job belongs to — status first, then the checklist's current stage. */
const bucketOf = (r: any): Bucket => {
  switch (r.overallStatus) {
    case 'COMPLETED':
      return 'completed';
    case 'ON_HOLD':
      return 'hold';
    case 'CANCELLED':
      return 'cancelled';
    case 'NOT_STARTED':
      return 'not_started';
  }
  const s = String(r.currentStageName ?? '');
  if (s.startsWith('Stage 1')) return 's1';
  if (s.startsWith('Stage 2')) return 's2';
  if (s.startsWith('Stage 3')) return 's3';
  if (r.checklistTotal != null && r.checklistDone === r.checklistTotal && r.checklistTotal > 0) return 'completed';
  return 'inprog';
};

export function ProductionPage() {
  const navigate = useNavigate();

  const [bucket, setBucket] = useState<Bucket>('all');
  const [customerName, setCustomerName] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [teamLead, setTeamLead] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [issueFor, setIssueFor] = useState<number | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [custSearch, setCustSearch] = useState('');
  const [pickedCustomer, setPickedCustomer] = useState<any>(null);
  const [pm, setPm] = useState('');
  const [lead, setLead] = useState('');
  const [estDate, setEstDate] = useState('');

  // One page of up to 100 jobs; chips and the stage buckets filter client-side on it.
  const { data: listResponse, isLoading } = useGetProductionInstallationsQuery({
    customerName: customerName || undefined,
    projectManager: projectManager || undefined,
    teamLead: teamLead || undefined,
    page: 0,
    size: 100,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  useGetProductionStatisticsQuery(); // keeps the cache warm for the dashboard

  const allRows: any[] = listResponse?.data?.content ?? [];
  const totalElements = listResponse?.data?.totalElements ?? 0;

  const counts = useMemo(() => {
    const c: Record<Bucket, number> = {
      all: allRows.length, not_started: 0, s1: 0, s2: 0, s3: 0, inprog: 0, completed: 0, hold: 0, cancelled: 0,
    };
    allRows.forEach((r) => { c[bucketOf(r)]++; });
    return c;
  }, [allRows]);

  const rows = useMemo(
    () => (bucket === 'all' ? allRows : allRows.filter((r) => bucketOf(r) === bucket)),
    [allRows, bucket]
  );

  const [createInstallation, { isLoading: isCreating }] = useCreateProductionInstallationMutation();
  const { data: staffList = [] } = useGetStaffQuery(undefined, { skip: !createOpen });
  const { data: custPage } = useGetCustomersPageQuery(
    { name: custSearch, page: 0, size: 8, sortBy: 'name', sortDir: 'asc' },
    { skip: !createOpen }
  );
  const pickerCustomers: any[] = custPage?.content ?? [];

  const openCreate = () => {
    setPickedCustomer(null);
    setCustSearch('');
    setPm('');
    setLead('');
    setEstDate('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!pickedCustomer) return;
    try {
      const res: any = await createInstallation({
        customerId: pickedCustomer.id,
        projectManagerAssigned: pm || undefined,
        installationTeamLead: lead || undefined,
        estimatedCompletionDate: estDate || undefined,
      }).unwrap();
      if (res?.success === false) {
        toast.error(res?.message || 'Failed to start production');
        return;
      }
      toast.success('Production started — standard checklist added');
      setCreateOpen(false);
      navigate(`/production/customer/${pickedCustomer.id}`);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to start production');
    }
  };

  const pill = (st: string, label: string) => (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: `var(--st-${st}-bg)`, color: `var(--st-${st}-fg)` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${st}-fg)` }} />
      {label}
    </span>
  );

  const stageCell = (r: any) => {
    const b = bucketOf(r);
    const meta = BUCKETS.find((x) => x.key === b)!;
    if (b === 's1' || b === 's2' || b === 's3') return pill(meta.st!, r.currentStageName);
    return pill(meta.st ?? 'draft', meta.label);
  };

  const hasFilters = bucket !== 'all' || !!customerName || !!projectManager || !!teamLead;
  const clearFilters = () => {
    setBucket('all');
    setCustomerName('');
    setProjectManager('');
    setTeamLead('');
  };

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Production</h1>
            <span className="text-xs font-[650] px-[9px] py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
              {totalElements}
            </span>
          </div>
          <p className="mt-[5px] mb-0 text-[13px] text-text-700">
            Every job runs the standard 3-stage checklist — progress is computed from checklist completion.
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={openCreate}
          className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold"
        >
          <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
            <Plus size={14} />
          </span>
          Start Production
        </button>
      </div>

      {/* Stage chips */}
      <div className="flex gap-2 flex-wrap mb-2.5">
        {BUCKETS.map((b) => {
          const count = counts[b.key];
          const active = bucket === b.key;
          if (count === 0 && b.key !== 'all' && !active) return null;
          return (
            <button
              key={b.key}
              onClick={() => setBucket(active && b.key !== 'all' ? 'all' : b.key)}
              className="flex items-center gap-2 px-[13px] py-2 rounded-[11px] border transition-colors"
              style={
                active
                  ? {
                      borderColor: 'var(--color-primary-600)',
                      background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                    }
                  : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' }
              }
            >
              {b.st && <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: `var(--st-${b.st}-fg)` }} />}
              <span className={`text-[12.5px] whitespace-nowrap ${active ? 'font-semibold text-text-900' : 'font-medium text-text-700'}`}>
                {b.label}
              </span>
              <span className={`text-[13px] font-[650] tabular-nums ${active ? 'text-primary-600' : 'text-text-900'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Distribution bar */}
      {allRows.length > 0 && (
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mx-0.5 mb-5">
          {BUCKETS.filter((b) => b.key !== 'all' && counts[b.key] > 0).map((b) => (
            <div
              key={b.key}
              title={`${b.label} · ${counts[b.key]}`}
              style={{ width: `${(counts[b.key] / allRows.length) * 100}%`, background: `var(--st-${b.st}-fg)` }}
            />
          ))}
        </div>
      )}

      {/* Table card */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
        <div className="flex items-center gap-2.5 px-3.5 py-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[420px]">
            <Search size={15} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Filter by customer…"
              className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
            />
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            {moreOpen ? 'Hide' : 'More'} Filters
            {(projectManager || teamLead) && !moreOpen && (
              <span className="px-1.5 py-px rounded-full text-[10px] font-semibold bg-primary-600/15 text-primary-600 tabular-nums">
                {(projectManager ? 1 : 0) + (teamLead ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {moreOpen && (
          <div className="flex gap-2.5 px-3.5 pb-3 flex-wrap border-b border-background-600">
            <input
              type="text"
              value={projectManager}
              onChange={(e) => setProjectManager(e.target.value)}
              placeholder="Filter by project manager…"
              className="h-[34px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 w-56"
            />
            <input
              type="text"
              value={teamLead}
              onChange={(e) => setTeamLead(e.target.value)}
              placeholder="Filter by team lead…"
              className="h-[34px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 w-56"
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={`${thClass} pl-3.5`}>Customer</th>
                <th className={thClass}>Current stage</th>
                <th className={thClass}>Progress</th>
                <th className={thClass}>Next due item</th>
                <th className={thClass}>Team</th>
                <th className={thClass}>Est. completion</th>
                <th className="px-3.5 py-[9px] text-right text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 w-[90px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-600">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-3.5 py-4">
                        <div className="h-4 bg-background-700 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="m-0 text-[13px] text-text-600">
                      {hasFilters ? 'No jobs match the current filters.' : 'No production jobs yet.'}
                    </p>
                    {hasFilters ? (
                      <button
                        onClick={clearFilters}
                        className="mt-3 inline-flex items-center px-3.5 py-[7px] rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors"
                      >
                        Clear filters
                      </button>
                    ) : (
                      <button
                        onClick={openCreate}
                        className="mt-3 btn-raised-accent inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] text-[12.5px] font-semibold"
                      >
                        <Plus size={13} />
                        Start Production
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const hasChecklist = r.checklistTotal != null && r.checklistTotal > 0;
                  const pct = Number(r.overallProgressPercentage ?? 0);
                  const overdue = isPast(r.estimatedCompletionDate) && r.overallStatus !== 'COMPLETED';
                  const dueOverdue = r.nextDueDate ? isPast(r.nextDueDate) : false;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/production/customer/${r.customerId}`)}
                      className="hover:bg-background-700 transition-colors cursor-pointer"
                    >
                      <td className="px-3.5 py-[13px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-[11px] font-[650] text-text-700 shrink-0">
                            {initialsOf(r.customerName)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold text-text-900 whitespace-nowrap overflow-hidden text-ellipsis">
                              {r.customerName || `Customer #${r.customerId}`}
                            </div>
                            <div className="text-[11.5px] text-text-500">Job #{r.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-[13px]">{stageCell(r)}</td>
                      <td className="px-3 py-[13px] min-w-[140px]">
                        <div className="text-[12.5px] text-text-800 tabular-nums whitespace-nowrap">
                          {hasChecklist ? `${r.checklistDone}/${r.checklistTotal} · ${pct}%` : `${pct}%`}
                        </div>
                        <div className="h-1.5 rounded-full bg-background-600 overflow-hidden mt-1.5 max-w-[130px]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: pct === 100 ? 'var(--st-confirmed-fg)' : 'var(--color-primary-600)',
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-[13px] max-w-[220px]">
                        {r.nextDueTask ? (
                          <>
                            <div className="text-[12.5px] text-text-800 truncate" title={r.nextDueTask}>
                              {r.nextDueTask}
                            </div>
                            {r.nextDueDate ? (
                              <span
                                className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
                                style={
                                  dueOverdue
                                    ? { background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }
                                    : { background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }
                                }
                              >
                                <BellRing className="w-3 h-3" />
                                {dueOverdue ? 'Overdue · ' : ''}
                                {fmtShort(r.nextDueDate)}
                              </span>
                            ) : (
                              r.nextDueHasReminder && <BellRing className="w-3 h-3 text-text-500 mt-1" />
                            )}
                          </>
                        ) : (
                          <span className="text-[12.5px] text-text-500">{hasChecklist ? 'All tasks done' : '—'}</span>
                        )}
                      </td>
                      <td className="px-3 py-[13px] text-[12.5px] text-text-700 whitespace-nowrap leading-[1.5]">
                        {r.projectManagerAssigned || r.installationTeamLead ? (
                          <>
                            {r.projectManagerAssigned && <div>PM {r.projectManagerAssigned}</div>}
                            {r.installationTeamLead && <div>Lead {r.installationTeamLead}</div>}
                          </>
                        ) : (
                          <span className="text-text-500">Unassigned</span>
                        )}
                      </td>
                      <td
                        className="px-3 py-[13px] text-[12.5px] tabular-nums whitespace-nowrap"
                        style={{ color: overdue ? 'var(--st-lost-fg)' : 'var(--color-text-700)' }}
                      >
                        {fmtDate(r.estimatedCompletionDate)}
                        {overdue && <div className="text-[10.5px] font-semibold uppercase tracking-[0.05em]">Overdue</div>}
                      </td>
                      <td className="px-3.5 py-[13px]">
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/production/customer/${r.customerId}`);
                            }}
                            title="View job"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIssueFor(r.customerId);
                            }}
                            title="Report issue"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 transition-colors"
                            onMouseEnter={(ev) => {
                              ev.currentTarget.style.background = 'var(--st-potential-bg)';
                              ev.currentTarget.style.color = 'var(--st-potential-fg)';
                            }}
                            onMouseLeave={(ev) => {
                              ev.currentTarget.style.background = 'transparent';
                              ev.currentTarget.style.color = '';
                            }}
                          >
                            <AlertTriangle size={14} />
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

        <div className="flex items-center px-3.5 py-3 border-t border-background-600">
          <span className="text-[12.5px] text-text-600">
            Showing {rows.length} of {totalElements} jobs
          </span>
        </div>
      </div>

      {/* Report issue from a row */}
      {issueFor != null && (
        <ReportIssueModal isOpen={issueFor != null} onClose={() => setIssueFor(null)} customerId={issueFor} />
      )}

      {/* Start Production */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Start Production" size="md">
        <ModalBody>
          <p className="text-[12.5px] text-text-600 mb-4 -mt-1">
            Creates the job and loads the standard checklist — nothing to type twice.
          </p>

          <div className="mb-4">
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Customer *</label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none" />
              <input
                type="text"
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                placeholder="Search by name…"
                className="w-full h-[34px] pl-[32px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
              />
            </div>
            <div className="border border-background-600 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              {pickerCustomers.length === 0 ? (
                <div className="px-3 py-4 text-center text-[12.5px] text-text-500">No customers found.</div>
              ) : (
                pickerCustomers.map((c: any) => {
                  const sel = pickedCustomer?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPickedCustomer(c)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-t border-background-600 first:border-t-0 text-left transition-colors ${
                        sel ? 'bg-primary-600/[0.08]' : 'hover:bg-background-700'
                      }`}
                    >
                      <span className="w-7 h-7 rounded-[9px] bg-background-600 border border-background-500 flex items-center justify-center text-[10px] font-[650] text-text-700 shrink-0">
                        {initialsOf(c.name)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-text-900 truncate">{c.name}</span>
                        <span className="block text-[11.5px] text-text-500 truncate">{c.contact || '—'}</span>
                      </span>
                      <span
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
                        style={
                          sel
                            ? { background: 'var(--color-primary-600)', color: 'var(--on-accent)' }
                            : { border: '1.5px solid var(--color-background-500)', color: 'transparent' }
                        }
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Project manager</label>
              <select
                value={pm}
                onChange={(e) => setPm(e.target.value)}
                className="w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
              >
                <option value="">— Select —</option>
                {(staffList as any[]).map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Team lead / technician</label>
              <select
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                className="w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
              >
                <option value="">— Select —</option>
                {(staffList as any[]).map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 max-w-[220px]">
            <Input label="Est. completion" type="date" value={estDate} onChange={(e) => setEstDate(e.target.value)} />
          </div>

          <div className="flex gap-2.5 p-3.5 rounded-xl border border-primary-600/30 bg-primary-600/[0.06]">
            <ListChecks size={17} className="text-primary-600 shrink-0 mt-0.5" />
            <p className="m-0 text-[12.5px] text-text-700">
              <b className="text-text-900">Standard 3-stage checklist (36 tasks)</b> will be added automatically — you can
              edit it per job afterwards.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={!pickedCustomer || isCreating}>
            {isCreating ? 'Starting…' : 'Start Production'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default ProductionPage;
