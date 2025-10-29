-- Polish VAT Compliance System Migration
-- Implements comprehensive tax compliance features for Polish market

-- =============================================
-- POLISH VAT COMPLIANCE TYPES
-- =============================================

-- VAT rate types for Polish tax system
DO $$ BEGIN
    CREATE TYPE vat_rate AS ENUM (
        '23',    -- Standard VAT rate
        '8',     -- Reduced rate for books, restaurants, etc.
        '5',     -- Reduced rate for some food products
        '0',     -- Zero rate for exports/intra-EU
        'zw',    -- Tax exempt (zwolniony)
        'np'     -- Not applicable (nie podlega)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Invoice types according to Polish regulations
DO $$ BEGIN
    CREATE TYPE invoice_type AS ENUM (
        'faktura',           -- Standard invoice
        'faktura_proforma',  -- Pro forma invoice
        'faktura_zaliczkowa', -- Advance invoice
        'korekta',           -- Credit note
        'paragon',           -- Receipt
        'duplikat'           -- Duplicate
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Customer types for VAT purposes
DO $$ BEGIN
    CREATE TYPE customer_type AS ENUM (
        'person',            -- Individual consumer
        'company_polish',    -- Polish company
        'company_eu',        -- EU company
        'company_non_eu'     -- Non-EU company
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- NIP (VAT NUMBER) VALIDATION
-- =============================================

-- Validated NIP numbers cache for performance
CREATE TABLE IF NOT EXISTS nip_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip_number TEXT NOT NULL UNIQUE,
    is_valid BOOLEAN NOT NULL,
    company_name TEXT,
    registration_date DATE,
    status TEXT, -- Active, suspended, etc.
    validation_source TEXT DEFAULT 'checksum', -- 'checksum' or 'api'
    validated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Cache expiry
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_nip_format CHECK (nip_number ~ '^[0-9]{10}$')
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_nip_validations_nip_number ON nip_validations(nip_number);
CREATE INDEX IF NOT EXISTS idx_nip_validations_expires_at ON nip_validations(expires_at);

-- =============================================
-- COMPANY INFORMATION FOR B2B
-- =============================================

-- Enhanced company information with VAT compliance
CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basic company information
    company_name TEXT NOT NULL,
    company_type TEXT DEFAULT 'limited', -- limited, sole_proprietorship, etc.
    registration_number TEXT UNIQUE, -- KRS number
    nip_number TEXT UNIQUE,
   regon_number TEXT UNIQUE,

    -- VAT compliance
    vat_payer BOOLEAN DEFAULT true,
    vat_registered_date DATE,
    vat_exemption_reason TEXT,
    eu_vat_number TEXT, -- For EU companies

    -- Contact information
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,

    -- Addresses
    headquarters_address JSONB NOT NULL,
    correspondence_address JSONB,

    -- Billing preferences
    preferred_invoice_type invoice_type DEFAULT 'faktura',
    payment_terms INTEGER DEFAULT 14, -- days
    requires_proforma BOOLEAN DEFAULT false,

    -- Legal and compliance
    consent_to_electronic_invoices BOOLEAN DEFAULT false,
    consent_to_data_processing BOOLEAN DEFAULT false,
    gdpr_compliant BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_nip_format CHECK (nip_number ~ '^[0-9]{10}$' OR nip_number IS NULL),
    CONSTRAINT valid_email_format CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR contact_email IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_nip_number ON company_profiles(nip_number);

-- =============================================
-- INVOICE SYSTEM
-- =============================================

-- Main invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_type invoice_type NOT NULL DEFAULT 'faktura',

    -- Related entities
    booking_id UUID REFERENCES bookings(id),
    corporate_account_id UUID REFERENCES corporate_accounts(id),
    company_profile_id UUID REFERENCES company_profiles(id),

    -- Invoice dates (Polish requirements)
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),

    -- Customer information
    customer_type customer_type NOT NULL,
    customer_name TEXT NOT NULL,
    customer_address JSONB NOT NULL,
    customer_nip TEXT,
    customer_email TEXT,

    -- Seller information (our company)
    seller_name TEXT NOT NULL DEFAULT 'Mariia Hub',
    seller_address JSONB NOT NULL,
    seller_nip TEXT NOT NULL,
    seller_bank_account TEXT NOT NULL,

    -- Financial details
    currency TEXT NOT NULL DEFAULT 'PLN',
    exchange_rate DECIMAL(10, 6) DEFAULT 1.0,

    -- VAT details
    vat_basis DECIMAL(12, 2) NOT NULL DEFAULT 0,
    vat_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    vat_rate vat_rate NOT NULL DEFAULT '23',
    total_amount DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (vat_basis + vat_amount) STORED,

    -- Split payment (MPP) support
    split_payment BOOLEAN DEFAULT false,
    split_payment_amount DECIMAL(12, 2) DEFAULT 0,

    -- Reverse charge mechanism
    reverse_charge BOOLEAN DEFAULT false,
    eu_service BOOLEAN DEFAULT false,
    intra_eu_supply BOOLEAN DEFAULT false,

    -- Invoice details
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid',

    -- Corrections
    corrected_invoice_id UUID REFERENCES invoices(id), -- For credit notes
    reason_for_correction TEXT,

    -- Electronic invoice
    is_electronic BOOLEAN DEFAULT false,
    electronic_invoice_path TEXT,
    upo_reference TEXT, -- Unique Purchase Order reference

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT positive_total_amount CHECK (total_amount >= 0),
    CONSTRAINT valid_exchange_rate CHECK (exchange_rate > 0),
    CONSTRAINT valid_dates CHECK (sale_date <= issue_date AND issue_date <= due_date)
);

-- Invoice items for detailed breakdown
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Item details
    item_name TEXT NOT NULL,
    item_description TEXT,
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'szt.',
    unit_price DECIMAL(10, 2) NOT NULL,

    -- VAT for this item
    vat_rate vat_rate NOT NULL DEFAULT '23',
    vat_basis DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price) STORED,
    vat_amount DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (vat_basis * CASE vat_rate::text
        WHEN '23' THEN 0.23
        WHEN '8' THEN 0.08
        WHEN '5' THEN 0.05
        WHEN '0' THEN 0.0
        ELSE 0.0
    END) STORED,
    total_amount DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (vat_basis + vat_amount) STORED,

    -- Categorization
    service_type TEXT, -- beauty, fitness, etc.
    pkwiu_code TEXT, -- Polish classification of products and services

    -- Discounts
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_unit_price CHECK (unit_price >= 0),
    CONSTRAINT valid_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Invoice numbering sequences
