/**
 * The on/off switch of the Permissions page, shared by the staff type table and the one-person
 * table. A "Whole module" switch can also be half way (mixed) when only some of its permissions
 * are on; one click then turns them all on.
 */
import React from 'react';

export const PermissionSwitch: React.FC<{
  on: boolean;
  /** Some of a module's permissions on, some off. Only the "Whole module" switch uses it. */
  mixed?: boolean;
  changed: boolean;
  label: string;
  disabled?: boolean;
  /** Overrides the default hover text. */
  title?: string;
  onChange: (next: boolean) => void;
}> = ({ on, mixed, changed, label, disabled, title, onChange }) => (
  <button
    type="button"
    // A switch cannot be half on for a screen reader ("mixed" is read as off); a checkbox can.
    role={mixed ? 'checkbox' : 'switch'}
    aria-checked={mixed ? 'mixed' : on}
    aria-label={label}
    title={
      title ??
      (mixed ? 'Some allowed — click to allow all' : on ? 'Allowed — click to refuse' : 'Not allowed — click to allow')
    }
    disabled={disabled}
    onClick={() => onChange(mixed ? true : !on)}
    className="relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-colors disabled:opacity-60"
    style={{
      background: mixed
        ? 'color-mix(in oklab, var(--color-primary-600) 45%, var(--color-background-500))'
        : on
          ? 'var(--color-primary-600)'
          : 'var(--color-background-500)',
      // A moved switch stays marked until it is saved or put back.
      boxShadow: changed ? '0 0 0 2px var(--color-background-800), 0 0 0 4px var(--st-nego-fg)' : undefined,
    }}
  >
    <span
      className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
      style={{ transform: mixed ? 'translateX(12px)' : on ? 'translateX(21px)' : 'translateX(3px)' }}
    />
  </button>
);

/** The cell shown where a permission (or a whole module) means nothing for a staff type. */
export const NotForType: React.FC<{ what: string; type: string }> = ({ what, type }) => (
  <span className="text-[13px] text-text-500" title={`Not something ${type} does`} aria-label={`${what} — not for ${type}`}>
    —
  </span>
);

/** Marks a permission that only hides buttons on the screen (the server cannot check it). */
export const ScreenOnlyBadge: React.FC = () => (
  <span
    className="text-[10.5px] font-semibold px-1.5 py-[1px] rounded-full bg-background-700 border border-background-600 text-text-700"
    title="This one only hides the buttons on the screen."
  >
    Screen only
  </span>
);

export default PermissionSwitch;
