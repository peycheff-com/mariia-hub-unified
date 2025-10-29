-- ========================================
-- PAYMENT SYSTEM ENHANCEMENTS
-- ========================================

-- Gift Cards and Vouchers System
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('gift_card', 'voucher', 'credit')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'void')),
  initial_value DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'PLN',
  purchaser_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255),
  personal_message TEXT,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('issued', 'used', 'voided', 'expired')),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Split Payment and Payment Plans
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  number_of_installments INTEGER NOT NULL CHECK (number_of_installments > 0),
  installment_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'defaulted', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  stripe_payment_intent_id VARCHAR(255),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(payment_plan_id, installment_number)
);

-- Cancellation Policies and Fees
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  service_type VARCHAR(20),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  cancellation_window_hours INTEGER NOT NULL DEFAULT 24,
  fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  fee_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (fee_type IN ('percentage', 'fixed', 'deposit_forfeiture')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_policy_per_service UNIQUE(service_id)
);

CREATE TABLE IF NOT EXISTS cancellation_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  original_amount DECIMAL(10,2) NOT NULL,
  fee_amount DECIMAL(10,2) NOT NULL,
  fee_type VARCHAR(20) NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  cancellation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  policy_applied_id UUID REFERENCES cancellation_policies(id),
  stripe_refund_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- LOYALTY PROGRAM
-- ========================================

-- Loyalty Program Configuration
CREATE TABLE IF NOT EXISTS loyalty_program (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_per_currency DECIMAL(10,4) NOT NULL DEFAULT 1, -- Points earned per currency unit spent
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty Tiers
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES loyalty_program(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  min_points INTEGER NOT NULL,
  max_points INTEGER, -- NULL for highest tier
  benefits JSONB DEFAULT '{}',
  points_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Points Tracking
CREATE TABLE IF NOT EXISTS customer_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_redeemed INTEGER NOT NULL DEFAULT 0,
  tier_id UUID REFERENCES loyalty_tiers(id),
  program_id UUID NOT NULL REFERENCES loyalty_program(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_program UNIQUE(user_id, program_id)
);

-- Points Transactions
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_points_id UUID NOT NULL REFERENCES customer_points(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  points INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards Catalog
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES loyalty_program(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('discount', 'free_service', 'upgrade', 'voucher')),
  points_cost INTEGER NOT NULL,
  value DECIMAL(10,2), -- Monetary value if applicable
  discount_type VARCHAR(20), -- 'percentage' or 'fixed' for discounts
  discount_value DECIMAL(10,2),
  applicable_service_types TEXT[],
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reward Redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'used', 'expired', 'cancelled')),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  redemption_code VARCHAR(32) UNIQUE,
  metadata JSONB DEFAULT '{}'
);

-- ========================================
-- REFERRAL PROGRAM
-- ========================================

