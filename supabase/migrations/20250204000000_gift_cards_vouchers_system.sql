-- Gift Cards and Vouchers System Migration
-- Migration: 20250204000000_gift_cards_vouchers_system.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Gift cards table
CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_code TEXT UNIQUE NOT NULL,
  initial_balance DECIMAL(10,2) NOT NULL CHECK (initial_balance > 0),
  current_balance DECIMAL(10,2) NOT NULL CHECK (current_balance >= 0),
  currency TEXT DEFAULT 'PLN' NOT NULL CHECK (currency IN ('PLN', 'EUR', 'USD')),
  purchaser_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  purchase_date TIMESTAMP DEFAULT now(),
  expiry_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_digital BOOLEAN DEFAULT true,
  qr_code_url TEXT,
  pdf_url TEXT,
  delivery_scheduled_at TIMESTAMP,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  personalization_data JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Gift card transactions table
CREATE TABLE gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'refund', 'adjustment')),
  reference_id UUID, -- Reference to booking, payment, or other transaction
  reference_type TEXT, -- 'booking', 'payment', 'refund', etc.
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),

  -- Prevent duplicate transactions
  UNIQUE(gift_card_id, reference_id, reference_type)
);

-- Promotional vouchers table
CREATE TABLE promotional_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_service')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
  minimum_amount DECIMAL(10,2), -- Minimum order amount to apply voucher
  maximum_discount DECIMAL(10,2), -- Maximum discount for percentage vouchers
  usage_limit INTEGER DEFAULT 1 CHECK (usage_limit > 0),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  applicable_services UUID[] DEFAULT '{}', -- Array of service IDs this voucher applies to
  applicable_categories TEXT[] DEFAULT '{}', -- Array of categories: 'beauty', 'fitness', 'lifestyle'
  user_usage_limit INTEGER DEFAULT 1, -- Limit per user
  first_time_customers BOOLEAN DEFAULT false,
  auto_generate BOOLEAN DEFAULT false,
  campaign_id TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Voucher redemptions table
CREATE TABLE voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES promotional_vouchers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  redemption_date TIMESTAMP DEFAULT now(),
  ip_address INET,
  metadata JSONB
);

-- Gift card usage analytics
CREATE TABLE gift_card_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID REFERENCES gift_cards(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('purchased', 'viewed', 'redeemed', 'expired', 'refunded')),
  event_data JSONB,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Voucher analytics
CREATE TABLE voucher_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES promotional_vouchers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'viewed', 'applied', 'expired', 'deactivated')),
  event_data JSONB,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_gift_cards_code ON gift_cards(card_code);
CREATE INDEX idx_gift_cards_purchaser ON gift_cards(purchaser_id);
CREATE INDEX idx_gift_cards_recipient ON gift_cards(recipient_email);
CREATE INDEX idx_gift_cards_expiry ON gift_cards(expiry_date);
CREATE INDEX idx_gift_cards_active ON gift_cards(is_active);
CREATE INDEX idx_gift_cards_delivery_status ON gift_cards(delivery_status);

CREATE INDEX idx_gift_card_transactions_gift_card ON gift_card_transactions(gift_card_id);
CREATE INDEX idx_gift_card_transactions_type ON gift_card_transactions(transaction_type);
CREATE INDEX idx_gift_card_transactions_created ON gift_card_transactions(created_at);

CREATE INDEX idx_promotional_vouchers_code ON promotional_vouchers(code);
CREATE INDEX idx_promotional_vouchers_active ON promotional_vouchers(is_active);
CREATE INDEX idx_promotional_vouchers_validity ON promotional_vouchers(valid_from, valid_until);
CREATE INDEX idx_promotional_vouchers_campaign ON promotional_vouchers(campaign_id);

CREATE INDEX idx_voucher_redemptions_voucher ON voucher_redemptions(voucher_id);
CREATE INDEX idx_voucher_redemptions_user ON voucher_redemptions(user_id);
CREATE INDEX idx_voucher_redemptions_date ON voucher_redemptions(redemption_date);

CREATE INDEX idx_gift_card_analytics_gift_card ON gift_card_analytics(gift_card_id);
CREATE INDEX idx_gift_card_analytics_event ON gift_card_analytics(event_type);
CREATE INDEX idx_gift_card_analytics_date ON gift_card_analytics(created_at);

CREATE INDEX idx_voucher_analytics_voucher ON voucher_analytics(voucher_id);
CREATE INDEX idx_voucher_analytics_event ON voucher_analytics(event_type);
CREATE INDEX idx_voucher_analytics_date ON voucher_analytics(created_at);

