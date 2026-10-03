/**
 * TeamTasksTab — the admin's side of task assignment, on the Reminders page (super admin only).
 * Assign one task to one or more staff (due date with quick picks, priority), then track
 * everything assigned: completed work waiting for review leads, then overdue / today / upcoming.
 * Assignees complete tasks from their own My To-dos; this is where the admin sees it land, and the
 * bell's "Team" chip carries the same completed-unseen and overdue items.
 * Staff can reply on a task (a doubt, a question): unread replies lead the list as "New replies",
 * the reply text shows under the task, and "Reply" opens the whole thread to answer.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Pencil, Trash2, RotateCcw, Eye, CheckCheck, Check, CalendarDays, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FilterChips } from '@/components/shared/FilterChips';
import { useGetStaffQuery } from '@/features/staff/staffAPI';
import {
  useAssignTasksMutation,
  useGetTasksAssignedByMeQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useMarkTaskCompleteMutation,
  useMarkTaskIncompleteMutation,
  useMarkCompletionSeenMutation,
  useMarkAllCompletionsSeenMutation,
} from '@/features/task-management/taskAPI';
import type { EmployeeTask } from '@/features/task-management/types';
import { usePriorityStyle, PRIORITY_LABEL } from '@/features/task-management/usePriorityStyle';
import { fmtReminderDateTime } from '@/utils/reminderFormat';
import { daysFromToday, dueCaption, localToday } from './taskDates';
import {
  TaskReplyThread,
  latestReplyFromOtherSide,
  unreadRepliesFor,
} from '@/features/task-management/components/TaskReplyThread';

type StatusKey = '' | 'REPLIES' | 'REVIEW' | 'OVERDUE' | 'OPEN' | 'DONE';

interface Group {
  key: string;
  label: string;
  st: string;
  items: EmployeeTask[];
  hint?: string;
}

const initialOf = (name?: string) => (name ?? '').trim().charAt(0).toUpperCase() || '?';

const fieldCls =
  'h-[36px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500';

const iconBtnCls =
  'w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors';

export const TeamTasksTab: React.FC = () => {
  const { data: staff = [] } = useGetStaffQuery();
  // Staff complete tasks and reply in their own browser, which cannot invalidate this one's cache —
  // so poll (every 15 s, so replies show up live) and refetch on focus, or this list goes stale and
  // contradicts the bell.
  const { data: tasks = [], isLoading } = useGetTasksAssignedByMeQuery(undefined, { pollingInterval: 15000, refetchOnFocus: true, refetchOnReconnect: true, refetchOnMountOrArgChange: true });
  const [assignTasks, { isLoading: isAssigning }] = useAssignTasksMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [closeTask] = useMarkTaskCompleteMutation();
  const [reopenTask] = useMarkTaskIncompleteMutation();
  const [seenOne] = useMarkCompletionSeenMutation();
  const [seenAll] = useMarkAllCompletionsSeenMutation();
  const pstyle = usePriorityStyle();

  // Composer
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [due, setDue] = useState(localToday());
  const [priority, setPriority] = useState('MEDIUM');

  // Filters
  const [status, setStatus] = useState<StatusKey>('');
  const [staffFilter, setStaffFilter] = useState('');

  // Edit / delete
  const [editing, setEditing] = useState<EmployeeTask | null>(null);
  const [eTitle, setETitle] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eDue, setEDue] = useState('');
  const [ePriority, setEPriority] = useState('MEDIUM');
  const [eNotes, setENotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EmployeeTask | null>(null);

  // Reply threads open under their task
  const [openThreads, setOpenThreads] = useState<Set<number>>(new Set());
  const toggleThread = (id: number) =>
    setOpenThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Deep link from the bell (?task=ID): open that task's thread and bring it into view, once.
  const [searchParams] = useSearchParams();
  const linkedTask = Number(searchParams.get('task') ?? 0);
  const linkedDone = useRef(0);
  useEffect(() => {
    if (!linkedTask || linkedDone.current === linkedTask || !tasks.some((t) => t.id === linkedTask)) return;
    linkedDone.current = linkedTask;
    setOpenThreads((prev) => new Set(prev).add(linkedTask));
    requestAnimationFrame(() =>
      document.getElementById(`team-task-${linkedTask}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    );
  }, [linkedTask, tasks]);

  const activeStaff = staff.filter((s) => s.active !== false);
  const togglePick = (id: number) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleAssign = async () => {
    if (picked.size === 0) {
      toast.error('Pick at least one staff member');
      return;
    }
    if (!title.trim()) {
      toast.error('Type the task first');
      return;
    }
    if (!due) {
      toast.error('Choose a due date');
      return;
    }
    try {
      const created = await assignTasks({
        employeeIds: Array.from(picked),
        taskTitle: title.trim(),
        taskDescription: desc.trim() || undefined,
        taskDate: due,
        priority: priority as any,
      }).unwrap();
      toast.success(`Assigned to ${created.length} staff member${created.length === 1 ? '' : 's'}`);
      setTitle('');
      setDesc('');
      setPriority('MEDIUM');
      setPicked(new Set());
      setDue(localToday());
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to assign task');
    }
  };

  const today = localToday();
  const filtered = useMemo(
    () => tasks.filter((t) => staffFilter === '' || String(t.assignedToUserId) === staffFilter),
    [tasks, staffFilter]
  );

  const counts = useMemo(
    () => ({
      replies: filtered.filter((t) => unreadRepliesFor(t, 'assigner') > 0).length,
      review: filtered.filter((t) => t.completed && !t.completionSeenAt).length,
      overdue: filtered.filter((t) => !t.completed && t.taskDate < today).length,
      open: filtered.filter((t) => !t.completed).length,
      done: filtered.filter((t) => t.completed).length,
    }),
    [filtered, today]
  );

  const groups: Group[] = useMemo(() => {
    const byDate = (a: EmployeeTask, b: EmployeeTask) => a.taskDate.localeCompare(b.taskDate);
    const byDoneDesc = (a: EmployeeTask, b: EmployeeTask) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '');
    // A task with unread replies is listed once, under "New replies"; once read it drops back into
    // its normal group — nothing is shown twice.
    const hasNew = (t: EmployeeTask) => unreadRepliesFor(t, 'assigner') > 0;
    const replied = filtered.filter(hasNew).sort((a, b) => (b.lastReplyAt ?? '').localeCompare(a.lastReplyAt ?? ''));
    const rest = filtered.filter((t) => !hasNew(t));
    const open = rest.filter((t) => !t.completed);
    const all: Group[] = [
      {
        key: 'replies',
        label: 'New replies from staff',
        st: 'potential',
        items: replied,
        hint: 'open the thread to read and answer',
      },
      {
        key: 'review',
        label: 'Completed — awaiting your review',
        st: 'confirmed',
        items: rest.filter((t) => t.completed && !t.completionSeenAt).sort(byDoneDesc),
        hint: 'mark seen to clear them from your bell',
      },
      { key: 'overdue', label: 'Overdue', st: 'lost', items: open.filter((t) => t.taskDate < today).sort(byDate) },
      { key: 'today', label: 'Due today', st: 'potential', items: open.filter((t) => t.taskDate === today) },
      { key: 'upcoming', label: 'Upcoming', st: 'lead', items: open.filter((t) => t.taskDate > today).sort(byDate) },
      { key: 'done', label: 'Completed', st: 'draft', items: rest.filter((t) => t.completed && !!t.completionSeenAt).sort(byDoneDesc) },
    ];
    if (status === 'REPLIES') return all.filter((g) => g.key === 'replies');
    if (status === 'REVIEW') return all.filter((g) => g.key === 'review');
    if (status === 'OVERDUE') return all.filter((g) => g.key === 'overdue');
    if (status === 'OPEN') return all.filter((g) => g.key === 'overdue' || g.key === 'today' || g.key === 'upcoming');
    if (status === 'DONE') return all.filter((g) => g.key === 'review' || g.key === 'done');
    return all;
  }, [filtered, status, today]);

  const staffChips = useMemo(() => {
    const names = new Map<number, string>();
    tasks.forEach((t) => names.set(t.assignedToUserId, t.assignedToUserName));
    const open = (id?: number) => tasks.filter((t) => !t.completed && (id === undefined || t.assignedToUserId === id)).length;
    return [
      { key: '', label: 'Everyone', count: open() },
      ...Array.from(names.entries()).map(([id, name]) => ({ key: String(id), label: name, count: open(id) })),
    ];
  }, [tasks]);

  const openEdit = (t: EmployeeTask) => {
    setEditing(t);
    setETitle(t.taskTitle);
    setEDesc(t.taskDescription ?? '');
    setEDue(t.taskDate);
    setEPriority(t.priority ?? 'MEDIUM');
    setENotes(t.notes ?? '');
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!eTitle.trim()) {
      toast.error('The task title cannot be empty');
      return;
    }
    if (!eDue) {
      toast.error('Choose a due date');
      return;
    }
    try {
      await updateTask({
        taskId: editing.id,
        task: {
          taskTitle: eTitle.trim(),
          taskDescription: eDesc.trim() || undefined,
          taskDate: eDue,
          priority: ePriority as any,
          notes: eNotes.trim() || undefined,
        },
      }).unwrap();
      toast.success('Task updated');
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to update task');
    }
  };

  const doReopen = async (t: EmployeeTask) => {
    try {
      await reopenTask(t.id).unwrap();
      toast.success(`Reopened — it is back on ${t.assignedToUserName}'s list`);
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to reopen task');
    }
  };

  const doClose = async (t: EmployeeTask) => {
    try {
      await closeTask(t.id).unwrap();
      toast.success('Marked done');
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to mark done');
    }
  };

  const doSeen = async (t: EmployeeTask) => {
    try {
      await seenOne(t.id).unwrap();
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to update task');
    }
  };

  const doSeenAll = async () => {
    try {
      const n = await seenAll().unwrap();
      toast.success(`${n} completion${n === 1 ? '' : 's'} marked as seen`);
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to update tasks');
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTask(deleteTarget.id).unwrap();
      toast.success('Task deleted');
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to delete task');
    }
    setDeleteTarget(null);
  };

  const quickPick = (label: string, value: string) => {
    const on = due === value;
    return (
      <button
        key={label}
        type="button"
        onClick={() => setDue(value)}
        className="h-[36px] px-2.5 rounded-[10px] border text-[12px] font-medium transition-colors whitespace-nowrap"
        style={
          on
            ? {
                borderColor: 'var(--color-primary-600)',
                background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                color: 'var(--color-text-900)',
              }
            : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-900)', color: 'var(--color-text-700)' }
        }
      >
        {label}
      </button>
    );
  };

  const priorityPill = (p?: string) => (
    <span
      className="inline-flex items-center px-2 py-[2.5px] rounded-full text-[10.5px] font-semibold whitespace-nowrap"
      style={pstyle.pill(p)}
    >
      {PRIORITY_LABEL[p ?? 'MEDIUM'] ?? p}
    </span>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Composer */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-3.5">
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} className="text-primary-600" />
          <span className="text-[13px] font-semibold text-text-900">Assign a task</span>
        </div>

        <label className="block text-xs font-medium text-text-700 mb-1.5">Assign to *</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {activeStaff.length === 0 ? (
            <span className="text-[12px] text-text-500">No active staff yet — add them under People → Staff.</span>
          ) : (
            activeStaff.map((s) => {
              const on = picked.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => togglePick(s.id)}
                  className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-[10px] border text-[12.5px] transition-colors"
                  style={
                    on
                      ? {
                          borderColor: 'var(--color-primary-600)',
                          background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
                        }
                      : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-900)' }
                  }
                >
                  <span className="w-5 h-5 rounded-full bg-background-700 border border-background-600 text-[10.5px] font-bold flex items-center justify-center">
                    {on ? <Check size={11} /> : initialOf(s.name)}
                  </span>
                  <span className={on ? 'font-semibold text-text-900' : 'text-text-700'}>{s.name}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-end gap-2.5 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-text-700 mb-1.5">Task *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAssign();
              }}
              placeholder="e.g. Follow up with the Kottayam client on the quotation"
              className={`w-full ${fieldCls}`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1.5">Due *</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {quickPick('Today', localToday())}
              {quickPick('Tomorrow', daysFromToday(1))}
              {quickPick('Next week', daysFromToday(7))}
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={fieldCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1.5">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={fieldCls}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <button
            onClick={handleAssign}
            disabled={isAssigning}
            className="btn-raised-accent inline-flex items-center gap-1.5 h-[36px] px-4 rounded-[10px] text-[13px] font-semibold"
          >
            <Users size={14} />
            {isAssigning ? 'Assigning…' : picked.size > 1 ? `Assign to ${picked.size}` : 'Assign'}
          </button>
        </div>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Instructions (optional)"
          className={`w-full mt-2 ${fieldCls}`}
        />
        <p className="m-0 mt-2 text-[11.5px] text-text-500">
          Each person gets their own copy under My To-dos and in their bell right away. You are notified in your
          bell when they mark it done.
        </p>
      </div>

      {/* Filters */}
      {tasks.length > 0 && (
        <div className="flex flex-col gap-2">
          <FilterChips
            items={[
              { key: '', label: 'All', count: filtered.length },
              ...(counts.replies > 0 ? [{ key: 'REPLIES', label: 'New replies', st: 'potential', count: counts.replies }] : []),
              { key: 'REVIEW', label: 'Awaiting review', st: 'confirmed', count: counts.review },
              { key: 'OVERDUE', label: 'Overdue', st: 'lost', count: counts.overdue },
              { key: 'OPEN', label: 'Open', st: 'lead', count: counts.open },
              { key: 'DONE', label: 'Done', st: 'draft', count: counts.done },
            ]}
            value={status}
            onChange={(k) => setStatus(k as StatusKey)}
          />
          {staffChips.length > 2 && <FilterChips dense items={staffChips} value={staffFilter} onChange={setStaffFilter} />}
        </div>
      )}

      {/* Groups */}
      {isLoading ? (
        <div className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-10 text-center">
          <p className="m-0 text-[13px] text-text-600">Loading team tasks…</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-12 text-center">
          <CalendarDays className="w-8 h-8 mx-auto mb-2 text-text-500" />
          <p className="m-0 text-[13px] text-text-600">Nothing assigned yet — give someone their first task above.</p>
        </div>
      ) : (
        groups.map((g) => {
          if (g.items.length === 0) return null;
          return (
            <div key={g.key} className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-background-600">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold"
                  style={{ background: `var(--st-${g.st}-bg)`, color: `var(--st-${g.st}-fg)` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${g.st}-fg)` }} />
                  {g.label}
                </span>
                <span className="text-[11px] font-[650] px-2 py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
                  {g.items.length}
                </span>
                {g.hint && <span className="text-[11.5px] text-text-500 hidden sm:inline">— {g.hint}</span>}
                <span className="flex-1" />
                {g.key === 'review' && (
                  <button
                    onClick={doSeenAll}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-primary-600 hover:underline"
                  >
                    <CheckCheck size={13} /> Mark all seen
                  </button>
                )}
              </div>
              <div className="divide-y divide-background-600">
                {g.items.map((t) => {
                  const unread = unreadRepliesFor(t, 'assigner');
                  const staffReply = latestReplyFromOtherSide(t, 'assigner');
                  const threadOpen = openThreads.has(t.id);
                  return (
                  <div key={t.id} id={`team-task-${t.id}`}>
                  <div
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors group"
                    style={pstyle.row(t.priority, t.completed)}
                  >
                    <span
                      className="w-7 h-7 rounded-full bg-background-700 border border-background-600 text-[11px] font-bold flex items-center justify-center shrink-0 text-text-800"
                      title={t.assignedToUserName}
                    >
                      {initialOf(t.assignedToUserName)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[13px] truncate ${t.completed ? 'line-through text-text-500' : 'font-medium text-text-900'}`}
                        title={t.taskTitle}
                      >
                        {t.taskTitle}
                      </div>
                      <div className="text-[11.5px] text-text-500 truncate">
                        {t.assignedToUserName} · {dueCaption(t.taskDate, t.completed)}
                        {t.completed
                          ? t.completedAt
                            ? ` · done ${fmtReminderDateTime(t.completedAt)}`
                            : ''
                          : t.acknowledgedAt
                            ? ' · seen by them'
                            : ' · not opened yet'}
                        {t.taskDescription ? ` · ${t.taskDescription}` : ''}
                      </div>
                      {staffReply && !threadOpen && (
                        <button
                          type="button"
                          onClick={() => toggleThread(t.id)}
                          className="mt-1 flex items-start gap-1.5 max-w-full text-left text-[12.5px] rounded-md"
                          title="Open the reply thread"
                        >
                          <MessageCircle
                            size={13}
                            className="mt-[2px] shrink-0"
                            style={{ color: unread > 0 ? 'var(--st-potential-fg)' : 'var(--color-text-500)' }}
                          />
                          <span className={`line-clamp-3 whitespace-pre-wrap break-words ${unread > 0 ? 'text-text-900 font-medium' : 'text-text-700'}`}>
                            <span className="font-semibold">{staffReply.authorName || t.assignedToUserName}:</span> {staffReply.message}
                            <span className="text-text-500 font-normal"> · {fmtReminderDateTime(staffReply.createdAt)}</span>
                          </span>
                        </button>
                      )}
                    </div>
                    {!t.completed && priorityPill(t.priority)}
                    <button
                      type="button"
                      onClick={() => toggleThread(t.id)}
                      title={threadOpen ? 'Hide replies' : 'Open the reply thread'}
                      aria-expanded={threadOpen}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors border"
                      style={
                        unread > 0
                          ? { background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)', borderColor: 'transparent' }
                          : threadOpen
                            ? {
                                background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)',
                                color: 'var(--color-primary-600)',
                                borderColor: 'transparent',
                              }
                            : { background: 'var(--color-background-800)', color: 'var(--color-text-700)', borderColor: 'var(--color-background-600)' }
                      }
                    >
                      <MessageCircle size={13} />
                      {unread > 0 ? `${unread} new` : t.replyCount ? `${t.replyCount}` : 'Reply'}
                    </button>
                    {t.completed && !t.completionSeenAt && (
                      <button
                        onClick={() => doSeen(t)}
                        title="Mark as seen"
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12px] font-medium transition-colors"
                        style={{ background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }}
                      >
                        <Eye size={13} /> Seen
                      </button>
                    )}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {t.completed ? (
                        <button onClick={() => doReopen(t)} title="Reopen — send it back to them" className={iconBtnCls}>
                          <RotateCcw size={13} />
                        </button>
                      ) : (
                        <>
                          <button onClick={() => doClose(t)} title="Mark done on their behalf" className={iconBtnCls}>
                            <Check size={13} />
                          </button>
                          <button onClick={() => openEdit(t)} title="Edit" className={iconBtnCls}>
                            <Pencil size={13} />
                          </button>
                        </>
                      )}
                      <button onClick={() => setDeleteTarget(t)} title="Delete" className={iconBtnCls}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {threadOpen && <TaskReplyThread task={t} viewer="assigner" autoFocus />}
                  </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Edit modal */}
      <Modal isOpen={editing != null} onClose={() => setEditing(null)} title="Edit Task" size="sm">
        <ModalBody>
          <div className="space-y-4">
            <Input label="Task *" type="text" value={eTitle} onChange={(e) => setETitle(e.target.value)} />
            <TextArea label="Instructions" value={eDesc} onChange={(e) => setEDesc(e.target.value)} rows={2} />
            <div className="grid grid-cols-2 gap-3.5">
              <Input label="Due date *" type="date" value={eDue} onChange={(e) => setEDue(e.target.value)} />
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Priority</label>
                <select
                  value={ePriority}
                  onChange={(e) => setEPriority(e.target.value)}
                  className="w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
            <TextArea label="Notes" value={eNotes} onChange={(e) => setENotes(e.target.value)} rows={2} />
            {editing && (
              <p className="m-0 text-[11.5px] text-text-500">
                Assigned to {editing.assignedToUserName}. To give it to someone else, delete it and assign again.
              </p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveEdit} disabled={isUpdating}>
            {isUpdating ? 'Saving…' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Delete Task"
        message={deleteTarget ? `Delete "${deleteTarget.taskTitle}" for ${deleteTarget.assignedToUserName}?` : ''}
        confirmText={isDeleting ? 'Deleting…' : 'Delete'}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TeamTasksTab;
