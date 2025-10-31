-- Refactor Package Functions - Split Complex Functions
-- This migration refactors complex functions into smaller, manageable pieces

-- ========================================
-- 1. SPLIT PURCHASE_PACKAGE INTO SMALLER FUNCTIONS
-- ========================================

-- Helper function to validate package availability
CREATE OR REPLACE FUNCTION validate_package_purchase(
  p_client_id UUID,
  p_package_id UUID
)
RETURNS service_packages%ROWTYPE AS $$
DECLARE
  v_package service_packages%ROWTYPE;
  v_existing_packages INTEGER;
BEGIN
  -- Get package details
  SELECT * INTO v_package
  FROM service_packages
  WHERE id = p_package_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found or inactive';
  END IF;

  -- Check validity period
  IF v_package.valid_from IS NOT NULL AND v_package.valid_from > CURRENT_DATE THEN
    RAISE EXCEPTION 'Package is not yet available for purchase';
  END IF;

  IF v_package.valid_until IS NOT NULL AND v_package.valid_until < CURRENT_DATE THEN
    RAISE EXCEPTION 'Package is no longer available for purchase';
  END IF;

  -- Check max purchases per client
  IF v_package.max_purchases_per_client IS NOT NULL THEN
    SELECT COUNT(*) INTO v_existing_packages
    FROM client_packages
    WHERE client_id = p_client_id
      AND package_id = p_package_id
      AND status NOT IN ('cancelled', 'expired');

    IF v_existing_packages >= v_package.max_purchases_per_client THEN
      RAISE EXCEPTION 'Maximum purchases per client exceeded for this package';
    END IF;
  END IF;

  RETURN v_package;
END;
$$ LANGUAGE plpgsql;

