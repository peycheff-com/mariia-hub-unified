import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Heart,
  Star,
  TrendingUp,
  MapPin,
  User,
  CreditCard,
  Bell,
  ArrowRight,
  Award,
  Gift,
  Sparkles,
  Package
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { UserDashboardStats, BookingCard, PersonalizedRecommendation, QuickAction } from '@/types/user';
import { bookingService } from '@/services/booking.service';
import PackageBalance from '@/components/dashboard/PackageBalance';
import UpcomingAppointments from '@/components/dashboard/UpcomingAppointments';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';

const UserDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [greeting, setGreeting] = useState('');

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-dashboard-stats'],
    queryFn: () => bookingService.getUserDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch upcoming bookings
  const { data: upcomingBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['user-upcoming-bookings', { limit: 3 }],
    queryFn: () => bookingService.getUserBookings({ status: ['confirmed'], limit: 3 }),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['user-recommendations'],
    queryFn: () => bookingService.getPersonalizedRecommendations(),
    staleTime: 10 * 60 * 1000,
  });

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('user.dashboard.greetingMorning'));
    else if (hour < 18) setGreeting(t('user.dashboard.greetingAfternoon'));
    else setGreeting(t('user.dashboard.greetingEvening'));
  }, [i18n.language, t]);

  const quickActions: QuickAction[] = [
    {
      id: 'book',
      label: t('user.dashboard.quickActions.book'),
      icon: Calendar,
      href: '/booking',
      color: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
    },
    {
      id: 'favorites',
      label: t('user.dashboard.quickActions.favorites'),
      icon: Heart,
      href: '/user/favorites',
      color: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700',
    },
    {
      id: 'history',
      label: t('user.dashboard.quickActions.history'),
      icon: Clock,
      href: '/user/bookings',
      color: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700',
    },
    {
      id: 'profile',
      label: t('user.dashboard.quickActions.profile'),
      icon: User,
      href: '/user/profile',
      color: 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language === 'pl' ? 'pl-PL' : 'en-US', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (statsLoading || bookingsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {greeting}, {stats?.user_name || t('user.dashboard.defaultGreeting')}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            {t('user.dashboard.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatCard
            title={t('user.dashboard.stats.totalBookings')}
            value={stats?.total_bookings || 0}
            icon={Calendar}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            title={t('user.dashboard.stats.upcoming')}
            value={stats?.upcoming_bookings || 0}
            icon={Clock}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            title={t('user.dashboard.stats.completed')}
            value={stats?.completed_services || 0}
            icon={Star}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
          <StatCard
            title={t('user.dashboard.stats.favorites')}
            value={stats?.favorite_services || 0}
            icon={Heart}
            color="text-pink-600"
            bgColor="bg-pink-100"
          />
        </div>

        {/* Next Appointment Alert */}
        {stats?.next_appointment && (
          <Alert className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <Calendar className="h-5 w-5 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">
                  {t('user.dashboard.nextAppointment')}:
                </span>{' '}
                {stats.next_appointment.service_name} - {formatDate(stats.next_appointment.date)} at {formatTime(stats.next_appointment.time)}
                <span className="ml-2 text-sm text-gray-600">
                  ({stats.next_appointment.location})
                </span>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/user/bookings">
                  {t('user.dashboard.viewDetails')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('user.dashboard.quickActions.title')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    asChild
                    className={cn(
                      'h-auto p-6 flex flex-col items-center justify-center text-white shadow-lg transform transition-all duration-200 hover:scale-105',
                      action.color
                    )}
                  >
                    <Link to={action.href}>
                      <action.icon className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            {/* Upcoming Bookings */}
            {upcomingBookings && upcomingBookings.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t('user.dashboard.upcomingBookings')}</CardTitle>
                    <CardDescription>
                      {t('user.dashboard.upcomingBookingsDesc')}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/user/bookings">
                      {t('user.dashboard.viewAll')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingBookings.map((booking: BookingCard) => (
                    <div
                      key={booking.id}
                      className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors"
                    >
                      {booking.image_url && (
                        <img
                          src={booking.image_url}
                          alt={booking.service_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {booking.service_name}
                        </h3>
                        <p className="text-sm text-gray-600">{booking.provider_name}</p>
                        <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(booking.date)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatTime(booking.time)}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.location}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(booking.price)}
                        </p>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {t(`booking.status.${booking.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Personalized Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
                    {t('user.dashboard.recommendations')}
                  </CardTitle>
                  <CardDescription>
                    {t('user.dashboard.recommendationsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.slice(0, 4).map((rec: PersonalizedRecommendation) => (
                      <div
                        key={rec.service.id}
                        className="group relative overflow-hidden rounded-lg border border-gray-200 hover:border-amber-300 transition-all duration-200"
                      >
                        <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100">
                          {rec.service.image_url && (
                            <img
                              src={rec.service.image_url}
                              alt={rec.service.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <Badge variant="secondary" className="mb-2">
                            {rec.category}
                          </Badge>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {rec.service.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {rec.service.description}
                          </p>
                          <p className="text-xs text-amber-600 mb-3">
                            {rec.reason}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(rec.service.price)}
                            </span>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/booking?service=${rec.service.id}`}>
                                {t('common.book')}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Loyalty Points */}
            {stats?.loyalty_points !== undefined && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-amber-800">
                    <Award className="h-5 w-5 mr-2" />
                    {t('user.dashboard.loyaltyPoints')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-amber-600 mb-2">
                      {stats.loyalty_points.toLocaleString()}
                    </div>
                    <p className="text-sm text-amber-700 mb-4">
                      {t('user.dashboard.pointsValue', { points: stats.loyalty_points })}
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      <Gift className="h-4 w-4 mr-2" />
                      {t('user.dashboard.redeemPoints')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  {t('user.dashboard.tips.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">
                      {t('user.dashboard.tips.tip1')}
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">
                      {t('user.dashboard.tips.tip2')}
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600">
                      {t('user.dashboard.tips.tip3')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Need Help */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <Bell className="h-5 w-5 mr-2" />
                  {t('user.dashboard.needHelp')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700 mb-4">
                  {t('user.dashboard.needHelpDesc')}
                </p>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t('user.dashboard.managePayment')}
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    {t('user.dashboard.updateAddress')}
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    {t('user.dashboard.notification aria-live="polite" aria-atomic="true"Settings')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for stat cards
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = ({ title, value, icon: Icon, color, bgColor }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={cn('p-3 rounded-full', bgColor)}>
            <Icon className={cn('h-6 w-6', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton loader
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;