import { useState, useEffect } from 'react';
import { addDays, startOfDay, setHours, setMinutes, addMinutes, format, isBefore, isAfter } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface TimeSlot {
  time: Date;
  available: boolean;
  isHold: boolean;
}

interface SlotGenerationParams {
  serviceId: string;
  locationId: string;
  selectedDate: Date;
  durationMinutes: number;
}

export const useSlotGeneration = ({ serviceId, locationId, selectedDate, durationMinutes }: SlotGenerationParams) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (serviceId && locationId && selectedDate && durationMinutes) {
      generateSlots();
    }
  }, [serviceId, locationId, selectedDate, durationMinutes]);

  const generateSlots = async () => {
    setLoading(true);
    
    try {
      // Get resource (Mariia)
      const { data: resources } = await supabase
        .from('resources')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!resources) throw new Error('No resource available');

      // Get the service to determine service_type
      const { data: service } = await supabase
        .from('services')
        .select('service_type')
        .eq('id', serviceId)
        .single();

      if (!service) {
        setSlots([]);
        return;
      }

      // Get the location to filter slots appropriately
      const { data: location } = await supabase
        .from('locations')
        .select('type')
        .eq('id', locationId)
        .single();

      // Filter service types by location
      // Studio = beauty only, gym = fitness only, onsite = both
      const isValidLocationForService = 
        !location || 
        location.type === 'onsite' || 
        (location.type === 'studio' && service.service_type === 'beauty') ||
        (location.type === 'gym' && service.service_type === 'fitness');

      if (!isValidLocationForService) {
        setSlots([]);
        return;
      }

      // Get availability windows for the day and service type
      const dayOfWeek = selectedDate.getDay();
      const { data: availabilityWindows } = await supabase
        .from('availability_slots')
        .select('start_time, end_time')
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)
        .eq('service_type', service.service_type);

      if (!availabilityWindows || availabilityWindows.length === 0) {
        setSlots([]);
        return;
      }

      // Get buffers for the service
      const { data: buffers } = await supabase
        .from('buffers')
        .select('pre_minutes, post_minutes, travel_minutes')
        .eq('service_id', serviceId)
        .single();

      const preBuffer = buffers?.pre_minutes || 0;
      const postBuffer = buffers?.post_minutes || 0;
      const totalDuration = durationMinutes + preBuffer + postBuffer;

      // Get existing bookings for the day
      const dayStart = startOfDay(selectedDate);
      const dayEnd = addDays(dayStart, 1);
      
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('booking_date, duration_minutes')
        .eq('resource_id', resources.id)
        .in('status', ['confirmed', 'pending'])
        .gte('booking_date', dayStart.toISOString())
        .lt('booking_date', dayEnd.toISOString());

      // Get active holds
      const { data: activeHolds } = await supabase
        .from('holds')
        .select('start_time, end_time')
        .eq('resource_id', resources.id)
        .gt('expires_at', new Date().toISOString())
        .gte('start_time', dayStart.toISOString())
        .lt('start_time', dayEnd.toISOString());

      // Get calendar blocks
      const { data: calendarBlocks } = await supabase
        .from('calendar_blocks')
        .select('start_time, end_time')
        .eq('resource_id', resources.id)
        .gte('start_time', dayStart.toISOString())
        .lt('start_time', dayEnd.toISOString());

      // Generate candidate slots
      const candidateSlots: TimeSlot[] = [];
      
      for (const window of availabilityWindows) {
        const [startHour, startMinute] = window.start_time.split(':').map(Number);
        const [endHour, endMinute] = window.end_time.split(':').map(Number);
        
        let currentTime = setMinutes(setHours(selectedDate, startHour), startMinute);
        const windowEnd = setMinutes(setHours(selectedDate, endHour), endMinute);

        while (isBefore(addMinutes(currentTime, totalDuration), windowEnd) || 
               currentTime.getTime() === windowEnd.getTime()) {
          // Check if slot conflicts with bookings
          const slotEnd = addMinutes(currentTime, totalDuration);
          let isAvailable = true;

          // Check bookings
          if (existingBookings) {
            for (const booking of existingBookings) {
              const bookingStart = new Date(booking.booking_date);
              const bookingEnd = addMinutes(bookingStart, booking.duration_minutes || durationMinutes);
              
              if (
                (currentTime >= bookingStart && currentTime < bookingEnd) ||
                (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
                (currentTime <= bookingStart && slotEnd >= bookingEnd)
              ) {
                isAvailable = false;
                break;
              }
            }
          }

          // Check holds
          if (isAvailable && activeHolds) {
            for (const hold of activeHolds) {
              const holdStart = new Date(hold.start_time);
              const holdEnd = new Date(hold.end_time);
              
              if (
                (currentTime >= holdStart && currentTime < holdEnd) ||
                (slotEnd > holdStart && slotEnd <= holdEnd) ||
                (currentTime <= holdStart && slotEnd >= holdEnd)
              ) {
                isAvailable = false;
                break;
              }
            }
          }

          // Check calendar blocks
          if (isAvailable && calendarBlocks) {
            for (const block of calendarBlocks) {
              const blockStart = new Date(block.start_time);
              const blockEnd = new Date(block.end_time);
              
              if (
                (currentTime >= blockStart && currentTime < blockEnd) ||
                (slotEnd > blockStart && slotEnd <= blockEnd) ||
                (currentTime <= blockStart && slotEnd >= blockEnd)
              ) {
                isAvailable = false;
                break;
              }
            }
          }

          // Don't show past slots for today
          if (format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
            if (isBefore(currentTime, new Date())) {
              isAvailable = false;
            }
          }

          candidateSlots.push({
            time: currentTime,
            available: isAvailable,
            isHold: false,
          });

          currentTime = addMinutes(currentTime, 30); // 30-minute intervals
        }
      }

      setSlots(candidateSlots);
    } catch (error) {
      logger.error('Slot generation error:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  return { slots, loading, refreshSlots: generateSlots };
};
