/**
 * One place that answers "is the signed-in user a super admin?".
 *
 * Used to hide internal pricing (margins, pre-margin base totals, per-unit cost rates) from
 * staff in the quotation flow. This is presentation only — the real boundary is server-side in
 * QuotationServiceImpl, which omits those fields from the response for non-admins.
 */

import { useAppSelector } from '@/app/hooks';

export const useIsSuperAdmin = (): boolean =>
  useAppSelector((state) => state.auth.user?.role) === 'ROLE_SUPER_ADMIN';

export default useIsSuperAdmin;
