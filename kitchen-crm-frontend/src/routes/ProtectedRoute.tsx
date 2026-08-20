/**
 * Protected Route Component
 * Guards routes that require authentication
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { UserRole } from '../types';
import { ROUTES } from './routes.config';
import { selectFinanceKey } from '../features/finance/financeAccessSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: UserRole | UserRole[];
  /**
   * Gate on the concealed reporting module's unlock. Locked behaves EXACTLY like a wrong role —
   * a redirect to the dashboard — which is also what a mistyped URL does here (the catch-all
   * routes to login, which bounces an authenticated user to the dashboard). So probing /finance
   * is indistinguishable from a typo: no 403, no flash of the page, nothing to infer from.
   */
  requireReportingUnlock?: boolean;
}

export const ProtectedRoute = ({ children, requireRole, requireReportingUnlock }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const reportingKey = useAppSelector(selectFinanceKey);
  const location = useLocation();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requireRole && user) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    const hasRequiredRole = roles.includes(user.role);

    if (!hasRequiredRole) {
      // User doesn't have required role - redirect to dashboard
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
  }

  if (requireReportingUnlock && !reportingKey) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
