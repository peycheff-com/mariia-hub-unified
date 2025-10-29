import { useState, useEffect } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .select('service_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(data?.map(f => f.service_id) || []);
    } catch (error) {
      // Favorites load failed silently
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (serviceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Please sign in',
          description: 'You need to be signed in to save favorites',
          variant: 'destructive',
        });
        return;
      }

      const isFavorite = favorites.includes(serviceId);

      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('service_id', serviceId);

        if (error) throw error;

        setFavorites(prev => prev.filter(id => id !== serviceId));
        
        toast({
          title: 'Removed from favorites',
          description: 'Service removed from your favorites',
        });
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, service_id: serviceId });

        if (error) throw error;

        setFavorites(prev => [...prev, serviceId]);
        
        toast({
          title: 'Added to favorites',
          description: 'Service saved to your favorites',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isFavorite = (serviceId: string) => favorites.includes(serviceId);

  return { favorites, loading, toggleFavorite, isFavorite, loadFavorites };
};
