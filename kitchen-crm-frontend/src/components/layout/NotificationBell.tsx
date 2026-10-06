/**
 * NotificationBell
 * The navbar bell, extracted from Header. Pools the user's due to-dos, the tasks an admin assigned
 * to them, the shared reminder feed and — for a super admin — the team feed (tasks they assigned
 * that were completed, or are overdue). One chip row filters by module: All / To-dos / Assigned to
 * me / Team / Customers / Production / Appliance / Architects. Rows are grouped Overdue vs Today
 * (the payload's server-computed `bucket`; the old inline bell ignored it and "Today's reminders"
 * was silently mostly overdue), with completed team work in its own group so "done" news leads.
 *
 * Times render via the shared string-splitting formatters — the old bell ran naive
 * LocalDateTimes through new Date(), shifting them into the browser's timezone.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, Bell, Check, Eye, FileText, MessageCircle, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetReminderNotificationsQuery, useMarkReminderDoneMutation } from '../../app/baseApi';
import {
  useGetMyDueTodosQuery,
  useMarkTodoCompleteMutation,
  useGetMyDueTasksQuery,
  useGetAssignerAttentionQuery,
  useMarkTaskCompleteMutation,
  useMarkCompletionSeenMutation,
} from '../../features/task-management/taskAPI';
import type { EmployeeTask } from '../../features/task-management/types';
import { useIsSuperAdmin } from '../../features/auth/useIsSuperAdmin';
import { usePriorityStyle, PRIORITY_LABEL } from '../../features/task-management/usePriorityStyle';
import { ROUTES } from '../../routes/routes.config';
import { FilterChips } from '../shared/FilterChips';
import { fmtReminderDateTime } from '../../utils/reminderFormat';
import { latestReplyFromOtherSide, unreadRepliesFor } from '../../features/task-management/components/TaskReplyThread';
import { useGetDesignAttentionQuery, useGetDesignMeQuery, useGetMyDesignFeedQuery } from '../../features/design/designAPI';
import { designNewsText } from '../../features/design/designUi';
import type { DesignJob } from '../../features/design/types';
import { useGetQuotationWorkFeedQuery, useGetQuotationWorkMeQuery } from '../../features/quotation-work/quotationWorkAPI';
import { quotationNewsText } from '../../features/quotation-work/quotationWorkRules';
import type { QuotationJob } from '../../features/quotation-work/types';

type SourceKey = '' | 'TODOS' | 'ASSIGNED' | 'TEAM' | 'DESIGNS' | 'QUOTES' | 'CUSTOMERS' | 'PRODUCTION' | 'APPLIANCE' | 'ARCHITECT';

interface BellReminder {
  id: number;
  title: string;
  ownerType?: string;
  ownerId?: number;
  customerId?: number;
  ownerName?: string;
  customerName?: string;
  remindAt: string;
  bucket?: string;
  source?: string;
}

/** Source presentation: dot token + caption. To-dos and tasks handled separately. */
const SOURCE_META: Record<string, { st: string; label: string }> = {
  CUSTOMERS: { st: 'design', label: 'Customer' },
  FOLLOW_UP: { st: 'design', label: 'Follow-up' },
  PRODUCTION: { st: 'nego', label: 'Production' },
  APPLIANCE: { st: 'quote', label: 'Appliance & Quartz' },
  ARCHITECT: { st: 'lead', label: 'Architect' },
  TODOS: { st: 'draft', label: 'To-do' },
  ASSIGNED: { st: 'potential', label: 'Assigned to me' },
  TEAM: { st: 'confirmed', label: 'Team' },
  DESIGNS: { st: 'potential', label: 'Designs' },
  QUOTES: { st: 'quote', label: 'Quotations' },
};

const sourceKeyOf = (r: BellReminder): 'CUSTOMERS' | 'PRODUCTION' | 'APPLIANCE' | 'ARCHITECT' => {
  if (r.ownerType === 'APPLIANCE') return 'APPLIANCE';
  if (r.ownerType === 'ARCHITECT') return 'ARCHITECT';
  if (r.source === 'PRODUCTION') return 'PRODUCTION';
  return 'CUSTOMERS';
};

