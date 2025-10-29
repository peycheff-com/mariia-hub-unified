import { useState, useEffect } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface Hold {
  id: string;
  resource_id: string;
  start_time: string;
  end_time: string;
  expires_at: string;
  session_id: string;
}

export const useHolds = () => {
  const { toast } = useToast();
  const [activeHold, setActiveHold] = useState<Hold | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Clean up expired hold on unmount
  useEffect(() => {
    return () => {
      if (activeHold) {
        releaseHold(activeHold.id);
      }
    };
  }, [activeHold]);

  const createHold = async (
    resourceId: string,
    serviceId: string,
    startTime: Date,
    endTime: Date,
    sessionId: string
  ): Promise<{ success: boolean; holdId?: string; error?: string }> => {
    setIsCreating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Set expiry to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const { data, error } = await supabase
        .from('holds')
        .insert({
          resource_id: resourceId,
          user_id: user.id,
          service_id: serviceId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          expires_at: expiresAt.toISOString(),
          session_id: sessionId,
        })
        .select()
        .single();

      if (error) {
        // Check if it's a conflict
        if (error.code === '23505') {
          return { 
            success: false, 
            error: 'This time slot is no longer available. Please select another time.' 
          };
        }
        throw error;
      }

      setActiveHold(data);
      return { success: true, holdId: data.id };
    } catch (error: any) {
      logger.error('Hold creation error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to reserve time slot' 
      };
    } finally {
      setIsCreating(false);
    }
  };

  const releaseHold = async (holdId: string) => {
    try {
      await supabase.from('holds').delete().eq('id', holdId);
      setActiveHold(null);
    } catch (error) {
      logger.error('Failed to release hold:', error);
    }
  };

  const checkAvailability = async (
    resourceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_slot_availability', {
        p_resource_id: resourceId,
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString(),
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      logger.error('Availability check error:', error);
      return false;
    }
  };

  return {
    activeHold,
    isCreating,
    createHold,
    releaseHold,
    checkAvailability,
  };
};