-- RLS Policies
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_analytics ENABLE ROW LEVEL SECURITY;

-- Gift cards RLS policies
CREATE POLICY "Users can view their own gift cards" ON gift_cards FOR SELECT USING (
  purchaser_id = auth.uid() OR
  recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Admins can view all gift cards" ON gift_cards FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Gift card transactions RLS policies
CREATE POLICY "Users can view transactions for their gift cards" ON gift_card_transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM gift_cards
    WHERE id = gift_card_transactions.gift_card_id
    AND (purchaser_id = auth.uid() OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

CREATE POLICY "Admins can view all gift card transactions" ON gift_card_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Promotional vouchers RLS policies
CREATE POLICY "Everyone can view active vouchers" ON promotional_vouchers FOR SELECT USING (
  is_active = true AND
  (valid_from IS NULL OR valid_from <= now()) AND
  (valid_until IS NULL OR valid_until >= now())
);

CREATE POLICY "Admins can manage vouchers" ON promotional_vouchers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Voucher redemptions RLS policies
CREATE POLICY "Users can view their voucher redemptions" ON voucher_redemptions FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "Admins can view all voucher redemptions" ON voucher_redemptions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Analytics RLS policies
CREATE POLICY "Admins can view all analytics" ON gift_card_analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view all voucher analytics" ON voucher_analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Functions and Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON gift_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotional_vouchers_updated_at BEFORE UPDATE ON promotional_vouchers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate secure gift card codes
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'MH';
  random_part TEXT;
  check_digit INTEGER;
  full_code TEXT;
BEGIN
  -- Generate 12 random characters
  random_part := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 12));

  -- Simple checksum
  check_digit := ((
    ascii(substring(random_part, 1, 1)) +
    ascii(substring(random_part, 3, 1)) +
    ascii(substring(random_part, 5, 1)) +
    ascii(substring(random_part, 7, 1)) +
    ascii(substring(random_part, 9, 1)) +
    ascii(substring(random_part, 11, 1))
  ) % 10);

  full_code := prefix || '-' || random_part || '-' || check_digit;

  -- Ensure uniqueness
  IF EXISTS (SELECT 1 FROM gift_cards WHERE card_code = full_code) THEN
    RETURN generate_gift_card_code();
  END IF;

  RETURN full_code;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem gift card