-- Helper function to create client package record
CREATE OR REPLACE FUNCTION create_client_package(
  p_client_id UUID,
  p_package_id UUID,
  p_payment_id UUID,
  p_amount_paid DECIMAL(10,2),
  p_currency TEXT,
  p_gift_to UUID DEFAULT NULL,
  p_gift_message TEXT DEFAULT NULL,
  p_purchase_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_client_package_id UUID;
  v_package service_packages%ROWTYPE;
BEGIN
  -- Get package details
  SELECT * INTO v_package
  FROM service_packages
  WHERE id = p_package_id;

  -- Create client package record
  INSERT INTO client_packages (
    client_id,
    package_id,
    total_sessions,
    sessions_used,
    payment_id,
    amount_paid,
    currency,
    status,
    can_be_gifted,
    gift_from,
    gift_message,
    purchase_notes
  ) VALUES (
    COALESCE(p_gift_to, p_client_id),
    p_package_id,
    v_package.session_count,
    0,
    p_payment_id,
    p_amount_paid,
    p_currency,
    'active',
    CASE WHEN p_gift_to IS NOT NULL THEN true ELSE false END,
    CASE WHEN p_gift_to IS NOT NULL THEN p_client_id ELSE NULL END,
    p_gift_message,
    p_purchase_notes
  ) RETURNING id INTO v_client_package_id;

  RETURN v_client_package_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to create package sessions
CREATE OR REPLACE FUNCTION create_package_sessions(
  p_client_package_id UUID,
  p_session_count INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO package_sessions (
    client_package_id,
    session_number,
    status
  )
  SELECT
    p_client_package_id,
    generate_series(1, p_session_count),
    'available';
END;
$$ LANGUAGE plpgsql;

-- Refactored main purchase_package function (now much simpler)
CREATE OR REPLACE FUNCTION purchase_package(
  p_client_id UUID,
  p_package_id UUID,
  p_payment_id UUID,
  p_amount_paid DECIMAL(10,2),
  p_currency TEXT DEFAULT 'pln',
  p_gift_to UUID DEFAULT NULL,
  p_gift_message TEXT DEFAULT NULL,
  p_purchase_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_client_package_id UUID;
  v_package service_packages%ROWTYPE;
BEGIN
  -- Validate inputs
  IF p_client_id IS NULL OR p_package_id IS NULL THEN
    RAISE EXCEPTION 'Client ID and Package ID are required';
  END IF;

  -- Validate package availability
  v_package := validate_package_purchase(p_client_id, p_package_id);

  -- Create client package record
  v_client_package_id := create_client_package(
    p_client_id,
    p_package_id,
    p_payment_id,
    p_amount_paid,
    p_currency,
    p_gift_to,
    p_gift_message,
    p_purchase_notes
  );

  -- Create package sessions
  CREATE package_sessions(v_client_package_id, v_package.session_count);

  -- Log the purchase
  PERFORM log_package_purchase(
    v_client_package_id,
    p_client_id,
    p_package_id,
    p_amount_paid
  );

  RETURN v_client_package_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 2. SPLIT DYNAMIC PRICING FUNCTION
-- ========================================

-- Helper function to get base price
CREATE OR REPLACE FUNCTION get_base_price(
  p_service_id UUID,
  p_date DATE
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_base_price DECIMAL(10,2);
BEGIN
  SELECT COALESCE(special_price, price_from) INTO v_base_price
  FROM services
  WHERE id = p_service_id;

  RETURN v_base_price;
END;
$$ LANGUAGE plpgsql;

-- Helper function to calculate time-based multiplier
CREATE OR REPLACE FUNCTION calculate_time_multiplier(
  p_time TIME,
  p_day_of_week INTEGER
)
RETURNS DECIMAL(5,3) AS $$
DECLARE
  v_multiplier DECIMAL(5,3) := 1.0;
BEGIN
  -- Peak hours (18:00-20:00) have 1.2x multiplier
  IF p_time >= '18:00'::TIME AND p_time <= '20:00'::TIME THEN
    v_multiplier := v_multiplier * 1.2;
  END IF;

  -- Weekend multiplier (1.1x for Saturday, 1.15x for Sunday)
  IF p_day_of_week = 6 THEN  -- Saturday
    v_multiplier := v_multiplier * 1.1;
  ELSIF p_day_of_week = 0 THEN  -- Sunday
    v_multiplier := v_multiplier * 1.15;
  END IF;

  RETURN v_multiplier;
END;
$$ LANGUAGE plpgsql;

-- Helper function to calculate demand multiplier
CREATE OR REPLACE FUNCTION calculate_demand_multiplier(
  p_service_id UUID,
  p_date DATE
)
RETURNS DECIMAL(5,3) AS $$
DECLARE
  v_bookings_count INTEGER;
  v_multiplier DECIMAL(5,3) := 1.0;
BEGIN
  -- Count bookings in the last 7 days
  SELECT COUNT(*) INTO v_bookings_count
  FROM bookings
  WHERE service_id = p_service_id
    AND DATE(created_at) BETWEEN p_date - 7 AND p_date
    AND status = 'confirmed';

  -- Apply demand multiplier (max 1.3x)
  IF v_bookings_count > 20 THEN
    v_multiplier := 1.3;
  ELSIF v_bookings_count > 10 THEN
    v_multiplier := 1.2;
  ELSIF v_bookings_count > 5 THEN
    v_multiplier := 1.1;
  END IF;

  RETURN v_multiplier;
END;
$$ LANGUAGE plpgsql;

-- Refactored dynamic pricing function
CREATE OR REPLACE FUNCTION calculate_dynamic_price(
  p_service_id UUID,
  p_date DATE,
  p_time TIME DEFAULT NULL
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_base_price DECIMAL(10,2);
  v_time_multiplier DECIMAL(5,3) := 1.0;
  v_demand_multiplier DECIMAL(5,3) := 1.0;
  v_final_price DECIMAL(10,2);
  v_day_of_week INTEGER;
BEGIN
  -- Get base price
  v_base_price := get_base_price(p_service_id, p_date);

  -- Calculate day of week (0=Sunday, 1=Monday, etc.)
  v_day_of_week := EXTRACT(DOW FROM p_date);

  -- Calculate time-based multiplier
  IF p_time IS NOT NULL THEN
    v_time_multiplier := calculate_time_multiplier(p_time, v_day_of_week);
  END IF;

  -- Calculate demand multiplier
  v_demand_multiplier := calculate_demand_multiplier(p_service_id, p_date);

  -- Apply all multipliers
  v_final_price := v_base_price * v_time_multiplier * v_demand_multiplier;

  -- Round to 2 decimal places
  v_final_price := ROUND(v_final_price, 2);

  -- Log the pricing calculation
  INSERT INTO pricing_log (
    service_id,
    date_requested,
    base_price,
    time_multiplier,
    demand_multiplier,
    final_price,
    created_at
  ) VALUES (
    p_service_id,
    p_date,
    v_base_price,
    v_time_multiplier,
    v_demand_multiplier,
    v_final_price,
    NOW()
  );

  RETURN v_final_price;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 3. BATCH PROCESSING FOR BOOKING COUNTS
-- ========================================

-- Create table for batch updates
CREATE TABLE IF NOT EXISTS booking_count_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL,
  update_type TEXT NOT NULL, -- 'increment' or 'decrement'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed BOOLEAN DEFAULT FALSE
);

-- Index for efficient processing
CREATE INDEX IF NOT EXISTS idx_booking_count_updates_processed
ON booking_count_updates(processed, created_at)
WHERE processed = FALSE;

-- Function to queue booking count update
CREATE OR REPLACE FUNCTION queue_booking_count_update(
  p_service_id UUID,
  p_update_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO booking_count_updates (service_id, update_type)
  VALUES (p_service_id, p_update_type);
END;
$$ LANGUAGE plpgsql;

-- Function to process booking count updates in batches
CREATE OR REPLACE FUNCTION process_booking_count_updates(
  p_batch_size INTEGER DEFAULT 100
)
RETURNS INTEGER AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_service_counts JSONB;
BEGIN
  -- Get unprocessed updates
  WITH updates_to_process AS (
    SELECT id, service_id, update_type
    FROM booking_count_updates
    WHERE processed = FALSE
    ORDER BY created_at
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  ),
  -- Aggregate updates by service
  aggregated_updates AS (
    SELECT
      service_id,
      jsonb_build_object(
        'increments', COUNT(*) FILTER (WHERE update_type = 'increment'),
        'decrements', COUNT(*) FILTER (WHERE update_type = 'decrement')
      ) as counts
    FROM updates_to_process
    GROUP BY service_id
  )
  -- Update service counts
  UPDATE services s
  SET
    booking_count = s.booking_count +
      (COALESCE((au.counts->>'increments')::INTEGER, 0) -
       COALESCE((au.counts->>'decrements')::INTEGER, 0)),
    updated_at = NOW()
  FROM aggregated_updates au
  WHERE s.id = au.service_id
  RETURNING 1 INTO v_processed_count;

  -- Mark updates as processed
  UPDATE booking_count_updates
  SET processed = TRUE,
      processed_at = NOW()
  WHERE processed = FALSE
    AND id IN (
      SELECT id FROM updates_to_process
    );

  -- Clean up old processed updates (older than 1 day)
  DELETE FROM booking_count_updates
  WHERE processed = TRUE
    AND processed_at < NOW() - INTERVAL '1 day';

  RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;

-- Updated trigger to use batch processing
CREATE OR REPLACE FUNCTION trigger_queue_booking_count_update()
RETURNS trigger AS $$
BEGIN
  -- Queue the update instead of immediate processing
  PERFORM queue_booking_count_update(
    NEW.service_id,
    CASE
      WHEN TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'confirmed')
      THEN 'increment'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status AND OLD.status = 'confirmed' AND NEW.status != 'confirmed'
      THEN 'decrement'
      ELSE NULL
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. UTILITY FUNCTIONS FOR MONITORING
-- ========================================

-- Function to monitor batch processing health
CREATE OR REPLACE FUNCTION get_batch_processing_stats()
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'unprocessed_updates', (
      SELECT COUNT(*)::INTEGER
      FROM booking_count_updates
      WHERE processed = FALSE
    ),
    'oldest_unprocessed', (
      SELECT EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER
      FROM booking_count_updates
      WHERE processed = FALSE
      ORDER BY created_at
      LIMIT 1
    ),
    'processed_today', (
      SELECT COUNT(*)::INTEGER
      FROM booking_count_updates
      WHERE processed = TRUE
        AND DATE(processed_at) = CURRENT_DATE
    ),
    'batch_efficiency', (
      CASE
        WHEN (SELECT COUNT(*) FROM booking_count_updates WHERE DATE(created_at) = CURRENT_DATE) > 0
        THEN ROUND(
          (SELECT COUNT(*)::DECIMAL
           FROM booking_count_updates
           WHERE processed = TRUE
             AND DATE(processed_at) = CURRENT_DATE) /
          (SELECT COUNT(*)::DECIMAL
           FROM booking_count_updates
           WHERE DATE(created_at) = CURRENT_DATE) * 100, 2
        )
        ELSE 100.0
      END
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION validate_package_purchase IS 'Validates if a package can be purchased by a client';
COMMENT ON FUNCTION create_client_package IS 'Creates a client package record';
COMMENT ON FUNCTION create_package_sessions IS 'Creates individual session records for a package';
COMMENT ON FUNCTION get_base_price IS 'Gets the base price for a service on a specific date';
COMMENT ON FUNCTION calculate_time_multiplier IS 'Calculates price multiplier based on time and day';
COMMENT ON FUNCTION calculate_demand_multiplier IS 'Calculates price multiplier based on recent demand';
COMMENT ON FUNCTION queue_booking_count_update IS 'Queues a booking count update for batch processing';
COMMENT ON FUNCTION process_booking_count_updates IS 'Processes queued booking count updates in batches';
COMMENT ON FUNCTION get_batch_processing_stats IS 'Returns statistics about batch processing performance';