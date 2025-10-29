import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

const UserArea: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to dashboard for authenticated users
  return <Navigate to="/user/dashboard" replace />;
};

export default UserArea;