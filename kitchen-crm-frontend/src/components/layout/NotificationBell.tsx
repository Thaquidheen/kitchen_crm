/**
 * NotificationBell
 * The navbar bell, extracted from Header. Pools the user's due to-dos and the shared reminder
 * feed, but lets the user filter by module — All / To-dos / Customers / Production / Appliance —
 * and groups rows Overdue vs Today (the payload's server-computed `bucket`, which the old inline
 * bell ignored: "Today's reminders" was silently mostly overdue).
 *
 * Times render via the shared string-splitting formatters — the old bell ran naive
 * LocalDateTimes through new Date(), shifting them into the browser's timezone.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, Bell, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetReminderNotificationsQuery, useMarkReminderDoneMutation } from '../../app/baseApi';
import { useGetMyDueTodosQuery, useMarkTodoCompleteMutation } from '../../features/task-management/taskAPI';
import { ROUTES } from '../../routes/routes.config';
import { FilterChips } from '../shared/FilterChips';
import { fmtReminderDateTime } from '../../utils/reminderFormat';

type SourceKey = '' | 'TODOS' | 'CUSTOMERS' | 'PRODUCTION' | 'APPLIANCE';

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

/** Source presentation: dot token + caption. To-dos handled separately. */
const SOURCE_META: Record<string, { st: string; label: string }> = {
  CUSTOMERS: { st: 'design', label: 'Customer' },
  FOLLOW_UP: { st: 'design', label: 'Follow-up' },
  PRODUCTION: { st: 'nego', label: 'Production' },
  APPLIANCE: { st: 'quote', label: 'Appliance & Quartz' },
  TODOS: { st: 'draft', label: 'To-do' },
};

const sourceKeyOf = (r: BellReminder): Exclude<SourceKey, '' | 'TODOS'> => {
  if (r.ownerType === 'APPLIANCE') return 'APPLIANCE';
  if (r.source === 'PRODUCTION') return 'PRODUCTION';
  return 'CUSTOMERS';
};

/** Caption meta for one reminder row — follow-ups sit under Customers but say what they are. */
const metaOf = (r: BellReminder) =>
  r.source === 'FOLLOW_UP' && r.ownerType !== 'APPLIANCE'
    ? SOURCE_META.FOLLOW_UP
    : SOURCE_META[sourceKeyOf(r)];

const MAX_ROWS = 8;

