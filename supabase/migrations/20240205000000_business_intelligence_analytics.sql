-- Business Intelligence and Analytics Schema for Luxury Beauty/Fitness Platform
-- This schema extends the existing database to support comprehensive business intelligence

-- =============================================
-- 1. BUSINESS METRICS AND PERFORMANCE TRACKING
-- =============================================

-- Daily business performance snapshots
CREATE TABLE daily_business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_bookings INTEGER NOT NULL DEFAULT 0,
    completed_bookings INTEGER NOT NULL DEFAULT 0,
    cancelled_bookings INTEGER NOT NULL DEFAULT 0,
    new_customers INTEGER NOT NULL DEFAULT 0,
    returning_customers INTEGER NOT NULL DEFAULT 0,
    average_booking_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    peak_hour INTEGER CHECK (peak_hour >= 0 AND peak_hour <= 23),
    currency VARCHAR(3) DEFAULT 'PLN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, currency)
);

-- Service category performance tracking
CREATE TABLE service_category_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    service_type service_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    total_bookings INTEGER NOT NULL DEFAULT 0,
    completed_bookings INTEGER NOT NULL DEFAULT 0,
    revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    costs DECIMAL(12,2) NOT NULL DEFAULT 0,
    profit_margin DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN revenue > 0 THEN ((revenue - costs) / revenue * 100)
            ELSE 0
        END
    ) STORED,
    average_rating DECIMAL(3,2) DEFAULT 0,
    average_duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, service_type, category)
);

-- Customer lifetime value tracking
CREATE TABLE customer_lifetime_value (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    acquisition_date DATE NOT NULL,
    total_spend DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_bookings INTEGER NOT NULL DEFAULT 0,
    average_booking_value DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE
            WHEN total_bookings > 0 THEN total_spend / total_bookings
            ELSE 0
        END
    ) STORED,
    last_booking_date DATE,
    booking_frequency_days INTEGER,
    predicted_next_booking DATE,
    churn_risk_score DECIMAL(3,2) CHECK (churn_risk_score >= 0 AND churn_risk_score <= 1),
    loyalty_score DECIMAL(3,2) CHECK (loyalty_score >= 0 AND loyalty_score <= 1),
    preferred_service_type service_type,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id)
);

-- =============================================
-- 2. FINANCIAL TRACKING AND ANALYSIS
-- =============================================

-- Revenue tracking by different dimensions
CREATE TABLE revenue_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    revenue_type VARCHAR(50) NOT NULL, -- 'service_fee', 'deposit', 'cancellation_fee', 'product_sale'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PLN',
    cost_center VARCHAR(100),
    profit_center VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_revenue_tracking_date (date),
    INDEX idx_revenue_tracking_service (service_id),
    INDEX idx_revenue_tracking_type (revenue_type)
);

-- Expense tracking
CREATE TABLE expense_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    expense_category VARCHAR(100) NOT NULL, -- 'rent', 'salaries', 'products', 'marketing', 'utilities', 'software'
    expense_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PLN',
    description TEXT,
    vendor VARCHAR(200),
    receipt_url TEXT,
    allocated_to_service_type service_type,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50), -- 'monthly', 'quarterly', 'annually'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_expense_tracking_date (date),
    INDEX idx_expense_tracking_category (expense_category)
);

-- Cash flow tracking
CREATE TABLE cash_flow_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    cash_inflows DECIMAL(12,2) NOT NULL DEFAULT 0,
    cash_outflows DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_cash_flow DECIMAL(12,2) GENERATED ALWAYS AS (cash_inflows - cash_outflows) STORED,
    closing_balance DECIMAL(12,2) GENERATED ALWAYS AS (opening_balance + net_cash_flow) STORED,
    currency VARCHAR(3) DEFAULT 'PLN',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, currency)
);

-- =============================================
-- 3. SERVICE PROFITABILITY ANALYSIS
-- =============================================

-- Service cost breakdown
CREATE TABLE service_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    cost_type VARCHAR(100) NOT NULL, -- 'labor', 'materials', 'overhead', 'marketing'
    cost_basis VARCHAR(50) NOT NULL, -- 'per_booking', 'per_hour', 'fixed_monthly'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PLN',
    effective_date DATE NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service performance analytics
