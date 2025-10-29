import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { format, addDays, isToday, isTomorrow, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useBookingStore, useBookingService, useBookingTimeSlot, useBookingError, useBookingStep } from '@/stores/bookingStore';
import { apiGateway } from '@/services/apiGateway';
import { cqrsService, Commands } from '@/services/cqrsService';
import { useBookingRealTime } from '@/services/websocketService';
import { logger } from '@/lib/logger';

interface Step2TimeProps {
  onNext?: () => void;
  onBack?: () => void;
}

export const Step2TimeNew: React.FC<Step2TimeProps> = ({ onNext, onBack }) => {
  const { toast } = useToast();
  const selectedService = useBookingService();
  const selectedTimeSlot = useBookingTimeSlot();
  const error = useBookingError();
  const step = useBookingStep();

  const { selectTimeSlot, setError, nextStep, previousStep } = useBookingStore();

  // Real-time updates
  const { onSlotReserved, onSlotReleased } = useBookingRealTime();

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [reservedSlots, setReservedSlots] = useState<Set<string>>(new Set());

  // Generate date options (next 10 days)
  const dateOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 10; i++) {
      const date = addDays(new Date(), i);
      options.push(date);
    }
    return options;
  }, []);

  // Load available slots when date or service changes
  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedDate]);

  // Real-time slot updates
  useEffect(() => {
    const unsubscribeReserved = onSlotReserved((data) => {
      setReservedSlots(prev => new Set(prev).add(data.slotId));
      toast({
        title: "Slot temporarily reserved",
        description: "This slot is being held by another customer",
      });
    });

    const unsubscribeReleased = onSlotReleased((data) => {
      setReservedSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.slotId);
        return newSet;
      });
    });

    return () => {
      unsubscribeReserved();
      unsubscribeReleased();
    };
  }, [onSlotReserved, onSlotReleased, toast]);

  const loadAvailableSlots = async () => {
    if (!selectedService) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiGateway.availability.slots({
        serviceId: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        location: 'studio', // Could be dynamic based on service
      });

      if (response.success) {
        setAvailableSlots(response.data);
      } else {
        throw new Error(response.message || 'Failed to load availability');
      }
    } catch (err) {
      logger.error('Error loading slots:', err);
      setError(err instanceof Error ? err.message : 'Failed to load availability');
      toast({
        title: "Error",
        description: "Could not load available time slots",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Clear previously selected slot when date changes
    if (selectedTimeSlot && !isSameDay(date, new Date(selectedTimeSlot.date))) {
      selectTimeSlot(null);
    }
  };

  const handleSlotSelect = async (slot: any) => {
    if (!selectedService || isReserving) return;

    // Check if slot is already reserved
    if (reservedSlots.has(slot.id)) {
      toast({
        title: "Slot unavailable",
        description: "This slot is temporarily reserved by another customer",
        variant: "destructive",
      });
      return;
    }

    setIsReserving(true);

    try {
      // Reserve the slot first (creates a hold)
      const reserveResponse = await apiGateway.availability.reserve({
        serviceId: selectedService.id,
        slotId: slot.id,
        userId: 'current-user', // Would get from auth context
        sessionId: 'session-id', // Would get from session management
      });

      if (reserveResponse.success) {
        // Create time slot object for store
        const timeSlot = {
          id: slot.id,
          date: selectedDate,
          time: slot.time,
          available: slot.available,
          location: slot.location || 'studio',
          price: slot.price,
        };

        selectTimeSlot(timeSlot);

        // Auto-advance to next step
        setTimeout(() => {
          if (onNext) onNext();
          else nextStep();
        }, 500);

        toast({
          title: "Time slot selected",
          description: `Slot reserved for 10 minutes`,
        });
      } else {
        throw new Error(reserveResponse.message || 'Failed to reserve slot');
      }
    } catch (err) {
      logger.error('Error reserving slot:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reserve time slot",
        variant: "destructive",
      });
    } finally {
      setIsReserving(false);
    }
  };

  const handleQuickSelect = async (type: 'first' | 'morning' | 'afternoon' | 'evening') => {
    if (!selectedService || availableSlots.length === 0) return;

    let targetSlot: any;

    switch (type) {
      case 'first':
        targetSlot = availableSlots.find(s => s.available && !reservedSlots.has(s.id));
        break;
      case 'morning':
        targetSlot = availableSlots.find(s =>
          s.available &&
          !reservedSlots.has(s.id) &&
          parseInt(s.time.split(':')[0]) < 12
        );
        break;
      case 'afternoon':
        targetSlot = availableSlots.find(s =>
          s.available &&
          !reservedSlots.has(s.id) &&
          parseInt(s.time.split(':')[0]) >= 12 &&
          parseInt(s.time.split(':')[0]) < 18
        );
        break;
      case 'evening':
        targetSlot = availableSlots.find(s =>
          s.available &&
          !reservedSlots.has(s.id) &&
          parseInt(s.time.split(':')[0]) >= 18
        );
        break;
    }

    if (targetSlot) {
      await handleSlotSelect(targetSlot);
    } else {
      toast({
        title: "No available slots",
        description: `No ${type} slots available for this date`,
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM d', { locale: pl });
  };

  const groupSlotsByTimeOfDay = (slots: any[]) => {
    const groups = {
      morning: [] as any[],
      afternoon: [] as any[],
      evening: [] as any[],
    };

    slots.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (hour < 12) groups.morning.push(slot);
      else if (hour < 18) groups.afternoon.push(slot);
      else groups.evening.push(slot);
    });

    return groups;
  };

  const timeGroups = groupSlotsByTimeOfDay(availableSlots);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Select a Time</h2>
        <p className="text-muted-foreground">
          Choose your preferred time slot for {selectedService?.title}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Date Selection */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Select Date
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {dateOptions.map((date) => (
            <Button
              key={date.toISOString()}
              variant={isSameDay(date, selectedDate) ? 'default' : 'outline'}
              className="flex flex-col h-auto py-3"
              onClick={() => handleDateSelect(date)}
            >
              <span className="text-xs font-medium">
                {format(date, 'EEE', { locale: pl })}
              </span>
              <span className="text-lg font-bold">
                {format(date, 'd')}
              </span>
              <span className="text-xs">
                {format(date, 'MMM', { locale: pl })}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Select Options */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect('first')}
          disabled={isLoading || isReserving}
        >
          First Available
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect('morning')}
          disabled={isLoading || isReserving}
        >
          Morning
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect('afternoon')}
          disabled={isLoading || isReserving}
        >
          Afternoon
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect('evening')}
          disabled={isLoading || isReserving}
        >
          Evening
        </Button>
      </div>

      {/* Time Slots */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading available slots...</span>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No available slots for this date</p>
            <p className="text-sm">Please try another date</p>
          </div>
        ) : (
          <>
            {/* Morning Slots */}
            {timeGroups.morning.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Morning</h4>
                <div className="grid grid-cols-3 gap-2">
                  {timeGroups.morning.map((slot) => (
                    <Card
                      key={slot.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTimeSlot?.id === slot.id
                          ? 'ring-2 ring-primary'
                          : ''
                      } ${
                        !slot.available || reservedSlots.has(slot.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      onClick={() => slot.available && !reservedSlots.has(slot.id) && handleSlotSelect(slot)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="font-medium">{slot.time}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs capitalize">{slot.location}</span>
                        </div>
                        {slot.price && (
                          <div className="text-sm font-semibold mt-1">
                            {slot.price} PLN
                          </div>
                        )}
                        {reservedSlots.has(slot.id) && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Reserved
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Afternoon Slots */}
            {timeGroups.afternoon.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Afternoon</h4>
                <div className="grid grid-cols-3 gap-2">
                  {timeGroups.afternoon.map((slot) => (
                    <Card
                      key={slot.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTimeSlot?.id === slot.id
                          ? 'ring-2 ring-primary'
                          : ''
                      } ${
                        !slot.available || reservedSlots.has(slot.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      onClick={() => slot.available && !reservedSlots.has(slot.id) && handleSlotSelect(slot)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="font-medium">{slot.time}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs capitalize">{slot.location}</span>
                        </div>
                        {slot.price && (
                          <div className="text-sm font-semibold mt-1">
                            {slot.price} PLN
                          </div>
                        )}
                        {reservedSlots.has(slot.id) && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Reserved
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Evening Slots */}
            {timeGroups.evening.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Evening</h4>
                <div className="grid grid-cols-3 gap-2">
                  {timeGroups.evening.map((slot) => (
                    <Card
                      key={slot.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTimeSlot?.id === slot.id
                          ? 'ring-2 ring-primary'
                          : ''
                      } ${
                        !slot.available || reservedSlots.has(slot.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      onClick={() => slot.available && !reservedSlots.has(slot.id) && handleSlotSelect(slot)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="font-medium">{slot.time}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs capitalize">{slot.location}</span>
                        </div>
                        {slot.price && (
                          <div className="text-sm font-semibold mt-1">
                            {slot.price} PLN
                          </div>
                        )}
                        {reservedSlots.has(slot.id) && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Reserved
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => onBack ? onBack() : previousStep()}
          disabled={isReserving}
        >
          Back
        </Button>
        <Button
          disabled={!selectedTimeSlot || isReserving}
          onClick={() => onNext ? onNext() : nextStep()}
        >
          {isReserving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Reserving...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
};

// Export for use in booking flow
export default Step2TimeNew;