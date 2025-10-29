import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

interface UserRouteGuardProps {
  children: React.ReactNode;
}

export const UserRouteGuard: React.FC<UserRouteGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login with return URL
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};