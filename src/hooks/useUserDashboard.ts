import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { bookingService, BookingCard, UserDashboardStats } from '@/services/booking.service';
import { packageService, ClientPackage } from '@/services/packageService';
import { profileService, UserProfile } from '@/services/profile.service';
import { logger } from '@/lib/logger';

// Types for dashboard data
export interface DashboardData {
  stats: UserDashboardStats | null;
  upcomingBookings: BookingCard[];
  recentBookings: BookingCard[];
  activePackages: ClientPackage[];
  profile: UserProfile | null;
  expiringPackages: ClientPackage[];
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

// Custom hook for user dashboard data
export const useUserDashboard = () => {
  const queryClient = useQueryClient();

  // Dashboard stats query
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['user-dashboard-stats'],
    queryFn: bookingService.getUserDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Upcoming bookings query
  const {
    data: upcomingBookings = [],
    isLoading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings
  } = useQuery({
    queryKey: ['user-upcoming-bookings'],
    queryFn: () => bookingService.getUserBookings({
      status: ['confirmed', 'pending'],
      limit: 5
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time updates
  });

  // Recent bookings query
  const {
    data: recentBookings = [],
    isLoading: recentLoading,
    error: recentError
  } = useQuery({
    queryKey: ['user-recent-bookings'],
    queryFn: () => bookingService.getUserBookings({
      status: ['completed', 'cancelled'],
      limit: 10,
      sort_by: 'start_time',
      sort_order: 'desc'
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    });

  // Active packages query
  const {
    data: activePackages = [],
    isLoading: packagesLoading,
    error: packagesError,
    refetch: refetchPackages
  } = useQuery({
    queryKey: ['user-active-packages'],
    queryFn: () => packageService.getClientPackages('current-user-id', {
      status: 'active',
      include_sessions: true
    }),
    staleTime: 3 * 60 * 1000, // 3 minutes
    select: (data: ClientPackage[]) => {
      // Filter packages expiring in next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      return {
        all: data,
        expiringSoon: data.filter(pkg =>
          pkg.expiry_date &&
          new Date(pkg.expiry_date) <= thirtyDaysFromNow
        )
      };
    },
  });

  // User profile query
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: profileService.getUserProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Combined loading state
  const isLoading = statsLoading || bookingsLoading || packagesLoading || profileLoading;

  // Combined error state
  const hasError = !!(statsError || bookingsError || packagesError || profileError);

  // Quick rebooking mutation
  const quickRebookMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const booking = upcomingBookings.find(b => b.id === bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Create new booking with same service details
      return bookingService.createBooking({
        service_id: booking.service_id,
        preferred_date: null, // Let user choose
        preferred_time: null,
        notes: `Rebook: Original booking ${bookingId}`
      });
    },
    onSuccess: (newBooking) => {
      queryClient.invalidateQueries({ queryKey: ['user-upcoming-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['user-recent-bookings'] });

      // Show success message
      logger.info('Quick rebook successful', { bookingId, newBookingId: newBooking.id });
    },
    onError: (error) => {
      logger.error('Quick rebook failed', { bookingId, error });
    }
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      return bookingService.cancelBooking(bookingId, reason);
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user-upcoming-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['user-recent-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard-stats'] });
    },
    onError: (error) => {
      logger.error('Cancel booking failed', { error });
    }
  });

  // Reschedule booking mutation
  const rescheduleBookingMutation = useMutation({
    mutationFn: async ({ bookingId, newDate, newTime }: {
      bookingId: string;
      newDate: string;
      newTime: string
    }) => {
      return bookingService.rescheduleBooking(bookingId, newDate, newTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-upcoming-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['user-calendar-events'] });
    },
    onError: (error) => {
      logger.error('Reschedule booking failed', { error });
    }
  });

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async ({ serviceId, notes }: { serviceId: string; notes?: string }) => {
      return profileService.addToFavorites(serviceId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
    },
    onError: (error) => {
      logger.error('Add to favorites failed', { error });
    }
  });

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      return profileService.removeFromFavorites(favoriteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
    },
    onError: (error) => {
      logger.error('Remove from favorites failed', { error });
    }
  });

  // Update notification preferences mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (preferences: Record<string, boolean>) => {
      return profileService.updateNotificationPreferences(preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      logger.error('Update notifications failed', { error });
    }
  });

  // Calculate quick stats
  const quickStats = {
    totalBookings: stats?.total_bookings || 0,
    upcomingBookings: stats?.upcoming_bookings || 0,
    completedServices: stats?.completed_services || 0,
    favoriteServices: stats?.favorite_services || 0,
    loyaltyPoints: stats?.loyalty_points || 0,
    activePackages: activePackages.length,
    expiringPackages: activePackages.length > 0 ? activePackages.filter(pkg => pkg.expiry_date && new Date(pkg.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length : 0,
  };

  // Memoized dashboard data
  const dashboardData: DashboardData = {
    stats,
    upcomingBookings,
    recentBookings,
    activePackages,
    profile,
    expiringPackages: activePackages.filter(pkg =>
      pkg.expiry_date &&
      new Date(pkg.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ),
    notifications: []
  };

  // Action handlers
  const handleQuickRebook = useCallback((bookingId: string) => {
    quickRebookMutation.mutate({ bookingId });
  }, [quickRebookMutation]);

  const handleCancelBooking = useCallback((bookingId: string, reason: string) => {
    cancelBookingMutation.mutate({ bookingId, reason });
  }, [cancelBookingMutation]);

  const handleRescheduleBooking = useCallback((bookingId: string, newDate: string, newTime: string) => {
    rescheduleBookingMutation.mutate({ bookingId, newDate, newTime });
  }, [rescheduleBookingMutation]);

  const handleAddToFavorites = useCallback((serviceId: string, notes?: string) => {
    addToFavoritesMutation.mutate({ serviceId, notes });
  }, [addToFavoritesMutation]);

  const handleRemoveFromFavorites = useCallback((favoriteId: string) => {
    removeFromFavoritesMutation.mutate(favoriteId);
  }, [removeFromFavoritesMutation]);

  const handleUpdateNotifications = useCallback((preferences: Record<string, boolean>) => {
    updateNotificationsMutation.mutate(preferences);
  }, [updateNotificationsMutation]);

  // Refresh all dashboard data
  const refreshDashboard = useCallback(() => {
    refetchStats();
    refetchBookings();
    refetchPackages();
    refetchProfile();
  }, [refetchStats, refetchBookings, refetchPackages, refetchProfile]);

  return {
    // Data
    dashboardData,
    quickStats,
    isLoading,
    hasError,

    // Individual data items
    stats,
    upcomingBookings,
    recentBookings,
    activePackages,
    profile,

    // Actions
    refreshDashboard,
    handleQuickRebook,
    handleCancelBooking,
    handleRescheduleBooking,
    handleAddToFavorites,
    handleRemoveFromFavorites,
    handleUpdateNotifications,

    // Mutation states
    isRebooking: quickRebookMutation.isPending,
    isCancelling: cancelBookingMutation.isPending,
    isRescheduling: rescheduleBookingMutation.isPending,
    isAddingToFavorites: addToFavoritesMutation.isPending,
    isRemovingFromFavorites: removeFromFavoritesMutation.isPending,
    isUpdatingNotifications: updateNotificationsMutation.isPending,
  };
};

export default useUserDashboard;