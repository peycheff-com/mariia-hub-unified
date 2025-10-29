import { z } from 'zod';

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { NotificationPreference, UserProfile, UserFavorite, UserAddress } from '@/types/user';

import { BaseService } from './api/base.service';

// Types for user-related operations
export interface UserNotification {
  id: string;
  user_id: string;
  type: 'booking_reminder' | 'booking_confirmation' | 'promotional' | 'review_request' | 'new_message' | 'package_expiry' | 'payment_success';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

export interface UserAnalytics {
  total_bookings: number;
  total_spent: number;
  favorite_services: number;
  average_rating: number;
  most_booked_service: string;
  booking_frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  retention_rate: number;
}

export interface UserPreference {
  key: string;
  value: any;
  category: 'general' | 'notifications' | 'privacy' | 'appearance' | 'booking';
  updated_at: string;
}

// Validation schemas
const UpdateProfileSchema = z.object({
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[+]?[\d\s\-\(\)]+$/, 'Invalid phone number').optional(),
  date_of_birth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bio: z.string().max(500).optional(),
  preferences: z.object({
    language: z.string().optional(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
});

const AddFavoriteSchema = z.object({
  service_id: z.string().uuid(),
  provider_id: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

const UpdateAddressSchema = z.object({
  label: z.enum(['home', 'work', 'other']),
  address: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    postal_code: z.string().min(3).max(20),
    country: z.string().min(2).max(100).optional(),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
  }),
  is_default: z.boolean(),
});

class UserService extends BaseService {
  private readonly tableName = 'profiles';
  private readonly favoritesTable = 'user_favorites';
  private readonly addressesTable = 'user_addresses';
  private readonly notificationsTable = 'user_notifications';
  private readonly preferencesTable = 'user_preferences';

  // Get user profile
  async getUserProfile(): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          notification_preferences,
          addresses(id, label, address, is_default, created_at)
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        logger.error('Error fetching user profile:', error);
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }

      return data as UserProfile;
    } catch (error) {
      logger.error('UserService.getUserProfile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(data: z.infer<typeof UpdateProfileSchema>): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const validatedData = UpdateProfileSchema.parse(data);

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating user profile:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      logger.info('User profile updated successfully');
      return result as UserProfile;
    } catch (error) {
      logger.error('UserService.updateProfile error:', error);
      throw error;
    }
  }

  // Upload avatar
  async uploadAvatar(file: File): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        logger.error('Error uploading avatar:', uploadError);
        throw new Error(`Failed to upload avatar: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await supabase
        .from(this.tableName)
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      logger.info('Avatar uploaded successfully');
      return publicUrl;
    } catch (error) {
      logger.error('UserService.uploadAvatar error:', error);
      throw error;
    }
  }

  // Get user favorites
  async getFavorites(): Promise<UserFavorite[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from(this.favoritesTable)
        .select(`
          *,
          services(id, title, service_type, duration_minutes, price_from, image_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching favorites:', error);
        throw new Error(`Failed to fetch favorites: ${error.message}`);
      }

      return data as UserFavorite[] || [];
    } catch (error) {
      logger.error('UserService.getFavorites error:', error);
      throw error;
    }
  }

