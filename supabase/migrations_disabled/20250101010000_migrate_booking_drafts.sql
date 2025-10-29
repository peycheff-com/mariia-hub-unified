-- Migration: Consolidate booking_drafts into bookings table
-- This migration moves all draft functionality into the main bookings table

-- First, create a backup of booking_drafts
CREATE TABLE booking_drafts_backup AS SELECT * FROM booking_drafts;

-- Update existing drafts in the main bookings table
-- For each draft, create or update a booking with 'draft' status
INSERT INTO bookings (
  user_id,
  service_id,
  status,
  booking_data,
  created_at,
  updated_at,
  metadata
)
SELECT
  bd.user_id,
  bd.service_id::UUID,
  'draft'::booking_status,
  jsonb_build_object(
    'session_id', bd.session_id,
    'service_type', bd.service_type,
    'booking_date', bd.booking_date,
    'booking_time', bd.booking_time,
    'notes', bd.notes,
    'step_completed', bd.step_completed
  ),
  bd.created_at,
  bd.updated_at,
  jsonb_build_object(
    'draft_id', bd.id,
    'migrated_from_drafts', true,
    'migration_date', now()
  )
FROM booking_drafts bd
WHERE NOT EXISTS (
  SELECT 1 FROM bookings b
  WHERE b.metadata->>'session_id' = bd.session_id
    AND b.status = 'draft'
);

-- Create function to manage booking drafts
CREATE OR REPLACE FUNCTION upsert_booking_draft(
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL,
  p_service_id TEXT DEFAULT NULL,
  p_service_type service_type DEFAULT NULL,
  p_booking_date DATE DEFAULT NULL,
  p_booking_time TIME DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_step_completed INTEGER DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_booking_data JSONB;
BEGIN
  -- Build booking data JSON
  v_booking_data := jsonb_build_object(
    'session_id', p_session_id,
    'service_type', p_service_type,
    'booking_date', p_booking_date,
    'booking_time', p_booking_time,
    'notes', p_notes,
    'step_completed', p_step_completed
  );

  -- Upsert the booking
  INSERT INTO bookings (
    user_id,
    service_id,
    status,
    booking_data,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_service_id::UUID,
    'draft',
    v_booking_data,
    jsonb_build_object('session_id', p_session_id),
    now(),
    now()
  )
  ON CONFLICT (metadata->>'session_id') WHERE status = 'draft'
  DO UPDATE SET
    user_id = COALESCE(p_user_id, bookings.user_id),
    service_id = COALESCE(p_service_id::UUID, bookings.service_id),
    booking_data = v_booking_data,
    updated_at = now()
  RETURNING id INTO v_booking_id;

  -- If no conflict, return new ID
  IF v_booking_id IS NULL THEN
    SELECT id INTO v_booking_id
    FROM bookings
    WHERE metadata->>'session_id' = p_session_id
      AND status = 'draft';
  END IF;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get booking draft
CREATE OR REPLACE FUNCTION get_booking_draft(p_session_id TEXT)
RETURNS TABLE (
  booking_id UUID,
  user_id UUID,
  service_id UUID,
  service_type service_type,
  booking_date DATE,
  booking_time TIME,
  notes TEXT,
  step_completed INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.user_id,
    b.service_id,
    (b.booking_data->>'service_type')::service_type,
    (b.booking_data->>'booking_date')::DATE,
    (b.booking_data->>'booking_time')::TIME,
    b.booking_data->>'notes',
    (b.booking_data->>'step_completed')::INTEGER,
    b.created_at,
    b.updated_at
  FROM bookings b
  WHERE b.metadata->>'session_id' = p_session_id
    AND b.status = 'draft';
END;
$$ LANGUAGE plpgsql;

-- Create function to delete booking draft
CREATE OR REPLACE FUNCTION delete_booking_draft(p_session_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM bookings
  WHERE metadata->>'session_id' = p_session_id
    AND status = 'draft';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to promote draft to actual booking
CREATE OR REPLACE FUNCTION promote_draft_to_booking(
  p_session_id TEXT,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_location_type location_type DEFAULT 'studio',
  p_consent_terms BOOLEAN DEFAULT false,
  p_consent_marketing BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_service services%ROWTYPE;
  v_draft_data JSONB;
BEGIN
  -- Get the draft booking
  SELECT b.*, s.* INTO v_booking_id, v_draft_data, v_service
  FROM bookings b
  JOIN services s ON b.service_id = s.id
  WHERE b.metadata->>'session_id' = p_session_id
    AND b.status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft booking not found';
  END IF;

  -- Check availability one more time
  PERFORM 1
  FROM check_slot_availability(
    v_booking_id,
    (v_draft_data->>'booking_date')::DATE,
    (v_draft_data->>'booking_time')::TIME,
    v_service.duration_minutes
  )
  WHERE available = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot no longer available';
  END IF;

  -- Update the booking with actual details
  UPDATE bookings SET
    status = 'pending',
    booking_date = (v_draft_data->>'booking_date')::DATE,
    booking_time = (v_draft_data->>'booking_time')::TIME,
    client_name = p_client_name,
    client_email = p_client_email,
    client_phone = p_client_phone,
    location_type = p_location_type,
    amount_paid = v_service.price_from,
    currency = 'PLN',
    booking_data = jsonb_set(
      jsonb_set(
        jsonb_set(
          v_draft_data,
          '{client_name}',
          to_jsonb(p_client_name)
        ),
        '{client_email}',
        to_jsonb(p_client_email)
      ),
      '{client_phone}',
      to_jsonb(p_client_phone)
    ),
    metadata = jsonb_set(
      b.metadata,
      '{consent_terms}',
      to_jsonb(p_consent_terms)
    ),
    updated_at = now()
  WHERE id = v_booking_id
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Create index for efficient draft lookups
CREATE INDEX idx_bookings_session_draft ON bookings (
  (metadata->>'session_id')
) WHERE status = 'draft';

-- Create index for user drafts
CREATE INDEX idx_bookings_user_drafts ON bookings (
  user_id
) WHERE status = 'draft';

-- Add RLS policy for draft management
CREATE POLICY "Users can manage own drafts"
  ON bookings FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      (user_id = auth.uid() AND status = 'draft') OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- Clean up old booking_drafts table after verification
-- DROP TABLE IF EXISTS booking_drafts;
-- DROP TABLE IF EXISTS booking_drafts_backup;

-- Note: Uncomment the DROP statements after verifying the migration worked correctly

-- Create view for draft management in admin
CREATE VIEW admin_booking_drafts AS
SELECT
  b.id,
  b.user_id,
  u.email as user_email,
  b.service_id,
  s.title as service_title,
  s.service_type,
  (b.booking_data->>'booking_date')::DATE as booking_date,
  (b.booking_data->>'booking_time')::TIME as booking_time,
  (b.booking_data->>'step_completed')::INTEGER as step_completed,
  b.created_at,
  b.updated_at,
  CASE
    WHEN b.updated_at < now() - interval '24 hours' THEN true
    ELSE false
  END as is_expired
FROM bookings b
LEFT JOIN auth.users u ON b.user_id = u.id
JOIN services s ON b.service_id = s.id
WHERE b.status = 'draft'
ORDER BY b.updated_at DESC;