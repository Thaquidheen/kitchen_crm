/** The quotation permissions of the signed-in person — see quotationAccess for what each means. */
import { useMemo } from 'react';
import { usePermissions } from '@/features/permissions/usePermissions';
import { quotationAccess } from './quotationAccess';

export function useQuotationAccess() {
  const { can, ready } = usePermissions();
  return useMemo(() => ({ ...quotationAccess(can), ready }), [can, ready]);
}

export default useQuotationAccess;
