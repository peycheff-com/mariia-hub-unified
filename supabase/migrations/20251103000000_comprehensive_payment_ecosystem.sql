-- Comprehensive Payment Ecosystem Database Schema
-- Supports Polish market payment methods, multi-currency, subscriptions, invoicing, and compliance

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Payment Methods Configuration
CREATE TABLE IF NOT EXISTS payment_methods (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    display_name text NOT NULL,
    type text NOT NULL CHECK (type IN ('card', 'bank_transfer', 'mobile', 'wallet', 'installments', 'cash')),
    provider text NOT NULL,
    icon text,
    description text,
    fees jsonb NOT NULL DEFAULT '{}',
    limits jsonb NOT NULL DEFAULT '{}',
    available_countries text[] DEFAULT '{}',
    verification_required boolean DEFAULT false,
    processing_time jsonb NOT NULL DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Polish Payment Methods
INSERT INTO payment_methods (id, name, display_name, type, provider, description, fees, limits, processing_time, metadata) VALUES
    ('blik_method', 'blik', 'BLIK - Szybka płatność mobilna', 'mobile', 'polish-gateways',
     'Natychmiastowa płatność za pomocą kodu BLIK z aplikacji bankowej',
     '{"type": "fixed", "fixed": 0, "currency": "PLN", "description": "Darmowa płatność dla klientów"}',
     '{"minAmount": 1, "maxAmount": 25000, "currency": "PLN", "dailyLimit": 50000, "monthlyLimit": 100000}',
     '{"type": "instant", "value": 0, "description": "Płatność natychmiastowa"}',
     '{"popularInPoland": true, "userFriendly": true, "mobileFirst": true}'),

    ('payu_method', 'payu', 'PayU - Płatności online', 'bank_transfer', 'polish-gateways',
     'Tradycyjny przelew online dostępny w polskich bankach',
     '{"type": "percentage", "percentage": 1.0, "currency": "PLN", "description": "1% opłata transakcyjna"}',
     '{"minAmount": 1, "maxAmount": 50000, "currency": "PLN"}',
     '{"type": "minutes", "value": 15, "description": "Do 15 minut"}',
     '{"supportedBanks": ["PKO BP", "mBank", "Bank Pekao", "ING Bank Śląski", "Bank Millennium", "Alior Bank", "Santander", "Getin Bank"]}'),

    ('przelewy24_method', 'przelewy24', 'Przelewy24 - Szybkie przelewy', 'bank_transfer', 'polish-gateways',
     'Najszybsze przelewy online z polskich banków',
     '{"type": "percentage", "percentage": 1.2, "currency": "PLN", "description": "1.2% opłata transakcyjna"}',
     '{"minAmount": 1, "maxAmount": 250000, "currency": "PLN"}',
     '{"type": "minutes", "value": 10, "description": "Do 10 minut"}',
     '{"instantBanking": true, "supportedMethods": ["mTransfer", "Przelew na telefon", "Blik", "Płacę z iPKO", "Płać z ING", "e-Płatności", "Płacę z Aliora"]}'),

    ('cash_on_delivery', 'cash_on_delivery', 'Gotówka przy odbiorze', 'cash', 'polish-gateways',
     'Zapłać gotówką podczas wizyty w salonie',
     '{"type": "fixed", "fixed": 0, "currency": "PLN", "description": "Bez opłat"}',
     '{"minAmount": 50, "maxAmount": 2000, "currency": "PLN"}',
     '{"type": "instant", "value": 0, "description": "Płatność przy odbiorze"}',
     '{"inPersonPayment": true, "requiresAppointment": true}'),

    ('bank_transfer_method', 'bank_transfer', 'Przelew bankowy', 'bank_transfer', 'polish-gateways',
     'Przelew tradycyjny na konto bankowe',
     '{"type": "fixed", "fixed": 0, "currency": "PLN", "description": "Bez opłat"}',
     '{"minAmount": 1, "maxAmount": 1000000, "currency": "PLN"}',
     '{"type": "hours", "value": 24, "description": "Do 24 godzin"}',
     '{"accountDetails": {"bank": "mBank S.A.", "accountNumber": "PL 1234 5678 9012 3456 7890 1234 5678", "recipient": "Mariia Hub Sp. z o.o.", "address": "ul. Jana Pawła II 43/15, 00-001 Warszawa"}}'),

    ('stripe_card', 'stripe_card', 'Płatność kartą', 'card', 'stripe',
     'Płatność kartą kredytową/debetową',
     '{"type": "mixed", "percentage": 1.2, "fixed": 0.5, "currency": "PLN", "description": "1.2% + 0.50 PLN"}',
     '{"minAmount": 1, "maxAmount": 150000, "currency": "PLN"}',
     '{"type": "instant", "value": 0, "description": "Natychmiastowa"}',
     '{"supportedCards": ["Visa", "Mastercard", "American Express"], "3dsRequired": true}');

-- Payment Attempts Tracking
CREATE TABLE IF NOT EXISTS payment_attempts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id text UNIQUE,
    provider text NOT NULL,
    method text NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    fees numeric DEFAULT 0,
    status text NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'requires_action')),
    customer_id uuid REFERENCES profiles(id),
    booking_id uuid REFERENCES bookings(id),
    subscription_id uuid REFERENCES subscriptions(id),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    processed_at timestamptz
);

