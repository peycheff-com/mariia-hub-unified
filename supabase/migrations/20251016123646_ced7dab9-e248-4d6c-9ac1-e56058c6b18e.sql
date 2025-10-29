-- Add gallery images for services
CREATE TABLE IF NOT EXISTS public.service_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add FAQs for services/programs
CREATE TABLE IF NOT EXISTS public.service_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add aftercare/contraindications content
CREATE TABLE IF NOT EXISTS public.service_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE UNIQUE,
  what_to_expect TEXT[],
  contraindications TEXT[],
  aftercare_instructions TEXT,
  preparation_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add availability slots table
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL CHECK (service_type IN ('beauty', 'fitness', 'both')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add user favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Enable RLS
ALTER TABLE public.service_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_gallery
CREATE POLICY "Anyone can view service gallery"
  ON public.service_gallery FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage gallery"
  ON public.service_gallery FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for service_faqs
CREATE POLICY "Anyone can view FAQs"
  ON public.service_faqs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage FAQs"
  ON public.service_faqs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for service_content
CREATE POLICY "Anyone can view service content"
  ON public.service_content FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage service content"
  ON public.service_content FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for availability_slots
CREATE POLICY "Anyone can view availability"
  ON public.availability_slots FOR SELECT
  USING (is_available = true);

CREATE POLICY "Admins can manage availability"
  ON public.availability_slots FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_favorites
CREATE POLICY "Users can view own favorites"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
  ON public.user_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_service_gallery_service ON public.service_gallery(service_id, display_order);
CREATE INDEX idx_service_faqs_service ON public.service_faqs(service_id, display_order);
CREATE INDEX idx_availability_slots_type_day ON public.availability_slots(service_type, day_of_week, is_available);
CREATE INDEX idx_user_favorites_user ON public.user_favorites(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_service_faqs_updated_at
  BEFORE UPDATE ON public.service_faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_content_updated_at
  BEFORE UPDATE ON public.service_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_availability_slots_updated_at
  BEFORE UPDATE ON public.availability_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();