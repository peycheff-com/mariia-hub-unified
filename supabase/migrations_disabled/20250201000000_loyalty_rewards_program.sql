-- Migration: Loyalty and Rewards Program
-- Description: Complete loyalty system with tiers, points, referrals, and rewards

-- Loyalty program configuration
CREATE TABLE loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  points_per_currency DECIMAL(5,2) DEFAULT 1.0,
  tiers JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Customer loyalty status
CREATE TABLE customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  current_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  tier_expires_at TIMESTAMP,
  total_earned INTEGER DEFAULT 0,
  total_redeemed INTEGER DEFAULT 0,
  last_activity TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(customer_id, program_id)
);

-- Point transaction history
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  reference_id UUID, -- Reference to booking, payment, or other entity
  reference_type TEXT, -- 'booking', 'payment', 'referral', 'adjustment'
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Loyalty tiers configuration
CREATE TABLE loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  min_points INTEGER NOT NULL,
  benefits JSONB DEFAULT '{}'::jsonb,
  point_multiplier DECIMAL(3,2) DEFAULT 1.0,
  color TEXT DEFAULT '#8B4513',
  icon TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(program_id, name)
);

-- Achievement badges
CREATE TABLE achievement_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT DEFAULT 'general',
  criteria JSONB NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Customer achievements
CREATE TABLE customer_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES achievement_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(customer_id, badge_id)
);

-- Referral program
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_points INTEGER DEFAULT 100,
  referrer_reward_points INTEGER DEFAULT 100,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Rewards catalog
CREATE TABLE rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'discount',
  points_cost INTEGER NOT NULL,
  discount_value DECIMAL(10,2),
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_limited BOOLEAN DEFAULT false,
  available_from TIMESTAMP,
  available_until TIMESTAMP,
  image_url TEXT,
  terms TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Customer rewards (redemptions)
CREATE TABLE customer_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards_catalog(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  redemption_code TEXT UNIQUE,
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Streak tracking for gamification
CREATE TABLE customer_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL, -- 'booking', 'login', 'referral'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity DATE,
  next_bonus_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(customer_id, streak_type)
);

-- Loyalty events for analytics
CREATE TABLE loyalty_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  points_change INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Initialize default loyalty program
INSERT INTO loyalty_programs (name, points_per_currency, tiers) VALUES
('Mariia Beauty & Fitness Rewards', 1.0, '[
  {
    "name": "Bronze",
    "level": 1,
    "min_points": 0,
    "benefits": {
      "point_multiplier": 1.0,
      "birthday_bonus": 50,
      "referral_bonus": 100,
      "free_cancellation": false
    },
    "color": "#CD7F32",
    "icon": "🥉"
  },
  {
    "name": "Silver",
    "level": 2,
    "min_points": 500,
    "benefits": {
      "point_multiplier": 1.2,
      "birthday_bonus": 100,
      "referral_bonus": 150,
      "free_cancellation": true,
      "priority_booking": true
    },
    "color": "#C0C0C0",
    "icon": "🥈"
  },
  {
    "name": "Gold",
    "level": 3,
    "min_points": 1500,
    "benefits": {
      "point_multiplier": 1.5,
      "birthday_bonus": 200,
      "referral_bonus": 200,
      "free_cancellation": true,
      "priority_booking": true,
      "exclusive_offers": true,
      "quarterly_gift": true
    },
    "color": "#FFD700",
    "icon": "🥇"
  },
  {
    "name": "Platinum",
    "level": 4,
    "min_points": 3000,
    "benefits": {
      "point_multiplier": 2.0,
      "birthday_bonus": 500,
      "referral_bonus": 300,
      "free_cancellation": true,
      "priority_booking": true,
      "exclusive_offers": true,
      "quarterly_gift": true,
      "personal_concierge": true,
      "annual_bonus": 1000
    },
    "color": "#E5E4E2",
    "icon": "💎"
  }
]') RETURNING id;

-- Get the program ID for subsequent inserts
DO $$
DECLARE
  program_id UUID;
