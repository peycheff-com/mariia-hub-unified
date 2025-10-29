-- Enhanced Stripe Integration Migration
-- Tables for Stripe payments, webhooks, and dispute handling

-- Create payment_intents table
CREATE TABLE IF NOT EXISTS payment_intents (
    id TEXT PRIMARY KEY,
    client_secret TEXT NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'pln',
    status TEXT NOT NULL CHECK (status IN (
        'requires_payment_method',
        'requires_confirmation',
        'requires_action',
        'processing',
        'succeeded',
        'canceled',
        'requires_capture'
    )),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create stripe_customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES stripe_customers(id),
    type TEXT NOT NULL, -- card, blik, etc.
    last4 TEXT,
    brand TEXT,
    expires_month INTEGER,
    expires_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment_refunds table
CREATE TABLE IF NOT EXISTS payment_refunds (
    id TEXT PRIMARY KEY,
    payment_intent_id TEXT NOT NULL REFERENCES payment_intents(id),
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'pending',
        'succeeded',
        'failed',
        'canceled'
    )),
    reason TEXT CHECK (reason IN (
        'duplicate',
        'fraudulent',
        'requested_by_customer'
    )),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment_disputes table
CREATE TABLE IF NOT EXISTS payment_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_dispute_id TEXT UNIQUE NOT NULL,
    payment_intent_id TEXT REFERENCES payment_intents(id),
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    reason TEXT NOT NULL, -- duplicate, fraudulent, subscription_canceled, etc.
    status TEXT NOT NULL DEFAULT 'needs_response',
    evidence_due_by TIMESTAMPTZ,
    evidence JSONB DEFAULT '{}',
    resolved_at TIMESTAMPTZ,
    outcome JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_price_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'pln',
    interval TEXT NOT NULL CHECK (interval IN ('day', 'week', 'month', 'year')),
    interval_count INTEGER NOT NULL DEFAULT 1,
    trial_period_days INTEGER,
    active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES stripe_customers(id),
    price_id TEXT NOT NULL REFERENCES subscription_plans(stripe_price_id),
    status TEXT NOT NULL CHECK (status IN (
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'incomplete',
        'incomplete_expired'
    )),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment_attempts table for tracking retry logic
