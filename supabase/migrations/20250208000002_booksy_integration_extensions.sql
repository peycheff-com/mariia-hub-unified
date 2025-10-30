-- Booksy Integration Extension Migration
-- Enhanced schema for comprehensive Booksy synchronization

-- Add Booksy-specific fields to existing bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booksy_booking_id TEXT,
ADD COLUMN IF NOT EXISTS booksy_sync_status TEXT DEFAULT 'pending' CHECK (booksy_sync_status IN ('pending', 'synced', 'error', 'conflict')),
ADD COLUMN IF NOT EXISTS booksy_sync_error TEXT,
ADD COLUMN IF NOT EXISTS booksy_raw_data JSONB,
ADD COLUMN IF NOT EXISTS booksy_last_sync TIMESTAMPTZ;

-- Add Booksy sync fields to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS booksy_service_id TEXT,
ADD COLUMN IF NOT EXISTS booksy_sync_status TEXT DEFAULT 'pending' CHECK (booksy_sync_status IN ('pending', 'synced', 'error', 'conflict')),
ADD COLUMN IF NOT EXISTS booksy_sync_error TEXT,
ADD COLUMN IF NOT EXISTS booksy_last_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS booksy_price_override DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS booksy_duration_override INTEGER;

-- Add Booksy sync fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS booksy_client_id TEXT,
ADD COLUMN IF NOT EXISTS booksy_sync_status TEXT DEFAULT 'pending' CHECK (booksy_sync_status IN ('pending', 'synced', 'error', 'conflict')),
ADD COLUMN IF NOT EXISTS booksy_sync_error TEXT,
ADD COLUMN IF NOT EXISTS booksy_last_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS booksy_data_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booksy_consent_given_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS booksy_consent_revoked_at TIMESTAMPTZ;

-- Create booksy_sync_conflicts table for conflict resolution
CREATE TABLE IF NOT EXISTS booksy_sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('booking', 'service', 'client', 'availability')),
    entity_id UUID NOT NULL,
    booksy_entity_id TEXT,
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('data_mismatch', 'duplicate', 'timing_conflict', 'price_mismatch', 'availability_conflict')),
    conflict_data JSONB NOT NULL,
    resolution_status TEXT DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'ignored', 'manual_review')),
    resolution_data JSONB,
    auto_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Create booksy_sync_queue table for batch operations
CREATE TABLE IF NOT EXISTS booksy_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete', 'sync')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('booking', 'service', 'client', 'availability')),
    entity_id UUID,
    booksy_entity_id TEXT,
    payload JSONB NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_attempt_at TIMESTAMPTZ DEFAULT now(),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id)
);

-- Create booksy_audit_log table for comprehensive tracking
CREATE TABLE IF NOT EXISTS booksy_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    booksy_entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    sync_direction TEXT CHECK (sync_direction IN ('to_booksy', 'from_booksy', 'conflict_resolution')),
    user_id UUID REFERENCES auth.users(id),
    automated BOOLEAN DEFAULT false,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    booksy_response JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create booksy_revenue_reconciliation table
CREATE TABLE IF NOT EXISTS booksy_revenue_reconciliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    platform_revenue DECIMAL(10,2) DEFAULT 0,
    booksy_revenue DECIMAL(10,2) DEFAULT 0,
    discrepancy DECIMAL(10,2) DEFAULT 0,
    discrepancy_reason TEXT,
    bookings_count INTEGER DEFAULT 0,
    booksy_bookings_count INTEGER DEFAULT 0,
    reconciliation_status TEXT DEFAULT 'pending' CHECK (reconciliation_status IN ('pending', 'matched', 'discrepancy', 'error')),
    last_checked TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for Booksy-specific fields