BEGIN
  SELECT id INTO program_id FROM loyalty_programs WHERE name = 'Mariia Beauty & Fitness Rewards';

  -- Insert tiers into separate table
  INSERT INTO loyalty_tiers (program_id, name, level, min_points, benefits, point_multiplier, color, icon) VALUES
    (program_id, 'Bronze', 1, 0, '{"point_multiplier": 1.0, "birthday_bonus": 50, "referral_bonus": 100, "free_cancellation": false}', 1.0, '#CD7F32', '🥉'),
    (program_id, 'Silver', 2, 500, '{"point_multiplier": 1.2, "birthday_bonus": 100, "referral_bonus": 150, "free_cancellation": true, "priority_booking": true}', 1.2, '#C0C0C0', '🥈'),
    (program_id, 'Gold', 3, 1500, '{"point_multiplier": 1.5, "birthday_bonus": 200, "referral_bonus": 200, "free_cancellation": true, "priority_booking": true, "exclusive_offers": true, "quarterly_gift": true}', 1.5, '#FFD700', '🥇'),
    (program_id, 'Platinum', 4, 3000, '{"point_multiplier": 2.0, "birthday_bonus": 500, "referral_bonus": 300, "free_cancellation": true, "priority_booking": true, "exclusive_offers": true, "quarterly_gift": true, "personal_concierge": true, "annual_bonus": 1000}', 2.0, '#E5E4E2', '💎');
END $$;

-- Create achievement badges
INSERT INTO achievement_badges (name, description, icon, category, criteria, points_awarded) VALUES
  ('First Booking', 'Complete your first booking', '🎯', 'milestone', '{"type": "first_booking"}', 50),
  ('Loyal Customer', 'Complete 5 bookings', '⭐', 'milestone', '{"type": "booking_count", "count": 5}', 100),
  ('Beauty Enthusiast', 'Complete 10 beauty treatments', '💄', 'category', '{"type": "category_bookings", "category": "beauty", "count": 10}', 150),
  ('Fitness Champion', 'Complete 10 fitness sessions', '💪', 'category', '{"type": "category_bookings", "category": "fitness", "count": 10}', 150),
  ('Social Butterfly', 'Refer 3 friends', '🦋', 'social', '{"type": "referrals", "count": 3}', 200),
  ('Monthly Streak', 'Book once a month for 3 months', '🔥', 'streak', '{"type": "monthly_streak", "months": 3}', 100),
  ('Early Bird', 'Book 7 days in advance', '🌅', 'behavior', '{"type": "advance_booking", "days": 7}', 50),
  ('Review Star', 'Leave 5 reviews', '⭐', 'engagement', '{"type": "reviews", "count": 5}', 100),
  ('Points Master', 'Accumulate 1000 points', '🏆', 'points', '{"type": "points_earned", "count": 1000}', 200),
  ('Birthday Treat', 'Book on your birthday', '🎂', 'special', '{"type": "birthday_booking"}', 100);

-- Create initial rewards catalog
INSERT INTO rewards_catalog (program_id, name, description, category, points_cost, discount_value, discount_type, max_uses, is_limited) VALUES
  ((SELECT id FROM loyalty_programs WHERE name = 'Mariia Beauty & Fitness Rewards'),
   '5% Off Next Treatment', 'Get 5% off your next beauty or fitness treatment',
   'discount', 100, 5.00, 'percentage', 1000, false),
  ((SELECT id FROM loyalty_programs WHERE name = 'Mariia Beauty & Fitness Rewards'),
   'Free Consultation', 'Complimentary 15-minute consultation',
   'service', 200, 0, 'fixed', 500, false),
  ((SELECT id FROM loyalty_programs WHERE name = 'Mariia Beauty & Fitness Rewards'),
   '10% Off Product Purchase', 'Save 10% on any product purchase',
   'discount', 150, 10.00, 'percentage', 800, false),
  ((SELECT id FROM loyalty_programs WHERE name = 'Mariia Beauty & Fitness Rewards'),
   'Priority Booking Access', 'Book appointments 48 hours before general public',
   'privilege', 300, 0, 'fixed', 200, false),
  ((SELECT id FROM loyalty_programs WHERE name = 'Mariia Beauty & Fitness Rewards'),
   'Free Treatment Upgrade', 'Upgrade your treatment to premium version',
   'upgrade', 500, 0, 'fixed', 100, true);

