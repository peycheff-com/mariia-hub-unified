-- Migration: Simplify availability_slots using range types
-- This migration converts the day-of-week based slots to continuous time ranges

-- First, create a backup
CREATE TABLE availability_slots_backup AS SELECT * FROM availability_slots;

-- Create a function to generate weekly availability from the old structure
CREATE OR REPLACE FUNCTION generate_weekly_availability()
RETURNS void AS $$
DECLARE
  slot_record RECORD;
  start_date DATE;
  end_date DATE;
  range_start TIMESTAMPTZ;
  range_end TIMESTAMPTZ;
  v_service_type service_type;
  v_location_type location_type;
BEGIN
  -- Generate availability for the next 12 weeks
  FOR slot_record IN
    SELECT * FROM availability_slots_old
    WHERE is_available = true
    ORDER BY day_of_week, start_time
  LOOP
    -- Set service and location types
    v_service_type := slot_record.service_type::service_type;
    v_location_type := slot_record.location::location_type;

    -- Generate for the next 12 weeks
    FOR week_offset IN 0..11 LOOP
      -- Calculate the date for this day of the week
      start_date := date_trunc('week', current_date)
                     + (slot_record.day_of_week || ' days')::interval
                     + (week_offset || ' weeks')::interval;

      -- Create timestamp range
      range_start := start_date + slot_record.start_time;
      range_end := start_date + slot_record.end_time;

      -- Insert into new availability table
      INSERT INTO availability (
        service_type,
        time_range,
        location_type,
        is_available,
        notes,
        created_at,
        updated_at
      ) VALUES (
        v_service_type,
        TSTZRANGE(range_start, range_end, '[)'),
        v_location_type,
        true,
        slot_record.notes,
        now(),
        now()
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration if old table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'availability_slots_old') THEN
    PERFORM generate_weekly_availability();
  END IF;
END $$;

