-- B2B Corporate Wellness Platform Schema
-- Implements corporate wellness management with employee tracking,
-- budget management, department analytics, and wellness programs

-- =============================================
-- CORPORATE ACCOUNTS
-- =============================================

-- Companies that subscribe to corporate wellness plans
CREATE TABLE IF NOT EXISTS corporate_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    company_vat_number TEXT UNIQUE,
    industry TEXT,
    company_size TEXT CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    billing_address JSONB,
    shipping_address JSONB,
    contact_info JSONB,
    subscription_plan TEXT CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
    subscription_limits JSONB, -- {employees: number, budget_per_employee: number, programs: number}
    contract_start_date DATE,
    contract_end_date DATE,
    status TEXT CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')) DEFAULT 'trial',
    account_manager_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments within companies
CREATE TABLE IF NOT EXISTS corporate_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    department_name TEXT NOT NULL,
    department_code TEXT,
    manager_id UUID REFERENCES profiles(id),
    parent_department_id UUID REFERENCES corporate_departments(id),
    budget_allocation DECIMAL(10,2) DEFAULT 0,
    employee_target INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EMPLOYEE MANAGEMENT
-- =============================================

-- Corporate employees with wellness benefits
CREATE TABLE IF NOT EXISTS corporate_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    department_id UUID REFERENCES corporate_departments(id),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    employee_id TEXT UNIQUE, -- Internal company employee ID
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    position TEXT,
    hire_date DATE,
    employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
    location TEXT,
    manager_id UUID REFERENCES corporate_employees(id),
    wellness_budget DECIMAL(10,2) DEFAULT 0,
    remaining_budget DECIMAL(10,2) DEFAULT 0,
    benefits_tier TEXT CHECK (benefits_tier IN ('basic', 'standard', 'premium', 'executive')),
    is_active BOOLEAN DEFAULT true,
    preferences JSONB, -- {preferred_services: [], schedule_preferences: {}, health_goals: []}
    consent_data JSONB, -- GDPR consents for corporate wellness
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee benefit allocations and history
CREATE TABLE IF NOT EXISTS employee_benefit_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES corporate_employees(id) ON DELETE CASCADE,
    allocation_type TEXT CHECK (allocation_type IN ('monthly_credit', 'annual_allowance', 'service_package', 'special_bonus')),
    allocated_amount DECIMAL(10,2) NOT NULL,
    used_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (allocated_amount - used_amount) STORED,
    allocation_date DATE NOT NULL,
    expiry_date DATE,
    status TEXT CHECK (status IN ('active', 'expired', 'depleted', 'cancelled')) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BUDGET MANAGEMENT
-- =============================================

-- Corporate budget allocations and tracking
CREATE TABLE IF NOT EXISTS corporate_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    department_id UUID REFERENCES corporate_departments(id),
    budget_period TEXT NOT NULL, -- '2024-Q1', '2024-01', etc.
    total_allocated DECIMAL(12,2) NOT NULL,
    spent_amount DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_allocated - spent_amount) STORED,
    budget_type TEXT CHECK (budget_type IN ('wellness', 'training', 'benefits', 'events')) DEFAULT 'wellness',
    status TEXT CHECK (status IN ('planned', 'active', 'completed', 'overrun')) DEFAULT 'planned',
    approved_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget transactions and expenditures
