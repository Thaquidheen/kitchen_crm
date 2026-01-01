/**
 * Protected Route Component
 * Guards routes that require authentication
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { UserRole } from '../types';
import { ROUTES } from './routes.config';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: UserRole | UserRole[];
}

export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
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

  // Authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
