import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, addMinutes } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  service_type: 'beauty' | 'fitness';
  location: 'studio' | 'online' | 'fitness';
  is_available: boolean;
  notes: string | null;
  created_at?: string;
}

export interface Booking {
  id: string;
  booking_date: string;
  service_id: string;
  status: string;
  booking_type: string;
  booking_source?: string;
  booksy_appointment_id?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  notes?: string | null;
  client_notes?: string | null;
  admin_notes?: string | null;
  amount_paid?: number | null;
  currency?: string;
  services: {
    title: string;
    service_type: string;
    duration_minutes?: number;
    price_from?: number;
  };
}

export const useAvailability = (serviceType?: 'beauty' | 'fitness') => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const slotsQuery = useQuery({
    queryKey: ['availability-slots', serviceType],
    queryFn: async () => {
      let query = supabase
        .from('availability_slots')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });
      if (serviceType) query = query.eq('service_type', serviceType);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AvailabilitySlot[];
    },
    onError: (error: any) => {
      toast({ title: 'Error loading availability', description: error.message, variant: 'destructive' });
    },
  });

  const bookingsQuery = useQuery({
    queryKey: ['bookings-window', serviceType],
    queryFn: async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const monthsAhead = new Date(now);
      monthsAhead.setDate(monthsAhead.getDate() + 60);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            title,
            service_type,
            duration_minutes,
            price_from
          )
        `)
        .gte('booking_date', now.toISOString())
        .lte('booking_date', monthsAhead.toISOString())
        .in('status', ['confirmed', 'pending', 'completed']);
      if (error) throw error;
      return (data || []) as Booking[];
    },
  });

  useEffect(() => {
    setLoading(slotsQuery.isLoading || bookingsQuery.isLoading);
    if (slotsQuery.data) setSlots(slotsQuery.data);
    if (bookingsQuery.data) setBookings(bookingsQuery.data);
  }, [slotsQuery.isLoading, bookingsQuery.isLoading, slotsQuery.data, bookingsQuery.data]);

  const checkConflicts = (
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    location: string,
    excludeId?: string
  ): { hasConflict: boolean; conflictingSlots: AvailabilitySlot[] } => {
    const conflictingSlots = slots.filter(slot => {
      if (excludeId && slot.id === excludeId) return false;
      if (slot.day_of_week !== dayOfWeek) return false;
      if (slot.location !== location) return false;

      // Check time overlap
      const slotStart = slot.start_time;
      const slotEnd = slot.end_time;
      return startTime < slotEnd && endTime > slotStart;
    });

    return {
      hasConflict: conflictingSlots.length > 0,
      conflictingSlots,
    };
  };

  const createSlot = async (slotData: Omit<AvailabilitySlot, 'id' | 'created_at'>) => {
    try {
      const conflict = checkConflicts(
        slotData.day_of_week,
        slotData.start_time,
        slotData.end_time,
        slotData.location
      );

      if (conflict.hasConflict) {
        toast({
          title: 'Scheduling Conflict',
          description: `This time overlaps with ${conflict.conflictingSlots.length} existing slot(s) at the same location`,
          variant: 'destructive',
        });
        return { success: false, error: 'Conflict detected' };
      }

      const { data, error } = await supabase
        .from('availability_slots')
        .insert([slotData])
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Availability slot created successfully' });
      await loadSlots();
      return { success: true, data };
    } catch (error: any) {
      toast({
        title: 'Error creating slot',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const updateSlot = async (id: string, slotData: Partial<AvailabilitySlot>) => {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .update(slotData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Availability slot updated successfully' });
      await loadSlots();
      return { success: true, data };
    } catch (error: any) {
      toast({
        title: 'Error updating slot',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const deleteSlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Availability slot deleted successfully' });
      await loadSlots();
      return { success: true };
    } catch (error: any) {
      toast({
        title: 'Error deleting slot',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const getSlotsByDay = () => {
    return slots.reduce((acc, slot) => {
      if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
      acc[slot.day_of_week].push(slot);
      return acc;
    }, {} as Record<number, AvailabilitySlot[]>);
  };

  const getBookingsByDay = () => {
    return bookings.reduce((acc, booking) => {
      const date = new Date(booking.booking_date);
      const dayOfWeek = date.getDay();
      if (!acc[dayOfWeek]) acc[dayOfWeek] = [];
      acc[dayOfWeek].push(booking);
      return acc;
    }, {} as Record<number, Booking[]>);
  };

  return {
    slots,
    bookings,
    loading,
    createSlot,
    updateSlot,
    deleteSlot,
    checkConflicts,
    getSlotsByDay,
    getBookingsByDay,
    refreshData: () => {
      loadSlots();
      loadBookings();
    },
  };
};
