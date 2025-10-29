import { useState, useEffect } from 'react';

import { supabase } from '@/integrations/supabase/client';

interface SiteImage {
  id: string;
  key: string;
  title: string;
  description: string | null;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_active: boolean;
}

export const useSiteImage = (key: string) => {
  const [image, setImage] = useState<SiteImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const { data, error } = await supabase
          .from('site_images')
          .select('*')
          .eq('key', key)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        
        setImage(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [key]);

  return { image, loading, error };
};

export const useSiteImages = (keys?: string[]) => {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        let query = supabase
          .from('site_images')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (keys && keys.length > 0) {
          query = query.in('key', keys);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        setImages(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [keys?.join(',')]);

  const getImageByKey = (key: string) => {
    return images.find(img => img.key === key);
  };

  return { images, loading, error, getImageByKey };
};