export function NotificationBell({ enabled }: { enabled: boolean }) {
  const navigate = useNavigate();
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
  const [markReminderDone] = useMarkReminderDoneMutation();
  const [markTodoComplete] = useMarkTodoCompleteMutation();

  const reminders: BellReminder[] = notifData?.reminders ?? [];
  const todos = todoNotif?.todos ?? [];
  const badgeCount = (notifData?.count ?? 0) + (todoNotif?.count ?? 0);

  const counts = useMemo(() => {
    const c = { CUSTOMERS: 0, PRODUCTION: 0, APPLIANCE: 0 };
    for (const r of reminders) c[sourceKeyOf(r)] += 1;
    return c;
  }, [reminders]);

  const chips = [
    { key: '', label: 'All', count: reminders.length + todos.length },
    { key: 'TODOS', label: 'To-dos', st: SOURCE_META.TODOS.st, count: todos.length },
    { key: 'CUSTOMERS', label: 'Customers', st: SOURCE_META.CUSTOMERS.st, count: counts.CUSTOMERS },
    { key: 'PRODUCTION', label: 'Production', st: SOURCE_META.PRODUCTION.st, count: counts.PRODUCTION },
    { key: 'APPLIANCE', label: 'Appliance', st: SOURCE_META.APPLIANCE.st, count: counts.APPLIANCE },
  ];

  const visibleReminders =
    filter === '' ? reminders : filter === 'TODOS' ? [] : reminders.filter((r) => sourceKeyOf(r) === filter);
  const visibleTodos = filter === '' || filter === 'TODOS' ? todos : [];

  // Server-computed bucket: everything in this feed is today-or-earlier, so it is either
  // OVERDUE or TODAY. To-dos due before today count as overdue by their date string.
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueTodos = visibleTodos.filter((t: any) => t.todoDate && t.todoDate < todayStr);
  const todayTodos = visibleTodos.filter((t: any) => !t.todoDate || t.todoDate >= todayStr);
  const overdueReminders = visibleReminders.filter((r) => r.bucket === 'OVERDUE');
  const todayReminders = visibleReminders.filter((r) => r.bucket !== 'OVERDUE');

  const totalVisible = visibleReminders.length + visibleTodos.length;

  const viewAll = () => {
    setOpen(false);
    if (filter === 'TODOS') navigate(`${ROUTES.REMINDERS}?tab=todos`);
    else if (filter === '') navigate(ROUTES.REMINDERS);
    else navigate(`${ROUTES.REMINDERS}?source=${filter}`);
  };

  const openReminder = (r: BellReminder) => {
    setOpen(false);
    navigate(
      r.ownerType === 'APPLIANCE' ? ROUTES.APPLIANCE_QUARTZ : `/customers/${r.ownerId ?? r.customerId}`
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

  const GroupHeader = ({ label, tone }: { label: string; tone: 'lost' | 'nego' }) => (
    <div className="px-4 py-1.5 bg-background-700/50 border-y border-background-600 first:border-t-0">
      <span
        className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: `var(--st-${tone}-fg)` }}
      >
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
          <span
            className="w-[6px] h-[6px] rounded-full shrink-0"
            style={{ background: `var(--st-${SOURCE_META.TODOS.st}-fg)` }}
          />
          To-do{t.todoDate ? ` · due ${t.todoDate.split('-').reverse().join('/')}` : ''}
        </p>
      </button>
      <button
        onClick={() => doneTodo(t.id)}
        className="mt-1 inline-flex items-center gap-1 text-xs text-success hover:underline"
      >
        <Check size={12} /> Mark done
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
            <span
              className="w-[6px] h-[6px] rounded-full shrink-0"
              style={{ background: `var(--st-${meta.st}-fg)` }}
            />
            {meta.label} · {r.ownerName ?? r.customerName} · {fmtReminderDateTime(r.remindAt)}
          </p>
        </button>
        <button
          onClick={() => doneReminder(r.id)}
          className="mt-1 inline-flex items-center gap-1 text-xs text-success hover:underline"
        >
          <Check size={12} /> Mark done
        </button>
      </div>
    );
  };

  // Cap what the popover renders; "View all" carries the rest. Overdue first — it is the
  // group that actually needs attention.
  let budget = MAX_ROWS;
  const take = <T,>(arr: T[]): T[] => {
    const slice = arr.slice(0, Math.max(0, budget));
    budget -= slice.length;
    return slice;
  };
  const shownOverdueTodos = take(overdueTodos);
  const shownOverdueReminders = take(overdueReminders);
  const shownTodayTodos = take(todayTodos);
  const shownTodayReminders = take(todayReminders);
  const shownCount =
    shownOverdueTodos.length + shownOverdueReminders.length + shownTodayTodos.length + shownTodayReminders.length;
  const hasOverdue = shownOverdueTodos.length + shownOverdueReminders.length > 0;
  const hasToday = shownTodayTodos.length + shownTodayReminders.length > 0;

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
              <FilterChips
                dense
                items={chips}
                value={filter}
                onChange={(k) => setFilter(k as SourceKey)}
              />
            </div>

            {/* Rows */}
            <div className="max-h-[340px] overflow-y-auto">
              {totalVisible === 0 ? (
                <p className="px-4 py-6 text-sm text-text-600 text-center">
                  {filter === '' ? 'Nothing due. All caught up!' : 'Nothing due in this view.'}
                </p>
              ) : (
                <>
                  {hasOverdue && (
                    <>
                      <GroupHeader label="Overdue" tone="lost" />
                      <div className="divide-y divide-background-600">
                        {shownOverdueTodos.map((t: any) => (
                          <TodoRow key={`t${t.id}`} t={t} />
                        ))}
                        {shownOverdueReminders.map((r) => (
                          <ReminderRow key={`r${r.id}`} r={r} />
                        ))}
                      </div>
                    </>
                  )}
                  {hasToday && (
                    <>
                      <GroupHeader label="Today" tone="nego" />
                      <div className="divide-y divide-background-600">
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