CREATE TABLE service_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    booking_conversion_rate DECIMAL(5,2) DEFAULT 0,
    search_impressions INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,2) DEFAULT 0,
    average_booking_lead_time_days INTEGER DEFAULT 0,
    seasonality_factor DECIMAL(3,2) DEFAULT 1.0,
    competitor_price_index DECIMAL(5,2) DEFAULT 100,
    demand_score DECIMAL(3,2) CHECK (demand_score >= 0 AND demand_score <= 10),
    profitability_score DECIMAL(3,2) CHECK (profitability_score >= 0 AND profitability_score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_id, date)
);

-- =============================================
-- 4. STAFF PERFORMANCE AND UTILIZATION
-- =============================================

-- Staff members table (extends profiles for service providers)
CREATE TABLE staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL, -- 'beautician', 'trainer', 'therapist', 'consultant'
    specialization VARCHAR(200),
    hourly_rate DECIMAL(8,2) NOT NULL,
    commission_rate DECIMAL(5,2) CHECK (commission_rate >= 0 AND commission_rate <= 100),
    employment_type VARCHAR(50) NOT NULL, -- 'full_time', 'part_time', 'contract', 'freelance'
    hire_date DATE NOT NULL,
    termination_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    skills TEXT[],
    certifications JSONB,
    max_daily_bookings INTEGER DEFAULT 8,
    preferred_working_hours JSONB, -- JSON object with day -> hours mapping
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff performance metrics
CREATE TABLE staff_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_bookings INTEGER NOT NULL DEFAULT 0,
    completed_bookings INTEGER NOT NULL DEFAULT 0,
    cancelled_bookings INTEGER NOT NULL DEFAULT 0,
    no_show_bookings INTEGER NOT NULL DEFAULT 0,
    total_revenue_generated DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_working_hours DECIMAL(4,1) DEFAULT 0,
    utilization_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN total_working_hours > 0 THEN (completed_bookings * 1.5) / total_working_hours * 100
            ELSE 0
        END
    ) STORED,
    punctuality_score DECIMAL(3,2) DEFAULT 100,
    customer_satisfaction_score DECIMAL(3,2) DEFAULT 0,
    upsell_revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

-- =============================================
-- 5. INVENTORY AND RESOURCE MANAGEMENT
-- =============================================

-- Product inventory
CREATE TABLE product_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(200) NOT NULL,
    product_code VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    supplier VARCHAR(200),
    unit_cost DECIMAL(8,2) NOT NULL,
    selling_price DECIMAL(8,2),
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock_level INTEGER NOT NULL DEFAULT 0,
    maximum_stock_level INTEGER,
    reorder_point INTEGER NOT NULL DEFAULT 0,
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'pcs',
    shelf_life_months INTEGER,
    storage_location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory transactions
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES product_inventory(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'usage', 'adjustment', 'waste', 'return'
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(8,2),
    total_cost DECIMAL(10,2),
    reference_type VARCHAR(50), -- 'booking', 'purchase_order', 'adjustment'
    reference_id UUID,
    performed_by UUID REFERENCES profiles(id),
    notes TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_inventory_transactions_product (product_id),
    INDEX idx_inventory_transactions_date (transaction_date)
);

-- Resource utilization tracking
CREATE TABLE resource_utilization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- 'room', 'equipment', 'station'
    resource_id VARCHAR(100) NOT NULL,
    total_available_hours DECIMAL(4,1) NOT NULL,
    booked_hours DECIMAL(4,1) NOT NULL DEFAULT 0,
    maintenance_hours DECIMAL(4,1) NOT NULL DEFAULT 0,
    utilization_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN total_available_hours > 0 THEN (booked_hours / total_available_hours * 100)
            ELSE 0
        END
    ) STORED,
    revenue_per_hour DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, resource_type, resource_id)
);

-- =============================================
-- 6. MARKET INTELLIGENCE AND COMPETITIVE ANALYSIS
-- =============================================

-- Competitor tracking
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    business_type VARCHAR(100) NOT NULL, -- 'beauty_salon', 'fitness_studio', 'spa'
    location_address TEXT,
    website VARCHAR(300),
    phone VARCHAR(50),
    price_tier VARCHAR(50), -- 'budget', 'mid_range', 'premium', 'luxury'
    specialties TEXT[],
    market_position VARCHAR(100),
    estimated_monthly_revenue DECIMAL(12,2),
    strengths TEXT[],
    weaknesses TEXT[],
    threat_level VARCHAR(50), -- 'low', 'medium', 'high'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor pricing intelligence
CREATE TABLE competitor_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
    service_name VARCHAR(200) NOT NULL,
    service_category VARCHAR(100),
    price DECIMAL(8,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PLN',
    duration_minutes INTEGER,
    collected_date DATE NOT NULL,
    source VARCHAR(100), -- 'website', 'mystery_shopper', 'social_media', 'customer_report'
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market trends analysis
CREATE TABLE market_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    trend_category VARCHAR(100) NOT NULL, -- 'beauty', 'fitness', 'wellness', 'technology'
    trend_name VARCHAR(200) NOT NULL,
    trend_type VARCHAR(50) NOT NULL, -- 'emerging', 'growing', 'declining', 'stable'
    market_impact DECIMAL(3,2) CHECK (market_impact >= -10 AND market_impact <= 10),
    adoption_rate DECIMAL(5,2) CHECK (adoption_rate >= 0 AND adoption_rate <= 100),
    time_to_maturity_months INTEGER,
    relevance_score DECIMAL(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 10),
    actionable_insights TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, trend_name)
);

-- =============================================
-- 7. AUTOMATED REPORTING AND ALERTS
-- =============================================

-- Report templates
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    report_type VARCHAR(100) NOT NULL, -- 'financial', 'operational', 'marketing', 'performance'
    frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    parameters JSONB, -- Report parameters and filters
    recipients JSONB, -- Email addresses and roles
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated reports
CREATE TABLE generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    report_data JSONB NOT NULL,
    format VARCHAR(20) DEFAULT 'json', -- 'json', 'pdf', 'excel', 'csv'
    file_url TEXT,
    report_period_start DATE,
    report_period_end DATE,
    generated_by UUID REFERENCES profiles(id),
    status VARCHAR(50) DEFAULT 'generated', -- 'generating', 'generated', 'sent', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert configurations
CREATE TABLE alert_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    metric_name VARCHAR(100) NOT NULL,
    condition_operator VARCHAR(10) NOT NULL, -- '>', '<', '>=', '<=', '=', '!='
    threshold_value DECIMAL(12,2) NOT NULL,
    severity VARCHAR(50) NOT NULL, -- 'info', 'warning', 'critical'
    notification_channels JSONB, -- Email, SMS, Slack, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggered alerts
CREATE TABLE triggered_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID REFERENCES alert_configurations(id) ON DELETE CASCADE,
    metric_value DECIMAL(12,2) NOT NULL,
    threshold_value DECIMAL(12,2) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id),
    notes TEXT
);

-- =============================================
-- 8. BUSINESS SCENARIO MODELING
-- =============================================

-- Business scenarios
CREATE TABLE business_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    scenario_type VARCHAR(100) NOT NULL, -- 'expansion', 'pricing', 'marketing', 'investment'
    baseline_metrics JSONB NOT NULL,
    assumed_changes JSONB NOT NULL,
    projected_outcomes JSONB NOT NULL,
    confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
    time_horizon_months INTEGER,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenario analysis results
CREATE TABLE scenario_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES business_scenarios(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL, -- 'roi', 'break_even', 'sensitivity', 'risk'
    time_period DATE NOT NULL,
    projected_revenue DECIMAL(12,2),
    projected_costs DECIMAL(12,2),
    projected_profit DECIMAL(12,2),
    key_assumptions JSONB,
    risk_factors JSONB,
    confidence_interval JSONB, -- Min, max values with probability
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 9. KPI DEFINITIONS AND TRACKING
-- =============================================

-- KPI definitions
CREATE TABLE kpi_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'financial', 'operational', 'customer', 'growth'
    calculation_formula TEXT NOT NULL,
    unit_of_measure VARCHAR(50),
    target_value DECIMAL(12,2),
    minimum_acceptable_value DECIMAL(12,2),
    reporting_frequency VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPI values tracking
CREATE TABLE kpi_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    actual_value DECIMAL(12,2) NOT NULL,
    target_value DECIMAL(12,2),
    variance_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN target_value != 0 AND target_value IS NOT NULL
            THEN ((actual_value - target_value) / target_value * 100)
            ELSE 0
        END
    ) STORED,
    performance_rating VARCHAR(20), -- 'excellent', 'good', 'average', 'poor', 'critical'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(kpi_id, date)
);

