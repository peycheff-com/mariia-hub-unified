import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Video,
  AlertTriangle,
  ArrowRight,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { bookingService, Booking } from '@/services/booking.service';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UpcomingAppointmentsProps {
  maxItems?: number;
  className?: string;
  showViewAll?: boolean;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  maxItems = 3,
  className,
  showViewAll = true
}) => {
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Fetch upcoming bookings
  const {
    data: bookings = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['upcoming-bookings', { limit: maxItems, status: ['confirmed', 'pending'] }],
    queryFn: () => bookingService.getUserBookings({
      status: ['confirmed', 'pending'],
      limit: maxItems,
      sort_by: 'start_time',
      sort_order: 'asc'
    }),
    staleTime: 60 * 1000, // 1 minute for real-time updates
  });

  const handleReschedule = async (bookingId: string) => {
    setLoadingAction(bookingId);
    try {
      // Get reschedule token
      const token = await bookingService.getRescheduleToken(bookingId);

      // Navigate to reschedule page
      window.location.href = `/reschedule?token=${token}`;
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('dashboard.appointments.rescheduleError', 'Reschedule Error'),
        description: error.message || t('dashboard.appointments.rescheduleErrorDesc', 'Failed to generate reschedule link'),
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm(t('dashboard.appointments.cancelConfirm', 'Are you sure you want to cancel this appointment?'))) {
      return;
    }

    setLoadingAction(bookingId);
    try {
      await bookingService.cancelBooking(bookingId, 'Client cancellation');

      toast aria-live="polite" aria-atomic="true"({
        title: t('dashboard.appointments.cancelled', 'Appointment Cancelled'),
        description: t('dashboard.appointments.cancelledDesc', 'Your appointment has been cancelled'),
      });

      // Refetch bookings
      refetch();
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('dashboard.appointments.cancelError', 'Cancellation Error'),
        description: error.message || t('dashboard.appointments.cancelErrorDesc', 'Failed to cancel appointment'),
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddToCalendar = (booking: Booking) => {
    try {
      // Create Google Calendar link
      const startTime = new Date(`${booking.date}T${booking.time}`);
      const endTime = new Date(startTime.getTime() + booking.duration_minutes * 60 * 1000);

      const formatDate = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, (s) => s === '-' ? '' : s === ':' ? '' : s);
      };

      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.service_name)}&dates=${formatDate(startTime)}/${formatDate(endTime)}&details=${encodeURIComponent(t('dashboard.appointments.calendarDetails', 'Service: {{service}}\nProvider: {{provider}}\nLocation: {{location}}', { service: booking.service_name, provider: booking.provider_name, location: booking.location }))}&location=${encodeURIComponent(booking.location)}`;

      window.open(calendarUrl, '_blank');
    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: t('dashboard.appointments.calendarError', 'Calendar Error'),
        description: t('dashboard.appointments.calendarErrorDesc', 'Failed to add to calendar'),
        variant: 'destructive',
      });
    }
  };

  const handleJoinOnline = (meetingUrl: string) => {
    window.open(meetingUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return Calendar;
      case 'pending':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`);
    const dateStr = dateTime.toLocaleDateString(i18n.language, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = dateTime.toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit'
    });
    return { date: dateStr, time: timeStr };
  };

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('dashboard.appointments.title', 'Upcoming Appointments')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(maxItems)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || bookings.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('dashboard.appointments.title', 'Upcoming Appointments')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('dashboard.appointments.noUpcoming', 'No Upcoming Appointments')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('dashboard.appointments.noUpcomingDesc', 'You don\'t have any appointments scheduled')}
            </p>
            <Button asChild className="w-full">
              <Link to="/book">
                {t('dashboard.appointments.bookNow', 'Book Now')}
              </Link>
            </Button>
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
            <Calendar className="w-5 h-5" />
            {t('dashboard.appointments.title', 'Upcoming Appointments')}
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => {
            const StatusIcon = getStatusIcon(booking.status);
            const { date, time } = formatDateTime(booking.date, booking.time);
            const isOnline = booking.location_type === 'online';
            const isToday = new Date(booking.date).toDateString() === new Date().toDateString();

            return (
              <div
                key={booking.id}
                className={cn(
                  "flex items-start space-x-4 p-4 rounded-lg border transition-all hover:shadow-md",
                  isToday && "border-primary/50 bg-primary/5"
                )}
              >
                {/* Date/Time Block */}
                <div className="flex flex-col items-center text-center p-3 bg-secondary rounded-lg min-w-[80px]">
                  <div className="text-xs font-medium text-muted-foreground">
                    {date.split(' ')[0]}
                  </div>
                  <div className="text-lg font-bold">
                    {date.split(' ')[1]}
                  </div>
                  <div className="text-sm">
                    {time}
                  </div>
                  {isToday && (
                    <Badge variant="default" className="text-xs mt-1">
                      {t('dashboard.appointments.today', 'Today')}
                    </Badge>
                  )}
                </div>

                {/* Appointment Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-lg leading-tight mb-1">
                        {booking.service_name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {booking.provider_name}
                        </span>
                        {!isOnline && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {booking.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", getStatusColor(booking.status))}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {t(`booking.status.${booking.status}`)}
                      </Badge>

                      {/* Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={loadingAction === booking.id}
                          >
                            {loadingAction === booking.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="w-4 h-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAddToCalendar(booking)}>
                            <Calendar className="w-4 h-4 mr-2" />
                            {t('dashboard.appointments.addToCalendar', 'Add to Calendar')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReschedule(booking.id)}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t('dashboard.appointments.reschedule', 'Reschedule')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCancel(booking.id)}
                            className="text-destructive"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {t('dashboard.appointments.cancel', 'Cancel')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {booking.duration_minutes} {t('dashboard.appointments.minutes', 'min')}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(booking.total_price)}
                    </span>
                  </div>

                  {/* Online Meeting Link */}
                  {booking.meeting_url && isOnline && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJoinOnline(booking.meeting_url)}
                        className="text-xs"
                      >
                        <Video className="w-3 h-3 mr-1" />
                        {t('dashboard.appointments.joinMeeting', 'Join Meeting')}
                      </Button>
                    </div>
                  )}

                  {/* Provider Info */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                    <Avatar className="h-10 w-10">
                      {booking.provider_avatar ? (
                        <AvatarImage src={booking.provider_avatar} alt={booking.provider_name} />
                      ) : (
                        <AvatarFallback>
                          {booking.provider_name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{booking.provider_name}</div>
                      {booking.provider_phone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {booking.provider_phone}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReschedule(booking.id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {t('dashboard.appointments.reschedule', 'Reschedule')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Link */}
        {showViewAll && bookings.length > 0 && (
          <div className="text-center mt-6 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link to="/user/bookings">
                {t('dashboard.appointments.viewAll', 'View All Appointments')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointments;