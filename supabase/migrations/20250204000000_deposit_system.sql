-- Deposit System Migration
-- Adds automated deposit calculation and management for high-value services

-- 1. Create deposit rules table
CREATE TABLE IF NOT EXISTS deposit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('beauty', 'fitness', 'lifestyle')),
  category TEXT, -- Service category for more granular rules
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),

  -- Deposit configuration
  deposit_type TEXT NOT NULL CHECK (deposit_type IN ('fixed', 'percentage')),
  deposit_amount DECIMAL(10,2) NOT NULL,
  max_deposit_amount DECIMAL(10,2), -- For percentage deposits

  -- Refund policy
  refund_policy TEXT NOT NULL CHECK (refund_policy IN ('refundable', 'non_refundable', 'partial')),
  days_before_refund INTEGER DEFAULT 7,
  partial_refund_percentage DECIMAL(5,2), -- For partial refunds (e.g., 50.00 = 50%)

  -- Time-based rules
  apply_within_days INTEGER, -- Only apply if booking is within X days
  apply_after_hours INTEGER, -- Only apply if booking is after X hours from now

  -- Special conditions
  min_group_size INTEGER, -- For group bookings
  promotion_exclusive BOOLEAN DEFAULT false, -- Doesn't apply with promotions
  loyalty_tier_exclusive TEXT[], -- Only for specific loyalty tiers

  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority rules override lower ones
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT deposit_price_range_check CHECK (
    (price_min IS NULL OR price_max IS NULL) OR price_min <= price_max
  ),
  CONSTRAINT deposit_amount_check CHECK (
    deposit_type = 'fixed' AND deposit_amount > 0 OR
    deposit_type = 'percentage' AND deposit_amount > 0 AND deposit_amount <= 100
  )
);

-- 2. Create deposit transactions table
CREATE TABLE IF NOT EXISTS deposit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),

  -- Deposit details
  deposit_amount DECIMAL(10,2) NOT NULL,
  deposit_type TEXT NOT NULL CHECK (deposit_type IN ('fixed', 'percentage')),
  deposit_percentage DECIMAL(5,2), -- The percentage used if applicable
  original_deposit_rule_id UUID REFERENCES deposit_rules(id),

  -- Payment tracking
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  deposit_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    deposit_status IN ('pending', 'paid', 'refunded', 'partially_refunded', 'forfeited', 'failed')
  ),

  -- Refund details
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason TEXT,
  refund_policy_applied TEXT,
  days_before_cancellation INTEGER,
  refund_stripe_refund_id TEXT,
  refund_processed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Add deposit fields to bookings table (if not already present)
DO $$
BEGIN
  -- Check if columns exist before adding them
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_required'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_required BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_paid'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_paid DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_refund_policy'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_refund_policy TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_rule_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_rule_id UUID REFERENCES deposit_rules(id);
  END IF;