-- Create function to add recurring availability
CREATE OR REPLACE FUNCTION add_recurring_availability(
  p_service_type service_type,
  p_day_of_week INTEGER, -- 0 = Sunday, 1 = Monday, etc.
  p_start_time TIME,
  p_end_time TIME,
  p_location_type location_type,
  p_weeks_ahead INTEGER DEFAULT 12,
  p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_range_start TIMESTAMPTZ;
  v_range_end TIMESTAMPTZ;
  v_count INTEGER := 0;
  week_offset INTEGER;
BEGIN
  -- Generate for the specified number of weeks
  FOR week_offset IN 0..p_weeks_ahead-1 LOOP
    -- Calculate the date for this day of the week
    v_start_date := date_trunc('week', current_date)
                   + (p_day_of_week || ' days')::interval
                   + (week_offset || ' weeks')::interval;

    -- Create timestamp range
    v_range_start := v_start_date + p_start_time;
    v_range_end := v_start_date + p_end_time;

    -- Insert into availability table
    INSERT INTO availability (
      service_type,
      time_range,
      location_type,
      is_available,
      notes,
      created_at,
      updated_at
    ) VALUES (
      p_service_type,
      TSTZRANGE(v_range_start, v_range_end, '[)'),
      p_location_type,
      true,
      p_notes,
      now(),
      now()
    ) ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get available slots for a service
CREATE OR REPLACE FUNCTION get_available_slots(
  p_service_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  p_location_type location_type DEFAULT 'studio'
)
RETURNS TABLE (
  slot_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  available BOOLEAN,
  conflict_reason TEXT,
  booking_count INTEGER
) AS $$
DECLARE
  v_service services%ROWTYPE;
BEGIN
  -- Get service details
  SELECT * INTO v_service
  FROM services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  -- Return available slots with conflict checking
  RETURN QUERY
  WITH service_slots AS (
    SELECT
      a.id,
      a.time_range,
      a.is_available,
      a.notes
    FROM availability a
    WHERE a.service_type = v_service.service_type
      AND a.location_type = p_location_type
      AND a.is_available = true
      AND TSTZRANGE(
        (p_start_date || ' 00:00')::timestamptz,
        (p_end_date || ' 23:59')::timestamptz,
        '[]'
      ) && a.time_range
  ),
  bookings_conflicts AS (
    SELECT
      TSTZRANGE(
        (b.booking_date || ' ' || b.booking_time)::timestamptz,
        (b.booking_date || ' ' || b.booking_time)::timestamptz +
          (v_service.duration_minutes || ' minutes')::interval,
        '[)'
      ) as booking_range
    FROM bookings b
    WHERE b.service_id = p_service_id
      AND b.booking_date BETWEEN p_start_date AND p_end_date
      AND b.status IN ('pending', 'confirmed')
  ),
  holds_conflicts AS (
    SELECT time_range
    FROM holds h
    WHERE h.service_id = p_service_id
      AND h.expires_at > now()
  ),
  block_conflicts AS (
    SELECT time_range
    FROM calendar_blocks cb
  )
  SELECT
    ss.id,
    lower(ss.time_range) as start_time,
    upper(ss.time_range) as end_time,
    NOT (
      EXISTS (SELECT 1 FROM bookings_conflicts bc WHERE bc.booking_range && ss.time_range) OR
      EXISTS (SELECT 1 FROM holds_conflicts hc WHERE hc.time_range && ss.time_range) OR
      EXISTS (SELECT 1 FROM block_conflicts bc2 WHERE bc2.time_range && ss.time_range)
    ) as available,
    CASE
      WHEN EXISTS (SELECT 1 FROM bookings_conflicts bc WHERE bc.booking_range && ss.time_range)
        THEN 'Already booked'
      WHEN EXISTS (SELECT 1 FROM holds_conflicts hc WHERE hc.time_range && ss.time_range)
        THEN 'Temporarily reserved'
      WHEN EXISTS (SELECT 1 FROM block_conflicts bc2 WHERE bc2.time_range && ss.time_range)
        THEN 'Blocked'
      ELSE NULL
    END as conflict_reason,
    (
      SELECT COUNT(*)
      FROM bookings_conflicts bc
      WHERE bc.booking_range && ss.time_range
    ) as booking_count
  FROM service_slots ss
  ORDER BY lower(ss.time_range);
END;
$$ LANGUAGE plpgsql;

-- Create function to book a specific slot
CREATE OR REPLACE FUNCTION book_slot(
  p_slot_id UUID,
  p_user_id UUID,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_slot availability%ROWTYPE;
  v_service services%ROWTYPE;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_available BOOLEAN;
  v_conflict_reason TEXT;
BEGIN
  -- Get the slot details
  SELECT * INTO v_slot
  FROM availability
  WHERE id = p_slot_id AND is_available = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found or unavailable';
  END IF;

  -- Get service type from slot
  -- For this simplified version, we'll assume the first service of this type
  SELECT * INTO v_service
  FROM services
  WHERE service_type = v_slot.service_type
    AND is_active = true
  ORDER BY display_order, title
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active service found for this slot type';
  END IF;

  -- Extract times from range
  v_start_time := lower(v_slot.time_range);
  v_end_time := upper(v_slot.time_range);

  -- Check availability
  SELECT available, conflict_reason INTO v_available, v_conflict_reason
  FROM check_slot_availability(
    v_service.id,
    v_start_time::DATE,
    v_start_time::TIME,
    v_service.duration_minutes
  );

  IF NOT v_available THEN
    RAISE EXCEPTION 'Slot no longer available: %', v_conflict_reason;
  END IF;

  -- Create the booking
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
    v_service.id,
    'pending',
    v_start_time::DATE,
    v_start_time::TIME,
    p_client_name,
    p_client_email,
    p_client_phone,
    v_slot.location_type,
    v_service.price_from,
    'PLN',
    jsonb_build_object(
      'slot_id', p_slot_id,
      'notes', p_notes,
      'duration_minutes', v_service.duration_minutes
    )
  ) RETURNING id INTO v_booking_id;

  -- Remove the availability slot
  DELETE FROM availability WHERE id = p_slot_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for availability calendar
CREATE VIEW availability_calendar AS
SELECT
  id,
  service_type,
  lower(time_range) as start_time,
  upper(time_range) as end_time,
  location_type,
  is_available,
  notes,
  DATE_TRUNC('day', lower(time_range)) as calendar_date,
  EXTRACT(HOUR FROM lower(time_range)) as start_hour,
  EXTRACT(MINUTE FROM lower(time_range)) as start_minute,
  EXTRACT(HOUR FROM upper(time_range)) as end_hour,
  EXTRACT(MINUTE FROM upper(time_range)) as end_minute
FROM availability
WHERE is_available = true
  AND time_range > now()
ORDER BY lower(time_range);

-- Create view for weekly availability (admin)
CREATE VIEW weekly_availability AS
SELECT
  service_type,
  location_type,
  EXTRACT(DOW FROM lower(time_range)) as day_of_week,
  lower(time_range) as start_time,
  upper(time_range) as end_time,
  COUNT(*) as slot_count,
  is_available,
  notes
FROM availability
WHERE time_range >= date_trunc('week', current_date)
  AND time_range < date_trunc('week', current_date) + INTERVAL '1 week'
GROUP BY
  service_type,
  location_type,
  EXTRACT(DOW FROM lower(time_range)),
  lower(time_range),
  upper(time_range),
  is_available,
  notes
ORDER BY
  service_type,
  location_type,
  day_of_week,
  start_time;

-- Add indexes for better performance
CREATE INDEX idx_availability_calendar_date ON availability_calendar (calendar_date);
CREATE INDEX idx_availability_calendar_service ON availability_calendar (service_type, location_type);

-- Create trigger to auto-generate weekly availability
CREATE OR REPLACE FUNCTION auto_generate_weekly_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- This trigger can be called to ensure we always have availability
  -- for the next X weeks
  PERFORM add_recurring_availability(
    'beauty'::service_type,
    1, -- Monday
    '09:00'::TIME,
    '17:00'::TIME,
    'studio'::location_type,
    12, -- 12 weeks
    'Auto-generated beauty hours'
  );

  PERFORM add_recurring_availability(
    'fitness'::service_type,
    1, -- Monday
    '06:00'::TIME,
    '20:00'::TIME,
    'fitness'::location_type,
    12, -- 12 weeks
    'Auto-generated fitness hours'
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Schedule auto-generation (runs weekly on Sunday at midnight)
SELECT cron.schedule(
  'generate-weekly-availability',
  '0 0 * * 0', -- Every Sunday at midnight
  'SELECT auto_generate_weekly_availability();'
);

-- Clean up after verification
-- DROP TABLE IF EXISTS availability_slots_old CASCADE;
-- DROP TABLE IF EXISTS availability_slots_backup;

-- Note: Uncomment the DROP statements after verifying the migration worked correctly