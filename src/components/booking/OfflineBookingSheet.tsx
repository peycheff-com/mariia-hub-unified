import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { Booking } from '@/types';

interface OfflineBookingSheetProps {
  bookings: Booking[];
  userId?: string;
}

export const OfflineBookingSheet: React.FC<OfflineBookingSheetProps> = ({
  bookings,
  userId,
}) => {
  const { isOnline, getCachedBookings } = useOfflineSync({ showToast: true });
  const [cachedBookings, setCachedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCachedBookings = async () => {
      setLoading(true);
      try {
        const cached = await getCachedBookings(userId);
        setCachedBookings(cached);
      } catch (error) {
        console.error('Failed to load cached bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!isOnline) {
      loadCachedBookings();
    }
  }, [isOnline, userId, getCachedBookings]);

  const displayBookings = isOnline ? bookings : cachedBookings;

  if (isOnline) {
    return null; // Show regular booking sheet when online
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Offline Mode - Bookings
        </CardTitle>
        <Badge variant="secondary" className="w-fit">
          Showing cached bookings
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Loading cached bookings...</p>
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No cached bookings available</p>
            <p className="text-sm text-gray-500 mt-1">
              Bookings will appear here when you're offline
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-sm">
                      {booking.date ? format(new Date(booking.date), 'MMM d, yyyy') : 'No date'}
                    </span>
                  </div>
                  <Badge
                    variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {booking.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>{booking.time || 'No time'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <User className="w-4 h-4" />
                  <span>{booking.service_name || 'Unknown service'}</span>
                </div>

                {booking.notes && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-sm text-gray-600 italic">
                      {booking.notes}
                    </p>
                  </>
                )}

                {booking.cached && (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">Cached for offline use</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            You're currently offline. Any changes will be synced when you reconnect.
          </p>
          <p className="text-xs text-gray-500">
            Last sync: {new Date().toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineBookingSheet;