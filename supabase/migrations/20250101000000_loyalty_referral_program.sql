-- Comprehensive Loyalty and Referral Program Migration
-- Migration: 20250101000000_loyalty_referral_program.sql

-- Create loyalty_tiers table
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level INTEGER NOT NULL UNIQUE,
  description TEXT,
  min_spend_amount DECIMAL(10,2) DEFAULT 0,
  min_visits INTEGER DEFAULT 0,
  min_points INTEGER DEFAULT 0,
  points_multiplier DECIMAL(3,2) DEFAULT 1.0,
  benefits JSONB NOT NULL DEFAULT '[]',
  color_code VARCHAR(7),
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default loyalty tiers
INSERT INTO loyalty_tiers (name, level, description, min_spend_amount, min_visits, min_points, points_multiplier, benefits, color_code) VALUES
('Bronze', 1, 'Start your journey with exclusive member benefits', 0, 0, 0, 1.0,
 '["Welcome points on first visit", "Birthday gift", "5% member discount", "Exclusive member events"]', '#CD7F32'),
('Silver', 2, 'Enhanced rewards and priority service', 500, 5, 500, 1.2,
 '["Enhanced points earning (20% bonus)", "Priority support", "Seasonal exclusive offers", "Free consultation", "Early access to promotions"]', '#C0C0C0'),
('Gold', 3, 'Premium experience with VIP treatment', 1500, 15, 1500, 1.5,
 '["Exclusive events and workshops", "Free monthly treatment", "Personalized recommendations", "VIP booking priority", "Complimentary upgrades", "Partner discounts"]', '#FFD700'),
('Platinum', 4, 'Elite status with concierge service', 5000, 50, 5000, 2.0,
 '["Personal concierge service", "Exclusive products access", "Quarterly VIP events", "Custom treatment plans", "Unlimited priority booking", "White-glove service"]', '#E5E4E2'),
('Diamond', 5, 'Ultimate luxury and exclusive experiences', 15000, 100, 15000, 2.5,
 '["Custom luxury experiences", "First access to innovations", "Personalized service creation", "Exclusive Diamond events", "Lifetime recognition", "Custom rewards program"]', '#B9F2FF')
ON CONFLICT (level) DO NOTHING;

-- Create loyalty_members table
CREATE TABLE IF NOT EXISTS loyalty_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES loyalty_tiers(id) ON DELETE SET NULL,
  member_number TEXT UNIQUE NOT NULL,
  current_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  total_spend DECIMAL(10,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tier advancement_date TIMESTAMP WITH TIME ZONE,
  points_expiry_date TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT points_not_negative CHECK (current_points >= 0),
  CONSTRAINT lifetime_points_not_negative CHECK (lifetime_points >= 0)
);

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES loyalty_members(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjust', 'bonus')),
  points INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create rewards_catalog table
CREATE TABLE IF NOT EXISTS rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount', 'service', 'product', 'experience', 'gift_card', 'upgrade')),
  value DECIMAL(10,2),
  image_url TEXT,
  terms_conditions TEXT,
  is_active BOOLEAN DEFAULT true,
  is_limited BOOLEAN DEFAULT false,
  quantity_available INTEGER,
  min_tier_level INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  restrictions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT positive_points CHECK (points_cost > 0),
  CONSTRAINT valid_quantity CHECK (NOT is_limited OR quantity_available > 0)
);

-- Create reward_redemptions table
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES loyalty_members(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards_catalog(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  redemption_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'used', 'expired', 'cancelled')),
  redemption_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  used_date TIMESTAMP WITH TIME ZONE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES loyalty_members(id) ON DELETE CASCADE,
  referee_email TEXT NOT NULL,
  referee_name TEXT,
  referee_phone TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referral_type TEXT NOT NULL DEFAULT 'client' CHECK (referral_type IN ('client', 'staff', 'social', 'partner', 'corporate', 'influencer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'first_booking', 'completed', 'expired', 'cancelled')),
  referral_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registration_date TIMESTAMP WITH TIME ZONE,
  first_booking_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  referrer_reward_points INTEGER DEFAULT 0,
  referee_reward_points INTEGER DEFAULT 0,
  referrer_reward_type TEXT,
  referee_reward_type TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon_url TEXT,
  badge_url TEXT,
  points_awarded INTEGER DEFAULT 0,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('milestone', 'streak', 'engagement', 'social', 'learning', 'special')),
  criteria JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_repeatable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create member_achievements table
CREATE TABLE IF NOT EXISTS member_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES loyalty_members(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  progress_data JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_awarded INTEGER DEFAULT 0,
  is_displayed BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, achievement_id)
);

