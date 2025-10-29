-- Create storage bucket for general site images (hero, about, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create table to store site image metadata
CREATE TABLE IF NOT EXISTS public.site_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE, -- e.g., 'hero-main', 'about-mariia', 'hero-beauty', 'hero-fitness'
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_images
CREATE POLICY "Anyone can view active site images"
ON public.site_images
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage site images"
ON public.site_images
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for site-images bucket
CREATE POLICY "Anyone can view site images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'site-images');

CREATE POLICY "Admins can upload site images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'site-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'site-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'site-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_site_images_updated_at
BEFORE UPDATE ON public.site_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default image records for existing static images
INSERT INTO public.site_images (key, title, description, image_url, alt_text) VALUES
('hero-main', 'Main Hero Image', 'Primary hero background image on homepage', '/src/assets/header.png', 'Mariia Borysevych - Beauty Artist and Personal Trainer in Warsaw'),
('hero-beauty', 'Beauty Section Hero', 'Hero image for beauty services section', '/src/assets/hero-beauty.jpg', 'Beauty Services - Permanent Makeup and Brow Styling'),
('hero-fitness', 'Fitness Section Hero', 'Hero image for fitness programs section', '/src/assets/hero-fitness.jpg', 'Personal Training and Fitness Coaching'),
('hero-lifestyle', 'Lifestyle Section Hero', 'Hero image for lifestyle coaching', '/src/assets/hero-lifestyle.jpg', 'Lifestyle and Wellness Coaching'),
('about-mariia', 'About Mariia Photo', 'Main profile photo for about section', '/src/assets/mariia-about.jpg', 'Mariia Borysevych - Professional Beauty Artist and Fitness Coach'),
('profile-mariia', 'Mariia Profile Picture', 'Profile picture for site', '/src/assets/mariia-profile.jpg', 'Mariia - Beauty and Fitness Specialist'),
('logo', 'Site Logo', 'Main site logo', '/src/assets/logo.png', 'BM Beauty Logo'),
('lips-pmu-feature', 'Lips PMU Feature Image', 'Featured image for permanent makeup lips service', '/src/assets/lips-permanent-makeup.jpg', 'Permanent Makeup Lips Results')
ON CONFLICT (key) DO NOTHING;