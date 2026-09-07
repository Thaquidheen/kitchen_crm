/**
 * CustomerProductionTab
 * The production job view in the HOCH design language: compact header with a derived status
 * badge (status is computed from the checklist — there is no manual control), a 3-segment
 * stage strip, the stage checklist on the left, and a sticky right rail with job summary,
 * upcoming reminders, pending works and recent activity.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, Plus, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetProductionInstallationByCustomerQuery,
  useCreateProductionInstallationMutation,
  useUpdateTaskStatusMutation,
  useGetTaskGroupsByCustomerQuery,
  useGetIssuesByCustomerQuery,
  useResolveIssueMutation,
  useCreateTaskGroupMutation,
  useCompleteHandoverMutation,
} from '../../production/productionAPI';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGetCustomerRemindersQuery } from '@/app/baseApi';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';
import { ProductionCreateModal } from '../../production/components/ProductionCreateModal';
import { ProductionTaskChecklist } from '../../production/components/ProductionTaskChecklist';
import { ReportIssueModal } from '../../production/components/ReportIssueModal';
import type { ProductionInstallationCreateRequest } from '../../production/types';

export interface CustomerProductionTabProps {
  customerId: number;
}

const STATUS_META: Record<string, { st: string; label: string }> = {
  NOT_STARTED: { st: 'draft', label: 'Not Started' },
  PRODUCTION: { st: 'lead', label: 'Production' },
  SITE_PREPARATION: { st: 'potential', label: 'Site Prep' },
  DELIVERY: { st: 'nego', label: 'Delivery' },
  INSTALLATION: { st: 'design', label: 'Installation' },
  QUALITY_CHECK: { st: 'follow', label: 'Quality Check' },
  COMPLETED: { st: 'confirmed', label: 'Completed' },
  ON_HOLD: { st: 'potential', label: 'On Hold' },
  CANCELLED: { st: 'lost', label: 'Cancelled' },
};

const STAGE_ST = ['lead', 'design', 'quote'];

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

export const CustomerProductionTab: React.FC<CustomerProductionTabProps> = ({ customerId }) => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false);
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState('');
  const [handoverOpen, setHandoverOpen] = useState(false);
  const isSuperAdmin = useIsSuperAdmin();

  const { data: productionResponse, isLoading, error, refetch } = useGetProductionInstallationByCustomerQuery(customerId);
  const [createProductionInstallation] = useCreateProductionInstallationMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [createTaskGroup, { isLoading: isAddingStage }] = useCreateTaskGroupMutation();
  const [completeHandover, { isLoading: isHandingOver }] = useCompleteHandoverMutation();
  const [resolveIssue] = useResolveIssueMutation();
  const [resolvingIssueId, setResolvingIssueId] = useState<number | null>(null);

  const handleMarkDone = async (issueId: number) => {
    setResolvingIssueId(issueId);
    try {
      const result = await resolveIssue({ issueId, resolution: 'Done', customerId }).unwrap();
      if (result.success) {
        toast.success('Marked done');
      } else {
        toast.error(result.message || 'Failed to mark done');
      }
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to mark done');
    } finally {
      setResolvingIssueId(null);
    }
  };

  const handleAddStage = async () => {
    if (!newStageTitle.trim()) return;
    try {
      await createTaskGroup({ customerId, groupTitle: newStageTitle.trim(), groupDescription: '' }).unwrap();
      toast.success('Stage added');
      setAddStageOpen(false);
      setNewStageTitle('');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to add stage');
    }
  };

  const handleHandover = async () => {
    try {
      const today = new Date();
      const p = (n: number) => String(n).padStart(2, '0');
      const res = await completeHandover({
        customerId,
        handoverDate: `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`,
      }).unwrap();
      if ((res as any)?.success === false) {
        toast.error((res as any)?.message || 'Failed to mark handover');
      } else {
        toast.success('Handover completed');
        refetch();
      }
      setHandoverOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to mark handover');
      setHandoverOpen(false);
    }
  };

  const production: any = productionResponse?.success ? productionResponse?.data : null;

  // Same query the checklist uses — RTK dedupes, so this costs nothing extra.
  const { data: groupsResponse } = useGetTaskGroupsByCustomerQuery(customerId, { skip: !production });
  const taskGroups: any[] = groupsResponse?.success ? groupsResponse.data || [] : [];

  const { data: remindersData } = useGetCustomerRemindersQuery(customerId, { skip: !production });
  const openReminders: any[] = useMemo(
    () => (remindersData ?? []).filter((r: any) => r.status !== 'DONE').slice(0, 3),
    [remindersData]
  );

  const { data: issuesResponse } = useGetIssuesByCustomerQuery(customerId, { skip: !production });
  const openIssues: any[] = useMemo(
    () => (issuesResponse?.data ?? []).filter((i: any) => i.status !== 'RESOLVED' && i.status !== 'CLOSED'),
    [issuesResponse]
  );

  /** Stage rollup: counts per group and recent completions. The current stage comes from the backend. */
  const stages = useMemo(() => {
    return taskGroups.map((g: any, idx: number) => {
      const total = Number(g.totalTasks ?? g.tasks?.length ?? 0);
      const done = Number(g.completedTasks ?? (g.tasks ?? []).filter((t: any) => t.completed).length);
      return { id: g.id, idx, title: g.groupTitle, total, done, complete: total > 0 && done === total };
    });
  }, [taskGroups]);
  // Backend-derived (1-based) → 0-based; -1 when the job has no checklist yet.
  const currentStageIdx = (production?.currentStageIndex ?? 0) - 1;
  const totalTasks = stages.reduce((t, s) => t + s.total, 0);
  const doneTasks = stages.reduce((t, s) => t + s.done, 0);
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : Number(production?.overallProgressPercentage ?? 0);

  const activity = useMemo(() => {
    const all: any[] = taskGroups.flatMap((g: any) => g.tasks ?? []);
    return all
      .filter((t) => t.completed && (t.completedAt || t.completionDate))
      .sort((a, b) => String(b.completedAt ?? b.completionDate).localeCompare(String(a.completedAt ?? a.completionDate)))
      .slice(0, 4);
  }, [taskGroups]);

  const handleCreateProductionInstallation = async (data: ProductionInstallationCreateRequest) => {
    try {
      const result = await createProductionInstallation({
        customerId: data.customerId,
        projectManagerAssigned: data.projectManagerAssigned,
        installationTeamLead: data.installationTeamLead,
        estimatedCompletionDate: data.estimatedCompletionDate,
        installationNotes: data.installationNotes,
      }).unwrap();
      if (result.success) {
        toast.success('Production started — standard checklist added');
        setIsCreateModalOpen(false);
        refetch();
      } else {
        toast.error(result.message || 'Failed to create production installation');
      }
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to create production installation');
    }
  };

  // Legacy checkpoint updates still flow through here (kept for compatibility).
  const handleTaskUpdate = async (data: { taskName: string; completed: boolean; completionDate?: string }) => {
    const result = await updateTaskStatus({
      customerId,
      taskName: data.taskName,
      completed: data.completed,
      completionDate: data.completionDate,
    }).unwrap();
    if (!result.success) throw new Error(result.message || 'Failed to update task');
    refetch();
  };

  const isNotFoundResponse = productionResponse && !productionResponse.success;
  const isNotFoundError = error && 'status' in error && (error as any).status === 404;
  const noProductionExists = isNotFoundResponse || isNotFoundError;
  const isRealError = error && !isNotFoundError;

  if (isLoading) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-[14px] p-5 animate-pulse">
        <div className="h-6 bg-background-700 rounded w-1/3 mb-3" />
        <div className="h-4 bg-background-700 rounded w-2/3" />
      </div>
    );
  }

  if (isRealError) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-[14px] p-12 text-center">
        <Package className="w-10 h-10 text-text-500 mx-auto mb-3" />
        <h3 className="text-[14.5px] font-semibold text-text-900 mb-1">Could not load the production job</h3>
        <p className="text-[12.5px] text-text-600 mb-5">Something went wrong while fetching it.</p>
        <button
          className="btn-raised-accent inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!production || noProductionExists) {
    return (
      <>
        <div className="bg-background-800 border border-dashed border-background-500 rounded-[14px] p-12 text-center">
          <Package className="w-10 h-10 text-text-500 mx-auto mb-3" />
          <h3 className="text-[14.5px] font-semibold text-text-900 mb-1">No production job yet</h3>
          <p className="text-[12.5px] text-text-600 mb-5">
            Starting production adds the standard 3-stage checklist (36 tasks) automatically.
          </p>
          <button
            className="btn-raised-accent inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Package className="w-4 h-4" />
            Initiate Production Phase
          </button>
        </div>
        <ProductionCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProductionInstallation}
          customerId={customerId}
          title="Create Production Installation"
        />
      </>
    );
  }

  // Header badge from the backend-derived status; a legacy job (no checklist → null) keeps
  // showing its stored column.
  const meta: { st: string; label: string } = (() => {
    switch (production.derivedStatus) {
      case 'COMPLETED':
        return STATUS_META.COMPLETED;
      case 'NOT_STARTED':
        return STATUS_META.NOT_STARTED;
      case 'IN_PROGRESS': {
        const idx = (production.currentStageIndex ?? 1) - 1;
        return {
          st: STAGE_ST[idx % STAGE_ST.length] ?? 'lead',
          label: production.currentStageName || `Stage ${idx + 1}`,
        };
      }
      default:
        return STATUS_META[production.overallStatus] ?? STATUS_META.NOT_STARTED;
    }
  })();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-3.5 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="w-10 h-10 rounded-[11px] flex items-center justify-center text-[13px] font-bold shrink-0 text-primary-600"
            style={{ background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)' }}
          >
            {initialsOf(production.customerName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="m-0 text-[16px] font-[650] text-text-900">
                {production.customerName || `Customer #${customerId}`}
              </h2>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-[3.5px] rounded-full text-xs font-semibold"
                style={{ background: `var(--st-${meta.st}-bg)`, color: `var(--st-${meta.st}-fg)` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${meta.st}-fg)` }} />
                {meta.label}
              </span>
            </div>
            <div className="text-[12px] text-text-600 mt-0.5">
              Job #{production.id}
              {production.productionStartDate && <> · Started {fmtDate(production.productionStartDate)}</>}
              {production.estimatedCompletionDate && <> · Est. completion {fmtDate(production.estimatedCompletionDate)}</>}
              {production.projectManagerAssigned && <> · PM {production.projectManagerAssigned}</>}
              {production.installationTeamLead && <> · Lead {production.installationTeamLead}</>}
            </div>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setIsReportIssueModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--st-hold-fg, var(--st-potential-fg))' }} />
            Add pending work
          </button>
          <button
            onClick={() => setAddStageOpen(true)}
            className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-background-500 bg-background-800 text-text-900 text-[12.5px] font-medium hover:bg-background-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stage
          </button>
          {/* Gated on the handover flag, not on status — status derives from the checklist and
              would hide this exactly when every task is done. */}
          {!production.handoverToClient && isSuperAdmin && (
            <button
              onClick={() => setHandoverOpen(true)}
              className="btn-raised-accent inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-[10px] text-[12.5px] font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              Mark Handover
            </button>
          )}
        </div>
      </div>

      {/* Stage strip */}
      {stages.length > 0 && (
        <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
          {stages.map((s) => {
            const isCurrent = s.idx === currentStageIdx;
            return (
              <div
                key={s.id}
                className="border rounded-xl bg-background-800 px-3.5 py-2.5 relative overflow-hidden"
                style={{
                  borderColor: isCurrent ? 'color-mix(in oklab, var(--color-primary-600) 45%, transparent)' : 'var(--color-background-600)',
                }}
              >
                {(s.complete || isCurrent) && (
                  <div
                    className={`absolute inset-0 ${isCurrent && !s.complete ? 'hoch-stripes' : ''}`}
                    style={{
                      width: s.complete ? '100%' : `${s.total ? (s.done / s.total) * 100 : 0}%`,
                      // backgroundColor (not the shorthand) so .hoch-stripes' background-image survives
                      backgroundColor: s.complete
                        ? 'var(--st-confirmed-bg)'
                        : 'color-mix(in oklab, var(--color-primary-600) 10%, transparent)',
                    }}
                  />
                )}
                <div className="relative">
                  <div className="flex items-center gap-2 text-[12.5px] font-[650] text-text-900">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-bold shrink-0"
                      style={
                        s.complete
                          ? { background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }
                          : isCurrent
                          ? { background: 'var(--color-primary-600)', color: 'var(--on-accent)' }
                          : { background: 'var(--color-background-700)', color: 'var(--color-text-500)' }
                      }
                    >
                      {s.complete ? '✓' : s.idx + 1}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </div>
                  <div className="text-[11.5px] text-text-600 mt-0.5 tabular-nums">
                    {s.done}/{s.total}
                    {s.complete ? ' done' : isCurrent ? ' · in progress' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        {/* Left: checklist + notes */}
        <div className="space-y-4 min-w-0">
          <div className="bg-background-800 border border-background-600 rounded-[14px] p-4">
            <ProductionTaskChecklist production={production} customerId={customerId} onTaskUpdate={handleTaskUpdate} />
          </div>

          {production.installationNotes && (
            <div className="bg-background-800 border border-background-600 rounded-[14px] p-4">
              <div className="text-[11px] font-[650] tracking-[0.06em] uppercase text-text-500 mb-2">Installation notes</div>
              <p className="m-0 text-[13px] text-text-800 whitespace-pre-wrap">{production.installationNotes}</p>
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="lg:sticky lg:top-4 space-y-3.5">
          {/* Job summary */}
          <div className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-3.5">
            <h4 className="m-0 mb-2.5 text-[13px] font-[650] text-text-900">Job summary</h4>
            <div className="flex items-center gap-3.5 mb-2">
              {/* Progress ring */}
              <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0" role="img" aria-label={`${pct}% complete`}>
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-background-600)" strokeWidth="7" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke={pct === 100 ? 'var(--st-confirmed-fg)' : 'var(--color-primary-600)'}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 163.4} 163.4`}
                  transform="rotate(-90 32 32)"
                />
                <text
                  x="32"
                  y="36"
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="var(--color-text-900)"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {pct}%
                </text>
              </svg>
              <div className="min-w-0 text-[12.5px] text-text-600 leading-[1.6]">
                <b className="text-text-900 tabular-nums">
                  {totalTasks > 0 ? `${doneTasks} of ${totalTasks} tasks done` : 'No checklist yet'}
                </b>
                {production.createdAt && (
                  <div className="tabular-nums">
                    {Math.max(0, Math.round((Date.now() - new Date(production.createdAt).getTime()) / 86400000))} days in
                    production
                  </div>
                )}
                {production.estimatedCompletionDate && <div>Est. {fmtDate(production.estimatedCompletionDate)}</div>}
              </div>
            </div>
            {stages.map((s) => (
              <div key={s.id} className="flex justify-between text-[12.5px] py-1">
                <span className="text-text-600 truncate pr-2">{s.title}</span>
                <b className="tabular-nums text-text-900 shrink-0">
                  {s.done}/{s.total}
                </b>
              </div>
            ))}
            <div className="flex justify-between text-[12.5px] py-1 border-t border-background-600 mt-1 pt-2">
              <span className="text-text-600">Quality check</span>
              <b className="text-text-900">{production.qualityCheckPassed ? 'Passed' : 'Pending'}</b>
            </div>
            {production.actualCompletionDate && (
              <div className="flex justify-between text-[12.5px] py-1">
                <span className="text-text-600">Completed</span>
                <b className="tabular-nums text-text-900">{fmtDate(production.actualCompletionDate)}</b>
              </div>
            )}
          </div>

          {/* Upcoming reminders */}
          <div className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <h4 className="m-0 text-[13px] font-[650] text-text-900">Upcoming reminders</h4>
              <span className="text-[11px] font-[650] px-2 py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
                {openReminders.length}
              </span>
              <span className="flex-1" />
              <button
                onClick={() => navigate('/reminders')}
                className="text-[11.5px] font-semibold text-primary-600 hover:underline whitespace-nowrap"
              >
                View all
              </button>
            </div>
            {openReminders.length === 0 ? (
              <p className="m-0 text-[12px] text-text-500">None — use the bell on a task to set one.</p>
            ) : (
              openReminders.map((r: any) => (
                <div key={r.id} className="flex items-center gap-2 py-1.5 border-t border-background-600 first:border-t-0 text-[12.5px]">
                  <span className="flex-1 min-w-0 truncate text-text-800">{r.title}</span>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums shrink-0"
                    style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
                  >
                    {fmtDate(r.remindAt)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Pending works */}
          <div className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <h4 className="m-0 text-[13px] font-[650] text-text-900">Pending works</h4>
              {openIssues.length > 0 && (
                <span
                  className="text-[11px] font-[650] px-2 py-0.5 rounded-full tabular-nums"
                  style={{ background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }}
                >
                  {openIssues.length} open
                </span>
              )}
            </div>
            {openIssues.length === 0 ? (
              <p className="m-0 text-[12px] text-text-500">No pending works.</p>
            ) : (
              openIssues.slice(0, 3).map((i: any) => (
                <div key={i.id} className="flex items-start gap-2 py-1.5 border-t border-background-600 first:border-t-0 text-[12.5px]">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{
                      background:
                        i.priority === 'CRITICAL' || i.priority === 'HIGH' ? 'var(--st-lost-fg)' : 'var(--st-potential-fg)',
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-text-800">{i.title}</span>
                    {(i.createdAt || i.reportedBy) && (
                      <span className="block text-[11px] text-text-500 tabular-nums">
                        {i.createdAt ? fmtDate(i.createdAt) : ''}
                        {i.createdAt && i.reportedBy ? ' · ' : ''}
                        {i.reportedBy ?? ''}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => handleMarkDone(i.id)}
                    disabled={resolvingIssueId === i.id}
                    title="Mark done"
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-text-500 transition-colors disabled:opacity-50"
                    onMouseEnter={(ev) => {
                      ev.currentTarget.style.background = 'var(--st-confirmed-bg)';
                      ev.currentTarget.style.color = 'var(--st-confirmed-fg)';
                    }}
                    onMouseLeave={(ev) => {
                      ev.currentTarget.style.background = 'transparent';
                      ev.currentTarget.style.color = '';
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Activity */}
          <div className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-3.5">
            <h4 className="m-0 mb-1.5 text-[13px] font-[650] text-text-900">Recent activity</h4>
            {activity.length === 0 ? (
              <p className="m-0 text-[12px] text-text-500">No tasks completed yet.</p>
            ) : (
              activity.map((t: any) => (
                <div key={t.id} className="flex gap-2.5 py-1.5 border-t border-background-600 first:border-t-0 text-[12px]">
                  <span className="text-text-500 tabular-nums whitespace-nowrap shrink-0 w-12">
                    {fmtDate(t.completedAt ?? t.completionDate).slice(0, 6)}
                  </span>
                  <span className="min-w-0 text-text-700 truncate">
                    {t.taskTitle}
                    {t.completedByName && <> · {t.completedByName}</>}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ReportIssueModal isOpen={isReportIssueModalOpen} onClose={() => setIsReportIssueModalOpen(false)} customerId={customerId} />

      {/* Add Stage */}
      <Modal isOpen={addStageOpen} onClose={() => setAddStageOpen(false)} title="Add Stage" size="sm">
        <ModalBody>
          <Input
            label="Stage name *"
            type="text"
            value={newStageTitle}
            onChange={(e) => setNewStageTitle(e.target.value)}
            placeholder="e.g. Snag list & rework"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setAddStageOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddStage} disabled={!newStageTitle.trim() || isAddingStage}>
            {isAddingStage ? 'Adding…' : 'Add Stage'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Mark Handover */}
      <ConfirmDialog
        isOpen={handoverOpen}
        onClose={() => setHandoverOpen(false)}
        onConfirm={handleHandover}
        title="Mark Handover"
        message={
          totalTasks > 0 && doneTasks < totalTasks
            ? `${totalTasks - doneTasks} checklist tasks are still open. Mark this job as handed over anyway?`
            : 'Mark this job as handed over to the client?'
        }
        confirmText={isHandingOver ? 'Saving…' : 'Mark Handover'}
        type="warning"
        isLoading={isHandingOver}
      />
    </div>
  );
};

export default CustomerProductionTab;