CREATE INDEX IF NOT EXISTS idx_bookings_booksy_id ON bookings(booksy_booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booksy_sync_status ON bookings(booksy_sync_status);
CREATE INDEX IF NOT EXISTS idx_services_booksy_id ON services(booksy_service_id);
CREATE INDEX IF NOT EXISTS idx_services_booksy_sync_status ON services(booksy_sync_status);
CREATE INDEX IF NOT EXISTS idx_profiles_booksy_id ON profiles(booksy_client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_booksy_consent ON profiles(booksy_data_consent);
CREATE INDEX IF NOT EXISTS idx_booksy_conflicts_entity ON booksy_sync_conflicts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_booksy_conflicts_status ON booksy_sync_conflicts(resolution_status);
CREATE INDEX IF NOT EXISTS idx_booksy_queue_status ON booksy_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_booksy_queue_priority ON booksy_sync_queue(priority DESC, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_booksy_audit_entity ON booksy_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_booksy_audit_date ON booksy_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_booksy_reconciliation_date ON booksy_revenue_reconciliation(date);

-- Enable RLS on new tables
ALTER TABLE booksy_sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE booksy_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE booksy_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE booksy_revenue_reconciliation ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables
CREATE POLICY "Admin full access to Booksy conflicts" ON booksy_sync_conflicts
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (true);

CREATE POLICY "Service role full access to Booksy conflicts" ON booksy_sync_conflicts
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin full access to Booksy queue" ON booksy_sync_queue
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (true);

CREATE POLICY "Service role full access to Booksy queue" ON booksy_sync_queue
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin read access to Booksy audit" ON booksy_audit_log
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Service role full access to Booksy audit" ON booksy_audit_log
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin read access to Booksy reconciliation" ON booksy_revenue_reconciliation
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (true);

CREATE POLICY "Service role full access to Booksy reconciliation" ON booksy_revenue_reconciliation
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Create function to log Booksy sync activities
CREATE OR REPLACE FUNCTION log_booksy_activity(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_booksy_entity_id TEXT DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_sync_direction TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_automated BOOLEAN DEFAULT false,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL,
    p_booksy_response JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO booksy_audit_log (
        action,
        entity_type,
        entity_id,
        booksy_entity_id,
        old_data,
        new_data,
        sync_direction,
        user_id,
        automated,
        success,
        error_message,
        booksy_response
    ) VALUES (
        p_action,
        p_entity_type,
        p_entity_id,
        p_booksy_entity_id,
        p_old_data,
        p_new_data,
        p_sync_direction,
        p_user_id,
        p_automated,
        p_success,
        p_error_message,
        p_booksy_response
    )
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle Booksy sync conflicts
CREATE OR REPLACE FUNCTION handle_booksy_conflict(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_booksy_entity_id TEXT,
    p_conflict_type TEXT,
    p_conflict_data JSONB,
    p_auto_resolve BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    conflict_id UUID;
BEGIN
    INSERT INTO booksy_sync_conflicts (
        entity_type,
        entity_id,
        booksy_entity_id,
        conflict_type,
        conflict_data,
        auto_resolved
    ) VALUES (
        p_entity_type,
        p_entity_id,
        p_booksy_entity_id,
        p_conflict_type,
        p_conflict_data,
        p_auto_resolve
    )
    RETURNING id INTO conflict_id;

    -- If auto-resolve is true, mark as resolved
    IF p_auto_resolve THEN
        UPDATE booksy_sync_conflicts
        SET
            resolution_status = 'resolved',
            resolved_at = now(),
            resolution_data = jsonb_build_object('auto_resolved', true, 'timestamp', now())
        WHERE id = conflict_id;
    END IF;

    RETURN conflict_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to queue Booksy sync operations
CREATE OR REPLACE FUNCTION queue_booksy_sync(
    p_operation_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_booksy_entity_id TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT NULL,
    p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
    queue_id UUID;
BEGIN
    INSERT INTO booksy_sync_queue (
        operation_type,
        entity_type,
        entity_id,
        booksy_entity_id,
        payload,
        priority,
        next_attempt_at
    ) VALUES (
        p_operation_type,
        p_entity_type,
        p_entity_id,
        p_booksy_entity_id,
        COALESCE(p_payload, '{}'::jsonb),
        p_priority,
        now()
    )
    RETURNING id INTO queue_id;

    RETURN queue_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for daily revenue reconciliation
CREATE OR REPLACE FUNCTION reconcile_daily_revenue(p_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
    reconciliation_id UUID;
    platform_rev DECIMAL(10,2) := 0;
    booksy_rev DECIMAL(10,2) := 0;
    platform_count INTEGER := 0;
    booksy_count INTEGER := 0;
BEGIN
    -- Calculate platform revenue
    SELECT
        COALESCE(SUM(total_price), 0),
        COUNT(*)
    INTO platform_rev, platform_count
    FROM bookings
    WHERE DATE(start_time) = p_date
    AND status IN ('confirmed', 'completed')
    AND booksy_booking_id IS NULL;

    -- Calculate Booksy revenue
    SELECT
        COALESCE(SUM(price), 0),
        COUNT(*)
    INTO booksy_rev, booksy_count
    FROM external_bookings
    WHERE DATE(datetime) = p_date
    AND source = 'booksy'
    AND status IN ('confirmed', 'completed');

    -- Insert or update reconciliation record
    INSERT INTO booksy_revenue_reconciliation (
        date,
        platform_revenue,
        booksy_revenue,
        discrepancy,
        bookings_count,
        booksy_bookings_count,
        reconciliation_status
    ) VALUES (
        p_date,
        platform_rev,
        booksy_rev,
        platform_rev - booksy_rev,
        platform_count,
        booksy_count,
        CASE
            WHEN platform_rev = booksy_rev THEN 'matched'
            WHEN ABS(platform_rev - booksy_rev) < 0.01 THEN 'matched'
            ELSE 'discrepancy'
        END
    )
    ON CONFLICT (date) DO UPDATE SET
        platform_revenue = EXCLUDED.platform_revenue,
        booksy_revenue = EXCLUDED.booksy_revenue,
        discrepancy = EXCLUDED.discrepancy,
        bookings_count = EXCLUDED.bookings_count,
        booksy_bookings_count = EXCLUDED.booksy_bookings_count,
        reconciliation_status = EXCLUDED.reconciliation_status,
        last_checked = now()
    RETURNING id INTO reconciliation_id;

    RETURN reconciliation_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION log_booksy_activity TO service_role;
GRANT EXECUTE ON FUNCTION handle_booksy_conflict TO service_role;
GRANT EXECUTE ON FUNCTION queue_booksy_sync TO service_role;
GRANT EXECUTE ON FUNCTION reconcile_daily_revenue TO service_role;

-- Create view for Booksy sync dashboard
CREATE OR REPLACE VIEW booksy_sync_dashboard AS
SELECT
    'bookings' as entity_type,
    COUNT(*) as total_entities,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'synced') as synced_count,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'error') as error_count,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'conflict') as conflict_count,
    MAX(booksy_last_sync) as last_sync
FROM bookings
WHERE booksy_booking_id IS NOT NULL

UNION ALL

SELECT
    'services' as entity_type,
    COUNT(*) as total_entities,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'synced') as synced_count,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'error') as error_count,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'conflict') as conflict_count,
    MAX(booksy_last_sync) as last_sync
FROM services
WHERE booksy_service_id IS NOT NULL

UNION ALL

SELECT
    'clients' as entity_type,
    COUNT(*) as total_entities,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'synced') as synced_count,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'error') as error_count,
    COUNT(*) FILTER (WHERE booksy_sync_status = 'conflict') as conflict_count,
    MAX(booksy_last_sync) as last_sync
