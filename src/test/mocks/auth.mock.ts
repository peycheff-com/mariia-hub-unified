import { vi } from 'vitest';
import { User, Session, AuthError } from '@supabase/supabase-js';

// ==================== MOCK USER FACTORIES ====================

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'mock-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  updated_at: '2024-01-01T00:00:00Z',
  user_metadata: {
    full_name: 'Test User',
    role: 'user',
    ...overrides.user_metadata,
  },
  app_metadata: {},
  phone: '',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockAdminUser = (overrides: Partial<User> = {}): User => ({
  ...createMockUser(),
  id: 'mock-admin-id',
  email: 'admin@example.com',
  user_metadata: {
    full_name: 'Admin User',
    role: 'admin',
    ...overrides.user_metadata,
  },
  ...overrides,
});

export const createMockSession = (user?: User, overrides: Partial<Session> = {}): Session => ({
  user: user || createMockUser(),
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600 * 1000,
  token_type: 'bearer',
  ...overrides,
});

// ==================== MOCK AUTH ERRORS ====================

export const createMockAuthError = (message: string, name: string = 'AuthApiError'): AuthError => ({
  message,
  name,
  status: 400,
});

export const mockAuthErrors = {
  invalidCredentials: createMockAuthError('Invalid login credentials', 'AuthApiError'),
  emailNotConfirmed: createMockAuthError('Email not confirmed', 'AuthApiError'),
  weakPassword: createMockAuthError('Password should be at least 6 characters', 'AuthApiError'),
  emailAlreadyExists: createMockAuthError('User already registered', 'AuthApiError'),
  sessionNotFound: createMockAuthError('Session not found', 'AuthApiError'),
  networkError: createMockAuthError('Network error', 'AuthRetryableError'),
  unknownError: createMockAuthError('An unknown error occurred', 'AuthUnknownError'),
};

// ==================== SUPABASE AUTH MOCK ====================

export const createSupabaseAuthMock = () => {
  let mockUser: User | null = null;
  let mockSession: Session | null = null;
  let mockError: AuthError | null = null;
  const authStateCallbacks: Array<(event: string, session: Session | null) => void> = [];

  return {
    // State management
    setMockUser: (user: User | null) => {
      mockUser = user;
      mockSession = user ? createMockSession(user) : null;
    },
    setMockError: (error: AuthError | null) => {
      mockError = error;
    },
    clearMockState: () => {
      mockUser = null;
      mockSession = null;
      mockError = null;
    },

    // Auth methods
    getSession: vi.fn().mockResolvedValue({
      data: { session: mockSession },
      error: mockError,
    }),

    getUser: vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: mockError,
    }),

    signInWithPassword: vi.fn().mockImplementation(({ email, password }) => {
      if (email === 'test@example.com' && password === 'password123') {
        mockUser = createMockUser({ email });
        mockSession = createMockSession(mockUser);
        return Promise.resolve({
          data: { user: mockUser, session: mockSession },
          error: null,
        });
      } else if (email === 'admin@example.com' && password === 'admin123') {
        mockUser = createMockAdminUser({ email });
        mockSession = createMockSession(mockUser);
        return Promise.resolve({
          data: { user: mockUser, session: mockSession },
          error: null,
        });
      } else {
        return Promise.resolve({
          data: { user: null, session: null },
          error: mockAuthErrors.invalidCredentials,
        });
      }
    }),

    signUp: vi.fn().mockImplementation(({ email, password, options }) => {
      if (email === 'existing@example.com') {
        return Promise.resolve({
          data: { user: null, session: null },
          error: mockAuthErrors.emailAlreadyExists,
        });
      } else if (password.length < 6) {
        return Promise.resolve({
          data: { user: null, session: null },
          error: mockAuthErrors.weakPassword,
        });
      } else {
        const newUser = createMockUser({
          email,
          user_metadata: {
            full_name: options?.data?.full_name || 'New User',
          },
        });
        return Promise.resolve({
          data: { user: newUser, session: null }, // Email confirmation required
          error: null,
        });
      }
    }),

    signOut: vi.fn().mockResolvedValue({
      error: null,
    }),

    resetPasswordForEmail: vi.fn().mockImplementation((email) => {
      if (email === 'test@example.com') {
        return Promise.resolve({ error: null });
      } else {
        return Promise.resolve({
          error: createMockAuthError('User not found'),
        });
      }
    }),

    updateUser: vi.fn().mockImplementation((attributes) => {
      if (mockUser) {
        const updatedUser = {
          ...mockUser,
          user_metadata: {
            ...mockUser.user_metadata,
            ...attributes.data,
          },
        };
        mockUser = updatedUser;
        return Promise.resolve({ error: null });
      } else {
        return Promise.resolve({
          error: mockAuthErrors.sessionNotFound,
        });
      }
    }),

    signInWithOAuth: vi.fn().mockImplementation(({ provider }) => {
      return Promise.resolve({ error: null });
    }),

    onAuthStateChange: vi.fn().mockImplementation((callback) => {
      authStateCallbacks.push(callback);

      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    }),

    // Helper to trigger auth state changes in tests
    triggerAuthStateChange: (event: string, session: Session | null) => {
      authStateCallbacks.forEach(callback => callback(event, session));
    },

    // Get current state for test assertions
    getMockState: () => ({
      user: mockUser,
      session: mockSession,
      error: mockError,
    }),
  };
};

// ==================== MOCK DATABASE ROLES ====================

export const createSupabaseRolesMock = () => {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => {
            return Promise.resolve({
              data: { role: 'user' }, // Default role
              error: null,
            });
          }),
        }),
      }),
    }),
  };
};

// ==================== TEST HELPERS ====================

export const mockAuthTestUtils = {
  // Helper to set up auth state for tests
  setupAuthenticatedUser: (user?: User) => {
    const mockAuth = createSupabaseAuthMock();
    mockAuth.setMockUser(user || createMockUser());
    return mockAuth;
  },

  setupAuthenticatedAdmin: () => {
    const mockAuth = createSupabaseAuthMock();
    mockAuth.setMockUser(createMockAdminUser());
    return mockAuth;
  },

  setupUnauthenticatedUser: () => {
    const mockAuth = createSupabaseAuthMock();
    mockAuth.clearMockState();
    return mockAuth;
  },

  // Helper to wait for async operations
  waitForAuth: () => new Promise(resolve => setTimeout(resolve, 0)),

  // Helper to create mock navigation
  createMockNavigate: () => {
    const navigate = vi.fn();
    return { navigate };
  },

  // Helper to create mock toast
  createMockToast: () => {
    const toast = vi.fn();
    return { toast };
  },
};

// ==================== EXPORTS ====================

export const mockSupabaseAuth = createSupabaseAuthMock();
export const mockSupabaseRoles = createSupabaseRolesMock();
export { mockAuthTestUtils as default };