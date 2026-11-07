import { describe, expect, it } from 'vitest';
import { allowedReminderTabs, pickReminderTab, type ReminderTabAccess } from './reminderTabs';

const staff = (over: Partial<ReminderTabAccess> = {}): ReminderTabAccess => ({
  isSuperAdmin: false,
  reminders: true,
  todos: true,
  mine: true,
  designs: false,
  ...over,
});

describe('allowedReminderTabs', () => {
  it('gives staff on the defaults reminders and to-dos only', () => {
    expect(allowedReminderTabs(staff())).toEqual(['reminders', 'todos']);
  });

  it('gives the administrator every tab', () => {
    expect(
      allowedReminderTabs({ isSuperAdmin: true, reminders: true, todos: true, mine: true, designs: true }),
    ).toEqual(['reminders', 'todos', 'team', 'designs', 'approvals']);
  });

  it('keeps the to-dos tab while either the own list or the given tasks are allowed', () => {
    expect(allowedReminderTabs(staff({ todos: false }))).toEqual(['reminders', 'todos']);
    expect(allowedReminderTabs(staff({ mine: false }))).toEqual(['reminders', 'todos']);
    expect(allowedReminderTabs(staff({ todos: false, mine: false }))).toEqual(['reminders']);
  });

  it('drops the reminders tab without reminders.view', () => {
    expect(allowedReminderTabs(staff({ reminders: false }))).toEqual(['todos']);
  });

  it('keeps a designer their designs when everything else is off', () => {
    expect(allowedReminderTabs(staff({ reminders: false, todos: false, mine: false, designs: true }))).toEqual([
      'designs',
    ]);
  });

  it('is empty when nothing is allowed', () => {
    expect(allowedReminderTabs(staff({ reminders: false, todos: false, mine: false }))).toEqual([]);
  });
});

describe('pickReminderTab', () => {
  it('opens the requested tab when it is allowed', () => {
    expect(pickReminderTab('todos', ['reminders', 'todos'])).toBe('todos');
  });

  it('falls back to the first allowed tab', () => {
    expect(pickReminderTab(null, ['reminders', 'todos'])).toBe('reminders');
    expect(pickReminderTab('team', ['reminders', 'todos'])).toBe('reminders');
    expect(pickReminderTab(null, ['todos'])).toBe('todos');
    expect(pickReminderTab('reminders', ['designs'])).toBe('designs');
  });

  it('is null when no tab is allowed', () => {
    expect(pickReminderTab('reminders', [])).toBeNull();
  });
});
