/**
 * Public Route Component
 * Routes accessible only when NOT authenticated (e.g., login, signup)
 */

import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { ROUTES } from './routes.config';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Already authenticated - redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Not authenticated - show public route
  return <>{children}</>;
};

export default PublicRoute;
