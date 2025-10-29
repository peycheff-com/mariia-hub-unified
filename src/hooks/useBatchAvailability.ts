import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { supabase } from '@/integrations/supabase/client';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DayAvailability {
  date: string;
  slots: TimeSlot[];
}

interface AvailabilityFilters {
  serviceId?: string;
  startDate?: string;
  endDate?: string;
  locationId?: string;
}

export const useBatchAvailability = (filters: AvailabilityFilters) => {
  const dateRange = useMemo(() => {
    const startDate = filters.startDate || new Date().toISOString().split('T')[0];
    const endDate = filters.endDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate, endDate };
  }, [filters.startDate, filters.endDate]);

  return useQuery({
    queryKey: ['batch-availability', filters],
    queryFn: async () => {
      const { startDate, endDate } = dateRange;

      // Build the query
      let query = supabase
        .from('availability_slots')
        .select(`
          date,
          slots: time,
          services(id, title, duration_minutes, is_active)
        `)
        .eq('date', 'gte', startDate)
        .eq('date', 'lte', endDate)
        .eq('is_active', true);

      // Add filters if provided
      if (filters.serviceId) {
        query = query.contains('services', JSON.stringify([filters.serviceId]));
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to DayAvailability format
      const availabilityMap = new Map<string, DayAvailability>();

      data?.forEach((slot: any) => {
        const date = slot.date;
        if (!availabilityMap.has(date)) {
          availabilityMap.set(date, {
            date,
            slots: []
          });
        }

        // Parse slots JSON if it's a string
        let slots: TimeSlot[] = [];
        if (typeof slot.slots === 'string') {
          try {
            slots = JSON.parse(slot.slots);
          } catch {
            slots = [];
          }
        }

        availabilityMap.get(date)?.slots.push(...slots);
      });

      // Convert map to array and sort by date
      return Array.from(availabilityMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    enabled: !!(filters.serviceId || filters.startDate),
    staleTime: 2 * 60 * 1000, // 2 minutes for freshness
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
  });
};

// Preload availability for multiple services
export const usePreloadAvailability = (serviceIds: string[]) => {
  const { data: availability1, isLoading: loading1 } = useBatchAvailability({
    serviceId: serviceIds[0],
  });

  const { data: availability2, isLoading: loading2 } = useBatchAvailability({
    serviceId: serviceIds[1],
  });

  const { data: availability3, isLoading: loading3 } = useBatchAvailability({
    serviceId: serviceIds[2],
  });

  // Return combined data
  const combinedAvailability = availability1 || [];

  return {
    availability: combinedAvailability,
    isLoading: loading1 || loading2 || loading3,
  };
};