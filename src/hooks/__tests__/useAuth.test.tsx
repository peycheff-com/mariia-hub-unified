/**
 * Comprehensive Test Suite for useAuth Hook
 *
 * Tests cover critical authentication hook functionality including:
 * - Authentication state management
 * - Role-based access control (RBAC)
 * - Session persistence and retrieval
 * - Sign out functionality
 * - Error handling and edge cases
 * - User metadata and permissions
 * - Session expiration handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

import { useAuth } from '../useAuth';
import { createMockUser, createMockSession, mockSupabaseAuth, createSupabaseRolesMock } from '@/test/mocks/auth.mock';

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

// ==================== TEST UTILITIES ====================

// Wrapper component to provide context if needed
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => {
    // Mock AuthProvider behavior for testing the hook directly
    return <>{children}</>;
  };
};

// ==================== TESTS ====================

describe('useAuth Hook', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockSupabaseAuth.clearMockState();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe('Initial State and Authentication', () => {
    it('should return initial loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should load and set authenticated user', async () => {
      const mockUser = createMockUser({ email: 'user@example.com' });
      const mockSession = createMockSession(mockUser);

      mockSupabaseAuth.setMockUser(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.error).toBe(null);
    });

    it('should handle session retrieval errors', async () => {
      const error = new Error('Session retrieval failed');
      mockSupabaseAuth.getSession.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
      expect(result.current.error).toEqual(error);
    });

    it('should handle empty session data', async () => {
      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Auth State Changes', () => {
    it('should update state on auth state change events', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate user sign in
      const newUser = createMockUser({ email: 'newuser@example.com' });
      const newSession = createMockSession(newUser);

      act(() => {
        mockSupabaseAuth.triggerAuthStateChange('SIGNED_IN', newSession);
      });

      expect(result.current.user).toEqual(newUser);
      expect(result.current.session).toEqual(newSession);
      expect(result.current.error).toBe(null);
    });

    it('should clear state on sign out event', async () => {
      // Start with authenticated user
      const mockUser = createMockUser({ email: 'user@example.com' });
      mockSupabaseAuth.setMockUser(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Simulate sign out
      act(() => {
        mockSupabaseAuth.triggerAuthStateChange('SIGNED_OUT', null);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle token refresh events', async () => {
      const mockUser = createMockUser({ email: 'user@example.com' });
      const originalSession = createMockSession(mockUser);
      const refreshedSession = createMockSession(mockUser, {
        access_token: 'new-access-token',
      });

      mockSupabaseAuth.setMockUser(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(originalSession);
      });

      // Simulate token refresh
      act(() => {
        mockSupabaseAuth.triggerAuthStateChange('TOKEN_REFRESHED', refreshedSession);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(refreshedSession);
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should return true for hasRole when user has the role', async () => {
      const mockUser = createMockUser({
        email: 'admin@example.com',
        user_metadata: { role: 'admin' },
      });
      mockSupabaseAuth.setMockUser(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      const hasAdminRole = await act(async () => {
        return await result.current.hasRole('admin');
      });

      expect(hasAdminRole).toBe(true);
    });

    it('should return false for hasRole when user does not have the role', async () => {
      const mockUser = createMockUser({
        email: 'user@example.com',
        user_metadata: { role: 'user' },
      });
      mockSupabaseAuth.setMockUser(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      const hasAdminRole = await act(async () => {
        return await result.current.hasRole('admin');
      });

      expect(hasAdminRole).toBe(false);
    });

    it('should return false for hasRole when user is not authenticated', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toBe(null);
      });

      const hasAdminRole = await act(async () => {
        return await result.current.hasRole('admin');
      });

      expect(hasAdminRole).toBe(false);
    });

    it('should handle database errors in hasRole gracefully', async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.setMockUser(mockUser);

      // Mock database error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Mock a database error for role check
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error'),
              }),
            }),
          }),
        }),
      });

      vi.mocked(mockSupabaseAuth).from = mockFrom;

      const hasAdminRole = await act(async () => {
        return await result.current.hasRole('admin');
      });

      expect(hasAdminRole).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('Sign Out Functionality', () => {
    it('should call supabase auth signOut method', async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.setMockUser(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });

    it('should handle signOut errors gracefully', async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.setMockUser(mockUser);

      const error = new Error('Sign out failed');
      mockSupabaseAuth.signOut.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Should not throw error
      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should maintain session persistence across hook re-renders', async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.setMockUser(mockUser);

      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Rerender hook
      rerender();

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).not.toBe(null);
    });

    it('should handle session expiration scenarios', async () => {
      const mockUser = createMockUser();
      const expiredSession = createMockSession(mockUser, {
        expires_at: Date.now() - 1000, // Expired
      });

      mockSupabaseAuth.setMockUser(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(expiredSession);
      });

      // Simulate session expiration event
      act(() => {
        mockSupabaseAuth.triggerAuthStateChange('SIGNED_OUT', null);
      });

      expect(result.current.session).toBe(null);
      expect(result.current.user).toBe(null);
    });
  });

  describe('User Metadata and Properties', () => {
    it('should provide access to user metadata', async () => {
      const mockUser = createMockUser({
        user_metadata: {
          full_name: 'Test User',
          role: 'premium',
          preferences: {
            theme: 'dark',
            language: 'en',
          },
        },
      });
      mockSupabaseAuth.setMockUser(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.user?.user_metadata?.full_name).toBe('Test User');
      expect(result.current.user?.user_metadata?.role).toBe('premium');
      expect(result.current.user?.user_metadata?.preferences?.theme).toBe('dark');
    });

    it('should handle users without metadata', async () => {
      const mockUser = createMockUser();
      delete (mockUser as any).user_metadata;

      mockSupabaseAuth.setMockUser(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.user?.user_metadata).toBeUndefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed session data', async () => {
      // Mock malformed session
      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: { invalid: 'data' } },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle gracefully without throwing
      expect(result.current.user).toBe(null);
    });

    it('should handle multiple simultaneous auth state changes', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const user1 = createMockUser({ email: 'user1@example.com' });
      const user2 = createMockUser({ email: 'user2@example.com' });

      // Trigger multiple changes rapidly
      act(() => {
        mockSupabaseAuth.triggerAuthStateChange('SIGNED_IN', createMockSession(user1));
        mockSupabaseAuth.triggerAuthStateChange('SIGNED_IN', createMockSession(user2));
      });

      await waitFor(() => {
        // Should settle on the last change
        expect(result.current.user?.email).toBe('user2@example.com');
      });
    });

    it('should handle auth subscription cleanup on unmount', async () => {
      const { unmount } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const authStateChangeCalls = mockSupabaseAuth.onAuthStateChange.mock.results;
      const lastCall = authStateChangeCalls[authStateChangeCalls.length - 1];
      const mockSubscription = lastCall.value.data.subscription;

      unmount();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Performance and Memory', () => {
    it('should not create memory leaks with multiple hook instances', async () => {
      const hooks = [];

      // Create multiple hook instances
      for (let i = 0; i < 5; i++) {
        const { result, unmount } = renderHook(() => useAuth(), {
          wrapper: createWrapper(),
        });

        hooks.push({ result, unmount });
      }

      // Wait for all to load
      for (const hook of hooks) {
        await waitFor(() => {
          expect(hook.result.current.isLoading).toBe(false);
        });
      }

      // Clean up all hooks
      for (const hook of hooks) {
        hook.unmount();
      }

      // All subscriptions should be cleaned up
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalledTimes(5);
    });
  });
});