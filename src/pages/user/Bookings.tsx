import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Filter,
  Search,
  ChevronDown,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  MessageSquare,
  Download,
  RefreshCw,
  Eye,
  ArrowRight,
  CreditCard,
  Camera
} from 'lucide-react';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { BookingCard, BookingHistoryFilter, CalendarEvent } from '@/types/user';
import { bookingService } from '@/services/booking.service';
import { BookingStatus } from '@/types/booking';

const UserBookings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null);
  const [reschedulingBooking, setReschedulingBooking] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingCard | null>(null);

  // Fetch bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['user-bookings', { status: selectedStatus, date: selectedDate }],
    queryFn: () => bookingService.getUserBookings({
      status: selectedStatus === 'all' ? undefined : [selectedStatus],
      date: selectedDate,
      search: searchQuery,
    }),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch calendar events
  const { data: calendarEvents } = useQuery({
    queryKey: ['user-calendar-events'],
    queryFn: () => bookingService.getUserCalendarEvents(),
    staleTime: 5 * 60 * 1000,
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: string) => bookingService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      toast aria-live="polite" aria-atomic="true".success(t('user.bookings.cancelSuccess'));
      setCancellingBooking(null);
    },
    onError: () => {
      toast aria-live="polite" aria-atomic="true".error(t('user.bookings.cancelError'));
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: ({ bookingId, rating, comment }: { bookingId: string; rating: number; comment: string }) =>
      bookingService.submitReview(bookingId, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      toast aria-live="polite" aria-atomic="true".success(t('user.bookings.reviewSuccess'));
      setReviewDialogOpen(false);
      setSelectedBooking(null);
    },
    onError: () => {
      toast aria-live="polite" aria-atomic="true".error(t('user.bookings.reviewError'));
    },
  });

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
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'no_show':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleCancel = (bookingId: string) => {
    if (window.confirm(t('user.bookings.cancelConfirm'))) {
      setCancellingBooking(bookingId);
      cancelBookingMutation.mutate(bookingId);
    }
  };

  const handleReschedule = (bookingId: string) => {
    setReschedulingBooking(bookingId);
    // Navigate to reschedule flow or open modal
    window.location.href = `/booking/reschedule/${bookingId}`;
  };

  const handleReview = (booking: BookingCard) => {
    setSelectedBooking(booking);
    setReviewDialogOpen(true);
  };

  const filteredBookings = bookings?.filter((booking: BookingCard) => {
    const matchesSearch = searchQuery === '' ||
      booking.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.provider_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
    const matchesDate = !selectedDate ||
      new Date(booking.date).toDateString() === selectedDate.toDateString();
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (isLoading) {
    return <BookingsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('user.bookings.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('user.bookings.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('user.bookings.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={(value: BookingStatus | 'all') => setSelectedStatus(value)}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('user.bookings.filters.allStatuses')}</SelectItem>
                  <SelectItem value="confirmed">{t('booking.status.confirmed')}</SelectItem>
                  <SelectItem value="pending">{t('booking.status.pending')}</SelectItem>
                  <SelectItem value="completed">{t('booking.status.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('booking.status.cancelled')}</SelectItem>
                  <SelectItem value="no_show">{t('booking.status.no_show')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <div className="w-full lg:w-48">
                <Input
                  type="date"
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>

              {/* More Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full lg:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                {t('user.bookings.moreFilters')}
                <ChevronDown className={cn('h-4 w-4 ml-2 transition-transform', showFilters && 'rotate-180')} />
              </Button>
            </div>

            {/* Active Filters Display */}
            <div className="flex flex-wrap gap-2 mt-4">
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t('user.bookings.filters.search')}: {searchQuery}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
              {selectedStatus !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t('booking.status.' + selectedStatus)}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedStatus('all')} />
                </Badge>
              )}
              {selectedDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {formatDate(selectedDate.toISOString())}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDate(undefined)} />
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('user.bookings.tabs.listView')}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('user.bookings.tabs.calendarView')}
            </TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list">
            {filteredBookings && filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {filteredBookings.map((booking: BookingCard) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-start space-x-4">
                          {booking.image_url && (
                            <img
                              src={booking.image_url}
                              alt={booking.service_name}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {booking.service_name}
                              </h3>
                              <Badge className={getStatusColor(booking.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(booking.status)}
                                  {t(`booking.status.${booking.status}`)}
                                </div>
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{booking.provider_name}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(booking.date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(booking.time)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {booking.location}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(booking.price)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.duration} {t('common.minutes')}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {booking.status === 'confirmed' && (
                              <>
                                {booking.can_reschedule && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReschedule(booking.id)}
                                    disabled={reschedulingBooking === booking.id}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    {t('user.bookings.reschedule')}
                                  </Button>
                                )}
                                {booking.can_cancel && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancel(booking.id)}
                                    disabled={cancellingBooking === booking.id}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    {t('user.bookings.cancel')}
                                  </Button>
                                )}
                              </>
                            )}
                            {booking.status === 'completed' && !booking.review_submitted && (
                              <Button
                                size="sm"
                                onClick={() => handleReview(booking)}
                              >
                                <Star className="h-4 w-4 mr-1" />
                                {t('user.bookings.leaveReview')}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4 mr-1" />
                              {t('common.view')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('user.bookings.noBookings')}
                  </h3>
                  <p className="text-gray-600 text-center mb-4">
                    {t('user.bookings.noBookingsDesc')}
                  </p>
                  <Button asChild>
                    <a href="/booking">
                      {t('user.bookings.bookNow')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                      modifiers={{
                        hasEvent: (date) => {
                          return calendarEvents?.some((event: CalendarEvent) =>
                            new Date(event.date).toDateString() === date.toDateString()
                          );
                        },
                      }}
                      modifiersStyles={{
                        hasEvent: {
                          backgroundColor: '#fef3c7',
                          border: '2px solid #f59e0b',
                        },
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {t('user.bookings.calendar.events')}
                    </h3>
                    <div className="space-y-3">
                      {selectedDate && calendarEvents
                        ?.filter((event: CalendarEvent) =>
                          new Date(event.date).toDateString() === selectedDate.toDateString()
                        )
                        .map((event: CalendarEvent) => (
                          <div
                            key={event.id}
                            className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-900">{event.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {event.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {event.time} - {event.duration} {t('common.minutes')}
                            </p>
                            {event.location && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </p>
                            )}
                          </div>
                        ))}
                      {!selectedDate && (
                        <p className="text-gray-500 text-sm">
                          {t('user.bookings.calendar.selectDate')}
                        </p>
                      )}
                      {selectedDate && calendarEvents?.filter((event: CalendarEvent) =>
                        new Date(event.date).toDateString() === selectedDate.toDateString()
                      ).length === 0 && (
                        <p className="text-gray-500 text-sm">
                          {t('user.bookings.calendar.noEvents')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('user.bookings.review.title')}</DialogTitle>
              <DialogDescription>
                {t('user.bookings.review.description')}
              </DialogDescription>
            </DialogHeader>
            <ReviewForm
              booking={selectedBooking}
              onSubmit={(rating, comment) => {
                if (selectedBooking) {
                  submitReviewMutation.mutate({
                    bookingId: selectedBooking.id,
                    rating,
                    comment,
                  });
                }
              }}
              isSubmitting={submitReviewMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Review Form Component
const ReviewForm: React.FC<{
  booking: BookingCard | null;
  onSubmit: (rating: number, comment: string) => void;
  isSubmitting: boolean;
}> = ({ booking, onSubmit, isSubmitting }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast aria-live="polite" aria-atomic="true".error(t('user.bookings.review.ratingRequired'));
      return;
    }
    onSubmit(rating, comment);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{t('user.bookings.review.service')}</Label>
        <p className="font-medium">{booking?.service_name}</p>
      </div>

      <div>
        <Label>{t('user.bookings.review.rating')}</Label>
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={cn(
                  'h-8 w-8',
                  star <= rating ? 'text-amber-400 fill-current' : 'text-gray-300'
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="comment">{t('user.bookings.review.comment')}</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('user.bookings.review.commentPlaceholder')}
          rows={4}
          className="mt-2"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setRating(0) || setComment('')}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting || rating === 0}>
          {isSubmitting ? t('common.submitting') : t('common.submit')}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Skeleton loader
const BookingsSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Skeleton className="h-20 w-20 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64 mb-3" />
                    <div className="grid grid-cols-3 gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-4 w-16 mb-3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserBookings;