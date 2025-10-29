import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';

import { authService, AuthState } from '@/services/auth.service';

export interface UseAuthStateReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ user: User | null; session: Session | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: AuthError | null }>;
  hasRole: (role: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

export const useAuthState = (): UseAuthStateReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const session = await authService.getCurrentSession();
      const user = session?.user || await authService.getCachedUser();

      setAuthState({
        user,
        session,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        error: error as AuthError,
      });
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Get initial state from cache
    const cachedUser = authService.getCachedUser();
    if (cachedUser) {
      setAuthState({
        user: cachedUser,
        session: null,
        isLoading: false,
        error: null,
      });
    }

    // Initialize auth listener
    const subscription = authService.initializeAuthListener();

    // Get current session
    refreshUser();

    // Cleanup
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [refreshUser]);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(setAuthState);
    return unsubscribe;
  }, []);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await authService.signIn({ email, password });

    // Cache user on successful sign in
    if (result.user) {
      authService.cacheUser(result.user);
    }

    return result;
  }, []);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await authService.signUp({ email, password, fullName });

    // Cache user on successful sign up
    if (result.user) {
      authService.cacheUser(result.user);
    }

    return result;
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await authService.signOut();

    // Clear cached user
    authService.cacheUser(null);

    return result;
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    return await authService.resetPassword(email);
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await authService.updatePassword(newPassword);

    return result;
  }, []);

  // Sign in with OAuth
  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await authService.signInWithOAuth(provider);

    return result;
  }, []);

  // Check if user has role
  const hasRole = useCallback(async (role: string): Promise<boolean> => {
    return await authService.hasRole(role);
  }, []);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    signInWithOAuth,
    hasRole,
    refreshUser,
  };
};