FROM profiles
WHERE booksy_client_id IS NOT NULL;

-- Create function to automatically process sync queue
CREATE OR REPLACE FUNCTION process_booksy_sync_queue(p_limit INTEGER DEFAULT 10)
RETURNS INTEGER AS $$
DECLARE
    processed_count INTEGER := 0;
    queue_item booksy_sync_queue%ROWTYPE;
BEGIN
    FOR queue_item IN
        SELECT * FROM booksy_sync_queue
        WHERE status = 'pending'
        AND next_attempt_at <= now()
        AND attempts < max_attempts
        ORDER BY priority DESC, created_at ASC
        LIMIT p_limit
    LOOP
        -- Mark as processing
        UPDATE booksy_sync_queue
        SET
            status = 'processing',
            attempts = attempts + 1
        WHERE id = queue_item.id;

        BEGIN
            -- Process the sync operation
            -- This would be implemented by the application layer
            -- For now, just mark as completed

            UPDATE booksy_sync_queue
            SET
                status = 'completed',
                processed_at = now()
            WHERE id = queue_item.id;

            processed_count := processed_count + 1;

        EXCEPTION WHEN OTHERS THEN
            -- Mark as failed and schedule retry
            UPDATE booksy_sync_queue
            SET
                status = 'failed',
                error_message = SQLERRM,
                next_attempt_at = now() + (powers(2, queue_item.attempts) * interval '1 minute')
            WHERE id = queue_item.id;
        END;
    END LOOP;

    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION process_booksy_sync_queue TO service_role;

-- Create trigger to automatically add bookings to sync queue when updated
CREATE OR REPLACE FUNCTION trigger_booksy_sync_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- Only queue if Booksy ID exists and sync status is not 'synced'
    IF TG_OP = 'UPDATE' THEN
        IF OLD.booksy_sync_status != NEW.booksy_sync_status OR
           OLD.booksy_booking_id != NEW.booksy_booking_id THEN

            PERFORM queue_booksy_sync(
                'update',
                'booking',
                NEW.id,
                NEW.booksy_booking_id,
                row_to_json(NEW),
                7 -- High priority for updates
            );
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        IF NEW.booksy_booking_id IS NOT NULL THEN
            PERFORM queue_booksy_sync(
                'create',
                'booking',
                NEW.id,
                NEW.booksy_booking_id,
                row_to_json(NEW),
                8 -- High priority for new bookings
            );
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booksy_booking_sync_queue_trigger
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_booksy_sync_queue();