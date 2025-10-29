/**
 * Comprehensive Test Suite for AuthService
 *
 * Tests cover critical authentication service functionality including:
 * - User authentication (sign in/sign up)
 * - Session management and persistence
 * - Password reset and update operations
 * - OAuth authentication flows
 * - User metadata management
 * - Role-based access control
 * - Auth state change notifications
 * - Error handling and edge cases
 * - Caching mechanisms
 * - Singleton pattern behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  createMockUser,
  createMockSession,
  mockSupabaseAuth,
  mockAuthErrors,
  createSupabaseRolesMock,
} from '@/test/mocks/auth.mock';

import { AuthService, authService } from '../auth.service';

// ==================== MOCK SETUP ====================

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: vi.fn(() => createSupabaseRolesMock()),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock window.location.origin
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
});

// ==================== TEST UTILITIES ====================

// Helper to create a fresh AuthService instance for testing
const createTestAuthService = () => {
  return AuthService.getInstance();
};

// ==================== TESTS ====================

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockSupabaseAuth.clearMockState();

    // Get fresh service instance
    service = createTestAuthService();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();

    // Clear localStorage
    localStorage.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = AuthService.getInstance();
      const instance2 = AuthService.getInstance();
      const instance3 = authService; // Exported singleton

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
    });

    it('should maintain state across getInstance calls', () => {
      const instance1 = AuthService.getInstance();
      const instance2 = AuthService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Session Management', () => {
    it('should get current session successfully', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabaseAuth.setMockUser(mockUser);

      const session = await service.getCurrentSession();

      expect(session).toEqual(mockSession);
      expect(mockSupabaseAuth.getSession).toHaveBeenCalled();
    });

    it('should return null when no session exists', async () => {
      mockSupabaseAuth.clearMockState();

      const session = await service.getCurrentSession();

      expect(session).toBe(null);
    });

    it('should handle session retrieval errors', async () => {
      const error = new Error('Session retrieval failed');
      mockSupabaseAuth.getSession.mockRejectedValueOnce(error);

      const session = await service.getCurrentSession();

      expect(session).toBe(null);
    });

    it('should get current user successfully', async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.setMockUser(mockUser);

      const user = await service.getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
    });

    it('should return null when no user exists', async () => {
      mockSupabaseAuth.clearMockState();

      const user = await service.getCurrentUser();

      expect(user).toBe(null);
    });

    it('should handle user retrieval errors', async () => {
      const error = new Error('User retrieval failed');
      mockSupabaseAuth.getUser.mockRejectedValueOnce(error);

      const user = await service.getCurrentUser();

      expect(user).toBe(null);
    });
  });

  describe('Sign In Functionality', () => {
    it('should sign in user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await service.signIn(credentials);

      expect(result.user).toBeTruthy();
      expect(result.session).toBeTruthy();
      expect(result.error).toBe(null);
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should sign in admin user with valid credentials', async () => {
      const credentials = {
        email: 'admin@example.com',
        password: 'admin123',
      };

      const result = await service.signIn(credentials);

      expect(result.user).toBeTruthy();
      expect(result.session).toBeTruthy();
      expect(result.error).toBe(null);
      expect(result.user?.email).toBe('admin@example.com');
    });

    it('should return error for invalid credentials', async () => {
      const credentials = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      const result = await service.signIn(credentials);

      expect(result.user).toBe(null);
      expect(result.session).toBe(null);
      expect(result.error).toEqual(mockAuthErrors.invalidCredentials);
    });

    it('should handle sign in errors gracefully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock network error
      mockSupabaseAuth.signInWithPassword.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.signIn(credentials);

      expect(result.user).toBe(null);
      expect(result.session).toBe(null);
      expect(result.error?.name).toBe('UnknownError');
      expect(result.error?.message).toBe('An unexpected error occurred during sign in');
    });
  });

  describe('Sign Up Functionality', () => {
    it('should sign up new user successfully', async () => {
      const credentials = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
      };

      const result = await service.signUp(credentials);

      expect(result.user).toBeTruthy();
      expect(result.session).toBe(null); // Email confirmation required
      expect(result.error).toBe(null);
      expect(result.user?.email).toBe('newuser@example.com');
    });

    it('should return error for existing email', async () => {
      const credentials = {
        email: 'existing@example.com',
        password: 'password123',
      };

      const result = await service.signUp(credentials);

      expect(result.user).toBe(null);
      expect(result.session).toBe(null);
      expect(result.error).toEqual(mockAuthErrors.emailAlreadyExists);
    });

    it('should return error for weak password', async () => {
      const credentials = {
        email: 'newuser@example.com',
        password: '123', // Too short
      };

      const result = await service.signUp(credentials);

      expect(result.user).toBe(null);
      expect(result.session).toBe(null);
      expect(result.error).toEqual(mockAuthErrors.weakPassword);
    });

    it('should handle sign up errors gracefully', async () => {
      const credentials = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      // Mock network error
      mockSupabaseAuth.signUp.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.signUp(credentials);

      expect(result.user).toBe(null);
      expect(result.session).toBe(null);
      expect(result.error?.name).toBe('UnknownError');
    });
  });

  describe('Sign Out Functionality', () => {
    it('should sign out user successfully', async () => {
      const result = await service.signOut();

      expect(result.error).toBe(null);
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors gracefully', async () => {
      // Mock sign out error
      mockSupabaseAuth.signOut.mockRejectedValueOnce(new Error('Sign out failed'));

      const result = await service.signOut();

      expect(result.error?.name).toBe('UnknownError');
      expect(result.error?.message).toBe('An unexpected error occurred during sign out');
    });
  });

  describe('Password Reset Functionality', () => {
    it('should send password reset email successfully', async () => {
      const email = 'test@example.com';

      const result = await service.resetPassword(email);

      expect(result.error).toBe(null);
      expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
        redirectTo: 'http://localhost:3000/auth/reset-password',
      });
    });

    it('should handle password reset errors', async () => {
      const email = 'nonexistent@example.com';

      const result = await service.resetPassword(email);

      expect(result.error).toBeTruthy();
      expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
        redirectTo: 'http://localhost:3000/auth/reset-password',
      });
    });

    it('should handle password reset network errors', async () => {
      const email = 'test@example.com';

      mockSupabaseAuth.resetPasswordForEmail.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.resetPassword(email);

      expect(result.error?.name).toBe('UnknownError');
      expect(result.error?.message).toBe('An unexpected error occurred during password reset');
    });
  });

  describe('Password Update Functionality', () => {
    it('should update password successfully', async () => {
      const newPassword = 'newpassword123';

      const result = await service.updatePassword(newPassword);

      expect(result.error).toBe(null);
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });

    it('should handle password update errors', async () => {
      const newPassword = 'newpassword123';

      mockSupabaseAuth.updateUser.mockResolvedValueOnce({
        data: null,
        error: mockAuthErrors.sessionNotFound,
      });

      const result = await service.updatePassword(newPassword);

      expect(result.error).toBeTruthy();
    });

    it('should handle password update network errors', async () => {
      const newPassword = 'newpassword123';

      mockSupabaseAuth.updateUser.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.updatePassword(newPassword);

      expect(result.error?.name).toBe('UnknownError');
      expect(result.error?.message).toBe('An unexpected error occurred during password update');
    });
  });

  describe('User Metadata Management', () => {
    it('should update user metadata successfully', async () => {
      const metadata = {
        full_name: 'Updated Name',
        preferences: { theme: 'dark' },
      };

      const result = await service.updateUserMetadata(metadata);

      expect(result.error).toBe(null);
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        data: metadata,
      });
    });

    it('should handle metadata update errors', async () => {
      const metadata = { full_name: 'Updated Name' };

      mockSupabaseAuth.updateUser.mockResolvedValueOnce({
        data: null,
        error: mockAuthErrors.sessionNotFound,
      });

      const result = await service.updateUserMetadata(metadata);

      expect(result.error).toBeTruthy();
    });

    it('should handle metadata update network errors', async () => {
      const metadata = { full_name: 'Updated Name' };

      mockSupabaseAuth.updateUser.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.updateUserMetadata(metadata);

      expect(result.error?.name).toBe('UnknownError');
      expect(result.error?.message).toBe('An unexpected error occurred during metadata update');
    });
  });

  describe('OAuth Authentication', () => {
    it('should sign in with Google OAuth', async () => {
      const result = await service.signInWithOAuth('google');

      expect(result.error).toBe(null);
      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });
    });

    it('should sign in with GitHub OAuth', async () => {
      const result = await service.signInWithOAuth('github');

      expect(result.error).toBe(null);
      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      });
    });

    it('should handle OAuth errors', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValueOnce({
        data: null,
        error: mockAuthErrors.networkError,
      });

      const result = await service.signInWithOAuth('google');

      expect(result.error).toEqual(mockAuthErrors.networkError);
    });

    it('should handle OAuth network errors', async () => {
      mockSupabaseAuth.signInWithOAuth.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.signInWithOAuth('google');

      expect(result.error?.name).toBe('UnknownError');
      expect(result.error?.message).toContain('OAuth sign in with google');
    });
  });

  describe('Auth State Change Notifications', () => {
    it('should notify listeners of auth state changes', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = service.onAuthStateChange(callback1);
      const unsubscribe2 = service.onAuthStateChange(callback2);

      // Trigger auth state change
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabaseAuth.triggerAuthStateChange('SIGNED_IN', mockSession);

      expect(callback1).toHaveBeenCalledWith({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        error: null,
      });

      expect(callback2).toHaveBeenCalledWith({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        error: null,
      });

      // Cleanup
      unsubscribe1();
      unsubscribe2();
    });

    it('should stop notifying after unsubscribe', () => {
      const callback = vi.fn();

      const unsubscribe = service.onAuthStateChange(callback);

      // Trigger auth state change
      mockSupabaseAuth.triggerAuthStateChange('SIGNED_IN', createMockSession(createMockUser()));

      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Trigger another auth state change
      mockSupabaseAuth.triggerAuthStateChange('SIGNED_OUT', null);

      // Callback should not be called again
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple listeners and unsubscriptions correctly', () => {
      const callbacks = Array.from({ length: 5 }, () => vi.fn());
      const unsubscribes = callbacks.map(callback => service.onAuthStateChange(callback));

      // Trigger auth state change
      mockSupabaseAuth.triggerAuthStateChange('SIGNED_IN', createMockSession(createMockUser()));

      // All callbacks should be called
      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Unsubscribe first 3 callbacks
      unsubscribes.slice(0, 3).forEach(unsubscribe => unsubscribe());

      // Trigger another auth state change
      mockSupabaseAuth.triggerAuthStateChange('SIGNED_OUT', null);

      // Only remaining 2 callbacks should be called
      callbacks.slice(0, 3).forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      callbacks.slice(3).forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(2);
      });

      // Cleanup remaining
      unsubscribes.slice(3).forEach(unsubscribe => unsubscribe());
    });
  });

  describe('Role-Based Access Control', () => {
    it('should return true when user has specific role in metadata', async () => {
      const mockUser = createMockUser({
        user_metadata: { role: 'admin' },
      });
      mockSupabaseAuth.setMockUser(mockUser);

      const hasRole = await service.hasRole('admin');

      expect(hasRole).toBe(true);
    });

    it('should return false when user does not have specific role', async () => {
      const mockUser = createMockUser({
        user_metadata: { role: 'user' },
      });
      mockSupabaseAuth.setMockUser(mockUser);

      const hasRole = await service.hasRole('admin');

      expect(hasRole).toBe(false);
    });

    it('should return false when user has no role metadata', async () => {
      const mockUser = createMockUser();
      delete (mockUser as any).user_metadata.role;
      mockSupabaseAuth.setMockUser(mockUser);

      const hasRole = await service.hasRole('admin');

      expect(hasRole).toBe(false);
    });

    it('should return false when no user is authenticated', async () => {
      mockSupabaseAuth.clearMockState();

      const hasRole = await service.hasRole('admin');

      expect(hasRole).toBe(false);
    });
  });

  describe('User Caching', () => {
    it('should cache user in localStorage', async () => {
      const mockUser = createMockUser({
        email: 'cached@example.com',
        user_metadata: { full_name: 'Cached User' },
      });

      service.cacheUser(mockUser);

      const cachedUser = service.getCachedUser();

      expect(cachedUser).toBeTruthy();
      expect(cachedUser?.id).toBe(mockUser.id);
      expect(cachedUser?.email).toBe('cached@example.com');
      expect(cachedUser?.user_metadata?.full_name).toBe('Cached User');
    });

    it('should return null when no cached user exists', () => {
      const cachedUser = service.getCachedUser();

      expect(cachedUser).toBe(null);
    });

    it('should clear cached user when null is passed', () => {
      const mockUser = createMockUser();
      service.cacheUser(mockUser);

      expect(service.getCachedUser()).toBeTruthy();

      service.cacheUser(null);

      expect(service.getCachedUser()).toBe(null);
    });

    it('should handle corrupted cached data gracefully', () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('bm_user_cached', 'invalid-json');

      const cachedUser = service.getCachedUser();

      expect(cachedUser).toBe(null);
      expect(localStorage.getItem('bm_user_cached')).toBe(null);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const mockUser = createMockUser();

      // Should not throw error
      expect(() => service.cacheUser(mockUser)).not.toThrow();

      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Auth Listener Initialization', () => {
    it('should initialize auth listener and return subscription', () => {
      const subscription = service.initializeAuthListener();

      expect(subscription).toBeTruthy();
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
      expect(subscription.data.subscription).toBeTruthy();
    });

    it('should log auth state changes when initializing listener', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      service.initializeAuthListener();

      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabaseAuth.triggerAuthStateChange('SIGNED_IN', mockSession);

      expect(consoleSpy).toHaveBeenCalledWith('Auth state changed:', {
        event: 'SIGNED_IN',
        email: mockUser.email,
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Integration with Auth State Methods', () => {
    it('should update auth state on successful sign in', async () => {
      const callback = vi.fn();
      service.onAuthStateChange(callback);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      await service.signIn(credentials);

      expect(callback).toHaveBeenCalledWith({
        user: expect.any(Object),
        session: expect.any(Object),
        isLoading: false,
        error: null,
      });
    });

    it('should update auth state on sign out', async () => {
      const callback = vi.fn();
      service.onAuthStateChange(callback);

      await service.signOut();

      expect(callback).toHaveBeenCalledWith({
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
    });

    it('should update auth state on sign up', async () => {
      const callback = vi.fn();
      service.onAuthStateChange(callback);

      const credentials = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
      };

      await service.signUp(credentials);

      expect(callback).toHaveBeenCalledWith({
        user: expect.any(Object),
        session: null,
        isLoading: false,
        error: null,
      });
    });
  });
});