-- Dynamic Pricing System Migration
-- Enables flexible pricing rules based on demand, time, and other factors

-- Main pricing rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('seasonal', 'demand', 'group', 'custom', 'time_based', 'event')),
    conditions JSONB NOT NULL DEFAULT '{}',
    modifier_type TEXT NOT NULL CHECK (modifier_type IN ('percentage', 'fixed', 'multiply')),
    modifier_value DECIMAL(10,2) NOT NULL,
    priority INTEGER DEFAULT 100, -- Lower number = higher priority
    is_active BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_until DATE,
    max_uses INTEGER, -- Limit total uses of this rule
    current_uses INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pricing calculation logs for audit trail
CREATE TABLE IF NOT EXISTS pricing_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id),
    base_price DECIMAL(10,2) NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    applied_rules UUID[] DEFAULT '{}',
    calculation_context JSONB DEFAULT '{}', -- {date, group_size, demand_level, etc}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Price snapshots for historical tracking
CREATE TABLE IF NOT EXISTS price_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id),
    price DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_pricing_rules_service_id ON pricing_rules(service_id);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_pricing_rules_dates ON pricing_rules(valid_from, valid_until);
CREATE INDEX idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX idx_pricing_calculations_service_id ON pricing_calculations(service_id);
CREATE INDEX idx_pricing_calculations_created_at ON pricing_calculations(created_at);
CREATE INDEX idx_price_snapshots_service_date ON price_snapshots(service_id, effective_date);

-- RLS Policies
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view pricing rules
CREATE POLICY "Authenticated users can view pricing rules" ON pricing_rules
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage pricing rules
CREATE POLICY "Admins can manage pricing rules" ON pricing_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Pricing calculations are read-only for audit
CREATE POLICY "Authenticated users can view pricing calculations" ON pricing_calculations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Price snapshots are readable by authenticated users
CREATE POLICY "Authenticated users can view price snapshots" ON price_snapshots
    FOR SELECT USING (auth.role() = 'authenticated');

-- Helper function to calculate dynamic price
CREATE OR REPLACE FUNCTION calculate_dynamic_price(
    p_service_id UUID,
    p_date DATE DEFAULT CURRENT_DATE,
    p_group_size INTEGER DEFAULT 1,
    p_context JSONB DEFAULT '{}'
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_base_price DECIMAL(10,2);
    v_final_price DECIMAL(10,2);
    v_rule RECORD;
    v_applied_rules UUID[] := '{}';
    v_demand_level INTEGER := 0;
BEGIN
    -- Get base service price
    SELECT price INTO v_base_price
    FROM services
    WHERE id = p_service_id;

    IF v_base_price IS NULL THEN
        RETURN NULL;
    END IF;

    v_final_price := v_base_price;

    -- Calculate current demand level (bookings in last 7 days)
    SELECT COUNT(*) INTO v_demand_level
    FROM bookings
    WHERE service_id = p_service_id
    AND DATE(created_at) BETWEEN p_date - INTERVAL '7 days' AND p_date
    AND status NOT IN ('cancelled', 'no_show');

    -- Apply active pricing rules in priority order
    FOR v_rule IN
        SELECT *
        FROM pricing_rules
        WHERE service_id = p_service_id
        AND is_active = true
        AND (valid_from IS NULL OR valid_from <= p_date)
        AND (valid_until IS NULL OR valid_until >= p_date)
        AND (max_uses IS NULL OR current_uses < max_uses)
        ORDER BY priority ASC, created_at DESC
    LOOP
        -- Check rule conditions
        IF (
            -- Time-based conditions
            (v_rule.conditions->>'time_range') IS NULL OR
            (p_date::time >= (v_rule.conditions->>'time_start')::time AND
             p_date::time <= (v_rule.conditions->>'time_end')::time)

            -- Demand-based conditions
            AND (v_rule.conditions->>'min_demand_level') IS NULL OR
               v_demand_level >= (v_rule.conditions->>'min_demand_level')::integer

            -- Group size conditions
            AND (v_rule.conditions->>'min_group_size') IS NULL OR
               p_group_size >= (v_rule.conditions->>'min_group_size')::integer
        ) THEN
            -- Apply modifier
            IF v_rule.modifier_type = 'percentage' THEN
                v_final_price := v_final_price * (1 + v_rule.modifier_value / 100);
            ELSIF v_rule.modifier_type = 'fixed' THEN
                v_final_price := v_final_price + v_rule.modifier_value;
            ELSIF v_rule.modifier_type = 'multiply' THEN
                v_final_price := v_final_price * v_rule.modifier_value;
            END IF;

            v_applied_rules := array_append(v_applied_rules, v_rule.id);

            -- Update rule usage count
            UPDATE pricing_rules
            SET current_uses = current_uses + 1
            WHERE id = v_rule.id;
        END IF;
    END LOOP;

    -- Round to 2 decimal places
    v_final_price := ROUND(v_final_price, 2);

    -- Log calculation
    INSERT INTO pricing_calculations (
        service_id,
        base_price,
        final_price,
        applied_rules,
        calculation_context
    ) VALUES (
        p_service_id,
        v_base_price,
        v_final_price,
        v_applied_rules,
        jsonb_build_object(
            'date', p_date,
            'group_size', p_group_size,
            'demand_level', v_demand_level,
            'context', p_context
        )
    );

    RETURN v_final_price;
END;
$$ LANGUAGE plpgsql;

-- Function to get price history
CREATE OR REPLACE FUNCTION get_price_history(
    p_service_id UUID,
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    date DATE,
    price DECIMAL(10,2),
    rule_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pc.created_at::date,
        AVG(pc.final_price)::DECIMAL(10,2),
        COUNT(DISTINCT unnest(pc.applied_rules))
    FROM pricing_calculations pc
    WHERE pc.service_id = p_service_id
    AND pc.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY pc.created_at::date
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to suggest optimal pricing
CREATE OR REPLACE FUNCTION suggest_pricing_adjustment(
    p_service_id UUID,
    p_target_occupancy DECIMAL DEFAULT 0.85
) RETURNS TABLE (
    suggested_price DECIMAL(10,2),
    current_price DECIMAL(10,2),
    occupancy_rate DECIMAL,
    recommendation TEXT
) AS $$
DECLARE
    v_current_price DECIMAL(10,2);
    v_total_slots BIGINT;
    v_booked_slots BIGINT;
    v_occupancy_rate DECIMAL;
    v_suggestion DECIMAL(10,2);
    v_recommendation TEXT := 'Current pricing is optimal';
BEGIN
    -- Get current average price
    SELECT AVG(final_price) INTO v_current_price
    FROM pricing_calculations
    WHERE service_id = p_service_id
    AND created_at >= CURRENT_DATE - INTERVAL '7 days';

    -- Calculate occupancy rate
    SELECT
        COUNT(*) INTO v_total_slots,
        COUNT(CASE WHEN status NOT IN ('cancelled', 'no_show') THEN 1 END) INTO v_booked_slots
    FROM availability_slots
    WHERE service_id = p_service_id
    AND start_time >= CURRENT_DATE
    AND start_time < CURRENT_DATE + INTERVAL '7 days';

    v_occupancy_rate := CASE
        WHEN v_total_slots > 0 THEN v_booked_slots::DECIMAL / v_total_slots
        ELSE 0
    END;

    -- Suggest adjustment based on occupancy
    IF v_occupancy_rate < p_target_occupancy - 0.1 THEN
        v_suggestion := v_current_price * 0.9; -- Decrease by 10%
        v_recommendation := 'Consider decreasing price to increase occupancy';
    ELSIF v_occupancy_rate > p_target_occupancy + 0.1 THEN
        v_suggestion := v_current_price * 1.1; -- Increase by 10%
        v_recommendation := 'Consider increasing price to maximize revenue';
    ELSE
        v_suggestion := v_current_price;
    END IF;

    RETURN QUERY SELECT v_suggestion, v_current_price, v_occupancy_rate, v_recommendation;
END;
$$ LANGUAGE plpgsql;

-- Updated trigger for timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pricing_rules_updated_at
    BEFORE UPDATE ON pricing_rules
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Add comments
COMMENT ON TABLE pricing_rules IS 'Dynamic pricing rules for services based on various conditions';
COMMENT ON TABLE pricing_calculations IS 'Audit log of all price calculations with applied rules';
COMMENT ON TABLE price_snapshots IS 'Historical price snapshots for trend analysis';
COMMENT ON FUNCTION calculate_dynamic_price IS 'Calculates dynamic price based on active rules and conditions';