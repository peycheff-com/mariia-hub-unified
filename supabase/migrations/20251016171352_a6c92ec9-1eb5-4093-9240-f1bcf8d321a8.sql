-- =============================================
-- COMPLETE UNIFIED BOOKING SYSTEM MIGRATION
-- Resource-centric architecture with zero overlaps
-- =============================================

-- 1. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  type TEXT NOT NULL CHECK (type IN ('studio', 'gym', 'onsite')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RESOURCES TABLE (Mariia = single resource)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  skills TEXT[] NOT NULL, -- ['beauty', 'fitness']
  max_parallel INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BUFFERS TABLE
CREATE TABLE IF NOT EXISTS public.buffers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  pre_minutes INTEGER NOT NULL DEFAULT 0,
  post_minutes INTEGER NOT NULL DEFAULT 0,
  travel_minutes INTEGER DEFAULT 0, -- For on-site services
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id)
);

-- 4. CALENDAR BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('booksy', 'personal', 'travel', 'admin_block')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. HOLDS TABLE (10min TTL for checkout)
CREATE TABLE IF NOT EXISTS public.holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  session_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(resource_id, start_time, end_time)
);

-- 6. EXTERNAL SYNC TABLE (for Booksy integration)
CREATE TABLE IF NOT EXISTS public.external_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('booksy', 'google_calendar')),
  external_id TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, external_id)
);

-- 7. UPDATE SERVICES TABLE - Add new fields
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS add_ons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_rules JSONB DEFAULT '{"allowed_locations": ["studio"]}'::jsonb,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER,
  ADD COLUMN IF NOT EXISTS booksy_service_id TEXT,
  ADD COLUMN IF NOT EXISTS contraindications TEXT[],
  ADD COLUMN IF NOT EXISTS requires_policy_acceptance BOOLEAN DEFAULT true;

-- 8. UPDATE BOOKINGS TABLE - Add new fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id),
  ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES public.resources(id),
  ADD COLUMN IF NOT EXISTS selected_add_ons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deposit_paid NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS policy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS on_site_address TEXT,
  ADD COLUMN IF NOT EXISTS travel_time_minutes INTEGER;

-- 9. CREATE INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_holds_expires_at ON public.holds(expires_at);
CREATE INDEX IF NOT EXISTS idx_holds_resource_time ON public.holds(resource_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_resource_time ON public.bookings(resource_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_resource_time ON public.calendar_blocks(resource_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type) WHERE is_active = true;

-- 10. INSERT DEFAULT DATA

-- Insert default resource (Mariia)
INSERT INTO public.resources (name, skills, max_parallel, is_active)
VALUES ('Mariia', ARRAY['beauty', 'fitness'], 1, true)
ON CONFLICT DO NOTHING;

-- Insert default locations
INSERT INTO public.locations (name, address, type, is_active) VALUES
  ('Studio Smolna', 'Smolna 8/10, Warszawa', 'studio', true),
  ('Zdrofit Gym', 'Zdrofit Location', 'gym', true),
  ('On-site Service', 'Client Location', 'onsite', true)
ON CONFLICT DO NOTHING;

-- Insert default buffers for PMU services (10 min pre/post)
INSERT INTO public.buffers (service_id, pre_minutes, post_minutes)
SELECT id, 10, 10
FROM public.services
WHERE category IN ('eyebrows', 'lips', 'eyeliner')
ON CONFLICT (service_id) DO NOTHING;

-- 11. RLS POLICIES

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buffers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_sync ENABLE ROW LEVEL SECURITY;

-- Locations: Public read, admin manage
CREATE POLICY "Anyone can view active locations"
  ON public.locations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage locations"
  ON public.locations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Resources: Public read, admin manage
CREATE POLICY "Anyone can view active resources"
  ON public.resources FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage resources"
  ON public.resources FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Buffers: Public read, admin manage
CREATE POLICY "Anyone can view buffers"
  ON public.buffers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage buffers"
  ON public.buffers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Calendar blocks: Admin only
CREATE POLICY "Admins can manage calendar blocks"
  ON public.calendar_blocks FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Holds: Users can manage their own holds
CREATE POLICY "Users can view own holds"
  ON public.holds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create holds"
  ON public.holds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own holds"
  ON public.holds FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all holds"
  ON public.holds FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- External sync: Admin only
CREATE POLICY "Admins can manage external sync"
  ON public.external_sync FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 12. FUNCTION: Clean expired holds
CREATE OR REPLACE FUNCTION public.clean_expired_holds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.holds
  WHERE expires_at < now();
END;
$$;

-- 13. FUNCTION: Check slot availability
CREATE OR REPLACE FUNCTION public.check_slot_availability(
  p_resource_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  -- Check for conflicts with bookings
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.bookings
  WHERE resource_id = p_resource_id
    AND status IN ('confirmed', 'pending')
    AND (
      (booking_date >= p_start_time AND booking_date < p_end_time)
      OR (booking_date + (duration_minutes || ' minutes')::interval > p_start_time 
          AND booking_date < p_end_time)
    );
  
  IF v_conflict_count > 0 THEN
    RETURN false;
  END IF;
  
  -- Check for conflicts with active holds
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.holds
  WHERE resource_id = p_resource_id
    AND expires_at > now()
    AND (
      (start_time >= p_start_time AND start_time < p_end_time)
      OR (end_time > p_start_time AND end_time <= p_end_time)
      OR (start_time <= p_start_time AND end_time >= p_end_time)
    );
  
  IF v_conflict_count > 0 THEN
    RETURN false;
  END IF;
  
  -- Check for calendar blocks
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.calendar_blocks
  WHERE resource_id = p_resource_id
    AND (
      (start_time >= p_start_time AND start_time < p_end_time)
      OR (end_time > p_start_time AND end_time <= p_end_time)
      OR (start_time <= p_start_time AND end_time >= p_end_time)
    );
  
  RETURN v_conflict_count = 0;
END;
$$;

-- 14. Add duration_minutes to bookings if not exists
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;