-- =============================================
-- 10. INDEXES FOR OPTIMIZATION
-- =============================================

-- Performance indexes
CREATE INDEX idx_daily_business_metrics_date ON daily_business_metrics(date);
CREATE INDEX idx_service_category_performance_date ON service_category_performance(date);
CREATE INDEX idx_service_category_performance_type ON service_category_performance(service_type);
CREATE INDEX idx_customer_lifetime_value_spend ON customer_lifetime_value(total_spend);
CREATE INDEX idx_revenue_tracking_date_service ON revenue_tracking(date, service_id);
CREATE INDEX idx_expense_tracking_date_category ON expense_tracking(date, expense_category);
CREATE INDEX idx_staff_performance_date ON staff_performance(date);
CREATE INDEX idx_staff_performance_staff ON staff_performance(staff_id);
CREATE INDEX idx_inventory_transactions_product_date ON inventory_transactions(product_id, transaction_date);
CREATE INDEX idx_kpi_values_date ON kpi_values(date, kpi_id);

-- Full-text search indexes
CREATE INDEX idx_competitors_name_fts ON competitors USING gin(to_tsvector('english', name));
CREATE INDEX idx_competitors_specialties_fts ON competitors USING gin(to_tsvector('english', array_to_string(specialties, ' ')));
CREATE INDEX idx_market_trends_name_fts ON market_trends USING gin(to_tsvector('english', trend_name));

-- =============================================
-- 11. VIEWS FOR COMMON ANALYTICS QUERIES
-- =============================================

-- Monthly revenue summary view
CREATE VIEW monthly_revenue_summary AS
SELECT
    DATE_TRUNC('month', date) AS month,
    SUM(total_revenue) AS total_revenue,
    SUM(total_bookings) AS total_bookings,
    SUM(new_customers) AS new_customers,
    AVG(average_booking_value) AS avg_booking_value,
    currency
FROM daily_business_metrics
GROUP BY DATE_TRUNC('month', date), currency
ORDER BY month DESC;

-- Service profitability view
CREATE VIEW service_profitability AS
SELECT
    s.id AS service_id,
    s.title,
    s.service_type,
    s.category,
    s.price,
    COALESCE(sc.total_costs, 0) AS estimated_costs,
    s.price - COALESCE(sc.total_costs, 0) AS estimated_profit,
    CASE
        WHEN s.price > 0 THEN ((s.price - COALESCE(sc.total_costs, 0)) / s.price * 100)
        ELSE 0
    END AS profit_margin_percentage,
    COALESCE(scp.completed_bookings, 0) AS total_bookings_last_30_days
FROM services s
LEFT JOIN (
    SELECT
        service_id,
        SUM(amount) AS total_costs
    FROM service_costs
    WHERE effective_date <= CURRENT_DATE
    AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
    GROUP BY service_id
) sc ON s.id = sc.service_id
LEFT JOIN (
    SELECT
        service_id,
        SUM(completed_bookings) AS completed_bookings
    FROM service_category_performance
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY service_id
) scp ON s.id = scp.service_id
WHERE s.is_active = true;

-- Customer segments view
CREATE VIEW customer_segments AS
SELECT
    clv.customer_id,
    p.full_name,
    p.email,
    clv.total_spend,
    clv.total_bookings,
    clv.average_booking_value,
    clv.booking_frequency_days,
    clv.churn_risk_score,
    clv.loyalty_score,
    CASE
        WHEN clv.total_spend >= 5000 THEN 'VIP'
        WHEN clv.total_spend >= 2000 THEN 'Premium'
        WHEN clv.total_spend >= 500 THEN 'Regular'
        ELSE 'Occasional'
    END AS customer_tier,
    CASE
        WHEN clv.churn_risk_score >= 0.7 THEN 'High Risk'
        WHEN clv.churn_risk_score >= 0.4 THEN 'Medium Risk'
        ELSE 'Low Risk'
    END AS churn_risk_level
FROM customer_lifetime_value clv
JOIN profiles p ON clv.customer_id = p.id;

-- Staff performance summary view
CREATE VIEW staff_performance_summary AS
SELECT
    sm.id AS staff_id,
    sm.employee_id,
    sm.role,
    sm.specialization,
    p.full_name,
    AVG(sp.average_rating) AS avg_rating,
    SUM(sp.completed_bookings) AS total_completed_bookings,
    SUM(sp.total_revenue_generated) AS total_revenue,
    AVG(sp.utilization_rate) AS avg_utilization_rate,
    AVG(sp.customer_satisfaction_score) AS avg_satisfaction_score,
    sm.is_active
