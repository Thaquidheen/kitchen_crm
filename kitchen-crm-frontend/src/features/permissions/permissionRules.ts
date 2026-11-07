/**
 * Plain rules of the permission screens (no React), so they can be unit tested.
 */
import type { MyPermissions, PermissionInfo, PermissionMatrix, PermissionValues } from './types';

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
): PermissionInfo | null => {
  const all = matrix.modules.flatMap((m) => m.permissions);
  let current: PermissionInfo | undefined = p;
  // Follow the chain (a production change needs "Open production jobs", which needs nothing more).
  for (let guard = 0; current?.requires && guard < 10; guard++) {
    const required = all.find((x) => x.key === current!.requires);
    if (!required) {return null;}
    if (values[staffType]?.[required.key] !== true) {return required;}
    current = required;
  }
  return null;
};
