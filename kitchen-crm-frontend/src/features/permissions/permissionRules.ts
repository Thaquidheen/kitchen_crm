/**
 * Plain rules of the permission screens (no React), so they can be unit tested.
 */
import type { MyPermissions, PermissionMatrix, PermissionValues } from './types';

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

/** True when a staff type's answers are exactly the built-in defaults. */
export const isOnDefaults = (matrix: PermissionMatrix, values: PermissionValues, staffType: string): boolean =>
  matrix.modules.every((m) => m.permissions.every((p) => values[staffType]?.[p.key] === p.defaultAllowed));