-- Polish Payment Gateway Specific Tables
CREATE TABLE IF NOT EXISTS polish_payment_attempts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id text UNIQUE,
    method text NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    status text NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
    customer_id uuid REFERENCES profiles(id),
    booking_id uuid REFERENCES bookings(id),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    processed_at timestamptz
);

CREATE TABLE IF NOT EXISTS polish_payment_refunds (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_id text UNIQUE,
    payment_intent_id text NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    reason text,
    status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS polish_webhook_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider text NOT NULL,
    event_type text NOT NULL,
    event_id text NOT NULL,
    payload jsonb NOT NULL,
    processed boolean DEFAULT false,
    error text,
    created_at timestamptz DEFAULT now()
);

-- Currency Conversion Tables
CREATE TABLE IF NOT EXISTS exchange_rate_cache (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency text NOT NULL,
    to_currency text NOT NULL,
    rate numeric NOT NULL,
    provider text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(from_currency, to_currency, provider)
);

CREATE TABLE IF NOT EXISTS conversion_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency text NOT NULL,
    to_currency text NOT NULL,
    from_amount numeric NOT NULL,
    to_amount numeric NOT NULL,
    rate numeric NOT NULL,
    fee numeric NOT NULL,
    total_fee numeric NOT NULL,
    provider text NOT NULL,
    customer_id uuid REFERENCES profiles(id),
    booking_id uuid REFERENCES bookings(id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exchange_rate_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    date date NOT NULL,
    from_currency text NOT NULL,
    to_currency text NOT NULL,
    rate numeric NOT NULL,
    provider text NOT NULL,
    volume numeric DEFAULT 0,
    high numeric,
    low numeric,
    change numeric DEFAULT 0,
    change_percent numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(date, from_currency, to_currency, provider)
);

-- Subscription System Tables
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'quarter', 'year')),
    features jsonb NOT NULL DEFAULT '[]',
    benefits text[] DEFAULT '{}',
    max_bookings_per_month integer,
    discount_percentage numeric,
    priority_booking boolean DEFAULT false,
    free_services text[] DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id uuid REFERENCES profiles(id) NOT NULL,
    tier_id uuid REFERENCES subscription_tiers(id) NOT NULL,
    status text NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid', 'paused')),
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    cancel_at_period_end boolean DEFAULT false,
    canceled_at timestamptz,
    cancel_reason text,
    paused_at timestamptz,
    pause_until timestamptz,
    resumed_at timestamptz,
    payment_method_id text,
    price numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'quarter', 'year')),
    trial_end timestamptz,
    add_ons text[] DEFAULT '{}',
    discount_code text,
    discount_amount numeric DEFAULT 0,
    billing_attempts integer DEFAULT 0,
    last_billing_failure timestamptz,
    next_billing_attempt timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_usage (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
    feature text NOT NULL,
    current_usage integer DEFAULT 0,
    limit integer NOT NULL,
    reset_date timestamptz NOT NULL,
    period text NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(subscription_id, feature)
);

