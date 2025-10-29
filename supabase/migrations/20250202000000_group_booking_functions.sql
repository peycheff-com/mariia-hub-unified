-- Group Booking Database Functions
-- Additional functions to support group booking operations

-- Function to check group booking availability across multiple dates
CREATE OR REPLACE FUNCTION check_group_booking_availability(
  p_service_id UUID,
  p_group_size INTEGER DEFAULT 2,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  p_location_type location_type DEFAULT 'studio'
)
RETURNS TABLE (
  slot_date DATE,
  available_times JSONB,
  max_capacity INTEGER,
  allows_groups BOOLEAN,
  max_group_size INTEGER,
  base_price NUMERIC(10, 2)
) AS $$
DECLARE
  v_service services%ROWTYPE;
  v_current_date DATE;
BEGIN
  -- Get service details
  SELECT * INTO v_service
  FROM services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  -- Create temporary table for results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_group_availability (
    slot_date DATE,
    available_times JSONB,
    max_capacity INTEGER,
    allows_groups BOOLEAN,
    max_group_size INTEGER,
    base_price NUMERIC(10, 2)
  ) ON COMMIT DROP;

  -- Check each date in the range
  FOR v_current_date IN p_start_date..p_end_date LOOP
    -- Skip past dates
    IF v_current_date < CURRENT_DATE THEN
      CONTINUE;
    END IF;

    DECLARE
      v_times JSONB := '[]'::JSONB;
      v_time_record RECORD;
      v_available_slots JSONB := '[]'::JSONB;
    BEGIN
      -- Check each time slot (30-minute intervals from 8 AM to 8 PM)
      FOR v_time_record IN
        SELECT
          generate_series AS slot_time,
          (generate_series + (v_service.duration_minutes || ' minutes')::INTERVAL) AS end_time
        FROM generate_series(
          '08:00'::TIME,
          '20:00'::TIME - (v_service.duration_minutes || ' minutes')::INTERVAL,
          '30 minutes'::INTERVAL
        )
      LOOP
        -- Check availability for this time slot
        PERFORM 1
        FROM availability
        WHERE service_type = v_service.service_type
          AND time_range @> TSTZRANGE(
            (v_current_date || ' ' || v_time_record.slot_time)::TIMESTAMPTZ,
            (v_current_date || ' ' || v_time_record.end_time)::TIMESTAMPTZ,
            '[)'
          )
          AND is_available = true
          AND (
            capacity IS NULL OR
            (capacity - COALESCE(current_bookings, 0)) >= p_group_size
          )
          AND (
            NOT allows_groups OR
            (max_group_size IS NULL OR max_group_size >= p_group_size)
          );

        IF FOUND THEN
          -- Add available time to results
          v_times := v_times || jsonb_build_object(
            'time', v_time_record.slot_time,
            'available', true,
            'remaining_capacity', GREATEST(
              COALESCE((
                SELECT capacity - current_bookings
                FROM availability
                WHERE service_type = v_service.service_type
                  AND time_range @> TSTZRANGE(
                    (v_current_date || ' ' || v_time_record.slot_time)::TIMESTAMPTZ,
                    (v_current_date || ' ' || v_time_record.end_time)::TIMESTAMPTZ,
                    '[)'
                  )
                LIMIT 1
              ), 1) - p_group_size,
              0
            )
          );
        END IF;
      END LOOP;

      -- Add date to results if there are available times
      IF jsonb_array_length(v_times) > 0 THEN
        INSERT INTO temp_group_availability VALUES (
          v_current_date,
          v_times,
          COALESCE((
            SELECT capacity
            FROM availability
            WHERE service_type = v_service.service_type
              AND date_trunc('day', time_range) = v_current_date
            LIMIT 1
          ), 10),
          COALESCE((
            SELECT allows_groups
            FROM availability
            WHERE service_type = v_service.service_type
              AND date_trunc('day', time_range) = v_current_date
            LIMIT 1
          ), true),
          COALESCE((
            SELECT max_group_size
            FROM availability
            WHERE service_type = v_service.service_type
              AND date_trunc('day', time_range) = v_current_date
            LIMIT 1
          ), v_service.max_group_size),
          v_service.price_from
        );
      END IF;
    END;
  END LOOP;

  -- Return results
  RETURN QUERY
  SELECT *
  FROM temp_group_availability
  ORDER BY slot_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate group booking pricing with discounts
