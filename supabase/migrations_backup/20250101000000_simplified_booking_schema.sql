-- Simplified Booking System Schema Migration
-- This migration consolidates the booking system into a more maintainable structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Create custom types (if they don't exist)
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('draft', 'pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_type AS ENUM ('beauty', 'fitness', 'lifestyle');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE location_type AS ENUM ('studio', 'online', 'fitness');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('card', 'cash', 'transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Simplified Services table
DO $$ BEGIN
    ALTER TABLE services RENAME TO services_old;
EXCEPTION
    WHEN undefined_table THEN null; -- services_old might already exist
END $$;

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  service_type service_type NOT NULL,
  price_from NUMERIC(10, 2) NOT NULL,
  price_to NUMERIC(10, 2),
  duration_minutes INTEGER NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_package BOOLEAN DEFAULT false,
  package_sessions INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrate data from old services table
INSERT INTO services (
  id, title, slug, service_type, price_from, price_to,
  duration_minutes, description, image_url, is_active,
  is_package, package_sessions, display_order, created_at, updated_at
)
SELECT
  id, title, slug, service_type::service_type, price_from, price_to,
  duration_minutes, description, image_url, is_active,
  is_package, package_sessions, display_order, created_at, updated_at
FROM services_old;

-- Simplified Bookings table with consolidated draft functionality
ALTER TABLE bookings RENAME TO bookings_old;

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  service_id UUID NOT NULL REFERENCES services(id),
  status booking_status DEFAULT 'draft',

  -- Consolidated booking data
  booking_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Key fields for indexing and queries
  booking_date DATE,
  booking_time TIME,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  location_type location_type,

  -- Payment information
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'PLN',
  payment_method payment_method,
  payment_status payment_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,

  -- Metadata and audit
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrate existing bookings
INSERT INTO bookings (
  id, user_id, service_id, status, booking_date, booking_time,
  client_name, client_email, client_phone, amount_paid,
  currency, payment_method::payment_method, payment_status::payment_status,
  stripe_payment_intent_id, metadata, created_at, updated_at
)
SELECT
  id, user_id, service_id, status::booking_status, booking_date, booking_time,
  client_name, client_email, client_phone, amount_paid,
  currency, payment_method::payment_method, payment_status::payment_status,
  stripe_payment_intent_id,
  jsonb_build_object(
    'notes', notes,
    'admin_notes', admin_notes,
    'consent_terms_accepted', consent_terms_accepted,
    'consent_marketing_accepted', consent_marketing_accepted,
    'booking_source', booking_source,
    'booking_type', booking_type,
    'selected_add_ons', selected_add_ons,
    'duration_minutes', duration_minutes
  ) as metadata,
  created_at, updated_at
FROM bookings_old;

-- Simplified Availability table using range types
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type service_type NOT NULL,
  time_range TSRANGE NOT NULL,
  location_type location_type NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Exclude overlapping ranges for same service type and location
  EXCLUDE USING GIST (
    service_type WITH =,
    time_range WITH &&,
    location_type WITH =
  )
);

-- Create indexes
CREATE INDEX idx_availability_service_type ON availability (service_type);
CREATE INDEX idx_availability_time_range ON availability USING GIST (time_range);
CREATE INDEX idx_availability_location_type ON availability (location_type);

-- Simplified Holds table
CREATE TABLE holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  service_id UUID REFERENCES services(id),
  time_range TSRANGE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  session_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent overlapping holds
  EXCLUDE USING GIST (time_range WITH &&)
);

-- Create indexes for holds
CREATE INDEX idx_holds_user_id ON holds (user_id);
CREATE INDEX idx_holds_expires_at ON holds (expires_at);
CREATE INDEX idx_holds_session_id ON holds (session_id);

-- Function to clean expired holds
CREATE OR REPLACE FUNCTION cleanup_expired_holds()
RETURNS void AS $$
BEGIN
  DELETE FROM holds WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create calendar blocks for external system integration
CREATE TABLE calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_range TSRANGE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('booksy', 'personal', 'travel', 'admin_block')),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),

  EXCLUDE USING GIST (time_range WITH &&)
);

-- Create index for calendar blocks
CREATE INDEX idx_calendar_blocks_time_range ON calendar_blocks USING GIST (time_range);

-- Create view for booking calendar
CREATE VIEW booking_calendar AS
SELECT
  b.id,
  b.service_id,
  s.title as service_title,
  s.service_type,
  b.booking_date,
  b.booking_time,
  b.status,
  b.client_name,
  b.client_email,
  b.location_type,
  s.duration_minutes,
  -- Create timestamp range for easier querying
  TSTZRANGE(
    (b.booking_date || ' ' || b.booking_time)::timestamptz,
    (b.booking_date || ' ' || b.booking_time)::timestamptz +
      (s.duration_minutes || ' minutes')::interval,
    '[)'
  ) as booking_range