FROM staff_members sm
JOIN profiles p ON sm.user_id = p.id
LEFT JOIN staff_performance sp ON sm.id = sp.staff_id
WHERE sp.date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY sm.id, sm.employee_id, sm.role, sm.specialization, p.full_name, sm.is_active
ORDER BY avg_rating DESC;

-- =============================================
-- 12. SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE daily_business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_category_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_lifetime_value ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_utilization ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggered_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for different user roles
-- Admin can see all data
CREATE POLICY "Admin full access to business metrics" ON daily_business_metrics
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to service performance" ON service_category_performance
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to customer data" ON customer_lifetime_value
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to financial data" ON revenue_tracking
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to expense data" ON expense_tracking
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to staff performance" ON staff_performance
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Staff can see their own performance data
CREATE POLICY "Staff own performance access" ON staff_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_members sm
            WHERE sm.user_id = auth.uid()
            AND sm.id = staff_performance.staff_id
        )
    );

-- Staff can update their own performance notes
CREATE POLICY "Staff update own performance notes" ON staff_performance
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM staff_members sm
            WHERE sm.user_id = auth.uid()
            AND sm.id = staff_performance.staff_id
        )
    );

-- =============================================
-- 13. TRIGGERS AND AUTOMATIONS
-- =============================================

-- Update customer lifetime value when booking is completed
CREATE OR REPLACE FUNCTION update_customer_lifetime_value()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert customer lifetime value
    INSERT INTO customer_lifetime_value (
        customer_id,
        acquisition_date,
        total_spend,
        total_bookings,
        last_booking_date
    ) VALUES (
        NEW.user_id,
        COALESCE(
            (SELECT MIN(booking_date) FROM bookings WHERE user_id = NEW.user_id),
            NEW.booking_date
        ),
        COALESCE(NEW.total_amount, 0),
        1,
        NEW.booking_date
    )
    ON CONFLICT (customer_id)
    DO UPDATE SET
        total_spend = customer_lifetime_value.total_spend + COALESCE(NEW.total_amount, 0),
        total_bookings = customer_lifetime_value.total_bookings + 1,
        last_booking_date = NEW.booking_date,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_lifetime_value
    AFTER INSERT ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_customer_lifetime_value();

-- Update daily business metrics
CREATE OR REPLACE FUNCTION update_daily_business_metrics()
RETURNS TRIGGER AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
BEGIN
    INSERT INTO daily_business_metrics (
        date,
        total_revenue,
        total_bookings,
        completed_bookings,
        new_customers,
        returning_customers,
        average_booking_value
    ) VALUES (
        current_date,
        COALESCE(NEW.total_amount, 0),
        1,
        CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        CASE
            WHEN NOT EXISTS (
                SELECT 1 FROM bookings
                WHERE user_id = NEW.user_id
                AND booking_date < NEW.booking_date
            ) THEN 1 ELSE 0
        END,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM bookings
                WHERE user_id = NEW.user_id
                AND booking_date < NEW.booking_date
            ) THEN 1 ELSE 0
        END,
        COALESCE(NEW.total_amount, 0)
    )
    ON CONFLICT (date, currency)
    DO UPDATE SET
        total_revenue = daily_business_metrics.total_revenue + COALESCE(NEW.total_amount, 0),
        total_bookings = daily_business_metrics.total_bookings + 1,
        completed_bookings = daily_business_metrics.completed_bookings +
            CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        new_customers = daily_business_metrics.new_customings +
            CASE
                WHEN NOT EXISTS (
                    SELECT 1 FROM bookings
                    WHERE user_id = NEW.user_id
                    AND booking_date < NEW.booking_date
                ) THEN 1 ELSE 0
            END,
        returning_customers = daily_business_metrics.returning_customers +
            CASE
                WHEN EXISTS (
                    SELECT 1 FROM bookings
                    WHERE user_id = NEW.user_id
                    AND booking_date < NEW.booking_date
                ) THEN 1 ELSE 0
            END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_business_metrics
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_business_metrics();

-- =============================================
-- 14. INITIAL DATA SETUP
-- =============================================