/** Caption meta for one reminder row — follow-ups sit under Customers but say what they are. */
const metaOf = (r: BellReminder) =>
  r.source === 'FOLLOW_UP' && r.ownerType !== 'APPLIANCE' ? SOURCE_META.FOLLOW_UP : SOURCE_META[sourceKeyOf(r)];

/** dd/mm/yyyy from an ISO day, without new Date(). */
const fmtDue = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '');

const MAX_ROWS = 8;

export function NotificationBell({ enabled }: { enabled: boolean }) {
  const navigate = useNavigate();
  const isSuperAdmin = useIsSuperAdmin();
  const pstyle = usePriorityStyle();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<SourceKey>('');

  const { data: notifData } = useGetReminderNotificationsQuery(undefined, {
    pollingInterval: 60000,
    skip: !enabled,
  });
  const { data: todoNotif } = useGetMyDueTodosQuery(undefined, {
    pollingInterval: 60000,
    skip: !enabled,
  });
  // Tasks an admin assigned to me: due today or earlier, any I have not yet opened, and any with an
  // unread reply from the admin. 30 s: replies are a conversation, 60 s felt dead.
  const { data: dueTaskNotif } = useGetMyDueTasksQuery(undefined, {
    pollingInterval: 30000,
    skip: !enabled,
  });
  // Tasks I assigned that were completed (unseen), are overdue, or have an unread staff reply — super admin only.
  const { data: attentionNotif } = useGetAssignerAttentionQuery(undefined, {
    pollingInterval: 30000,
    skip: !enabled || !isSuperAdmin,
  });
  // Designs: a designer hears about new/changed designs and admin notes; an admin about completed
  // designs, designer notes and overdue work.
  const { data: designMe } = useGetDesignMeQuery(undefined, { skip: !enabled });
  const isDesigner = !!designMe?.designer;
  const { data: myDesignFeed } = useGetMyDesignFeedQuery(undefined, {
    pollingInterval: 30000,
    skip: !enabled || !isDesigner,
  });
  const { data: designAttention } = useGetDesignAttentionQuery(undefined, {
    pollingInterval: 30000,
    skip: !enabled || !isSuperAdmin,
  });
  // Quotation work belongs to the admin and Admin staff: they hear about work given to them, a
  // changed priority or order, quotations somebody completed, and late work.
  const { data: quoteMe } = useGetQuotationWorkMeQuery(undefined, { skip: !enabled });
  const managesQuotes = !!quoteMe?.canManage;
  const { data: quoteFeed } = useGetQuotationWorkFeedQuery(undefined, {
    pollingInterval: 30000,
    skip: !enabled || !managesQuotes,
  });
  const [markReminderDone] = useMarkReminderDoneMutation();
  const [markTodoComplete] = useMarkTodoCompleteMutation();
  const [markTaskComplete] = useMarkTaskCompleteMutation();
  const [markCompletionSeen] = useMarkCompletionSeenMutation();

  const reminders: BellReminder[] = notifData?.reminders ?? [];
  const todos = todoNotif?.todos ?? [];
  const dueTasks: EmployeeTask[] = dueTaskNotif?.tasks ?? [];
  const attention: EmployeeTask[] = isSuperAdmin ? (attentionNotif?.tasks ?? []) : [];
  const designSide: 'admin' | 'designer' = isSuperAdmin ? 'admin' : 'designer';
  const designs: DesignJob[] = isSuperAdmin ? designAttention?.jobs ?? [] : isDesigner ? myDesignFeed?.jobs ?? [] : [];
  const quotes: QuotationJob[] = managesQuotes ? quoteFeed?.jobs ?? [] : [];
  const badgeCount =
    (notifData?.count ?? 0) +
    (todoNotif?.count ?? 0) +
    (dueTaskNotif?.count ?? 0) +
    (isSuperAdmin ? attentionNotif?.count ?? 0 : 0) +
    designs.length +
    quotes.length;

  const counts = useMemo(() => {
    const c = { CUSTOMERS: 0, PRODUCTION: 0, APPLIANCE: 0, ARCHITECT: 0 };
    for (const r of reminders) c[sourceKeyOf(r)] += 1;
    return c;
  }, [reminders]);

  const chips = [
    {
      key: '',
      label: 'All',
      count: reminders.length + todos.length + dueTasks.length + attention.length + designs.length + quotes.length,
    },
    { key: 'TODOS', label: 'To-dos', st: SOURCE_META.TODOS.st, count: todos.length },
    { key: 'ASSIGNED', label: 'Assigned to me', st: SOURCE_META.ASSIGNED.st, count: dueTasks.length },
    ...(isSuperAdmin ? [{ key: 'TEAM', label: 'Team', st: SOURCE_META.TEAM.st, count: attention.length }] : []),
    ...(isSuperAdmin || isDesigner
      ? [{ key: 'DESIGNS', label: 'Designs', st: SOURCE_META.DESIGNS.st, count: designs.length }]
      : []),
    ...(managesQuotes ? [{ key: 'QUOTES', label: 'Quotations', st: SOURCE_META.QUOTES.st, count: quotes.length }] : []),
    { key: 'CUSTOMERS', label: 'Customers', st: SOURCE_META.CUSTOMERS.st, count: counts.CUSTOMERS },
    { key: 'PRODUCTION', label: 'Production', st: SOURCE_META.PRODUCTION.st, count: counts.PRODUCTION },
    { key: 'APPLIANCE', label: 'Appliance', st: SOURCE_META.APPLIANCE.st, count: counts.APPLIANCE },
    { key: 'ARCHITECT', label: 'Architects', st: SOURCE_META.ARCHITECT.st, count: counts.ARCHITECT },
  ];

  const isTaskFilter =
    filter === 'TODOS' || filter === 'ASSIGNED' || filter === 'TEAM' || filter === 'DESIGNS' || filter === 'QUOTES';
  const visibleReminders =
    filter === '' ? reminders : isTaskFilter ? [] : reminders.filter((r) => sourceKeyOf(r) === filter);
  const visibleTodos = filter === '' || filter === 'TODOS' ? todos : [];
  const visibleAssigned = filter === '' || filter === 'ASSIGNED' ? dueTasks : [];
  const visibleTeam = filter === '' || filter === 'TEAM' ? attention : [];
  const visibleDesigns = filter === '' || filter === 'DESIGNS' ? designs : [];
  const visibleQuotes = filter === '' || filter === 'QUOTES' ? quotes : [];

  // Server-computed bucket: everything in this feed is today-or-earlier, so it is either
  // OVERDUE or TODAY. To-dos due before today count as overdue by their date string; assigned
  // tasks carry a server-derived `overdue`; team items split by completed (news) vs open (overdue).
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueTodos = visibleTodos.filter((t: any) => t.todoDate && t.todoDate < todayStr);
  const todayTodos = visibleTodos.filter((t: any) => !t.todoDate || t.todoDate >= todayStr);
  const overdueReminders = visibleReminders.filter((r) => r.bucket === 'OVERDUE');
  const todayReminders = visibleReminders.filter((r) => r.bucket !== 'OVERDUE');
  // A task with an unread reply is listed once, under "New replies"; the rest keep their buckets.
  const repliedAssigned = visibleAssigned.filter((t) => unreadRepliesFor(t, 'assignee') > 0);
  const repliedTeam = visibleTeam.filter((t) => unreadRepliesFor(t, 'assigner') > 0);
  const restAssigned = visibleAssigned.filter((t) => unreadRepliesFor(t, 'assignee') === 0);
  const restTeam = visibleTeam.filter((t) => unreadRepliesFor(t, 'assigner') === 0);
  const overdueAssigned = restAssigned.filter((t) => t.overdue && !t.completed);
  const todayAssigned = restAssigned.filter((t) => !t.overdue && !t.completed);
  const completedTeam = restTeam.filter((t) => t.completed);
  const overdueTeam = restTeam.filter((t) => !t.completed);

  const totalVisible =
    visibleReminders.length +
    visibleTodos.length +
    visibleAssigned.length +
    visibleTeam.length +
    visibleDesigns.length +
    visibleQuotes.length;

  const viewAll = () => {
    setOpen(false);
    if (filter === 'TODOS' || filter === 'ASSIGNED') navigate(`${ROUTES.REMINDERS}?tab=todos`);
    else if (filter === 'TEAM') navigate(`${ROUTES.REMINDERS}?tab=team`);
    else if (filter === 'DESIGNS') navigate(ROUTES.DESIGNS);
    else if (filter === 'QUOTES') navigate(`${ROUTES.QUOTATIONS}?view=board`);
    else if (filter === '') navigate(ROUTES.REMINDERS);
    else navigate(`${ROUTES.REMINDERS}?source=${filter}`);
  };

  const openReminder = (r: BellReminder) => {
    setOpen(false);
    navigate(
      r.ownerType === 'APPLIANCE'
        ? ROUTES.APPLIANCE_QUARTZ
        : r.ownerType === 'ARCHITECT'
          ? ROUTES.ARCHITECTS
          : `/customers/${r.ownerId ?? r.customerId}`
    );
  };

  const doneReminder = async (id: number) => {
    try {
      await markReminderDone(id).unwrap();
      toast.success('Reminder marked done');
    } catch {
      toast.error('Failed to mark done');
    }
  };

  const doneTodo = async (id: number) => {
    try {
      await markTodoComplete(id).unwrap();
      toast.success('To-do completed');
    } catch {
      toast.error('Failed to complete to-do');
    }
  };

  const doneTask = async (id: number) => {
    try {
      await markTaskComplete(id).unwrap();
      toast.success('Done — your admin has been notified');
    } catch {
      toast.error('Failed to complete task');
    }
  };

  const seenTask = async (id: number) => {
    try {
      await markCompletionSeen(id).unwrap();
    } catch {
      toast.error('Failed to update task');
    }
  };

  const GroupHeader = ({ label, tone }: { label: string; tone: 'lost' | 'nego' | 'confirmed' }) => (
    <div className="px-4 py-1.5 bg-background-700/50 border-y border-background-600 first:border-t-0">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: `var(--st-${tone}-fg)` }}>
        {label}
      </span>
    </div>
  );

  const TodoRow = ({ t }: { t: any }) => (
    <div className="px-4 py-2.5 hover:bg-background-700 transition-colors">
      <button
        className="text-left w-full"
        onClick={() => {
          setOpen(false);
          navigate(`${ROUTES.REMINDERS}?tab=todos`);
        }}
      >
        <p className="text-[13px] text-text-900 font-medium">{t.todoTitle}</p>
        <p className="text-[11.5px] text-text-600 mt-0.5 flex items-center gap-1.5">
          <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: `var(--st-${SOURCE_META.TODOS.st}-fg)` }} />
          To-do{t.todoDate ? ` · due ${fmtDue(t.todoDate)}` : ''}
        </p>
      </button>
      <button onClick={() => doneTodo(t.id)} className="mt-1 inline-flex items-center gap-1 text-xs text-success hover:underline">
        <Check size={12} /> Mark done
      </button>
    </div>
  );

  /** A task assigned to me: priority stripe, "New" until I open my list, done from here. */
  const AssignedRow = ({ t }: { t: EmployeeTask }) => (
    <div className="px-4 py-2.5 hover:bg-background-700 transition-colors" style={{ borderLeft: `3px solid ${pstyle.hex(t.priority)}` }}>
      <button
        className="text-left w-full"
        onClick={() => {
          setOpen(false);
          navigate(`${ROUTES.REMINDERS}?tab=todos`);
        }}
      >
        <p className="text-[13px] text-text-900 font-medium flex items-center gap-2">
          <span className="truncate">{t.taskTitle}</span>
          {t.newForAssignee && (
            <span
              className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-[1px] rounded-full"
              style={{ background: 'var(--st-potential-bg)', color: 'var(--st-potential-fg)' }}
            >
              New
            </span>
          )}
          <span className="shrink-0 text-[10px] font-semibold px-1.5 py-[1px] rounded" style={pstyle.pill(t.priority)}>
            {PRIORITY_LABEL[t.priority] ?? t.priority}
          </span>
        </p>
        <p className="text-[11.5px] text-text-600 mt-0.5 flex items-center gap-1.5">
          <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: `var(--st-${SOURCE_META.ASSIGNED.st}-fg)` }} />
          Assigned by {t.assignedByName} · due {fmtDue(t.taskDate)}
        </p>
      </button>
      <button onClick={() => doneTask(t.id)} className="mt-1 inline-flex items-center gap-1 text-xs text-success hover:underline">
        <Check size={12} /> Mark done
      </button>
    </div>
  );

  /** A task I assigned: either "completed by X" (dismiss with Seen) or "overdue · X". */
  const TeamRow = ({ t }: { t: EmployeeTask }) => (
    <div className="px-4 py-2.5 hover:bg-background-700 transition-colors">
      <button
        className="text-left w-full"
        onClick={() => {
          setOpen(false);
          navigate(`${ROUTES.REMINDERS}?tab=team`);
        }}
      >
        <p className="text-[13px] text-text-900 font-medium">{t.taskTitle}</p>
        <p className="text-[11.5px] text-text-600 mt-0.5 flex items-center gap-1.5">
          <span
            className="w-[6px] h-[6px] rounded-full shrink-0"
            style={{ background: t.completed ? 'var(--st-confirmed-fg)' : 'var(--st-lost-fg)' }}
          />
          {t.completed
            ? `Completed by ${t.assignedToUserName}${t.completedAt ? ` · ${fmtReminderDateTime(t.completedAt)}` : ''}`
            : `${t.assignedToUserName} · was due ${fmtDue(t.taskDate)}`}
        </p>
      </button>
      {t.completed && (
        <button onClick={() => seenTask(t.id)} className="mt-1 inline-flex items-center gap-1 text-xs text-success hover:underline">
          <Eye size={12} /> Seen
        </button>
      )}
    </div>
  );

  /** A task with a reply I have not read: quotes the reply, opens the thread under the task. */
  const ReplyRow = ({ t, side }: { t: EmployeeTask; side: 'assignee' | 'assigner' }) => {
    const reply = latestReplyFromOtherSide(t, side);
    const unread = unreadRepliesFor(t, side);
    const who = reply?.authorName || (side === 'assigner' ? t.assignedToUserName : t.assignedByName);
    return (
      <div className="px-4 py-2.5 hover:bg-background-700 transition-colors">
        <button
          className="text-left w-full"
          onClick={() => {
            setOpen(false);
            navigate(`${ROUTES.REMINDERS}?tab=${side === 'assigner' ? 'team' : 'todos'}&task=${t.id}`);
          }}
        >
          <p className="text-[13px] text-text-900 font-medium flex items-center gap-1.5">
            <MessageCircle size={13} className="shrink-0" style={{ color: 'var(--st-potential-fg)' }} />
            <span className="truncate">{t.taskTitle}</span>
          </p>
          {reply && (
            <p className="text-[12.5px] text-text-900 mt-1 line-clamp-2 whitespace-pre-wrap break-words">
              <span className="font-semibold">{who}:</span> {reply.message}
            </p>
          )}
          <p className="text-[11.5px] text-text-600 mt-0.5">
            {unread > 1 ? `${unread} new replies` : 'New reply'}
            {reply ? ` · ${fmtReminderDateTime(reply.createdAt)}` : ''} · tap to answer
          </p>
        </button>
      </div>
    );
  };

  /** A design that needs this person: why (completed / note / changes / overdue), opens the design. */
  const DesignRow = ({ job }: { job: DesignJob }) => (
    <div className="px-4 py-2.5 hover:bg-background-700 transition-colors">
      <button
        className="text-left w-full"
        onClick={() => {
          setOpen(false);
          navigate(`${ROUTES.DESIGNS}?job=${job.id}`);
        }}
      >
        <p className="text-[13px] text-text-900 font-medium flex items-center gap-1.5">
          <Palette size={13} className="shrink-0" style={{ color: 'var(--st-potential-fg)' }} />
          <span className="truncate">{job.customerName}</span>
        </p>
        <p className="text-[12.5px] text-text-900 mt-0.5 line-clamp-2 break-words">{designNewsText(job, designSide)}</p>
        <p className="text-[11.5px] text-text-600 mt-0.5">
          {designSide === 'admin' ? `Design · ${job.designerName ?? 'no designer'}` : 'Your design'} · tap to open
        </p>
      </button>
    </div>
  );

  /** Quotation work that needs this person: new or changed work, late work, or a completed quotation. */
  const QuoteRow = ({ job }: { job: QuotationJob }) => (
    <div className="px-4 py-2.5 hover:bg-background-700 transition-colors">
      <button
        className="text-left w-full"
        onClick={() => {
          setOpen(false);
          navigate(`${ROUTES.QUOTATIONS}?view=board&job=${job.id}`);
        }}
      >
        <p className="text-[13px] text-text-900 font-medium flex items-center gap-1.5">
          <FileText size={13} className="shrink-0" style={{ color: 'var(--st-quote-fg)' }} />
          <span className="truncate">{job.customerName}</span>
        </p>
        <p className="text-[12.5px] text-text-900 mt-0.5 line-clamp-2 break-words">{quotationNewsText(job, managesQuotes)}</p>
        <p className="text-[11.5px] text-text-600 mt-0.5">
          {job.feedKind === 'COMPLETED' || (managesQuotes && job.assigneeId !== quoteMe?.userId)
            ? `Quotation · ${job.assigneeName ?? 'staff'}`
            : 'Your quotation'}{' '}
          · tap to open
        </p>
      </button>
    </div>
  );

  const ReminderRow = ({ r }: { r: BellReminder }) => {
    const meta = metaOf(r);
    return (
      <div className="px-4 py-2.5 hover:bg-background-700 transition-colors">
        <button className="text-left w-full" onClick={() => openReminder(r)}>
          <p className="text-[13px] text-text-900 font-medium">{r.title}</p>
          <p className="text-[11.5px] text-text-600 mt-0.5 flex items-center gap-1.5">
            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: `var(--st-${meta.st}-fg)` }} />
            {meta.label} · {r.ownerName ?? r.customerName} · {fmtReminderDateTime(r.remindAt)}
          </p>
        </button>
        <button onClick={() => doneReminder(r.id)} className="mt-1 inline-flex items-center gap-1 text-xs text-success hover:underline">
          <Check size={12} /> Mark done
        </button>
      </div>
    );
  };

  // Cap what the popover renders; "View all" carries the rest. Overdue first — it is the group
  // that actually needs attention — then completed team work (news), then today.
  let budget = MAX_ROWS;
  const take = <T,>(arr: T[]): T[] => {
    const slice = arr.slice(0, Math.max(0, budget));
    budget -= slice.length;
    return slice;
  };
  const shownDesigns = take(visibleDesigns);
  const shownQuotes = take(visibleQuotes);
  const shownRepliedTeam = take(repliedTeam);
  const shownRepliedAssigned = take(repliedAssigned);
  const shownOverdueAssigned = take(overdueAssigned);
  const shownOverdueTeam = take(overdueTeam);
  const shownOverdueTodos = take(overdueTodos);
  const shownOverdueReminders = take(overdueReminders);
  const shownCompletedTeam = take(completedTeam);
  const shownTodayAssigned = take(todayAssigned);
  const shownTodayTodos = take(todayTodos);
  const shownTodayReminders = take(todayReminders);
  const shownCount =
    shownDesigns.length +
    shownQuotes.length +
    shownRepliedTeam.length +
    shownRepliedAssigned.length +
    shownOverdueAssigned.length +
    shownOverdueTeam.length +
    shownOverdueTodos.length +
    shownOverdueReminders.length +
    shownCompletedTeam.length +
    shownTodayAssigned.length +
    shownTodayTodos.length +
    shownTodayReminders.length;
  const hasOverdue =
    shownOverdueAssigned.length + shownOverdueTeam.length + shownOverdueTodos.length + shownOverdueReminders.length > 0;
  const hasCompletedTeam = shownCompletedTeam.length > 0;
  const hasReplies = shownRepliedTeam.length + shownRepliedAssigned.length > 0;
  const hasToday = shownTodayAssigned.length + shownTodayTodos.length + shownTodayReminders.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-[34px] h-[34px] rounded-[10px] border border-background-600 bg-background-800 text-text-700 hover:bg-background-700 hover:text-text-900 flex items-center justify-center transition-colors"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {badgeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600 text-background-900 text-[10.5px] font-bold flex items-center justify-center tabular-nums">
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[352px] bg-background-800 border border-background-600 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-background-600 flex items-center gap-2">
              <AlarmClock size={15} className="text-primary-600" />
              <span className="text-sm font-semibold text-text-900">Reminders</span>
              <span className="flex-1" />
              <button onClick={viewAll} className="text-xs font-medium text-primary-600 hover:underline">
                View all
              </button>
            </div>

            {/* Source chips */}
            <div className="px-3 py-2.5 border-b border-background-600">
              <FilterChips dense items={chips} value={filter} onChange={(k) => setFilter(k as SourceKey)} />
            </div>

            {/* Rows */}
            <div className="max-h-[340px] overflow-y-auto">
              {totalVisible === 0 ? (
                <p className="px-4 py-6 text-sm text-text-600 text-center">
                  {filter === '' ? 'Nothing due. All caught up!' : 'Nothing due in this view.'}
                </p>
              ) : (
                <>
                  {shownDesigns.length > 0 && (
                    <>
                      <GroupHeader label="Designs" tone="nego" />
                      <div className="divide-y divide-background-600">
                        {shownDesigns.map((j) => (
                          <DesignRow key={`d${j.id}`} job={j} />
                        ))}
                      </div>
                    </>
                  )}
                  {shownQuotes.length > 0 && (
                    <>
                      <GroupHeader label="Quotations" tone="nego" />
                      <div className="divide-y divide-background-600">
                        {shownQuotes.map((j) => (
                          <QuoteRow key={`q${j.id}`} job={j} />
                        ))}
                      </div>
                    </>
                  )}
                  {hasReplies && (
                    <>
                      <GroupHeader label="New replies" tone="nego" />
                      <div className="divide-y divide-background-600">
                        {shownRepliedTeam.map((t) => (
                          <ReplyRow key={`rt${t.id}`} t={t} side="assigner" />
                        ))}
                        {shownRepliedAssigned.map((t) => (
                          <ReplyRow key={`ra${t.id}`} t={t} side="assignee" />
                        ))}
                      </div>
                    </>
                  )}
                  {hasOverdue && (
                    <>
                      <GroupHeader label="Overdue" tone="lost" />
                      <div className="divide-y divide-background-600">
                        {shownOverdueAssigned.map((t) => (
                          <AssignedRow key={`a${t.id}`} t={t} />
                        ))}
                        {shownOverdueTeam.map((t) => (
                          <TeamRow key={`m${t.id}`} t={t} />
                        ))}
                        {shownOverdueTodos.map((t: any) => (
                          <TodoRow key={`t${t.id}`} t={t} />
                        ))}
                        {shownOverdueReminders.map((r) => (
                          <ReminderRow key={`r${r.id}`} r={r} />
                        ))}
                      </div>
                    </>
                  )}
                  {hasCompletedTeam && (
                    <>
                      <GroupHeader label="Completed by your team" tone="confirmed" />
                      <div className="divide-y divide-background-600">
                        {shownCompletedTeam.map((t) => (
                          <TeamRow key={`m${t.id}`} t={t} />
                        ))}
                      </div>
                    </>
                  )}
                  {hasToday && (
                    <>
                      <GroupHeader label="Today" tone="nego" />
                      <div className="divide-y divide-background-600">
                        {shownTodayAssigned.map((t) => (
                          <AssignedRow key={`a${t.id}`} t={t} />
                        ))}
                        {shownTodayTodos.map((t: any) => (
                          <TodoRow key={`t${t.id}`} t={t} />
                        ))}
                        {shownTodayReminders.map((r) => (
                          <ReminderRow key={`r${r.id}`} r={r} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer: the cap, made honest */}
            {totalVisible > shownCount && (
              <button
                onClick={viewAll}
                className="w-full px-4 py-2.5 border-t border-background-600 text-xs font-medium text-primary-600 hover:bg-background-700 transition-colors text-left"
              >
                View all {totalVisible} →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
