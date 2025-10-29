-- Package Database Functions Migration
-- Implements core database functions for package operations

-- ========================================
-- 1. PACKAGE PURCHASE FUNCTION
-- ========================================

-- Function to process package purchase
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
  v_existing_packages INTEGER;
BEGIN
  -- Validate inputs
  IF p_client_id IS NULL OR p_package_id IS NULL THEN
    RAISE EXCEPTION 'Client ID and Package ID are required';
  END IF;

  -- Get package details
  SELECT * INTO v_package
  FROM service_packages
  WHERE id = p_package_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found or inactive';
  END IF;

  -- Check if package is within validity period
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

  -- Create package session records
  INSERT INTO package_sessions (
    client_package_id,
    session_number,
    status
  )
  SELECT
    v_client_package_id,
    generate_series(1, v_package.session_count),
    'available';

  -- Log the purchase (if audit table exists)
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
-- 2. USE PACKAGE SESSION FUNCTION
-- ========================================

-- Function to redeem a package session for a booking
CREATE OR REPLACE FUNCTION use_package_session(
  p_client_id UUID,
  p_booking_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_client_package_id UUID;
  v_session_number INTEGER;
  v_booking bookings%ROWTYPE;
  v_package service_packages%ROWTYPE;
BEGIN
  -- Validate inputs
  IF p_client_id IS NULL OR p_booking_id IS NULL THEN
    RAISE EXCEPTION 'Client ID and Booking ID are required';
  END IF;

  -- Get booking details
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id AND user_id = p_client_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or does not belong to client';
  END IF;

  -- Find an available package session
  SELECT ps.id, ps.client_package_id, ps.session_number
  INTO v_session_id, v_client_package_id, v_session_number
  FROM package_sessions ps
  JOIN client_packages cp ON ps.client_package_id = cp.id
  JOIN service_packages sp ON cp.package_id = sp.id
  WHERE cp.client_id = p_client_id
    AND cp.status = 'active'
    AND ps.status = 'available'
    AND (sp.service_id = v_booking.service_id OR sp.service_id IN (
      SELECT service_id FROM service_alternatives
      WHERE alternative_service_id = v_booking.service_id
    ))
    AND cp.expiry_date > now()
  ORDER BY cp.purchase_date ASC, ps.session_number ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No available package sessions found for this service';
  END IF;

  -- Update the package session
  UPDATE package_sessions
  SET status = 'completed',
      used_at = now(),
      notes = p_notes,
      booking_id = p_booking_id
  WHERE id = v_session_id;

  -- Update the booking to mark it as paid via package
  UPDATE bookings
  SET payment_status = 'paid',
      is_package = true,
      amount_paid = 0, -- Already paid via package
      payment_method = 'package'
  WHERE id = p_booking_id;

  -- Log the session usage
  PERFORM log_package_session_usage(
    v_session_id,
    p_client_id,
    v_booking_id
  );

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 3. CHECK PACKAGE BALANCE FUNCTION
-- ========================================

-- Function to get remaining sessions for a client
CREATE OR REPLACE FUNCTION check_package_balance(
  p_client_id UUID,
  p_service_id UUID DEFAULT NULL
)
RETURNS TABLE (
  package_id UUID,
  package_name TEXT,
  service_id UUID,
  service_name TEXT,
  total_sessions INTEGER,
  sessions_used INTEGER,
  sessions_remaining INTEGER,
  expiry_date TIMESTAMPTZ,
  days_remaining INTEGER,
  status TEXT,
  is_expiring_soon BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id as package_id,
    sp.name as package_name,
    sp.service_id,
    s.title as service_name,
    cp.total_sessions,
    cp.sessions_used,
    cp.sessions_remaining,
    cp.expiry_date,
    GREATEST(0, EXTRACT(DAYS FROM cp.expiry_date - now()))::INTEGER as days_remaining,
    cp.status,
    CASE
      WHEN cp.expiry_date <= (now() + INTERVAL '7 days') AND cp.sessions_remaining > 0 THEN true
      ELSE false
    END as is_expiring_soon
  FROM client_packages cp
  JOIN service_packages sp ON cp.package_id = sp.id
  JOIN services s ON sp.service_id = s.id
  WHERE cp.client_id = p_client_id
    AND cp.status = 'active'
    AND (p_service_id IS NULL OR sp.service_id = p_service_id)
  ORDER BY cp.expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. CALCULATE PACKAGE EXPIRY FUNCTION
-- ========================================

-- Function to set or update expiry dates for packages
CREATE OR REPLACE FUNCTION calculate_package_expiry(
  p_client_package_id UUID,
  p_custom_days INTEGER DEFAULT NULL
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_expiry_date TIMESTAMPTZ;
  v_validity_days INTEGER;
BEGIN
  -- Get the validity period
  IF p_custom_days IS NOT NULL THEN
    v_validity_days := p_custom_days;
  ELSE
    SELECT sp.validity_days INTO v_validity_days
    FROM service_packages sp
    JOIN client_packages cp ON sp.id = cp.package_id
    WHERE cp.id = p_client_package_id;
  END IF;

  -- Calculate expiry date
  v_expiry_date := (
    SELECT purchase_date + (v_validity_days || ' days')::INTERVAL
    FROM client_packages
    WHERE id = p_client_package_id
  );

  -- Update the client package
  UPDATE client_packages
  SET expiry_date = v_expiry_date
  WHERE id = p_client_package_id;

  RETURN v_expiry_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. TRANSFER PACKAGE FUNCTION
-- ========================================

-- Function to transfer a package to another client
CREATE OR REPLACE FUNCTION transfer_package(
  p_client_package_id UUID,
  p_from_client_id UUID,
  p_to_client_id UUID,
  p_transfer_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_package client_packages%ROWTYPE;
  v_package_details service_packages%ROWTYPE;
BEGIN
  -- Get package details
  SELECT cp.*, sp.*
  INTO v_package, v_package_details
  FROM client_packages cp
  JOIN service_packages sp ON cp.package_id = sp.id
  WHERE cp.id = p_client_package_id
    AND cp.client_id = p_from_client_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found or does not belong to client';
  END IF;

  -- Check if package can be transferred
  IF NOT v_package.can_be_gifted THEN
    RAISE EXCEPTION 'This package cannot be transferred';
  END IF;

  -- Check transfer limits
  IF v_package.transfer_count >= v_package.max_transfers AND v_package.max_transfers > 0 THEN
    RAISE EXCEPTION 'Maximum transfers exceeded for this package';
  END IF;

  -- Check if any sessions have been used
  IF v_package.sessions_used > 0 THEN
    RAISE EXCEPTION 'Cannot transfer partially used packages';
  END IF;

  -- Perform the transfer
  UPDATE client_packages
  SET client_id = p_to_client_id,
      transfer_count = transfer_count + 1,
      status = 'active',
      purchase_notes = COALESCE(purchase_notes, '') || ' Transferred from ' || p_from_client_id,
      updated_at = now()
  WHERE id = p_client_package_id;

  -- Log the transfer
  PERFORM log_package_transfer(
    p_client_package_id,
    p_from_client_id,
    p_to_client_id,
    p_transfer_notes
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 6. SCHEDULE PACKAGE SESSION FUNCTION
-- ========================================

-- Function to schedule a package session
CREATE OR REPLACE FUNCTION schedule_package_session(
  p_client_id UUID,
  p_session_id UUID,
  p_scheduled_for TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_session package_sessions%ROWTYPE;
  v_package client_packages%ROWTYPE;
BEGIN
  -- Validate session ownership
  SELECT ps.*, cp.*
  INTO v_session, v_package
  FROM package_sessions ps
  JOIN client_packages cp ON ps.client_package_id = cp.id
  WHERE ps.id = p_session_id
    AND cp.client_id = p_client_id
    AND ps.status = 'available'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or not available';
  END IF;

  -- Check if package is still valid
  IF v_package.expiry_date < p_scheduled_for THEN
    RAISE EXCEPTION 'Cannot schedule session after package expiry';
  END IF;

  -- Update the session
  UPDATE package_sessions
  SET status = 'scheduled',
      scheduled_for = p_scheduled_for,
      notes = p_notes
  WHERE id = p_session_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. GET PACKAGE STATISTICS FUNCTION
-- ========================================

-- Function to get package statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_package_statistics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_packages_sold BIGINT,
  total_revenue DECIMAL(15,2),
  average_sessions_per_package DECIMAL(10,2),
  most_popular_service TEXT,
  packages_expiring_soon BIGINT,
  unused_sessions BIGINT,
  client_retention_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_packages_sold,
    COALESCE(SUM(cp.amount_paid), 0) as total_revenue,
    COALESCE(AVG(cp.total_sessions), 0) as average_sessions_per_package,
    (
      SELECT s.title
      FROM service_packages sp
      JOIN services s ON sp.service_id = s.id
      JOIN client_packages cp2 ON sp.id = cp2.package_id
      WHERE cp2.status NOT IN ('cancelled')
        AND (p_start_date IS NULL OR cp2.purchase_date >= p_start_date)
        AND (p_end_date IS NULL OR cp2.purchase_date <= p_end_date)
      GROUP BY s.title
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as most_popular_service,
    COUNT(*) FILTER (WHERE cp.expiry_date BETWEEN now() AND (now() + INTERVAL '30 days')) as packages_expiring_soon,
    SUM(cp.sessions_remaining) FILTER (WHERE cp.status = 'active') as unused_sessions,
    (
      CASE
        WHEN COUNT(DISTINCT cp.client_id) > 0 THEN
          ROUND(
            (COUNT(DISTINCT cp.client_id) FILTER (
              WHERE cp.sessions_used > 0
            )::DECIMAL / COUNT(DISTINCT cp.client_id)) * 100, 2
          )
        ELSE 0
      END
    ) as client_retention_rate
  FROM client_packages cp
  WHERE cp.status NOT IN ('cancelled')
    AND (p_start_date IS NULL OR cp.purchase_date >= p_start_date)
    AND (p_end_date IS NULL OR cp.purchase_date <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. UTILITY FUNCTIONS
-- ========================================

-- Function to clean up expired packages (for scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_packages()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Mark expired packages
  UPDATE client_packages
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND expiry_date < now()
    AND id NOT IN (
      SELECT DISTINCT client_package_id
      FROM package_sessions
      WHERE status = 'scheduled'
        AND scheduled_for > now()
    );

  v_updated_count := v_updated_count + ROW_COUNT;

  -- Cancel scheduled sessions for expired packages
  UPDATE package_sessions
  SET status = 'cancelled',
      notes = COALESCE(notes, '') || ' - Cancelled due to package expiry',
      updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_for < now()
    AND client_package_id IN (
      SELECT id FROM client_packages WHERE status = 'expired'
    );

  v_updated_count := v_updated_count + ROW_COUNT;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send expiry reminders (for scheduled job)
CREATE OR REPLACE FUNCTION send_package_expiry_reminders()
RETURNS INTEGER AS $$
DECLARE
  v_reminder_count INTEGER := 0;
BEGIN
  -- Send reminders for packages expiring in 7 days
  FOR r IN
    SELECT cp.id, cp.client_id, cp.sessions_remaining, sp.name
    FROM client_packages cp
    JOIN service_packages sp ON cp.package_id = sp.id
    WHERE cp.status = 'active'
      AND cp.sessions_remaining > 0
      AND cp.expiry_date BETWEEN now() AND (now() + INTERVAL '7 days')
      AND cp.expiry_date > (now() - INTERVAL '1 day') -- Avoid duplicate reminders
  LOOP
    -- Send notification (implementation depends on notification system)
    PERFORM send_expiry_notification(r.client_id, r.id, r.name, r.sessions_remaining);
    v_reminder_count := v_reminder_count + 1;
  END LOOP;

  RETURN v_reminder_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 9. HELPER FUNCTIONS FOR LOGGING
-- ========================================

-- These functions would integrate with existing logging/auditing system

CREATE OR REPLACE FUNCTION log_package_purchase(
  p_client_package_id UUID,
  p_client_id UUID,
  p_package_id UUID,
  p_amount DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
  -- Log to audit table if it exists
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    user_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    'client_packages',
    p_client_package_id,
    'INSERT',
    p_client_id,
    jsonb_build_object('action', 'purchase_package'),
    jsonb_build_object(
      'package_id', p_package_id,
      'amount', p_amount,
      'status', 'active'
    ),
    now()
  ) ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_package_session_usage(
  p_session_id UUID,
  p_client_id UUID,
  p_booking_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Log to audit table if it exists
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    user_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    'package_sessions',
    p_session_id,
    'UPDATE',
    p_client_id,
    jsonb_build_object('old_status', 'available'),
    jsonb_build_object(
      'new_status', 'completed',
      'booking_id', p_booking_id,
      'used_at', now()
    ),
    now()
  ) ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_package_transfer(
  p_client_package_id UUID,
  p_from_client_id UUID,
  p_to_client_id UUID,
  p_notes TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Log to audit table if it exists
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    user_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    'client_packages',
    p_client_package_id,
    'TRANSFER',
    p_from_client_id,
    jsonb_build_object('from_client', p_from_client_id),
    jsonb_build_object(
      'to_client', p_to_client_id,
      'transfer_notes', p_notes,
      'transferred_at', now()
    ),
    now()
  ) ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION send_expiry_notification(
  p_client_id UUID,
  p_package_id UUID,
  p_package_name TEXT,
  p_sessions_remaining INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  -- This would integrate with your notification system
  -- For now, just return true
  -- In production, you would send email/push notification here

  -- Example:
  -- INSERT INTO notifications (user_id, type, title, message, created_at)
  -- VALUES (
  --   p_client_id,
  --   'package_expiry',
  --   'Package Expiring Soon',
  --   format('Your package "%s" has %s sessions remaining and expires in 7 days',
  --     p_package_name, p_sessions_remaining),
  --   now()
  -- );

  RETURN true;
END;
$$ LANGUAGE plpgsql;