-- Insert default KPI definitions
INSERT INTO kpi_definitions (name, description, category, calculation_formula, unit_of_measure, target_value, reporting_frequency) VALUES
('Daily Revenue', 'Total revenue generated per day', 'financial', 'SUM(total_amount) FROM bookings WHERE booking_date = CURRENT_DATE AND status = ''completed''', 'PLN', 5000, 'daily'),
('Booking Conversion Rate', 'Percentage of completed bookings vs total bookings', 'operational', '(COUNT(CASE WHEN status = ''completed'' THEN 1 END) / COUNT(*)) * 100', '%', 85, 'daily'),
('Customer Acquisition Cost', 'Cost to acquire a new customer', 'marketing', 'total_marketing_spend / new_customers', 'PLN', 200, 'monthly'),
('Average Customer Lifetime Value', 'Total revenue per customer over their lifetime', 'customer', 'AVG(total_spend) FROM customer_lifetime_value', 'PLN', 1500, 'monthly'),
('Staff Utilization Rate', 'Percentage of staff time spent on billable work', 'operational', 'AVG(utilization_rate) FROM staff_performance', '%', 75, 'weekly'),
('Service Profit Margin', 'Average profit margin across all services', 'financial', 'AVG(profit_margin) FROM service_profitability', '%', 60, 'monthly'),
('Customer Retention Rate', 'Percentage of customers who return for additional services', 'customer', '(returning_customers / (new_customers + returning_customers)) * 100', '%', 70, 'monthly'),
('Inventory Turnover', 'How quickly inventory is sold and replaced', 'operational', 'cost_of_goods_sold / average_inventory', 'times', 4, 'monthly');

-- Insert default alert configurations
INSERT INTO alert_configurations (name, description, metric_name, condition_operator, threshold_value, severity, notification_channels) VALUES
('Low Daily Revenue Alert', 'Alert when daily revenue falls below threshold', 'daily_revenue', '<', 2000, 'warning', '{"email": ["admin@mariaborysevych.com"]}'),
('High Booking Cancellation Rate', 'Alert when cancellation rate exceeds threshold', 'cancellation_rate', '>', 20, 'critical', '{"email": ["admin@mariaborysevych.com"], "sms": ["+48123456789"]}'),
('Low Staff Utilization', 'Alert when staff utilization falls below threshold', 'staff_utilization', '<', 50, 'warning', '{"email": ["manager@mariaborysevych.com"]}'),
('Inventory Stock Alert', 'Alert when inventory items fall below reorder point', 'inventory_level', '<', 10, 'info', '{"email": ["inventory@mariaborysevych.com"]}'),
('Customer Churn Risk', 'Alert when high-value customers show churn risk', 'churn_risk', '>', 0.7, 'warning', '{"email": ["retention@mariaborysevych.com"]}');

-- Insert default report templates
INSERT INTO report_templates (name, description, report_type, frequency, parameters, recipients) VALUES
('Daily Business Report', 'Comprehensive daily business performance report', 'operational', 'daily', '{"include_revenue": true, "include_bookings": true, "include_customers": true}', '{"email": ["admin@mariaborysevych.com"], "roles": ["admin", "manager"]}'),
('Weekly Financial Summary', 'Weekly financial performance and metrics', 'financial', 'weekly', '{"include_revenue": true, "include_expenses": true, "include_profit_analysis": true}', '{"email": ["finance@mariaborysevych.com"], "roles": ["admin", "finance"]}'),
('Monthly Performance Dashboard', 'Monthly KPIs and performance metrics', 'performance', 'monthly', '{"include_kpis": true, "include_staff_performance": true, "include_customer_metrics": true}', '{"email": ["leadership@mariaborysevych.com"], "roles": ["admin", "manager", "director"]}'),
('Quarterly Business Review', 'Comprehensive quarterly business analysis', 'executive', 'quarterly', '{"include_forecasts": true, "include_trends": true, "include_competitor_analysis": true}', '{"email": ["executives@mariaborysevych.com"], "roles": ["admin", "executive"]}');

-- Create the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_customer_lifetime_value_updated_at BEFORE UPDATE ON customer_lifetime_value FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_costs_updated_at BEFORE UPDATE ON service_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_inventory_updated_at BEFORE UPDATE ON product_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_scenarios_updated_at BEFORE UPDATE ON business_scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kpi_definitions_updated_at BEFORE UPDATE ON kpi_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alert_configurations_updated_at BEFORE UPDATE ON alert_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;