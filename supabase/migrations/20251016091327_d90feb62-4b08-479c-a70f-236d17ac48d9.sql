-- Create tables for mode preferences and booking analytics

-- User mode preferences and session tracking
CREATE TABLE IF NOT EXISTS public.user_mode_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  preferred_mode TEXT CHECK (preferred_mode IN ('beauty', 'fitness')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  last_service_id TEXT,
  visit_count INTEGER DEFAULT 1,
  last_visited TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(session_id)
);

-- Service popularity tracking
CREATE TABLE IF NOT EXISTS public.service_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL,
  service_type TEXT CHECK (service_type IN ('beauty', 'fitness')),
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening')),
  booking_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(service_id, time_of_day)
);

-- Booking draft state (for resume functionality)
CREATE TABLE IF NOT EXISTS public.booking_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT CHECK (service_type IN ('beauty', 'fitness')),
  service_id TEXT,
  booking_date DATE,
  booking_time TIME,
  notes TEXT,
  step_completed INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id)
);

-- Time slot preferences (for heuristics)
CREATE TABLE IF NOT EXISTS public.time_slot_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT CHECK (service_type IN ('beauty', 'fitness')),
  time_slot TIME NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  booking_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(service_type, time_slot, day_of_week)
);

-- Enable RLS
ALTER TABLE public.user_mode_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slot_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_mode_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_mode_preferences FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_mode_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own preferences"
  ON public.user_mode_preferences FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for service_analytics (read-only for all)
CREATE POLICY "Service analytics are publicly readable"
  ON public.service_analytics FOR SELECT
  USING (true);

-- RLS Policies for booking_drafts
CREATE POLICY "Users can view their own drafts"
  ON public.booking_drafts FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own drafts"
  ON public.booking_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own drafts"
  ON public.booking_drafts FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own drafts"
  ON public.booking_drafts FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for time_slot_analytics (read-only for all)
CREATE POLICY "Time slot analytics are publicly readable"
  ON public.time_slot_analytics FOR SELECT
  USING (true);

-- Function to update booking draft timestamp
CREATE OR REPLACE FUNCTION update_booking_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking drafts
CREATE TRIGGER update_booking_drafts_timestamp
  BEFORE UPDATE ON public.booking_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_draft_timestamp();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mode_preferences_user_id ON public.user_mode_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mode_preferences_session_id ON public.user_mode_preferences(session_id);
CREATE INDEX IF NOT EXISTS idx_service_analytics_service_id ON public.service_analytics(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_drafts_session_id ON public.booking_drafts(session_id);
CREATE INDEX IF NOT EXISTS idx_booking_drafts_user_id ON public.booking_drafts(user_id);