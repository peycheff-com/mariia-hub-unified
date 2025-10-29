-- Atomic Booking Operations Migration
-- This migration adds database constraints, functions, and procedures
-- to support atomic booking operations and prevent race conditions

-- Ensure the extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- DISTRIBUTED LOCKING TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS distributed_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lock_key TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for distributed locks
CREATE INDEX IF NOT EXISTS idx_distributed_locks_key ON distributed_locks(lock_key);
CREATE INDEX IF NOT EXISTS idx_distributed_locks_expires ON distributed_locks(expires_at);

-- Unique constraint to prevent duplicate locks
ALTER TABLE distributed_locks ADD CONSTRAINT distributed_locks_key_unique UNIQUE (lock_key);

-- Policy for distributed locks (admin only)
ALTER TABLE distributed_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access to distributed locks" ON distributed_locks
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ========================================
-- ENHANCED HOLDS TABLE UPDATES
-- ========================================
-- Add columns if they don't exist
ALTER TABLE holds
    ADD COLUMN IF NOT EXISTS slot_id TEXT,
    ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    ADD COLUMN IF NOT EXISTS transaction_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for holds
CREATE INDEX IF NOT EXISTS idx_holds_slot_id ON holds(slot_id) WHERE slot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_holds_user_service ON holds(user_id, service_id);
CREATE INDEX IF NOT EXISTS idx_holds_expires_at ON holds(expires_at);
CREATE INDEX IF NOT EXISTS idx_holds_version ON holds(version);

-- Unique constraint to prevent multiple holds on same slot
ALTER TABLE holds ADD CONSTRAINT holds_slot_user_unique
    UNIQUE (slot_id, user_id) WHERE slot_id IS NOT NULL;

