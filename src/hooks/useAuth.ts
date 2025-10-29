import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          error: null
        });
      } catch (error) {
        setState({
          user: null,
          session: null,
          isLoading: false,
          error: error as Error
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          error: null
        });
      }
    );

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  const hasRole = async (role: string): Promise<boolean> => {
    if (!state.user) return false;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', state.user.id)
        .eq('role', role)
        .single();

      if (error || !data) return false;
      return true;
    } catch {
      return false;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('Error signing out:', error);
    }
  };

  return {
    ...state,
    hasRole,
    signOut
  };
};