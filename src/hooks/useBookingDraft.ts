import { useState, useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingDraft {
  serviceType?: "beauty" | "fitness";
  serviceId?: string;
  bookingDate?: string;
  bookingTime?: string;
  notes?: string;
  stepCompleted: number;
}

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("bm_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("bm_session_id", sessionId);
  }
  return sessionId;
};

export const useBookingDraft = () => {
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      const sessionId = getSessionId();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("booking_drafts")
        .select("*")
        .or(`user_id.eq.${user?.id},session_id.eq.${sessionId}`)
        .single();

      if (data && !error) {
        setDraft({
          serviceType: data.service_type as "beauty" | "fitness",
          serviceId: data.service_id || undefined,
          bookingDate: data.booking_date || undefined,
          bookingTime: data.booking_time || undefined,
          notes: data.notes || undefined,
          stepCompleted: data.step_completed,
        });

        // Show resume toast
        toast({
          title: "Resume booking?",
          description: "You have an incomplete booking. Would you like to continue?",
          duration: 5000,
        });
      }
    } catch (error) {
      // Draft load failed silently
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = async (draftData: Partial<BookingDraft>) => {
    try {
      const sessionId = getSessionId();
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        user_id: user?.id || null,
        session_id: !user ? sessionId : null,
        service_type: draftData.serviceType,
        service_id: draftData.serviceId,
        booking_date: draftData.bookingDate,
        booking_time: draftData.bookingTime,
        notes: draftData.notes,
        step_completed: draftData.stepCompleted || 1,
      };

      await supabase.from("booking_drafts").upsert(payload);
      setDraft(draftData as BookingDraft);
    } catch (error) {
      // Draft save failed silently
    }
  };

  const clearDraft = async () => {
    try {
      const sessionId = getSessionId();
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from("booking_drafts")
        .delete()
        .or(`user_id.eq.${user?.id},session_id.eq.${sessionId}`);

      setDraft(null);
    } catch (error) {
      // Draft clear failed silently
    }
  };

  return {
    draft,
    isLoading,
    saveDraft,
    clearDraft,
  };
};