CREATE TABLE IF NOT EXISTS invoice_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_type TEXT NOT NULL UNIQUE, -- 'faktura', 'faktura_proforma', 'korekta'
    prefix TEXT NOT NULL,
    current_number INTEGER NOT NULL DEFAULT 1,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    reset_yearly BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT positive_current_number CHECK (current_number > 0)
);

-- Initialize default sequences
INSERT INTO invoice_sequences (sequence_type, prefix, current_number, year)
VALUES
    ('faktura', 'FV', 1, EXTRACT(YEAR FROM CURRENT_DATE)),
    ('faktura_proforma', 'PF', 1, EXTRACT(YEAR FROM CURRENT_DATE)),
    ('korekta', 'KF', 1, EXTRACT(YEAR FROM CURRENT_DATE))
ON CONFLICT (sequence_type) DO NOTHING;

-- =============================================
-- TAX REPORTING
-- =============================================

-- VAT registers for tax reporting
CREATE TABLE IF NOT EXISTS vat_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_type TEXT NOT NULL, -- 'monthly', 'quarterly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Sales register (sprzedaż)
    sales_domestic_23 DECIMAL(12, 2) DEFAULT 0,      -- 23% rate domestic sales
    sales_domestic_8 DECIMAL(12, 2) DEFAULT 0,       -- 8% rate domestic sales
    sales_domestic_5 DECIMAL(12, 2) DEFAULT 0,       -- 5% rate domestic sales
    sales_domestic_0 DECIMAL(12, 2) DEFAULT 0,       -- 0% rate domestic sales
    sales_domestic_exempt DECIMAL(12, 2) DEFAULT 0,  -- Exempt domestic sales
    sales_eu_goods DECIMAL(12, 2) DEFAULT 0,         -- EU goods sales
    sales_eu_services DECIMAL(12, 2) DEFAULT 0,      -- EU services sales
    sales_export DECIMAL(12, 2) DEFAULT 0,           -- Export sales

    -- Purchase register (zakupy)
    purchase_domestic_23 DECIMAL(12, 2) DEFAULT 0,   -- 23% rate domestic purchases
    purchase_domestic_8 DECIMAL(12, 2) DEFAULT 0,    -- 8% rate domestic purchases
    purchase_domestic_5 DECIMAL(12, 2) DEFAULT 0,    -- 5% rate domestic purchases
    purchase_domestic_0 DECIMAL(12, 2) DEFAULT 0,    -- 0% rate domestic purchases
    purchase_domestic_exempt DECIMAL(12, 2) DEFAULT 0, -- Exempt domestic purchases
    purchase_eu_goods DECIMAL(12, 2) DEFAULT 0,      -- EU goods purchases
    purchase_eu_services DECIMAL(12, 2) DEFAULT 0,   -- EU services purchases
    purchase_import DECIMAL(12, 2) DEFAULT 0,        -- Import purchases

    -- Tax calculations
    vat_payable DECIMAL(12, 2) DEFAULT 0,            -- VAT to pay
    vat_deductible DECIMAL(12, 2) DEFAULT 0,         -- VAT to deduct
    vat_difference DECIMAL(12, 2) DEFAULT 0,         -- VAT difference

    -- Status
    status TEXT DEFAULT 'draft',                     -- 'draft', 'submitted', 'verified'
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_period CHECK (period_end >= period_start),
    CONSTRAINT unique_period UNIQUE (period_type, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_vat_registers_period ON vat_registers(period_type, period_start, period_end);

-- =============================================
-- CREDIT NOTES AND REFUNDS
-- =============================================

-- Credit notes (faktury korygujące)
CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_invoice_id UUID NOT NULL REFERENCES invoices(id),
    credit_note_number TEXT NOT NULL UNIQUE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Reason for correction
    correction_reason TEXT NOT NULL,
    correction_type TEXT NOT NULL, -- 'price', 'quantity', 'return', 'cancellation'

    -- Financial details
    total_reduction_amount DECIMAL(12, 2) NOT NULL,
    vat_reduction_amount DECIMAL(12, 2) NOT NULL,

    -- Status
    status TEXT DEFAULT 'issued', -- 'issued', 'applied', 'cancelled'
    applied_at TIMESTAMPTZ,

    -- Refund details
    refund_method TEXT, -- 'bank_transfer', 'card', 'cash'
    refund_reference TEXT,
    refund_status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'failed'
    refund_processed_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT positive_reduction_amount CHECK (total_reduction_amount > 0)
);

