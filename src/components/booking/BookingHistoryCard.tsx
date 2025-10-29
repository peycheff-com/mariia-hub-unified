import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Clock,
  DollarSign,
  MoreHorizontal,
  Repeat,
  Download,
  FileText,
  Users,
  MapPin
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookingHistoryItem } from '@/services/bookingHistory.service';
import { cn } from '@/lib/utils';

interface BookingHistoryCardProps {
  booking: BookingHistoryItem;
  onReschedule?: (bookingId: string) => void;
  onRebook?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
  onViewDetails?: (bookingId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const BookingHistoryCard: React.FC<BookingHistoryCardProps> = ({
  booking,
  onReschedule,
  onRebook,
  onCancel,
  onViewDetails,
  showActions = true,
  compact = false
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'no_show':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Clock className="h-3 w-3" />;
      case 'completed':
        return <DollarSign className="h-3 w-3" />;
      case 'cancelled':
        return <FileText className="h-3 w-3" />;
      case 'no_show':
        return <Users className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const canReschedule = booking.status === 'confirmed' && booking.bookingDate > new Date();
  const canCancel = booking.status === 'confirmed' && booking.bookingDate > new Date();
  const canRebook = ['completed', 'cancelled'].includes(booking.status);

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-medium">{booking.serviceTitle}</span>
            <span className="text-sm text-gray-600">
              {format(booking.bookingDate, 'MMM d')} • {booking.bookingTime}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(booking.status)} className="flex items-center gap-1">
            {getStatusIcon(booking.status)}
            {booking.status}
          </Badge>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {canReschedule && onReschedule && (
                  <DropdownMenuItem onClick={() => onReschedule(booking.bookingId)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Reschedule
                  </DropdownMenuItem>
                )}
                {canRebook && onRebook && (
                  <DropdownMenuItem onClick={() => onRebook(booking.bookingId)}>
                    <Repeat className="h-4 w-4 mr-2" />
                    Book Again
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Complete information about your appointment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {renderBookingDetails()}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const renderBookingDetails = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Date</span>
          </div>
          <p className="font-medium">{format(booking.bookingDate, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Time</span>
          </div>
          <p className="font-medium">{booking.bookingTime} ({booking.duration} min)</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm">Location</span>
        </div>
        <p className="font-medium">{booking.location}</p>
      </div>

      {booking.specialistName && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Specialist</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback>
                {booking.specialistName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{booking.specialistName}</span>
          </div>
        </div>
      )}

      {booking.notes && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Notes</span>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{booking.notes}</p>
        </div>
      )}

      {booking.cancelledAt && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">
            Cancelled on {format(booking.cancelledAt, 'MMMM d, yyyy')}
          </p>
          {booking.cancellationReason && (
            <p className="text-sm text-red-600 mt-1">
              Reason: {booking.cancellationReason}
            </p>
          )}
        </div>
      )}

      {booking.refundAmount && booking.refundAmount > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800">
            Refund processed: ${booking.refundAmount.toFixed(2)}
          </p>
        </div>
      )}
    </>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{booking.serviceTitle}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(booking.bookingDate, 'EEEE, MMMM d, yyyy')}
              <Clock className="h-4 w-4" />
              {booking.bookingTime}
              <span>•</span>
              <span>{booking.duration} minutes</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(booking.status)} className="flex items-center gap-1">
              {getStatusIcon(booking.status)}
              {booking.status}
            </Badge>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowDetails(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    {t('booking.history.viewDetails', 'View Details')}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {canReschedule && onReschedule && (
                    <DropdownMenuItem onClick={() => onReschedule(booking.bookingId)}>
                      <Clock className="h-4 w-4 mr-2" />
                      {t('booking.history.reschedule', 'Reschedule')}
                    </DropdownMenuItem>
                  )}

                  {canCancel && onCancel && (
                    <DropdownMenuItem onClick={() => onCancel(booking.bookingId)}>
                      <FileText className="h-4 w-4 mr-2" />
                      {t('booking.history.cancel', 'Cancel')}
                    </DropdownMenuItem>
                  )}

                  {canRebook && onRebook && (
                    <DropdownMenuItem onClick={() => onRebook(booking.bookingId)}>
                      <Repeat className="h-4 w-4 mr-2" />
                      {t('booking.history.bookAgain', 'Book Again')}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    {t('booking.history.downloadInvoice', 'Download Invoice')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Location</span>
              </div>
              <p className="text-sm">{booking.location}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Price</span>
              </div>
              <p className="text-sm font-medium">
                ${booking.price.toFixed(2)} {booking.currency}
              </p>
            </div>
          </div>

          {booking.isGroupBooking && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Group booking for {booking.groupSize} people
              </span>
            </div>
          )}

          {booking.specialistName && (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback>
                  {booking.specialistName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{booking.specialistName}</p>
                <p className="text-xs text-gray-600">Specialist</p>
              </div>
            </div>
          )}

          {booking.notes && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{booking.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>
              Booked {formatDistanceToNow(booking.createdAt, { addSuffix: true })}
            </span>
            {booking.rescheduleCount && booking.rescheduleCount > 0 && (
              <span>• Rescheduled {booking.rescheduleCount} time{booking.rescheduleCount > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information about your appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {renderBookingDetails()}

            {/* Action buttons in dialog */}
            <div className="flex gap-3 pt-4 border-t">
              {canReschedule && onReschedule && (
                <Button onClick={() => onReschedule(booking.bookingId)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
              )}
              {canCancel && onCancel && (
                <Button variant="outline" onClick={() => onCancel(booking.bookingId)}>
                  Cancel Booking
                </Button>
              )}
              {canRebook && onRebook && (
                <Button variant="outline" onClick={() => onRebook(booking.bookingId)}>
                  <Repeat className="h-4 w-4 mr-2" />
                  Book Again
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};