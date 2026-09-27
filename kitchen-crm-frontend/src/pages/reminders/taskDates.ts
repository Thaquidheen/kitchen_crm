/**
 * Day helpers for the task views. All string-based on YYYY-MM-DD so a date never passes through
 * new Date(iso) and gets shifted into the browser's timezone.
 */

const pad = (n: number) => String(n).padStart(2, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Today as YYYY-MM-DD in the browser's local calendar. */
export const localToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** The day N days from today, YYYY-MM-DD (local). */
export const daysFromToday = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** "17 Sep 2026" from YYYY-MM-DD. */
export const fmtDay = (iso?: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
};

/** A human caption for a due date: "due today", "due tomorrow", "overdue · was due 3 Sep 2026", … */
export const dueCaption = (iso?: string, completed?: boolean): string => {
  if (!iso) return '';
  if (completed) return `was due ${fmtDay(iso)}`;
  const today = localToday();
  if (iso === today) return 'due today';
  if (iso === daysFromToday(1)) return 'due tomorrow';
  if (iso < today) return `overdue · was due ${fmtDay(iso)}`;
  return `due ${fmtDay(iso)}`;
};
