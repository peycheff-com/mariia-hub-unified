import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { render, screen, fireEvent, waitFor ,
  createMockService,
  createMockBooking,
  createMockUser,
  createLargeServiceDataset,
  createLargeBookingDataset,
  expectRenderPerformance,
} from '@/test/utils/workflow-test-utils';

// Mock admin dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin_user', role: 'admin' },
    loading: false,
  }),
}));

// Import admin components after mocking
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ServiceManager } from '@/components/admin/ServiceManager';
import { BookingManager } from '@/components/admin/BookingManager';
import { UserManager } from '@/components/admin/UserManager';


describe('Admin Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Admin Dashboard Workflow', () => {
    beforeEach(() => {
      // Mock admin data hooks
      vi.doMock('@/hooks/useAdminData', () => ({
        useAdminData: () => ({
          services: [
            createMockService({ id: 'svc_1', name: 'Lip Blush', category: 'beauty' }),
            createMockService({ id: 'svc_2', name: 'Glutes Program', category: 'fitness' }),
            createMockService({ id: 'svc_3', name: 'Brow Lamination', category: 'beauty' }),
          ],
          bookings: [
            createMockBooking({ id: 'booking_1', status: 'confirmed' }),
            createMockBooking({ id: 'booking_2', status: 'pending' }),
            createMockBooking({ id: 'booking_3', status: 'completed' }),
          ],
          users: [
            createMockUser({ id: 'user_1', role: 'client' }),
            createMockUser({ id: 'user_2', role: 'admin' }),
          ],
          analytics: {
            totalRevenue: 15000,
            totalBookings: 150,
            conversionRate: 0.12,
            monthlyGrowth: 0.08,
          },
          loading: false,
          error: null,
        }),
      }));
    });

    it('renders admin dashboard with complete overview', async () => {
      const renderTime = await expectRenderPerformance(<AdminDashboard />, 300);

      expect(renderTime).toBeLessThan(300);

      // Verify dashboard sections
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Total Bookings')).toBeInTheDocument();
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument();

      // Verify data values
      expect(screen.getByText('15000 PLN')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('12%')).toBeInTheDocument();
    });

    it('allows navigation between admin sections', async () => {
      render(<AdminDashboard />);

      // Navigate to services
      const servicesTab = screen.getByText('Services');
      fireEvent.click(servicesTab);

      await waitFor(() => {
        expect(screen.getByText('Service Management')).toBeInTheDocument();
      });

      // Navigate to bookings
      const bookingsTab = screen.getByText('Bookings');
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(screen.getByText('Booking Management')).toBeInTheDocument();
      });

      // Navigate to users
      const usersTab = screen.getByText('Users');
      fireEvent.click(usersTab);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    it('handles dashboard data filtering', async () => {
      render(<AdminDashboard />);

      // Test date range filtering
      const dateRangeFilter = screen.getByLabelText(/date range/i);
      fireEvent.change(dateRangeFilter, { target: { value: 'last-30-days' } });

      await waitFor(() => {
        expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      });

      // Test status filtering
      const statusFilter = screen.getByLabelText(/booking status/i);
      fireEvent.change(statusFilter, { target: { value: 'confirmed' } });

      await waitFor(() => {
        expect(screen.getByText(/confirmed bookings/i)).toBeInTheDocument();
      });
    });

    it('displays real-time analytics updates', async () => {
      render(<AdminDashboard />);

      // Initial analytics
      expect(screen.getByText('15000 PLN')).toBeInTheDocument();

      // Mock analytics update
      vi.doMock('@/hooks/useAdminData', () => ({
        useAdminData: () => ({
          services: [],
          bookings: [],
          users: [],
          analytics: {
            totalRevenue: 16000, // Updated revenue
            totalBookings: 152,
            conversionRate: 0.13,
            monthlyGrowth: 0.09,
          },
          loading: false,
          error: null,
        }),
      }));

      // Trigger refresh
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('16000 PLN')).toBeInTheDocument();
      });
    });
  });

  describe('Service Management Workflow', () => {
    const mockServices = [
      createMockService({ id: 'svc_1', name: 'Lip Blush', price_pln: 800 }),
      createMockService({ id: 'svc_2', name: 'Brow Lamination', price_pln: 400 }),
      createMockService({ id: 'svc_3', name: 'Lash Lift', price_pln: 350 }),
    ];

    beforeEach(() => {
      vi.doMock('@/hooks/useServices', () => ({
        useServices: () => ({
          services: mockServices,
          loading: false,
          error: null,
        }),
      }));
    });

    it('manages complete service lifecycle', async () => {
      const mockSupabase = vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: mockServices,
                error: null,
              })),
            })),
            insert: vi.fn(() => Promise.resolve({
              data: { id: 'svc_new', ...mockServices[0] },
              error: null,
            })),
            update: vi.fn(() => Promise.resolve({
              data: { ...mockServices[0], name: 'Updated Service Name' },
              error: null,
            })),
            delete: vi.fn(() => Promise.resolve({
              data: null,
              error: null,
            })),
          })),
        },
      }));

      render(<ServiceManager />);

      // Create new service
      const addServiceButton = screen.getByText('Add New Service');
      fireEvent.click(addServiceButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Service')).toBeInTheDocument();
      });

      // Fill service form
      const nameInput = screen.getByLabelText(/service name/i);
      const priceInput = screen.getByLabelText(/price/i);
      const durationInput = screen.getByLabelText(/duration/i);

      fireEvent.change(nameInput, { target: { value: 'New Test Service' } });
      fireEvent.change(priceInput, { target: { value: '500' } });
      fireEvent.change(durationInput, { target: { value: '90' } });

      // Submit form
      const submitButton = screen.getByText('Create Service');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Service created successfully')).toBeInTheDocument();
      });

      // Edit existing service
      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Service')).toBeInTheDocument();
      });

      const editNameInput = screen.getByDisplayValue(mockServices[0].name);
      fireEvent.change(editNameInput, { target: { value: 'Updated Service Name' } });

      const updateButton = screen.getByText('Update Service');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText('Service updated successfully')).toBeInTheDocument();
      });

      // Delete service
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText('Confirm Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Service deleted successfully')).toBeInTheDocument();
      });
    });

    it('handles bulk service operations', async () => {
      const largeServiceList = createLargeServiceDataset(50);

      vi.doMock('@/hooks/useServices', () => ({
        useServices: () => ({
          services: largeServiceList,
          loading: false,
          error: null,
        }),
      }));

      render(<ServiceManager />);

      // Select multiple services
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.slice(0, 3).forEach(checkbox => {
        fireEvent.click(checkbox);
      });

      // Bulk operations should be available
      expect(screen.getByText('Bulk Actions')).toBeInTheDocument();

      // Test bulk update
      const bulkUpdateButton = screen.getByText('Update Selected');
      fireEvent.click(bulkUpdateButton);

      await waitFor(() => {
        expect(screen.getByText('Bulk Update Services')).toBeInTheDocument();
      });

      // Update prices for selected services
      const bulkPriceInput = screen.getByLabelText(/new price/i);
      fireEvent.change(bulkPriceInput, { target: { value: '600' } });

      const applyButton = screen.getByText('Apply Changes');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('3 services updated successfully')).toBeInTheDocument();
      });
    });

    it('manages service categories and tags', async () => {
      render(<ServiceManager />);

      // Test category filtering
      const categoryFilter = screen.getByLabelText(/category/i);
      fireEvent.change(categoryFilter, { target: { value: 'beauty' } });

      await waitFor(() => {
        expect(screen.getByText('Beauty Services')).toBeInTheDocument();
      });

      // Test tag management
      const manageTagsButton = screen.getByText('Manage Tags');
      fireEvent.click(manageTagsButton);

      await waitFor(() => {
        expect(screen.getByText('Service Tags')).toBeInTheDocument();
      });

      // Add new tag
      const tagInput = screen.getByPlaceholderText(/add new tag/i);
      fireEvent.change(tagInput, { target: { value: 'Premium' } });

      const addTagButton = screen.getByText('Add Tag');
      fireEvent.click(addTagButton);

      await waitFor(() => {
        expect(screen.getByText('Premium')).toBeInTheDocument();
      });
    });
  });

  describe('Booking Management Workflow', () => {
    const mockBookings = [
      createMockBooking({ id: 'booking_1', status: 'confirmed' }),
      createMockBooking({ id: 'booking_2', status: 'pending' }),
      createMockBooking({ id: 'booking_3', status: 'cancelled' }),
    ];

    beforeEach(() => {
      vi.doMock('@/hooks/useBookings', () => ({
        useBookings: () => ({
          bookings: mockBookings,
          loading: false,
          error: null,
        }),
      }));
    });

    it('manages booking statuses efficiently', async () => {
      const mockSupabase = vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: vi.fn(() => ({
            update: vi.fn(() => Promise.resolve({
              data: { ...mockBookings[1], status: 'confirmed' },
              error: null,
            })),
          })),
        },
      }));

      render(<BookingManager />);

      // Filter pending bookings
      const statusFilter = screen.getByLabelText(/booking status/i);
      fireEvent.change(statusFilter, { target: { value: 'pending' } });

      await waitFor(() => {
        expect(screen.getByText('Pending Bookings')).toBeInTheDocument();
      });

      // Confirm pending booking
      const confirmButton = screen.getByText('Confirm Booking');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Booking confirmed successfully')).toBeInTheDocument();
      });

      // Booking should move to confirmed status
      await waitFor(() => {
        expect(screen.getByText('Confirmed Bookings')).toBeInTheDocument();
      });
    });

    it('handles booking modifications and rescheduling', async () => {
      render(<BookingManager />);

      // Select booking to modify
      const modifyButton = screen.getAllByText('Modify')[0];
      fireEvent.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByText('Modify Booking')).toBeInTheDocument();
      });

      // Change time slot
      const newTimeSlot = screen.getByText('14:00');
      fireEvent.click(newTimeSlot);

      const saveChangesButton = screen.getByText('Save Changes');
      fireEvent.click(saveChangesButton);

      await waitFor(() => {
        expect(screen.getByText('Booking updated successfully')).toBeInTheDocument();
      });
    });

    it('processes refunds and cancellations', async () => {
      vi.doMock('@/lib/stripe', () => ({
        refundPayment: vi.fn(() => Promise.resolve({
          id: 'refund_123',
          amount: 80000, // 800 PLN in cents
        })),
      }));

      render(<BookingManager />);

      // Cancel confirmed booking
      const cancelButton = screen.getAllByText('Cancel')[0];
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
      });

      // Process refund
      const refundCheckbox = screen.getByLabelText(/process refund/i);
      fireEvent.click(refundCheckbox);

      const confirmCancelButton = screen.getByText('Confirm Cancellation');
      fireEvent.click(confirmCancelButton);

      await waitFor(() => {
        expect(screen.getByText('Refund processed successfully')).toBeInTheDocument();
        expect(screen.getByText('Booking cancelled successfully')).toBeInTheDocument();
      });
    });

    it('exports booking data efficiently', async () => {
      const largeBookingList = createLargeBookingDataset(200);

      vi.doMock('@/hooks/useBookings', () => ({
        useBookings: () => ({
          bookings: largeBookingList,
          loading: false,
          error: null,
        }),
      }));

      render(<BookingManager />);

      // Export to CSV
      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Export successful')).toBeInTheDocument();
        expect(screen.getByText('200 bookings exported')).toBeInTheDocument();
      });

      // Export filtered data
      const dateFilter = screen.getByLabelText(/date range/i);
      fireEvent.change(dateFilter, { target: { value: 'last-7-days' } });

      const exportFilteredButton = screen.getByText('Export Filtered');
      fireEvent.click(exportFilteredButton);

      await waitFor(() => {
        expect(screen.getByText(/filtered bookings exported/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Management Workflow', () => {
    const mockUsers = [
      createMockUser({ id: 'user_1', role: 'client', email: 'client1@example.com' }),
      createMockUser({ id: 'user_2', role: 'admin', email: 'admin@example.com' }),
      createMockUser({ id: 'user_3', role: 'client', email: 'client2@example.com' }),
    ];

    beforeEach(() => {
      vi.doMock('@/hooks/useUsers', () => ({
        useUsers: () => ({
          users: mockUsers,
          loading: false,
          error: null,
        }),
      }));
    });

    it('manages user roles and permissions', async () => {
      const mockSupabase = vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: vi.fn(() => ({
            update: vi.fn(() => Promise.resolve({
              data: { ...mockUsers[0], role: 'admin' },
              error: null,
            })),
          })),
        },
      }));

      render(<UserManager />);

      // Change user role
      const roleButton = screen.getAllByText('Change Role')[0];
      fireEvent.click(roleButton);

      await waitFor(() => {
        expect(screen.getByText('Change User Role')).toBeInTheDocument();
      });

      const roleSelect = screen.getByLabelText(/select role/i);
      fireEvent.change(roleSelect, { target: { value: 'admin' } });

      const confirmButton = screen.getByText('Update Role');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('User role updated successfully')).toBeInTheDocument();
      });
    });

    it('handles user account management', async () => {
      render(<UserManager />);

      // Suspend user
      const suspendButton = screen.getAllByText('Suspend')[0];
      fireEvent.click(suspendButton);

      await waitFor(() => {
        expect(screen.getByText('Suspend User Account')).toBeInTheDocument();
      });

      const reasonInput = screen.getByLabelText(/reason for suspension/i);
      fireEvent.change(reasonInput, { target: { value: 'Policy violation' } });

      const confirmSuspendButton = screen.getByText('Confirm Suspension');
      fireEvent.click(confirmSuspendButton);

      await waitFor(() => {
        expect(screen.getByText('User suspended successfully')).toBeInTheDocument();
      });

      // Reactivate user
      const reactivateButton = screen.getAllByText('Reactivate')[0];
      fireEvent.click(reactivateButton);

      await waitFor(() => {
        expect(screen.getByText('User reactivated successfully')).toBeInTheDocument();
      });
    });

    it('manages user communication and notification aria-live="polite" aria-atomic="true"s', async () => {
      vi.doMock('@/services/emailService', () => ({
        sendBulkEmail: vi.fn(() => Promise.resolve({
          sent: 3,
          failed: 0,
        })),
      }));

      render(<UserManager />);

      // Send bulk notification aria-live="polite" aria-atomic="true"
      const selectAllCheckbox = screen.getByLabelText(/select all users/i);
      fireEvent.click(selectAllCheckbox);

      const notifyButton = screen.getByText('Send Notification');
      fireEvent.click(notifyButton);

      await waitFor(() => {
        expect(screen.getByText('Send Notification to Users')).toBeInTheDocument();
      });

      const messageInput = screen.getByLabelText(/message/i);
      fireEvent.change(messageInput, {
        target: { value: 'Special offer: 20% off all services this week!' }
      });

      const sendNotificationButton = screen.getByText('Send to Selected Users');
      fireEvent.click(sendNotificationButton);

      await waitFor(() => {
        expect(screen.getByText('Notification sent to 3 users')).toBeInTheDocument();
      });
    });
  });

  describe('Admin Security and Permissions', () => {
    it('enforces role-based access control', async () => {
      // Mock non-admin user
      vi.doMock('@/hooks/useAuth', () => ({
        useAuth: () => ({
          user: { id: 'regular_user', role: 'client' },
          loading: false,
        }),
      }));

      render(<AdminDashboard />);

      // Should redirect or show access denied
      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
        expect(screen.getByText('Admin access required')).toBeInTheDocument();
      });
    });

    it('logs admin activities for audit trail', async () => {
      const mockLogActivity = vi.fn();

      vi.doMock('@/hooks/useAdminActivity', () => ({
        logAdminActivity: mockLogActivity,
      }));

      render(<ServiceManager />);

      // Perform admin action
      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Service')).toBeInTheDocument();
      });

      // Activity should be logged
      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'service_edit_started',
          userId: 'admin_user',
        })
      );
    });

    it('handles session timeouts gracefully', async () => {
      // Mock session expiration
      vi.doMock('@/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          loading: false,
          error: new Error('Session expired'),
        }),
      }));

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Session Expired')).toBeInTheDocument();
        expect(screen.getByText('Please log in again')).toBeInTheDocument();
      });

      const loginButton = screen.getByText('Log In');
      fireEvent.click(loginButton);

      expect(window.location.pathname).toBe('/login');
    });
  });
});