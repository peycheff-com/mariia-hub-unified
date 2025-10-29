-- Add fields to support hybrid Booksy mirroring model
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS mirror_status text DEFAULT 'pending' CHECK (mirror_status IN ('pending', 'mirrored', 'attention', 'cancelled')),
ADD COLUMN IF NOT EXISTS mirror_notes text,
ADD COLUMN IF NOT EXISTS mirrored_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS mirrored_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS booksy_appointment_id text,
ADD COLUMN IF NOT EXISTS external_calendar_event_id text,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS booking_source text DEFAULT 'site' CHECK (booking_source IN ('site', 'booksy', 'calendly')),
ADD COLUMN IF NOT EXISTS client_phone text,
ADD COLUMN IF NOT EXISTS client_name text,
ADD COLUMN IF NOT EXISTS client_email text,
ADD COLUMN IF NOT EXISTS language_preference text DEFAULT 'pl' CHECK (language_preference IN ('pl', 'en', 'ua', 'ru'));

-- Create index for mirror queue queries
CREATE INDEX IF NOT EXISTS idx_bookings_mirror_status ON bookings(mirror_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);

-- Add booking type to distinguish beauty vs fitness
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booking_type text DEFAULT 'beauty' CHECK (booking_type IN ('beauty', 'fitness'));

-- Create event log table for tracking booking lifecycle
CREATE TABLE IF NOT EXISTS booking_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('created', 'payment_received', 'mirrored', 'confirmed', 'cancelled', 'rescheduled', 'completed', 'no_show')),
  event_data jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_booking_event_log_booking_id ON booking_event_log(booking_id, created_at DESC);

-- Enable RLS on event log
ALTER TABLE booking_event_log ENABLE ROW LEVEL SECURITY;

-- Admins can manage event log
CREATE POLICY "Admins can manage event log"
ON booking_event_log
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Users can view their own booking events
CREATE POLICY "Users can view own booking events"
ON booking_event_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_event_log.booking_id
    AND bookings.user_id = auth.uid()
  )
);

-- Create consent tracking table
CREATE TABLE IF NOT EXISTS user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  email text,
  whatsapp_opt_in boolean DEFAULT false,
  sms_opt_in boolean DEFAULT false,
  email_marketing_opt_in boolean DEFAULT false,
  consent_given_at timestamp with time zone DEFAULT now() NOT NULL,
  consent_ip text,
  language_preference text DEFAULT 'pl',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_phone ON user_consents(phone);

-- Enable RLS on consents
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Admins can manage consents
CREATE POLICY "Admins can manage consents"
ON user_consents
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Users can manage their own consents
CREATE POLICY "Users can manage own consents"
ON user_consents
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to log booking events
CREATE OR REPLACE FUNCTION log_booking_event(
  p_booking_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO booking_event_log (booking_id, event_type, event_data, created_by, notes)
  VALUES (p_booking_id, p_event_type, p_event_data, auth.uid(), p_notes)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Trigger to update updated_at on consents
CREATE TRIGGER update_user_consents_updated_at
BEFORE UPDATE ON user_consents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();