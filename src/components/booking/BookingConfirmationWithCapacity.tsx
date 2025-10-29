import { CheckCircle, Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BookingConfirmationWithCapacityProps {
  service: {
    title: string;
    duration_minutes: number;
    price_from?: number;
  };
  date: Date;
  time: string;
  capacity?: {
    total: number;
    booked: number;
    available: number;
  };
  groupSize?: number;
  location?: string;
  onCancel?: () => void;
  onReschedule?: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
}

export const BookingConfirmationWithCapacity = ({
  service,
  date,
  time,
  capacity,
  groupSize = 1,
  location = 'Warsaw Studio',
  onCancel,
  onReschedule,
  onConfirm,
  isLoading = false,
}: BookingConfirmationWithCapacityProps) => {
  const isGroupBooking = groupSize > 1;
  const utilizationRate = capacity
    ? Math.round(((capacity.total - capacity.available) / capacity.total) * 100)
    : 0;

  const getCapacityStatus = () => {
    if (!capacity) return { label: 'Private Session', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' };

    if (capacity.available === 0) {
      return { label: 'Fully Booked', color: 'bg-red-500/10 text-red-500 border-red-500/30' };
    } else if (utilizationRate >= 75) {
      return { label: 'Limited Spots', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' };
    } else if (utilizationRate >= 50) {
      return { label: 'Filling Up', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' };
    } else {
      return { label: 'Available', color: 'bg-green-500/10 text-green-500 border-green-500/30' };
    }
  };

  const capacityStatus = getCapacityStatus();

  return (
    <Card className="glass-card border-champagne/20 overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {/* Success header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-champagne/20">
            <CheckCircle className="w-8 h-8 text-champagne" />
          </div>
          <h3 className="text-xl font-semibold text-pearl">Booking Confirmed</h3>
          <p className="text-pearl/60 text-sm">
            Your appointment has been successfully scheduled
          </p>
        </div>

        {/* Booking details */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-champagne mt-0.5" />
              <div>
                <p className="font-medium text-pearl">{format(date, 'EEEE, MMMM d, yyyy')}</p>
                <p className="text-sm text-pearl/60">{location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-champagne mt-0.5" />
              <div>
                <p className="font-medium text-pearl">{time}</p>
                <p className="text-sm text-pearl/60">{service.duration_minutes} minutes</p>
              </div>
            </div>
            {isGroupBooking && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-champagne mt-0.5" />
                <div>
                  <p className="font-medium text-pearl">{groupSize} People</p>
                  <p className="text-sm text-pearl/60">Group booking</p>
                </div>
              </div>
            )}
          </div>

          {/* Capacity information */}
          {capacity && (
            <div className="border-t border-pearl/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-pearl">Session Capacity</h4>
                <Badge variant="outline" className={capacityStatus.color}>
                  {capacityStatus.label}
                </Badge>
              </div>

              <div className="space-y-2">
                {/* Visual capacity bar */}
                <div className="relative h-2 bg-pearl/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "absolute top-0 left-0 h-full transition-all duration-500",
                      utilizationRate >= 75
                        ? "bg-red-400"
                        : utilizationRate >= 50
                        ? "bg-orange-400"
                        : utilizationRate >= 25
                        ? "bg-yellow-400"
                        : "bg-green-400"
                    )}
                    style={{ width: `${utilizationRate}%` }}
                   />
                </div>

                <div className="flex justify-between text-xs text-pearl/60">
                  <span>Booked: {capacity.booked}</span>
                  <span>Available: {capacity.available}</span>
                  <span>Total: {capacity.total}</span>
                </div>
              </div>

              {capacity.available <= 2 && capacity.available > 0 && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-orange-400/10 border border-orange-400/30">
                  <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-orange-400">
                    Only {capacity.available} spot{capacity.available > 1 ? 's' : ''} left! This is a popular time slot.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Service details */}
          <div className="border-t border-pearl/10 pt-4">
            <h4 className="text-sm font-medium text-pearl mb-2">Service Details</h4>
            <div className="flex justify-between items-center">
              <p className="text-pearl/80">{service.title}</p>
              {service.price_from && (
                <p className="font-medium text-pearl">
                  {isGroupBooking
                    ? `${service.price_from * groupSize} PLN`
                    : `${service.price_from} PLN`
                  }
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Important information */}
        <div className="space-y-2 p-4 rounded-lg bg-champagne/10 border border-champagne/20">
          <h4 className="text-sm font-medium text-pearl">Important Information</h4>
          <ul className="text-xs text-pearl/60 space-y-1">
            <li>• Please arrive 10 minutes early for your appointment</li>
            <li>• Cancellation must be made at least 24 hours in advance</li>
            {isGroupBooking && <li>• All group members must arrive on time</li>}
            {capacity && capacity.total > 1 && (
              <li>• This is a shared session with other clients</li>
            )}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {onReschedule && (
            <Button
              variant="outline"
              onClick={onReschedule}
              disabled={isLoading}
              className="flex-1 border-champagne/20 text-pearl hover:bg-champagne/10"
            >
              Reschedule
            </Button>
          )}
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 border-champagne/20 text-pearl hover:bg-champagne/10"
            >
              Cancel Booking
            </Button>
          )}
          {onConfirm && (
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-champagne text-cocoa hover:bg-champagne/90"
            >
              {isLoading ? 'Processing...' : 'Confirm Booking'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};