CREATE TABLE IF NOT EXISTS subscription_add_ons (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
    applicable_tiers text[] DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_discounts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value numeric NOT NULL,
    currency text,
    duration text NOT NULL CHECK (duration IN ('once', 'repeating', 'forever')),
    duration_in_months integer,
    applicable_tiers text[] DEFAULT '{}',
    coupon_code text UNIQUE,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Invoice System Tables
CREATE TABLE IF NOT EXISTS invoice_sequences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    prefix text NOT NULL,
    year integer NOT NULL,
    month integer,
    next_number integer NOT NULL,
    reset_type text NOT NULL CHECK (reset_type IN ('monthly', 'yearly', 'never')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(prefix, year, month)
);

CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number text UNIQUE NOT NULL,
    type text NOT NULL CHECK (type IN ('standard', 'proforma', 'corrective', 'advance')),
    status text NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    amount numeric NOT NULL,
    vat_amount numeric NOT NULL,
    total_amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    issue_date timestamptz NOT NULL,
    due_date timestamptz NOT NULL,
    paid_at timestamptz,
    seller_id text NOT NULL,
    buyer_id uuid REFERENCES profiles(id),
    booking_id uuid REFERENCES bookings(id),
    subscription_id uuid REFERENCES subscriptions(id),
    payment_id text,
    items jsonb NOT NULL DEFAULT '[]',
    vat_rates jsonb NOT NULL DEFAULT '[]',
    metadata jsonb DEFAULT '{}',
    pdf_url text,
    xml_url text,
    sent_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('standard', 'proforma', 'corrective', 'advance')),
    language text NOT NULL CHECK (language IN ('pl', 'en')),
    template text NOT NULL,
    css text,
    is_default boolean DEFAULT false,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS e_invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
    format text NOT NULL CHECK (format IN ('ksef', 'edi', 'ubl')),
    xml_content text NOT NULL,
    signature text,
    qr_code text,
    status text NOT NULL CHECK (status IN ('generated', 'sent', 'delivered', 'failed')),
    sent_at timestamptz,
    delivered_at timestamptz,
    error_message text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    type text NOT NULL CHECK (type IN ('vat_7', 'vat_ue', 'pit_4', 'cit_8')),
    period jsonb NOT NULL,
    data jsonb NOT NULL,
    status text NOT NULL CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected')),
    submitted_at timestamptz,
    accepted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Refund System Tables
CREATE TABLE IF NOT EXISTS refund_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id text NOT NULL,
    customer_id uuid REFERENCES profiles(id) NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    reason jsonb NOT NULL,
    description text,
    status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'failed', 'cancelled')),
    type text NOT NULL CHECK (type IN ('full', 'partial')),
    requested_at timestamptz DEFAULT now(),
    processed_at timestamptz,
    approved_at timestamptz,
    approved_by text,
    processor text,
    refund_id text,
    failure_reason text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refund_policies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    service_type text NOT NULL,
    service_id uuid REFERENCES services(id),
    timeframes jsonb NOT NULL DEFAULT '[]',
    conditions jsonb NOT NULL DEFAULT '[]',
    exclusions text[] DEFAULT '{}',
    processing_fees jsonb NOT NULL DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refund_notes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_request_id uuid REFERENCES refund_requests(id) ON DELETE CASCADE,
    author text NOT NULL,
    content text NOT NULL,
    is_internal boolean DEFAULT true,
    category text CHECK (category IN ('processing', 'approval', 'communication', 'investigation')),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dispute_cases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id text NOT NULL,
    customer_id uuid REFERENCES profiles(id),
    dispute_id text NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    reason text NOT NULL,
    status text NOT NULL CHECK (status IN ('needs_response', 'under_review', 'won', 'lost', 'resolved')),
    evidence jsonb DEFAULT '[]',
    deadlines jsonb DEFAULT '[]',
    communications jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    resolved_at timestamptz,
    outcome jsonb
);

CREATE TABLE IF NOT EXISTS chargeback_cases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id text NOT NULL,
    customer_id uuid REFERENCES profiles(id),
    chargeback_id text NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    reason text NOT NULL,
    stage text NOT NULL CHECK (stage IN ('notification', 'first_presentation', 'second_presentation', 'arbitration', 'resolved')),
    status text NOT NULL CHECK (status IN ('pending', 'under_review', 'won', 'lost', 'settled')),
    documents jsonb DEFAULT '[]',
    timeline jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    resolved_at timestamptz,
    settlement_amount numeric
);