CREATE TABLE IF NOT EXISTS budget_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES corporate_budgets(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES corporate_employees(id),
    transaction_type TEXT CHECK (transaction_type IN ('allocation', 'spend', 'adjustment', 'refund')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    running_balance DECIMAL(12,2),
    description TEXT,
    reference_id UUID, -- Reference to booking, service, etc.
    category TEXT,
    approved_by UUID REFERENCES profiles(id),
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- WELLNESS PROGRAMS
-- =============================================

-- Corporate wellness programs and challenges
CREATE TABLE IF NOT EXISTS corporate_wellness_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    program_name TEXT NOT NULL,
    program_description TEXT,
    program_type TEXT CHECK (program_type IN ('fitness_challenge', 'mental_health', 'nutrition', 'preventive_care', 'stress_management')),
    duration_weeks INTEGER,
    start_date DATE,
    end_date DATE,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    budget_per_participant DECIMAL(10,2),
    total_budget DECIMAL(10,2),
    requirements JSONB, -- Participation requirements
    rewards JSONB, -- Rewards and incentives
    materials JSONB, -- Program materials and resources
    status TEXT CHECK (status IN ('draft', 'active', 'completed', 'cancelled')) DEFAULT 'draft',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program enrollments and progress
CREATE TABLE IF NOT EXISTS program_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES corporate_wellness_programs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES corporate_employees(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    completion_date TIMESTAMPTZ,
    status TEXT CHECK (status IN ('enrolled', 'active', 'completed', 'dropped', 'suspended')) DEFAULT 'enrolled',
    progress_data JSONB, -- {progress_percentage: number, milestones: [], achievements: []}
    feedback TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(program_id, employee_id)
);

-- =============================================
-- PARTNER INTEGRATIONS
-- =============================================

-- B2B Partners (hotels, spas, insurance, healthcare)
CREATE TABLE IF NOT EXISTS b2b_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name TEXT NOT NULL,
    partner_type TEXT CHECK (partner_type IN ('hotel', 'spa', 'insurance', 'healthcare', 'fitness', 'nutrition')) NOT NULL,
    contact_info JSONB,
    billing_address JSONB,
    service_areas JSONB, -- Geographic areas served
    integration_status TEXT CHECK (integration_status IN ('prospect', 'active', 'suspended', 'terminated')) DEFAULT 'prospect',
    contract_details JSONB,
    commission_rate DECIMAL(5,2), -- Commission rate for partnerships
    api_credentials JSONB, -- Encrypted API credentials for integration
    supported_services JSONB, -- Services available through partner
    pricing_structure JSONB, -- Corporate pricing tiers
    status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner service mappings
CREATE TABLE IF NOT EXISTS partner_service_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES b2b_partners(id) ON DELETE CASCADE,
    internal_service_id UUID REFERENCES services(id),
    external_service_id TEXT, -- Partner's service ID
    service_name TEXT NOT NULL,
    corporate_rate DECIMAL(10,2), -- Special corporate pricing
    standard_rate DECIMAL(10,2),
    commission_amount DECIMAL(10,2),
    availability JSONB, -- Corporate availability preferences
    booking_requirements JSONB,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration logs and sync history
CREATE TABLE IF NOT EXISTS partner_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES b2b_partners(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL, -- 'booking_sync', 'availability_sync', 'billing_sync', etc.
    direction TEXT CHECK (direction IN ('outbound', 'inbound')) NOT NULL,
    endpoint TEXT,
    request_payload JSONB,
    response_payload JSONB,
    status_code INTEGER,
    status TEXT CHECK (status IN ('success', 'error', 'pending')) DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ANALYTICS AND REPORTING
-- =============================================

-- Corporate analytics snapshots
CREATE TABLE IF NOT EXISTS corporate_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    department_id UUID REFERENCES corporate_departments(id),
    analytics_date DATE NOT NULL,
    period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly')) NOT NULL,

    -- Employee metrics
    total_employees INTEGER,
    active_employees INTEGER,
    new_employees INTEGER,

    -- Budget metrics
    total_budget DECIMAL(12,2),
    used_budget DECIMAL(12,2),
    remaining_budget DECIMAL(12,2),
    budget_utilization_rate DECIMAL(5,2),

    -- Booking metrics
    total_bookings INTEGER,
    completed_bookings INTEGER,
    cancelled_bookings INTEGER,
    no_show_rate DECIMAL(5,2),

    -- Service metrics
    popular_services JSONB, -- Top services with counts
    service_category_breakdown JSONB,

    -- Wellness program metrics
    program_participations INTEGER,
    program_completions INTEGER,
    completion_rate DECIMAL(5,2),

    -- Health metrics (anonymized)
    wellness_score DECIMAL(5,2),
    engagement_score DECIMAL(5,2),

    -- Satisfaction metrics
    average_rating DECIMAL(3,2),
    feedback_count INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(corporate_account_id, department_id, analytics_date, period_type)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Corporate accounts indexes
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_status ON corporate_accounts(status);
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_subscription ON corporate_accounts(subscription_plan);

-- Employee indexes
CREATE INDEX IF NOT EXISTS idx_corporate_employees_account ON corporate_employees(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_corporate_employees_department ON corporate_employees(department_id);
CREATE INDEX IF NOT EXISTS idx_corporate_employees_active ON corporate_employees(is_active);
CREATE INDEX IF NOT EXISTS idx_corporate_employees_email ON corporate_employees(email);

-- Budget indexes
CREATE INDEX IF NOT EXISTS idx_corporate_budgets_account_period ON corporate_budgets(corporate_account_id, budget_period);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_budget ON budget_transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_employee ON budget_transactions(employee_id);

-- Program indexes
CREATE INDEX IF NOT EXISTS idx_wellness_programs_account ON corporate_wellness_programs(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program ON program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_employee ON program_enrollments(employee_id);

-- Partner indexes
CREATE INDEX IF NOT EXISTS idx_b2b_partners_type ON b2b_partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_b2b_partners_status ON b2b_partners(status);
CREATE INDEX IF NOT EXISTS idx_partner_service_mappings_partner ON partner_service_mappings(partner_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_corporate_analytics_account_date ON corporate_analytics(corporate_account_id, analytics_date);
CREATE INDEX IF NOT EXISTS idx_corporate_analytics_department ON corporate_analytics(department_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_benefit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_wellness_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_service_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_analytics ENABLE ROW LEVEL SECURITY;

-- Corporate account access policies
CREATE POLICY "Corporate account access" ON corporate_accounts
    FOR ALL USING (
        auth.uid() = account_manager_id OR
        EXISTS (
            SELECT 1 FROM corporate_employees ce
            JOIN profiles p ON ce.user_id = p.id
            WHERE ce.corporate_account_id = corporate_accounts.id AND p.id = auth.uid()
        )
    );

-- Department access policies
CREATE POLICY "Department access" ON corporate_departments
    FOR ALL USING (
        corporate_account_id IN (
            SELECT id FROM corporate_accounts WHERE
            auth.uid() = account_manager_id OR
            EXISTS (
                SELECT 1 FROM corporate_employees ce
                WHERE ce.corporate_account_id = corporate_accounts.id AND ce.user_id = auth.uid()
            )
        )
    );

-- Employee access policies
CREATE POLICY "Employee access" ON corporate_employees
    FOR ALL USING (
        user_id = auth.uid() OR
        corporate_account_id IN (
            SELECT id FROM corporate_accounts WHERE account_manager_id = auth.uid()
        )
    );

-- Budget access policies
CREATE POLICY "Budget access" ON corporate_budgets
    FOR ALL USING (
        corporate_account_id IN (
            SELECT id FROM corporate_accounts WHERE
            auth.uid() = account_manager_id OR
            EXISTS (
                SELECT 1 FROM corporate_employees ce
                WHERE ce.corporate_account_id = corporate_accounts.id AND ce.user_id = auth.uid()
            )
        )
    );

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Corporate dashboard view
CREATE OR REPLACE VIEW corporate_dashboard_view AS
SELECT
    ca.id as corporate_id,
    ca.company_name,
    ca.subscription_plan,
    COUNT(DISTINCT ce.id) as total_employees,
    COUNT(DISTINCT CASE WHEN ce.is_active THEN ce.id END) as active_employees,
    COALESCE(SUM(cb.total_allocated), 0) as total_budget,
    COALESCE(SUM(cb.spent_amount), 0) as used_budget,
    COALESCE(SUM(cwp.current_participants), 0) as program_participants,
    COUNT(DISTINCT CASE WHEN cwp.status = 'active' THEN cwp.id END) as active_programs
FROM corporate_accounts ca
LEFT JOIN corporate_employees ce ON ce.corporate_account_id = ca.id
LEFT JOIN corporate_budgets cb ON cb.corporate_account_id = ca.id AND cb.budget_period = TO_CHAR(NOW(), 'YYYY-MM')
LEFT JOIN corporate_wellness_programs cwp ON cwp.corporate_account_id = ca.id
WHERE ca.status = 'active'
GROUP BY ca.id, ca.company_name, ca.subscription_plan;

-- Department performance view
CREATE OR REPLACE VIEW department_performance_view AS
SELECT
    cd.id as department_id,
    cd.department_name,
    cd.budget_allocation,
    ca.company_name,
    COUNT(DISTINCT ce.id) as employee_count,
    COALESCE(SUM(ce.remaining_budget), 0) as total_remaining_budget,
    COUNT(DISTINCT pe.id) as program_enrollments,
    COALESCE(AVG(cr.average_rating), 0) as average_satisfaction
FROM corporate_departments cd
JOIN corporate_accounts ca ON cd.corporate_account_id = ca.id
LEFT JOIN corporate_employees ce ON ce.department_id = cd.id AND ce.is_active
LEFT JOIN program_enrollments pe ON pe.employee_id = ce.id AND pe.status = 'active'
LEFT JOIN corporate_analytics cr ON cr.department_id = cd.id AND cr.analytics_date = CURRENT_DATE
GROUP BY cd.id, cd.department_name, cd.budget_allocation, ca.company_name;

-- Partner integration status view
CREATE OR REPLACE VIEW partner_integration_status_view AS
SELECT
    bp.id,
    bp.partner_name,
    bp.partner_type,
    bp.integration_status,
    COUNT(psm.id) as mapped_services,
    COUNT(DISTINCT pil.id) as integration_attempts_today,
    COUNT(CASE WHEN pil.status = 'success' THEN 1 END) as successful_syncs_today
FROM b2b_partners bp
LEFT JOIN partner_service_mappings psm ON psm.partner_id = bp.id AND psm.status = 'active'
LEFT JOIN partner_integration_logs pil ON pil.partner_id = bp.id AND DATE(pil.created_at) = CURRENT_DATE
GROUP BY bp.id, bp.partner_name, bp.partner_type, bp.integration_status;

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Update remaining budget trigger
CREATE OR REPLACE FUNCTION update_employee_budget()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE corporate_employees
    SET remaining_budget = wellness_budget - COALESCE((
        SELECT SUM(amount)
        FROM budget_transactions
        WHERE employee_id = NEW.employee_id
        AND transaction_type = 'spend'
    ), 0)
    WHERE id = NEW.employee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_budget
    AFTER INSERT ON budget_transactions
    FOR EACH ROW EXECUTE FUNCTION update_employee_budget();

-- Update program participants trigger
CREATE OR REPLACE FUNCTION update_program_participants()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'enrolled' THEN
        UPDATE corporate_wellness_programs
        SET current_participants = current_participants + 1
        WHERE id = NEW.program_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'enrolled' AND NEW.status != 'enrolled' THEN
            UPDATE corporate_wellness_programs
            SET current_participants = current_participants - 1
            WHERE id = NEW.program_id;
        ELSIF OLD.status != 'enrolled' AND NEW.status = 'enrolled' THEN
            UPDATE corporate_wellness_programs
            SET current_participants = current_participants + 1
            WHERE id = NEW.program_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'enrolled' THEN
        UPDATE corporate_wellness_programs
        SET current_participants = current_participants - 1
        WHERE id = OLD.program_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_program_participants
    AFTER INSERT OR UPDATE OR DELETE ON program_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_program_participants();

-- Function to generate monthly corporate analytics
CREATE OR REPLACE FUNCTION generate_monthly_corporate_analytics()
RETURNS void AS $$
DECLARE
    current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
    corp_record RECORD;
BEGIN
    FOR corp_record IN
        SELECT id FROM corporate_accounts WHERE status = 'active'
    LOOP
        INSERT INTO corporate_analytics (
            corporate_account_id,
            analytics_date,
            period_type,
            total_employees,
            active_employees,
            total_budget,
            used_budget,
            budget_utilization_rate,
            total_bookings,
            completed_bookings,
            program_participations,
            program_completions,
            average_rating
        )
        SELECT
            corp_record.id,
            CURRENT_DATE,
            'monthly',
            COUNT(DISTINCT ce.id),
            COUNT(DISTINCT CASE WHEN ce.is_active THEN ce.id END),
            COALESCE(cb.total_allocated, 0),
            COALESCE(cb.spent_amount, 0),
            CASE
                WHEN cb.total_allocated > 0
                THEN ROUND((cb.spent_amount / cb.total_allocated) * 100, 2)
                ELSE 0
            END,
            COUNT(DISTINCT b.id),
            COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END),
            COUNT(DISTINCT pe.id),
            COUNT(DISTINCT CASE WHEN pe.status = 'completed' THEN pe.id END),
            COALESCE(AVG(r.rating), 0)
        FROM corporate_employees ce
        LEFT JOIN corporate_budgets cb ON cb.corporate_account_id = corp_record.id AND cb.budget_period = current_month
        LEFT JOIN bookings b ON b.user_id = ce.user_id AND DATE(b.created_at) >= DATE_TRUNC('month', CURRENT_DATE)
        LEFT JOIN program_enrollments pe ON pe.employee_id = ce.id
        LEFT JOIN reviews r ON r.booking_id = b.id
        WHERE ce.corporate_account_id = corp_record.id
        GROUP BY corp_record.id, cb.total_allocated, cb.spent_amount
        ON CONFLICT (corporate_account_id, analytics_date, period_type)
        DO UPDATE SET
            total_employees = EXCLUDED.total_employees,
            active_employees = EXCLUDED.active_employees,
            total_budget = EXCLUDED.total_budget,
            used_budget = EXCLUDED.used_budget,
            budget_utilization_rate = EXCLUDED.budget_utilization_rate,
            total_bookings = EXCLUDED.total_bookings,
            completed_bookings = EXCLUDED.completed_bookings,
            program_participations = EXCLUDED.program_participations,
            program_completions = EXCLUDED.program_completions,
            average_rating = EXCLUDED.average_rating;
    END LOOP;
END;
$$ LANGUAGE plpgsql;