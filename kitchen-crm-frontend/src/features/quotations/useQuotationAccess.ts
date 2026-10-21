/** The quotation permissions of the signed-in person — see quotationAccess for what each means. */
import { useMemo } from 'react';
import { usePermissions } from '@/features/permissions/usePermissions';
import { quotationAccess } from './quotationAccess';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';

export function useQuotationAccess() {
  const { can, ready } = usePermissions();
  const admin = useIsSuperAdmin();
  return useMemo(() => ({ ...quotationAccess(can, admin), ready }), [can, admin, ready]);
}

export default useQuotationAccess;