-- Refunds tracking
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),
    credit_note_id UUID REFERENCES credit_notes(id),
    booking_id UUID REFERENCES bookings(id),

    -- Refund details
    refund_amount DECIMAL(12, 2) NOT NULL,
    refund_reason TEXT NOT NULL,
    refund_type TEXT NOT NULL, -- 'full', 'partial', 'cancellation_fee'

    -- Processing
    refund_method TEXT NOT NULL, -- 'stripe', 'bank_transfer', 'cash', 'account_credit'
    refund_reference TEXT,
    external_refund_id TEXT, -- Stripe refund ID, etc.

    -- Status tracking
    status TEXT DEFAULT 'initiated', -- 'initiated', 'processing', 'completed', 'failed', 'cancelled'
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failure_reason TEXT,

    -- Financial reconciliation
    settled_in_batch TEXT,
    settlement_date DATE,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT positive_refund_amount CHECK (refund_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_refunds_invoice_id ON refunds(invoice_id);
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- =============================================
-- TAX RATES CONFIGURATION
-- =============================================

-- VAT rates configuration
CREATE TABLE IF NOT EXISTS vat_rate_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL,
    service_category TEXT NOT NULL,

    -- Default VAT rate
    default_vat_rate vat_rate NOT NULL DEFAULT '23',

    -- Conditions for different rates
    conditions_23 JSONB DEFAULT '[]'::jsonb,    -- Conditions for 23% rate
    conditions_8 JSONB DEFAULT '[]'::jsonb,     -- Conditions for 8% rate
    conditions_5 JSONB DEFAULT '[]'::jsonb,     -- Conditions for 5% rate
    conditions_0 JSONB DEFAULT '[]'::jsonb,     -- Conditions for 0% rate
    conditions_exempt JSONB DEFAULT '[]'::jsonb, -- Conditions for exemption

    -- Legal basis
    legal_basis TEXT,
    legal_act TEXT, -- Ustawa o VAT, etc.

    -- Validity
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_dates CHECK (valid_until IS NULL OR valid_from < valid_until),
    CONSTRAINT unique_service_category UNIQUE (service_type, service_category, valid_from)
);

