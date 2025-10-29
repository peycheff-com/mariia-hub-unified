-- Capacity Management for Availability
-- Implement proper capacity tracking for time-based availability slots

-- First, let's ensure the availability table has the necessary columns
ALTER TABLE availability
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id),
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES auth.users(id);

-- Add index for efficient capacity queries
CREATE INDEX IF NOT EXISTS idx_availability_service_time
  ON availability(service_id, time_range)
  WHERE service_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_availability_provider_time
  ON availability(provider_id, time_range)
  WHERE provider_id IS NOT NULL;

-- Update existing availability records to set service_id based on service_type
UPDATE availability a
SET service_id = s.id
FROM services s
WHERE a.service_id IS NULL
  AND a.service_type = s.service_type
  AND s.is_active = true;

-- Function to check availability with capacity
CREATE OR REPLACE FUNCTION check_availability_capacity(
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_group_size INTEGER DEFAULT 1
)
RETURNS TABLE (
  available BOOLEAN,
  availability_id UUID,
  remaining_capacity INTEGER,
  total_capacity INTEGER,
  conflict_reason TEXT
) AS $$
DECLARE
  v_availability RECORD;
  v_current_bookings INTEGER;
  v_capacity INTEGER;
  v_service services%ROWTYPE;
BEGIN
  -- Get service details
  SELECT * INTO v_service
  FROM services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL, 0, 0, 'Service not found or inactive'::TEXT;
    RETURN;
  END IF;

  -- Find matching availability slot
  SELECT * INTO v_availability
  FROM availability
  WHERE (service_id = p_service_id OR service_type = v_service.service_type)
    AND time_range @> TSTZRANGE(p_start_time, p_end_time, '[)')
    AND is_available = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL, 0, 0, 'No availability found for this time'::TEXT;
    RETURN;
  END IF;

  -- Get capacity settings
  v_capacity := COALESCE(v_availability.capacity, 1);

  -- Count current bookings for this time slot
  SELECT COUNT(*) INTO v_current_bookings
  FROM booking_calendar bc
  WHERE bc.booking_range && TSTZRANGE(p_start_time, p_end_time, '[)')
    AND bc.status IN ('pending', 'confirmed');

  -- Check if capacity allows the booking
  IF v_current_bookings + p_group_size <= v_capacity THEN
    RETURN QUERY SELECT
      true,
      v_availability.id,
      v_capacity - v_current_bookings - p_group_size,
      v_capacity,
      NULL::TEXT;
  ELSE
    RETURN QUERY SELECT
      false,
      v_availability.id,
      0,
      v_capacity,
      format('Insufficient capacity: %s booked, %s requested, %s total',
             v_current_bookings, p_group_size, v_capacity)::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update current bookings count for a time slot
