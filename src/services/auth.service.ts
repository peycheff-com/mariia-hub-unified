import { User, Session, AuthError } from '@supabase/supabase-js';

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  fullName?: string;
}

export class AuthService {
  private static instance: AuthService;
  private authStateCallbacks: Set<(state: AuthState) => void> = new Set();

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (state: AuthState) => void) {
    this.authStateCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.authStateCallbacks.delete(callback);
    };
  }

  // Notify all listeners of auth state changes
  private notifyAuthStateChange(state: AuthState) {
    this.authStateCallbacks.forEach(callback => callback(state));
  }

  // Get current session
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logger.error('Error getting session:', error);
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Unexpected error getting session:', error);
      return null;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      logger.error('Error getting current user:', error);
      return null;
    }
  }

  // Sign in with email and password
  async signIn({ email, password }: SignInCredentials): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const result = {
        user: data.user,
        session: data.session,
        error
      };

      // Update auth state
      this.notifyAuthStateChange({
        user: data.user,
        session: data.session,
        isLoading: false,
        error
      });

      return result;
    } catch (error) {
      const authError = {
        name: 'UnknownError',
        message: 'An unexpected error occurred during sign in',
      } as AuthError;

      this.notifyAuthStateChange({
        user: null,
        session: null,
        isLoading: false,
        error: authError
      });

      return { user: null, session: null, error: authError };
    }
  }

  // Sign up with email and password
  async signUp({ email, password, fullName }: SignUpCredentials): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      const result = {
        user: data.user,
        session: data.session,
        error
      };

      // Update auth state
      this.notifyAuthStateChange({
        user: data.user,
        session: data.session,
        isLoading: false,
        error
      });

      return result;
    } catch (error) {
      const authError = {
        name: 'UnknownError',
        message: 'An unexpected error occurred during sign up',
      } as AuthError;

      this.notifyAuthStateChange({
        user: null,
        session: null,
        isLoading: false,
        error: authError
      });

      return { user: null, session: null, error: authError };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      // Clear auth state
      this.notifyAuthStateChange({
        user: null,
        session: null,
        isLoading: false,
        error
      });

      return { error };
    } catch (error) {
      const authError = {
        name: 'UnknownError',
        message: 'An unexpected error occurred during sign out',
      } as AuthError;

      return { error: authError };
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      return { error };
    } catch (error) {
      const authError = {
        name: 'UnknownError',
        message: 'An unexpected error occurred during password reset',
      } as AuthError;

      return { error: authError };
    }
  }

  // Update password
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error };
    } catch (error) {
      const authError = {
        name: 'UnknownError',
        message: 'An unexpected error occurred during password update',
      } as AuthError;

      return { error: authError };
    }
  }

  // Update user metadata
  async updateUserMetadata(metadata: Record<string, any>): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata,
      });

      return { error };
    } catch (error) {
      const authError = {
        name: 'UnknownError',
        message: 'An unexpected error occurred during metadata update',
      } as AuthError;

      return { error: authError };
    }
  }

  // Sign in with OAuth provider
  async signInWithOAuth(provider: 'google' | 'github'): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      return { error };
    } catch (error) {
      const authError = {
        name: 'UnknownError',
        message: `An unexpected error occurred during OAuth sign in with ${provider}`,
      } as AuthError;

      return { error: authError };
    }
  }

  // Initialize auth state listener
  initializeAuthListener() {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info('Auth state changed:', { event, email: session?.user?.email });

        this.notifyAuthStateChange({
          user: session?.user || null,
          session,
          isLoading: false,
          error: null
        });
      }
    );

    return subscription;
  }

  // Check if user has specific role
  async hasRole(role: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Check user_metadata for role
    const userRole = user.user_metadata?.role;
    return userRole === role;
  }

  // Get cached user from localStorage
  getCachedUser(): User | null {
    try {
      const cached = localStorage.getItem('bm_user_cached');
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      return parsed && parsed.id ? parsed : null;
    } catch (error) {
      logger.error('Error parsing cached user:', error);
      localStorage.removeItem('bm_user_cached');
      return null;
    }
  }

  // Cache user in localStorage
  cacheUser(user: User | null) {
    try {
      if (user) {
        localStorage.setItem('bm_user_cached', JSON.stringify({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name
        }));
      } else {
        localStorage.removeItem('bm_user_cached');
      }
    } catch (error) {
      logger.error('Error caching user:', error);
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export types
export type { AuthError, User, Session };