-- Initialize default VAT configurations
INSERT INTO vat_rate_configurations (service_type, service_category, default_vat_rate, legal_basis)
VALUES
    ('beauty', 'lip_enhancements', '23', 'Art. 41 ust. 1 Ustawy o VAT'),
    ('beauty', 'brows_lamination', '23', 'Art. 41 ust. 1 Ustawy o VAT'),
    ('beauty', 'makeup_services', '23', 'Art. 41 ust. 1 Ustawy o VAT'),
    ('fitness', 'personal_training', '23', 'Art. 41 ust. 1 Ustawy o VAT'),
    ('fitness', 'group_classes', '23', 'Art. 41 ust. 1 Ustawy o VAT'),
    ('fitness', 'wellness_programs', '23', 'Art. 41 ust. 1 Ustawy o VAT'),
    ('fitness', 'nutrition_consulting', '23', 'Art. 41 ust. 1 Ustawy o VAT')
ON CONFLICT (service_type, service_category, valid_from) DO NOTHING;

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_invoice_type TEXT)
RETURNS TEXT AS $$
DECLARE
    v_sequence invoice_sequences%ROWTYPE;
    v_next_number INTEGER;
    v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    -- Get or create sequence for this invoice type
    SELECT * INTO v_sequence
    FROM invoice_sequences
    WHERE sequence_type = p_invoice_type AND year = v_year;

    -- If no sequence exists for this year, create one
    IF v_sequence IS NULL THEN
        INSERT INTO invoice_sequences (sequence_type, prefix, current_number, year)
        VALUES (p_invoice_type,
                CASE p_invoice_type
                    WHEN 'faktura' THEN 'FV'
                    WHEN 'faktura_proforma' THEN 'PF'
                    WHEN 'korekta' THEN 'KF'
                    ELSE 'DOC'
                END,
                1, v_year)
        RETURNING * INTO v_sequence;
    END IF;

    -- Get next number
    v_next_number := v_sequence.current_number;

    -- Update sequence
    UPDATE invoice_sequences
    SET current_number = current_number + 1,
        updated_at = NOW()
    WHERE id = v_sequence.id;

    -- Return formatted number
    RETURN v_sequence.prefix || '/' || LPAD(v_next_number::TEXT, 4, '0') || '/' || v_year;
END;
$$ LANGUAGE plpgsql;

