/**
 * Plain rules of the permission screens (no React), so they can be unit tested.
 */
import type {
  MyPermissions,
  PermissionInfo,
  PermissionMatrix,
  PermissionModule,
  PermissionValues,
  PersonChanges,
  PersonOverrides,
} from './types';

/** A super admin may do everything; anyone else only what their staff type allows. Unknown = no. */
export const isAllowed = (isSuperAdmin: boolean, mine: MyPermissions | undefined, key: string): boolean =>
  isSuperAdmin || mine?.permissions?.[key] === true;

/** Only the answers that differ from what is saved — that is all a save sends. */
export const changedValues = (saved: PermissionValues, edited: PermissionValues): PermissionValues => {
  const out: PermissionValues = {};
  for (const [type, row] of Object.entries(edited)) {
    for (const [key, allowed] of Object.entries(row)) {
      if (saved[type]?.[key] !== allowed) {
        (out[type] ??= {})[key] = allowed;
      }
    }
  }
  return out;
};

export const countChanges = (changes: PermissionValues): number =>
  Object.values(changes).reduce((n, row) => n + Object.keys(row).length, 0);

/** False for a staff type the permission means nothing for: the page shows no switch there. */
export const appliesTo = (p: PermissionInfo, staffType: string): boolean =>
  !p.appliesTo || p.appliesTo.includes(staffType);

/** True when a staff type's answers are exactly the built-in defaults. */
export const isOnDefaults = (matrix: PermissionMatrix, values: PermissionValues, staffType: string): boolean =>
  matrix.modules.every((m) =>
    m.permissions.every((p) => !appliesTo(p, staffType) || values[staffType]?.[p.key] === p.defaultAllowed),
  );

/**
 * The permission a switch only works together with, when that one is off for the staff type:
 * the switch keeps its own answer but does nothing until the other one is on again.
 */
export const blockedBy = (
  matrix: PermissionMatrix,
  values: PermissionValues,
  p: PermissionInfo,
  staffType: string,
): PermissionInfo | null => blockedByAnswer(matrix.modules, p, (x) => values[staffType]?.[x.key] === true);

/**
 * The same question for any set of answers (a staff type's, or one person's): the first permission
 * along the "only works together with" chain that is off, or null when nothing blocks.
 */
export const blockedByAnswer = (
  modules: PermissionModule[],
  p: PermissionInfo,
  answer: (x: PermissionInfo) => boolean,
): PermissionInfo | null => {
  const all = modules.flatMap((m) => m.permissions);
  let current: PermissionInfo | undefined = p;
  // Follow the chain (a production change needs "Open production jobs", which needs nothing more).
  for (let guard = 0; current?.requires && guard < 10; guard++) {
    const required = all.find((x) => x.key === current!.requires);
    if (!required) {return null;}
    if (!answer(required)) {return required;}
    current = required;
  }
  return null;
};

/* ---------- One click for a whole module ---------- */

/**
 * on = every permission of the module that the staff type can have is on, off = none is,
 * mixed = some are; none = nothing in the module is for that staff type (no switch at all).
 */
export type ModuleSwitchState = 'on' | 'off' | 'mixed' | 'none';

/** The permissions of a module that a staff type can be given. */
export const applicablePermissions = (module: PermissionModule, staffType: string): PermissionInfo[] =>
  module.permissions.filter((p) => appliesTo(p, staffType));

export const moduleSwitchState = (
  module: PermissionModule,
  staffType: string,
  answer: (p: PermissionInfo) => boolean,
): ModuleSwitchState => {
  const ps = applicablePermissions(module, staffType);
  if (ps.length === 0) {return 'none';}
  const on = ps.filter(answer).length;
  return on === ps.length ? 'on' : on === 0 ? 'off' : 'mixed';
};

/** What one click on the module switch turns everything to: off from on, on from off or mixed. */
export const moduleSwitchNext = (state: ModuleSwitchState): boolean => state !== 'on';

/** A staff type column with every permission of the module that applies to it set to `on`. */
export const applyModuleToType = (
  values: PermissionValues,
  module: PermissionModule,
  staffType: string,
  on: boolean,
): PermissionValues => {
  const row = { ...values[staffType] };
  applicablePermissions(module, staffType).forEach((p) => {
    row[p.key] = on;
  });
  return { ...values, [staffType]: row };
};

/* ---------- One person ---------- */

/**
 * What a person gets from one switch: what is set just for them when there is something, else
 * what their staff type says. A permission that is not for their staff type is never theirs, even
 * when something was once set for them (it counts again if their type changes back).
 */
export const personAnswer = (
  p: PermissionInfo,
  staffType: string,
  typeValues: Record<string, boolean>,
  overrides: PersonOverrides,
): boolean => {
  if (!appliesTo(p, staffType)) {return false;}
  return p.key in overrides ? overrides[p.key] === true : typeValues[p.key] === true;
};

/**
 * One click on a module for a person: sets something just for them on every permission of the
 * module their staff type can have, so they keep it even when the staff type changes later.
 */
export const applyModuleToPerson = (
  overrides: PersonOverrides,
  module: PermissionModule,
  staffType: string,
  on: boolean,
): PersonOverrides => {
  const next = { ...overrides };
  applicablePermissions(module, staffType).forEach((p) => {
    next[p.key] = on;
  });
  return next;
};

/** "Use staff type" for one permission: nothing set just for them any more. */
export const clearOverride = (overrides: PersonOverrides, key: string): PersonOverrides => {
  const next = { ...overrides };
  delete next[key];
  return next;
};

/** Only what differs from what is saved for the person; null = follow the staff type again. */
export const personChanges = (saved: PersonOverrides, edited: PersonOverrides): PersonChanges => {
  const out: PersonChanges = {};
  for (const [key, allowed] of Object.entries(edited)) {
    if (saved[key] !== allowed) {out[key] = allowed;}
  }
  for (const key of Object.keys(saved)) {
    if (!(key in edited)) {out[key] = null;}
  }
  return out;
};