-- ========================================
-- ENHANCED BOOKINGS TABLE UPDATES
-- ========================================
-- Add columns for atomic operations if they don't exist
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    ADD COLUMN IF NOT EXISTS transaction_id TEXT,
    ADD COLUMN IF NOT EXISTS hold_id UUID REFERENCES holds(id);

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_service_time ON bookings(service_id, booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user_service ON bookings(user_id, service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_time ON bookings(status, booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_bookings_version ON bookings(version);
CREATE INDEX IF NOT EXISTS idx_bookings_transaction_id ON bookings(transaction_id);

-- Enhanced unique constraint to prevent double bookings
-- This ensures no overlapping bookings for the same service and time
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap UNIQUE (service_id, booking_date, booking_time)
    WHERE status IN ('pending', 'confirmed');

-- ========================================
-- ATOMIC DATABASE FUNCTIONS
-- ========================================

-- Function to validate service availability atomically
CREATE OR REPLACE FUNCTION validate_service_availability(
    p_service_id UUID,
    p_booking_date DATE,
    p_booking_time TIME,
    p_duration_minutes INTEGER DEFAULT 60
) RETURNS JSON AS $$
DECLARE
    v_service_active BOOLEAN;
    v_service_capacity INTEGER;
    v_existing_bookings INTEGER;
    v_active_holds INTEGER;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_result JSON;
BEGIN
    -- Check if service exists and is active
    SELECT is_active, max_participants
    INTO v_service_active, v_service_capacity
    FROM services
    WHERE id = p_service_id;

    IF NOT FOUND OR v_service_active IS NULL OR NOT v_service_active THEN
        RETURN json_build_object('is_available', false, 'reason', 'Service not found or inactive');
    END IF;

    -- Calculate time window
    v_start_time := p_booking_date::timestamp + p_booking_time;
    v_end_time := v_start_time + (p_duration_minutes || ' minutes')::interval;

    -- Check for existing bookings in the same time window
    SELECT COUNT(*)
    INTO v_existing_bookings
    FROM bookings
    WHERE service_id = p_service_id
        AND booking_date = p_booking_date
        AND status IN ('pending', 'confirmed')
        AND (
            -- Booking starts during existing booking
            (p_booking_time >= booking_time AND p_booking_time < (booking_time + duration_minutes || ' minutes')::time)
            -- Booking ends during existing booking
            OR ((p_booking_time + p_duration_minutes || ' minutes')::time > booking_time
                AND (p_booking_time + p_duration_minutes || ' minutes')::time <= (booking_time + duration_minutes || ' minutes')::time)
            -- Booking encompasses existing booking
            OR (p_booking_time <= booking_time
                AND (p_booking_time + p_duration_minutes || ' minutes')::time >= (booking_time + duration_minutes || ' minutes')::time)
        );

    -- Check for active holds in the same time window
    SELECT COUNT(*)
    INTO v_active_holds
    FROM holds
    WHERE service_id = p_service_id
        AND expires_at > NOW()
        AND (
            -- Hold starts during time window
            (start_time >= v_start_time AND start_time < v_end_time)
            -- Hold ends during time window
            OR (end_time > v_start_time AND end_time <= v_end_time)
            -- Hold encompasses time window
            OR (start_time <= v_start_time AND end_time >= v_end_time)
        );

    -- Check capacity constraints
    IF v_service_capacity IS NOT NULL AND (v_existing_bookings + v_active_holds) >= v_service_capacity THEN
        RETURN json_build_object('is_available', false, 'reason', 'Service at full capacity');
    END IF;

    -- Check for time conflicts
    IF v_existing_bookings > 0 OR v_active_holds > 0 THEN
        RETURN json_build_object('is_available', false, 'reason', 'Time slot already booked or held');
    END IF;

    -- All checks passed
    RETURN json_build_object('is_available', true, 'reason', 'Available');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('is_available', false, 'reason', 'Database error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create hold with atomic conflict detection
CREATE OR REPLACE FUNCTION create_hold_atomic(
    p_slot_id TEXT,
    p_user_id UUID,
    p_service_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_expires_at TIMESTAMPTZ,
    p_session_id TEXT,
    p_version BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
) RETURNS JSON AS $$
DECLARE
    v_existing_hold_id UUID;
    v_new_hold_id UUID;
    v_result JSON;
BEGIN
    -- Check for existing hold on the same slot
    SELECT id INTO v_existing_hold_id
    FROM holds
    WHERE slot_id = p_slot_id
        AND expires_at > NOW()
    FOR UPDATE;

    IF v_existing_hold_id IS NOT NULL THEN
        RETURN json_build_object('success', false, 'reason', 'Slot already held', 'existing_hold_id', v_existing_hold_id);
    END IF;

    -- Validate service availability
    PERFORM 1 FROM validate_service_availability(
        p_service_id,
        p_start_time::date,
        p_start_time::time,
        EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60
    );

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'reason', 'Service not available for requested time');
    END IF;

    -- Create the hold
    INSERT INTO holds (
        resource_id,
        slot_id,
        user_id,
        service_id,
        start_time,
        end_time,
        expires_at,
        session_id,
        version,
        transaction_id,
        created_at,
        updated_at
    ) VALUES (
        'mariia',
        p_slot_id,
        p_user_id,
        p_service_id,
        p_start_time,
        p_end_time,
        p_expires_at,
        p_session_id,
        p_version,
        p_session_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_new_hold_id;

    RETURN json_build_object('success', true, 'hold_id', v_new_hold_id, 'version', p_version);

EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('success', false, 'reason', 'Duplicate hold detected');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'reason', 'Database error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert hold to booking atomically
CREATE OR REPLACE FUNCTION convert_hold_to_booking(
    p_hold_id UUID,
    p_session_id TEXT,
    p_booking_data JSONB
) RETURNS JSON AS $$
DECLARE
    v_hold RECORD;
    v_booking_id UUID;
    v_result JSON;
BEGIN
    -- Lock the hold and verify it exists and is valid
    SELECT * INTO v_hold
    FROM holds
    WHERE id = p_hold_id
        AND expires_at > NOW()
    FOR UPDATE;

    IF v_hold IS NULL THEN
        RETURN json_build_object('success', false, 'reason', 'Hold not found or expired');
    END IF;

    -- Verify session ownership
    IF v_hold.session_id != p_session_id THEN
        RETURN json_build_object('success', false, 'reason', 'Hold belongs to different session');
    END IF;

    -- Create booking with hold data
    INSERT INTO bookings (
        user_id,
        service_id,
        hold_id,
        booking_date,
        booking_time,
        status,
        client_name,
        client_email,
        client_phone,
        notes,
        location_id,
        duration_minutes,
        currency,
        amount_paid,
        payment_method,
        consent_terms_accepted,
        consent_marketing_accepted,
        metadata,
        transaction_id,
        version,
        created_at,
        updated_at
    ) VALUES (
        v_hold.user_id,
        v_hold.service_id,
        v_hold.id,
        v_hold.start_time::date,
        v_hold.start_time::time,
        'pending',
        p_booking_data->>'client_name',
        p_booking_data->>'client_email',
        p_booking_data->>'client_phone',
        p_booking_data->>'notes',
        p_booking_data->>'location_id',
        EXTRACT(EPOCH FROM (v_hold.end_time - v_hold.start_time)) / 60,
        'PLN',
        (p_booking_data->>'amount_paid')::NUMERIC,
        'pending',
        (p_booking_data->>'consent_terms_accepted')::BOOLEAN,
        (p_booking_data->>'consent_marketing_accepted')::BOOLEAN,
        p_booking_data,
        p_session_id,
        (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_booking_id;

    -- Delete the hold (it's been converted to booking)
    DELETE FROM holds WHERE id = p_hold_id;

    RETURN json_build_object('success', true, 'booking_id', v_booking_id);

EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('success', false, 'reason', 'Time slot already booked');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'reason', 'Database error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks() RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM distributed_locks
    WHERE expires_at < NOW();

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired holds
CREATE OR REPLACE FUNCTION cleanup_expired_holds() RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM holds
    WHERE expires_at < NOW();

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS FOR AUTOMATIC CLEANUP
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_holds_updated_at
    BEFORE UPDATE ON holds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributed_locks_updated_at
    BEFORE UPDATE ON distributed_locks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_service_date_status
    ON bookings(service_id, booking_date, status);

CREATE INDEX IF NOT EXISTS idx_holds_service_expires
    ON holds(service_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_bookings_user_created
    ON bookings(user_id, created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enhanced policies for holds
CREATE POLICY "Users can view their own holds" ON holds
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all holds" ON holds
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Enhanced policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ========================================
-- SCHEDULED JOBS FOR MAINTENANCE
-- ========================================

-- Create a pg_cron extension if available (for scheduled cleanup)
-- Note: This requires pg_cron extension to be installed
-- SELECT cron.schedule('cleanup-expired-locks', '*/5 * * * *', 'SELECT cleanup_expired_locks();');
-- SELECT cron.schedule('cleanup-expired-holds', '*/10 * * * *', 'SELECT cleanup_expired_holds();');

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_service_availability TO authenticated;
GRANT EXECUTE ON FUNCTION create_hold_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION convert_hold_to_booking TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_locks TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_holds TO authenticated;

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create initial check constraint
ALTER TABLE bookings ADD CONSTRAINT valid_booking_status
    CHECK (status IN ('draft', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

ALTER TABLE holds ADD CONSTRAINT valid_hold_status
    CHECK (expires_at > created_at);

-- Create validation function for time conflicts
CREATE OR REPLACE FUNCTION check_time_conflicts() RETURNS TRIGGER AS $$
BEGIN
    -- Check for existing bookings at the same time
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF EXISTS (
            SELECT 1 FROM bookings
            WHERE service_id = NEW.service_id
                AND booking_date = NEW.booking_date
                AND status IN ('pending', 'confirmed')
                AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')::uuid
                AND (
                    (NEW.booking_time >= booking_time AND NEW.booking_time < (booking_time + duration_minutes || ' minutes')::time)
                    OR ((NEW.booking_time + NEW.duration_minutes || ' minutes')::time > booking_time
                        AND (NEW.booking_time + NEW.duration_minutes || ' minutes')::time <= (booking_time + duration_minutes || ' minutes')::time)
                    OR (NEW.booking_time <= booking_time
                        AND (NEW.booking_time + NEW.duration_minutes || 'minutes')::time >= (booking_time + duration_minutes || 'minutes')::time)
                )
        ) THEN
            RAISE EXCEPTION 'Time slot already booked for this service';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the conflict check trigger
CREATE TRIGGER check_booking_time_conflicts
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION check_time_conflicts();

-- Add comments for documentation
COMMENT ON TABLE distributed_locks IS 'Distributed locking table for atomic operations across multiple instances';
COMMENT ON FUNCTION validate_service_availability IS 'Atomically validates if a service is available for a given time slot';
COMMENT ON FUNCTION create_hold_atomic IS 'Creates a hold with conflict detection and atomic guarantees';
COMMENT ON FUNCTION convert_hold_to_booking IS 'Converts a hold to a booking atomically, preventing double bookings';
COMMENT ON FUNCTION cleanup_expired_locks IS 'Cleans up expired distributed locks';
COMMENT ON FUNCTION cleanup_expired_holds IS 'Cleans up expired holds to free up slots';