-- Create indexes for performance
CREATE INDEX idx_customer_loyalty_customer_id ON customer_loyalty(customer_id);
CREATE INDEX idx_customer_loyalty_program_id ON customer_loyalty(program_id);
CREATE INDEX idx_customer_loyalty_tier ON customer_loyalty(tier);
CREATE INDEX idx_point_transactions_customer_id ON point_transactions(customer_id);
CREATE INDEX idx_point_transactions_program_id ON point_transactions(program_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_rewards_catalog_program_id ON rewards_catalog(program_id);
CREATE INDEX idx_rewards_catalog_active ON rewards_catalog(is_active);
CREATE INDEX idx_customer_rewards_customer_id ON customer_rewards(customer_id);
CREATE INDEX idx_customer_rewards_status ON customer_rewards(status);
CREATE INDEX idx_customer_achievements_customer_id ON customer_achievements(customer_id);
CREATE INDEX idx_customer_streaks_customer_id ON customer_streaks(customer_id);
CREATE INDEX idx_loyalty_events_customer_id ON loyalty_events(customer_id);
CREATE INDEX idx_loyalty_events_type ON loyalty_events(event_type);
CREATE INDEX idx_loyalty_events_created_at ON loyalty_events(created_at);

-- Create RLS policies
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_events ENABLE ROW LEVEL SECURITY;

-- Loyalty program functions
CREATE OR REPLACE FUNCTION earn_loyalty_points(
  p_customer_id UUID,
  p_program_id UUID,
  p_points INTEGER,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_current_points INTEGER;
  v_new_tier TEXT;
  v_program_id UUID;
BEGIN
  -- Get or create customer loyalty record
  INSERT INTO customer_loyalty (customer_id, program_id, current_points, total_earned)
  VALUES (p_customer_id, p_program_id, p_points, p_points)
  ON CONFLICT (customer_id, program_id)
  DO UPDATE SET
    current_points = customer_loyalty.current_points + p_points,
    total_earned = customer_loyalty.total_earned + p_points,
    last_activity = now(),
    updated_at = now()
  RETURNING current_points INTO v_current_points;

  -- Create transaction record
  INSERT INTO point_transactions (
    customer_id, program_id, points, transaction_type,
    reference_id, reference_type, description
  )
  VALUES (
    p_customer_id, p_program_id, p_points, 'earned',
    p_reference_id, p_reference_type, p_description
  )
  RETURNING id INTO v_transaction_id;

  -- Check for tier upgrade
  SELECT update_loyalty_tier(p_customer_id, p_program_id) INTO v_new_tier;

  -- Log event
  INSERT INTO loyalty_events (customer_id, event_type, event_data, points_change)
  VALUES (
    p_customer_id, 'points_earned',
    json_build_object('transaction_id', v_transaction_id, 'points', p_points),
    p_points
  );

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_customer_id UUID,
  p_program_id UUID,
  p_points INTEGER,
  p_reward_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_current_points INTEGER;
BEGIN
  -- Check customer has enough points
  SELECT current_points INTO v_current_points
  FROM customer_loyalty
  WHERE customer_id = p_customer_id AND program_id = p_program_id;

  IF v_current_points < p_points THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  -- Update customer loyalty
  UPDATE customer_loyalty
  SET
    current_points = current_points - p_points,
    total_redeemed = total_redeemed + p_points,
    last_activity = now(),
    updated_at = now()
  WHERE customer_id = p_customer_id AND program_id = p_program_id;

  -- Create transaction record
  INSERT INTO point_transactions (
    customer_id, program_id, points, transaction_type,
    reference_id, reference_type, description
  )
  VALUES (
    p_customer_id, p_program_id, -p_points, 'redeemed',
    p_reward_id, 'reward', p_description
  )
  RETURNING id INTO v_transaction_id;

  -- Log event
  INSERT INTO loyalty_events (customer_id, event_type, event_data, points_change)
  VALUES (
    p_customer_id, 'points_redeemed',
    json_build_object('transaction_id', v_transaction_id, 'points', p_points, 'reward_id', p_reward_id),
    -p_points
  );

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_loyalty_tier(
  p_customer_id UUID,
  p_program_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_total_points INTEGER;
  v_current_tier TEXT;
  v_new_tier TEXT := 'bronze';
  v_tier_record loyalty_tiers%ROWTYPE;
BEGIN
  -- Get customer's total earned points
  SELECT total_earned, tier INTO v_total_points, v_current_tier
  FROM customer_loyalty
  WHERE customer_id = p_customer_id AND program_id = p_program_id;

  -- Find highest tier customer qualifies for
  FOR v_tier_record IN
    SELECT * FROM loyalty_tiers
    WHERE program_id = p_program_id AND min_points <= v_total_points
    ORDER BY level DESC
  LOOP
    v_new_tier := v_tier_record.name;
    EXIT;
  END LOOP;

  -- Update if tier changed
  IF v_new_tier != v_current_tier THEN
    UPDATE customer_loyalty
    SET
      tier = v_new_tier,
      tier_expires_at = (current_date + interval '1 year')::timestamp,
      updated_at = now()
    WHERE customer_id = p_customer_id AND program_id = p_program_id;

    -- Log tier upgrade
    INSERT INTO loyalty_events (customer_id, event_type, event_data)
    VALUES (
      p_customer_id, 'tier_upgrade',
      json_build_object('old_tier', v_current_tier, 'new_tier', v_new_tier)
    );
  END IF;

  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_referral_code(p_customer_id UUID) RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_code_exists BOOLEAN;
BEGIN
  LOOP
    v_code := upper(substring(md5(p_customer_id::text || random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = v_code) INTO v_code_exists;

    IF NOT v_code_exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Views for analytics
CREATE VIEW loyalty_summary AS
SELECT
  cl.customer_id,
  cl.program_id,
  cl.current_points,
  cl.tier,
  cl.total_earned,
  cl.total_redeemed,
  cl.last_activity,
  p.first_name,
  p.last_name,
  p.email,
  COUNT(DISTINCT pt.id) as transaction_count,
  COUNT(DISTINCT ca.id) as achievement_count,
  COUNT(DISTINCT r.id) as referral_count,
  COALESCE(SUM(CASE WHEN pt.transaction_type = 'earned' THEN pt.points ELSE 0 END), 0) as total_points_earned,
  COALESCE(SUM(CASE WHEN pt.transaction_type = 'redeemed' THEN pt.points ELSE 0 END), 0) as total_points_redeemed
FROM customer_loyalty cl
LEFT JOIN profiles p ON cl.customer_id = p.id
LEFT JOIN point_transactions pt ON cl.customer_id = pt.customer_id AND cl.program_id = pt.program_id
LEFT JOIN customer_achievements ca ON cl.customer_id = ca.customer_id
LEFT JOIN referrals r ON cl.customer_id = r.referrer_id
GROUP BY cl.customer_id, cl.program_id, cl.current_points, cl.tier, cl.total_earned, cl.total_redeemed, cl.last_activity, p.first_name, p.last_name, p.email;

CREATE VIEW tier_distribution AS
SELECT
  lt.name as tier_name,
  lt.level,
  COUNT(cl.id) as customer_count,
  AVG(cl.total_earned) as avg_points,
  SUM(cl.total_earned) as total_points,
  SUM(cl.total_redeemed) as total_redeemed
FROM loyalty_tiers lt
LEFT JOIN customer_loyalty cl ON lt.name = cl.tier
WHERE lt.program_id = cl.program_id OR cl.program_id IS NULL
GROUP BY lt.name, lt.level
ORDER BY lt.level;

-- Grant necessary permissions
GRANT SELECT, INSERT ON loyalty_programs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON customer_loyalty TO authenticated;
GRANT SELECT, INSERT ON point_transactions TO authenticated;
GRANT SELECT ON loyalty_tiers TO authenticated;
GRANT SELECT ON achievement_badges TO authenticated;
GRANT SELECT, INSERT ON customer_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON referrals TO authenticated;
GRANT SELECT ON rewards_catalog TO authenticated;
GRANT SELECT, INSERT, UPDATE ON customer_rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON customer_streaks TO authenticated;
GRANT SELECT, INSERT ON loyalty_events TO authenticated;
GRANT EXECUTE ON FUNCTION earn_loyalty_points TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_loyalty_points TO authenticated;
GRANT EXECUTE ON FUNCTION update_loyalty_tier TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code TO authenticated;

-- Admin permissions
GRANT ALL ON loyalty_programs TO service_role;
GRANT ALL ON customer_loyalty TO service_role;
GRANT ALL ON point_transactions TO service_role;
GRANT ALL ON loyalty_tiers TO service_role;
GRANT ALL ON achievement_badges TO service_role;
GRANT ALL ON customer_achievements TO service_role;
GRANT ALL ON referrals TO service_role;
GRANT ALL ON rewards_catalog TO service_role;
GRANT ALL ON customer_rewards TO service_role;
GRANT ALL ON customer_streaks TO service_role;
GRANT ALL ON loyalty_events TO service_role;