CREATE OR REPLACE FUNCTION calculate_group_booking_pricing(
  p_service_id UUID,
  p_group_size INTEGER DEFAULT 2,
  p_booking_date DATE,
  p_booking_time TIME,
  p_base_price_per_person NUMERIC(10, 2)
)
RETURNS TABLE (
  base_price_per_person NUMERIC(10, 2),
  total_price NUMERIC(10, 2),
  discount_percentage NUMERIC(5, 2),
  discount_amount NUMERIC(10, 2),
  applied_pricing_rules JSONB
) AS $$
DECLARE
  v_service services%ROWTYPE;
  v_base_total NUMERIC(10, 2);
  v_final_price NUMERIC(10, 2);
  v_discount_percentage NUMERIC(5, 2) DEFAULT 0;
  v_discount_amount NUMERIC(10, 2) DEFAULT 0;
  v_applied_rules JSONB DEFAULT '[]'::JSONB;
  v_rule RECORD;
BEGIN
  -- Get service details
  SELECT * INTO v_service
  FROM services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;

  -- Calculate base pricing
  v_base_total := p_base_price_per_person * p_group_size;
  v_final_price := v_base_total;

  -- Apply automatic group discounts
  IF p_group_size >= 10 THEN
    v_discount_percentage := 15.0;
  ELSIF p_group_size >= 5 THEN
    v_discount_percentage := 10.0;
  ELSIF p_group_size >= 3 THEN
    v_discount_percentage := 5.0;
  END IF;

  -- Apply additional pricing rules from database
  FOR v_rule IN
    SELECT * FROM pricing_rules
    WHERE service_id = p_service_id
      AND is_active = true
      AND (valid_from IS NULL OR p_booking_date >= valid_from)
      AND (valid_until IS NULL OR p_booking_date <= valid_until)
      AND (min_group_size IS NULL OR p_group_size >= min_group_size)
      AND (max_group_size IS NULL OR p_group_size <= max_group_size)
      AND rule_type = 'group_discount'
    ORDER BY priority DESC
  LOOP
    DECLARE
      v_rule_discount NUMERIC(5, 2);
    BEGIN
      v_rule_discount := COALESCE(
        (v_rule.configuration->>'discount_percentage')::NUMERIC,
        0
      );

      -- Use the higher discount between automatic and rule-based
      IF v_rule_discount > v_discount_percentage THEN
        v_discount_percentage := v_rule_discount;
      END IF;

      v_applied_rules := v_applied_rules || jsonb_build_object(
        'rule_id', v_rule.id,
        'rule_type', v_rule.rule_type,
        'discount_percentage', v_rule_discount,
        'description', v_rule.description
      );
    END;
  END LOOP;

  -- Calculate final discount and price
  v_discount_amount := v_base_total * (v_discount_percentage / 100);
  v_final_price := v_base_total - v_discount_amount;

  -- Ensure minimum price (50% of base price)
  v_final_price := GREATEST(v_final_price, v_base_total * 0.5);

  RETURN QUERY SELECT
    p_base_price_per_person,
    v_final_price,
    v_discount_percentage,
    v_discount_amount,
    v_applied_rules;
END;
$$ LANGUAGE plpgsql;