-- Function to validate NIP checksum
CREATE OR REPLACE FUNCTION validate_nip_checksum(p_nip TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_weights INTEGER[] := '{6, 5, 7, 2, 3, 4, 5, 6, 7}';
    v_checksum INTEGER;
    v_calculated_checksum INTEGER;
    v_digits INTEGER[];
    i INTEGER;
BEGIN
    -- Remove any non-digit characters
    p_nip := REGEXP_REPLACE(p_nip, '[^0-9]', '', 'g');

    -- Check if we have exactly 10 digits
    IF LENGTH(p_nip) != 10 THEN
        RETURN FALSE;
    END IF;

    -- Convert to array of digits
    FOR i IN 1..9 LOOP
        v_digits[i] := SUBSTRING(p_nip, i, 1)::INTEGER;
    END LOOP;

    -- Calculate checksum
    v_calculated_checksum := 0;
    FOR i IN 1..9 LOOP
        v_calculated_checksum := v_calculated_checksum + (v_digits[i] * v_weights[i]);
    END LOOP;

    v_calculated_checksum := v_calculated_checksum % 11;

    -- Special case for checksum = 10
    IF v_calculated_checksum = 10 THEN
        v_calculated_checksum := 0;
    END IF;

    -- Get actual checksum
    v_checksum := SUBSTRING(p_nip, 10, 1)::INTEGER;

    RETURN v_calculated_checksum = v_checksum;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate VAT amount
CREATE OR REPLACE FUNCTION calculate_vat_amount(p_basis DECIMAL, p_vat_rate vat_rate)
RETURNS DECIMAL AS $$
BEGIN
    RETURN p_basis * CASE p_vat_rate::text
        WHEN '23' THEN 0.23
        WHEN '8' THEN 0.08
        WHEN '5' THEN 0.05
        WHEN '0' THEN 0.0
        ELSE 0.0
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to determine VAT rate for service
CREATE OR REPLACE FUNCTION get_vat_rate_for_service(p_service_type TEXT, p_service_category TEXT, p_customer_type customer_type)
RETURNS vat_rate AS $$
DECLARE
    v_vat_config vat_rate_configurations%ROWTYPE;
BEGIN
    -- Get VAT configuration for this service
    SELECT * INTO v_vat_config
    FROM vat_rate_configurations
    WHERE service_type = p_service_type
      AND service_category = p_service_category
      AND valid_from <= CURRENT_DATE
      AND (valid_until IS NULL OR valid_until > CURRENT_DATE)
    ORDER BY valid_from DESC
    LIMIT 1;

    -- Return default rate if no configuration found
    IF v_vat_config IS NULL THEN
        RETURN '23'::vat_rate;
    END IF;

    -- For EU B2B, check if reverse charge applies
    IF p_customer_type IN ('company_eu', 'company_non_eu') THEN
        RETURN '0'::vat_rate; -- Reverse charge
    END IF;

    RETURN v_vat_config.default_vat_rate;
END;
$$ LANGUAGE plpgsql;

-- Update vat_registers when invoice is created/updated
CREATE OR REPLACE FUNCTION update_vat_register()
RETURNS TRIGGER AS $$
DECLARE
    v_register vat_registers%ROWTYPE;
    v_period_start DATE;
    v_period_end DATE;
    v_period_type TEXT := 'monthly';
BEGIN
    -- Determine period
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_period_start := DATE_TRUNC('month', NEW.issue_date);
        v_period_end := (v_period_start + INTERVAL '1 month') - INTERVAL '1 day';
    ELSE
        v_period_start := DATE_TRUNC('month', OLD.issue_date);
        v_period_end := (v_period_start + INTERVAL '1 month') - INTERVAL '1 day';
    END IF;

    -- Get or create VAT register for this period
    SELECT * INTO v_register
    FROM vat_registers
    WHERE period_type = v_period_type
      AND period_start = v_period_start
      AND period_end = v_period_end;

    IF v_register IS NULL THEN
        INSERT INTO vat_registers (period_type, period_start, period_end)
        VALUES (v_period_type, v_period_start, v_period_end)
        RETURNING * INTO v_register;
    END IF;

    -- Update register based on operation
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update sales register
        CASE NEW.vat_rate::text
            WHEN '23' THEN
                UPDATE vat_registers SET sales_domestic_23 = sales_domestic_23 + NEW.vat_basis WHERE id = v_register.id;
            WHEN '8' THEN
                UPDATE vat_registers SET sales_domestic_8 = sales_domestic_8 + NEW.vat_basis WHERE id = v_register.id;
            WHEN '5' THEN
                UPDATE vat_registers SET sales_domestic_5 = sales_domestic_5 + NEW.vat_basis WHERE id = v_register.id;
            WHEN '0' THEN
                IF NEW.eu_service OR NEW.intra_eu_supply THEN
                    UPDATE vat_registers SET sales_eu_services = sales_eu_services + NEW.vat_basis WHERE id = v_register.id;
                ELSE
                    UPDATE vat_registers SET sales_domestic_0 = sales_domestic_0 + NEW.vat_basis WHERE id = v_register.id;
                END IF;
            ELSE
                UPDATE vat_registers SET sales_domestic_exempt = sales_domestic_exempt + NEW.vat_basis WHERE id = v_register.id;
        END CASE;

        -- Update VAT calculations
        UPDATE vat_registers
        SET
            vat_payable = (
                (SELECT COALESCE(SUM(vat_amount), 0) FROM invoices
                 WHERE DATE_TRUNC('month', issue_date) = v_period_start
                   AND invoice_type != 'korekta'
                   AND payment_status != 'cancelled') -
                (SELECT COALESCE(SUM(vat_amount), 0) FROM invoices
                 WHERE DATE_TRUNC('month', issue_date) = v_period_start
                   AND invoice_type = 'korekta')
            ),
            updated_at = NOW()
        WHERE id = v_register.id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Reverse the entry
        CASE OLD.vat_rate::text
            WHEN '23' THEN
                UPDATE vat_registers SET sales_domestic_23 = sales_domestic_23 - OLD.vat_basis WHERE id = v_register.id;
            WHEN '8' THEN
                UPDATE vat_registers SET sales_domestic_8 = sales_domestic_8 - OLD.vat_basis WHERE id = v_register.id;
            WHEN '5' THEN
                UPDATE vat_registers SET sales_domestic_5 = sales_domestic_5 - OLD.vat_basis WHERE id = v_register.id;
            WHEN '0' THEN
                IF OLD.eu_service OR OLD.intra_eu_supply THEN
                    UPDATE vat_registers SET sales_eu_services = sales_eu_services - OLD.vat_basis WHERE id = v_register.id;
                ELSE
                    UPDATE vat_registers SET sales_domestic_0 = sales_domestic_0 - OLD.vat_basis WHERE id = v_register.id;
                END IF;
            ELSE
                UPDATE vat_registers SET sales_domestic_exempt = sales_domestic_exempt - OLD.vat_basis WHERE id = v_register.id;
        END CASE;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_vat_register
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_vat_register();

-- Update sequences automatically at year end
CREATE OR REPLACE FUNCTION reset_yearly_sequences()
RETURNS void AS $$
BEGIN
    UPDATE invoice_sequences
    SET current_number = 1,
        year = EXTRACT(YEAR FROM CURRENT_DATE),
        updated_at = NOW()
    WHERE reset_yearly = true
      AND year != EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE nip_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_registers ENABLE ROW LEVEL SECURITY;

-- NIP validations - public read access
CREATE POLICY "NIP validations are publicly readable" ON nip_validations
    FOR SELECT USING (true);

-- Company profiles - users can see their own
CREATE POLICY "Users can view their own company profile" ON company_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own company profile" ON company_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company profile" ON company_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Invoices - authenticated users can see their invoices
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM bookings WHERE id = invoices.booking_id) OR
        auth.uid() = (SELECT user_id FROM company_profiles WHERE id = invoices.company_profile_id)
    );

