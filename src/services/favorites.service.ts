import { supabase } from '@/integrations/supabase/client';
import { UserFavorite } from '@/types/user';

export const favoritesService = {
  async getUserFavorites(): Promise<UserFavorite[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        *,
        service:services(*),
        provider:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(favorite => ({
      ...favorite,
      provider: favorite.provider ? {
        ...favorite.provider,
        name: `${favorite.provider.first_name} ${favorite.provider.last_name}`,
      } : undefined,
    })) as UserFavorite[];
  },

  async addFavorite(serviceId: string, providerId?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        service_id: serviceId,
        provider_id: providerId,
      });

    if (error) {
      if (error.code === '23505') {
        // Already exists
        return;
      }
      throw error;
    }
  },

  async removeFavorite(favoriteId: string): Promise<void> {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('id', favoriteId);

    if (error) throw error;
  },

  async updateFavoriteNotes(favoriteId: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('user_favorites')
      .update({ notes })
      .eq('id', favoriteId);

    if (error) throw error;
  },

  async updateNotificationPreference(favoriteId: string, enabled: boolean): Promise<void> {
    // This would integrate with a notification preferences table
    // For now, we'll store it in user_favorites notes as JSON
    const { error } = await supabase
      .from('user_favorites')
      .update({
        notes: JSON.stringify({ notifications: enabled }),
      })
      .eq('id', favoriteId);

    if (error) throw error;
  },

  async isFavorite(serviceId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('service_id', serviceId)
      .single();

    return !error && !!data;
  },
};