CREATE OR REPLACE FUNCTION update_slot_booking_count(
  p_availability_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS void AS $$
DECLARE
  v_booking_count INTEGER;
BEGIN
  -- Count current bookings
  SELECT COUNT(*) INTO v_booking_count
  FROM booking_calendar bc
  WHERE bc.booking_range && TSTZRANGE(p_start_time, p_end_time, '[)')
    AND bc.status IN ('pending', 'confirmed');

  -- Update the availability record
  UPDATE availability
  SET current_bookings = v_booking_count
  WHERE id = p_availability_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update booking counts
CREATE OR REPLACE FUNCTION trigger_update_booking_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Find the availability slot for this booking
  UPDATE availability a
  SET current_bookings = (
    SELECT COUNT(*)
    FROM booking_calendar bc
    WHERE bc.booking_range && a.time_range
      AND bc.status IN ('pending', 'confirmed')
  )
  WHERE a.time_range @> NEW.booking_range;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for booking count updates
DROP TRIGGER IF EXISTS update_availability_on_booking_insert ON bookings;
CREATE TRIGGER update_availability_on_booking_insert
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_booking_count();

DROP TRIGGER IF EXISTS update_availability_on_booking_update ON bookings;
CREATE TRIGGER update_availability_on_booking_update
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (OLD.status != NEW.status OR OLD.booking_date != NEW.booking_date OR OLD.booking_time != NEW.booking_time)
  EXECUTE FUNCTION trigger_update_booking_count();

DROP TRIGGER IF EXISTS update_availability_on_booking_delete ON bookings;
CREATE TRIGGER update_availability_on_booking_delete
  AFTER DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_booking_count();

-- Function to get available slots with capacity information
CREATE OR REPLACE FUNCTION get_available_slots_with_capacity(
  p_service_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
  availability_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  capacity INTEGER,
  current_bookings INTEGER,
  available_spots INTEGER,
  is_fully_booked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    LOWER(a.time_range) as start_time,
    UPPER(a.time_range) as end_time,
    COALESCE(a.capacity, 1) as capacity,
    COALESCE(a.current_bookings, 0) as current_bookings,
    GREATEST(COALESCE(a.capacity, 1) - COALESCE(a.current_bookings, 0), 0) as available_spots,
    (COALESCE(a.capacity, 1) <= COALESCE(a.current_bookings, 0)) as is_fully_booked
  FROM availability a
  WHERE (a.service_id = p_service_id OR a.service_type = (SELECT service_type FROM services WHERE id = p_service_id))
    AND a.time_range && TSTZRANGE(p_date, p_date + INTERVAL '1 day', '[)')
    AND a.is_available = true
    AND EXTRACT(EPOCH FROM (UPPER(a.time_range) - LOWER(a.time_range))) / 60 >= p_duration_minutes
  ORDER BY LOWER(a.time_range);
END;
$$ LANGUAGE plpgsql;

-- Function for admins to set capacity for specific slots
CREATE OR REPLACE FUNCTION set_slot_capacity(
  p_availability_id UUID,
  p_capacity INTEGER,
  p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN DEFAULT false;
BEGIN
  -- Check if user is admin (if admin_id provided)
  IF p_admin_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM profiles
      WHERE id = p_admin_id AND role = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Admin privileges required';
    END IF;
  END IF;

  -- Validate capacity
  IF p_capacity < 1 OR p_capacity > 50 THEN
    RAISE EXCEPTION 'Capacity must be between 1 and 50';
  END IF;

  -- Update the capacity
  UPDATE availability
  SET capacity = p_capacity,
      updated_at = now()
  WHERE id = p_availability_id;

  -- Recalculate current bookings
  UPDATE availability
  SET current_bookings = (
    SELECT COUNT(*)
    FROM booking_calendar bc
    WHERE bc.booking_range && availability.time_range
      AND bc.status IN ('pending', 'confirmed')
  )
  WHERE id = p_availability_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk update capacity for recurring slots
CREATE OR REPLACE FUNCTION bulk_update_capacity(
  p_service_id UUID,
  p_day_of_week INTEGER,
  p_start_time TIME,
  p_end_time TIME,
  p_new_capacity INTEGER,
  p_admin_id UUID DEFAULT NULL,
  p_weeks_ahead INTEGER DEFAULT 12
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER DEFAULT 0;
  v_is_admin BOOLEAN DEFAULT false;
  v_service services%ROWTYPE;
  v_slot_date DATE;
  v_start_tz TIMESTAMPTZ;
  v_end_tz TIMESTAMPTZ;
BEGIN
  -- Check admin privileges
  IF p_admin_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM profiles
      WHERE id = p_admin_id AND role = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Admin privileges required';
    END IF;
  END IF;

  -- Get service info
  SELECT * INTO v_service
  FROM services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;

  -- Validate capacity
  IF p_new_capacity < 1 OR p_new_capacity > 50 THEN
    RAISE EXCEPTION 'Capacity must be between 1 and 50';
  END IF;

  -- Update slots for the next N weeks
  FOR week_offset IN 0..p_weeks_ahead - 1 LOOP
    -- Calculate date for this day of week
    v_slot_date := date_trunc('week', current_date)
                   + (p_day_of_week || ' days')::interval
                   + (week_offset || ' weeks')::interval;

    -- Create timestamp range
    v_start_tz := v_slot_date + p_start_time;
    v_end_tz := v_slot_date + p_end_time;

    -- Update matching availability slots
    UPDATE availability
    SET capacity = p_new_capacity,
        updated_at = now()
    WHERE service_type = v_service.service_type
      AND time_range @> TSTZRANGE(v_start_tz, v_end_tz, '[)');

    v_updated_count := v_updated_count + ROW_COUNT;
  END LOOP;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create view for capacity utilization reporting
CREATE OR REPLACE VIEW availability_capacity_report AS
SELECT
  s.id as service_id,
  s.title as service_title,
  s.service_type,
  DATE_TRUNC('day', LOWER(a.time_range)) as date,
  EXTRACT(HOUR FROM LOWER(a.time_range)) as hour,
  COUNT(*) as total_slots,
  SUM(COALESCE(a.capacity, 1)) as total_capacity,
  SUM(COALESCE(a.current_bookings, 0)) as total_bookings,
  ROUND(
    (SUM(COALESCE(a.current_bookings, 0))::NUMERIC /
     NULLIF(SUM(COALESCE(a.capacity, 1)), 0)) * 100, 2
  ) as utilization_percentage,
  SUM(CASE WHEN COALESCE(a.capacity, 1) > COALESCE(a.current_bookings, 0)
           THEN COALESCE(a.capacity, 1) - COALESCE(a.current_bookings, 0)
           ELSE 0 END) as available_spots
FROM availability a
JOIN services s ON a.service_type = s.service_type
WHERE a.is_available = true
  AND LOWER(a.time_range) >= CURRENT_DATE - INTERVAL '7 days'
  AND LOWER(a.time_range) < CURRENT_DATE + INTERVAL '30 days'
GROUP BY
  s.id, s.title, s.service_type,
  DATE_TRUNC('day', LOWER(a.time_range)),
  EXTRACT(HOUR FROM LOWER(a.time_range))
ORDER BY
  DATE_TRUNC('day', LOWER(a.time_range)),
  EXTRACT(HOUR FROM LOWER(a.time_range));

-- Row Level Security for new functions
-- No additional RLS needed as it works through existing tables

COMMENT ON TABLE availability IS 'Enhanced with capacity management for multiple bookings per time slot';
COMMENT ON FUNCTION check_availability_capacity IS 'Check if a time slot has enough capacity for a booking';
COMMENT ON FUNCTION get_available_slots_with_capacity IS 'Get available slots with capacity information';
COMMENT ON FUNCTION set_slot_capacity IS 'Admin function to set capacity for a specific slot';
COMMENT ON FUNCTION bulk_update_capacity IS 'Admin function to update capacity for recurring slots';
COMMENT ON VIEW availability_capacity_report IS 'Capacity utilization reporting view';