FROM bookings b
JOIN services s ON b.service_id = s.id
WHERE b.status NOT IN ('cancelled', 'draft');

-- Create function to check slot availability
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_service_id UUID,
  p_booking_date DATE,
  p_booking_time TIME,
  p_duration_minutes INTEGER
)
RETURNS TABLE (
  available BOOLEAN,
  conflict_reason TEXT
) AS $$
DECLARE
  v_service_type service_type;
  v_location_type location_type;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_booking_count INTEGER;
  v_hold_count INTEGER;
  v_block_count INTEGER;
BEGIN
  -- Get service details
  SELECT service_type INTO v_service_type
  FROM services
  WHERE id = p_service_id;

  -- Default location (can be overridden by parameter)
  v_location_type := 'studio';

  -- Create time range
  v_start_time := (p_booking_date || ' ' || p_booking_time)::timestamptz;
  v_end_time := v_start_time + (p_duration_minutes || ' minutes')::interval;

  -- Check for existing bookings
  SELECT COUNT(*) INTO v_booking_count
  FROM booking_calendar
  WHERE booking_range && TSTZRANGE(v_start_time, v_end_time, '[)')
    AND status IN ('pending', 'confirmed');

  IF v_booking_count > 0 THEN
    RETURN QUERY SELECT false, 'Time slot already booked'::TEXT;
    RETURN;
  END IF;

  -- Check for active holds
  SELECT COUNT(*) INTO v_hold_count
  FROM holds
  WHERE time_range && TSTZRANGE(v_start_time, v_end_time, '[)')
    AND expires_at > now();

  IF v_hold_count > 0 THEN
    RETURN QUERY SELECT false, 'Time slot temporarily reserved'::TEXT;
    RETURN;
  END IF;

  -- Check for calendar blocks
  SELECT COUNT(*) INTO v_block_count
  FROM calendar_blocks
  WHERE time_range && TSTZRANGE(v_start_time, v_end_time, '[)');

  IF v_block_count > 0 THEN
    RETURN QUERY SELECT false, 'Time slot blocked'::TEXT;
    RETURN;
  END IF;

  -- Check availability windows
  PERFORM 1
  FROM availability
  WHERE service_type = v_service_type
    AND location_type = v_location_type
    AND is_available = true
    AND time_range @> TSTZRANGE(v_start_time, v_end_time, '[)')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Outside available hours'::TEXT;
    RETURN;
  END IF;

  -- Slot is available
  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Create function to create a booking with hold
CREATE OR REPLACE FUNCTION create_booking_with_hold(
  p_user_id UUID,
  p_service_id UUID,
  p_booking_date DATE,
  p_booking_time TIME,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_location_type location_type DEFAULT 'studio',
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_service services%ROWTYPE;
  v_available BOOLEAN;
  v_conflict_reason TEXT;
BEGIN
  -- Get service details
  SELECT * INTO v_service
  FROM services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  -- Check availability
  SELECT available, conflict_reason INTO v_available, v_conflict_reason
  FROM check_slot_availability(p_service_id, p_booking_date, p_booking_time, v_service.duration_minutes);

  IF NOT v_available THEN
    RAISE EXCEPTION 'Slot not available: %', v_conflict_reason;
  END IF;

  -- Create hold if session_id provided
  IF p_session_id IS NOT NULL THEN
    INSERT INTO holds (
      user_id,
      service_id,
      time_range,
      expires_at,
      session_id
    ) VALUES (
      p_user_id,
      p_service_id,
      TSTZRANGE(
        (p_booking_date || ' ' || p_booking_time)::timestamptz,
        (p_booking_date || ' ' || p_booking_time)::timestamptz +
          (v_service.duration_minutes || ' minutes')::interval,
        '[)'
      ),
      now() + '10 minutes',
      p_session_id
    );
  END IF;

  -- Create booking
  INSERT INTO bookings (
    user_id,
    service_id,
    status,
    booking_date,
    booking_time,
    client_name,
    client_email,
    client_phone,
    location_type,
    amount_paid,
    currency,
    metadata
  ) VALUES (
    p_user_id,
    p_service_id,
    'pending',
    p_booking_date,
    p_booking_time,
    p_client_name,
    p_client_email,
    p_client_phone,
    p_location_type,
    v_service.price_from,
    'PLN',
    jsonb_build_object(
      'session_id', p_session_id,
      'duration_minutes', v_service.duration_minutes
    )
  ) RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Schedule cleanup of expired holds
SELECT cron.schedule(
  'cleanup-expired-holds',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT cleanup_expired_holds();'
);

-- Row Level Security Policies

-- Services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage services"
  ON services FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create any bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Availability
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability"
  ON availability FOR SELECT
  USING (is_available = true);

CREATE POLICY "Admins can manage availability"
  ON availability FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Clean up old tables after verification
-- DROP TABLE services_old CASCADE;
-- DROP TABLE bookings_old CASCADE;

-- Note: Uncomment the DROP statements after verifying the migration worked correctly