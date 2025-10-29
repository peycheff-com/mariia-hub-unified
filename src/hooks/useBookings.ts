import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBookings = (userId?: string) => {
  return useQuery({
    queryKey: ['bookings', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*, services(*)')
        .eq('user_id', userId)
        .order('booking_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingData: {
      serviceId: string;
      bookingDate: string;
      notes?: string;
      priceId: string;
      isPackage: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke('create-booking-payment', {
        body: bookingData,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Booking Initiated",
        description: "Please complete payment in the new tab",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
    retry: 2,
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.functions.invoke('verify-booking-payment', {
        body: { sessionId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Payment Verified",
        description: "Your booking has been confirmed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
    },
  });
};