-- Create loyalty_settings table
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default loyalty settings
INSERT INTO loyalty_settings (key, value, description) VALUES
('points_earn_rates', '{"booking": {"beauty": 10, "fitness": 8, "lifestyle": 6}, "review": 25, "referral": 100, "birthday": 50, "social_share": 5}', 'Points earning rates for different activities'),
('points_expiry_months', '12', 'Number of months before points expire'),
('referral_rewards', '{"referrer_points": 100, "referee_points": 50, "referrer_discount": 10, "referee_discount": 15}', 'Referral program rewards configuration'),
('tier_benefits', '{"priority_booking": true, "exclusive_events": true, "personal_concierge": false, "free_shipping": false}', 'Tier-specific benefits configuration'),
('gamification_settings', '{"leaderboard_enabled": true, "badges_enabled": true, "streaks_enabled": true, "achievements_enabled": true}', 'Gamification feature toggles')
ON CONFLICT (key) DO NOTHING;

-- Create loyalty_analytics table
CREATE TABLE IF NOT EXISTS loyalty_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_members_user_id ON loyalty_members(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_members_tier_id ON loyalty_members(tier_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_members_member_number ON loyalty_members(member_number);
CREATE INDEX IF NOT EXISTS idx_points_transactions_member_id ON points_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_member_id ON reward_redemptions(member_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_member_achievements_member_id ON member_achievements(member_id);
CREATE INDEX IF NOT EXISTS idx_member_achievements_achievement_id ON member_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_analytics_date ON loyalty_analytics(date);
CREATE INDEX IF NOT EXISTS idx_loyalty_analytics_metric_type ON loyalty_analytics(metric_type);

-- Create Row Level Security (RLS) policies
ALTER TABLE loyalty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_members
CREATE POLICY "Users can view their own loyalty data" ON loyalty_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty preferences" ON loyalty_members
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for points_transactions
CREATE POLICY "Users can view their own points transactions" ON points_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loyalty_members lm
      WHERE lm.id = member_id AND lm.user_id = auth.uid()
    )
  );

-- RLS policies for reward_redemptions
CREATE POLICY "Users can view their own reward redemptions" ON reward_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loyalty_members lm
      WHERE lm.id = member_id AND lm.user_id = auth.uid()
    )
  );

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loyalty_members lm
      WHERE lm.id = referrer_id AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can check referral code validity" ON referrals
  FOR SELECT USING (referral_code IS NOT NULL AND status = 'pending');

-- RLS policies for member_achievements
CREATE POLICY "Users can view their own achievements" ON member_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loyalty_members lm
      WHERE lm.id = member_id AND lm.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_loyalty_members_updated_at
  BEFORE UPDATE ON loyalty_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_tiers_updated_at
  BEFORE UPDATE ON loyalty_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_catalog_updated_at
  BEFORE UPDATE ON rewards_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_settings_updated_at
  BEFORE UPDATE ON loyalty_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create database functions for loyalty operations

