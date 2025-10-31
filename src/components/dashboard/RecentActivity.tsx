import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Star,
  Package,
  Heart,
  MessageSquare,
  CreditCard,
  TrendingUp,
  User,
  MoreHorizontal,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { bookingService } from '@/services/booking.service';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/components/ui/use-toast';

interface RecentActivityProps {
  maxItems?: number;
  className?: string;
}

type ActivityType =
  | 'booking_created'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'package_purchased'
  | 'package_session_used'
  | 'review_submitted'
  | 'favorited'
  | 'payment_processed'
  | 'profile_updated';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
  icon: React.ComponentType<any>;
  actionUrl?: string;
  actionText?: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
}

const RecentActivity: React.FC<RecentActivityProps> = ({ maxItems = 10, className }) => {
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'bookings' | 'packages' | 'reviews'>('all');

  // Mock activity data (in real app, this would come from an activity log table)
  const { data: activities = [], isLoading } = useQuery<ActivityItem[]>({
    queryKey: ['recent-activity', { limit: maxItems, filter }],
    queryFn: async () => {
      // This would be a real API call
      return [
        {
          id: '1',
          type: 'booking_completed',
          title: t('dashboard.activity.bookingCompleted', 'Appointment Completed'),
          description: t('dashboard.activity.bookingCompletedDesc', 'Your microblading appointment has been completed'),
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: Check,
          actionUrl: '/user/bookings',
          actionText: t('dashboard.activity.viewBooking', 'View Booking'),
          severity: 'success',
          metadata: {
            service_name: 'Microblading',
            provider_name: 'Mariia'
          }
        },
        {
          id: '2',
          type: 'package_purchased',
          title: t('dashboard.activity.packagePurchased', 'Package Purchased'),
          description: t('dashboard.activity.packagePurchasedDesc', 'You purchased the Glute Transformation package'),
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          icon: Package,
          actionUrl: '/user/packages',
          actionText: t('dashboard.activity.viewPackage', 'View Package'),
          severity: 'info',
          metadata: {
            package_name: 'Glute Transformation',
            amount: 1200,
            sessions: 24
          }
        },
        {
          id: '3',
          type: 'review_submitted',
          title: t('dashboard.activity.reviewSubmitted', 'Review Submitted'),
          description: t('dashboard.activity.reviewSubmittedDesc', 'Thank you for your feedback!'),
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          icon: Star,
          actionUrl: '/reviews',
          severity: 'success',
          metadata: {
            service_name: 'Personal Training',
            rating: 5
          }
        },
        {
          id: '4',
          type: 'booking_rescheduled',
          title: t('dashboard.activity.bookingRescheduled', 'Appointment Rescheduled'),
          description: t('dashboard.activity.bookingRescheduledDesc', 'Your appointment has been moved to next week'),
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          icon: Calendar,
          actionUrl: '/user/bookings',
          actionText: t('dashboard.activity.viewDetails', 'View Details'),
          severity: 'warning',
          metadata: {
            old_date: '2024-01-15',
            new_date: '2024-01-22'
          }
        },
        {
          id: '5',
          type: 'package_session_used',
          title: t('dashboard.activity.sessionUsed', 'Package Session Used'),
          description: t('dashboard.activity.sessionUsedDesc', 'One session from your fitness package has been used'),
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          icon: TrendingUp,
          actionUrl: '/user/packages',
          severity: 'info',
          metadata: {
            package_name: 'Fitness Starter',
            sessions_remaining: 7
          }
        },
        {
          id: '6',
          type: 'favorited',
          title: t('dashboard.activity.favorited', 'New Favorite'),
          description: t('dashboard.activity.favoritedDesc', 'You added Lash Lifting to your favorites'),
          timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          icon: Heart,
          actionUrl: '/user/favorites',
          severity: 'info',
          metadata: {
            service_name: 'Lash Lifting'
          }
        },
        {
          id: '7',
          type: 'payment_processed',
          title: t('dashboard.activity.paymentProcessed', 'Payment Processed'),
          description: t('dashboard.activity.paymentProcessedDesc', 'Your payment of {{amount}} has been processed', { amount: formatPrice(400) }),
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          icon: CreditCard,
          severity: 'success',
          metadata: {
            amount: 400,
            method: 'card'
          }
        }
      ];
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getActivityIcon = (activity: ActivityItem) => {
    const Icon = activity.icon;
    return (
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        getSeverityColor(activity.severity)
      )}>
        <Icon className="w-5 h-5" />
      </div>
    );
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const distanceInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (distanceInDays === 0) {
      return t('dashboard.activity.today', 'Today');
    } else if (distanceInDays === 1) {
      return t('dashboard.activity.yesterday', 'Yesterday');
    } else if (distanceInDays < 7) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return date.toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const getActivityDescription = (activity: ActivityItem) => {
    if (activity.metadata) {
      // Replace placeholders in description with actual values
      let desc = activity.description;
      Object.entries(activity.metadata).forEach(([key, value]) => {
        desc = desc.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      return desc;
    }
    return activity.description;
  };

  const handleMarkAsRead = async (activityId: string) => {
    // This would call an API to mark activity as read
    try {
      // await activityService.markAsRead(activityId);
      toast({
        title: t('dashboard.activity.markedAsRead', 'Marked as read'),
        description: t('dashboard.activity.markedAsReadDesc', 'Activity has been marked as read'),
      });
    } catch (error) {
      toast({
        title: t('dashboard.activity.error', 'Error'),
        description: t('dashboard.activity.errorDesc', 'Failed to update activity'),
        variant: 'destructive',
      });
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'bookings') return activity.type.startsWith('booking');
    if (filter === 'packages') return activity.type.startsWith('package');
    if (filter === 'reviews') return activity.type === 'review_submitted';
    return true;
  });

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('dashboard.activity.title', 'Recent Activity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-start space-x-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('dashboard.activity.title', 'Recent Activity')}
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border rounded-md px-3 py-1"
          >
            <option value="all">{t('dashboard.activity.all', 'All')}</option>
            <option value="bookings">{t('dashboard.activity.bookings', 'Bookings')}</option>
            <option value="packages">{t('dashboard.activity.packages', 'Packages')}</option>
            <option value="reviews">{t('dashboard.activity.reviews', 'Reviews')}</option>
          </select>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('dashboard.activity.noActivity', 'No Recent Activity')}
            </h3>
            <p className="text-muted-foreground">
              {t('dashboard.activity.noActivityDesc', 'Your recent activities will appear here')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start space-x-4 p-4 rounded-lg border transition-colors hover:bg-secondary/50",
                  index === 0 && "border-primary/20 bg-primary/5"
                )}
              >
                {/* Activity Icon */}
                {getActivityIcon(activity)}

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-tight">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {activity.actionUrl && (
                          <DropdownMenuItem asChild>
                            <Link to={activity.actionUrl} className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              {t('dashboard.activity.viewDetails', 'View Details')}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleMarkAsRead(activity.id)}>
                          <Check className="w-4 h-4 mr-2" />
                          {t('dashboard.activity.markAsRead', 'Mark as Read')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Activity Description */}
                  <p className="text-sm text-foreground leading-relaxed">
                    {getActivityDescription(activity)}
                  </p>

                  {/* Action Button */}
                  {activity.actionUrl && (
                    <div className="mt-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={activity.actionUrl}>
                          {activity.actionText || t('dashboard.activity.viewDetails', 'View Details')}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Link */}
        {activities.length > maxItems && (
          <div className="text-center mt-6 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link to="/user/activity">
                {t('dashboard.activity.viewAll', 'View All Activity')}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;