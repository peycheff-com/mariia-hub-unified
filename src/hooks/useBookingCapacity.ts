import { useState, useEffect } from 'react';
import { format } from 'date-fns';

import { bookingCapacityService, TimeSlotWithCapacity } from '@/services/bookingCapacity.service';

interface UseBookingCapacityProps {
  serviceId: string;
  date: Date;
  durationMinutes?: number;
}

export const useBookingCapacity = ({
  serviceId,
  date,
  durationMinutes = 60,
}: UseBookingCapacityProps) => {
  const [slots, setSlots] = useState<TimeSlotWithCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        setError(null);

        const dateStr = format(date, 'yyyy-MM-dd');
        const { data, error } = await bookingCapacityService.getAvailableSlotsWithCapacity(
          serviceId,
          dateStr,
          durationMinutes
        );

        if (error) {
          setError(error.message || 'Failed to load availability');
          setSlots([]);
        } else {
          // Convert to display format
          const displaySlots = data.map(slot => ({
            ...slot,
            id: slot.id,
            time: format(new Date(slot.start_time), 'HH:mm'),
            available: slot.available_spots > 0,
          }));
          setSlots(displaySlots);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    if (serviceId && date) {
      fetchSlots();
    }
  }, [serviceId, date, durationMinutes]);

  return {
    slots,
    loading,
    error,
    hasCapacity: slots.some(s => s.available_spots > 0),
  };
};