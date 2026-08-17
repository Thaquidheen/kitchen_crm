/**
 * Reminder date/time formatting shared by the bell and the Reminders page.
 *
 * The backend sends naive LocalDateTime strings that already ARE business-timezone wall-clock
 * values. `new Date(iso)` would reinterpret them in the browser's zone and shift the time —
 * so these format by string-splitting, never by Date parsing of the full stamp.
 */

export const fmtReminderDate = (iso?: string): string => {
  if (!iso) return '—';
  const [datePart] = iso.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return datePart;
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const fmtReminderTime = (iso?: string): string => {
  if (!iso || !iso.includes('T')) return '';
  const [h, min] = iso.split('T')[1].split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return '';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${min} ${suffix}`;
};

/** "14 Aug, 10:00 AM" — the bell's caption format. */
export const fmtReminderDateTime = (iso?: string): string => {
  if (!iso) return '—';
  const date = fmtReminderDate(iso).replace(/, \d{4}$/, '');
  const time = fmtReminderTime(iso);
  return time ? `${date}, ${time}` : date;
};