END $$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deposit_rules_service ON deposit_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_deposit_rules_active ON deposit_rules(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_deposit_rules_service_type ON deposit_rules(service_type, is_active);
CREATE INDEX IF NOT EXISTS idx_deposit_rules_price_range ON deposit_rules(service_type, price_min, price_max, is_active);

CREATE INDEX IF NOT EXISTS idx_deposit_transactions_booking ON deposit_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_deposit_transactions_status ON deposit_transactions(deposit_status);
CREATE INDEX IF NOT EXISTS idx_deposit_transactions_created ON deposit_transactions(created_at);

-- 5. Add helpful functions for deposit calculation
CREATE OR REPLACE FUNCTION calculate_deposit_amount(
  p_service_id UUID,
  p_service_type TEXT,
  p_price DECIMAL(10,2),
  p_booking_date DATE DEFAULT NULL,
  p_group_size INTEGER DEFAULT 1,
  p_loyalty_tier TEXT DEFAULT NULL
) RETURNS TABLE (
  rule_id UUID,
  deposit_required BOOLEAN,
  deposit_amount DECIMAL(10,2),
  deposit_type TEXT,
  refund_policy TEXT,
  days_before_refund INTEGER
) AS $$
DECLARE
  v_selected_rule deposit_rules%ROWTYPE;
  v_days_until_booking INTEGER;
BEGIN
  -- Calculate days until booking
  IF p_booking_date IS NOT NULL THEN
    v_days_until_booking := p_booking_date - CURRENT_DATE;
  ELSE
    v_days_until_booking := 999; -- Far future if no date specified
  END IF;

  -- Select the best matching rule
  SELECT * INTO v_selected_rule
  FROM deposit_rules
  WHERE
    deposit_rules.is_active = true
    AND (
      deposit_rules.service_id IS NULL OR deposit_rules.service_id = p_service_id
    )
    AND deposit_rules.service_type = p_service_type
    AND (
      deposit_rules.price_min IS NULL OR p_price >= deposit_rules.price_min
    )
    AND (
      deposit_rules.price_max IS NULL OR p_price <= deposit_rules.price_max
    )
    AND (
      deposit_rules.apply_within_days IS NULL OR v_days_until_booking <= deposit_rules.apply_within_days
    )
    AND (
      deposit_rules.apply_after_hours IS NULL OR
      EXTRACT(EPOCH FROM (p_booking_date || ' 12:00'::timestamp) - CURRENT_TIMESTAMP) / 3600 >= deposit_rules.apply_after_hours
    )
    AND (
      deposit_rules.min_group_size IS NULL OR p_group_size >= deposit_rules.min_group_size
    )
    AND (
      deposit_rules.loyalty_tier_exclusive IS NULL OR
      (p_loyalty_tier IS NOT NULL AND p_loyalty_tier = ANY(deposit_rules.loyalty_tier_exclusive))
    )
  ORDER BY
    deposit_rules.priority DESC,
    CASE WHEN deposit_rules.service_id IS NOT NULL THEN 1 ELSE 2 END,
    CASE WHEN deposit_rules.price_min IS NOT NULL AND deposit_rules.price_max IS NOT NULL THEN 1 ELSE 2 END
  LIMIT 1;

  -- Return results
  IF v_selected_rule.id IS NOT NULL THEN
    rule_id := v_selected_rule.id;
    deposit_required := true;

    -- Calculate deposit amount
    IF v_selected_rule.deposit_type = 'fixed' THEN
      deposit_amount := v_selected_rule.deposit_amount;
      deposit_type := 'fixed';
    ELSE
      deposit_amount := LEAST(
        p_price * (v_selected_rule.deposit_amount / 100),
        COALESCE(v_selected_rule.max_deposit_amount, p_price)
      );
      deposit_type := 'percentage';
    END IF;

    refund_policy := v_selected_rule.refund_policy;
    days_before_refund := v_selected_rule.days_before_refund;
  ELSE
    rule_id := NULL;
    deposit_required := false;
    deposit_amount := 0;
    deposit_type := NULL;
    refund_policy := NULL;
    days_before_refund := NULL;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to process deposit refunds
CREATE OR REPLACE FUNCTION process_deposit_refund(
  p_booking_id UUID,
  p_cancellation_date DATE DEFAULT CURRENT_DATE,
  p_reason TEXT DEFAULT NULL
) RETURNS TABLE (
  refund_amount DECIMAL(10,2),
  refund_status TEXT,
  refund_reason TEXT
) AS $$
DECLARE
  v_deposit deposit_transactions%ROWTYPE;
  v_booking bookings%ROWTYPE;
  v_days_until_booking INTEGER;
  v_rule deposit_rules%ROWTYPE;
  v_refund_amount DECIMAL(10,2) := 0;
  v_refund_status TEXT := 'none';
  v_refund_reason TEXT := NULL;
BEGIN
  -- Get deposit and booking info
  SELECT * INTO v_deposit FROM deposit_transactions
  WHERE booking_id = p_booking_id AND deposit_status = 'paid'
  ORDER BY created_at DESC LIMIT 1;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

  IF v_deposit.id IS NULL THEN
    RETURN NEXT;
    RETURN;
  END IF;

  -- Calculate days until original booking
  v_days_until_booking := v_booking.booking_date - p_cancellation_date;

  -- Get the rule that was applied
  SELECT * INTO v_rule FROM deposit_rules WHERE id = v_deposit.original_deposit_rule_id;

  IF v_rule.id IS NULL THEN
    -- No rule found, default to non-refundable
    v_refund_status := 'forfeited';
    v_refund_reason := 'No refund policy found';
  ELSIF v_rule.refund_policy = 'refundable' AND v_days_until_booking >= v_rule.days_before_refund THEN
    -- Full refund
    v_refund_amount := v_deposit.deposit_amount;
    v_refund_status := 'full_refund';
    v_refund_reason := 'Full refund - cancelled ' || v_days_until_booking || ' days before booking';
  ELSIF v_rule.refund_policy = 'partial' AND v_days_until_booking >= v_rule.days_before_refund THEN
    -- Partial refund
    v_refund_amount := v_deposit.deposit_amount * (COALESCE(v_rule.partial_refund_percentage, 50) / 100);
    v_refund_status := 'partial_refund';
    v_refund_reason := 'Partial refund - ' || COALESCE(v_rule.partial_refund_percentage, 50) || '% refunded';
  ELSE
    -- No refund
    v_refund_status := 'forfeited';
    v_refund_reason := CASE
      WHEN v_rule.refund_policy = 'non_refundable' THEN 'Non-refundable deposit'
      WHEN v_days_until_booking < v_rule.days_before_refund THEN
        'Cancelled too close to booking date (' || v_days_until_booking || ' days before)'
      ELSE 'Refund conditions not met'
    END;
  END IF;

  -- Update deposit transaction
  UPDATE deposit_transactions SET
    refund_amount = v_refund_amount,
    refund_reason = v_refund_reason,
    refund_policy_applied = v_rule.refund_policy,
    days_before_cancellation = v_days_until_booking,
    refund_processed_at = CURRENT_TIMESTAMP,
    deposit_status = CASE
      WHEN v_refund_amount > 0 THEN 'refunded'
      ELSE 'forfeited'
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_deposit.id;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 7. Insert default deposit rules for common scenarios
INSERT INTO deposit_rules (
  service_type,
  category,
  price_min,
  deposit_type,
  deposit_amount,
  refund_policy,
  days_before_refund,
  priority,
  is_active
) VALUES
  -- Beauty services over 500 PLN
  ('beauty', NULL, 500, 'percentage', 20, 'refundable', 3, 10, true),

  -- Beauty services over 1000 PLN
  ('beauty', NULL, 1000, 'percentage', 30, 'partial', 7, 20, true),

  -- Fitness packages over 300 PLN
  ('fitness', NULL, 300, 'percentage', 25, 'refundable', 5, 10, true),

  -- All lifestyle services over 400 PLN
  ('lifestyle', NULL, 400, 'percentage', 15, 'non_refundable', 0, 5, true),

  -- Special fixed deposit for PMU services
  ('beauty', 'PMU', NULL, 'fixed', 200, 'partial', 7, 30, true),

  -- Last-minute bookings (within 48 hours)
  ('beauty', NULL, NULL, 'percentage', 100, 'non_refundable', 0, 40, true),
  ('fitness', NULL, NULL, 'percentage', 100, 'non_refundable', 0, 40, true)
ON CONFLICT DO NOTHING;

-- 8. Update function to automatically apply deposits to new bookings
CREATE OR REPLACE FUNCTION apply_deposit_to_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_service services%ROWTYPE;
  v_deposit_result RECORD;
BEGIN
  -- Get service details
  SELECT * INTO v_service FROM services WHERE id = NEW.service_id;

  -- Calculate deposit
  SELECT * INTO v_deposit_result FROM calculate_deposit_amount(
    NEW.service_id,
    v_service.service_type::text,
    COALESCE(NEW.original_price, 0),
    NEW.booking_date,
    COALESCE(NEW.group_participant_count, 1)
  );

  -- Apply deposit to booking
  IF v_deposit_result.deposit_required THEN
    NEW.deposit_required := true;
    NEW.deposit_amount := v_deposit_result.deposit_amount;
    NEW.deposit_rule_id := v_deposit_result.rule_id;
    NEW.deposit_refund_policy := v_deposit_result.refund_policy;
    NEW.balance_due := NEW.original_price - v_deposit_result.deposit_amount;
  ELSE
    NEW.deposit_required := false;
    NEW.deposit_amount := 0;
    NEW.balance_due := NEW.original_price;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to apply deposits on booking creation
DROP TRIGGER IF EXISTS trigger_apply_deposit_to_booking ON bookings;
CREATE TRIGGER trigger_apply_deposit_to_booking
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION apply_deposit_to_booking();

-- 10. Row Level Security policies
ALTER TABLE deposit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage deposit rules
CREATE POLICY "Admins can manage deposit rules" ON deposit_rules
  FOR ALL USING (
    auth.jwt_role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Users can view their own deposit transactions
CREATE POLICY "Users can view own deposit transactions" ON deposit_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = deposit_transactions.booking_id
      AND b.client_email = (
        SELECT raw_user_meta_data->>'email'
        FROM auth.users
        WHERE auth.users.id = auth.uid()
      )
    )
  );

-- Service role can read deposit rules for calculations
CREATE POLICY "Service role can read deposit rules" ON deposit_rules
  FOR SELECT USING (auth.jwt_role() = 'service_role');

-- Service role can manage all deposit transactions
CREATE POLICY "Service role can manage deposit transactions" ON deposit_transactions
  FOR ALL USING (auth.jwt_role() = 'service_role');