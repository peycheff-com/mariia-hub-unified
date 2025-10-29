/**
 * Comprehensive Test Suite for AuthContext
 *
 * Tests cover critical authentication context functionality including:
 * - Authentication state management and initialization
 * - Session management and persistence
 * - Auth state change notifications
 * - Sign out functionality
 * - Loading states and error handling
 * - Context provider and consumer interactions
 * - Component unmounting and cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';

import { AuthProvider, useAuth } from '../AuthContext';
import { createMockUser, createMockSession, mockSupabaseAuth } from '@/test/mocks/auth.mock';

// ==================== MOCK SETUP ====================

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

// ==================== TEST UTILITIES ====================

// Test component that uses the auth context
const TestComponent = () => {
  const { user, loading, signOut } = useAuth();

  return (
    <div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <div data-testid="loading-state">{loading ? 'loading' : 'loaded'}</div>
      <button onClick={signOut} data-testid="sign-out-button">
        Sign Out
      </button>
    </div>
  );
};

// Helper to render component with AuthProvider
const renderWithAuth = (component: ReactNode) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

// ==================== TESTS ====================

describe('AuthContext', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockSupabaseAuth.clearMockState();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe('Initial State and Session Management', () => {
    it('should initialize with loading state', () => {
      renderWithAuth(<TestComponent />);

      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
    });

    it('should load existing session on mount', async () => {
      const mockUser = createMockUser({ email: 'existing@example.com' });
      const mockSession = createMockSession(mockUser);

      mockSupabaseAuth.setMockUser(mockUser);

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('existing@example.com');
    });

    it('should handle no existing session', async () => {
      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
    });

    it('should handle session retrieval errors gracefully', async () => {
      const error = new Error('Session retrieval failed');
      mockSupabaseAuth.getSession.mockRejectedValueOnce(error);

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
    });
  });

  describe('Auth State Changes', () => {
    it('should update user state when auth state changes', async () => {
      renderWithAuth(<TestComponent />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      // Simulate auth state change (user signs in)
      const newUser = createMockUser({ email: 'newuser@example.com' });
      const newSession = createMockSession(newUser);

      act(() => {
        mockSupabaseAuth.triggerAuthStateChange('SIGNED_IN', newSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('newuser@example.com');
      });
    });

    it('should clear user state when user signs out', async () => {
      // Start with authenticated user
      const mockUser = createMockUser({ email: 'user@example.com' });
      mockSupabaseAuth.setMockUser(mockUser);

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com');
      });

      // Simulate sign out
      act(() => {
        mockSupabaseAuth.triggerAuthStateChange('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
      });
    });

    it('should handle token refresh auth state changes', async () => {
      const mockUser = createMockUser({ email: 'user@example.com' });
      mockSupabaseAuth.setMockUser(mockUser);

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com');
      });

      // Simulate token refresh
      const refreshedSession = createMockSession(mockUser);
      act(() => {
        mockSupabaseAuth.triggerAuthStateChange('TOKEN_REFRESHED', refreshedSession);
      });

      // User should still be authenticated
      expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com');
    });
  });

  describe('Sign Out Functionality', () => {
    it('should call signOut method when signOut is triggered', async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.setMockUser(mockUser);

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
      });

      const signOutButton = screen.getByTestId('sign-out-button');

      await act(async () => {
        signOutButton.click();
      });

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });

    it('should handle signOut errors gracefully', async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.setMockUser(mockUser);

      // Mock signOut to throw an error
      const error = new Error('Sign out failed');
      mockSupabaseAuth.signOut.mockRejectedValueOnce(error);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
      });

      const signOutButton = screen.getByTestId('sign-out-button');

      await act(async () => {
        signOutButton.click();
      });

      // Error should be handled gracefully (no test failure)
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Context Provider Behavior', () => {
    it('should provide auth context to nested components', async () => {
      const NestedComponent = () => {
        const { user, loading } = useAuth();
        return (
          <div>
            <div data-testid="nested-user-email">{user?.email || 'no-user'}</div>
            <div data-testid="nested-loading-state">{loading ? 'loading' : 'loaded'}</div>
          </div>
        );
      };

      const mockUser = createMockUser({ email: 'nested@example.com' });
      mockSupabaseAuth.setMockUser(mockUser);

      renderWithAuth(<NestedComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('nested-loading-state')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('nested-user-email')).toHaveTextContent('nested@example.com');
    });

    it('should throw error when useAuth is used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Component Lifecycle and Cleanup', () => {
    it('should clean up auth subscription on unmount', async () => {
      const { unmount } = renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      // Get the subscription from the last onAuthStateChange call
      const authStateChangeCalls = mockSupabaseAuth.onAuthStateChange.mock.results;
      const lastCall = authStateChangeCalls[authStateChangeCalls.length - 1];
      const mockSubscription = lastCall.value.data.subscription;

      // Unmount component
      unmount();

      // Subscription should be unsubscribed
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should handle multiple auth state changes', async () => {
      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      // Simulate multiple auth state changes
      const user1 = createMockUser({ email: 'user1@example.com' });
      const user2 = createMockUser({ email: 'user2@example.com' });

      act(() => {
        mockSupabaseAuth.triggerAuthStateChange('SIGNED_IN', createMockSession(user1));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('user1@example.com');
      });

      act(() => {
        mockSupabaseAuth.triggerAuthStateChange('SIGNED_IN', createMockSession(user2));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('user2@example.com');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle auth subscription errors', async () => {
      // Mock onAuthStateChange to throw an error
      mockSupabaseAuth.onAuthStateChange.mockImplementationOnce(() => {
        throw new Error('Subscription failed');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithAuth(<TestComponent />);

      // Should still render without throwing
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      consoleSpy.mockRestore();
    });

    it('should handle session retrieval with invalid data', async () => {
      // Mock getSession to return invalid data
      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
    });
  });

  describe('Performance and Optimization', () => {
    it('should not trigger unnecessary re-renders', async () => {
      const renderSpy = vi.fn();

      const SpyComponent = () => {
        renderSpy();
        return <TestComponent />;
      };

      renderWithAuth(<SpyComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });

      const initialRenderCount = renderSpy.mock.calls.length;

      // Trigger auth state change
      act(() => {
        mockSupabaseAuth.triggerAuthStateChange('TOKEN_REFRESHED', createMockSession(createMockUser()));
      });

      // Should not trigger additional render beyond the necessary ones
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(renderSpy.mock.calls.length).toBeLessThan(initialRenderCount + 3);
    });
  });
});