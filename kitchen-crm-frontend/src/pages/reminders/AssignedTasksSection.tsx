/**
 * AssignedTasksSection — tasks an admin assigned to the signed-in user, shown at the top of
 * My To-dos. Opening this list acknowledges every "New" assignment (a server-side stamp), which is
 * what lets a future-dated assignment leave the bell until its day. The assignee can complete or
 * undo; only the assigner can edit or delete, so there are no edit/delete controls here.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAcknowledgeAllMyTasksMutation,
  useMarkTaskCompleteMutation,
  useMarkTaskIncompleteMutation,
} from '@/features/task-management/taskAPI';
import type { EmployeeTask } from '@/features/task-management/types';
import { usePriorityStyle, PRIORITY_LABEL } from '@/features/task-management/usePriorityStyle';
import { dueCaption, localToday } from './taskDates';

interface Props {
  tasks: EmployeeTask[];
}

interface Group {
  key: string;
  label: string;
  st: string;
  items: EmployeeTask[];
}

export const AssignedTasksSection: React.FC<Props> = ({ tasks }) => {
  const [ackAll] = useAcknowledgeAllMyTasksMutation();
  const [markDone] = useMarkTaskCompleteMutation();
  const [markUndo] = useMarkTaskIncompleteMutation();
  const pstyle = usePriorityStyle();

  // Acknowledge once per visit. The refetch after it returns newForAssignee=false, so this cannot
  // loop; the ref only guards the window between firing and that refetch landing.
  const acked = useRef(false);
  useEffect(() => {
    if (!acked.current && tasks.some((t) => t.newForAssignee)) {
      acked.current = true;
      ackAll();
    }
  }, [tasks, ackAll]);

  const groups: Group[] = useMemo(() => {
    const today = localToday();
    const open = tasks.filter((t) => !t.completed);
    const byDate = (a: EmployeeTask, b: EmployeeTask) => a.taskDate.localeCompare(b.taskDate);
    const done = tasks
      .filter((t) => t.completed)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
    return [
      { key: 'overdue', label: 'Overdue', st: 'lost', items: open.filter((t) => t.taskDate < today).sort(byDate) },
      { key: 'today', label: 'Today', st: 'potential', items: open.filter((t) => t.taskDate === today) },
      { key: 'upcoming', label: 'Upcoming', st: 'lead', items: open.filter((t) => t.taskDate > today).sort(byDate) },
      { key: 'done', label: 'Completed', st: 'confirmed', items: done },
    ];
  }, [tasks]);

  const toggle = async (t: EmployeeTask) => {
    try {
      if (t.completed) {
        await markUndo(t.id).unwrap();
        toast.success('Task reopened');
      } else {
        await markDone(t.id).unwrap();
        toast.success('Done — your admin has been notified');
      }
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to update task');
    }
  };

  if (tasks.length === 0) return null;
  const openCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-background-600">
        <UserCheck size={15} className="text-primary-600" />
        <span className="text-[13px] font-semibold text-text-900">Assigned to me</span>
        <span className="text-[11px] font-[650] px-2 py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
          {openCount} open
        </span>
        <span className="text-[11.5px] text-text-500 hidden sm:inline">— tasks your admin gave you; tick them off when done</span>
      </div>

      {groups.map((g) => {
        if (g.items.length === 0) return null;
        return (
          <div key={g.key}>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-background-700/50 border-b border-background-600">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[10.5px] font-semibold"
                style={{ background: `var(--st-${g.st}-bg)`, color: `var(--st-${g.st}-fg)` }}
              >
                {g.label}
              </span>
              <span className="text-[11px] text-text-500 tabular-nums">{g.items.length}</span>
            </div>
            <div className="divide-y divide-background-600">
              {g.items.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={pstyle.row(t.priority, t.completed)}
                >
                  <button
                    onClick={() => toggle(t)}
                    title={t.completed ? 'Reopen' : 'Mark as done'}
                    className="w-[19px] h-[19px] rounded-[6px] flex items-center justify-center shrink-0 transition-colors"
                    style={
                      t.completed
                        ? { background: 'var(--st-confirmed-fg)', color: '#fff' }
                        : { border: '1.5px solid var(--color-background-500)', background: 'var(--color-background-900)' }
                    }
                  >
                    {t.completed && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13px] flex items-center gap-2 ${
                        t.completed ? 'line-through text-text-500' : 'font-medium text-text-900'
                      }`}
                    >
                      <span className="truncate" title={t.taskTitle}>{t.taskTitle}</span>
                      {t.newForAssignee && (
                        <span
                          className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-[1px] rounded-full"
                          style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
                        >
                          New
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-text-500 truncate">
                      Assigned by {t.assignedByName} · {dueCaption(t.taskDate, t.completed)}
                      {t.taskDescription ? ` · ${t.taskDescription}` : ''}
                    </div>
                  </div>
                  {!t.completed && (
                    <span
                      className="inline-flex items-center px-2 py-[2.5px] rounded-full text-[10.5px] font-semibold whitespace-nowrap"
                      style={pstyle.pill(t.priority)}
                    >
                      {PRIORITY_LABEL[t.priority] ?? t.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AssignedTasksSection;
