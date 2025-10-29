-- External Integration Sync Migration
-- Tables for syncing data from external services like Booksy

-- Create external_services table
CREATE TABLE IF NOT EXISTS external_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id TEXT NOT NULL, -- External service ID (e.g., Booksy service ID)
    source TEXT NOT NULL, -- Source system (booksy, calendly, etc.)
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER, -- Duration in minutes
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'PLN',
    category TEXT,
    active BOOLEAN DEFAULT true,
    raw_data JSONB, -- Full response from external API
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_external_service UNIQUE (service_id, source)
);

-- Create external_clients table
CREATE TABLE IF NOT EXISTS external_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL, -- External client ID
    source TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_external_client UNIQUE (client_id, source)
);

-- Create external_bookings table
CREATE TABLE IF NOT EXISTS external_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL, -- External booking ID
    source TEXT NOT NULL,
    service_id TEXT,
    client_id TEXT,
    staff_id TEXT,
    datetime TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed', 'no_show')),
    duration INTEGER,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'PLN',
    notes TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_external_booking UNIQUE (booking_id, source)
);

-- Create integration_sync_status table
CREATE TABLE IF NOT EXISTS integration_sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL UNIQUE,
    last_sync TIMESTAMPTZ,
    next_sync TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'syncing', 'error', 'paused')),
    sync_type TEXT DEFAULT 'full', -- full, incremental, webhook
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    event TEXT,
    received_at TIMESTAMPTZ DEFAULT now(),
    processed BOOLEAN DEFAULT false,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create integration_secrets table for webhook secrets
CREATE TABLE IF NOT EXISTS integration_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL,
    key TEXT NOT NULL,
    encrypted_value TEXT NOT NULL, -- In production, this should be encrypted
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_integration_secret UNIQUE (service, key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_external_services_source ON external_services(source);
CREATE INDEX IF NOT EXISTS idx_external_services_active ON external_services(active);
CREATE INDEX IF NOT EXISTS idx_external_clients_source ON external_clients(source);
CREATE INDEX IF NOT EXISTS idx_external_clients_email ON external_clients(email);
CREATE INDEX IF NOT EXISTS idx_external_bookings_source ON external_bookings(source);
CREATE INDEX IF NOT EXISTS idx_external_bookings_datetime ON external_bookings(datetime);
CREATE INDEX IF NOT EXISTS idx_external_bookings_status ON external_bookings(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_received_at ON webhook_logs(received_at);

-- Enable Row Level Security
ALTER TABLE external_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_secrets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access to external data" ON external_services
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to external clients" ON external_clients
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to external bookings" ON external_clients
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to sync status" ON integration_sync_status
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to webhook logs" ON webhook_logs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to integration secrets" ON integration_secrets
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Create function to sync external service to internal service
CREATE OR REPLACE FUNCTION sync_external_service_to_internal(
    p_service_id TEXT,
    p_source TEXT DEFAULT 'booksy'
)
RETURNS UUID AS $$
DECLARE
    external_service external_services%ROWTYPE;
    internal_service_id UUID;
BEGIN
    -- Get external service
    SELECT * INTO external_service
    FROM external_services
    WHERE service_id = p_service_id AND source = p_source;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'External service not found: %', p_service_id;
    END IF;

    -- Check if internal service already exists
    SELECT id INTO internal_service_id
    FROM services
    WHERE external_id = external_service.service_id AND external_source = external_service.source;

    IF internal_service_id IS NULL THEN
        -- Create new internal service
        INSERT INTO services (
            name,
            description,
            duration,
            price,
            currency,
            category,
            active,
            external_id,
            external_source,
            created_at
        ) VALUES (
            external_service.name,
            external_service.description,
            external_service.duration,
            external_service.price,
            external_service.currency,
            external_service.category,
            external_service.active,
            external_service.service_id,
            external_service.source,
            now()
        )
        RETURNING id INTO internal_service_id;
    ELSE
        -- Update existing internal service
        UPDATE services
        SET
            name = external_service.name,
            description = external_service.description,
            duration = external_service.duration,
            price = external_service.price,
            currency = external_service.currency,
            category = external_service.category,
            active = external_service.active,
            updated_at = now()
        WHERE id = internal_service_id;
    END IF;

    RETURN internal_service_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update sync status
CREATE TRIGGER update_integration_sync_status
    BEFORE UPDATE ON integration_sync_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for webhook logs updated_at
CREATE TRIGGER update_webhook_logs_updated_at
    BEFORE UPDATE ON webhook_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle failed webhooks
CREATE OR REPLACE FUNCTION retry_failed_webhooks()
RETURNS INTEGER AS $$
DECLARE
    retry_count INTEGER := 0;
    failed_webhook webhook_logs%ROWTYPE;
BEGIN
    FOR failed_webhook IN
        SELECT * FROM webhook_logs
        WHERE processed = false
        AND retry_count < 5
        AND created_at > now() - interval '24 hours'
        ORDER BY received_at ASC
        LIMIT 100
    LOOP
        -- Attempt to process the webhook again
        -- This would typically call the processing function
        UPDATE webhook_logs
        SET
            retry_count = retry_count + 1,
            updated_at = now()
        WHERE id = failed_webhook.id;

        retry_count := retry_count + 1;
    END LOOP;

    RETURN retry_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON external_services TO service_role;
GRANT ALL ON external_clients TO service_role;
GRANT ALL ON external_bookings TO service_role;
GRANT ALL ON integration_sync_status TO service_role;
GRANT ALL ON webhook_logs TO service_role;
GRANT ALL ON integration_secrets TO service_role;

GRANT EXECUTE ON FUNCTION sync_external_service_to_internal TO service_role;
GRANT EXECUTE ON FUNCTION retry_failed_webhooks TO service_role;

-- Insert initial sync status for Booksy
INSERT INTO integration_sync_status (source, status, sync_type)
VALUES ('booksy', 'idle', 'webhook')
ON CONFLICT (source) DO NOTHING;

-- Create view for booking dashboard
CREATE OR REPLACE VIEW external_booking_summary AS
SELECT
    b.source,
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE b.status = 'confirmed') as confirmed_bookings,
    COUNT(*) FILTER (WHERE b.status = 'cancelled') as cancelled_bookings,
    COUNT(*) FILTER (WHERE b.datetime >= CURRENT_DATE) as today_bookings,
    COUNT(*) FILTER (WHERE b.datetime >= CURRENT_DATE - INTERVAL '7 days') as week_bookings,
    COALESCE(SUM(b.price), 0) as total_revenue,
    COALESCE(SUM(b.price) FILTER (WHERE b.status = 'confirmed'), 0) as confirmed_revenue
FROM external_bookings b
GROUP BY b.source;