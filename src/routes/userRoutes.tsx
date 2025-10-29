import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import { UserRouteGuard } from '@/components/auth/UserRouteGuard';
import { PageLoader } from '@/components/ui/page-loader';

// Lazy load user pages
const UserDashboard = lazy(() => import('@/pages/user/Dashboard'));
const UserEditProfile = lazy(() => import('@/pages/user/Profile'));
const UserBookings = lazy(() => import('@/pages/user/Bookings'));
const UserFavorites = lazy(() => import('@/pages/user/Favorites'));

export const UserRoutes: React.FC = () => {
  return (
    <UserRouteGuard>
      <Routes>
        <Route
          path="/user/dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <UserDashboard />
            </Suspense>
          }
        />
        <Route
          path="/user/profile"
          element={
            <Suspense fallback={<PageLoader />}>
              <UserEditProfile />
            </Suspense>
          }
        />
        <Route
          path="/user/bookings"
          element={
            <Suspense fallback={<PageLoader />}>
              <UserBookings />
            </Suspense>
          }
        />
        <Route
          path="/user/favorites"
          element={
            <Suspense fallback={<PageLoader />}>
              <UserFavorites />
            </Suspense>
          }
        />
      </Routes>
    </UserRouteGuard>
  );
};