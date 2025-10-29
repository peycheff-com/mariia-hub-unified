-- Basic Schema Migration
-- Creates core tables that the application depends on

-- Helper function for role checking (must be defined before use in RLS policies)
CREATE OR REPLACE FUNCTION has_role(user_id uuid, role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND profiles.role = role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Custom types
CREATE TYPE location_type AS ENUM ('studio', 'mobile', 'online', 'salon');
CREATE TYPE booking_status AS ENUM ('draft', 'pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'partially_refunded', 'failed');
CREATE TYPE service_type AS ENUM ('beauty', 'fitness', 'lifestyle');

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  service_type service_type NOT NULL,
  category TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PLN',
  location_type location_type DEFAULT 'studio',
  is_active BOOLEAN DEFAULT true,
  requires_deposit BOOLEAN DEFAULT false,
  deposit_percentage DECIMAL(5,2) DEFAULT 20,
  max_capacity INTEGER DEFAULT 1,
  buffer_minutes INTEGER DEFAULT 0,
  tags TEXT[],
  images TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Availability slots table
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_type location_type DEFAULT 'studio',
  capacity INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, date, start_time)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES services(id),
  user_id UUID REFERENCES auth.users(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_type location_type DEFAULT 'studio',
  status booking_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PLN',
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  notes TEXT,
  preferences JSONB DEFAULT '{}',
  booking_data JSONB DEFAULT '{}', -- For draft booking data and additional metadata
  stripe_payment_intent_id TEXT,
  external_booking_id TEXT, -- For Booksy sync
  external_source TEXT, -- 'booksy', 'manual', etc.
  metadata JSONB DEFAULT '{}', -- Additional metadata for the booking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Service content table
CREATE TABLE IF NOT EXISTS service_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('preparation', 'aftercare', 'expectations', 'faq', 'contraindications')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Service gallery table
CREATE TABLE IF NOT EXISTS service_gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES services(id),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_public BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false, -- Verified that the user actually had the service
  helpful_count INTEGER DEFAULT 0,
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Booking drafts for session persistence
CREATE TABLE IF NOT EXISTS booking_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  service_id UUID REFERENCES services(id),
  service_type service_type, -- For backward compatibility
  booking_date DATE, -- For backward compatibility
  booking_time TIME, -- For backward compatibility
  selected_date DATE,
  selected_time TIME,
  client_data JSONB DEFAULT '{}',
  notes TEXT,
  step_completed INTEGER DEFAULT 1, -- For backward compatibility
  current_step INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

-- Hold table to prevent double bookings
CREATE TABLE IF NOT EXISTS holds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES services(id),
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, date, time_slot)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_type ON services(service_type);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_availability_service_date ON availability_slots(service_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_available ON availability_slots(is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_booking_drafts_session ON booking_drafts(session_id);
CREATE INDEX IF NOT EXISTS idx_holds_expires ON holds(expires_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON availability_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_content_updated_at BEFORE UPDATE ON service_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_gallery_updated_at BEFORE UPDATE ON service_gallery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_drafts_updated_at BEFORE UPDATE ON booking_drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_drafts ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
-- Services
CREATE POLICY "Anyone can view active services" ON services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all services" ON services
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all bookings" ON bookings
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own bookings" ON bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Reviews
CREATE POLICY "Anyone can view public reviews" ON reviews
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own reviews" ON reviews
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own reviews" ON reviews
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Booking drafts
CREATE POLICY "Users can manage own booking drafts" ON booking_drafts
    FOR ALL USING (session_id::text = current_setting('app.session_id', true));

