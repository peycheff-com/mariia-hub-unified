import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui/page-loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/auth'
}) => {
  const { user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // Show loader while checking authentication
  if (isLoading) {
    return <PageLoader />;
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check for required role
  if (requiredRole && !hasRole(requiredRole)) {
    // User is authenticated but doesn't have required role
    // Redirect to home or an unauthorized page
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has required role (if any)
  return <>{children}</>;
};