-- Function to earn points for a member
CREATE OR REPLACE FUNCTION earn_points(
  p_member_id UUID,
  p_points INTEGER,
  p_description TEXT,
  p_transaction_type TEXT DEFAULT 'earn',
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_current_points INTEGER;
  v_new_points INTEGER;
  v_transaction_id UUID;
  v_expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current points
  SELECT COALESCE(current_points, 0) INTO v_current_points
  FROM loyalty_members
  WHERE id = p_member_id;

  -- Calculate new points
  v_new_points := v_current_points + p_points;

  -- Set expiry date if not provided
  IF p_expires_at IS NULL THEN
    v_expiry_date := NOW() + INTERVAL '12 months';
  ELSE
    v_expiry_date := p_expires_at;
  END IF;

  -- Update member points
  UPDATE loyalty_members
  SET
    current_points = v_new_points,
    lifetime_points = lifetime_points + p_points,
    points_expiry_date = v_expiry_date
  WHERE id = p_member_id;

  -- Create transaction record
  INSERT INTO points_transactions (
    member_id, transaction_type, points, balance_before, balance_after,
    description, reference_type, reference_id, booking_id, expires_at
  ) VALUES (
    p_member_id, p_transaction_type, p_points, v_current_points, v_new_points,
    p_description, p_reference_type, p_reference_id, p_booking_id, v_expiry_date
  ) RETURNING id INTO v_transaction_id;

  -- Check for tier advancement
  PERFORM check_tier_advancement(p_member_id);

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem points
CREATE OR REPLACE FUNCTION redeem_points(
  p_member_id UUID,
  p_points INTEGER,
  p_description TEXT,
  p_reward_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_current_points INTEGER;
  v_new_points INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current points
  SELECT current_points INTO v_current_points
  FROM loyalty_members
  WHERE id = p_member_id;

  -- Check sufficient points
  IF v_current_points < p_points THEN
    RAISE EXCEPTION 'Insufficient points. Available: %, Required: %', v_current_points, p_points;
  END IF;

  -- Calculate new points
  v_new_points := v_current_points - p_points;

  -- Update member points
  UPDATE loyalty_members
  SET current_points = v_new_points
  WHERE id = p_member_id;

  -- Create transaction record
  INSERT INTO points_transactions (
    member_id, transaction_type, points, balance_before, balance_after,
    description, reference_type, reference_id
  ) VALUES (
    p_member_id, 'redeem', -p_points, v_current_points, v_new_points,
    p_description, 'reward', p_reward_id
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check tier advancement
CREATE OR REPLACE FUNCTION check_tier_advancement(p_member_id UUID) RETURNS VOID AS $$
DECLARE
  v_current_tier_id UUID;
  v_current_level INTEGER;
  v_new_tier_id UUID;
  v_new_level INTEGER;
  v_total_spend DECIMAL(10,2);
  v_total_visits INTEGER;
  v_lifetime_points INTEGER;
BEGIN
  -- Get current member data
  SELECT tier_id, total_spend, total_visits, lifetime_points
  INTO v_current_tier_id, v_total_spend, v_total_visits, v_lifetime_points
  FROM loyalty_members
  WHERE id = p_member_id;

  -- Get current level
  SELECT COALESCE(level, 0) INTO v_current_level
  FROM loyalty_tiers
  WHERE id = v_current_tier_id;

  -- Find highest eligible tier
  SELECT id, level INTO v_new_tier_id, v_new_level
  FROM loyalty_tiers
  WHERE
    is_active = true AND
    (min_spend_amount <= v_total_spend OR min_visits <= v_total_visits OR min_points <= v_lifetime_points)
  ORDER BY level DESC
  LIMIT 1;

  -- Advance tier if eligible and higher than current
  IF v_new_tier_id IS NOT NULL AND (v_current_level IS NULL OR v_new_level > v_current_level) THEN
    UPDATE loyalty_members
    SET
      tier_id = v_new_tier_id,
      tier_advancement_date = NOW()
    WHERE id = p_member_id;

    -- Award tier advancement bonus points
    PERFORM earn_points(
      p_member_id,
      v_new_level * 50, -- 50 points per tier level
      format('Tier advancement bonus: %s tier achieved', (SELECT name FROM loyalty_tiers WHERE id = v_new_tier_id)),
      'bonus',
      'tier_advancement',
      v_new_tier_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique member number
CREATE OR REPLACE FUNCTION generate_member_number() RETURNS TEXT AS $$
DECLARE
  v_member_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_member_number := 'MH' || LPAD(extract(epoch from now())::text, 8, '0') || LPAD(floor(random() * 1000)::text, 3, '0');

    SELECT EXISTS(SELECT 1 FROM loyalty_members WHERE member_number = v_member_number) INTO v_exists;

    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN v_member_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := upper(substring(md5(random()::text), 1, 8));

    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = v_code) INTO v_exists;

    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Insert sample achievements
INSERT INTO achievements (name, description, category, icon_url, points_awarded, achievement_type, criteria) VALUES
('First Visit', 'Complete your first beauty or fitness treatment', 'milestone', '/icons/first-visit.svg', 50, 'milestone', '{"visits": 1}'),
('Loyal Client', 'Complete 10 treatments', 'milestone', '/icons/loyal-client.svg', 100, 'milestone', '{"visits": 10}'),
('Beauty Explorer', 'Try 5 different beauty services', 'engagement', '/icons/beauty-explorer.svg', 75, 'engagement', '{"beauty_services": 5}'),
('Fitness Enthusiast', 'Complete 10 fitness sessions', 'milestone', '/icons/fitness-enthusiast.svg', 150, 'milestone', '{"fitness_sessions": 10}'),
('Social Butterfly', 'Share 3 reviews', 'social', '/icons/social-butterfly.svg', 25, 'social', '{"reviews": 3}'),
('Referral Champion', 'Refer 3 friends who book appointments', 'social', '/icons/referral-champion.svg', 200, 'social', '{"successful_referrals": 3}'),
('Monthly Streak', 'Visit at least once a month for 3 consecutive months', 'streak', '/icons/monthly-streak.svg', 100, 'streak', '{"consecutive_months": 3}'),
('VIP Member', 'Achieve Gold tier or higher', 'milestone', '/icons/vip-member.svg', 300, 'milestone', '{"tier_level": 3}')
ON CONFLICT DO NOTHING;

-- Insert sample rewards
INSERT INTO rewards_catalog (title, description, category, points_cost, reward_type, value, valid_from) VALUES
('10% Off Next Treatment', 'Get 10% discount on your next beauty or fitness treatment', 'discount', 200, 'discount', 10.00, NOW()),
('Free Consultation', 'Complimentary 30-minute consultation with our beauty expert', 'service', 300, 'service', 150.00, NOW()),
('Lip Enhancement Treatment', 'Free lip enhancement treatment (15 min)', 'service', 800, 'service', 300.00, NOW()),
('Exclusive Product Set', 'Premium beauty product set from our partner brands', 'product', 500, 'product', 100.00, NOW()),
('VIP Workshop Access', 'Access to exclusive beauty and wellness workshop', 'experience', 600, 'experience', 200.00, NOW()),
('Birthday Upgrade', 'Complimentary service upgrade on your birthday month', 'upgrade', 400, 'upgrade', 50.00, NOW())
ON CONFLICT DO NOTHING;