  // Add to favorites
  async addToFavorites(serviceId: string, notes?: string): Promise<UserFavorite> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from(this.favoritesTable)
        .insert({
          user_id: user.id,
          service_id: serviceId,
          notes,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          services(id, title, service_type, duration_minutes, price_from, image_url)
        `)
        .single();

      if (error) {
        logger.error('Error adding to favorites:', error);
        throw new Error(`Failed to add to favorites: ${error.message}`);
      }

      logger.info('Added to favorites:', { serviceId, notes });
      return data as UserFavorite;
    } catch (error) {
      logger.error('UserService.addToFavorites error:', error);
      throw error;
    }
  }

  // Remove from favorites
  async removeFromFavorites(favoriteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.favoritesTable)
        .delete()
        .eq('id', favoriteId);

      if (error) {
        logger.error('Error removing from favorites:', error);
        throw new Error(`Failed to remove from favorites: ${error.message}`);
      }

      logger.info('Removed from favorites:', favoriteId);
    } catch (error) {
      logger.error('UserService.removeFromFavorites error:', error);
      throw error;
    }
  }

  // Get user addresses
  async getAddresses(): Promise<UserAddress[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from(this.addressesTable)
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching addresses:', error);
        throw new Error(`Failed to fetch addresses: ${error.message}`);
      }

      return data as UserAddress[] || [];
    } catch (error) {
      logger.error('UserService.getAddresses error:', error);
      throw error;
    }
  }

  // Add or update address
  async upsertAddress(address: z.infer<typeof UpdateAddressSchema>): Promise<UserAddress> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const validatedData = UpdateAddressSchema.parse(address);

      const { data, error } = await supabase
        .from(this.addressesTable)
        .upsert({
          user_id: user.id,
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error upserting address:', error);
        throw new Error(`Failed to upsert address: ${error.message}`);
      }

      logger.info('Address upserted successfully');
      return data as UserAddress;
    } catch (error) {
      logger.error('UserService.upsertAddress error:', error);
      throw error;
    }
  }

  // Delete address
  async deleteAddress(addressId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.addressesTable)
        .delete()
        .eq('id', addressId);

      if (error) {
        logger.error('Error deleting address:', error);
        throw new Error(`Failed to delete address: ${error.message}`);
      }

      logger.info('Address deleted successfully:', addressId);
    } catch (error) {
      logger.error('UserService.deleteAddress error:', error);
      throw error;
    }
  }

  // Get user notifications
  async getNotifications(options: {
    limit?: number;
    unread_only?: boolean;
  } = {}): Promise<UserNotification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from(this.notificationsTable)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (options.unread_only) {
        query = query.eq('is_read', false);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching notifications:', error);
        throw new Error(`Failed to fetch notifications: ${error.message}`);
      }

      return data as UserNotification[] || [];
    } catch (error) {
      logger.error('UserService.getNotifications error:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.notificationsTable)
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        logger.error('Error marking notification as read:', error);
        throw new Error(`Failed to mark notification as read: ${error.message}`);
      }

      logger.info('Notification marked as read:', notificationId);
    } catch (error) {
      logger.error('UserService.markNotificationAsRead error:', error);
      throw error;
    }
  }

  // Get user preferences
  async getPreferences(category?: string): Promise<UserPreference[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from(this.preferencesTable)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching preferences:', error);
        throw new Error(`Failed to fetch preferences: ${error.message}`);
      }

      return data as UserPreference[] || [];
    } catch (error) {
      logger.error('UserService.getPreferences error:', error);
      throw error;
    }
  }

  // Update preference
  async updatePreference(key: string, value: any, category?: string): Promise<UserPreference> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from(this.preferencesTable)
        .upsert({
          user_id: user.id,
          key,
          value,
          category: category || 'general',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error updating preference:', error);
        throw new Error(`Failed to update preference: ${error.message}`);
      }

      logger.info('Preference updated:', { key, value, category });
      return data as UserPreference;
    } catch (error) {
      logger.error('UserService.updatePreference error:', error);
      throw error;
    }
  }

  // Get user analytics
  async getUserAnalytics(timeframe?: '30d' | '90d' | '1y'): Promise<UserAnalytics> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const days = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // This would typically use database functions for complex analytics
      const { data, error } = await supabase
        .rpc('get_user_analytics', {
          p_user_id: user.id,
          p_start_date: startDate.toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        });

      if (error) {
        logger.error('Error fetching user analytics:', error);
        throw new Error(`Failed to fetch analytics: ${error.message}`);
      }

      return data?.[0] as UserAnalytics || {
        total_bookings: 0,
        total_spent: 0,
        favorite_services: 0,
        average_rating: 0,
        most_booked_service: '',
        booking_frequency: 'monthly',
        retention_rate: 0,
      };
    } catch (error) {
      logger.error('UserService.getUserAnalytics error:', error);
      throw error;
    }
  }

  // Delete user account
  async deleteAccount(password: string, confirmation: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Verify password and confirmation
      if (confirmation !== 'DELETE_MY_ACCOUNT') {
        throw new Error('Invalid confirmation');
      }

      // Delete user data (this would need proper cascading delete in the database)
      await supabase.rpc('delete_user_account', {
        p_password: password,
        p_confirmation: confirmation
      });

      // Sign out user
      await supabase.auth.signOut();

      logger.info('User account deleted successfully');
    } catch (error) {
      logger.error('UserService.deleteAccount error:', error);
      throw error;
    }
  }

  // Export user data (GDPR compliance)
  async exportUserData(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const [profile, favorites, addresses, bookings, packages] = await Promise.all([
        this.getUserProfile(),
        this.getFavorites(),
        this.getAddresses(),
        bookingService.getUserBookings({ limit: 1000 }),
        packageService.getClientPackages(user.id, { status: 'all' })
      ]);

      const exportData = {
        profile,
        favorites,
        addresses,
        bookings: bookings.map(b => ({
          id: b.id,
          service_name: b.service_name,
          date: b.date,
          time: b.time,
          status: b.status,
          price: b.total_price,
          created_at: b.created_at
        })),
        packages: packages.map(p => ({
          id: p.id,
          package_name: p.package?.name,
          purchase_date: p.purchase_date,
          expiry_date: p.expiry_date,
          sessions_used: p.sessions_used,
          total_sessions: p.total_sessions,
          status: p.status
        })),
        export_date: new Date().toISOString()
      };

      logger.info('User data exported successfully');
      return exportData;
    } catch (error) {
      logger.error('UserService.exportUserData error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();

// Export types and schemas for use in components
export type { UpdateProfileSchema, AddFavoriteSchema, UpdateAddressSchema };