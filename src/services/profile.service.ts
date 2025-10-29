import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/user';

export const profileService = {
  async getUserProfile(): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        notification_preferences (*)
      `)
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      phone: data.phone || undefined,
      avatar_url: data.avatar_url || undefined,
      date_of_birth: data.date_of_birth || undefined,
      gender: data.gender as any || undefined,
      bio: data.bio || undefined,
      preferences: {
        language: data.language || 'en',
        currency: data.currency || 'PLN',
        timezone: data.timezone || 'Europe/Warsaw',
        notifications: data.notification_preferences || [],
      },
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  async updateProfile(data: Partial<UserProfile>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        bio: data.bio,
        language: data.preferences?.language,
        currency: data.preferences?.currency,
        timezone: data.preferences?.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;
  },

  async uploadAvatar(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('user-content')
      .getPublicUrl(filePath);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return publicUrl;
  },
};