-- Invoice items - inherit from invoices
CREATE POLICY "Users can view items from their invoices" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
              AND (
                  auth.uid() = (SELECT user_id FROM bookings WHERE id = invoices.booking_id) OR
                  auth.uid() = (SELECT user_id FROM company_profiles WHERE id = invoices.company_profile_id)
              )
        )
    );

-- Credit notes - inherit from invoices
CREATE POLICY "Users can view credit notes for their invoices" ON credit_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = credit_notes.original_invoice_id
              AND (
                  auth.uid() = (SELECT user_id FROM bookings WHERE id = invoices.booking_id) OR
                  auth.uid() = (SELECT user_id FROM company_profiles WHERE id = invoices.company_profile_id)
              )
        )
    );

-- Refunds - inherit from bookings
CREATE POLICY "Users can view refunds for their bookings" ON refunds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = refunds.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

-- VAT registers - admin only
CREATE POLICY "Admins can view VAT registers" ON vat_registers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Update existing bookings to support new fields
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS company_profile_id UUID REFERENCES company_profiles(id),
ADD COLUMN IF NOT EXISTS invoice_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vat_rate vat_rate DEFAULT '23',
ADD COLUMN IF NOT EXISTS customer_nip TEXT,
ADD COLUMN IF NOT EXISTS customer_company_name TEXT,
ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- Update existing services to include VAT categories
ALTER TABLE services
ADD COLUMN IF NOT EXISTS vat_category TEXT,
ADD COLUMN IF NOT EXISTS pkwiu_code TEXT;

-- Initialize service VAT categories
UPDATE services
SET
    vat_category = CASE
        WHEN service_type = 'beauty' THEN
            CASE
                WHEN title ILIKE '%lip%' THEN 'lip_enhancements'
                WHEN title ILIKE '%brow%' THEN 'brows_lamination'
                ELSE 'beauty_services'
            END
        WHEN service_type = 'fitness' THEN
            CASE
                WHEN title ILIKE '%personal%' OR title ILIKE '%pt%' THEN 'personal_training'
                WHEN title ILIKE '%group%' OR title ILIKE '%class%' THEN 'group_classes'
                WHEN title ILIKE '%glutes%' OR title ILIKE '%fitness%' THEN 'fitness_programs'
                ELSE 'fitness_services'
            END
        ELSE 'other_services'
    END
WHERE vat_category IS NULL;