-- Function to create group booking with transaction support
CREATE OR REPLACE FUNCTION create_group_booking_transaction(
  p_group_name TEXT,
  p_group_size INTEGER,
  p_primary_contact_name TEXT,
  p_primary_contact_email TEXT,
  p_primary_contact_phone TEXT,
  p_service_id UUID,
  p_booking_date DATE,
  p_booking_time TIME,
  p_location_type location_type DEFAULT 'studio',
  p_base_price_per_person NUMERIC(10, 2),
  p_discount_percentage NUMERIC(5, 2) DEFAULT 0,
  p_total_price NUMERIC(10, 2),
  p_deposit_required BOOLEAN DEFAULT false,
  p_deposit_amount NUMERIC(10, 2) DEFAULT 0,
  p_participants JSONB DEFAULT '[]'::JSONB,
  p_special_requests TEXT DEFAULT NULL,
  p_consent_marketing BOOLEAN DEFAULT false,
  p_payment_method TEXT DEFAULT 'card',
  p_creator_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  group_booking_id UUID,
  booking_ids JSONB,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_group_booking_id UUID;
  v_booking_ids JSONB := '[]'::JSONB;
  v_participant JSONB;
  v_booking_id UUID;
  v_participant_index INTEGER := 0;
  v_service services%ROWTYPE;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
BEGIN
  -- Validate inputs
  IF p_group_size < 2 THEN
    RETURN QUERY SELECT NULL, NULL, false, 'Group size must be at least 2'::TEXT;
    RETURN;
  END IF;

  IF jsonb_array_length(p_participants) != p_group_size THEN
    RETURN QUERY SELECT NULL, NULL, false, 'Number of participants must match group size'::TEXT;
    RETURN;
  END IF;

  -- Get service details
  SELECT * INTO v_service
  FROM services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL, NULL, false, 'Service not found or inactive'::TEXT;
    RETURN;
  END IF;

  -- Calculate time range
  v_start_time := (p_booking_date || ' ' || p_booking_time)::TIMESTAMPTZ;
  v_end_time := v_start_time + (v_service.duration_minutes || ' minutes')::INTERVAL;

  -- Check capacity and availability
  PERFORM 1
  FROM check_slot_availability_with_capacity(
    p_service_id,
    p_booking_date,
    p_booking_time,
    v_service.duration_minutes,
    p_group_size
  ) AS availability
  WHERE availability.available = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL, NULL, false, 'Insufficient capacity for group booking'::TEXT;
    RETURN;
  END IF;

  -- Start transaction
  BEGIN
    -- Create group booking record
    INSERT INTO group_bookings (
      group_name,
      group_size,
      primary_contact_name,
      primary_contact_email,
      primary_contact_phone,
      service_id,
      booking_date,
      booking_time,
      location_type,
      base_price_per_person,
      discount_percentage,
      total_price,
      deposit_required,
      deposit_amount,
      participants,
      metadata,
      creator_user_id
    ) VALUES (
      p_group_name,
      p_group_size,
      p_primary_contact_name,
      p_primary_contact_email,
      p_primary_contact_phone,
      p_service_id,
      p_booking_date,
      p_booking_time,
      p_location_type,
      p_base_price_per_person,
      p_discount_percentage,
      p_total_price,
      p_deposit_required,
      p_deposit_amount,
      p_participants,
      jsonb_build_object(
        'special_requests', p_special_requests,
        'consent_marketing', p_consent_marketing,
        'payment_method', p_payment_method
      ),
      p_creator_user_id
    ) RETURNING id INTO v_group_booking_id;

    -- Create individual booking records for each participant
    FOREACH v_participant IN SELECT jsonb_array_elements(p_participants)
    LOOP
      DECLARE
        v_participant_data JSONB := v_participant;
        v_first_name TEXT := v_participant_data->>'firstName';
        v_last_name TEXT := v_participant_data->>'lastName';
        v_email TEXT := COALESCE(v_participant_data->>'email', p_primary_contact_email);
        v_phone TEXT := COALESCE(v_participant_data->>'phone', p_primary_contact_phone);
        v_notes TEXT := v_participant_data->>'notes';
      BEGIN
        -- Create booking record
        INSERT INTO bookings (
          service_id,
          user_id,
          status,
          booking_date,
          booking_time,
          client_name,
          client_email,
          client_phone,
          location_type,
          amount_paid,
          currency,
          payment_method,
          payment_status,
          notes,
          is_group_booking,
          group_booking_id,
          group_participant_count,
          original_price,
          discount_amount,
          applied_pricing_rules,
          metadata
        ) VALUES (
          p_service_id,
          CASE WHEN v_participant_index = 0 THEN p_creator_user_id ELSE NULL END,
          'confirmed',
          p_booking_date,
          p_booking_time,
          COALESCE(
            CASE
              WHEN v_first_name IS NOT NULL AND v_last_name IS NOT NULL
              THEN v_first_name || ' ' || v_last_name
              ELSE p_primary_contact_name
            END,
            p_primary_contact_name
          ),
          v_email,
          v_phone,
          p_location_type,
          CASE
            WHEN p_payment_method = 'cash' THEN 0
            WHEN p_payment_method = 'deposit' THEN p_deposit_amount / p_group_size
            ELSE p_total_price / p_group_size
          END,
          'PLN',
          p_payment_method,
          CASE
            WHEN p_payment_method = 'cash' THEN 'unpaid'
            ELSE 'pending'
          END,
          v_notes,
          true,
          v_group_booking_id,
          p_group_size,
          p_base_price_per_person,
          (p_base_price_per_person * p_discount_percentage) / 100,
          jsonb_build_array(
            jsonb_build_object(
              'rule_type', 'group_discount',
              'discount_percentage', p_discount_percentage,
              'applied_amount', (p_base_price_per_person * p_discount_percentage) / 100
            )
          ),
          jsonb_build_object(
            'participant_index', v_participant_index,
            'is_primary_contact', v_participant_index = 0,
            'group_name', p_group_name
          )
        ) RETURNING id INTO v_booking_id;

        -- Add to booking IDs array
        v_booking_ids := v_booking_ids || to_jsonb(v_booking_id);

        -- Create booking change record
        INSERT INTO booking_changes (
          booking_id,
          change_type,
          new_date,
          new_time,
          new_service_id,
          new_status,
          reason,
          system_generated,
          metadata
        ) VALUES (
          v_booking_id,
          'created',
          p_booking_date,
          p_booking_time,
          p_service_id,
          'confirmed',
          'Group booking created',
          false,
          jsonb_build_object(
            'group_booking_id', v_group_booking_id,
            'group_size', p_group_size,
            'payment_method', p_payment_method
          )
        );

        v_participant_index := v_participant_index + 1;
      END;
    END LOOP;

    -- Update availability (subtract group size from capacity)
    UPDATE availability
    SET
      current_bookings = COALESCE(current_bookings, 0) + p_group_size
    WHERE service_type = v_service.service_type
      AND time_range && TSTZRANGE(v_start_time, v_end_time, '[)');

    -- Return success
    RETURN QUERY SELECT
      v_group_booking_id,
      v_booking_ids,
      true,
      NULL::TEXT;

    EXCEPTION WHEN OTHERS THEN
      -- Rollback and return error
      RETURN QUERY SELECT
        NULL,
        NULL,
        false,
        SQLERRM::TEXT;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to validate group booking before creation
CREATE OR REPLACE FUNCTION validate_group_booking(
  p_service_id UUID,
  p_group_size INTEGER,
  p_booking_date DATE,
  p_booking_time TIME,
  p_participants JSONB
)
RETURNS TABLE (
  is_valid BOOLEAN,
  errors JSONB,
  warnings JSONB
) AS $$
DECLARE
  v_errors JSONB := '[]'::JSONB;
  v_warnings JSONB := '[]'::JSONB;
  v_service services%ROWTYPE;
  v_participant JSONB;
  v_participant_index INTEGER := 0;
  v_unique_emails TEXT[];
  v_email TEXT;
BEGIN
  -- Get service details
  SELECT * INTO v_service
  FROM services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    v_errors := v_errors || jsonb_build_object('field', 'service_id', 'message', 'Service not found or inactive');
  END IF;

  -- Validate group size
  IF p_group_size < 2 THEN
    v_errors := v_errors || jsonb_build_object('field', 'group_size', 'message', 'Group size must be at least 2');
  END IF;

  IF p_group_size > 20 THEN
    v_errors := v_errors || jsonb_build_object('field', 'group_size', 'message', 'Group size cannot exceed 20');
  END IF;

  -- Check service-specific limits
  IF v_service.max_group_size IS NOT NULL AND p_group_size > v_service.max_group_size THEN
    v_errors := v_errors || jsonb_build_object(
      'field', 'group_size',
      'message', format('Group size exceeds maximum for this service (%s)', v_service.max_group_size)
    );
  END IF;

  -- Validate participants
  IF jsonb_array_length(p_participants) != p_group_size THEN
    v_errors := v_errors || jsonb_build_object(
      'field', 'participants',
      'message', 'Number of participants must match group size'
    );
  END IF;

  -- Check each participant
  FOREACH v_participant IN SELECT jsonb_array_elements(p_participants)
  LOOP
    DECLARE
      v_first_name TEXT := v_participant->>'firstName';
      v_last_name TEXT := v_participant->>'lastName';
      v_email TEXT := (v_participant->>'email');
    BEGIN
      v_participant_index := v_participant_index + 1;

      -- Validate required fields
      IF v_first_name IS NULL OR TRIM(v_first_name) = '' THEN
        v_errors := v_errors || jsonb_build_object(
          'field', format('participants[%s].firstName', v_participant_index),
          'message', 'First name is required'
        );
      END IF;

      IF v_last_name IS NULL OR TRIM(v_last_name) = '' THEN
        v_errors := v_errors || jsonb_build_object(
          'field', format('participants[%s].lastName', v_participant_index),
          'message', 'Last name is required'
        );
      END IF;

      -- Validate email format if provided
      IF v_email IS NOT NULL AND TRIM(v_email) != '' THEN
        IF v_email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
          v_errors := v_errors || jsonb_build_object(
            'field', format('participants[%s].email', v_participant_index),
            'message', 'Invalid email format'
          );
        ELSE
          -- Check for duplicate emails
          IF v_email = ANY(v_unique_emails) THEN
            v_warnings := v_warnings || jsonb_build_object(
              'field', format('participants[%s].email', v_participant_index),
              'message', 'Duplicate email address found'
            );
          END IF;
          v_unique_emails := array_append(v_unique_emails, v_email);
        END IF;
      END IF;
    END;
  END LOOP;

  -- Check availability
  IF v_errors = '[]'::JSONB THEN
    PERFORM 1
    FROM check_slot_availability_with_capacity(
      p_service_id,
      p_booking_date,
      p_booking_time,
      v_service.duration_minutes,
      p_group_size
    ) AS availability
    WHERE availability.available = true;

    IF NOT FOUND THEN
      v_errors := v_errors || jsonb_build_object(
        'field', 'availability',
        'message', 'No available slots for the selected date, time, and group size'
      );
    END IF;
  END IF;

  -- Add warnings for large groups
  IF p_group_size >= 10 THEN
    v_warnings := v_warnings || jsonb_build_object(
      'field', 'group_size',
      'message', 'Large groups may require special arrangements'
    );
  END IF;

  RETURN QUERY SELECT
    v_errors = '[]'::JSONB,
    v_errors,
    v_warnings;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for group booking performance
CREATE INDEX IF NOT EXISTS idx_group_bookings_service_date
  ON group_bookings(service_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_group_bookings_status
  ON group_bookings(status);

CREATE INDEX IF NOT EXISTS idx_group_bookings_creator
  ON group_bookings(creator_user_id) WHERE creator_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_group_booking_id
  ON bookings(group_booking_id) WHERE group_booking_id IS NOT NULL;

-- Add helpful comments
COMMENT ON FUNCTION check_group_booking_availability IS 'Checks available time slots for group bookings across a date range';
COMMENT ON FUNCTION calculate_group_booking_pricing IS 'Calculates pricing with group discounts';
COMMENT ON FUNCTION create_group_booking_transaction IS 'Creates a group booking with all participants in a transaction';
COMMENT ON FUNCTION validate_group_booking IS 'Validates group booking data before creation';