-- Compliance and Monitoring Tables
CREATE TABLE IF NOT EXISTS kyc_records (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id uuid REFERENCES profiles(id) NOT NULL,
    status text NOT NULL CHECK (status IN ('not_started', 'in_progress', 'verified', 'rejected', 'requires_additional_info')),
    verification_level text NOT NULL CHECK (verification_level IN ('basic', 'standard', 'enhanced')),
    documents jsonb DEFAULT '[]',
    verifications jsonb DEFAULT '[]',
    risk_assessment jsonb NOT NULL,
    submitted_at timestamptz,
    verified_at timestamptz,
    next_review_date timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kyc_documents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    kyc_record_id uuid REFERENCES kyc_records(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('identity_card', 'passport', 'driving_license', 'proof_of_address', 'tax_id', 'company_documents')),
    status text NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
    file_name text NOT NULL,
    file_url text NOT NULL,
    uploaded_at timestamptz DEFAULT now(),
    verified_at timestamptz,
    verified_by text,
    rejection_reason text,
    expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS transaction_monitoring (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id text NOT NULL,
    customer_id uuid REFERENCES profiles(id),
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    risk_score numeric NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    alerts jsonb DEFAULT '[]',
    status text NOT NULL CHECK (status IN ('cleared', 'under_review', 'blocked', 'reported')),
    reviewed_by text,
    reviewed_at timestamptz,
    reported_to text,
    reported_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    type text NOT NULL CHECK (type IN ('aml', 'kyc', 'transaction_monitoring', 'gdpr')),
    period jsonb NOT NULL,
    generated_at timestamptz DEFAULT now(),
    metrics jsonb NOT NULL,
    findings jsonb DEFAULT '[]',
    recommendations text[] DEFAULT '{}',
    status text NOT NULL CHECK (status IN ('draft', 'final', 'submitted')),
    submitted_to text,
    submitted_at timestamptz
);

CREATE TABLE IF NOT EXISTS data_retention_policies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_type text NOT NULL UNIQUE,
    retention_period integer NOT NULL,
    retention_reason text NOT NULL,
    legal_basis text NOT NULL,
    deletion_method text NOT NULL CHECK (deletion_method IN ('permanent', 'anonymize', 'archive')),
    exceptions text[] DEFAULT '{}',
    last_reviewed timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Analytics and Reporting Tables
CREATE TABLE IF NOT EXISTS settlement_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    date date NOT NULL,
    provider text NOT NULL,
    total_amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    fees numeric NOT NULL,
    net_amount numeric NOT NULL,
    transaction_count integer NOT NULL,
    successful_transactions integer NOT NULL,
    failed_transactions integer NOT NULL,
    refunds integer NOT NULL,
    chargebacks integer NOT NULL,
    transactions jsonb DEFAULT '[]',
    metadata jsonb DEFAULT '{}',
    status text NOT NULL CHECK (status IN ('draft', 'final', 'exported')),
    generated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_analytics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id text NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'PLN',
    provider text NOT NULL,
    customer_id uuid REFERENCES profiles(id),
    status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending')),
    processed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    type text NOT NULL CHECK (type IN ('revenue_drop', 'high_failure_rate', 'chargeback_spike', 'compliance_issue', 'fraud_detection')),
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title text NOT NULL,
    description text NOT NULL,
    metrics jsonb NOT NULL,
    threshold numeric NOT NULL,
    current_value numeric NOT NULL,
    triggered_at timestamptz DEFAULT now(),
    acknowledged boolean DEFAULT false,
    acknowledged_by text,
    acknowledged_at timestamptz,
    resolved boolean DEFAULT false,
    resolved_by text,
    resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS accounting_exports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    format text NOT NULL CHECK (format IN ('csv', 'xml', 'json', 'pdf')),
    type text NOT NULL CHECK (type IN ('transactions', 'invoices', 'refunds', 'tax_report', 'settlement')),
    filename text NOT NULL,
    data jsonb NOT NULL,
    provider text,
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    generated_at timestamptz DEFAULT now()
);

-- System Configuration Tables
CREATE TABLE IF NOT EXISTS compliance_schedules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    type text NOT NULL,
    frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    next_run timestamptz NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transaction_monitoring_rules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    type text NOT NULL,
    threshold numeric,
    currency text DEFAULT 'PLN',
    action text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description text,
    timeframe text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Webhook Logs for all providers
