import React, { useState } from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCurrentBooking, useBookingReschedule } from '@/stores/bookingStore';

interface QuickRescheduleButtonProps {
  bookingId?: string;
  onRescheduled?: (success: boolean) => void;
}

export function QuickRescheduleButton({ bookingId, onRescheduled }: QuickRescheduleButtonProps) {
  const currentBooking = useCurrentBooking();
  const { rescheduleCount } = useBookingReschedule();
  const [confirmDialog, setConfirmDialog] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Use provided bookingId or current booking id
  const activeBookingId = bookingId || currentBooking?.id;

  const handleQuickReschedule = async (action: string) => {
    if (!activeBookingId) return;

    setIsRescheduling(true);
    setConfirmDialog(null);

    try {
      const { quickReschedule } = await import('@/stores/bookingStore');
      const success = await quickReschedule(
        action as 'next_week' | 'next_day' | 'same_time_next_week'
      );

      onRescheduled?.(success);
    } catch (error) {
      console.error('Quick reschedule failed:', error);
    } finally {
      setIsRescheduling(false);
    }
  };

  const getRescheduleDescription = (action: string) => {
    if (!currentBooking) return '';

    const currentDateTime = new Date(`${currentBooking.booking_date}T${currentBooking.booking_time}`);

    switch (action) {
      case 'next_week':
        const nextWeek = new Date(currentDateTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        return format(nextWeek, 'EEEE, MMMM d') + ' at ' + currentBooking.booking_time;
      case 'next_day':
        const nextDay = new Date(currentDateTime.getTime() + 24 * 60 * 60 * 1000);
        return format(nextDay, 'EEEE, MMMM d') + ' at ' + currentBooking.booking_time;
      case 'same_time_next_week':
        const sameTimeNextWeek = new Date(currentDateTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        return format(sameTimeNextWeek, 'EEEE, MMMM d') + ' at ' + currentBooking.booking_time;
      default:
        return '';
    }
  };

  const hasReachedRescheduleLimit = rescheduleCount && rescheduleCount >= 3;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isRescheduling || hasReachedRescheduleLimit}
          >
            <Clock className="h-4 w-4 mr-2" />
            Quick Reschedule
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem
            onClick={() => setConfirmDialog('next_day')}
            disabled={isRescheduling}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Same Time Tomorrow</span>
                <span className="text-xs text-muted-foreground">
                  {getRescheduleDescription('next_day')}
                </span>
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setConfirmDialog('same_time_next_week')}
            disabled={isRescheduling}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Same Time Next Week</span>
                <span className="text-xs text-muted-foreground">
                  {getRescheduleDescription('same_time_next_week')}
                </span>
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setConfirmDialog('next_week')}
            disabled={isRescheduling}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Next Available Slot</span>
                <span className="text-xs text-muted-foreground">
                  {getRescheduleDescription('next_week')}
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reschedule Limit Warning */}
      {hasReachedRescheduleLimit && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs text-amber-800">
            You've reached the maximum reschedule limit (3). Please contact support for additional changes.
          </p>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <Dialog
        open={!!confirmDialog}
        onOpenChange={() => setConfirmDialog(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Quick Reschedule</DialogTitle>
            <DialogDescription>
              {confirmDialog && (
                <>
                  <p className="mb-2">
                    Do you want to reschedule your booking to:
                  </p>
                  <div className="p-3 bg-muted rounded-lg font-medium">
                    {getRescheduleDescription(confirmDialog)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This will use one of your available reschedule attempts
                    ({rescheduleCount || 0}/3).
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(null)}
              disabled={isRescheduling}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => confirmDialog && handleQuickReschedule(confirmDialog)}
              disabled={isRescheduling}
              className="flex-1"
            >
              {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}