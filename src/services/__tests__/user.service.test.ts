/**
 * Comprehensive Test Suite for User Service
 *
 * Tests cover critical user management logic including:
 * - Profile management and updates
 * - Avatar upload functionality
 * - Favorites management
 * - Address management
 * - Notification handling
 * - Preference management
 * - User analytics
 * - GDPR compliance and data export
 * - Authentication and authorization
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { supabase } from '@/integrations/supabase/client';

import { userService } from '../userService';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            single: vi.fn(),
            limit: vi.fn(),
          })),
          limit: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
    rpc: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('UserService', () => {
  const service = userService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = userService;
      const instance2 = userService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Profile Management', () => {
    describe('getUserProfile', () => {
      it('should return user profile for authenticated user', async () => {
        const mockUser = { id: 'user-1' };
        const mockProfile = {
          id: 'user-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+48 123 456 789',
          notification_preferences: {
            email: true,
            sms: false,
          },
          addresses: [],
        };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
        });

        const result = await service.getUserProfile();

        expect(result).toEqual(mockProfile);
        expect(supabase.auth.getUser).toHaveBeenCalled();
        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(mockSelect).toHaveBeenCalledWith(`
          *,
          notification_preferences,
          addresses(id, label, address, is_default, created_at)
        `);
      });

      it('should throw error for unauthenticated user', async () => {
        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: null }
        });

        await expect(service.getUserProfile()).rejects.toThrow('User not authenticated');
      });

      it('should handle database errors gracefully', async () => {
        const mockUser = { id: 'user-1' };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Profile not found' }
          })
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
        });

        await expect(service.getUserProfile()).rejects.toThrow('Failed to fetch profile: Profile not found');
      });
    });

    describe('updateProfile', () => {
      it('should update user profile successfully', async () => {
        const mockUser = { id: 'user-1' };
        const updateData = {
          first_name: 'John Updated',
          last_name: 'Doe',
          email: 'john.updated@example.com',
          phone: '+48 987 654 321',
        };

        const updatedProfile = {
          id: 'user-1',
          ...updateData,
          updated_at: '2024-01-15T10:00:00Z',
        };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockUpdate = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null })
          })
        });

        (supabase.from as any).mockReturnValue({
          update: mockUpdate,
          eq: mockEq,
        });

        const result = await service.updateProfile(updateData as any);

        expect(result).toEqual(updatedProfile);
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            ...updateData,
            updated_at: expect.any(String),
          })
        );
        expect(mockEq).toHaveBeenCalledWith('id', mockUser.id);
      });

      it('should validate required fields', async () => {
        const invalidData = {
          first_name: '', // Invalid - empty
          email: 'invalid-email', // Invalid format
        };

        await expect(service.updateProfile(invalidData as any)).rejects.toThrow();
      });

      it('should handle update errors', async () => {
        const mockUser = { id: 'user-1' };
        const updateData = {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockUpdate = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Update failed' }
            })
          })
        });

        (supabase.from as any).mockReturnValue({
          update: mockUpdate,
          eq: mockEq,
        });

        await expect(service.updateProfile(updateData as any)).rejects.toThrow(
          'Failed to update profile: Update failed'
        );
      });
    });

    describe('uploadAvatar', () => {
      it('should upload avatar successfully', async () => {
        const mockUser = { id: 'user-1' };
        const mockFile = new File(['avatar data'], 'avatar.jpg', { type: 'image/jpeg' });
        const publicUrl = 'https://storage.example.com/avatars/user-1/avatar_123456789.jpg';

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockUpload = vi.fn().mockResolvedValue({
          data: { path: 'user-1/avatar_123456789.jpg' },
          error: null
        });

        const mockGetPublicUrl = vi.fn().mockReturnValue({
          data: { publicUrl },
        });

        const mockUpdate = vi.fn().mockReturnThis();

        (supabase.storage.from as any).mockReturnValue({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        });

        (supabase.from as any).mockReturnValue({
          update: mockUpdate,
          eq: vi.fn(),
        });

        const result = await service.uploadAvatar(mockFile);

        expect(result).toBe(publicUrl);
        expect(mockUpload).toHaveBeenCalledWith(
          expect.stringMatching(/user-1\/avatar_\d+\.jpg/),
          mockFile,
          { cacheControl: '3600', upsert: false }
        );
        expect(mockUpdate).toHaveBeenCalledWith({ avatar_url: publicUrl });
      });

      it('should handle upload errors', async () => {
        const mockUser = { id: 'user-1' };
        const mockFile = new File(['avatar data'], 'avatar.jpg', { type: 'image/jpeg' });

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockUpload = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upload failed' }
        });

        (supabase.storage.from as any).mockReturnValue({
          upload: mockUpload,
        });

        await expect(service.uploadAvatar(mockFile)).rejects.toThrow(
          'Failed to upload avatar: Upload failed'
        );
      });

      it('should throw error for unauthenticated user', async () => {
        const mockFile = new File(['avatar data'], 'avatar.jpg', { type: 'image/jpeg' });

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: null }
        });

        await expect(service.uploadAvatar(mockFile)).rejects.toThrow('User not authenticated');
      });
    });
  });

  describe('Favorites Management', () => {
    describe('getFavorites', () => {
      it('should return user favorites', async () => {
        const mockUser = { id: 'user-1' };
        const mockFavorites = [
          {
            id: 'fav-1',
            user_id: 'user-1',
            service_id: 'service-1',
            created_at: '2024-01-15T10:00:00Z',
            services: {
              id: 'service-1',
              title: 'Beauty Treatment',
              service_type: 'beauty',
              duration_minutes: 60,
              price_from: 200,
              image_url: 'https://example.com/image.jpg',
            },
          },
        ];

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockFavorites, error: null })
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          order: mockEq,
        });

        const result = await service.getFavorites();

        expect(result).toEqual(mockFavorites);
        expect(supabase.from).toHaveBeenCalledWith('user_favorites');
        expect(mockSelect).toHaveBeenCalledWith(`
          *,
          services(id, title, service_type, duration_minutes, price_from, image_url)
        `);
      });

      it('should return empty array for unauthenticated user', async () => {
        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: null }
        });

        const result = await service.getFavorites();

        expect(result).toEqual([]);
      });

      it('should handle database errors', async () => {
        const mockUser = { id: 'user-1' };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          order: mockEq,
        });

        await expect(service.getFavorites()).rejects.toThrow(
          'Failed to fetch favorites: Database error'
        );
      });
    });

    describe('addToFavorites', () => {
      it('should add service to favorites successfully', async () => {
        const mockUser = { id: 'user-1' };
        const serviceId = 'service-1';
        const notes = 'Great service!';

        const mockFavorite = {
          id: 'fav-1',
          user_id: 'user-1',
          service_id: serviceId,
          notes,
          created_at: '2024-01-15T10:00:00Z',
          services: {
            id: serviceId,
            title: 'Beauty Treatment',
            service_type: 'beauty',
            duration_minutes: 60,
            price_from: 200,
            image_url: 'https://example.com/image.jpg',
          },
        };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFavorite, error: null })
          })
        });

        (supabase.from as any).mockReturnValue({
          insert: mockInsert,
        });

        const result = await service.addToFavorites(serviceId, notes);

        expect(result).toEqual(mockFavorite);
        expect(mockInsert).toHaveBeenCalledWith({
          user_id: mockUser.id,
          service_id: serviceId,
          notes,
          created_at: expect.any(String),
        });
      });

      it('should handle favorite creation errors', async () => {
        const mockUser = { id: 'user-1' };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Service already favorited' }
            })
          })
        });

        (supabase.from as any).mockReturnValue({
          insert: mockInsert,
        });

        await expect(service.addToFavorites('service-1')).rejects.toThrow(
          'Failed to add to favorites: Service already favorited'
        );
      });
    });

    describe('removeFromFavorites', () => {
      it('should remove service from favorites successfully', async () => {
        const favoriteId = 'fav-1';

        const mockDelete = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        });

        (supabase.from as any).mockReturnValue({
          delete: mockDelete,
        });

        await expect(service.removeFromFavorites(favoriteId)).resolves.not.toThrow();

        expect(mockDelete).toHaveBeenCalled();
        expect(mockDelete().eq).toHaveBeenCalledWith('id', favoriteId);
      });

      it('should handle removal errors', async () => {
        const favoriteId = 'fav-1';

        const mockDelete = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Favorite not found' }
          })
        });

        (supabase.from as any).mockReturnValue({
          delete: mockDelete,
        });

        await expect(service.removeFromFavorites(favoriteId)).rejects.toThrow(
          'Failed to remove from favorites: Favorite not found'
        );
      });
    });
  });

  describe('Address Management', () => {
    describe('getAddresses', () => {
      it('should return user addresses', async () => {
        const mockUser = { id: 'user-1' };
        const mockAddresses = [
          {
            id: 'addr-1',
            user_id: 'user-1',
            label: 'home',
            address: {
              street: 'Main St 123',
              city: 'Warsaw',
              postal_code: '00-001',
              country: 'Poland',
            },
            is_default: true,
            created_at: '2024-01-15T10:00:00Z',
          },
        ];

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockAddresses, error: null })
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          order: mockEq,
        });

        const result = await service.getAddresses();

        expect(result).toEqual(mockAddresses);
        expect(supabase.from).toHaveBeenCalledWith('user_addresses');
      });

      it('should return empty array for unauthenticated user', async () => {
        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: null }
        });

        const result = await service.getAddresses();

        expect(result).toEqual([]);
      });
    });

    describe('upsertAddress', () => {
      it('should create or update address successfully', async () => {
        const mockUser = { id: 'user-1' };
        const addressData = {
          label: 'home' as const,
          address: {
            street: 'Main St 123',
            city: 'Warsaw',
            postal_code: '00-001',
            country: 'Poland',
          },
          is_default: true,
        };

        const mockAddress = {
          id: 'addr-1',
          user_id: 'user-1',
          ...addressData,
          updated_at: '2024-01-15T10:00:00Z',
        };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockUpsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockAddress, error: null })
          })
        });

        (supabase.from as any).mockReturnValue({
          upsert: mockUpsert,
        });

        const result = await service.upsertAddress(addressData as any);

        expect(result).toEqual(mockAddress);
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: mockUser.id,
            ...addressData,
            updated_at: expect.any(String),
          })
        );
      });

      it('should validate address data', async () => {
        const invalidAddress = {
          label: 'invalid', // Not in enum
          address: {
            street: '', // Invalid - empty
            city: 'Warsaw',
            postal_code: '1', // Too short
          },
          is_default: true,
        };

        await expect(service.upsertAddress(invalidAddress as any)).rejects.toThrow();
      });
    });

    describe('deleteAddress', () => {
      it('should delete address successfully', async () => {
        const addressId = 'addr-1';

        const mockDelete = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        });

        (supabase.from as any).mockReturnValue({
          delete: mockDelete,
        });

        await expect(service.deleteAddress(addressId)).resolves.not.toThrow();

        expect(mockDelete).toHaveBeenCalled();
        expect(mockDelete().eq).toHaveBeenCalledWith('id', addressId);
      });
    });
  });

  describe('Notification Management', () => {
    describe('getNotifications', () => {
      it('should return user notifications', async () => {
        const mockUser = { id: 'user-1' };
        const mockNotifications = [
          {
            id: 'notif-1',
            user_id: 'user-1',
            type: 'booking_reminder',
            title: 'Upcoming Appointment',
            message: 'You have an appointment tomorrow',
            is_read: false,
            created_at: '2024-01-15T10:00:00Z',
          },
        ];

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockNotifications, error: null })
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          order: mockEq,
        });

        const result = await service.getNotifications();

        expect(result).toEqual(mockNotifications);
        expect(supabase.from).toHaveBeenCalledWith('user_notifications');
      });

      it('should filter unread notifications only', async () => {
        const mockUser = { id: 'user-1' };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          order: mockEq,
        });

        const result = await service.getNotifications({ unread_only: true });

        expect(mockEq).toHaveBeenCalledWith('is_read', false);
        expect(Array.isArray(result)).toBe(true);
      });

      it('should limit notifications count', async () => {
        const mockUser = { id: 'user-1' };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          order: mockEq,
          limit: mockEq,
        });

        const result = await service.getNotifications({ limit: 10 });

        expect(mockEq().limit).toHaveBeenCalledWith(10);
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('markNotificationAsRead', () => {
      it('should mark notification as read successfully', async () => {
        const notificationId = 'notif-1';

        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        });

        (supabase.from as any).mockReturnValue({
          update: mockUpdate,
        });

        await expect(service.markNotificationAsRead(notificationId)).resolves.not.toThrow();

        expect(mockUpdate).toHaveBeenCalledWith({
          is_read: true,
          read_at: expect.any(String),
        });
        expect(mockUpdate().eq).toHaveBeenCalledWith('id', notificationId);
      });
    });
  });

  describe('Preference Management', () => {
    describe('getPreferences', () => {
      it('should return user preferences', async () => {
        const mockUser = { id: 'user-1' };
        const mockPreferences = [
          {
            key: 'language',
            value: 'pl',
            category: 'general',
            updated_at: '2024-01-15T10:00:00Z',
          },
          {
            key: 'email_notifications',
            value: true,
            category: 'notifications',
            updated_at: '2024-01-15T10:00:00Z',
          },
        ];

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPreferences, error: null })
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          order: mockEq,
        });

        const result = await service.getPreferences();

        expect(result).toEqual(mockPreferences);
        expect(supabase.from).toHaveBeenCalledWith('user_preferences');
      });

      it('should filter preferences by category', async () => {
        const mockUser = { id: 'user-1' };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          order: mockEq,
        });

        const result = await service.getPreferences('notifications');

        expect(mockEq).toHaveBeenCalledWith('category', 'notifications');
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('updatePreference', () => {
      it('should update preference successfully', async () => {
        const mockUser = { id: 'user-1' };
        const key = 'language';
        const value = 'en';
        const category = 'general';

        const mockPreference = {
          id: 'pref-1',
          user_id: 'user-1',
          key,
          value,
          category,
          updated_at: '2024-01-15T10:00:00Z',
        };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        const mockUpsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockPreference, error: null })
          })
        });

        (supabase.from as any).mockReturnValue({
          upsert: mockUpsert,
        });

        const result = await service.updatePreference(key, value, category);

        expect(result).toEqual(mockPreference);
        expect(mockUpsert).toHaveBeenCalledWith({
          user_id: mockUser.id,
          key,
          value,
          category,
          updated_at: expect.any(String),
        });
      });
    });
  });

  describe('User Analytics', () => {
    describe('getUserAnalytics', () => {
      it('should return user analytics for default timeframe', async () => {
        const mockUser = { id: 'user-1' };
        const mockAnalytics = {
          total_bookings: 10,
          total_spent: 2000,
          favorite_services: 5,
          average_rating: 4.5,
          most_booked_service: 'Beauty Treatment',
          booking_frequency: 'monthly',
          retention_rate: 0.8,
        };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        (supabase.rpc as any).mockResolvedValue({
          data: [mockAnalytics],
          error: null,
        });

        const result = await service.getUserAnalytics();

        expect(result).toEqual(mockAnalytics);
        expect(supabase.rpc).toHaveBeenCalledWith('get_user_analytics', {
          p_user_id: mockUser.id,
          p_start_date: expect.any(String),
          p_end_date: expect.any(String),
        });
      });

      it('should handle analytics errors gracefully', async () => {
        const mockUser = { id: 'user-1' };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        (supabase.rpc as any).mockResolvedValue({
          data: null,
          error: { message: 'Analytics calculation failed' }
        });

        const result = await service.getUserAnalytics();

        // Should return default analytics when calculation fails
        expect(result).toEqual({
          total_bookings: 0,
          total_spent: 0,
          favorite_services: 0,
          average_rating: 0,
          most_booked_service: '',
          booking_frequency: 'monthly',
          retention_rate: 0,
        });
      });

      it('should throw error for unauthenticated user', async () => {
        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: null }
        });

        await expect(service.getUserAnalytics()).rejects.toThrow('User not authenticated');
      });
    });
  });

  describe('GDPR Compliance', () => {
    describe('exportUserData', () => {
      it('should export all user data', async () => {
        const mockUser = { id: 'user-1' };
        const mockProfile = {
          id: 'user-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        };
        const mockFavorites = [
          {
            id: 'fav-1',
            service_id: 'service-1',
            created_at: '2024-01-15T10:00:00Z',
          },
        ];
        const mockAddresses = [
          {
            id: 'addr-1',
            label: 'home',
            address: { street: 'Main St 123', city: 'Warsaw' },
          },
        ];
        const mockBookings = [
          {
            id: 'booking-1',
            service_name: 'Beauty Treatment',
            date: '2024-01-15',
            time: '10:00',
            status: 'completed',
            total_price: 200,
            created_at: '2024-01-15T09:00:00Z',
          },
        ];
        const mockPackages = [
          {
            id: 'pkg-1',
            package_name: 'Beauty Package',
            purchase_date: '2024-01-01',
            expiry_date: '2024-12-31',
            sessions_used: 2,
            total_sessions: 10,
            status: 'active',
          },
        ];

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        // Mock getUserProfile
        (supabase.from as any).mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
              }),
            };
          }
          return {};
        });

        // Mock other service methods by spying
        vi.spyOn(service, 'getFavorites').mockResolvedValue(mockFavorites as any);
        vi.spyOn(service, 'getAddresses').mockResolvedValue(mockAddresses as any);

        // Mock bookings and packages
        const mockBookingService = {
          getUserBookings: vi.fn().mockResolvedValue(mockBookings),
        };
        const mockPackageService = {
          getClientPackages: vi.fn().mockResolvedValue(mockPackages),
        };

        // Temporarily attach mocked services
        (service as any).bookingService = mockBookingService;
        (service as any).packageService = mockPackageService;

        const result = await service.exportUserData();

        expect(result).toEqual({
          profile: mockProfile,
          favorites: mockFavorites,
          addresses: mockAddresses,
          bookings: expect.arrayContaining([
            expect.objectContaining({
              id: 'booking-1',
              service_name: 'Beauty Treatment',
              date: '2024-01-15',
              time: '10:00',
              status: 'completed',
              price: 200,
            }),
          ]),
          packages: expect.arrayContaining([
            expect.objectContaining({
              id: 'pkg-1',
              package_name: 'Beauty Package',
              status: 'active',
            }),
          ]),
          export_date: expect.any(String),
        });
      });

      it('should throw error for unauthenticated user', async () => {
        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: null }
        });

        await expect(service.exportUserData()).rejects.toThrow('User not authenticated');
      });
    });

    describe('deleteAccount', () => {
      it('should delete user account with proper confirmation', async () => {
        const mockUser = { id: 'user-1' };
        const password = 'user-password';
        const confirmation = 'DELETE_MY_ACCOUNT';

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        (supabase.rpc as any).mockResolvedValue({
          error: null,
        });

        (supabase.auth.signOut as any).mockResolvedValue({ error: null });

        await expect(service.deleteAccount(password, confirmation)).resolves.not.toThrow();

        expect(supabase.rpc).toHaveBeenCalledWith('delete_user_account', {
          p_password: password,
          p_confirmation: confirmation,
        });
        expect(supabase.auth.signOut).toHaveBeenCalled();
      });

      it('should reject invalid confirmation', async () => {
        const mockUser = { id: 'user-1' };

        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        await expect(service.deleteAccount('password', 'INVALID_CONFIRMATION')).rejects.toThrow(
          'Invalid confirmation'
        );
      });

      it('should throw error for unauthenticated user', async () => {
        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: null }
        });

        await expect(service.deleteAccount('password', 'DELETE_MY_ACCOUNT')).rejects.toThrow(
          'User not authenticated'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const mockUser = { id: 'user-1' };

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser }
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnValue({
        single: vi.fn().mockRejectedValue(new Error('Network timeout'))
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      await expect(service.getUserProfile()).rejects.toThrow();
    });

    it('should handle malformed data responses', async () => {
      const mockUser = { id: 'user-1' };

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser }
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { invalid: 'data' }, // Missing required fields
          error: null,
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      const result = await service.getUserProfile();

      // Should still return data even if incomplete
      expect(result).toEqual({ invalid: 'data' });
    });
  });
});