CREATE TABLE IF NOT EXISTS webhook_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    source text NOT NULL,
    event_id text NOT NULL,
    event_type text NOT NULL,
    processed boolean DEFAULT false,
    error text,
    raw_data jsonb,
    created_at timestamptz DEFAULT now()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_payment_attempts_customer_id ON payment_attempts(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_created_at ON payment_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_provider ON payment_attempts(provider);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_invoices_buyer_id ON invoices(buyer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);

CREATE INDEX IF NOT EXISTS idx_refund_requests_customer_id ON refund_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_requested_at ON refund_requests(requested_at);

CREATE INDEX IF NOT EXISTS idx_transaction_monitoring_customer_id ON transaction_monitoring(customer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_monitoring_risk_score ON transaction_monitoring(risk_score);
CREATE INDEX IF NOT EXISTS idx_transaction_monitoring_status ON transaction_monitoring(status);

CREATE INDEX IF NOT EXISTS idx_kyc_records_customer_id ON kyc_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_kyc_records_status ON kyc_records(status);
CREATE INDEX IF NOT EXISTS idx_kyc_records_next_review_date ON kyc_records(next_review_date);

CREATE INDEX IF NOT EXISTS idx_conversion_history_customer_id ON conversion_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversion_history_created_at ON conversion_history(created_at);

CREATE INDEX IF NOT EXISTS idx_financial_alerts_triggered_at ON financial_alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_severity ON financial_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_resolved ON financial_alerts(resolved);

-- RLS (Row Level Security) policies
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_records ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (these would need to be expanded based on specific requirements)
CREATE POLICY "Users can view their own payment attempts" ON payment_attempts
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can view their own refund requests" ON refund_requests
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can view their own KYC records" ON kyc_records
    FOR SELECT USING (auth.uid() = customer_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_payment_attempts_updated_at BEFORE UPDATE ON payment_attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refund_requests_updated_at BEFORE UPDATE ON refund_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_records_updated_at BEFORE UPDATE ON kyc_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize default invoice sequence
INSERT INTO invoice_sequences (prefix, year, next_number, reset_type)
VALUES ('FV', EXTRACT(year FROM now()), 1, 'monthly')
ON CONFLICT (prefix, year, month) DO NOTHING;

-- Initialize default data retention policies
INSERT INTO data_retention_policies (data_type, retention_period, retention_reason, legal_basis, deletion_method) VALUES
    ('transaction_records', 3650, 'Podatkowe i prawne wymagania', 'Ustawa o rachunkowości, przepisy podatkowe', 'archive'),
    ('customer_data', 1825, 'Wymogi RODO i AML', 'RODO, ustawa o przeciwdziałaniu praniu pieniędzy', 'anonymize'),
    ('kyc_documents', 3650, 'Wymogi AML i KYC', 'Ustawa o przeciwdziałaniu praniu pieniędzy', 'permanent'),
    ('compliance_reports', 2555, 'Wymogi audytowe i prawne', 'Przepisy KNF, wymogi audytowe', 'archive'),
    ('audit_logs', 730, 'Bezpieczeństwo systemu i śledzenie', 'RODO, wymogi bezpieczeństwa', 'permanent')
ON CONFLICT (data_type) DO NOTHING;

-- Initialize compliance schedules
INSERT INTO compliance_schedules (name, type, frequency, next_run) VALUES
    ('Dzienne monitorowanie transakcji', 'transaction_monitoring', 'daily', now() + interval '1 day'),
    ('Tygodniowy przegląd AML', 'aml_review', 'weekly', now() + interval '1 week'),
    ('Miesięczny audyt KYC', 'kyc_audit', 'monthly', now() + interval '1 month'),
    ('Kwartalny raport zgodności', 'compliance_report', 'quarterly', now() + interval '3 months'),
    ('Roczny audyt zewnętrzny', 'external_audit', 'yearly', now() + interval '1 year')
ON CONFLICT DO NOTHING;

-- Initialize transaction monitoring rules
INSERT INTO transaction_monitoring_rules (name, type, threshold, action, severity, description) VALUES
    ('High value transaction monitoring', 'amount_threshold', 50000, 'flag_for_review', 'high', 'Monitor transakcje powyżej 50,000 PLN'),
    ('Frequent transaction pattern', 'frequency_pattern', 10, 'flag_for_review', 'medium', 'Monitor częste transakcje w ciągu 24 godzin'),
    ('Unusual transaction amount', 'unusual_behavior', 500, 'flag_for_review', 'medium', 'Monitor transakcje odbiegające od średniej klienta'),
    ('PSD2 strong authentication', 'psd2_compliance', 1100, 'require_sca', 'medium', 'Wymagaj silnego uwierzytelniania powyżej 1,100 PLN')
ON CONFLICT DO NOTHING;