CREATE TABLE IF NOT EXISTS payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id TEXT NOT NULL REFERENCES payment_intents(id),
    attempt_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('attempting', 'succeeded', 'failed')),
    error_code TEXT,
    error_message TEXT,
    retry_after INTEGER, -- Seconds to wait before retry
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment_analytics table for performance metrics
CREATE TABLE IF NOT EXISTS payment_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_payments INTEGER DEFAULT 0,
    successful_payments INTEGER DEFAULT 0,
    failed_payments INTEGER DEFAULT 0,
    total_amount_cents INTEGER DEFAULT 0,
    average_amount_cents INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    currency TEXT DEFAULT 'pln',
    payment_method_breakdown JSONB DEFAULT '{}', -- {card: 50, blik: 30}
    failure_reasons JSONB DEFAULT '{}', -- {insufficient_funds: 10, expired_card: 5}
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_payment_analytics_date UNIQUE (date, currency)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_created_at ON payment_intents(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_intents_metadata ON payment_intents USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_email ON stripe_customers(email);
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer_id ON payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_intent ON payment_refunds(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_created_at ON payment_refunds(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_evidence_due_by ON payment_disputes(evidence_due_by);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_payment_intent ON payment_attempts(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_date ON payment_analytics(date);

-- Enable Row Level Security
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access to payment data" ON payment_intents
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to customers" ON stripe_customers
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to payment methods" ON payment_methods
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to refunds" ON payment_refunds
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to disputes" ON payment_disputes
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to subscriptions" ON subscriptions
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role read access to payment analytics" ON payment_analytics
    FOR SELECT TO service_role
    USING (true);

-- Create function to update payment analytics
CREATE OR REPLACE FUNCTION update_payment_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily analytics when payment intent status changes to succeeded
    IF TG_OP = 'UPDATE' AND OLD.status != 'succeeded' AND NEW.status = 'succeeded' THEN
        INSERT INTO payment_analytics (
            date,
            total_payments,
            successful_payments,
            total_amount_cents,
            average_amount_cents,
            success_rate,
            currency
        )
        VALUES (
            CURRENT_DATE,
            1,
            1,
            NEW.amount,
            NEW.amount,
            100,
            NEW.currency
        )
        ON CONFLICT (date, currency)
        DO UPDATE SET
            total_payments = payment_analytics.total_payments + 1,
            successful_payments = payment_analytics.successful_payments + 1,
            total_amount_cents = payment_analytics.total_amount_cents + NEW.amount,
            average_amount_cents = (payment_analytics.total_amount_cents + NEW.amount) /
                (payment_analytics.successful_payments + 1),
            success_rate = (payment_analytics.successful_payments + 1.0) /
                (payment_analytics.total_payments + 1.0) * 100,
            updated_at = now();
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'failed' AND NEW.status IN ('requires_payment_method', 'canceled') THEN
        -- Update failed payment count
        INSERT INTO payment_analytics (
            date,
            total_payments,
            failed_payments,
            currency
        )
        VALUES (
            CURRENT_DATE,
            1,
            1,
            NEW.currency
        )
        ON CONFLICT (date, currency)
        DO UPDATE SET
            total_payments = payment_analytics.total_payments + 1,
            failed_payments = payment_analytics.failed_payments + 1,
            success_rate = CASE
                WHEN payment_analytics.total_payments > 0 THEN
                    (payment_analytics.successful_payments::DECIMAL / (payment_analytics.total_payments + 1)) * 100
                ELSE 0
            END,
            updated_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_payment_intents_updated_at
    BEFORE UPDATE ON payment_intents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_customers_updated_at
    BEFORE UPDATE ON stripe_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_refunds_updated_at
    BEFORE UPDATE ON payment_refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_disputes_updated_at
    BEFORE UPDATE ON payment_disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_payment_analytics
    AFTER UPDATE ON payment_intents
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_analytics();

-- Create function to calculate success rate for a period
CREATE OR REPLACE FUNCTION get_payment_success_rate(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    date DATE,
    total_payments BIGINT,
    successful_payments BIGINT,
    success_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pi.created_at::DATE as date,
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE pi.status = 'succeeded') as successful_payments,
        CASE
            WHEN COUNT(*) > 0 THEN
                (COUNT(*) FILTER (WHERE pi.status = 'succeeded')::DECIMAL / COUNT(*)) * 100
            ELSE 0
        END as success_rate
    FROM payment_intents pi
    WHERE pi.created_at::DATE BETWEEN start_date AND end_date
    GROUP BY pi.created_at::DATE
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get payment method distribution
CREATE OR REPLACE FUNCTION get_payment_method_distribution(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days'
)
RETURNS TABLE (
    method TEXT,
    count BIGINT,
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH payment_counts AS (
        SELECT
            COALESCE(pm.type, 'unknown') as method,
            COUNT(*) as count
        FROM payment_intents pi
        LEFT JOIN payment_methods pm ON pm.id = (
            SELECT payment_method_id FROM charges WHERE payment_intent_id = pi.id LIMIT 1
        )
        WHERE pi.created_at::DATE >= start_date
            AND pi.status = 'succeeded'
        GROUP BY COALESCE(pm.type, 'unknown')
    ),
    total_payments AS (
        SELECT SUM(count) as total FROM payment_counts
    )
    SELECT
        pc.method,
        pc.count,
        (pc.count::DECIMAL / tp.total) * 100 as percentage
    FROM payment_counts pc
    CROSS JOIN total_payments tp
    ORDER BY pc.count DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON payment_intents TO service_role;
GRANT ALL ON stripe_customers TO service_role;
GRANT ALL ON payment_methods TO service_role;
GRANT ALL ON payment_refunds TO service_role;
GRANT ALL ON payment_disputes TO service_role;
GRANT ALL ON subscription_plans TO service_role;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON payment_attempts TO service_role;
GRANT SELECT ON payment_analytics TO service_role;

GRANT EXECUTE ON FUNCTION get_payment_success_rate TO service_role;
GRANT EXECUTE ON FUNCTION get_payment_method_distribution TO service_role;

-- Create view for payment dashboard
CREATE OR REPLACE VIEW payment_dashboard AS
SELECT
    DATE(pi.created_at) as date,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE pi.status = 'succeeded') as successful_transactions,
    COUNT(*) FILTER (WHERE pi.status IN ('requires_payment_method', 'canceled')) as failed_transactions,
    COALESCE(SUM(pi.amount), 0) as total_amount,
    COALESCE(AVG(pi.amount), 0) as average_amount,
    CASE
        WHEN COUNT(*) > 0 THEN
            (COUNT(*) FILTER (WHERE pi.status = 'succeeded')::DECIMAL / COUNT(*)) * 100
        ELSE 0
    END as success_rate
FROM payment_intents pi
GROUP BY DATE(pi.created_at)
ORDER BY date DESC;

-- Insert default subscription plans
INSERT INTO subscription_plans (stripe_price_id, name, description, amount, interval, interval_count)
VALUES
    ('price_basic_monthly', 'Basic Monthly', 'Access to basic features', 29900, 'month', 1),
    ('price_premium_monthly', 'Premium Monthly', 'Access to all features', 59900, 'month', 1),
    ('price_basic_yearly', 'Basic Yearly', 'Access to basic features - Save 20%', 287000, 'year', 1),
    ('price_premium_yearly', 'Premium Yearly', 'Access to all features - Save 20%', 575000, 'year', 1)
ON CONFLICT (stripe_price_id) DO NOTHING;