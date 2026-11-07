/**
 * Which tabs of the Reminders page a person gets, and which one opens. Plain rules (no React) so
 * they can be unit tested.
 */

export type ReminderTab = 'reminders' | 'todos' | 'team' | 'designs' | 'approvals';

export interface ReminderTabAccess {
  isSuperAdmin: boolean;
  /** reminders.view */
  reminders: boolean;
  /** tasks.todos — their own to-do list */
  todos: boolean;
  /** tasks.mine — the tasks the administrator gave them */
  mine: boolean;
  /** A designer (or the administrator) whose staff type may open designs. */
  designs: boolean;
}

/** The tabs this person may open, in the order the page shows them. */
export const allowedReminderTabs = (a: ReminderTabAccess): ReminderTab[] => {
  const tabs: ReminderTab[] = [];
  if (a.reminders) {
    tabs.push('reminders');
  }
  // One tab holds both their own to-dos and the tasks given to them: shown while either is allowed.
  if (a.todos || a.mine) {
    tabs.push('todos');
  }
  if (a.isSuperAdmin) {
    tabs.push('team');
  }
  if (a.designs) {
    tabs.push('designs');
  }
  if (a.isSuperAdmin) {
    tabs.push('approvals');
  }
  return tabs;
};

/**
 * The tab to show: the one in the address when it is allowed, else the first allowed one (a link
 * from the bell or an old bookmark must not open a tab whose lists would only be refused). Null
 * when nothing on the page is allowed.
 */
export const pickReminderTab = (requested: string | null, allowed: ReminderTab[]): ReminderTab | null =>
  (allowed as string[]).includes(requested ?? '') ? (requested as ReminderTab) : allowed[0] ?? null;