-- Referral Program Configuration
CREATE TABLE IF NOT EXISTS referral_program (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  referrer_reward_points INTEGER NOT NULL DEFAULT 100,
  referee_reward_points INTEGER NOT NULL DEFAULT 50,
  referrer_discount_type VARCHAR(20), -- 'percentage' or 'fixed'
  referrer_discount_value DECIMAL(10,2),
  referee_discount_type VARCHAR(20),
  referee_discount_value DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral Relationships
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES referral_program(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code VARCHAR(32) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_referee_code UNIQUE(referral_code)
);

-- Referral Rewards
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('points', 'discount')),
  reward_value DECIMAL(10,2) NOT NULL,
  points_awarded INTEGER,
  discount_code VARCHAR(32),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'issued', 'used', 'expired')),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Gift Cards
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient ON gift_cards(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at ON gift_cards(expires_at);

-- Payment Plans
CREATE INDEX IF NOT EXISTS idx_payment_plans_booking ON payment_plans(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_installments_plan ON payment_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_due_date ON payment_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_installments_status ON payment_installments(status);

-- Cancellation Fees
CREATE INDEX IF NOT EXISTS idx_cancellation_fees_booking ON cancellation_fees(booking_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_fees_status ON cancellation_fees(status);

-- Loyalty Program
CREATE INDEX IF NOT EXISTS idx_customer_points_user ON customer_points(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_points_tier ON customer_points(tier_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_customer ON points_transactions(customer_points_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_booking ON points_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type);

-- Rewards
CREATE INDEX IF NOT EXISTS idx_rewards_program ON rewards(program_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_code ON reward_redemptions(redemption_code);

-- Referral Program
CREATE INDEX IF NOT EXISTS idx_referrals_program ON referrals(program_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral ON referral_rewards(referral_id);

-- ========================================
-- TRIGGERS AND FUNCTIONS
-- ========================================

-- Update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON gift_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cancellation_policies_updated_at BEFORE UPDATE ON cancellation_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_plans_updated_at BEFORE UPDATE ON payment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_program_updated_at BEFORE UPDATE ON loyalty_program
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_tiers_updated_at BEFORE UPDATE ON loyalty_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_points_updated_at BEFORE UPDATE ON customer_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_program_updated_at BEFORE UPDATE ON referral_program
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Gift Cards RLS
CREATE POLICY "Users can view own gift cards" ON gift_cards
    FOR SELECT USING (recipient_id = auth.uid() OR purchaser_id = auth.uid());

CREATE POLICY "Admins can manage all gift cards" ON gift_cards
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Payment Plans RLS
CREATE POLICY "Users can view own payment plans" ON payment_plans
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM bookings WHERE id = payment_plans.booking_id AND user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all payment plans" ON payment_plans
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Customer Points RLS
CREATE POLICY "Users can view own points" ON customer_points
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all points" ON customer_points
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Reward Redemptions RLS
CREATE POLICY "Users can view own redemptions" ON reward_redemptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all redemptions" ON reward_redemptions
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Referrals RLS
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "Admins can manage all referrals" ON referrals
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ========================================
-- INITIALIZATION DATA
-- ========================================

-- Insert default loyalty program if not exists
INSERT INTO loyalty_program (name, description, points_per_currency)
VALUES (
    'Mariia Hub Rewards',
    'Earn points with every booking and redeem them for exclusive rewards and discounts',
    10.0 -- 10 points per PLN spent
) ON CONFLICT DO NOTHING;

-- Insert default loyalty tiers
INSERT INTO loyalty_tiers (program_id, name, description, min_points, max_points, benefits, points_multiplier)
SELECT
    lp.id,
    'Bronze',
    'Welcome to the rewards program',
    0,
    499,
    '{"discount_percentage": 5, "birthday_gift": true}',
    1.0
FROM loyalty_program lp
WHERE lp.name = 'Mariia Hub Rewards'
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_tiers (program_id, name, description, min_points, max_points, benefits, points_multiplier)
SELECT
    lp.id,
    'Silver',
    'Enhanced benefits and exclusive offers',
    500,
    1499,
    '{"discount_percentage": 10, "priority_booking": true, "birthday_gift": true}',
    1.2
FROM loyalty_program lp
WHERE lp.name = 'Mariia Hub Rewards'
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_tiers (program_id, name, description, min_points, benefits, points_multiplier)
SELECT
    lp.id,
    'Gold',
    'VIP treatment and maximum rewards',
    1500,
    '{"discount_percentage": 15, "priority_booking": true, "exclusive_events": true, "personal_consultant": true, "birthday_gift": true}',
    1.5
FROM loyalty_program lp
WHERE lp.name = 'Mariia Hub Rewards'
ON CONFLICT DO NOTHING;

-- Insert default referral program
INSERT INTO referral_program (
    name,
    description,
    referrer_reward_points,
    referee_reward_points,
    referrer_discount_type,
    referrer_discount_value,
    referee_discount_type,
    referee_discount_value
)
VALUES (
    'Refer a Friend',
    'Share the beauty and wellness experience with friends and earn rewards',
    200,
    100,
    'percentage',
    10.0,
    'percentage',
    15.0
) ON CONFLICT DO NOTHING;

-- Insert default cancellation policy
INSERT INTO cancellation_policies (
    name,
    description,
    cancellation_window_hours,
    fee_percentage,
    fee_type,
    is_default
)
VALUES (
    'Standard Policy',
    'Free cancellation up to 24 hours before appointment',
    24,
    100,
    'deposit_forfeiture',
    true
) ON CONFLICT DO NOTHING;