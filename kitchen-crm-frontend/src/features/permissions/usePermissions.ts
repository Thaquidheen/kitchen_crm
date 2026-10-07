/**
 * "May the signed-in person do this?" — the one hook the screens ask.
 *
 * A super admin may do everything. Everybody else gets what the administrator allowed their staff
 * type; it is re-read every minute and when the window gets focus back, so a change made on the
 * Permissions page reaches people without them signing in again. This only decides what the
 * screens show — the server checks every action itself.
 */
import { useCallback } from 'react';
import { useAppSelector } from '@/app/hooks';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';
import { useGetMyPermissionsQuery } from './permissionsAPI';
import { isAllowed } from './permissionRules';
import type { PermissionKey } from './types';

export function usePermissions() {
  const isSuperAdmin = useIsSuperAdmin();
  const signedIn = useAppSelector((state) => !!state.auth.user);
  const { data, isError } = useGetMyPermissionsQuery(undefined, {
    skip: !signedIn || isSuperAdmin,
    pollingInterval: 60000,
    refetchOnFocus: true,
  });
  const can = useCallback((key: PermissionKey) => isAllowed(isSuperAdmin, data, key), [isSuperAdmin, data]);
  return {
    can,
    /** False until we know the answers; hide rather than flash what may not be allowed. */
    ready: isSuperAdmin || data !== undefined || isError,
  };
}

export default usePermissions;
