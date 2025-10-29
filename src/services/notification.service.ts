import { supabase } from '@/integrations/supabase/client';
import { NotificationPreference } from '@/types/user';

export const notificationService = {
  async getNotificationPreferences(): Promise<NotificationPreference[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    // Ensure all notification types exist
    const defaultTypes = [
      'booking_reminder',
      'booking_confirmation',
      'promotional',
      'review_request',
      'new_message',
      'payment_reminder',
    ];

    const existingTypes = data?.map(p => p.notification_type) || [];
    const missingTypes = defaultTypes.filter(type => !existingTypes.includes(type));

    if (missingTypes.length > 0) {
      // Create missing preferences
      const { data: newData } = await supabase
        .from('notification_preferences')
        .insert(
          missingTypes.map(type => ({
            user_id: user.id,
            notification_type: type,
            email_enabled: type !== 'promotional',
            sms_enabled: false,
            push_enabled: type !== 'promotional',
          }))
        )
        .select();

      return [...(data || []), ...(newData || [])];
    }

    return data || [];
  },

  async updateNotificationPreferences(
    updates: Partial<NotificationPreference>[]
  ): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        updates.map(update => ({
          ...update,
          updated_at: new Date().toISOString(),
        }))
      );

    if (error) throw error;
  },

  async updateQuietHours(start: string, end: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('notification_preferences')
      .update({
        quiet_hours_start: start,
        quiet_hours_end: end,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async sendNotification(
    userId: string,
    type: string,
    data: Record<string, any>
  ): Promise<void> {
    // This would integrate with a notification service like SendGrid, Twilio, or Push notifications
    // For now, we'll just log it
    console.log(`Sending ${type} notification to user ${userId}:`, data);

    // Store notification in database for history
    const { error } = await supabase
      .from('notification_history')
      .insert({
        user_id: userId,
        type,
        data,
        sent_at: new Date().toISOString(),
      });

    if (error) console.error('Failed to store notification:', error);
  },
};