CREATE OR REPLACE FUNCTION redeem_gift_card(
  p_gift_card_code TEXT,
  p_amount DECIMAL(10,2),
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_gift_card RECORD;
  v_new_balance DECIMAL(10,2);
  v_transaction_id UUID;
BEGIN
  -- Find and validate gift card
  SELECT * INTO v_gift_card FROM gift_cards
  WHERE card_code = p_gift_card_code
  AND is_active = true
  AND (expiry_date IS NULL OR expiry_date > now())
  AND current_balance >= p_amount
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired gift card');
  END IF;

  -- Check sufficient balance
  IF v_gift_card.current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Calculate new balance
  v_new_balance := v_gift_card.current_balance - p_amount;

  -- Update gift card balance
  UPDATE gift_cards
  SET current_balance = v_new_balance
  WHERE id = v_gift_card.id;

  -- Create transaction record
  INSERT INTO gift_card_transactions (
    gift_card_id, amount, transaction_type, reference_id, reference_type, description
  ) VALUES (
    v_gift_card.id, p_amount, 'redemption', p_reference_id, p_reference_type, p_description
  ) RETURNING id INTO v_transaction_id;

  -- Log analytics
  INSERT INTO gift_card_analytics (gift_card_id, event_type, event_data)
  VALUES (v_gift_card.id, 'redeemed', json_build_object(
    'amount', p_amount,
    'remaining_balance', v_new_balance,
    'transaction_id', v_transaction_id
  ));

  RETURN json_build_object(
    'success', true,
    'gift_card_id', v_gift_card.id,
    'transaction_id', v_transaction_id,
    'original_balance', v_gift_card.current_balance,
    'redeemed_amount', p_amount,
    'remaining_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;

-- Function to apply voucher
CREATE OR REPLACE FUNCTION apply_voucher(
  p_code TEXT,
  p_user_id UUID DEFAULT NULL,
  p_order_amount DECIMAL(10,2),
  p_service_ids UUID[] DEFAULT '{}',
  p_service_categories TEXT[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_voucher RECORD;
  v_discount_amount DECIMAL(10,2) := 0;
  v_final_amount DECIMAL(10,2);
  v_user_redemptions INTEGER := 0;
  v_is_applicable BOOLEAN := false;
BEGIN
  -- Find and validate voucher
  SELECT * INTO v_voucher FROM promotional_vouchers
  WHERE code = UPPER(p_code)
  AND is_active = true
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_until IS NULL OR valid_until >= now())
  AND (usage_limit > usage_count)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired voucher code');
  END IF;

  -- Check minimum amount requirement
  IF v_voucher.minimum_amount IS NOT NULL AND p_order_amount < v_voucher.minimum_amount THEN
    RETURN json_build_object('success', false, 'error', 'Minimum order amount not met');
  END IF;

  -- Check if first-time customer restriction applies
  IF v_voucher.first_time_customers AND p_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM bookings WHERE user_id = p_user_id LIMIT 1) THEN
      RETURN json_build_object('success', false, 'error', 'Voucher only valid for first-time customers');
    END IF;
  END IF;

  -- Check user-specific usage limit
  IF v_voucher.user_usage_limit > 0 AND p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_redemptions
    FROM voucher_redemptions
    WHERE voucher_id = v_voucher.id AND user_id = p_user_id;

    IF v_user_redemptions >= v_voucher.user_usage_limit THEN
      RETURN json_build_object('success', false, 'error', 'Voucher usage limit exceeded');
    END IF;
  END IF;

  -- Check service applicability
  IF (v_voucher.applicable_services IS NOT NULL AND array_length(v_voucher.applicable_services, 1) > 0) OR
     (v_voucher.applicable_categories IS NOT NULL AND array_length(v_voucher.applicable_categories, 1) > 0) THEN

    v_is_applicable := (
      -- Check if any service IDs match
      (SELECT COUNT(*) FROM unnest(v_voucher.applicable_services) s WHERE s = ANY(p_service_ids)) > 0
      OR
      -- Check if any categories match
      (SELECT COUNT(*) FROM unnest(v_voucher.applicable_categories) c WHERE c = ANY(p_service_categories)) > 0
    );

    IF NOT v_is_applicable THEN
      RETURN json_build_object('success', false, 'error', 'Voucher not applicable to selected services');
    END IF;
  END IF;

  -- Calculate discount
  CASE v_voucher.discount_type
    WHEN 'percentage' THEN
      v_discount_amount := p_order_amount * (v_voucher.discount_value / 100);
      IF v_voucher.maximum_discount IS NOT NULL THEN
        v_discount_amount := LEAST(v_discount_amount, v_voucher.maximum_discount);
      END IF;
    WHEN 'fixed_amount' THEN
      v_discount_amount := LEAST(v_voucher.discount_value, p_order_amount);
    WHEN 'free_service' THEN
      v_discount_amount := p_order_amount;
  END CASE;

  v_final_amount := p_order_amount - v_discount_amount;

  -- Ensure final amount is not negative
  v_final_amount := GREATEST(v_final_amount, 0);

  RETURN json_build_object(
    'success', true,
    'voucher_id', v_voucher.id,
    'discount_amount', v_discount_amount,
    'original_amount', p_order_amount,
    'final_amount', v_final_amount,
    'discount_type', v_voucher.discount_type,
    'discount_value', v_voucher.discount_value
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check gift card balance
CREATE OR REPLACE FUNCTION check_gift_card_balance(p_card_code TEXT)
RETURNS JSON AS $$
DECLARE
  v_gift_card RECORD;
BEGIN
  SELECT
    gc.*,
    COALESCE(SUM(
      CASE WHEN gct.transaction_type = 'redemption' THEN gct.amount ELSE 0 END
    ), 0) as redeemed_amount
  INTO v_gift_card
  FROM gift_cards gc
  LEFT JOIN gift_card_transactions gct ON gc.id = gct.gift_card_id
  WHERE gc.card_code = p_card_code
  AND gc.is_active = true
  GROUP BY gc.id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Gift card not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'card_code', v_gift_card.card_code,
    'current_balance', v_gift_card.current_balance,
    'initial_balance', v_gift_card.initial_balance,
    'currency', v_gift_card.currency,
    'expiry_date', v_gift_card.expiry_date,
    'recipient_name', v_gift_card.recipient_name,
    'is_active', v_gift_card.is_active
  );
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE gift_cards IS 'Digital and physical gift cards for Mariia Hub';
COMMENT ON TABLE gift_card_transactions IS 'Transaction history for gift cards';
COMMENT ON TABLE promotional_vouchers IS 'Promotional discount vouchers and codes';
COMMENT ON TABLE voucher_redemptions IS 'History of voucher applications';
COMMENT ON TABLE gift_card_analytics IS 'Analytics tracking for gift card usage';
COMMENT ON TABLE voucher_analytics IS 'Analytics tracking for voucher performance';