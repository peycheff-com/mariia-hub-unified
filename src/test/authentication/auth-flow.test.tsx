import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@/test/utils/test-utilities';
import { QueryClient } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { createExtendedProfile } from '@/test/factories/extended-factories';
import { AuthService } from '@/services/auth.service';

// Mock Supabase auth
const mockSupabaseAuth = {
  getUser: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  refreshSession: vi.fn(),
};

const mockSupabase = {
  auth: mockSupabaseAuth,
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('Authentication & Authorization Flow', () => {
  let queryClient: QueryClient;
  let mockAuthService: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    // Mock auth service
    mockAuthService = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updateProfile: vi.fn(),
      refreshToken: vi.fn(),
      deleteAccount: vi.fn(),
    };

    vi.spyOn(AuthService.prototype, 'constructor').mockImplementation(() => mockAuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Flow', () => {
    test('should render login form', async () => {
      const TestComponent = () => {
        const { user, login, isLoading } = useAuth();

        if (isLoading) return <div>Loading...</div>;
        if (user) return <div>Logged in as {user.email}</div>;

        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            login({
              email: formData.get('email') as string,
              password: formData.get('password') as string,
            });
          }}>
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit">Login</button>
          </form>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });

    test('should handle successful login', async () => {
      const mockUser = createExtendedProfile({
        id: 'user-123',
        email: 'test@example.com',
        role: 'client',
      });

      mockAuthService.signIn.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token-123' } },
        error: null,
      });
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const TestComponent = () => {
        const { user, login } = useAuth();

        const handleLogin = async () => {
          await login({
            email: 'test@example.com',
            password: 'password123',
          });
        };

        if (user) return <div>Logged in as {user.email}</div>;

        return (
          <div>
            <button onClick={handleLogin}>Login</button>
            <div data-testid="auth-status">Not logged in</div>
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByRole('button', { name: 'Login' });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Logged in as test@example.com')).toBeInTheDocument();
      });
    });

    test('should handle login failure', async () => {
      mockAuthService.signIn.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const TestComponent = () => {
        const { user, login, error } = useAuth();

        const handleLogin = async () => {
          await login({
            email: 'test@example.com',
            password: 'wrongpassword',
          });
        };

        if (user) return <div>Logged in</div>;

        return (
          <div>
            <button onClick={handleLogin}>Login</button>
            {error && <div data-testid="error-message">{error.message}</div>}
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByRole('button', { name: 'Login' });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
      });
    });

    test('should validate login form inputs', async () => {
      const TestComponent = () => {
        const { login, errors } = useAuth();

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const email = formData.get('email') as string;
          const password = formData.get('password') as string;

          // Validation
          const newErrors: any = {};
          if (!email) newErrors.email = 'Email is required';
          if (!password) newErrors.password = 'Password is required';
          if (password && password.length < 6) newErrors.password = 'Password must be at least 6 characters';

          if (Object.keys(newErrors).length > 0) {
            // Set errors (this would be handled by the auth context)
            return;
          }

          login({ email, password });
        };

        return (
          <form onSubmit={handleSubmit}>
            <input name="email" type="email" placeholder="Email" />
            {errors.email && <div data-testid="email-error">{errors.email}</div>}
            <input name="password" type="password" placeholder="Password" />
            {errors.password && <div data-testid="password-error">{errors.password}</div>}
            <button type="submit">Login</button>
          </form>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const submitButton = screen.getByRole('button', { name: 'Login' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
      });
    });

    test('should show loading state during login', async () => {
      mockAuthService.signIn.mockImplementation(() =>
        new Promise(resolve => setTimeout(() =>
          resolve({ data: { user: null }, error: null }), 1000
        ))
      );

      const TestComponent = () => {
        const { user, login, isLoading } = useAuth();

        const handleLogin = async () => {
          await login({
            email: 'test@example.com',
            password: 'password123',
          });
        };

        if (isLoading) return <div data-testid="loading">Logging in...</div>;
        if (user) return <div>Logged in</div>;

        return <button onClick={handleLogin}>Login</button>;
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByRole('button', { name: 'Login' });
      fireEvent.click(loginButton);

      expect(screen.getByTestId('loading')).toHaveTextContent('Logging in...');
    });
  });

  describe('Registration Flow', () => {
    test('should render registration form', async () => {
      const TestComponent = () => {
        const { register } = useAuth();

        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            register({
              email: formData.get('email') as string,
              password: formData.get('password') as string,
              firstName: formData.get('firstName') as string,
              lastName: formData.get('lastName') as string,
            });
          }}>
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <input name="firstName" type="text" placeholder="First Name" required />
            <input name="lastName" type="text" placeholder="Last Name" required />
            <button type="submit">Register</button>
          </form>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    });

    test('should handle successful registration', async () => {
      const mockUser = createExtendedProfile({
        id: 'user-123',
        email: 'newuser@example.com',
        role: 'client',
      });

      mockAuthService.signUp.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token-123' } },
        error: null,
      });

      const TestComponent = () => {
        const { user, register } = useAuth();

        const handleRegister = async () => {
          await register({
            email: 'newuser@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
          });
        };

        if (user) return <div>Registered as {user.email}</div>;

        return <button onClick={handleRegister}>Register</button>;
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const registerButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(mockAuthService.signUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Registered as newuser@example.com')).toBeInTheDocument();
      });
    });

    test('should handle registration with email verification', async () => {
      mockAuthService.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const TestComponent = () => {
        const { user, register, message } = useAuth();

        const handleRegister = async () => {
          await register({
            email: 'newuser@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
          });
        };

        if (user) return <div>Logged in</div>;

        return (
          <div>
            <button onClick={handleRegister}>Register</button>
            {message && <div data-testid="message">{message}</div>}
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const registerButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByTestId('message')).toHaveTextContent(
          'Please check your email to verify your account'
        );
      });
    });

    test('should handle registration failure due to existing email', async () => {
      mockAuthService.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' },
      });

      const TestComponent = () => {
        const { user, register, error } = useAuth();

        const handleRegister = async () => {
          await register({
            email: 'existing@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
          });
        };

        if (user) return <div>Logged in</div>;

        return (
          <div>
            <button onClick={handleRegister}>Register</button>
            {error && <div data-testid="error">{error.message}</div>}
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const registerButton = screen.getByRole('button', { name: 'Register' });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('User already registered');
      });
    });
  });

  describe('Password Reset Flow', () => {
    test('should handle password reset request', async () => {
      mockAuthService.resetPassword.mockResolvedValue({
        data: null,
        error: null,
      });

      const TestComponent = () => {
        const { resetPassword, message } = useAuth();

        const handleReset = async () => {
          await resetPassword('test@example.com');
        };

        return (
          <div>
            <button onClick={handleReset}>Reset Password</button>
            {message && <div data-testid="reset-message">{message}</div>}
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const resetButton = screen.getByRole('button', { name: 'Reset Password' });
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(mockAuthService.resetPassword).toHaveBeenCalledWith('test@example.com');
      });

      await waitFor(() => {
        expect(screen.getByTestId('reset-message')).toHaveTextContent(
          'Password reset email sent'
        );
      });
    });

    test('should handle password reset failure', async () => {
      mockAuthService.resetPassword.mockResolvedValue({
        data: null,
        error: { message: 'Email not found' },
      });

      const TestComponent = () => {
        const { resetPassword, error } = useAuth();

        const handleReset = async () => {
          await resetPassword('nonexistent@example.com');
        };

        return (
          <div>
            <button onClick={handleReset}>Reset Password</button>
            {error && <div data-testid="reset-error">{error.message}</div>}
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const resetButton = screen.getByRole('button', { name: 'Reset Password' });
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByTestId('reset-error')).toHaveTextContent('Email not found');
      });
    });
  });

  describe('Session Management', () => {
    test('should handle user session persistence', async () => {
      const mockUser = createExtendedProfile({
        id: 'user-123',
        email: 'test@example.com',
      });

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const TestComponent = () => {
        const { user, isLoading } = useAuth();

        if (isLoading) return <div>Loading...</div>;
        if (user) return <div data-testid="user-email">{user.email}</div>;
        return <div>Not logged in</div>;
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });

    test('should handle session refresh', async () => {
      const mockUser = createExtendedProfile({ id: 'user-123' });
      const newToken = 'new-access-token';

      mockAuthService.refreshToken.mockResolvedValue({
        data: { session: { access_token: newToken, user: mockUser } },
        error: null,
      });

      const TestComponent = () => {
        const { refreshSession } = useAuth();

        return <button onClick={() => refreshSession()}>Refresh Session</button>;
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const refreshButton = screen.getByRole('button', { name: 'Refresh Session' });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockAuthService.refreshToken).toHaveBeenCalled();
      });
    });

    test('should handle logout', async () => {
      const mockUser = createExtendedProfile({ id: 'user-123' });

      mockAuthService.signOut.mockResolvedValue({
        data: null,
        error: null,
      });
      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      }).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const TestComponent = () => {
        const { user, logout } = useAuth();

        if (user) {
          return (
            <div>
              <div data-testid="user-email">{user.email}</div>
              <button onClick={() => logout()}>Logout</button>
            </div>
          );
        }
        return <div>Not logged in</div>;
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole('button', { name: 'Logout' });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockAuthService.signOut).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Not logged in')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    test('should provide role information', async () => {
      const mockUser = createExtendedProfile({
        id: 'admin-123',
        role: 'admin',
        permissions: ['read:all', 'write:all', 'delete:all'],
      });

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const TestComponent = () => {
        const { user, hasRole, hasPermission } = useAuth();

        if (!user) return <div>Loading...</div>;

        return (
          <div>
            <div data-testid="user-role">{user.role}</div>
            <div data-testid="is-admin">{hasRole('admin').toString()}</div>
            <div data-testid="can-write-all">{hasPermission('write:all').toString()}</div>
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
        expect(screen.getByTestId('can-write-all')).toHaveTextContent('true');
      });
    });

    test('should handle permission checks for different roles', async () => {
      const mockClient = createExtendedProfile({
        id: 'client-123',
        role: 'client',
        permissions: ['read:own', 'write:own'],
      });

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockClient },
        error: null,
      });

      const TestComponent = () => {
        const { user, hasRole, hasPermission } = useAuth();

        if (!user) return <div>Loading...</div>;

        return (
          <div>
            <div data-testid="user-role">{user.role}</div>
            <div data-testid="is-admin">{hasRole('admin').toString()}</div>
            <div data-testid="is-client">{hasRole('client').toString()}</div>
            <div data-testid="can-write-all">{hasPermission('write:all').toString()}</div>
            <div data-testid="can-write-own">{hasPermission('write:own').toString()}</div>
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('client');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
        expect(screen.getByTestId('is-client')).toHaveTextContent('true');
        expect(screen.getByTestId('can-write-all')).toHaveTextContent('false');
        expect(screen.getByTestId('can-write-own')).toHaveTextContent('true');
      });
    });
  });

  describe('Profile Management', () => {
    test('should handle profile update', async () => {
      const mockUser = createExtendedProfile({
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      });

      mockAuthService.updateProfile.mockResolvedValue({
        data: { user: { ...mockUser, first_name: 'Jane' } },
        error: null,
      });

      const TestComponent = () => {
        const { user, updateProfile } = useAuth();

        const handleUpdate = async () => {
          await updateProfile({ first_name: 'Jane' });
        };

        return (
          <div>
            <div data-testid="user-name">{user?.first_name}</div>
            <button onClick={handleUpdate}>Update Name</button>
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('John');
      });

      const updateButton = screen.getByRole('button', { name: 'Update Name' });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockAuthService.updateProfile).toHaveBeenCalledWith({ first_name: 'Jane' });
      });
    });

    test('should handle profile update failure', async () => {
      const mockUser = createExtendedProfile({ id: 'user-123' });

      mockAuthService.updateProfile.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const TestComponent = () => {
        const { updateProfile, error } = useAuth();

        const handleUpdate = async () => {
          await updateProfile({ invalid_field: 'value' });
        };

        return (
          <div>
            <button onClick={handleUpdate}>Update Profile</button>
            {error && <div data-testid="update-error">{error.message}</div>}
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const updateButton = screen.getByRole('button', { name: 'Update Profile' });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByTestId('update-error')).toHaveTextContent('Update failed');
      });
    });
  });

  describe('Account Deletion', () => {
    test('should handle account deletion with confirmation', async () => {
      const mockUser = createExtendedProfile({ id: 'user-123' });

      mockAuthService.deleteAccount.mockResolvedValue({
        data: null,
        error: null,
      });
      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      }).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const TestComponent = () => {
        const { user, deleteAccount } = useAuth();
        const [showConfirm, setShowConfirm] = React.useState(false);

        const handleDelete = async () => {
          await deleteAccount();
        };

        if (!user) return <div>Account deleted</div>;

        return (
          <div>
            <button onClick={() => setShowConfirm(true)}>Delete Account</button>
            {showConfirm && (
              <div>
                <p>Are you sure you want to delete your account?</p>
                <button onClick={handleDelete}>Confirm Delete</button>
                <button onClick={() => setShowConfirm(false)}>Cancel</button>
              </div>
            )}
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: 'Confirm Delete' });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockAuthService.deleteAccount).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Account deleted')).toBeInTheDocument();
      });
    });

    test('should handle account deletion failure', async () => {
      const mockUser = createExtendedProfile({ id: 'user-123' });

      mockAuthService.deleteAccount.mockResolvedValue({
        data: null,
        error: { message: 'Cannot delete account with active bookings' },
      });

      const TestComponent = () => {
        const { deleteAccount, error } = useAuth();

        const handleDelete = async () => {
          await deleteAccount();
        };

        return (
          <div>
            <button onClick={handleDelete}>Delete Account</button>
            {error && <div data-testid="delete-error">{error.message}</div>}
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('delete-error')).toHaveTextContent(
          'Cannot delete account with active bookings'
        );
      });
    });
  });

  describe('Security Features', () => {
    test('should handle session timeout', async () => {
      vi.useFakeTimers();

      const mockUser = createExtendedProfile({ id: 'user-123' });

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const TestComponent = () => {
        const { user, sessionExpired } = useAuth();

        if (sessionExpired) return <div data-testid="session-expired">Session expired</div>;
        if (user) return <div>Logged in</div>;
        return <div>Not logged in</div>;
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Fast-forward 30 minutes (session timeout)
      vi.advanceTimersByTime(30 * 60 * 1000);

      await waitFor(() => {
        expect(screen.getByTestId('session-expired')).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    test('should handle concurrent session detection', async () => {
      const mockUser = createExtendedProfile({ id: 'user-123' });

      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
        // Simulate concurrent session detected
        setTimeout(() => {
          callback('SIGNED_OUT', null);
        }, 100);
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      });

      const TestComponent = () => {
        const { user, concurrentSessionDetected } = useAuth();

        if (concurrentSessionDetected) {
          return <div data-testid="concurrent-session">Concurrent session detected</div>;
        }
        if (user) return <div>Logged in</div>;
        return <div>Not logged in</div>;
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('concurrent-session')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      mockAuthService.signIn.mockRejectedValue(new Error('Network error'));

      const TestComponent = () => {
        const { login, error } = useAuth();

        const handleLogin = async () => {
          await login({
            email: 'test@example.com',
            password: 'password123',
          });
        };

        return (
          <div>
            <button onClick={handleLogin}>Login</button>
            {error && <div data-testid="network-error">{error.message}</div>}
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByRole('button', { name: 'Login' });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('network-error')).toHaveTextContent('Network error');
      });
    });

    test('should handle rate limiting errors', async () => {
      mockAuthService.signIn.mockResolvedValue({
        data: null,
        error: { message: 'Too many login attempts', code: 'RATE_LIMIT_EXCEEDED' },
      });

      const TestComponent = () => {
        const { login, error } = useAuth();

        const handleLogin = async () => {
          await login({
            email: 'test@example.com',
            password: 'password123',
          });
        };

        return (
          <div>
            <button onClick={handleLogin}>Login</button>
            {error && <div data-testid="rate-limit-error">{error.message}</div>}
          </div>
        );
      };

      const { render } = await import('@/test/utils/test-utilities');
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByRole('button', { name: 'Login' });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('rate-limit-error')).toHaveTextContent('Too many login attempts');
      });
    });
  });
});